/* Shell: header, command palette, sidebar polish, topic header with tabs, Quiz 2 home. Loaded after engine.js. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const A = () => (window.MLTQ && window.MLTQ.api) || null;
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const mk = (tag, cls, html, attrs) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k])); return n; };
  const ICON = {
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    dots: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  const Q2 = () => { const a = A(); return a ? a.M().topics.filter(t => t.course !== 'q1' && !t.legacy && t.status === 'ready') : []; };
  const color = id => ((window.GUIDE || {})[id] || {}).color || 'var(--pen)';
  function pct(id) { const a = A(); if (!a) return 0; const T = (window.TOPICS || {})[id]; if (T && window.Study && window.Guide && (window.GUIDE || {})[id]) { window.Guide.augment(T); return window.Study.readiness(T).pct; } const s = a.topicStats(id); const r = s.nSecs ? s.secs / s.nSecs : 0, p = s.nPyq ? s.solved / s.nPyq : 0; return Math.round(100 * (0.5 * Math.min(1, r) + 0.5 * Math.min(1, p))); }
  function ring(p, size, c) {
    const r = (size - 4) / 2, C = 2 * Math.PI * r;
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--ring-bg)" stroke-width="3"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (c || 'var(--pen)') + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (C * p / 100).toFixed(2) + ' ' + C.toFixed(2) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  }

  /* ================= header ================= */
  const MENUS = {
    practice: { label: 'Practice', items: [['#practice', 'Practice next', 'Ranks ideas by the marks you are likely to lose'], ['#mock', 'Mock test', 'Timed past-paper questions'], ['#cards', 'Flashcards', 'Spaced recall of ideas and formulas'], ['#mistakes', 'Mistakes', 'Your wrong answers, confident ones first', 'mc']] },
    revise: { label: 'Revise', items: [['#plan', 'Study plan', '1 hour, half a day, 1 day or 1 week'], ['#cheat', 'Course cheatsheet', 'Formulas, traps and a last-day plan'], ['#revise', 'Last-night sheets', 'One printable page per topic'], ['#glossary', 'Glossary', 'Every term in plain English'], ['#refresh', 'Maths refreshers', 'Notation, derivatives, matrices, probability']] }
  };
  function closeMenus(except) { $$('.hm.open').forEach(m => { if (m !== except) { m.classList.remove('open'); const b = $('button', m); if (b) b.setAttribute('aria-expanded', 'false'); } }); }
  function dropdown(key, def) {
    const w = mk('div', 'hm');
    const b = mk('button', 'hm-b', esc(def.label) + ICON.chev, { 'aria-haspopup': 'true', 'aria-expanded': 'false', type: 'button' });
    const p = mk('div', 'hm-p', null, { role: 'menu' });
    def.items.forEach(it => {
      const a = mk('a', 'hm-i', '<b>' + esc(it[1]) + (it[3] === 'mc' ? ' <span class="mcnt" id="mc2"></span>' : '') + '</b><small>' + esc(it[2]) + '</small>', { href: it[0], role: 'menuitem', 'data-route': it[0].slice(1) });
      a.addEventListener('click', () => closeMenus());
      p.appendChild(a);
    });
    b.addEventListener('click', e => { e.stopPropagation(); const open = !w.classList.contains('open'); closeMenus(w); w.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open)); });
    w.append(b, p); w.dataset.key = key; return w;
  }
  function buildHeader() {
    const top = $('#top'); if (!top || top.dataset.shell) return; top.dataset.shell = '1';
    const brand = $('#brand'); if (brand) brand.innerHTML = '<span class="logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="2" y="2" width="20" height="20" rx="6" fill="var(--pen)"/><path d="M7 16.5 10 9l3 5 4-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><b>MLT</b><span class="bname">Study</span>';
    const nav = mk('nav', 'hnav', null, { 'aria-label': 'Main' });
    const learn = mk('a', 'hl', 'Learn', { href: '#home', 'data-route': 'home' });
    nav.append(learn, dropdown('practice', MENUS.practice), dropdown('revise', MENUS.revise));
    const sbtn = mk('button', 'hsearch', ICON.search + '<span>Search notes, PYQs, terms</span><kbd>' + (/Mac|iP/.test(navigator.platform) ? '⌘' : 'Ctrl') + ' K</kbd>', { type: 'button', 'aria-label': 'Search' });
    sbtn.addEventListener('click', openPalette);
    const right = mk('div', 'hright');
    const cont = mk('a', 'hcont', 'Continue' + ICON.arrow, { href: '#home', title: 'Continue where you left off' });
    cont.addEventListener('click', e => { const L = ls.get('mltq.last', null); if (L && L.topic && A()) { e.preventDefault(); A().go(L.topic, L.sec); } });
    const theme = $('#btn-theme');
    const more = mk('div', 'hm hmore');
    const mb = mk('button', 'hm-b icon-only', ICON.dots, { 'aria-label': 'More settings', 'aria-haspopup': 'true', 'aria-expanded': 'false', type: 'button' });
    const mp = mk('div', 'hm-p right', null, { role: 'menu' });
    [['btn-formulas', 'Formula drawer'], ['btn-large', 'Larger text'], ['btn-tags', 'Show source tags'], ['btn-xp', 'Expand all'], ['btn-sync', 'Sign in to sync'], ['btn-reset', 'Reset progress']].forEach(x => {
      const n = document.getElementById(x[0]); if (!n) return;
      n.className = 'hm-i row'; n.innerHTML = '<b>' + x[1] + '</b>' + (x[0] === 'btn-large' || x[0] === 'btn-tags' || x[0] === 'btn-xp' ? '<span class="sw" aria-hidden="true"></span>' : '');
      n.addEventListener('click', () => { if (x[0] !== 'btn-large' && x[0] !== 'btn-tags' && x[0] !== 'btn-xp') closeMenus(); });
      mp.appendChild(n);
    });
    mb.addEventListener('click', e => { e.stopPropagation(); const open = !more.classList.contains('open'); closeMenus(more); more.classList.toggle('open', open); mb.setAttribute('aria-expanded', String(open)); });
    more.append(mb, mp);
    if (theme) { theme.className = 'hicon'; right.append(cont, theme, more); } else right.append(cont, more);
    const old = $('#top-actions'); const form = $('#search-form');
    if (form) { form.hidden = true; form.classList.add('sr-only-form'); }
    const menuBtn = $('#btn-menu');
    top.innerHTML = ''; top.append(menuBtn || mk('span'), brand, nav, sbtn, right);
    if (form) document.body.appendChild(form);
    if (old) old.remove();
    document.addEventListener('click', e => { if (!e.target.closest('.hm')) closeMenus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
    /* mistake count mirror */
    const src = document.getElementById('mistake-count') || mk('span', '', null, { id: 'mistake-count', hidden: '' });
    if (!src.isConnected) document.body.appendChild(src);
    const sync = () => { const t = document.getElementById('mc2'); if (t) t.textContent = src.textContent; };
    new MutationObserver(sync).observe(src, { childList: true, characterData: true, subtree: true }); sync();
    window.addEventListener('hashchange', markActive); markActive();
  }
  function markActive() {
    const h = (location.hash || '#hub').slice(1);
    $$('.hnav [data-route]').forEach(a => a.classList.toggle('on', a.getAttribute('data-route') === h.split('-')[0] || (a.getAttribute('data-route') === 'home' && (h === 'home' || h.indexOf('t-') === 0))));
    $$('.hnav .hm').forEach(m => m.classList.toggle('on', $$('[data-route]', m).some(a => a.getAttribute('data-route') === h.split('-')[0])));
  }

  /* ================= command palette ================= */
  let pal = null, palItems = [], palSel = 0;
  function sourceItems() {
    const a = A(), out = [];
    [['#hub', 'Courses', 'Page'], ['#home', 'Quiz 2 home', 'Page'], ['#q1', 'Quiz 1', 'Page'], ['#endterm', 'End-term', 'Page']].concat(MENUS.practice.items.concat(MENUS.revise.items).map(i => [i[0], i[1], 'Tool'])).forEach(x => out.push({ t: x[1], k: x[2], href: x[0] }));
    if (a) a.M().topics.filter(t => t.status === 'ready').forEach(t => out.push({ t: t.title, k: t.course === 'q1' ? 'Quiz 1 topic' : 'Quiz 2 topic', href: '#t-' + t.id, sub: t.blurb }));
    Object.keys(window.TOPICS || {}).forEach(id => { const tp = window.TOPICS[id]; (tp.sections || []).forEach(s => out.push({ t: s.title.replace(/<[^>]+>/g, ''), k: 'Section', sub: tp.title, go: [id, 'sec-' + s.id] })); });
    ((window.STUDY || {}).glossary || []).forEach(g => out.push({ t: g.t, k: 'Term', href: '#glossary-' + g.k }));
    return out;
  }
  function score(it, q) {
    if (!q) return it.k === 'Page' || it.k === 'Tool' || it.k === 'Quiz 2 topic' ? 1 : 0;
    const t = it.t.toLowerCase(); const i = t.indexOf(q);
    if (i === 0) return 100 - t.length / 100; if (i > 0) return 60 - i / 10;
    const words = q.split(/\s+/).filter(Boolean); if (words.length > 1 && words.every(w => t.indexOf(w) >= 0)) return 40;
    if (it.sub && it.sub.toLowerCase().indexOf(q) >= 0) return 10; return 0;
  }
  function openPalette() {
    if (!pal) {
      pal = mk('div', 'pal', '<div class="pal-box" role="dialog" aria-modal="true" aria-label="Search"><div class="pal-in">' + ICON.search + '<input type="text" placeholder="Search topics, sections, terms, tools..." aria-label="Search"><kbd>Esc</kbd></div><div class="pal-list" role="listbox"></div><div class="pal-ft"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Enter</kbd> with no match: search inside every note</span></div></div>');
      document.body.appendChild(pal);
      pal.addEventListener('click', e => { if (e.target === pal) closePalette(); });
      const inp = $('input', pal);
      inp.addEventListener('input', () => { palSel = 0; drawPal(); });
      inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length, palSel + 1); drawPal(true); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); drawPal(true); }
        else if (e.key === 'Enter') { e.preventDefault(); pick(palSel); }
        else if (e.key === 'Escape') closePalette();
      });
    }
    const api = A(); if (api && !openPalette.loaded) { openPalette.loaded = true; Promise.all(api.M().topics.filter(t => t.status === 'ready').map(t => api.loadTopic(t.id).catch(() => null))).then(() => { if (pal.classList.contains('open')) drawPal(); }); }
    pal.classList.add('open'); const inp = $('input', pal); inp.value = ''; palSel = 0; drawPal(); setTimeout(() => inp.focus(), 10);
  }
  function closePalette() { if (pal) pal.classList.remove('open'); }
  function drawPal(keep) {
    const q = $('input', pal).value.trim().toLowerCase();
    const all = sourceItems().map(it => ({ it, s: score(it, q) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    const seen = {}; palItems = []; all.forEach(x => { const key = x.it.t + '|' + (x.it.href || x.it.go); if (!seen[key] && palItems.length < 9) { seen[key] = 1; palItems.push(x.it); } });
    const list = $('.pal-list', pal); list.innerHTML = '';
    palItems.forEach((it, i) => { const r = mk('div', 'pal-r' + (i === palSel ? ' sel' : ''), '<span class="pk">' + esc(it.k) + '</span><b>' + esc(it.t) + '</b>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : ''), { role: 'option' }); r.addEventListener('mouseenter', () => { palSel = i; $$('.pal-r', list).forEach((x, j) => x.classList.toggle('sel', j === i)); }); r.addEventListener('click', () => pick(i)); list.appendChild(r); });
    if (q) { const r = mk('div', 'pal-r all' + (palSel === palItems.length ? ' sel' : ''), '<span class="pk">Full text</span><b>Search every note and PYQ for “' + esc(q) + '”</b>'); r.addEventListener('click', () => pick(palItems.length)); list.appendChild(r); }
    if (keep) { const s = $('.pal-r.sel', list); if (s) s.scrollIntoView({ block: 'nearest' }); }
  }
  function pick(i) {
    const q = $('input', pal).value.trim(); const it = palItems[i]; closePalette();
    if (it) { if (it.go && A()) A().go(it.go[0], it.go[1]); else location.hash = it.href.slice(1); return; }
    if (q) { const si = $('#search-input'), f = $('#search-form'); if (si && f) { si.value = q; f.dispatchEvent(new Event('submit', { cancelable: true })); } }
  }
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '') && !(e.target && e.target.isContentEditable)) { e.preventDefault(); openPalette(); }
  });

  /* ================= sidebar ================= */
  function polishSide() {
    const s = $('#side'); if (!s || s.__busy) return; s.__busy = true;
    $$('a.tlink', s).forEach(a => {
      const m = /#t-(.+)$/.exec(a.getAttribute('href') || '');
      if (!m) { a.classList.add('tool-link'); return; }
      if (a.querySelector('.sring')) return;
      const p = pct(m[1]); const sm = $('small', a); if (sm) sm.classList.add('blurb');
      $$('.badge', a).forEach(b => { if (b.classList.contains('ready')) b.remove(); });
      a.insertAdjacentHTML('afterbegin', '<span class="sring" title="' + p + '% done">' + ring(p, 22, color(m[1])) + '</span>');
    });
    $$('h4', s).forEach(h => { if (/^(Tools|Learn and revise)$/.test(h.textContent.trim())) h.classList.add('tool-link'); });
    s.__busy = false;
  }
  function watchSide() { const s = $('#side'); if (!s) return; new MutationObserver(() => { if (!s.__busy) polishSide(); }).observe(s, { childList: true }); polishSide(); }

  /* ================= topic page ================= */
  function topic(t, col, meta) {
    const a = A(); if (!a || !col) return;
    const hero = $('.hero', col), path = $('.pathbar', col), rd = $('.readiness', col);
    const secs = t.sections, find = f => secs.find(f);
    const learnFirst = find(s => s.id !== 'orient' && !s.kind) || secs[0];
    const pyqSec = find(s => s.kind === 'pyq'), testSec = find(s => s.kind === 'test');
    const remSec = find(s => s.id === 'remember'), csSec = find(s => s.id === 'cheatsheet');
    const C = (window.COUNTS || {})[t.id] || {};
    const total = secs.reduce((m, s) => m + (window.Study ? window.Study.readMin(t, s) : 0), 0);
    const r = window.Study ? window.Study.readiness(t) : { pct: 0, read: 0, nSec: secs.length, secure: 0, nQ: 0, solved: 0, np: 0 };
    const c = color(t.id);
    const L = ls.get('mltq.last', null), resume = L && L.topic === t.id && L.sec && document.getElementById(L.sec) ? L.sec : null;
    const head = mk('header', 'th', null, { style: '--tc:' + c });
    head.innerHTML = '<nav class="crumb"><a href="#hub">Courses</a><span>/</span><a href="' + (meta.course === 'q1' ? '#q1' : '#home') + '">' + (meta.course === 'q1' ? 'Quiz 1' : 'Quiz 2') + '</a><span>/</span><span>Topic ' + esc(meta.n) + '</span></nav>' +
      '<div class="th-main"><div class="th-txt"><h1>' + esc(t.title) + '</h1><p class="th-tag">' + t.tagline + '</p>' +
      '<div class="th-meta"><span><b>' + secs.length + '</b> sections</span><span><b>' + (t.pyqs || []).length + '</b> past questions</span><span><b>' + (C.marks || 0) + '</b> marks</span>' + (total ? '<span>about <b>' + (total >= 60 ? Math.floor(total / 60) + ' h ' + (total % 60) + ' min' : total + ' min') + '</b></span>' : '') + '</div>' +
      '<div class="th-cta"></div></div>' +
      '<div class="th-prog">' + ring(r.pct, 96, c) + '<div class="th-pct"><b>' + r.pct + '%</b><small>ready</small></div><ul><li><span>Notes read</span><b>' + r.read + '/' + r.nSec + '</b></li><li><span>Checks right</span><b>' + r.secure + '/' + r.nQ + '</b></li><li><span>PYQs solved</span><b>' + r.solved + '/' + r.np + '</b></li></ul></div></div>';
    const cta = $('.th-cta', head);
    const b1 = mk('button', 'btn pri', (resume ? 'Continue reading' : 'Start reading') + ICON.arrow); b1.addEventListener('click', () => a.scrollToId(resume || ('sec-' + learnFirst.id)));
    cta.appendChild(b1);
    if (pyqSec) { const b2 = mk('button', 'btn ghost', 'Practise ' + (t.pyqs || []).length + ' PYQs'); b2.addEventListener('click', () => a.scrollToId('sec-' + pyqSec.id)); cta.appendChild(b2); }
    cta.appendChild(mk('a', 'btn ghost', 'Flashcards', { href: '#cards-' + t.id }));
    /* keep the engine's progress hook alive */
    const bar = document.getElementById('topic-bar'), btx = document.getElementById('topic-bar-txt');
    const keep = mk('div', 'th-hidden', null, { hidden: '' }); if (bar) keep.appendChild(bar.parentNode); if (btx) keep.appendChild(btx); head.appendChild(keep);
    /* tabs */
    const tabs = [['Overview', 'atlas'], ['Learn', 'sec-' + learnFirst.id], pyqSec && ['Practice', 'sec-' + pyqSec.id], testSec && ['Test', 'sec-' + testSec.id], remSec && ['Remember', 'sec-' + remSec.id], csSec && ['Cheatsheet', 'sec-' + csSec.id]].filter(x => x && document.getElementById(x[1]));
    const tb = mk('nav', 'ttabs', null, { 'aria-label': 'Topic parts', style: '--tc:' + c });
    tabs.forEach(x => { const b = mk('button', '', x[0], { 'data-to': x[1], type: 'button' }); b.addEventListener('click', () => a.scrollToId(x[1])); tb.appendChild(b); });
    tb.appendChild(mk('div', 'ttabs-bar', '<i></i>'));
    const first = hero || col.firstChild;
    col.insertBefore(head, first); col.insertBefore(tb, head.nextSibling);
    [hero, path, rd].forEach(n => { if (n && n.parentNode) n.remove(); });
    /* scroll tracking: active tab, reading bar, remember position */
    const order = tabs.map(x => document.getElementById(x[1]));
    const barI = $('.ttabs-bar i', tb);
    let ticking = false;
    function onScroll() {
      ticking = false; if (!document.body.contains(tb)) { window.removeEventListener('scroll', handler); return; }
      const y = 140; let idx = 0; order.forEach((n, i) => { if (n && n.getBoundingClientRect().top < y) idx = i; });
      $$('button', tb).forEach((b, i) => b.classList.toggle('on', i === idx));
      const docH = document.documentElement.scrollHeight - innerHeight; barI.style.width = (docH > 0 ? Math.min(100, 100 * scrollY / docH) : 0) + '%';
      let curSec = null; $$('section.sec', col).forEach(sct => { if (sct.getBoundingClientRect().top < y) curSec = sct.id; });
      if (curSec) ls.set('mltq.last', { topic: t.id, sec: curSec, title: (($('h2', document.getElementById(curSec)) || {}).textContent || '').trim(), tt: t.title, at: Date.now() });
    }
    const handler = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    window.addEventListener('scroll', handler, { passive: true }); onScroll();
    /* section footer: next section */
    secs.forEach((s, i) => {
      const sct = document.getElementById('sec-' + s.id), nx = secs[i + 1]; if (!sct || !nx || $('.nextsec', sct)) return;
      const n = mk('button', 'nextsec', '<small>Next</small><b>' + esc(nx.title) + '</b>' + ICON.arrow, { type: 'button' });
      n.addEventListener('click', () => a.scrollToId('sec-' + nx.id)); sct.appendChild(n);
    });
  }

  /* ================= Quiz 2 home ================= */
  function home(c) {
    const a = A(); if (!a || !c) return;
    const old = ['.hero', '.tlist', '.tools'].map(s => $(s, c)); $$('h2.hh', c).forEach(h => { if (h.textContent.trim() === 'Tools') old.push(h); });
    const map = $('.atlas, .coursemap, .cmap', c);
    const ts = Q2(), leg = a.M().topics.filter(t => t.course !== 'q1' && t.legacy && t.status === 'ready');
    const tot = ts.reduce((s, t) => s + pct(t.id), 0), overall = ts.length ? Math.round(tot / ts.length) : 0;
    const marks = ts.reduce((s, t) => s + (((window.COUNTS || {})[t.id] || {}).marks || 0), 0), nq = ts.reduce((s, t) => s + (((window.COUNTS || {})[t.id] || {}).pyqs || 0), 0);
    const L = ls.get('mltq.last', null), Lt = L && ts.find(t => t.id === L.topic);
    const next = ts.find(t => pct(t.id) < 100) || ts[0];
    const head = mk('section', 'hhead');
    head.innerHTML = '<div class="hh-txt"><div class="kicker">Quiz 2 · Weeks 5 to 8</div><h1>Regression to cross-validation</h1><p>Seven topics, ' + nq + ' past-year questions worth ' + marks + ' marks, each solved step by step. Learn in order, check yourself after every idea, and practise every question before opening its solution.</p></div>' +
      '<div class="hh-prog">' + ring(overall, 120, 'var(--pen)') + '<div><b>' + overall + '%</b><small>course progress</small></div></div>';
    const cont = mk('section', 'cont');
    if (Lt) { cont.innerHTML = '<div><small>Continue where you left off</small><b>' + esc(L.title || Lt.title) + '</b><span>' + esc(Lt.title) + '</span></div>'; const b = mk('button', 'btn pri', 'Resume' + ICON.arrow); b.addEventListener('click', () => a.go(L.topic, L.sec)); cont.appendChild(b); }
    else if (next) { cont.innerHTML = '<div><small>Start here</small><b>' + esc(next.title) + '</b><span>Topic ' + esc(next.n) + ' of ' + ts.length + '. Begin with the big picture, then read in order.</span></div>'; cont.appendChild(mk('a', 'btn pri', 'Start' + ICON.arrow, { href: '#t-' + next.id })); }
    const grid = mk('section', 'tgrid');
    grid.innerHTML = '<div class="sh"><h2>Topics</h2><span>In the order to learn them</span></div>';
    const g = mk('div', 'tg');
    ts.concat(leg).forEach(t => {
      const p = pct(t.id), C = (window.COUNTS || {})[t.id] || {}, G = (window.GUIDE || {})[t.id] || {};
      g.appendChild(mk('a', 'tc' + (t.legacy ? ' leg' : ''), '<div class="tc-top"><span class="tc-n">' + (t.legacy ? 'Legacy' : String(t.n).padStart(2, '0')) + '</span>' + ring(p, 30, color(t.id)) + '</div><b>' + esc(t.title.replace(/^Legacy: /, '')) + '</b><small>' + esc(G.one ? G.one.replace(/<[^>]+>/g, '').replace(/\$[^$]*\$/g, '').slice(0, 110).replace(/\s+\S*$/, '') + '…' : t.blurb) + '</small><div class="tc-ft"><span>' + (C.pyqs || 0) + ' PYQs</span><span>' + (C.marks || 0) + ' marks</span><span>' + p + '%</span></div>', { href: '#t-' + t.id, style: '--tc:' + color(t.id) }));
    });
    grid.appendChild(g);
    const first = c.firstChild;
    c.insertBefore(head, first); c.insertBefore(cont, first); c.insertBefore(grid, first);
    old.forEach(n => { if (n && n.parentNode) n.remove(); });
    const kit = $('.stkit', c); if (kit) { kit.classList.add('kit-compact'); const kr = $('.kitrd', kit); if (kr) kr.remove(); c.insertBefore(kit, (map || grid).nextSibling); }
    if (map) c.insertBefore(map, grid.nextSibling);
    Promise.all(ts.map(t => a.loadTopic(t.id).catch(() => null))).then(() => {
      if (!document.body.contains(g)) return;
      $$('.tc', g).forEach(card => { const id = card.getAttribute('href').slice(3), p = pct(id); const r = $('.ring', card); if (r) r.outerHTML = ring(p, 30, color(id)); const l = $('.tc-ft span:last-child', card); if (l) l.textContent = p + '%'; });
      const all = ts.map(t => pct(t.id)), o = all.length ? Math.round(all.reduce((x, y) => x + y, 0) / all.length) : 0;
      const hp = $('.hh-prog', head); if (hp) hp.innerHTML = ring(o, 120, 'var(--pen)') + '<div><b>' + o + '%</b><small>course progress</small></div>';
      const sd = $('#side'); if (sd) $$('.sring', sd).forEach(sp => sp.remove()); polishSide();
    });
  }

  /* ================= boot ================= */
  function boot() { buildHeader(); watchSide(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.Shell = { topic, home, openPalette, ring, pct };
})();
