#!/usr/bin/env node
/* Gates 7 and 8: open every route under every ready exam, build every lesson section (patches included, "Go deeper" opened),
 * answer every PYQ with its stored key, check altKey review colouring, keyboard, export/import, reload; fail on any console,
 * page or KaTeX error, any 404, any raw markdown table row or code fence, sideways scroll at 360 px; repeat in dark mode;
 * the whole run is OFFLINE: every request to a host other than the local server is blocked and reported.
 * Needs Google Chrome (or CHROME=/path). No npm packages: Node's built-in WebSocket speaks the DevTools protocol.
 * Usage: node tests/browser_test.js [--fixture] [--quick] */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), { spawn } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const FIXTURE = process.argv.includes("--fixture"), QUICK = process.argv.includes("--quick");
const CHROME = process.env.CHROME || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(p => fs.existsSync(p));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".json": "application/json", ".png": "image/png" };
const problems = [], notFound = [];
/* Firebase sync is the only allowed network user: its requests are still blocked here, and the site must keep working. */
const SYNC_HOSTS = /^https:\/\/(www\.gstatic\.com\/firebasejs\/|[\w-]+\.googleapis\.com\/|[\w-]+\.firebaseapp\.com\/)/;
function fail(where, msg) { problems.push(where + ": " + msg); }

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      let f = path.join(ROOT, u === "/" ? "index.html" : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { notFound.push(u); rsp.writeHead(404); return rsp.end("not found"); }
      rsp.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}
