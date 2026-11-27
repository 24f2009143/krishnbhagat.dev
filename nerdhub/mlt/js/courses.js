/* Course layer: hub, End-term plan, course tabs.
 * Plugs into the Quiz 2 engine through window.COURSEX (engine.route calls handles/view/tabs).
 */
(function () {
  'use strict';
  const CN = window.COUNTS || {};
  const Q2 = {}; Object.keys(CN).forEach(k => { if (CN[k].course !== 'q1') Q2[k] = { sections: CN[k].sections, pyqs: CN[k].pyqs }; });
  const $ = (s, r) => (r || document).querySelector(s);
  const X = () => window.MLTQ;
  const S = () => X().Store.s;
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
  const pct = (d, t) => t ? Math.round(100 * d / t) : 0;
  const bar = p => '<div class="bar" aria-hidden="true"><i style="width:' + p + '%"></i></div>';

  /* ---------- routing ---------- */
  const handles = h => h === 'hub' || h === 'endterm';
  function view(h) { return h === 'hub' ? viewHub() : viewEndterm(); }

  /* ---------- tabs at the top of the sidebar ---------- */
  function curCourse(h) {
    if (h === 'hub') return 'hub';
    if (h === 'endterm') return 'endterm';
    return 'q2';
  }
  function tabsHTML(h) {
    const c = curCourse(h);
    const t = (id, href, label) => '<a class="ctab' + (c === id ? ' cur' : '') + '" href="' + href + '">' + label + '</a>';
    return '<div class="ctabs" role="navigation" aria-label="Courses">' + t('hub', '#hub', 'Home') + t('q2', '#home', 'Quiz 2') + t('endterm', '#endterm', 'End-term') + '</div>';
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
    const q2 = q2Totals();
    const q2topics = Object.keys(Q2).length;
    const m = setMain('<div class="home">' +
      '<section class="home-hero"><div><h1>Machine Learning Techniques</h1>' +
      '<p class="lead">Notes that start from zero, a check after every idea, and every past-year question solved step by step. Your progress stays in this browser' + (window.MLTQ_FIREBASE && window.MLTQ_FIREBASE.enabled ? ' and syncs when you sign in' : '') + '.</p>' +
      '<div class="row"><a class="btn" href="#practice">Practise what you are weakest at</a><a class="btn sec" href="#home">' + (q2.pqD ? 'Continue studying' : 'Start studying') + '</a></div></div>' +
      '<div>' + projSVG() + '</div></section>' +
      '<div class="courses">' +
      '<a class="course" href="#home"><div class="cn">Quiz 2</div><div><p class="ct">Weeks 5 to 8: regression to cross-validation</p><p class="cd">' + q2topics + ' topics: linear regression, ridge and lasso, kernel regression, k-NN, decision trees, Naive Bayes, cross-validation and legacy material.</p></div><div class="cp"><b>' + q2.pqD + ' / ' + q2.pqT + '</b>PYQs solved' + bar(pct(q2.pqD, q2.pqT)) + q2.secD + ' of ' + q2.secT + ' sections read</div></a>' +
      '<a class="course" href="#endterm"><div class="cn">End-term</div><div><p class="ct">Whole-course revision</p><p class="cd">One path through the course: adaptive practice, a mixed mock test, the cheatsheet and your mistakes.</p></div><div class="cp"><b>' + q2.pqD + ' / ' + q2.pqT + '</b>PYQs solved across the course' + bar(pct(q2.pqD, q2.pqT)) + '</div></a>' +
      '</div>' +
      '<h2 class="hh">Tools</h2><p class="hsub">These cover every topic.</p><div class="tools">' +
      '<a class="tool" href="#practice"><b>Practice next</b><span>Ranks ideas by the marks you are likely to lose and gives you questions on them.</span></a>' +
      '<a class="tool" href="#mock"><b>Mock test</b><span>Timed past-paper questions with marks and a topic breakdown.</span></a>' +
      '<a class="tool" href="#cheat"><b>Cheatsheet</b><span>Every formula, the traps that cost marks, and a last-day plan. Printable.</span></a>' +
      '<a class="tool" href="#mistakes"><b>Mistakes</b><span>Everything you got wrong, with the confident mistakes first.</span></a>' +
      '</div></div>');
    tabs('hub');
  }

  /* ---------- End-term plan ---------- */
  function viewEndterm() {
    $('#side').innerHTML = tabsHTML('endterm'); tabs('endterm');
    setMain('<div class="col wide"><div class="hero"><div class="eyebrow">End-term</div><h1>Whole-course revision</h1><p class="lead">One path through the course. Everything below works on all topics together.</p></div>' +
      '<a class="tcard" href="#practice"><b>1. Practice next (adaptive)</b><small>Ranks every idea by marks you are expected to lose, from your own answers.</small></a>' +
      '<a class="tcard" href="#mock"><b>2. Full-course timed mock</b><small>Random past-paper questions from all topics, with a timer, marks and a topic-wise result.</small></a>' +
      '<a class="tcard" href="#cheat"><b>3. Cheatsheet for all topics</b><small>Priorities by marks, every formula, traps, last-day plan. Printable.</small></a>' +
      '<a class="tcard" href="#mistakes"><b>4. Mistake review</b><small>Everything you got wrong, sorted so the confident mistakes come first.</small></a>' +
      '<h3 class="hh">Quiz 2 topics</h3><a class="tcard" href="#home"><b>All Quiz 2 topics</b><small>Regression to cross-validation, k-NN, trees, Naive Bayes, legacy.</small></a>' +
      '<div class="tcard planned"><b>End-term past papers</b><small>Planned. A mock built only from end-term papers needs those papers loaded in the question format.</small></div></div>');
  }

  function hubClass() { document.body.classList.toggle('is-hub', (location.hash || '#hub') === '#hub'); }
  window.addEventListener('hashchange', hubClass); hubClass();
  window.COURSEX = { handles, view, tabs };
})();
