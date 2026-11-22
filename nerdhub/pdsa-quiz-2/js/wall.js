/* Full-screen sign-in wall. Active only when firebase-config.js has enabled: true AND required: true.
 * It only gates the interface; the site files themselves are public static files. */
(function () {
  "use strict";
  var cfg = window.PDSA_FIREBASE || window.MLTQ_FIREBASE || {};
  if (!cfg.enabled || !cfg.required || !document.body) return;
  var d = document.createElement("div");
  d.id = "login-wall";
  d.style.cssText = "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0f1115;color:#e8eaed;font:16px/1.6 system-ui,-apple-system,sans-serif;text-align:center;padding:24px";
  d.innerHTML = '<div style="max-width:420px"><h1 style="margin:0 0 8px;font-size:1.8rem">nerdhub</h1>' +
    '<p id="lw-msg" style="color:#9aa0a6;margin:0 0 20px">Checking sign-in…</p>' +
    '<button id="lw-btn" type="button" hidden style="padding:10px 20px;border:0;border-radius:10px;background:#7ee787;color:#0f1115;font:600 15px system-ui,sans-serif;cursor:pointer"></button>' +
    '<p style="margin-top:24px;font-size:.85rem;color:#9aa0a6">Your study progress is stored under your IITM account and is visible to the site owner. <a href="/nerdhub/privacy.html" style="color:#7ee787">Privacy</a></p></div>';
  document.body.appendChild(d);
  var msg = d.querySelector("#lw-msg"), btn = d.querySelector("#lw-btn");
  window.NH_WALL = {
    show: function (text, label, fn) {
      if (!d.isConnected) document.body.appendChild(d);
      msg.textContent = text; btn.textContent = label || ""; btn.hidden = !label; btn.onclick = fn || null;
    },
    hide: function () { if (d.isConnected) d.remove(); }
  };
})();