function launch() {
  return new Promise((res, rej) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mad1-chrome-"));
    const p = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + dir, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--window-size=1280,900", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
    let buf = "";
    p.stderr.on("data", d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res({ proc: p, ws: m[1], dir }); });
    p.on("exit", c => rej(new Error("chrome exited " + c + "\n" + buf)));
    setTimeout(() => rej(new Error("chrome did not start\n" + buf)), 20000);
  });
}
class CDP {
  constructor(url) { this.id = 0; this.wait = {}; this.handlers = []; this.ws = new WebSocket(url); }
  open() { return new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; this.ws.onmessage = e => this.msg(JSON.parse(e.data)); }); }
  msg(m) { if (m.id && this.wait[m.id]) { const w = this.wait[m.id]; delete this.wait[m.id]; m.error ? w.j(new Error(m.error.message)) : w.r(m.result); } else this.handlers.forEach(h => h(m)); }
  send(method, params, sessionId) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params: params || {}, sessionId })); return new Promise((r, j) => { this.wait[id] = { r, j }; }); }
  on(h) { this.handlers.push(h); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  if (!CHROME) { console.error("No Chrome found; set CHROME=/path/to/chrome"); process.exit(2); }
  const srv = await serve(), port = srv.address().port, ORIGIN = "http://127.0.0.1:" + port;
  const ch = await launch(), cdp = new CDP(ch.ws); await cdp.open();
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId: S } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (m, p) => cdp.send(m, p, S);
  let where = "start"; const external = [];
  cdp.on(m => {
    if (m.sessionId !== S) return;
    const p = m.params || {};
    if (m.method === "Fetch.requestPaused") {
      const u = p.request.url;
      if (u.startsWith(ORIGIN) || u.startsWith("data:") || u.startsWith("blob:")) send("Fetch.continueRequest", { requestId: p.requestId }).catch(() => {});
      else { external.push(u); if (!SYNC_HOSTS.test(u)) fail(where, "blocked external request (offline gate) " + u); send("Fetch.failRequest", { requestId: p.requestId, errorReason: "InternetDisconnected" }).catch(() => {}); }
    }
    if (m.method === "Runtime.exceptionThrown") fail(where, "page error " + (p.exceptionDetails.exception && p.exceptionDetails.exception.description || p.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && (p.type === "error" || p.type === "assert")) fail(where, "console." + p.type + " " + p.args.map(a => a.value || a.description).join(" "));
    if (m.method === "Log.entryAdded" && p.entry.level === "error" && !(SYNC_HOSTS.test(p.entry.url || "") && /ERR_INTERNET_DISCONNECTED/.test(p.entry.text))) fail(where, "log error " + p.entry.text + " " + (p.entry.url || ""));
    if (m.method === "Network.responseReceived" && p.response.status >= 400) fail(where, p.response.status + " " + p.response.url);
  });
  await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await Promise.all(["Page.enable", "Runtime.enable", "Network.enable", "Log.enable"].map(m => send(m)));
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  async function ev(expr) {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("eval failed: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) + "\n  in: " + expr.slice(0, 200));
    return r.result.value;
  }
  async function load(qs) {
    where = "load " + qs;
    await send("Page.navigate", { url: ORIGIN + "/index.html" + qs });
    for (let i = 0; i < 100; i++) { await sleep(100); try { if (await ev("document.documentElement.dataset.ready==='1'")) return; } catch (e) {} }
    throw new Error("site did not boot: " + qs);
  }
  /* page-side checks after each route */
  const CHECK = `(function(){var m=document.getElementById("main"),out=[];var t=m.innerText||"";
    t.split("\\n").forEach(function(l){if(/^\\s*\\|.*\\|\\s*$/.test(l))out.push("raw table row: "+l.slice(0,80));if(l.indexOf("\`\`\`")>=0)out.push("raw code fence: "+l.slice(0,80))});
    if(m.querySelector(".katex-error"))out.push("KaTeX error: "+m.querySelector(".katex-error").textContent.slice(0,80));
    if(/Something went wrong/.test(t))out.push("route crashed: "+t.slice(0,300));
    if(m.querySelector(".bad-block"))out.push("unknown block type");
    if(window.__xss)out.push("XSS executed: "+window.__xss);
    if(document.querySelector('#main img[src="x"]'))out.push("unsanitised <img> in page");
    if(APP.errors.length)out.push("loader: "+APP.errors.join("; "));
    var w=document.documentElement.scrollWidth,v=window.innerWidth;if(w>v+1){var bad=[].slice.call(document.querySelectorAll("body *")).filter(function(e){return e.getBoundingClientRect().right>v+1}).pop();out.push("sideways scroll: page "+w+"px > viewport "+v+"px"+(bad?" (widest: "+bad.tagName.toLowerCase()+"."+String(bad.className&&bad.className.baseVal!=null?bad.className.baseVal:bad.className).split(" ").join(".")+")":"")+" over: "+[].slice.call(document.querySelectorAll("body *")).filter(function(e){var cs=getComputedStyle(e);return e.scrollWidth>e.clientWidth+1&&cs.overflowX==="visible"&&e.clientWidth>0}).slice(-3).map(function(e){return e.parentNode.className+">"+e.parentNode.parentNode.className+">"+e.tagName+" "+e.innerText.slice(0,40)+" "+e.scrollWidth+">"+e.clientWidth}).join(" | "))}
    return out})()`;
  async function visit(hash) {
    where = hash;
    await ev(`location.hash=${JSON.stringify(hash)}`); await sleep(60);
    await ev(`(function(){document.querySelectorAll("#main details").forEach(function(d){d.open=true});})()`); await sleep(60);
    (await ev(CHECK)).forEach(x => fail(hash, x));
  }
  async function routes() {
    return ev(`(function(){var A=APP,r=["#home","#practice","#mock","#mistakes","#cards","#glossary","#plan","#things","#traps","#coverage","#examday","#cheat","#search","#search/flask","#settings"];
      A.manifest.weeks.forEach(function(w){r.push("#week/"+w.num)});
      A.refreshers.forEach(function(x){r.push("#refresher/"+x.id)});
      A.manifest.topics.forEach(function(m){r.push("#topic/"+m.id);if(!A.isReady(m))return;var t=A.topics[m.id];
        ["pyqs","test","revise"].forEach(function(v){r.push("#topic/"+m.id+"/"+v)});
        (m.subs||[]).forEach(function(s){r.push("#topic/"+m.id+"/sub/"+s.id)});
        t.sections.forEach(function(s){r.push("#topic/"+m.id+"/lesson/"+s.id)})});
      return r})()`);
  }
  async function readyExams() { return ev(`Object.keys(APP.manifest.exams).filter(function(k){return /ready|in-progress/.test(APP.manifest.exams[k].status)}).concat(["all"])`); }

  const qs = FIXTURE ? "?fixture=1" : "";
  await load(qs);
  await ev(`(APP.resetState(),APP.setTheme(false),location.hash="#home",true)`);
  const exams = await readyExams();
  let nRoutes = 0, nPyq = 0;
  for (const ex of exams) {
    await visit("#exam/" + ex);
    const rs = await routes();
    for (const r of (QUICK ? rs.slice(0, 20) : rs)) { await visit(r); nRoutes++; }
  }
  /* every PYQ answered with its stored key, marked correct, review highlights the primary key only */
  await visit("#exam/all");
  const uids = await ev(`(function(){var o=[];Object.keys(APP.packs).forEach(function(e){Object.keys(APP.packs[e]).forEach(function(t){APP.packs[e][t].pyqs.forEach(function(q){o.push(q.uid)})})});return o})()`);
  for (const u of uids) {
    await visit("#pyq/" + u);
    const r = await ev(`(function(){var A=APP,q=A.findPyq(${JSON.stringify(u)}),c=document.querySelector("#main .qcard");if(!c)return "no card";
      var t=A.qType(q);
      if(t==="NUM"||t==="SA"){var i=c.querySelector(".numin input");i.value=String([].concat(q.key)[0])}
      else{var K=A.keyIdx(q);if(!K||!K.length)return "no usable key";c.querySelectorAll(".opt").forEach(function(o){if(K.indexOf(+o.dataset.oi)>=0)o.click()})}
      var sub=[].slice.call(c.querySelectorAll(".qa button")).find(function(b){return b.textContent==="Submit"});sub.click();if(!c.isDone())sub.click();
      if(!c.classList.contains("ok"))return "not marked correct (key "+A.keyText(q)+")";
      if(t!=="NUM"&&t!=="SA"){var K2=A.keyIdx(q),green=[].slice.call(c.querySelectorAll(".opt.right")).map(function(o){return +o.dataset.oi}).sort();if(green.join()!==K2.join())return "review colours "+green+" but key is "+K2}
      var rec=A.load().ans[q.uid];if(!rec||!rec.ok)return "answer not stored under uid";
      return "ok"})()`);
    if (r !== "ok") fail("#pyq/" + u, r); else nPyq++;
    (await ev(CHECK)).forEach(x => fail("#pyq/" + u + " after submit", x));
  }
  /* altKey: primary-only highlighting; alt accepted only when chosen */
  if (FIXTURE) {
    where = "altKey";
    const r = await ev(`(function(){var A=APP,q=A.qIndex["x:fixture:fx-t3"];if(!q)return "fixture altKey question missing";var m=document.getElementById("main");m.innerHTML="";
      var c1=A.qcard(q);m.appendChild(c1);c1.querySelector('.opt[data-oi="1"]').click();c1.grade();
      if(!c1.classList.contains("ok"))return "altKey answer not accepted";
      var g1=[].slice.call(c1.querySelectorAll(".opt.right")).map(function(o){return o.dataset.oi+(o.classList.contains("alsoacc")?"*":"")}).sort().join();
      if(g1!=="0,1*")return "alt chosen: expected key green and alt green with 'also accepted', got "+g1;
      var c2=A.qcard(q);m.appendChild(c2);c2.querySelector('.opt[data-oi="0"]').click();c2.grade();
      var g2=[].slice.call(c2.querySelectorAll(".opt.right")).map(function(o){return o.dataset.oi}).join();
      if(g2!=="0")return "key chosen: only the key may be green, got "+g2;
      var c3=A.qcard(q);m.appendChild(c3);c3.querySelector('.opt[data-oi="3"]').click();c3.grade();
      var g3=[].slice.call(c3.querySelectorAll(".opt.right")).map(function(o){return o.dataset.oi}).join();
      if(g3!=="0"||c3.classList.contains("ok"))return "wrong chosen: expected only the key green, got "+g3;
      return "ok"})()`);
    if (r !== "ok") fail("altKey", r);
    /* keyboard: B then Enter answers a single-choice PYQ */
    where = "keyboard";
    await visit("#pyq/q2:640653771140");
    await ev(`document.querySelector("#main .qcard .stem").click(),true`);
    for (const [key, code] of [["a", "KeyA"], ["Enter", "Enter"]]) {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: key === "Enter" ? "\r" : key, windowsVirtualKeyCode: key === "Enter" ? 13 : 65 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: key === "Enter" ? 13 : 65 });
      await sleep(80);
    }
    const kb = await ev(`(function(){var c=document.querySelector("#main .qcard");return c.isDone()&&c.classList.contains("ok")?"ok":"keyboard A + Enter did not submit a correct answer"})()`);
    if (kb !== "ok") fail("keyboard", kb);
  }
  /* export / import round trip, then progress survives a reload */
  where = "store";
  const rt = await ev(`(function(){var A=APP,before=JSON.stringify(A.load()),s=A.exportState();A.resetState();if(Object.keys(A.load().ans).length)return "reset did not clear";A.importState(s);var after=JSON.stringify(A.load());
    var b=JSON.parse(before),a=JSON.parse(after);delete b.savedAt;delete a.savedAt;return JSON.stringify(a)===JSON.stringify(b)?"ok":"round trip changed the state"})()`);
  if (rt !== "ok") fail("export/import", rt);
  await ev(`(function(){var S=APP.load();S.read["probe:reload"]=1;APP.save();return true})()`);
  const nAns = await ev(`Object.keys(APP.load().ans).length`);
  await load(qs);
  const nAns2 = await ev(`Object.keys(APP.load().ans).length`), kept = await ev(`!!APP.load().read["probe:reload"]`);
  if (nAns2 !== nAns || !kept) fail("reload", "progress lost on reload (answers " + nAns + " -> " + nAns2 + ", marker kept " + kept + ")");
  /* 360 px phone width and dark mode, every route again */
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 760, deviceScaleFactor: 2, mobile: true });
  await load(qs);
  await ev(`(APP.setTheme(true),true)`);
  for (const ex of exams) { await visit("#exam/" + ex); const rs = await routes(); for (const r of (QUICK ? rs.slice(0, 20) : rs)) { await visit(r); nRoutes++; } }
  const dark = await ev(`document.documentElement.getAttribute("data-theme")`);
  if (dark !== "dark") fail("dark mode", "theme is " + dark);
  /* bundled fonts actually loaded (KaTeX included) */
  const fonts = await ev(`document.fonts.ready.then(function(){var o=[];document.fonts.forEach(function(f){if(f.status==="error")o.push(f.family)});return o})`);
  fonts.forEach(f => fail("fonts", "font failed to load: " + f));
  await ev(`(APP.setTheme(false),APP.resetState(),true)`);
  notFound.forEach(u => fail("server", "404 " + u));
  ch.proc.kill(); srv.close();
  const uniq = [...new Set(problems)];
  console.log("browser_test" + (FIXTURE ? " (fixture)" : "") + ": " + nRoutes + " route visits, " + nPyq + "/" + uids.length + " PYQs scored correct, " + external.length + " external requests blocked");
  if (uniq.length) { console.log(uniq.length + " problem(s):"); uniq.slice(0, 80).forEach(p => console.log("  - " + p)); process.exit(1); }
  console.log("PASS"); process.exit(0);
})().catch(e => { console.error(e); process.exit(2); });
