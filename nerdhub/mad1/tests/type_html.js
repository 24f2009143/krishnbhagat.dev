#!/usr/bin/env node
/* Type into a page like a user (Chrome DevTools Input.insertText, one character at a time) and report a JS expression
 * after every character. Used for HTML5 validation claims, since minlength only applies to text a user typed.
 * Usage: node tests/type_html.js page.html "#selector" "text" "JS expression"   -> prints a JSON array */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process");
const CHROME = process.env.CHROME || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
const [file, sel, text, expr] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mad1-type-"));
  const p = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + dir, "--no-first-run", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const wsUrl = await new Promise((res, rej) => { let b = ""; p.stderr.on("data", d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); }); setTimeout(() => rej(new Error("no chrome")), 20000); });
  const ws = new WebSocket(wsUrl); let id = 0; const wait = {};
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } };
  const send = (method, params, sessionId) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); });
  const t = (await send("Target.createTarget", { url: "file://" + path.resolve(file) })).result.targetId;
  const S = (await send("Target.attachToTarget", { targetId: t, flatten: true })).result.sessionId;
  await sleep(800);
  const ev = async x => (await send("Runtime.evaluate", { expression: x, returnByValue: true }, S)).result.result.value;
  await ev(`document.querySelector(${JSON.stringify(sel)}).focus()`);
  const out = [await ev(expr)];
  for (const ch of text) { await send("Input.insertText", { text: ch }, S); await sleep(30); out.push(await ev(expr)); }
  console.log(JSON.stringify(out));
  ws.close(); p.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
