/* Optional cloud sync: Google sign-in + one Firestore document per student.
 * Does nothing unless js/firebase-config.js has enabled: true. The merge rules are in js/merge.js.
 * The backend sits behind a small adapter (init, onAuth, signIn, signOut, load, save) so the logic
 * can be tested without a network: eval/sync.test.js injects window.MLTQ_SYNC_ADAPTER.
 */
(function () {
  'use strict';
  const cfg = window.MLTQ_FIREBASE || {};
  if (!cfg.enabled && !window.MLTQ_SYNC_ADAPTER) return;

  function firebaseAdapter() {
    const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
    let auth, db, fs, au;
    return {
      async init() {
        const [app, a, f] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
        const fbApp = app.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
        au = a; fs = f; auth = a.getAuth(fbApp); db = f.getFirestore(fbApp);
      },
      onAuth(cb) { au.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, email: u.email || '', verified: !!u.emailVerified } : null)); },
      async signIn() {
        const p = new au.GoogleAuthProvider();
        if (cfg.allowedDomains && cfg.allowedDomains.length === 1) p.setCustomParameters({ hd: cfg.allowedDomains[0] }); // a hint only; the rules enforce it
        await au.signInWithPopup(auth, p);
      },
      async signOut() { await au.signOut(auth); },
      async load(uid) { const s = await fs.getDoc(fs.doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
      async save(uid, data) { await fs.setDoc(fs.doc(db, 'users', uid), data); }
    };
  }

  function start() {
    const M = window.MLTQ, MERGE = window.MERGE, chip = document.getElementById('btn-sync');
    if (!M || !MERGE || !chip) return;
    const adapter = window.MLTQ_SYNC_ADAPTER || firebaseAdapter();
    const Store = M.Store;
    let wallMsg = null, user = null, applying = false, timer = null, lastPull = 0, busy = false, lastOk = null;

    const domainOk = email => { const d = cfg.allowedDomains; return !d || !d.length || d.some(x => email.toLowerCase().endsWith('@' + x.toLowerCase())); };
    function paint(msg) {
      chip.hidden = false;
      if (!user) { chip.textContent = 'Sign in'; chip.title = 'Sign in with Google to sync your progress across devices'; return; }
      const when = lastOk ? new Date(lastOk).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      chip.textContent = user.email.split('@')[0] + (msg ? ' · ' + msg : lastOk ? ' · synced ' + when : '');
      chip.title = 'Signed in as ' + user.email + '. Click to sign out.';
    }
    function wallShow() { if (window.NH_WALL) NH_WALL.show(wallMsg || 'Sign in with your IITM student Google account to use this site.', 'Sign in with Google', () => chip.click()); }
    function say(t) { const el = document.getElementById('toast'); if (el) { el.textContent = t; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 3000); } }

    function replaceLocal(state) {
      applying = true;
      try { const s = Store.s; Object.keys(s).forEach(k => { delete s[k]; }); Object.assign(s, state); s.topics = s.topics || {}; s.mistakes = s.mistakes || []; s.meta = s.meta || {}; s.events = s.events || []; Store.save(); }
      finally { applying = false; }
      const mc = document.getElementById('mistake-count'); if (mc) mc.textContent = Store.s.mistakes.length || '';
      document.documentElement.setAttribute('data-theme', Store.s.theme === 'dark' ? 'dark' : 'light');
    }
    async function push() {
      if (!user) return;
      let body = JSON.stringify(Store.s);
      if (body.length > 850000) { Store.s.events = Store.s.events.slice(-2000); body = JSON.stringify(Store.s); }
      await adapter.save(user.uid, { state: body, updatedAt: Date.now(), epoch: Store.s.epoch || 0, email: user.email });
      lastOk = Date.now(); paint();
    }
    async function pull() {
      if (!user || busy) return; busy = true; paint('syncing');
      try {
        const remote = await adapter.load(user.uid), local = Store.s;
        if (!remote) { await push(); return; }
        const rs = JSON.parse(remote.state), re = rs.epoch || 0, le = local.epoch || 0;
        if (re > le) replaceLocal(rs);                       // another device reset or restored: that copy is authoritative
        else if (le > re) await push();                      // this device reset or restored
        else { const merged = MERGE.mergeStates(local, rs); merged.theme = local.theme; const same = JSON.stringify(merged) === remote.state; replaceLocal(merged); if (!same) await push(); else { lastOk = Date.now(); } }
        lastPull = Date.now(); lastOk = Date.now(); paint();
        if (/^(#home|)$/.test(location.hash)) M.route();
      } catch (e) { paint('sync failed'); say('Sync failed. Your progress is safe on this device.'); }
      finally { busy = false; }
    }
    function schedulePush() { if (!user || applying) return; clearTimeout(timer); timer = setTimeout(() => { push().catch(() => paint('sync failed')); }, 3000); }

    window.addEventListener('mltq-saved', schedulePush);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && user && Date.now() - lastPull > 60000) pull(); });
    chip.addEventListener('click', async () => {
      if (!user) { if (!window.confirm('Sign in with your IITM student Google account to sync your progress.\n\nYour study progress and quiz answers are stored in a database run by the site owner (Krishn Bhagat) and are visible to him. Nothing else is collected. Continue?')) return; try { await adapter.signIn(); } catch (e) { say('Sign-in was cancelled or failed.'); } return; }
      if (window.confirm('Sign out? Your progress stays on this device and in your cloud copy.')) await adapter.signOut();
    });

    Promise.resolve(adapter.init()).then(() => {
      paint();
      adapter.onAuth(async u => {
        if (u && !(u.verified && domainOk(u.email))) { wallMsg = "That account isn't allowed. Use your " + (cfg.allowedDomains || []).join(', ') + ' Google account.'; say('Only ' + (cfg.allowedDomains || []).join(', ') + ' accounts can sync.'); await adapter.signOut(); return; }
        user = u; paint();
        if (u) { wallMsg = null; if (window.NH_WALL) NH_WALL.hide(); pull(); } else wallShow();
      });
    }).catch(() => { chip.hidden = true; if (window.NH_WALL) NH_WALL.show("Couldn't load sign-in. Check your connection and try again.", 'Reload', () => location.reload()); });
  }
  if (window.MLTQ) start(); else window.addEventListener('load', () => setTimeout(start, 0));
})();
