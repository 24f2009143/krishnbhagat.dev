/* Optional cloud sync: Google sign-in (allowed domains only) and one Firestore document per student at <collection>/{uid}.
 * Does nothing unless js/firebase-config.js has enabled: true. It is the only part of the site that uses the network,
 * and it fails silently when offline (the site keeps working on this device's copy). Merging is in merge.js. */
(function () {
  "use strict";
  var cfg = window.APP_FIREBASE || {};
  if (!cfg.enabled) return;
  var A = window.APP, COLL = cfg.collection || "mad1";
  var wallMsg = null, fb = {}, user = null, timer = null, busy = false, applying = false, lastOk = null, chip = null;
  function domainOk(email) {
    var d = cfg.allowedDomains; email = (email || "").toLowerCase();
    return !d || !d.length || d.some(function (x) { return email.slice(-(x.length + 1)) === "@" + x.toLowerCase(); });
  }
  function wallShow() { if (cfg.required && window.NH_WALL) NH_WALL.show(wallMsg || "Sign in with your Google account to use this site.", "Sign in with Google", signIn); }
  function paint(msg) {
    if (!chip) return;
    if (!user) { chip.textContent = "Sign in to sync"; chip.title = "Sign in to sync progress across devices"; return; }
    var t = lastOk ? new Date(lastOk).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    chip.textContent = user.email.split("@")[0] + (msg ? " · " + msg : t ? " · synced " + t : "");
    chip.title = "Signed in as " + user.email + ". Click to sign out.";
  }
  async function push() { if (!user) return; await fb.fs.setDoc(fb.fs.doc(fb.db, COLL, user.uid), { state: JSON.stringify(A.load()), updatedAt: Date.now(), email: user.email }); lastOk = Date.now(); paint(); }
  async function pull() {
    if (!user || busy || !navigator.onLine) return; busy = true; paint("syncing");
    try {
      var s = await fb.fs.getDoc(fb.fs.doc(fb.db, COLL, user.uid));
      if (!s.exists()) { await push(); return; }
      var remote = s.data(), merged = A.mergeState(A.load(), JSON.parse(remote.state));
      applying = true; try { A.replaceState(merged); } finally { applying = false; }
      if (JSON.stringify(merged) !== remote.state) await push(); else lastOk = Date.now();
      paint(); A.route();
    } catch (e) { paint("offline"); }
    finally { busy = false; }
  }
  function schedulePush() { if (!user || applying) return; clearTimeout(timer); timer = setTimeout(function () { push().catch(function () { paint("offline"); }); }, 3000); }
  window.APP_SYNC = { wipe: async function () { if (!user) return; try { await fb.fs.deleteDoc(fb.fs.doc(fb.db, COLL, user.uid)); } catch (e) {} } };
  async function init() {
    var base = "https://www.gstatic.com/firebasejs/10.14.1/";
    var mods = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    var app = mods[0].initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
    fb.au = mods[1]; fb.fs = mods[2]; fb.auth = fb.au.getAuth(app); fb.db = fb.fs.getFirestore(app);
  }
  async function signIn() {
    if (!window.confirm("Sign in with your Google account to sync your progress.\n\nYour study progress and answers are stored in a database run by the site owner and are visible to him. Nothing else is collected. Continue?")) return;
    var p = new fb.au.GoogleAuthProvider();
    if (cfg.allowedDomains && cfg.allowedDomains.length === 1) p.setCustomParameters({ hd: cfg.allowedDomains[0] });
    try { await fb.au.signInWithPopup(fb.auth, p); } catch (e) { A.toast("Sign-in was cancelled or failed."); }
  }
  function mount() {
    chip = document.createElement("button"); chip.type = "button"; chip.id = "sync-chip"; chip.className = "sync-chip";
    var rail = document.querySelector("#app-top .rail-in");
    chip.onclick = function () { if (!user) return signIn(); if (window.confirm("Sign out? Your progress stays on this device and in your cloud copy.")) fb.au.signOut(fb.auth); };
    if (rail) { chip.classList.add("in-rail"); rail.appendChild(chip); } else document.body.appendChild(chip);
    paint();
  }
  window.addEventListener("load", function () {
    if (!navigator.onLine) { if (window.NH_WALL) NH_WALL.hide(); return; }   /* offline: no sync, no wall */
    init().then(function () {
      mount();
      var orig = A.save; A.save = function () { orig.apply(this, arguments); schedulePush(); };
      document.addEventListener("visibilitychange", function () { if (!document.hidden && user) pull(); });
      fb.au.onAuthStateChanged(fb.auth, function (u) {
        if (u && !(u.emailVerified && domainOk(u.email))) { wallMsg = "That account is not allowed. Use your " + (cfg.allowedDomains || []).join(", ") + " Google account."; fb.au.signOut(fb.auth); return; }
        user = u ? { uid: u.uid, email: u.email } : null; paint();
        if (user) { wallMsg = null; if (window.NH_WALL) NH_WALL.hide(); pull(); } else wallShow();
      });
    }).catch(function () { if (window.NH_WALL) NH_WALL.hide(); });   /* network failure: silent, site stays usable */
  });
})();
