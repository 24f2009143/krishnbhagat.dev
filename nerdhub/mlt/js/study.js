/* Study layer: plan, flashcards, glossary, refreshers, last-night sheets, readiness, read times, hover definitions. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = () => window.STUDY || { glossary: [], refreshers: [], moves: {} };
  const G = () => window.GUIDE || {};
  const A = () => (window.MLTQ && window.MLTQ.api) || null;
  const ls = {
    get(k, d) { try { const v = window.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const clean = t => String(t == null ? '' : t).replace(/\s*\[(ADDED|SRC|DERIVED|FLAG)[^\]]*\]/g, '').trim();
  const mk = (tag, cls, inner, attrs) => { const n = document.createElement(tag); if (cls) n.className = cls; if (inner != null) n.innerHTML = inner; if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k])); return n; };
  const math = root => { const a = A(); if (a && a.renderMath) a.renderMath(root); };
  const fmtMin = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');

  /* ---------- topic helpers ---------- */
  function q2Topics() { const a = A(); return a.M().topics.filter(t => t.course !== 'q1' && t.status === 'ready' && !t.legacy && G()[t.id]); }
  function loadAll() { const a = A(); return Promise.all(q2Topics().map(t => a.loadTopic(t.id))).then(ts => ts.filter(Boolean).map(t => { if (window.Guide) window.Guide.augment(t); return t; })); }
  const plainText = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent || ''; };
  const cache = new WeakMap();
  function readMin(topic, s) {
    if (cache.has(s)) return cache.get(s);
    let m;
    if (s.kind === 'pyq') m = (topic.pyqs || []).length * 6;
    else if (s.kind === 'test') m = Math.round((topic.test || []).length * 1.5);
    else if (s.kind === 'checklist') m = 3;
    else {
      const words = plainText(s.html).split(/\s+/).filter(Boolean).length;
      const worked = ((s.html || '').match(/class="worked/g) || []).length;
      m = Math.max(1, Math.round(words / 150 + worked));
    }
    cache.set(s, m); return m;
  }
  const nQuiz = s => (s.quiz || []).length;
  function marksByConcept(t) { const o = {}; (t.pyqs || []).forEach(p => { o[p.concept] = (o[p.concept] || 0) + (p.marks || 0); }); return o; }
  function topPyqs(t, n) {
    const mc = marksByConcept(t);
    return (t.pyqs || []).slice().sort((a, b) => (mc[b.concept] - mc[a.concept]) || (b.marks - a.marks)).slice(0, n);
  }

  /* ---------- readiness ---------- */
  function readiness(topic) {
    const a = A(), T = a.TS(topic.id);
    const nSec = topic.sections.length, read = Object.keys(T.read).filter(k => topic.sections.some(s => s.id === k)).length;
    const qids = []; topic.sections.forEach(s => (s.quiz || []).forEach(q => qids.push(q.id))); (topic.test || []).forEach(q => qids.push(q.id));
    const secure = qids.filter(id => { const q = T.q[id]; return q && q.last === 1 && q.conf === 'Sure'; }).length;
    const np = (topic.pyqs || []).length, solved = Object.keys(T.pyq).filter(k => T.pyq[k].status === 'correct').length;
    const pct = Math.round(100 * (0.2 * (nSec ? read / nSec : 0) + 0.4 * (qids.length ? secure / qids.length : 0) + 0.4 * (np ? solved / np : 0)));
    return { pct, read, nSec, secure, nQ: qids.length, solved, np };
  }
  const bar = (label, n, d) => '<div class="rd-b"><span>' + label + ' <b>' + n + '/' + d + '</b></span><i><u style="width:' + (d ? Math.round(100 * n / d) : 0) + '%"></u></i></div>';
  function readinessHTML(r) {
    return '<div class="rd-n"><b>' + r.pct + '%</b><small>readiness</small></div><div class="rd-bars">' + bar('Notes read', r.read, r.nSec) + bar('Checks secure', r.secure, r.nQ) + bar('PYQs solved', r.solved, r.np) + '</div>';
  }

  /* ---------- tooltips (hover definitions) ---------- */
  let TERMS = null, TRE = null;
  function buildTerms() {
    if (TERMS) return; TERMS = {}; const alts = [];
    D().glossary.forEach(g => { if (g.auto === false) return; g.a.forEach(al => { TERMS[al.toLowerCase()] = g.k; alts.push(al.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }); });
    alts.sort((x, y) => y.length - x.length);
    TRE = new RegExp('(^|[^A-Za-z0-9_$\\\\])(' + alts.join('|') + ')(?![A-Za-z0-9_])', 'gi');
  }
  const SKIP = '.katex, .katex-display, code, pre, a, button, h1, h2, h3, h4, h5, summary, .gl, .qz, .tag, .pyq, .sol, .pb, .atlas, .eyebrow, .bt, input, textarea, select, svg, script, style, .testout, .secnav, th';
  function linkTerms(root, max) {
    buildTerms(); const used = {}; let count = 0; max = max || 7;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) { if (!n.nodeValue || n.nodeValue.trim().length < 3) return NodeFilter.FILTER_REJECT; const p = n.parentElement; if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } });
    const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if (count >= max) return;
      const txt = node.nodeValue; TRE.lastIndex = 0; let m, last = 0, frag = null;
      while ((m = TRE.exec(txt))) {
        const key = TERMS[m[2].toLowerCase()]; if (!key || used[key] || count >= max) continue;
        used[key] = 1; count++;
        const start = m.index + m[1].length;
        frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(txt.slice(last, start)));
        const sp = mk('span', 'gl', null, { tabindex: '0', 'data-g': key, role: 'button', 'aria-label': 'Definition of ' + m[2] }); sp.textContent = txt.slice(start, start + m[2].length);
        frag.appendChild(sp); last = start + m[2].length;
      }
      if (frag) { frag.appendChild(document.createTextNode(txt.slice(last))); node.parentNode.replaceChild(frag, node); }
    });
  }
  let pop = null, popFor = null, hideT = null;
  function showPop(sp) {
    const g = D().glossary.find(x => x.k === sp.getAttribute('data-g')); if (!g) return;
    clearTimeout(hideT);
    if (!pop) { pop = mk('div', 'glpop'); pop.setAttribute('role', 'tooltip'); document.body.appendChild(pop); pop.addEventListener('mouseenter', () => clearTimeout(hideT)); pop.addEventListener('mouseleave', hidePop); }
    pop.innerHTML = '<b>' + esc(g.t) + '</b><p>' + g.d + '</p>' + (g.ex ? '<p class="gx"><i>Example.</i> ' + g.ex + '</p>' : '') + '<a href="#glossary-' + g.k + '">Open in glossary →</a>';
    pop.style.display = 'block'; popFor = sp; math(pop);
    const r = sp.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 16);
    pop.style.width = pw + 'px';
    let left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2));
    pop.style.left = left + 'px';
    const h = pop.offsetHeight; let top = r.bottom + 8; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    pop.style.top = top + 'px';
  }
  function hidePop() { hideT = setTimeout(() => { if (pop) pop.style.display = 'none'; popFor = null; }, 160); }
  function initPop() {
    if (window.__glInit) return; window.__glInit = true;
    document.addEventListener('mouseover', e => { const sp = e.target.closest && e.target.closest('.gl'); if (sp) showPop(sp); });
    document.addEventListener('mouseout', e => { const sp = e.target.closest && e.target.closest('.gl'); if (sp) hidePop(); });
    document.addEventListener('focusin', e => { const sp = e.target.closest && e.target.closest('.gl'); if (sp) showPop(sp); });
    document.addEventListener('focusout', e => { const sp = e.target.closest && e.target.closest('.gl'); if (sp) hidePop(); });
    document.addEventListener('click', e => { const sp = e.target.closest && e.target.closest('.gl'); if (sp) { if (popFor === sp && pop && pop.style.display === 'block') { pop.style.display = 'none'; popFor = null; } else showPop(sp); return; } if (pop && !e.target.closest('.glpop')) { pop.style.display = 'none'; popFor = null; } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop) { pop.style.display = 'none'; popFor = null; } });
    window.addEventListener('hashchange', () => { if (pop) pop.style.display = 'none'; });
  }

  /* ---------- decorate a topic page ---------- */
  const NEEDS = { 'linear-regression': ['notation', 'calculus', 'matrices'], 'ridge-lasso-map': ['matrices', 'distance', 'probability'], 'kernel-regression': ['matrices', 'notation'], 'knn': ['distance', 'notation'], 'decision-trees': ['logs', 'notation'], 'naive-bayes': ['probability', 'logs'], 'cross-validation': ['notation', 'distance'] };
  function decorate(topic, col) {
    initPop();
    topic.sections.forEach(s => {
      const sec = document.getElementById('sec-' + s.id); if (!sec) return;
      const ey = $('.eyebrow', sec); const m = readMin(topic, s), q = nQuiz(s);
      if (ey && !ey.getAttribute('data-rt')) { ey.setAttribute('data-rt', '1'); ey.textContent += ' · about ' + fmtMin(m) + (q ? ' + ' + q + ' check question' + (q > 1 ? 's' : '') : ''); }
      const why = $('.why', sec), qz = $('.qz', sec);
      if (why && qz && !$('.testout', why)) { const a = mk('a', 'testout', 'Already know this? Try the check first ↓', { href: '#' }); a.addEventListener('click', e => { e.preventDefault(); qz.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); why.appendChild(a); }
      if (s.kind !== 'pyq' && s.kind !== 'test' && s.kind !== 'checklist') { const body = $('.secbody', sec); if (body) linkTerms(body, 7); }
    });
    /* refreshers hint in the prerequisite section */
    const pre = document.getElementById('sec-prereq');
    if (pre && NEEDS[topic.id]) {
      const R = D().refreshers; const links = NEEDS[topic.id].map(id => { const r = R.find(x => x.id === id); return r ? '<a href="#refresh-' + r.id + '">' + r.icon + ' ' + esc(r.t) + '</a>' : ''; }).join(' ');
      const b = $('.secbody', pre); if (b && !$('.rusty', b)) b.insertBefore(mk('div', 'box tip rusty', '<div class="bt">Rusty on the maths?</div>Two-minute refreshers with practice questions: ' + links + '. Dotted words in the text show a plain-English definition when you hover or tap them.'), b.firstChild);
    }
    /* readiness card */
    const at = $('.atlas', col) || $('section.sec', col);
    const card = mk('section', 'readiness'); const draw = () => { card.innerHTML = '<div class="rd-h"><b>Your progress on this topic</b><small>Counts only what you have done on this device.</small></div><div class="rd-body">' + readinessHTML(readiness(topic)) + '</div><div class="rd-links"><a class="btn small" href="#cards-' + topic.id + '">🃏 Flashcards</a><a class="btn small sec" href="#revise-' + topic.id + '">🌙 Last-night sheet</a><a class="btn small sec" href="#plan">🗓️ Study plan</a><a class="btn small sec" href="#glossary">📖 Glossary</a></div>'; };
    draw(); if (at) col.insertBefore(card, at); else col.appendChild(card);
    if (!window.__rdHooked) { window.__rdHooked = true; window.addEventListener('mltq-saved', () => { const c = $('.readiness'); if (c && c.__draw) c.__draw(); }); }
    card.__draw = draw;
    math(col);
  }

  /* ---------- page shell ---------- */
  const NAV = [['plan', '🗓️', 'Study plan'], ['cards', '🃏', 'Flashcards'], ['glossary', '📖', 'Glossary'], ['refresh', '🧮', 'Maths refreshers'], ['revise', '🌙', 'Last night']];
  function nav(active) { return '<nav class="stnav" aria-label="Study tools">' + NAV.map(n => '<a class="' + (n[0] === active ? 'on' : '') + '" href="#' + n[0] + '">' + n[1] + ' ' + n[2] + '</a>').join('') + '</nav>'; }
  function page(active, title, lead) {
    const a = A(); a.enter('study'); const m = a.main(); m.innerHTML = '';
    const c = mk('div', 'col study st-' + active, nav(active) + '<div class="hero"><div class="eyebrow">Study tools</div><h1>' + esc(title) + '</h1><p class="lead">' + lead + '</p></div>');
    m.appendChild(c); window.scrollTo(0, 0); return c;
  }

  /* ---------- plan ---------- */
  function topicModel(t) {
    const g = G()[t.id] || {}, a = A();
    const real = t.sections.filter(s => s.kind !== 'pyq' && s.kind !== 'test' && s.kind !== 'checklist' && s.id !== 'remember' && s.id !== 'cheatsheet');
    const keyIds = []; ((g.mind && g.mind.branches) || []).forEach(b => { if (b.sec && keyIds.indexOf(b.sec) < 0) keyIds.push(b.sec); });
    const key = real.filter(s => keyIds.indexOf(s.id) >= 0);
    const chs = t.sections.find(s => s.id === 'cheatsheet');
    const rem = t.sections.find(s => s.id === 'remember'), test = t.sections.find(s => s.kind === 'test');
    const deckN = deckFor([t]).length;
    const item = (key2, label, min, go, extra) => ({ key: t.id + ':' + key2, t: t.id, label, min, go, extra });
    const it = {
      big: item('big', 'Big picture: story and mind map', 3, [t.id, 'atlas']),
      secR: s => item('r-' + s.id, s.title.replace(/:.*/, ''), readMin(t, s), [t.id, 'sec-' + s.id]),
      sec: s => item('s-' + s.id, s.title.replace(/:.*/, ''), readMin(t, s) + nQuiz(s), [t.id, 'sec-' + s.id], nQuiz(s) ? 'read + ' + nQuiz(s) + ' check questions' : ''),
      rem: rem ? item('rem', 'Things to remember', readMin(t, rem), [t.id, 'sec-remember']) : null,
      chs: chs ? item('chs', 'Cheatsheet from the past questions', readMin(t, chs), [t.id, 'sec-cheatsheet']) : null,
      cards: item('cards', 'Flashcards: ' + deckN + ' cards', Math.max(2, Math.round(deckN / 4)), null, null),
      pyq: p => item('p-' + p.id, p.exam.replace(/ \(.*/, '') + ' ' + p.qno + ' (' + p.marks + ' marks)', 6, [t.id, 'pyq-' + p.id]),
      test: test ? item('test', 'Topic test', readMin(t, test), [t.id, 'sec-test']) : null
    };
    it.cards.href = '#cards-' + t.id;
    return { t, real, key, it };
  }
  function buildPlans(topics) {
    const M = topics.map(topicModel);
    const hour = M.map(m => ({ title: m.t.title, topic: m.t.id, items: [m.it.big, m.it.rem].filter(Boolean) }));
    hour.push({ title: 'Recall', items: [{ key: 'h:cards', label: 'Flashcards: all topics', min: 12, href: '#cards', extra: 'as many as fit' }] });
    const half = M.map(m => ({ title: m.t.title, topic: m.t.id, items: [m.it.big].concat(m.key.map(m.it.secR), [m.it.rem, m.it.chs]).filter(Boolean) }));
    half.push({ title: 'Finish', items: [{ key: 'half:cards', label: 'Flashcards: all topics', min: 15, href: '#cards' }, { key: 'half:mock', label: 'Timed mock test', min: 30, href: '#mock', extra: 'assumed 30 minutes' }] });
    const day = M.map(m => ({ title: m.t.title, topic: m.t.id, items: [m.it.big].concat(m.key.map(m.it.sec), [m.it.rem, m.it.chs], topPyqs(m.t, 2).map(m.it.pyq)).filter(Boolean) }));
    day.push({ title: 'Finish the day', items: [{ key: 'day:mock', label: 'Timed mock test', min: 30, href: '#mock', extra: 'assumed 30 minutes' }, { key: 'day:mist', label: 'Review your mistakes', min: 10, href: '#mistakes' }] });
    const by = id => M.find(m => m.t.id === id);
    const full = m => [m.it.big].concat(m.real.map(m.it.sec), [m.it.rem, m.it.chs, m.it.cards], (m.t.pyqs || []).map(m.it.pyq), [m.it.test]).filter(Boolean);
    const dayPlan = (title, ids) => ({ title, items: ids.reduce((acc, id) => acc.concat(by(id) ? full(by(id)) : []), []) });
    const week = [
      dayPlan('Day 1: Linear regression', ['linear-regression']), dayPlan('Day 2: Ridge, Lasso and MAP', ['ridge-lasso-map']),
      dayPlan('Day 3: Kernel regression and k-NN', ['kernel-regression', 'knn']), dayPlan('Day 4: Decision trees', ['decision-trees']),
      dayPlan('Day 5: Naive Bayes', ['naive-bayes']), dayPlan('Day 6: Cross-validation, then a mock test', ['cross-validation']),
      { title: 'Day 7: Mixed revision', items: [{ key: 'w7:mock', label: 'Timed mock test', min: 30, href: '#mock', extra: 'assumed 30 minutes' }, { key: 'w7:mist', label: 'Review your mistakes', min: 20, href: '#mistakes' }, { key: 'w7:cards', label: 'Flashcards: all topics', min: 20, href: '#cards' }, { key: 'w7:sheet', label: 'Read the last-night sheets', min: 30, href: '#revise' }] }
    ];
    week[5].items.push({ key: 'w6:mock', label: 'Timed mock test', min: 30, href: '#mock', extra: 'assumed 30 minutes' });
    return {
      hour: { name: 'I have 1 hour', blurb: 'Emergency mode. For each topic: the big picture (story, mind map, where the marks are), then the "things to remember" page. End with flashcards.', groups: hour },
      half: { name: 'I have half a day', blurb: 'Read only the key sections of each topic (the ones on the mind map), then its "things to remember" page. Finish with flashcards and a mock test.', groups: half },
      day: { name: 'I have 1 day', blurb: 'Key sections with their check questions, the "things to remember" page, and the two highest-mark past questions for every topic. Finish with a mock test and your mistakes.', groups: day },
      week: { name: 'I have 1 week', blurb: 'The full course in the order it is meant to be learned: every section, every flashcard, every past question, plus the topic test. One day for revision.', groups: week }
    };
  }
  function viewPlan() {
    const c = page('plan', 'Study plan', 'Tell it how much time you have and get an ordered list of what to do, with a time estimate for every step. Tick items as you go: your ticks are kept on this device.');
    c.appendChild(mk('p', 'notice', 'Loading your plan...'));
    loadAll().then(topics => {
      if (!$('.st-plan')) return;
      c.lastChild.remove();
      const plans = buildPlans(topics), done = ls.get('mltq.plan', {});
      const wrap = mk('div', 'plan'); c.appendChild(wrap);
      /* weakest topic */
      const marks = t => ((window.COUNTS || {})[t.id] || {}).marks || 1;
      const rs = topics.map(t => ({ t, r: readiness(t) })); const weak = rs.slice().sort((x, y) => marks(y.t) * (100 - y.r.pct) - marks(x.t) * (100 - x.r.pct))[0];
      wrap.appendChild(mk('div', 'box tip', '<div class="bt">Where to put your next hour</div>' + (weak && weak.r.pct < 100 ? 'Most marks still to win: <a href="#t-' + weak.t.id + '"><b>' + esc(weak.t.title) + '</b></a> (' + marks(weak.t) + ' PYQ marks, readiness ' + weak.r.pct + '%).' : 'Every topic is at full readiness on this device.')));
      const rd = mk('div', 'rdgrid'); rs.forEach(x => rd.appendChild(mk('a', 'rdc', '<div class="rdc-t"><b>' + esc(x.t.title) + '</b><span>' + x.r.pct + '%</span></div><i><u style="width:' + x.r.pct + '%"></u></i>', { href: '#t-' + x.t.id }))); wrap.appendChild(rd);
      const tabs = mk('div', 'ptabs', '', { role: 'tablist' }); wrap.appendChild(tabs); const host = mk('div', 'pbody'); wrap.appendChild(host);
      let cur = ls.get('mltq.plan.tab', 'day');
      const total = g => g.reduce((s, x) => s + x.items.reduce((a, i) => a + i.min, 0), 0);
      function draw() {
        tabs.innerHTML = ''; Object.keys(plans).forEach(k => { const b = mk('button', 'ptab' + (k === cur ? ' on' : ''), esc(plans[k].name) + '<small>about ' + fmtMin(total(plans[k].groups)) + '</small>'); b.addEventListener('click', () => { cur = k; ls.set('mltq.plan.tab', k); draw(); }); tabs.appendChild(b); });
        const P = plans[cur], all = P.groups.reduce((a, g) => a.concat(g.items), []);
        const dm = all.filter(i => done[cur + ':' + i.key]).reduce((s, i) => s + i.min, 0), tm = all.reduce((s, i) => s + i.min, 0);
        host.innerHTML = '<p class="lead">' + P.blurb + '</p><div class="pprog"><i><u style="width:' + (tm ? Math.round(100 * dm / tm) : 0) + '%"></u></i><span>' + fmtMin(dm) + ' done of ' + fmtMin(tm) + '</span></div><p class="notice">Estimates assume about 150 words a minute for notes, 1 minute per check question and 6 minutes per past-year question (attempt and read the solution). Your pace may differ.</p>';
        P.groups.forEach(g => {
          const gm = g.items.reduce((s, i) => s + i.min, 0), gd = g.items.filter(i => done[cur + ':' + i.key]).length;
          const box = mk('section', 'pg'), h = mk('h3', '', esc(g.title) + '<small>' + fmtMin(gm) + ' · ' + gd + '/' + g.items.length + ' done</small>'); box.appendChild(h);
          const ul = mk('ul', 'pl'); g.items.forEach(i => {
            const li = mk('li', done[cur + ':' + i.key] ? 'on' : '');
            const cb = mk('input', '', null, { type: 'checkbox', 'aria-label': 'Done: ' + i.label }); cb.checked = !!done[cur + ':' + i.key];
            cb.addEventListener('change', () => { if (cb.checked) done[cur + ':' + i.key] = 1; else delete done[cur + ':' + i.key]; ls.set('mltq.plan', done); draw(); });
            const a = mk('a', '', esc(i.label), { href: i.href || '#t-' + i.t });
            if (i.go) a.addEventListener('click', e => { e.preventDefault(); A().go(i.go[0], i.go[1]); });
            li.append(cb, a, mk('span', 'pm', (i.extra ? esc(i.extra) + ' · ' : '') + fmtMin(i.min)));
            ul.appendChild(li);
          }); box.appendChild(ul); host.appendChild(box);
        });
      }
      draw();
    });
  }

  /* ---------- flashcards ---------- */
  function deckFor(topics) {
    const out = [];
    topics.forEach(t => {
      const g = G()[t.id]; if (!g) return;
      Object.keys(g.secs || {}).forEach(sid => { const s = g.secs[sid]; if (s.q && s.remember && s.remember.length) out.push({ id: t.id + ':s:' + sid, topic: t.id, tag: 'Idea', f: s.q, b: (s.plain ? '<p><i>' + s.plain + '</i></p>' : '') + '<ul>' + s.remember.map(x => '<li>' + x + '</li>').join('') + '</ul>' }); });
      ((g.end && g.end.cues) || []).forEach((r, i) => out.push({ id: t.id + ':c:' + i, topic: t.id, tag: 'Wording → move', f: 'If the question says: <b>' + r[0] + '</b>. What do you do first?', b: r[1] }));
      ((D().moves[t.id]) || []).forEach((r, i) => out.push({ id: t.id + ':m:' + i, topic: t.id, tag: 'Exam move', f: 'Exam type: <b>' + r[0] + '</b>. Fast method?', b: '<p>' + r[1] + '</p><p class="mv-c"><b>Check:</b> ' + r[3] + ' <span class="pm">(about ' + r[2] + ')</span></p>' }));
      (t.formulas || []).forEach((f, i) => out.push({ id: t.id + ':f:' + i, topic: t.id, tag: 'Formula', f: 'Write the formula: <b>' + clean(f.name) + '</b>', b: '<div>$$' + f.tex + '$$</div>' + (f.note ? '<p>' + clean(f.note) + '</p>' : '') }));
    });
    return out;
  }
  const DAYS = [0, 1, 2, 4, 8, 16];
  function viewCards(only) {
    const c = page('cards', 'Flashcards', 'Active recall beats re-reading. Try to answer in your head first, then flip. Cards you miss come back sooner; cards you know come back later (day 1, 2, 4, 8, 16).');
    c.appendChild(mk('p', 'notice', 'Building your deck...'));
    loadAll().then(topics => {
      if (!$('.st-cards')) return; c.lastChild.remove();
      const state = ls.get('mltq.fc', {}); let scope = only && topics.some(t => t.id === only) ? only : 'all';
      const chips = mk('div', 'fcchips'); c.appendChild(chips); const stats = mk('div', 'fcstats'); c.appendChild(stats); const area = mk('div', 'fcarea'); c.appendChild(area);
      function pool() { const ts = scope === 'all' ? topics : topics.filter(t => t.id === scope); return deckFor(ts); }
      function statsOf(cards) { const now = Date.now(); let nw = 0, due = 0, ms = 0; cards.forEach(cd => { const s = state[cd.id]; if (!s) nw++; else if (s.due <= now) due++; if (s && s.b >= 3) ms++; }); return { nw, due, ms, n: cards.length }; }
      function drawChips() { chips.innerHTML = ''; [['all', 'All topics']].concat(topics.map(t => [t.id, t.title.replace(/ and .*| \(.*/, '')])).forEach(x => { const b = mk('button', 'fcchip' + (x[0] === scope ? ' on' : ''), esc(x[1])); b.addEventListener('click', () => { scope = x[0]; drawChips(); start(); }); chips.appendChild(b); }); }
      let queue = [], idx = 0, flipped = false, again = 0, got = 0;
      function start() {
        const cards = pool(), st = statsOf(cards), now = Date.now();
        stats.innerHTML = '<span><b>' + st.n + '</b> cards</span><span><b>' + st.nw + '</b> new</span><span><b>' + st.due + '</b> due</span><span><b>' + st.ms + '</b> well known</span>';
        const due = cards.filter(cd => state[cd.id] && state[cd.id].due <= now), nw = cards.filter(cd => !state[cd.id]);
        const shuf = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
        queue = shuf(due).concat(shuf(nw)).slice(0, 20); idx = 0; flipped = false; again = 0; got = 0; show();
      }
      function show() {
        area.innerHTML = '';
        if (!queue.length || idx >= queue.length) {
          area.appendChild(mk('div', 'fcdone', queue.length ? '<h3>Session done</h3><p>Got it: <b>' + got + '</b> · Again: <b>' + again + '</b></p>' : '<h3>Nothing due</h3><p>Every card in this set is scheduled for later. Come back tomorrow, or pick another topic.</p>'));
          const b = mk('button', 'btn', 'Study 20 more'); b.addEventListener('click', start); if (queue.length) area.lastChild.appendChild(b); return;
        }
        const cd = queue[idx], t = topics.find(x => x.id === cd.topic), g = G()[cd.topic] || {};
        const card = mk('div', 'fcard', '<div class="fc-top"><span class="fc-tag">' + esc(cd.tag) + '</span><span>' + esc(t ? t.title : '') + '</span><span>' + (idx + 1) + ' / ' + queue.length + '</span></div><div class="fc-f">' + cd.f + '</div><div class="fc-b" hidden>' + cd.b + '</div>', { id: 'fc-card', style: '--tc:' + (g.color || '#2563eb') });
        const row = mk('div', 'fcrow'); const flip = mk('button', 'btn', 'Show answer (space)');
        const ag = mk('button', 'btn sec no', 'Again (←)'), ok = mk('button', 'btn yes', 'Got it (→)'); ag.hidden = ok.hidden = true;
        flip.addEventListener('click', () => { flipped = true; $('.fc-b', card).hidden = false; flip.hidden = true; ag.hidden = ok.hidden = false; math(card); });
        const rate = good => { const s = state[cd.id] || { b: 0 }; if (good) { s.b = Math.min(5, s.b + 1); s.due = Date.now() + DAYS[s.b] * 864e5; got++; } else { s.b = 0; s.due = Date.now(); again++; queue.push(cd); } state[cd.id] = s; ls.set('mltq.fc', state); idx++; flipped = false; const st = statsOf(pool()); stats.innerHTML = '<span><b>' + st.n + '</b> cards</span><span><b>' + st.nw + '</b> new</span><span><b>' + st.due + '</b> due</span><span><b>' + st.ms + '</b> well known</span>'; show(); };
        ag.addEventListener('click', () => rate(false)); ok.addEventListener('click', () => rate(true));
        row.append(flip, ag, ok); area.append(card, row); math(card);
        window.__fcKeys = e => { if (!$('#fc-card')) return; if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === ' ' || e.key === 'Enter') { if (!flipped) { e.preventDefault(); flip.click(); } } else if (flipped && e.key === 'ArrowRight') ok.click(); else if (flipped && e.key === 'ArrowLeft') ag.click(); };
      }
      if (!window.__fcBound) { window.__fcBound = true; document.addEventListener('keydown', e => { if (window.__fcKeys) window.__fcKeys(e); }); }
      drawChips(); start();
    });
  }

  /* ---------- glossary ---------- */
  function viewGlossary(focus) {
    const c = page('glossary', 'Glossary', 'Every term used in Quiz 2, in plain English, with a tiny example. Words with a dotted underline in the notes show these definitions when you hover or tap them.');
    const gl = D().glossary.slice().sort((a, b) => a.t.localeCompare(b.t));
    const names = { 'linear-regression': 'Linear regression', 'ridge-lasso-map': 'Ridge, Lasso, MAP', 'kernel-regression': 'Kernel regression', 'knn': 'k-NN', 'decision-trees': 'Decision trees', 'naive-bayes': 'Naive Bayes', 'cross-validation': 'Cross-validation' };
    const q = mk('input', 'glq', null, { type: 'search', placeholder: 'Filter terms (for example: entropy, kernel, bias)', 'aria-label': 'Filter glossary' }); c.appendChild(q);
    const list = mk('div', 'gllist'); c.appendChild(list);
    function draw(f) {
      list.innerHTML = ''; let n = 0, lastL = '';
      gl.filter(g => !f || (g.t + ' ' + g.d + ' ' + g.a.join(' ')).toLowerCase().indexOf(f) >= 0).forEach(g => {
        const L = g.t[0].toUpperCase(); if (L !== lastL) { list.appendChild(mk('h2', 'gll', L)); lastL = L; }
        const e = mk('article', 'gle', '<h3>' + esc(g.t) + '</h3><p>' + g.d + '</p>' + (g.ex ? '<p class="gx"><i>Example.</i> ' + g.ex + '</p>' : '') + '<div class="gtp">Used in: ' + (g.tp || []).map(t => '<a href="#t-' + t + '">' + names[t] + '</a>').join(' ') + '</div>', { id: 'gl-' + g.k }); list.appendChild(e); n++;
      });
      if (!n) list.appendChild(mk('p', 'notice', 'No term matches. Try the search box at the top of the page to search all notes.'));
      math(list);
    }
    q.addEventListener('input', () => draw(q.value.trim().toLowerCase())); draw('');
    if (focus) { const e = document.getElementById('gl-' + focus); if (e) { e.classList.add('flash'); setTimeout(() => e.scrollIntoView({ block: 'center' }), 60); } }
  }

  /* ---------- refreshers ---------- */
  function miniQuiz(host, qs, rid) {
    let n = 0, right = 0;
    function show() {
      host.innerHTML = '';
      if (n >= qs.length) { const sc = ls.get('mltq.ref', {}); sc[rid] = Math.max(sc[rid] || 0, right); ls.set('mltq.ref', sc); host.appendChild(mk('div', 'mq-done', '<b>Score: ' + right + ' / ' + qs.length + '</b>' + (right === qs.length ? ' Great, you are ready for the topics.' : ' Re-read the part you missed, then retry.'))); const b = mk('button', 'btn sec', 'Retry'); b.addEventListener('click', () => { n = 0; right = 0; show(); }); host.lastChild.appendChild(b); return; }
      const q = qs[n]; const box = mk('div', 'mq', '<div class="mq-s"><span>Question ' + (n + 1) + ' of ' + qs.length + '</span><div>' + q.s + '</div></div>');
      const opts = mk('div', 'mq-o'); const fb = mk('div', 'mq-fb');
      q.o.forEach((o, i) => { const b = mk('button', 'mq-opt', o); b.addEventListener('click', () => { if (opts.__done) return; opts.__done = 1; if (i === q.ok) right++; $$('button', opts).forEach((x, j) => { x.disabled = true; x.classList.toggle('right', j === q.ok); x.classList.toggle('wrong', j === i && i !== q.ok); }); fb.innerHTML = '<div class="' + (i === q.ok ? 'ok' : 'no') + '">' + (i === q.ok ? 'Correct.' : 'Not quite.') + '</div><p>' + q.w + '</p>'; const nx = mk('button', 'btn', n + 1 >= qs.length ? 'See score' : 'Next'); nx.addEventListener('click', () => { n++; show(); }); fb.appendChild(nx); math(fb); }); opts.appendChild(b); });
      box.append(opts, fb); host.appendChild(box); math(box);
    }
    show();
  }
  function viewRefresh(id) {
    const R = D().refreshers, sc = ls.get('mltq.ref', {});
    const r = id && R.find(x => x.id === id);
    if (!r) {
      const c = page('refresh', 'Maths refreshers', 'Six short lessons on the maths that every topic quietly uses. Each takes about five minutes and ends with three practice questions. Do any you feel rusty on.');
      const g = mk('div', 'rfgrid'); R.forEach(x => g.appendChild(mk('a', 'rfc', '<span class="rfi">' + x.icon + '</span><b>' + esc(x.t) + '</b><small>' + esc(x.one) + '</small><em>' + (sc[x.id] != null ? 'Best score ' + sc[x.id] + ' / ' + x.quiz.length : 'Not tried yet') + '</em>', { href: '#refresh-' + x.id }))); c.appendChild(g); return;
    }
    const c = page('refresh', r.t, esc(r.one) + '. Read it top to bottom, then answer the three questions at the end.');
    const body = mk('div', 'rfbody'); r.body.forEach((p, i) => body.appendChild(mk('section', 'rfs', '<h2><span>' + (i + 1) + '</span>' + esc(p[0]) + '</h2>' + p[1]))); c.appendChild(body);
    c.appendChild(mk('h2', 'hh', 'Check yourself')); const q = mk('div'); c.appendChild(q); miniQuiz(q, r.quiz, r.id);
    const i = R.findIndex(x => x.id === r.id), nx = R[i + 1], pv = R[i - 1];
    c.appendChild(mk('div', 'secnav', (pv ? '<a class="btn sec" href="#refresh-' + pv.id + '">← ' + esc(pv.t) + '</a>' : '<a class="btn sec" href="#refresh">All refreshers</a>') + (nx ? '<a class="btn" href="#refresh-' + nx.id + '">' + esc(nx.t) + ' →</a>' : '<a class="btn" href="#plan">Back to your study plan →</a>')));
    math(c);
  }

  /* ---------- last-night sheets ---------- */
  function sheetHTML(t, full, bare) {
    const g = G()[t.id] || {}, e = g.end || {}, mv = D().moves[t.id] || [];
    let h = '<article class="rv' + (bare ? ' bare' : '') + '" style="--tc:' + (g.color || '#2563eb') + '">' + (bare ? '' : '<h2><span>' + (g.icon || '') + '</span>' + esc(t.title) + '<small>' + ((window.COUNTS || {})[t.id] || {}).marks + ' PYQ marks · ' + (t.pyqs || []).length + ' questions</small></h2><p class="rv-one">' + (g.one || '') + '</p>');
    if (t.formulas && t.formulas.length) h += '<h3>Formulas</h3><div class="rv-f">' + t.formulas.map(f => '<div><b>' + clean(f.name) + '</b>$$' + f.tex + '$$' + (f.note ? '<small>' + clean(f.note) + '</small>' : '') + '</div>').join('') + '</div>';
    if (full && e.props) h += '<h3>Facts and properties</h3><table>' + e.props.map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>').join('') + '</table>';
    if (mv.length) h += '<h3>Exam moves</h3><table><tr><th>If you see</th><th>Do this</th>' + (full ? '<th>Check</th>' : '') + '</tr>' + mv.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td>' + (full ? '<td>' + r[3] + '</td>' : '') + '</tr>').join('') + '</table>';
    if (e.traps) h += '<h3>Traps</h3><ul class="rv-t">' + e.traps.map(x => '<li>' + x + '</li>').join('') + '</ul>';
    if (e.hooks) h += '<h3>Memory hooks</h3><ol class="rv-h">' + e.hooks.map(x => '<li>' + x + '</li>').join('') + '</ol>';
    return h + '</article>';
  }
  function viewRevise(id) {
    const c = page('revise', id ? 'Last-night sheet' : 'Last-night sheets', id ? 'Everything for one topic on one printable page: formulas, facts, exam moves, traps and memory hooks. Read it the night before, then again just before the exam.' : 'One printable page per topic: formulas, exam moves, traps and memory hooks. Use "Print" and choose "Save as PDF" to keep a copy offline. Open a single topic for the full version with facts and properties.');
    const bar = mk('div', 'rvbar'); const pr = mk('button', 'btn', '🖨️ Print or save as PDF'); pr.addEventListener('click', () => window.print()); bar.appendChild(pr); c.appendChild(bar);
    c.appendChild(mk('p', 'notice', 'Loading...'));
    loadAll().then(topics => {
      if (!$('.st-revise')) return; c.lastChild.remove();
      const ts = id ? topics.filter(t => t.id === id) : topics;
      if (!ts.length) { c.appendChild(mk('p', 'notice', 'No sheet for that topic.')); return; }
      if (!id) bar.appendChild(mk('span', 'rvtopics', topics.map(t => '<a href="#revise-' + t.id + '">' + esc(t.title.replace(/ and .*| \(.*/, '')) + ' (full)</a>').join(' · ')));
      else bar.appendChild(mk('a', 'btn sec', 'All topics', { href: '#revise' }));
      ts.forEach(t => c.appendChild(mk('div', 'rvwrap', sheetHTML(t, !!id)))); math(c);
    });
  }

  /* ---------- cheatsheet built from the PYQs ---------- */
  const examName = e => String(e || '').replace(/ \(.*/, '');
  const num = x => (Math.round(x * 10) / 10).toString();
  const ORDER = { 'Jul 2022': 0, 'Aug 2023': 1, 'Dec 2023': 2, 'Mar 2024': 3, 'Aug 2024': 4, 'Dec 2024': 5, 'Mar 2025': 6, 'Aug 2025': 7, 'Apr 2026': 8, 'Aug 2026': 9 };
  const byExam = (a, b) => (ORDER[a] == null ? 99 : ORDER[a]) - (ORDER[b] == null ? 99 : ORDER[b]);
  function pyqStats(t) {
    const ps = t.pyqs || [], total = ps.reduce((s, p) => s + (p.marks || 0), 0), cs = {}, ex = {}, ty = {};
    ps.forEach(p => {
      const c = cs[p.concept] = cs[p.concept] || { k: p.concept, n: 0, m: 0, ps: [], types: {}, exams: {} };
      c.n++; c.m += p.marks || 0; c.ps.push(p); c.types[p.type] = (c.types[p.type] || 0) + 1; c.exams[examName(p.exam)] = 1;
      const e = ex[examName(p.exam)] = ex[examName(p.exam)] || { n: 0, m: 0 }; e.n++; e.m += p.marks || 0;
      const y = ty[p.type] = ty[p.type] || { n: 0, m: 0 }; y.n++; y.m += p.marks || 0;
    });
    return { ps, total, cs: Object.keys(cs).map(k => cs[k]).sort((a, b) => b.m - a.m || b.n - a.n), ex, ty };
  }
  function cheatHTML(t) {
    const g = G()[t.id] || {}, st = pyqStats(t), total = st.total, cname = c => ((t.concepts || {})[c] || {}).name || c;
    const exams = Object.keys(st.ex).sort(byExam);
    const plink = p => '<a class="pylink" href="#t-' + t.id + '" data-t="' + t.id + '" data-p="' + esc(p.id) + '">' + esc(examName(p.exam)) + ' ' + esc(p.qno) + '</a>';
    const secOf = c => t.sections.find(s => s.id === c) || (c === 'structure' ? t.sections.find(s => s.id === 'struct') : null);
    let h = '<p class="lead">This page is built from the <b>' + st.ps.length + ' past-year questions</b> of this topic (<b>' + num(total) + ' marks</b>) in <b>' + exams.length + ' papers</b> (' + exams.join(', ') + '). It tells you what is asked, how often, and the fastest way to answer. Read it last, and again just before the exam.</p>';
    h += '<div class="rm-links"><a class="btn small" href="#cards-' + t.id + '">🃏 Flashcards</a><a class="btn small sec" href="#revise-' + t.id + '">🖨️ Printable version</a></div>';
    h += '<h3>1. What the questions test, ranked by marks</h3><div class="tablewrap"><table class="cs-t"><tr><th>#</th><th>Idea</th><th>Qs</th><th>Marks</th><th>Share of topic</th><th>Types</th><th>Seen in</th></tr>';
    st.cs.forEach((c, i) => {
      const sec = secOf(c.k), share = total ? Math.round(100 * c.m / total) : 0;
      h += '<tr><td>' + (i + 1) + '</td><td><b>' + esc(cname(c.k)) + '</b>' + (sec ? '<br><a class="seclink" href="#t-' + t.id + '" data-t="' + t.id + '" data-s="sec-' + sec.id + '">open the section →</a>' : '') + '</td><td>' + c.n + '</td><td>' + num(c.m) + '</td><td><div class="cs-bar"><i style="width:' + share + '%"></i><span>' + share + '%</span></div></td><td>' + Object.keys(c.types).map(k => k + '×' + c.types[k]).join(', ') + '</td><td>' + Object.keys(c.exams).sort(byExam).join(', ') + '</td></tr>';
    });
    h += '</table></div><p class="notice">Priority: spend your time top to bottom. The top row is worth ' + (st.cs[0] ? num(st.cs[0].m) : 0) + ' of ' + num(total) + ' marks (' + (st.cs[0] && total ? Math.round(100 * st.cs[0].m / total) : 0) + '%).</p>';
    h += '<h3>2. Papers and question types</h3><div class="cs-two"><div class="tablewrap"><table><tr><th>Paper</th><th>Qs</th><th>Marks</th></tr>' + exams.map(e => '<tr><td>' + esc(e) + '</td><td>' + st.ex[e].n + '</td><td>' + num(st.ex[e].m) + '</td></tr>').join('') + '</table></div><div class="tablewrap"><table><tr><th>Type</th><th>Qs</th><th>Marks</th></tr>' + Object.keys(st.ty).map(k => '<tr><td>' + esc(k) + '</td><td>' + st.ty[k].n + '</td><td>' + num(st.ty[k].m) + '</td></tr>').join('') + '</table></div></div>';
    h += '<h3>3. Every question, grouped by idea</h3><p class="notice">Click a question to jump to its full solution.</p><div class="cs-groups">';
    st.cs.forEach(c => { h += '<div class="cs-g"><b>' + esc(cname(c.k)) + '</b> <small>(' + c.n + ' Qs, ' + num(c.m) + ' marks)</small><div>' + c.ps.slice().sort((a, b) => byExam(examName(a.exam), examName(b.exam)) || String(a.qno).localeCompare(String(b.qno), undefined, { numeric: true })).map(p => plink(p) + ' <small>' + num(p.marks) + 'm ' + esc(p.type) + '</small>').join(' · ') + '</div></div>'; });
    h += '</div>';
    const sa = st.ps.filter(p => p.type === 'SA' && p.key && (p.key.show || p.key.lo != null));
    if (sa.length) h += '<h3>4. Numeric answers that appeared (use them to sanity-check your own working)</h3><div class="tablewrap"><table><tr><th>Question</th><th>Idea</th><th>Accepted answer</th></tr>' + sa.slice().sort((a, b) => byExam(examName(a.exam), examName(b.exam)) || String(a.qno).localeCompare(String(b.qno), undefined, { numeric: true })).map(p => '<tr><td>' + plink(p) + ' <small>' + num(p.marks) + 'm</small></td><td>' + esc(cname(p.concept)) + '</td><td>' + esc(clean(p.key.show || (p.key.lo + ' to ' + p.key.hi))) + '</td></tr>').join('') + '</table></div>';
    h += '<h3>' + (sa.length ? '5' : '4') + '. The one-page summary</h3><p class="notice">Formulas, the fastest method for each question type, traps and memory hooks. Copy this by hand if you are allowed a handwritten sheet.</p>' + sheetHTML(t, false, true);
    return h;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.pylink, a.seclink'); if (!a) return;
    e.preventDefault(); const api = A(); if (!api) return;
    api.go(a.getAttribute('data-t'), a.getAttribute('data-p') ? 'pyq-' + a.getAttribute('data-p') : a.getAttribute('data-s'));
  });

  /* ---------- home card ---------- */
  function homeCard() {
    const s = mk('section', 'stkit');
    s.innerHTML = '<h2 class="hh">Study toolkit</h2><div class="kit">' + [['plan', '🗓️', 'Study plan', 'Choose 1 hour, 1 day or 1 week. Get an ordered checklist with times.'], ['cards', '🃏', 'Flashcards', 'Spaced recall of every idea, formula and exam move.'], ['glossary', '📖', 'Glossary', '63 terms in plain English with tiny examples.'], ['refresh', '🧮', 'Maths refreshers', 'Notation, derivatives, matrices, probability, logs, distance.'], ['revise', '🌙', 'Last-night sheets', 'One printable page per topic.']].map(x => '<a class="kt" href="#' + x[0] + '"><span>' + x[1] + '</span><b>' + x[2] + '</b><small>' + x[3] + '</small></a>').join('') + '</div><div class="kitrd"></div>';
    loadAll().then(ts => { const h = $('.kitrd', s); if (!h) return; h.innerHTML = '<h3>Your readiness by topic</h3><div class="rdgrid">' + ts.map(t => { const r = readiness(t); return '<a class="rdc" href="#t-' + t.id + '"><div class="rdc-t"><b>' + esc(t.title) + '</b><span>' + r.pct + '%</span></div><i><u style="width:' + r.pct + '%"></u></i></a>'; }).join('') + '</div><p class="notice">Readiness = 20% notes read + 40% check questions answered correctly and with confidence + 40% past-year questions solved.</p>'; });
    return s;
  }

  /* ---------- routing ---------- */
  const ROOTS = ['plan', 'cards', 'glossary', 'refresh', 'revise'];
  function handles(h) { const i = h.indexOf('-'); const a = i < 0 ? h : h.slice(0, i); if (ROOTS.indexOf(a) < 0) return false; return i < 0 || a !== 'plan'; }
  function view(h) {
    const i = h.indexOf('-'), a = i < 0 ? h : h.slice(0, i), rest = i < 0 ? '' : h.slice(i + 1);
    window.__fcKeys = null;
    if (a === 'plan') viewPlan(); else if (a === 'cards') viewCards(rest); else if (a === 'glossary') viewGlossary(rest);
    else if (a === 'refresh') viewRefresh(rest); else if (a === 'revise') viewRevise(rest);
  }
  window.Study = { cheatHTML, pyqStats, handles, view, decorate, homeCard, readiness, readMin, deckFor, buildPlans, linkTerms };
})();
