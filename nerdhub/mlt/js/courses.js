/* Course layer: hub, Quiz 1 reader (original pages + ported widgets), End-term plan, course tabs.
 * Plugs into the Quiz 2 engine through window.COURSEX (engine.route calls handles/view/tabs).
 * Quiz 1 progress is stored in the same Store as Quiz 2 (topics["q1-<build>"]), so reset, backup and cloud sync cover it.
 */
(function () {
  'use strict';
  const Q1 = [{"id":"b01","group":"Orientation","title":"PYQ dashboard + big picture","total":11},{"id":"b02","group":"Orientation","title":"Roadmap, cheat sheet v1, T1 prerequisites","total":13},{"id":"b03","group":"T1 Linear Algebra","title":"1.1 Projection + 1.2 Reconstruction error","total":24},{"id":"rev1","group":"T1 Linear Algebra","title":"\ud83d\udcc4 T1 Revision & Cheat Sheet","total":9},{"id":"b04","group":"T2 PCA","title":"PCA prerequisites","total":13},{"id":"b05","group":"T2 PCA","title":"2.1 Covariance & eigenvalues (A)","total":19},{"id":"b06","group":"T2 PCA","title":"2.1 (B) + checkpoint 1","total":20},{"id":"b07","group":"T2 PCA","title":"2.2 PC directions + orthogonality","total":20},{"id":"b08","group":"T2 PCA","title":"2.3 Projection scores (A)","total":16},{"id":"b09","group":"T2 PCA","title":"2.3 Projection scores (B)","total":17},{"id":"b10","group":"T2 PCA","title":"2.4 Explained variance + rank","total":17},{"id":"b11","group":"T2 PCA","title":"2.5 Reconstruction, residuals, storage","total":22},{"id":"b12","group":"T2 PCA","title":"2.6 Dual PCA + T2 set + checkpoint 2","total":20},{"id":"rev2","group":"T2 PCA","title":"\ud83d\udcc4 T2 Revision & Cheat Sheet","total":13},{"id":"b13","group":"T3 Kernels","title":"Prereqs + 3.1 + 3.3","total":37},{"id":"b14","group":"T3 Kernels","title":"3.2 Valid kernels (A)","total":19},{"id":"b15","group":"T3 Kernels","title":"3.2 Valid kernels (B)","total":17},{"id":"b16","group":"T3 Kernels","title":"3.4 Kernel PCA + T3 timed set","total":19},{"id":"rev3","group":"T3 Kernels","title":"\ud83d\udcc4 T3 Revision & Cheat Sheet","total":11},{"id":"b17","group":"T4 K-means","title":"Prereqs + 4.1 + 4.2 + checkpoint 3","total":41},{"id":"b18","group":"T4 K-means","title":"4.3 Assignment + 4.6 Choosing K","total":13},{"id":"b19","group":"T4 K-means","title":"4.4 Objective & convergence","total":10},{"id":"b20","group":"T4 K-means","title":"4.5 K-means++ (A)","total":7},{"id":"b21","group":"T4 K-means","title":"4.5 K-means++ (B) + T4 timed set","total":11},{"id":"rev4","group":"T4 K-means","title":"\ud83d\udcc4 T4 Revision & Cheat Sheet","total":13},{"id":"b22","group":"T5 Probability","title":"Prereqs + 5.1 Bernoulli MLE + checkpoint 4","total":23},{"id":"b23","group":"T5 Probability","title":"5.2 Likelihood & MLE for distributions","total":19},{"id":"b24","group":"T5 Probability","title":"5.3 Beta priors + T5 timed set","total":22},{"id":"rev5","group":"T5 Probability","title":"\ud83d\udcc4 T5 Revision & Cheat Sheet","total":10},{"id":"b25","group":"T6\u2013T7 GMM","title":"Jensen + GMM prereqs + 7.1\u20137.3","total":63},{"id":"rev6","group":"T6\u2013T7 GMM","title":"\ud83d\udcc4 T6 Revision & Cheat Sheet","total":10},{"id":"b26","group":"T7\u2013T8 Final","title":"7.4\u20137.5 + Regression + final test","total":66},{"id":"rev7","group":"T7\u2013T8 Final","title":"\ud83d\udcc4 T7 Revision & Cheat Sheet","total":12},{"id":"rev8","group":"T7\u2013T8 Final","title":"\ud83d\udcc4 T8 Revision & Cheat Sheet","total":9},{"id":"b26f","group":"T7\u2013T8 Final","title":"Final cheat sheet + weak areas","total":7}];
  const CN = window.COUNTS || {};
  const Q2 = {}; Object.keys(CN).forEach(k => { if (CN[k].course !== 'q1') Q2[k] = { sections: CN[k].sections, pyqs: CN[k].pyqs }; });
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const X = () => window.MLTQ;
  const S = () => X().Store.s;
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- Quiz 1 progress (stored with the rest of the state, so it syncs and merges) ---------- */
  function T1(bid) {
    const k = 'q1-' + bid, s = S();
    const t = s.topics[k] || (s.topics[k] = {});
    ['read', 'q', 'pyq', 'check', 'concept'].forEach(x => { t[x] = t[x] || {}; });
    return t;
  }
  function q1Done(b) { const s = S().topics['q1-' + b.id]; if (!s) return 0; return Math.min(b.total, Object.keys(s.read || {}).length + Object.keys(s.check || {}).length); }
  function q1Totals() { let T = 0, D = 0; Q1.forEach(b => { T += b.total; D += q1Done(b); }); return { T, D }; }
  function q2Totals() {
    let secT = 0, pqT = 0, secD = 0, pqD = 0;
    Object.keys(Q2).forEach(id => {
      secT += Q2[id].sections; pqT += Q2[id].pyqs;
      const t = S().topics[id]; if (!t) return;
      secD += Math.min(Q2[id].sections, Object.keys(t.read || {}).length);
      pqD += Math.min(Q2[id].pyqs, Object.keys(t.pyq || {}).filter(k => t.pyq[k] && t.pyq[k].status === 'correct').length);
    });
    return { secT, pqT, secD, pqD };
  }
  const QC = [['kmeans','K-means clustering','Lloyd, objective, K-means++'],['pca','PCA','Covariance, PCs, projections, rank, dual PCA'],['kernels','Kernels and kernel PCA','Feature maps, valid kernels, Gram matrices'],['probability','Probability, MLE and MAP','MLE recipes, Beta posteriors'],['gmm','GMM and EM, plus regression and GD','Responsibilities, M-step, EM vs K-means, gradient descent']].map(c => [c[0], c[1], (CN[c[0]] || {}).pyqs || 0, c[2]]);
  const QCTOT = QC.reduce((a, c) => a + c[2], 0);
  const QCMAP = { pca: /^(b0[4-9]|b1[0-2]|rev2)$/, kernels: /^(b1[3-6]|rev3)$/, kmeans: /^(b1[7-9]|b2[01]|rev4)$/, probability: /^(b2[2-4]|rev5)$/, gmm: /^(b2[56]|b26f|rev[678])$/ };
  function qcFor(bid) { return Object.keys(QCMAP).find(k => QCMAP[k].test(bid)); }
  function qcSolved(id) { const t = S().topics[id]; if (!t) return 0; return Object.keys(t.pyq || {}).filter(k => t.pyq[k] && t.pyq[k].status === 'correct').length; }
  function qcAll() { return QC.reduce((a, c) => a + Math.min(c[2], qcSolved(c[0])), 0); }
  function qcCards() { return QC.map(c => '<a class="tcard" href="#t-' + c[0] + '"><b>' + c[1] + '</b><small>' + c[3] + '</small><small>PYQs solved: ' + qcSolved(c[0]) + '/' + c[2] + '</small></a>').join(''); }
  const pct = (d, t) => t ? Math.round(100 * d / t) : 0;
  const bar = p => '<div class="bar" aria-hidden="true"><i style="width:' + p + '%"></i></div>';

  /* ---------- routing ---------- */
  const handles = h => h === 'hub' || h === 'endterm' || h === 'q1' || h.indexOf('q1-') === 0;
  function view(h) {
    if (h === 'hub') return viewHub();
    if (h === 'endterm') return viewEndterm();
    if (h === 'q1') return viewQ1Index();
    return viewQ1Page(h.slice(3));
  }

  /* ---------- tabs at the top of the sidebar ---------- */
  function curCourse(h) {
    if (h === 'hub') return 'hub';
    if (h === 'endterm') return 'endterm';
    if (h === 'q1' || h.indexOf('q1-') === 0) return 'q1';
    if (h.indexOf('t-') === 0 && window.MANIFEST && (window.MANIFEST.topics.find(t => t.id === h.slice(2)) || {}).course === 'q1') return 'q1';
    return 'q2';
  }
  function tabsHTML(h) {
    const c = curCourse(h);
    const t = (id, href, label) => '<a class="ctab' + (c === id ? ' cur' : '') + '" href="' + href + '">' + label + '</a>';
    return '<div class="ctabs" role="navigation" aria-label="Courses">' + t('hub', '#hub', 'Home') + t('q1', '#q1', 'Quiz 1') + t('q2', '#home', 'Quiz 2') + t('endterm', '#endterm', 'End-term') + '</div>';
  }
  function tabs(h) {
    const side = $('#side'); if (!side) return;
    const paint = () => {
      const cur = (location.hash || '#hub').slice(1);
      const old = $('.ctabs', side); const html = tabsHTML(cur);
      if (old) { if (old.outerHTML === html) return; old.outerHTML = html; return; }
      side.insertAdjacentHTML('afterbegin', html);
    };
    paint();
    if (!side.__obs) { side.__obs = new MutationObserver(() => { if (!$('.ctabs', side)) paint(); }); side.__obs.observe(side, { childList: true }); }
  }

  function setMain(html) { const m = $('#main'); m.innerHTML = html; window.scrollTo(0, 0); return m; }
  function math(root) {
    try { if (window.renderMathInElement) window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { /* ignore */ }
  }

  /* ---------- hub ---------- */
  function projSVG() {
    const ang = Math.atan2(1, 1.6), u = [Math.cos(ang), Math.sin(ang)], nv = [-u[1], u[0]], S = 46, cx = 230, cy = 170;
    const TT = [-3.5,-2.7,-2.0,-1.2,-0.5,0.3,1.0,1.8,2.6,3.4], OO = [0.55,-0.8,0.95,-0.4,0.7,-1.05,0.35,-0.7,0.9,-0.45];
    const P = TT.map((tt, i) => [tt * u[0] + OO[i] * nv[0], tt * u[1] + OO[i] * nv[1]]);
    const X = v => cx + v * S, Y = v => cy - v * S;
    let g = '';
    for (let i = -4; i <= 4; i++) { g += '<line class="grid" x1="' + X(i) + '" y1="16" x2="' + X(i) + '" y2="324"/>'; }
    for (let j = -3; j <= 3; j++) { g += '<line class="grid" x1="46" y1="' + Y(j) + '" x2="414" y2="' + Y(j) + '"/>'; }
    let drops = '', shadows = '', pts = '';
    P.forEach(p => { const z = p[0] * u[0] + p[1] * u[1], q = [z * u[0], z * u[1]];
      drops += '<line class="drop late" x1="' + X(p[0]).toFixed(1) + '" y1="' + Y(p[1]).toFixed(1) + '" x2="' + X(q[0]).toFixed(1) + '" y2="' + Y(q[1]).toFixed(1) + '"/>';
      shadows += '<circle class="shadow late" cx="' + X(q[0]).toFixed(1) + '" cy="' + Y(q[1]).toFixed(1) + '" r="3.4"/>';
      pts += '<circle class="pt" cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="5"/>'; });
    const L = 4.3, a1 = [X(-L * u[0]), Y(-L * u[1])], a2 = [X(L * u[0]), Y(L * u[1])];
    const ax = 'x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) + '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '"';
    return '<svg class="proj" viewBox="0 0 460 340" role="img" aria-label="Ten data points and their first principal axis, with each point projected onto the axis">' + g +
      '<line class="axis draw" ' + ax + '/><line class="axis2 draw" ' + ax + '/>' + drops + pts + shadows +
      '<text class="lab late" x="' + (a2[0] + 4).toFixed(0) + '" y="' + (a2[1] - 16).toFixed(0) + '" text-anchor="end">first principal axis</text></svg>';
  }
  function viewHub() {
    const q1 = q1Totals(), q2 = q2Totals(), q1s = qcAll();
    const q2topics = Object.keys(Q2).length;
    const nextQ1 = QC.find(c => qcSolved(c[0]) < c[2]);
    const m = setMain('<div class="home">' +
      '<section class="home-hero"><div><h1>Machine Learning Techniques</h1>' +
      '<p class="lead">Notes that start from zero, a check after every idea, and every past-year question solved step by step. Your progress stays in this browser' + (window.MLTQ_FIREBASE && window.MLTQ_FIREBASE.enabled ? ' and syncs when you sign in' : '') + '.</p>' +
      '<div class="row"><a class="btn" href="#practice">Practise what you are weakest at</a><a class="btn sec" href="#' + (nextQ1 ? 't-' + nextQ1[0] : 'q1') + '">' + (q1s ? 'Continue studying' : 'Start with K-means') + '</a></div></div>' +
      '<div>' + projSVG() + '</div></section>' +
      '<div class="courses">' +
      '<a class="course" href="#t-' + QC[0][0] + '"><div class="cn">Quiz 1</div><div><p class="ct">PCA, kernels, K-means, probability, GMM</p><p class="cd">Five topics in English with worked examples, quick checks, interactive explorers and ' + QCTOT + ' solved PYQs. The original ' + Q1.length + ' Hinglish pages are kept as well.</p></div><div class="cp"><b>' + q1s + ' / ' + QCTOT + '</b>PYQs solved' + bar(pct(q1s, QCTOT)) + q1.D + ' of ' + q1.T + ' original sections ticked</div></a>' +
      '<a class="course" href="#home"><div class="cn">Quiz 2</div><div><p class="ct">Weeks 5 to 8: regression to cross-validation</p><p class="cd">' + q2topics + ' topics: linear regression, ridge and lasso, kernel regression, k-NN, decision trees, Naive Bayes, cross-validation and legacy material.</p></div><div class="cp"><b>' + q2.pqD + ' / ' + q2.pqT + '</b>PYQs solved' + bar(pct(q2.pqD, q2.pqT)) + q2.secD + ' of ' + q2.secT + ' sections read</div></a>' +
      '<a class="course" href="#endterm"><div class="cn">End-term</div><div><p class="ct">Whole-course revision</p><p class="cd">One path across both quizzes: adaptive practice, a mixed mock test, the cheatsheet and your mistakes.</p></div><div class="cp"><b>' + (q1s + q2.pqD) + ' / ' + (QCTOT + q2.pqT) + '</b>PYQs solved across the course' + bar(pct(q1s + q2.pqD, QCTOT + q2.pqT)) + '</div></a>' +
      '</div>' +
      '<h2 class="hh">Quiz 1 topics</h2><p class="hsub">Learn, practise the PYQs, take the topic test, then revise.</p><div class="tlist">' +
      QC.map((c, i) => '<a class="trow" href="#t-' + c[0] + '"><span><b>' + (i + 1) + '. ' + c[1] + '</b><small>' + c[3] + '</small></span><span class="tn">' + qcSolved(c[0]) + ' / ' + c[2] + '</span></a>').join('') +
      '</div>' +
      '<h2 class="hh">Tools</h2><p class="hsub">These cover every topic in both quizzes.</p><div class="tools">' +
      '<a class="tool" href="#practice"><b>Practice next</b><span>Ranks ideas by the marks you are likely to lose and gives you questions on them.</span></a>' +
      '<a class="tool" href="#mock"><b>Mock test</b><span>Timed past-paper questions with marks and a topic breakdown.</span></a>' +
      '<a class="tool" href="#cheat"><b>Cheatsheet</b><span>Every formula, the traps that cost marks, and a last-day plan. Printable.</span></a>' +
      '<a class="tool" href="#mistakes"><b>Mistakes</b><span>Everything you got wrong, with the confident mistakes first.</span></a>' +
      '</div></div>');
    tabs('hub');
  }

  /* ---------- Quiz 1 sidebar and index ---------- */
  function q1Side(active) {
    let h = '', g = null;
    Q1.forEach(b => {
      if (b.group !== g) { g = b.group; h += '<h4>' + esc(g) + '</h4>'; }
      const d = q1Done(b), done = b.total && d >= b.total;
      h += '<a class="tlink' + (b.id === active ? ' cur' : '') + '" href="#q1-' + b.id + '">' + esc(b.title) + '<small>' + (b.total ? (done ? '&#10003; ' : '') + d + '/' + b.total + ' ticked' : 'reference') + '</small></a>';
    });
    const side = $('#side'); side.innerHTML = tabsHTML('q1') + h;
    tabs('q1');
  }
  function viewQ1Index() {
    q1Side(null);
    const q1 = q1Totals();
    let h = '<div class="col wide"><div class="hero"><div class="eyebrow">Quiz 1</div><h1>PCA, kernels, K-means, probability, GMM, regression</h1><p class="lead">Built from past-year papers. Open a page, read it top to bottom, tick each section when it is secure.</p>' + bar(pct(q1.D, q1.T)) + '<small class="muted">' + q1.D + ' of ' + q1.T + ' sections ticked</small></div>';
    let g = null;
    Q1.forEach(b => {
      if (b.group !== g) { g = b.group; h += '<h3 class="hh">' + esc(g) + '</h3>'; }
      const d = q1Done(b);
      h += '<a class="tcard" href="#q1-' + b.id + '"><b>' + esc(b.title) + '</b><small>' + (b.total ? d + '/' + b.total + ' sections ticked' : 'Reference page') + '</small></a>';
    });
    setMain(h + '</div>');
  }

  /* ---------- Quiz 1 page reader ---------- */
  const cache = {};
  function fetchPage(id) { return cache[id] ? Promise.resolve(cache[id]) : fetch('q1/' + id + '.html').then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).then(t => (cache[id] = t)); }
  function loadWidgets() {
    if (window.Q1W) return Promise.resolve();
    return new Promise(res => { const s = document.createElement('script'); s.src = 'js/q1-widgets.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }
  function viewQ1Page(id) {
    const i = Q1.findIndex(b => b.id === id);
    if (i < 0) { location.hash = 'q1'; return; }
    const b = Q1[i];
    q1Side(id);
    setMain('<div class="col wide"><p>Loading ' + esc(b.title) + '...</p></div>');
    Promise.all([fetchPage(id), loadWidgets()]).then(r => {
      if ((location.hash || '').slice(1) !== 'q1-' + id) return;
      const prev = Q1[i - 1], next = Q1[i + 1];
      const nav = '<div class="q1nav">' + (prev ? '<a class="btn sec" href="#q1-' + prev.id + '">&larr; ' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a class="btn" href="#q1-' + next.id + '">' + esc(next.title) + ' &rarr;</a>' : '<a class="btn" href="#q1">All Quiz 1 pages</a>') + '</div>';
      const m = setMain('<div class="col wide"><div class="q1bar"><a class="btn sec small" href="#q1">&larr; Quiz 1</a><span style="flex:1"></span><button class="btn sec small" id="q1-exp">Expand all</button><button class="btn sec small" id="q1-print">Print / PDF</button></div><div class="q1" id="q1root">' + r[0] + '</div>' + nav + '</div>');
      const root = $('#q1root', m);
      const qc = qcFor(id); if (qc) { const c = QC.find(x => x[0] === qc); root.insertAdjacentHTML('beforebegin', '<div class="q1banner"><b>English version with practice tracking:</b> <a href="#t-' + qc + '">' + esc(c[1]) + '</a>. These original notes are in Hinglish; the English topic has the same PYQs in the practice format, section quick checks, a topic test and the interactive explorers. Progress there feeds adaptive practice and the mock test.</div>'); }
      enhance(root, id);
      let ex = false;
      $('#q1-exp').onclick = e => { ex = !ex; $$('details', root).forEach(d => { d.open = ex; }); e.target.textContent = ex ? 'Collapse all' : 'Expand all'; };
      $('#q1-print').onclick = () => { $$('details', root).forEach(d => { d.open = true; }); try { window.print(); } catch (e2) { /* ignore */ } };
    }).catch(e => { setMain('<div class="col wide"><div class="box warn"><div class="bt">Could not load</div>This page failed to load (' + esc(e.message) + '). Refresh and try again.</div></div>'); });
  }
  function enhance(root, bid) {
    const W = window.Q1W || {};
    const T = T1(bid), save = () => X().Store.save();
    const mk = (host, store, key, onTxt, offTxt, cls) => {
      const lab = document.createElement('label'); lab.className = cls + (store[key] ? ' done' : '');
      lab.innerHTML = '<input type="checkbox"' + (store[key] ? ' checked' : '') + '> <span>' + (store[key] ? onTxt : offTxt) + '</span>';
      lab.querySelector('input').addEventListener('change', ev => {
        if (ev.target.checked) store[key] = today(); else delete store[key];
        save(); lab.className = cls + (store[key] ? ' done' : ''); lab.querySelector('span').textContent = store[key] ? onTxt : offTxt;
        q1Side(bid); refreshTrackers(root);
      });
      host.appendChild(lab);
    };
    $$('[data-check]', root).forEach(r => mk(r, T.check, r.dataset.check, 'Cold-ready ✓', 'Yes — cold, in exam time, no hints', 'chk'));
    $$('[data-track]', root).forEach(r => mk(r, T.read, r.dataset.track, 'Done — section complete', 'Mark this section done', 'track'));
    $$('.methods', root).forEach(mm => {
      const ms = Array.from(mm.children).filter(x => x.classList.contains('method')); if (ms.length < 2) return;
      mm.classList.add('tabbed'); const barEl = document.createElement('div'); barEl.className = 'mtabs';
      ms.forEach((x, k) => { const btn = document.createElement('button'); btn.textContent = x.dataset.label || ('Method ' + (k + 1));
        btn.onclick = () => { ms.forEach(y => y.classList.remove('on')); $$('button', barEl).forEach(z => z.classList.remove('on')); x.classList.add('on'); btn.classList.add('on'); };
        if (k === 0) { x.classList.add('on'); btn.classList.add('on'); } barEl.appendChild(btn); });
      mm.parentNode.insertBefore(barEl, mm);
    });
    $$('.chart[data-chart]', root).forEach(c => { try { W.drawChart(c, JSON.parse(c.dataset.chart)); } catch (e) { c.textContent = 'Chart error: ' + e.message; } });
    ['proj2d', 'vardir', 'gram2', 'kmstep', 'vcells', 'kmpp', 'bernlik', 'mlecurve', 'betaupd', 'gmmresp', 'mstep', 'gd1d'].forEach(nm => {
      $$('[data-widget="' + nm + '"]', root).forEach(el => { try { W[nm](el); } catch (e) { el.textContent = 'Widget error: ' + e.message; } });
    });
    refreshTrackers(root);
    math(root);
  }
  function refreshTrackers(root) {
    $$('[data-progress-tracker]', root).forEach(el => {
      let h = '<div class="tbl-wrap"><table><thead><tr><th>Page</th><th>Content</th><th>Status</th><th class="num">Sections ticked</th></tr></thead><tbody>';
      Q1.forEach(b => { const d = q1Done(b); const st = !b.total ? 'Reference' : d >= b.total ? 'All ticked' : d > 0 ? 'In progress' : 'Not started';
        h += '<tr><td class="mono">' + b.id.toUpperCase() + '</td><td>' + esc(b.title) + '</td><td>' + st + '</td><td class="num">' + (b.total ? d + ' / ' + b.total : '—') + '</td></tr>'; });
      el.innerHTML = h + '</tbody></table></div>';
    });
  }

  /* ---------- End-term plan ---------- */
  function viewEndterm() {
    $('#side').innerHTML = tabsHTML('endterm'); tabs('endterm');
    setMain('<div class="col wide"><div class="hero"><div class="eyebrow">End-term</div><h1>Whole-course revision</h1><p class="lead">One path across Quiz 1 and Quiz 2. Everything below already works on all 13 topics together.</p></div>' +
      '<a class="tcard" href="#practice"><b>1. Practice next (adaptive)</b><small>Ranks every idea across both quizzes by marks you are expected to lose, from your own answers.</small></a>' +
      '<a class="tcard" href="#mock"><b>2. Full-course timed mock</b><small>Random past-paper questions from all topics, with a timer, marks and a topic-wise result.</small></a>' +
      '<a class="tcard" href="#cheat"><b>3. Cheatsheet for all topics</b><small>Priorities by marks, every formula, traps, last-day plan. Printable.</small></a>' +
      '<a class="tcard" href="#mistakes"><b>4. Mistake review</b><small>Everything you got wrong, sorted so the confident mistakes come first.</small></a>' +
      '<h3 class="hh">Quiz 1 topics</h3>' + qcCards() +
      '<h3 class="hh">Quiz 2 topics</h3><a class="tcard" href="#home"><b>All Quiz 2 topics</b><small>Regression to cross-validation, k-NN, trees, Naive Bayes, legacy.</small></a>' +
      '<div class="tcard planned"><b>End-term past papers</b><small>Planned. A mock built only from end-term papers needs those papers loaded in the question format.</small></div></div>');
  }

  function hubClass() { document.body.classList.toggle('is-hub', (location.hash || '#hub') === '#hub'); }
  window.addEventListener('hashchange', hubClass); hubClass();
  window.COURSEX = { handles, view, tabs };
})();
