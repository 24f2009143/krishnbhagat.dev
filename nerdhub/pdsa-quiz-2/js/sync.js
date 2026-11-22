/* Optional cloud sync for the PDSA site: Google sign-in (IITM student accounts only) and one Firestore
 * document per student at pdsa/{uid}. Does nothing unless js/firebase-config.js has enabled: true.
 * Access control lives in firestore.rules; the client checks below are only for a friendly message.
 */
(function () {
  "use strict";
  var cfg = window.PDSA_FIREBASE || {};
  if (!cfg.enabled) return;
  var COLL = "pdsa";
  var fb = {}, user = null, timer = null, busy = false, applying = false, lastOk = null, chip = null;

  function domainOk(email) {
    var d = cfg.allowedDomains;
    email = (email || "").toLowerCase();
    return !d || !d.length || d.some(function (x) { return email.slice(-(x.length + 1)) === "@" + x.toLowerCase(); });
  }
  function toast(m) { if (window.PDSA && PDSA.toast) PDSA.toast(m); }

  function pick(a, b) { // a = local record, b = remote record: keep the one with more attempts, then the newer
    if (!a) return b; if (!b) return a;
    var an = a.n || 0, bn = b.n || 0;
    if (an !== bn) return an > bn ? a : b;
    return (b.t || 0) > (a.t || 0) ? b : a;
  }
  function merge(a, b) { // never loses progress from either side
    var o = {}, k;
    for (k in b) o[k] = b[k];
    for (k in a) o[k] = a[k];
    o.prefs = Object.assign({}, b.prefs || {}, a.prefs || {});
    ["read", "solved"].forEach(function (f) { o[f] = Object.assign({}, b[f] || {}, a[f] || {}); });
    o.ans = {}; var A = a.ans || {}, B = b.ans || {};
    Object.keys(A).concat(Object.keys(B)).forEach(function (id) { o.ans[id] = pick(A[id], B[id]); });
    o.flash = {}; var FA = a.flash || {}, FB = b.flash || {};
    Object.keys(FA).concat(Object.keys(FB)).forEach(function (id) {
      var x = FA[id], y = FB[id]; o.flash[id] = !x ? y : !y ? x : ((y.box || 0) > (x.box || 0) ? y : x);
    });
    o.steps = {}; var SA = a.steps || {}, SB = b.steps || {};
    Object.keys(SA).concat(Object.keys(SB)).forEach(function (id) { o.steps[id] = Object.assign({}, SB[id] || {}, SA[id] || {}); });
    return o;
  }

  function paint(msg) {
    if (!chip) return;
    if (!user) { chip.textContent = "☁ Sign in to sync"; chip.title = "Sign in with your IITM student Google account to sync progress across devices"; return; }
    var t = lastOk ? new Date(lastOk).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    chip.textContent = "☁ " + user.email.split("@")[0] + (msg ? " · " + msg : t ? " · synced " + t : "");
    chip.title = "Signed in as " + user.email + ". Click to sign out.";
  }

  function replaceLocal(state) {
    applying = true;
    try {
      var S = PDSA.load(); Object.keys(S).forEach(function (k) { delete S[k]; }); Object.assign(S, state);
      ["ans", "read", "flash", "steps", "solved", "prefs"].forEach(function (k) { S[k] = S[k] || {}; });
      PDSA.save();
    } finally { applying = false; }
  }
  async function push() {
    if (!user) return;
    await setDoc(user.uid, { state: JSON.stringify(PDSA.load()), updatedAt: Date.now(), email: user.email });
    lastOk = Date.now(); paint();
  }
  async function pull() {
    if (!user || busy) return; busy = true; paint("syncing");
    try {
      var remote = await getDoc(user.uid);
      if (!remote) { await push(); return; }
      var merged = merge(PDSA.load(), JSON.parse(remote.state));
      var same = JSON.stringify(merged) === remote.state;
      replaceLocal(merged);
      if (!same) await push(); else lastOk = Date.now();
      paint();
      if (window.PDSA && PDSA.route) PDSA.route();
    } catch (e) { paint("sync failed"); toast("Sync failed. Your progress is safe on this device."); }
    finally { busy = false; }
  }
  function schedulePush() { if (!user || applying) return; clearTimeout(timer); timer = setTimeout(function () { push().catch(function () { paint("sync failed"); }); }, 3000); }

  async function getDoc(uid) { var s = await fb.fs.getDoc(fb.fs.doc(fb.db, COLL, uid)); return s.exists() ? s.data() : null; }
  async function setDoc(uid, data) { await fb.fs.setDoc(fb.fs.doc(fb.db, COLL, uid), data); }
  async function wipe() { // used by "Reset all progress": also clears the cloud copy so it does not come back
    if (!user) return;
    try { await fb.fs.deleteDoc(fb.fs.doc(fb.db, COLL, user.uid)); } catch (e) {}
  }
  window.PDSA_SYNC = { wipe: wipe };

  async function init() {
    var base = "https://www.gstatic.com/firebasejs/10.14.1/";
    var mods = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    var app = mods[0].initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
    fb.au = mods[1]; fb.fs = mods[2]; fb.auth = fb.au.getAuth(app); fb.db = fb.fs.getFirestore(app);
  }
  async function signIn() {
    if (!window.confirm("Sign in with your IITM student Google account to sync your progress.\n\nYour study progress and quiz answers are stored in a database run by the site owner (Krishn Bhagat) and are visible to him. Nothing else is collected. Continue?")) return;
    var p = new fb.au.GoogleAuthProvider();
    if (cfg.allowedDomains && cfg.allowedDomains.length === 1) p.setCustomParameters({ hd: cfg.allowedDomains[0] }); // hint only; rules enforce it
    try { await fb.au.signInWithPopup(fb.auth, p); } catch (e) { toast("Sign-in was cancelled or failed."); }
  }

  function mount() {
    chip = document.createElement("button");
    chip.type = "button"; chip.id = "sync-chip";
    chip.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:50;padding:8px 14px;border-radius:999px;border:1px solid var(--line,#999);background:var(--card,#fff);color:var(--ink,#111);font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18)";
    chip.onclick = function () {
      if (!user) return signIn();
      if (window.confirm("Sign out? Your progress stays on this device and in your cloud copy.")) fb.au.signOut(fb.auth);
    };
    document.body.appendChild(chip); paint();
  }

  window.addEventListener("load", function () {
    setTimeout(function () {
      init().then(function () {
        mount();
        var origSave = PDSA.save;
        PDSA.save = function () { origSave.apply(this, arguments); schedulePush(); };
        document.addEventListener("visibilitychange", function () { if (!document.hidden && user) pull(); });
        fb.au.onAuthStateChanged(fb.auth, function (u) {
          if (u && !(u.emailVerified && domainOk(u.email))) { toast("Only " + (cfg.allowedDomains || []).join(", ") + " accounts can sync."); fb.au.signOut(fb.auth); return; }
          user = u ? { uid: u.uid, email: u.email } : null; paint(); if (user) pull();
        });
      }).catch(function () {});
    }, 0);
  });
})();
