/* Guide layer: story, mind map, concept connections, exam map, per-section "why are we here" banners,
   per-section "remember" cards, and a final "Things to remember" section.
   Data lives in js/guide-data.js (window.GUIDE). Nothing here is topic specific. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PAL = ['#2563eb', '#7c3aed', '#0d9488', '#ea580c', '#16a34a', '#db2777', '#ca8a04', '#0891b2'];
  const G = () => window.GUIDE || {};

  /* ---------- small SVG helpers ---------- */
  function svg(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  /* wrap text into lines of at most n characters */
  function wrap(t, n) {
    const words = String(t).split(/\s+/), out = []; let line = '';
    words.forEach(w => { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); });
    if (line) out.push(line);
    return out;
  }
  const plainMath = s => String(s).replace(/\$([^$]+)\$/g, (m, x) => x.replace(/\\[a-zA-Z]+/g, c => ({ '\\lambda': 'λ', '\\alpha': 'α', '\\theta': 'θ', '\\sigma': 'σ', '\\mu': 'μ', '\\le': '≤', '\\ge': '≥', '\\infty': '∞', '\\hat': '', '\\log': 'log', '\\sum': 'Σ', '\\to': '→', '\\gamma': 'γ' }[c] || '')).replace(/[{}\\]/g, '').replace(/_(\w)/g, '$1').replace(/\^2/g, '²'));

  /* ---------- mind map: left and right stacks, no overlaps ---------- */
  function mindmap(topicId, d, color) {
    const W = 1040, rowH = 31, gap = 20, cx = W / 2;
    const n = d.branches.length, right = d.branches.slice(0, Math.ceil(n / 2)), left = d.branches.slice(Math.ceil(n / 2));
    const blockH = b => Math.max(1, b.kids.length) * rowH + gap;
    const sideH = arr => arr.reduce((a, b) => a + blockH(b), 0);
    const H = Math.max(sideH(right), sideH(left), 260) + 40;
    const cy = H / 2;
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mm', role: 'img', 'aria-label': 'Mind map of ' + d.center });
    const link = (x1, y1, x2, y2, col, w) => s.appendChild(svg('path', { d: 'M' + x1 + ' ' + y1 + ' C ' + (x1 + (x2 - x1) * .55) + ' ' + y1 + ' ' + (x2 - (x2 - x1) * .55) + ' ' + y2 + ' ' + x2 + ' ' + y2, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: .75 }));
    const pill = (x, y, txt, anchor, col, filled, onclick, tip) => {
      const g = svg('g', { class: 'mm-n' + (onclick ? ' link' : '') });
      const lines = filled ? wrap(txt, 16) : [txt];
      const w = filled ? 150 : Math.min(236, Math.max(60, txt.length * 7.3 + 20)), h = filled ? 16 + lines.length * 17 : 25;
      const rx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      g.appendChild(svg('rect', { x: rx, y: y - h / 2, width: w, height: h, rx: filled ? 10 : 11, fill: filled ? col : 'var(--surface)', stroke: col, 'stroke-width': filled ? 0 : 1.4 }));
      lines.forEach((ln, i) => g.appendChild(svg('text', { x: rx + w / 2, y: y - ((lines.length - 1) * 8.5) + i * 17 + 5, 'text-anchor': 'middle', fill: filled ? '#fff' : 'var(--ink)', 'font-size': filled ? 15 : 13.5, 'font-weight': filled ? 700 : 400 }, ln)));
      if (tip) g.appendChild(svg('title', {}, tip));
      if (onclick) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'link'); g.addEventListener('click', onclick); g.addEventListener('keydown', e => { if (e.key === 'Enter') onclick(); }); }
      return { g, w, h, rx };
    };
    function side(arr, dir, offset) {
      let y = (H - sideH(arr)) / 2 + gap / 2;
      arr.forEach((b, bi) => {
        const col = PAL[(offset + bi) % PAL.length], bh = Math.max(1, b.kids.length) * rowH;
        const by = y + bh / 2, bx = cx + dir * 182;
        link(cx + dir * 64, cy, bx - dir * 75, by, col, 3.2);
        b.kids.forEach((k, ki) => {
          const ky = y + ki * rowH + rowH / 2, kx = cx + dir * 268;
          link(bx + dir * 75, by, kx - dir * 4, ky, col, 1.7);
          const p = pill(kx, ky, plainMath(k), dir > 0 ? 'start' : 'end', col, false);
          s.appendChild(p.g);
        });
        const go = b.sec ? () => { const el = document.getElementById('sec-' + b.sec); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } : null;
        const p = pill(bx, by, plainMath(b.n), 'middle', col, true, go, b.sec ? 'Open this section' : '');
        s.appendChild(p.g);
        y += blockH(b);
      });
    }
    side(right, 1, 0); side(left, -1, right.length);
    const c = pill(cx, cy, plainMath(d.center), 'middle', color, true);
    c.g.querySelector('rect').setAttribute('width', 128); c.g.querySelector('rect').setAttribute('x', cx - 64);
    s.appendChild(c.g);
    return s;
  }

  /* ---------- connection map: layers left to right, labelled arrows ---------- */
  function connmap(d, color) {
    const L = d.layers, W = d.W || 980, nw = d.nw || 166, nh = 60;
    const maxRows = Math.max.apply(null, L.map(l => l.length)), H = Math.max(300, maxRows * 104 + 40);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mm', role: 'img', 'aria-label': 'How the ideas connect' });
    const defs = svg('defs'); const mk = svg('marker', { id: 'cmA', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    mk.appendChild(svg('path', { d: 'M0 0L10 5L0 10z', fill: 'var(--muted)' })); defs.appendChild(mk); s.appendChild(defs);
    const pos = {};
    L.forEach((layer, li) => {
      const x = nw / 2 + 10 + li * ((W - nw - 20) / Math.max(1, L.length - 1));
      layer.forEach((id, ri) => { pos[id] = { x, y: H / 2 + (ri - (layer.length - 1) / 2) * 104, col: PAL[(li * 2 + ri) % PAL.length] }; });
    });
    d.edges.forEach(e => {
      const a = pos[e[0]], b = pos[e[1]]; if (!a || !b) return;
      let x1, x2;
      if (Math.abs(a.x - b.x) < 5) { x1 = a.x; x2 = b.x; const y1 = a.y + (b.y > a.y ? nh / 2 : -nh / 2), y2 = b.y + (b.y > a.y ? -nh / 2 : nh / 2); s.appendChild(svg('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: 'var(--muted)', 'stroke-width': 1.7, fill: 'none', 'marker-end': 'url(#cmA)' })); lab((x1 + x2) / 2 + 6, (y1 + y2) / 2, e[2], 'start'); return; }
      const dir = b.x > a.x ? 1 : -1; x1 = a.x + dir * nw / 2; x2 = b.x - dir * nw / 2;
      s.appendChild(svg('path', { d: 'M' + x1 + ' ' + a.y + ' C ' + (x1 + (x2 - x1) * .5) + ' ' + a.y + ' ' + (x1 + (x2 - x1) * .5) + ' ' + b.y + ' ' + x2 + ' ' + b.y, stroke: 'var(--muted)', 'stroke-width': 1.7, fill: 'none', 'marker-end': 'url(#cmA)' }));
      lab((x1 + x2) / 2, (a.y + b.y) / 2 - 7, e[2], 'middle');
    });
    function lab(x, y, t, anc) { if (!t) return; wrap(t, 17).forEach((ln, i) => s.appendChild(svg('text', { x, y: y + i * 14, 'text-anchor': anc, class: 'mm-e' }, plainMath(ln)))); }
    Object.keys(pos).forEach(id => {
      const p = pos[id], nd = d.nodes[id]; if (!nd) return;
      const g = svg('g'); if (nd.href) { g.setAttribute('class', 'mm-n link'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'link'); const go = () => { location.hash = nd.href; }; g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); }
      g.appendChild(svg('rect', { x: p.x - nw / 2, y: p.y - nh / 2, width: nw, height: nh, rx: 11, fill: 'var(--surface)', stroke: p.col, 'stroke-width': 2 }));
      g.appendChild(svg('rect', { x: p.x - nw / 2, y: p.y - nh / 2, width: 7, height: nh, rx: 3, fill: p.col }));
      const l1 = plainMath(nd.t), l2 = wrap(plainMath(nd.s || ''), 25).slice(0, 2);
      g.appendChild(svg('text', { x: p.x + 3, y: p.y - (l2.length ? 9 * l2.length - 5 : -4), 'text-anchor': 'middle', 'font-size': 14.5, 'font-weight': 700, fill: 'var(--ink)' }, l1));
      l2.forEach((ln, i) => g.appendChild(svg('text', { x: p.x + 3, y: p.y + 7 + i * 13 - (l2.length - 1) * 4, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--muted)' }, ln)));
      s.appendChild(g);
    });
    return s;
  }

  /* ---------- exam map from the topic's own data ---------- */
  function exammap(topic) {
    const pq = topic.pyqs || [];
    const rows = Object.keys(topic.concepts || {}).map(k => {
      const mine = pq.filter(p => p.concept === k);
      return { k, name: topic.concepts[k].name, marks: mine.reduce((a, p) => a + (+p.marks || 0), 0), n: mine.length };
    }).filter(r => r.n > 0).sort((a, b) => b.marks - a.marks);
    const tot = rows.reduce((a, r) => a + r.marks, 0), max = rows.length ? rows[0].marks : 1;
    const box = document.createElement('div'); box.className = 'em';
    rows.forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'em-row';
      row.innerHTML = '<div class="em-n"><b>' + esc(r.name) + '</b><small>' + r.n + ' PYQ' + (r.n === 1 ? '' : 's') + ' · <b class="em-m">' + (Math.round(r.marks * 10) / 10) + ' marks</b> · ' + (Math.round(1000 * r.marks / tot) / 10) + '% of this topic</small></div><div class="em-b"><i style="width:' + Math.max(3, 100 * r.marks / max) + '%;background:' + PAL[i % PAL.length] + '"></i></div>';
      box.appendChild(row);
    });
    const note = document.createElement('p'); note.className = 'em-note';
    note.textContent = 'Added up from the ' + pq.length + ' PYQs in your bank for this topic (' + (Math.round(tot * 10) / 10) + ' marks in total). It shows where marks were asked before, not a prediction.';
    box.appendChild(note);
    return box;
  }

  /* phone versions: an outline instead of a wide drawing */
  const narrow = () => window.matchMedia && window.matchMedia('(max-width:700px)').matches;
  function mindOutline(d) {
    const box = document.createElement('div'); box.className = 'mo';
    d.branches.forEach((b, i) => {
      const c = PAL[i % PAL.length];
      const el = document.createElement('div'); el.className = 'mo-b'; el.style.setProperty('--c', c);
      el.innerHTML = '<a href="#" class="mo-h">' + esc(plainMath(b.n)) + '</a><div class="mo-k">' + b.kids.map(k => '<span>' + esc(plainMath(k)) + '</span>').join('') + '</div>';
      if (b.sec) $('a', el).addEventListener('click', e => { e.preventDefault(); const t = document.getElementById('sec-' + b.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      box.appendChild(el);
    });
    return box;
  }
  function connList(d) {
    const box = document.createElement('div'); box.className = 'cl';
    d.edges.forEach(e => {
      const a = d.nodes[e[0]], b = d.nodes[e[1]]; if (!a || !b) return;
      const r = document.createElement('div'); r.className = 'cl-r';
      r.innerHTML = '<b>' + esc(plainMath(a.t)) + '</b><span class="cl-a">' + (e[2] ? esc(plainMath(e[2])) : '') + ' ➜</span><b>' + esc(plainMath(b.t)) + '</b>';
      box.appendChild(r);
    });
    return box;
  }

  /* ---------- the atlas ---------- */
  function atlas(topic, g, meta) {
    const root = document.createElement('section'); root.className = 'atlas'; root.id = 'atlas';
    const tabs = [['story', '1  The story'], ['mind', '2  Mind map'], ['conn', '3  How ideas connect'], ['exam', '4  Where the marks are'], ['road', '5  Roadmap']];
    root.innerHTML = '<div class="atlas-h"><div class="atlas-t"><span class="atlas-i">' + (g.icon || '📘') + '</span><div><b>Start here: the big picture</b><small>Read this once before the details. It answers: what are we studying, why, and how the pieces fit.</small></div></div><div class="atlas-tabs" role="tablist"></div></div><div class="atlas-p"></div>';
    const tb = $('.atlas-tabs', root), pb = $('.atlas-p', root);
    const panels = {};
    const build = {
      story: () => {
        const d = document.createElement('div'); d.className = 'story';
        d.innerHTML = '<p class="story-one">' + g.one + '</p><div class="story-steps">' + g.story.map((s, i) => '<div class="ss" style="--c:' + PAL[i % PAL.length] + '"><div class="ss-n">' + (i + 1) + '</div><div class="ss-b"><b>' + s.h + '</b><p>' + s.t + '</p></div></div>').join('') + '</div>';
        return d;
      },
      mind: () => { const d = document.createElement('div'); d.className = 'mmwrap'; d.innerHTML = '<p class="mm-help">The centre is the topic. Each coloured box is one big idea; the white tags are the facts hanging off it. <b>Click a coloured box</b> to jump to that section.</p>'; d.appendChild(narrow() ? mindOutline(g.mind) : mindmap(topic.id, g.mind, g.color)); return d; },
      conn: () => { const d = document.createElement('div'); d.className = 'mmwrap'; d.innerHTML = '<p class="mm-help">Read left to right. Each arrow says <i>how</i> one idea leads to the next. If you forget a formula in the exam, walk along these arrows to rebuild it.</p>'; d.appendChild(narrow() ? connList(g.graph) : connmap(g.graph, g.color)); return d; },
      exam: () => { const d = document.createElement('div'); d.appendChild(exammap(topic)); return d; },
      road: () => {
        const d = document.createElement('ol'); d.className = 'road';
        topic.sections.forEach((s, i) => {
          const gs = (g.secs || {})[s.id] || {};
          if (s.id === 'remember') return;
          d.insertAdjacentHTML('beforeend', '<li><a href="#" data-go="sec-' + s.id + '"><span class="rn">' + (i + 1) + '</span><span class="rt"><b>' + esc(s.title) + '</b>' + (gs.q ? '<small>' + gs.q + '</small>' : '') + '</span></a></li>');
        });
        d.insertAdjacentHTML('beforeend', '<li><a href="#" data-go="sec-remember"><span class="rn">★</span><span class="rt"><b>Things to remember</b><small>Properties, formulas, traps and one-line memory hooks, all in one place at the end.</small></span></a></li>');
        $$('a', d).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const el = document.getElementById(a.getAttribute('data-go')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
        return d;
      }
    };
    function show(k) {
      $$('.atlas-tabs button', root).forEach(b => b.setAttribute('aria-selected', b.dataset.k === k ? 'true' : 'false'));
      Object.keys(panels).forEach(x => { panels[x].hidden = x !== k; });
      if (!panels[k]) { const p = document.createElement('div'); p.className = 'atlas-pp'; p.appendChild(build[k]()); pb.appendChild(p); panels[k] = p; if (window.__guideMath) window.__guideMath(p); }
    }
    tabs.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = t[0]; b.setAttribute('role', 'tab'); b.textContent = t[1]; b.addEventListener('click', () => show(t[0])); tb.appendChild(b); });
    show('story');
    return root;
  }

  /* ---------- per-section banner and remember card ---------- */
  function banner(sec, gs, idx, total, prevT, nextT) {
    const d = document.createElement('div'); d.className = 'why';
    d.innerHTML = '<div class="why-nav">You are here: step ' + idx + ' of ' + total + (prevT ? ' · after <i>' + esc(prevT) + '</i>' : '') + (nextT ? ' · before <i>' + esc(nextT) + '</i>' : '') + '</div>' +
      '<div class="why-g">' +
      '<div class="why-c q"><span class="why-l">❓ The question</span><p>' + gs.q + '</p></div>' +
      '<div class="why-c w"><span class="why-l">🎯 Why we need it</span><p>' + gs.why + '</p></div>' +
      '<div class="why-c p"><span class="why-l">💬 In plain words</span><p>' + gs.plain + '</p></div></div>';
    return d;
  }
  function remember(gs) {
    const d = document.createElement('div'); d.className = 'rem';
    d.innerHTML = '<div class="rem-h">✅ Remember from this section</div><ul>' + gs.remember.map(x => '<li>' + x + '</li>').join('') + '</ul>';
    return d;
  }

  const clean = t => String(t).replace(/\s*\[(ADDED|SRC|DERIVED)[^\]]*\]/g, '').trim();
  /* ---------- the final section: things to remember ---------- */
  function rememberHTML(topic, g) {
    const e = g.end || {};
    let h = '<p class="lead">Everything you should be able to say without looking: properties, formulas with their conditions, traps, and the first move for each kind of question. Read this the night before and again just before the exam.</p>';
    h += '<div class="rm-links"><a class="btn small" href="#cards-' + topic.id + '">🃏 Flashcards for this topic</a><a class="btn small sec" href="#revise-' + topic.id + '">🌙 Printable last-night sheet</a><a class="btn small sec" href="#glossary">📖 Glossary</a></div>';
    if (e.props && e.props.length) h += '<h3>🔖 Properties and facts</h3><div class="tablewrap"><table><tr><th>Idea</th><th>What to remember</th></tr>' + e.props.map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>').join('') + '</table></div>';
    if (topic.formulas && topic.formulas.length) h += '<h3>∑ Formulas, with their conditions</h3><div class="fgrid2">' + topic.formulas.map(f => '<div class="fc"><b>' + clean(f.name) + '</b><div>$$' + f.tex + '$$</div>' + (f.note ? '<small>' + clean(f.note) + '</small>' : '') + '</div>').join('') + '</div>';
    if (e.cues && e.cues.length) h += '<h3>🧭 Wording → first move</h3><div class="tablewrap"><table><tr><th>If the question says…</th><th>Do this first</th></tr>' + e.cues.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table></div>';
    const mv = (window.STUDY && window.STUDY.moves && window.STUDY.moves[topic.id]) || [];
    if (mv.length) h += '<h3>⏱️ Exam moves: question type, fast method, time, check</h3><div class="tablewrap"><table><tr><th>Question type</th><th>Fast method</th><th>Time</th><th>Sanity check</th></tr>' + mv.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>').join('') + '</table></div>';
    if (e.traps && e.traps.length) h += '<h3>⚠️ Traps</h3><div class="traps">' + e.traps.map(x => '<div class="trap">' + x + '</div>').join('') + '</div>';
    if (e.hooks && e.hooks.length) h += '<h3>🧠 One-line memory hooks</h3><ol class="hooks">' + e.hooks.map(x => '<li>' + x + '</li>').join('') + '</ol>';
    return h;
  }

  /* ---------- public API used by engine.js ---------- */
  function augment(topic) {
    const g = G()[topic.id]; if (!g || topic.__guided) return; topic.__guided = true;
    topic.sections.push({ id: 'remember', title: 'Things to remember: properties, facts, traps', html: rememberHTML(topic, g) });
    if (window.Study && window.Study.cheatHTML) topic.sections.push({ id: 'cheatsheet', title: 'Cheatsheet: what the past questions ask, and the fastest answer', html: window.Study.cheatHTML(topic) });
  }
  function decorate(topic, col, meta) {
    /* remove the changelog block and mark source-tag notes so they can be hidden (all topics) */
    $$('h3', col).forEach(h => { if (/What is new in this upgrade/i.test(h.textContent)) { const nx = h.nextElementSibling; if (nx && /^(UL|OL)$/.test(nx.tagName)) nx.remove(); h.remove(); } });
    $$('.notice', col).forEach(n => { if (n.querySelector('.tag')) n.classList.add('tagnote'); });
    const g = G()[topic.id]; if (!g) return;
    col.setAttribute('data-topic', topic.id); col.style.setProperty('--tc', g.color);
    const first = $('section.sec', col);
    if (first) col.insertBefore(atlas(topic, g, meta), first);
    const real = topic.sections.filter(s => s.kind !== 'pyq' && s.kind !== 'test' && s.kind !== 'checklist' && s.id !== 'remember' && s.id !== 'cheatsheet');
    topic.sections.forEach((s, i) => {
      const sec = document.getElementById('sec-' + s.id); if (!sec) return;
      sec.style.setProperty('--sn', '"' + (i + 1) + '"');
      const gs = (g.secs || {})[s.id]; if (!gs) return;
      const h2 = $('h2', sec), body = $('.secbody', sec);
      const prev = topic.sections[i - 1], next = topic.sections[i + 1];
      if (gs.q) h2.insertAdjacentElement('afterend', banner(sec, gs, i + 1, topic.sections.length, prev && prev.title.replace(/:.*/, ''), next && next.title.replace(/:.*/, '')));
      if (gs.remember && gs.remember.length) { const r = remember(gs); const q = sec.querySelector('.qz, .secnav'); const host = $('.secbody', sec); host.appendChild(r); }
    });
    /* the Remember section should look like a finishing page */
    const rs = document.getElementById('sec-remember'); if (rs) rs.classList.add('final-sec');
    const cs = document.getElementById('sec-cheatsheet'); if (cs) cs.classList.add('final-sec');
  }
  function courseMap() {
    const d = document.createElement('section'); d.className = 'atlas coursemap';
    const data = {
      W: 900, nw: 200,
      layers: [['rr', 'lr', 'kr'], ['cv'], ['knn', 'dt', 'nb']],
      nodes: {
        rr: { t: '2 Ridge, Lasso, MAP', s: 'penalise big weights', href: 't-ridge-lasso-map' },
        lr: { t: '1 Linear regression', s: 'least squares, gradient descent', href: 't-linear-regression' },
        kr: { t: '3 Kernel regression', s: 'curved fits via kernels', href: 't-kernel-regression' },
        cv: { t: '7 Cross-validation', s: 'judge and tune any model', href: 't-cross-validation' },
        knn: { t: '4 k-NN', s: 'predict from neighbours', href: 't-knn' },
        dt: { t: '5 Decision trees', s: 'questions that split labels', href: 't-decision-trees' },
        nb: { t: '6 Naive Bayes', s: 'probabilities per class', href: 't-naive-bayes' }
      },
      edges: [['lr', 'rr', 'add a penalty'], ['lr', 'kr', 'lift the features'], ['rr', 'cv', 'choose λ'], ['lr', 'cv', 'compare models'], ['kr', 'cv', 'choose settings'], ['knn', 'cv', 'choose k'], ['dt', 'cv', 'choose depth'], ['nb', 'cv', 'compare models']]
    };
    d.innerHTML = '<div class="atlas-h"><div class="atlas-t"><span class="atlas-i">🗺️</span><div><b>Quiz 2 on one page: how the seven topics connect</b><small>Left: models that predict numbers. Right: models that predict classes. Middle: cross-validation, the judge for all of them. Click any box to open it.</small></div></div></div><div class="atlas-p"><div class="mmwrap"></div></div>';
    $('.mmwrap', d).appendChild(narrow() ? connList(data) : connmap(data, '#2563eb'));
    return d;
  }
  window.Guide = { augment, decorate, courseMap, has: id => !!G()[id], rememberHTML };
})();
(function () {
  function init() {
    const b = document.getElementById('btn-tags'); if (!b) return;
    let on = false; try { on = localStorage.getItem('mltq.tags') === '1'; } catch (e) { /* ignore */ }
    const apply = () => { document.body.classList.toggle('show-tags', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    apply();
    b.addEventListener('click', () => { on = !on; try { localStorage.setItem('mltq.tags', on ? '1' : '0'); } catch (e) { /* ignore */ } apply(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
