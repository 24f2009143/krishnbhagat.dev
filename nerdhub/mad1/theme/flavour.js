/* MAD 1 theme flavour: everything visual or worded in the concept's voice ("The Exchange": request and response).
 * The engine calls these hooks when present and falls back to plain defaults, so logic code holds no colours or
 * subject wording. All colours come from CSS variables in theme/tokens.css. */
window.APP = window.APP || {};
(function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };

  /* brand mark: request arrow (vermilion) over response arrow (teal) in a rounded square */
  var LOGO = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true">' +
    '<rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>' +
    '<path d="M7 11.5h15M18 7.5l4.5 4-4.5 4" fill="none" stroke="var(--req)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M25 20.5H10M14 16.5l-4.5 4 4.5 4" fill="none" stroke="var(--res)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* hero: a browser and a server in conversation */
  function hero() {
    return '<svg class="hero-art" viewBox="0 0 460 250" role="img" aria-label="A browser sends a GET request to a server and receives a 200 OK response.">' +
      /* browser window */
      '<rect x="8" y="34" width="168" height="150" rx="10" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>' +
      '<path d="M8 58h168" stroke="var(--ink)" stroke-width="1.6"/>' +
      '<circle cx="22" cy="46" r="3.5" fill="var(--req)"/><circle cx="34" cy="46" r="3.5" fill="var(--wait)"/><circle cx="46" cy="46" r="3.5" fill="var(--res)"/>' +
      '<rect x="22" y="72" width="96" height="9" rx="2" fill="var(--rule2)"/><rect x="22" y="90" width="138" height="6" rx="2" fill="var(--rule)"/>' +
      '<rect x="22" y="102" width="120" height="6" rx="2" fill="var(--rule)"/><rect x="22" y="114" width="130" height="6" rx="2" fill="var(--rule)"/>' +
      '<rect x="22" y="134" width="64" height="22" rx="5" fill="var(--req)"/><text x="54" y="149" text-anchor="middle" font-family="var(--sans)" font-size="10" font-weight="700" fill="var(--paper)">Submit</text>' +
      '<text x="92" y="206" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--muted)">browser</text>' +
      /* server */
      '<rect x="330" y="50" width="120" height="34" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>' +
      '<rect x="330" y="92" width="120" height="34" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>' +
      '<rect x="330" y="134" width="120" height="34" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>' +
      '<circle cx="434" cy="67" r="4" fill="var(--res)"/><circle cx="434" cy="109" r="4" fill="var(--res)"/><circle cx="434" cy="151" r="4" fill="var(--wait)"/>' +
      '<path d="M344 67h50M344 109h50M344 151h50" stroke="var(--rule2)" stroke-width="4" stroke-linecap="round"/>' +
      '<text x="390" y="190" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--muted)">Flask server</text>' +
      /* request (out) and response (back) */
      '<path d="M186 82 C230 60 280 60 320 74" fill="none" stroke="var(--req)" stroke-width="2.2" stroke-dasharray="6 5"/>' +
      '<path d="M314 68l9 6-10 4" fill="none" stroke="var(--req)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="206" y="40" width="92" height="22" rx="5" fill="var(--req-soft)" stroke="var(--req)"/>' +
      '<text x="252" y="55" text-anchor="middle" font-family="var(--mono)" font-size="11" font-weight="700" fill="var(--req)">GET /flask</text>' +
      '<path d="M320 150 C280 170 230 170 188 152" fill="none" stroke="var(--res)" stroke-width="2.2"/>' +
      '<path d="M196 146l-9 6 10 4" fill="none" stroke="var(--res)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="214" y="170" width="78" height="22" rx="5" fill="var(--res-soft)" stroke="var(--res)"/>' +
      '<text x="253" y="185" text-anchor="middle" font-family="var(--mono)" font-size="11" font-weight="700" fill="var(--res)">200 OK</text>' +
      '</svg>';
  }

  /* segmented ring: one arc per lesson; filled segments = progress */
  function ring(pct, state, segments, size) {
    var n = Math.max(1, Math.min(segments || 8, 24)), s = size || 58, r = s / 2 - 5, c = s / 2, gap = n > 1 ? 7 : 0;
    var done = Math.round(n * (pct || 0) / 100), out = '<svg class="seg-ring ' + esc(state) + '" viewBox="0 0 ' + s + ' ' + s + '" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      var a0 = (i / n) * 360 - 90 + gap / 2, a1 = ((i + 1) / n) * 360 - 90 - gap / 2;
      var p = function (a) { var t = a * Math.PI / 180; return (c + r * Math.cos(t)).toFixed(2) + " " + (c + r * Math.sin(t)).toFixed(2); };
      var cls = i < done ? "seg on" : (i === done && state === "frontier" ? "seg part" : "seg");
      out += '<path class="' + cls + '" d="M' + p(a0) + " A" + r + " " + r + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + p(a1) + '"/>';
    }
    return out + '<text x="' + c + '" y="' + (c + 4.5) + '" text-anchor="middle">' + (state === "planned" ? "—" : (pct || 0) + "%") + "</text></svg>";
  }

  /* topic card: an HTTP message (request line + status, then the body) */
  var STATUS = { visited: ["s200", "200 Done"], frontier: ["s206", "206 In progress"], unvisited: ["s000", "ready"], planned: ["s000", "planned"] };
  function topicCard(m, st, state, lessons) {
    var s = STATUS[state] || STATUS.unvisited;
    return '<div class="msg-line"><span><span class="verb">GET</span>/topic/' + esc(m.id) + '</span><span class="msg-status ' + s[0] + '">' + s[1] + "</span></div>" +
      '<div class="msg-body"><span class="tmain"><b>' + esc(m.name) + '</b><span class="twhy">' + esc(m.why) + "</span></span>" + ring(st.pct, state, lessons || 8) + "</div>" +
      '<span class="tnums"><span><b>' + st.solved + "/" + st.pyqs + "</b> PYQs</span><span><b>" + (Math.round(st.marks * 10) / 10) + "</b> marks</span><span>weeks " + esc(m.weeks.join(", ")) + "</span></span>";
  }

  /* reading progress bar on lesson pages: vermilion while the "request" is in flight, teal once you reach the end */
  function inflight() {
    var bar = document.createElement("div"); bar.className = "inflight"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var tick = function () {
      var on = /#topic\/[^/]+\/lesson\//.test(location.hash), h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      var f = on && max > 40 ? Math.min(1, h.scrollTop / max) : 0;
      bar.style.width = (f * 100).toFixed(1) + "%"; bar.classList.toggle("done", f > 0.985);
    };
    addEventListener("scroll", tick, { passive: true }); addEventListener("hashchange", function () { setTimeout(tick, 60); }); tick();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inflight); else inflight();

  APP.flavour = {
    name: "The Exchange",
    logo: LOGO,
    hero: hero,
    ring: ring,
    topicCard: topicCard,
    copy: {
      heroKicker: "MAD 1 · request → response",
      heroTitle: "Every page starts with a request.",
      nextLabel: "Next request",
      correctStamp: "200 OK"
    }
  };
})();
