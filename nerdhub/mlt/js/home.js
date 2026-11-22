/* Home page extras: PYQ analysis (computed from the topic files) and two study guides. */
window.HOMEX = function (host, X) {
  const { el, esc, topics, M } = X;
  const all = topics.filter(Boolean).sort((a, b) => ((M().topics.find(t => t.id === a.id) || {}).n || 0) - ((M().topics.find(t => t.id === b.id) || {}).n || 0));
  const short = t => t.title.replace(/^Legacy: /, 'Legacy: ');
  const mon = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const ekey = e => { const m = /([A-Za-z]{3})\w* (\d{4})/.exec(e); return m ? +m[2] * 100 + (mon[m[1]] || 0) : 0; };
  const elabel = e => { const m = /([A-Za-z]{3})\w* (\d{4})/.exec(e); return m ? m[1] + ' ' + m[2] : e; };
  const rows = []; all.forEach(t => t.pyqs.forEach(p => rows.push({ t: t.id, tn: short(t), m: +p.marks || 0, type: p.type, ex: elabel(p.exam), k: ekey(p.exam), concept: p.concept, cname: ((t.concepts || {})[p.concept] || {}).name || p.concept, sub: p.sub })));
  const total = rows.reduce((s, r) => s + r.m, 0), n = rows.length;
  const group = (key) => { const g = {}; rows.forEach(r => { const k = key(r); g[k] = g[k] || { m: 0, n: 0 }; g[k].m += r.m; g[k].n++; }); return g; };
  const pct = v => (total ? Math.round(1000 * v / total) / 10 : 0);
  const bars = (entries, max) => '<div class="hbars">' + entries.map(e => '<div class="hbar"><span class="hbl">' + esc(e[0]) + '</span><span class="hbt"><i style="width:' + Math.max(2, Math.round(100 * e[1] / max)) + '%"></i></span><span class="hbv">' + e[2] + '</span></div>').join('') + '</div>';

  const byTopic = group(r => r.tn), byType = group(r => r.type), byEx = group(r => r.ex);
  const exKeys = {}; rows.forEach(r => exKeys[r.ex] = r.k); const exams = Object.keys(exKeys).sort((a, b) => exKeys[a] - exKeys[b]);
  const topicList = Object.keys(byTopic).sort((a, b) => byTopic[b].m - byTopic[a].m);
  const top3 = topicList.slice(0, 3), top3m = top3.reduce((s, k) => s + byTopic[k].m, 0);
  const cg = {}; rows.forEach(r => { const k = r.tn + ' / ' + r.cname; cg[k] = cg[k] || { m: 0, n: 0 }; cg[k].m += r.m; cg[k].n++; });
  const topConcepts = Object.keys(cg).sort((a, b) => cg[b].m - cg[a].m).slice(0, 10);
  const matrix = {}; rows.forEach(r => { matrix[r.tn] = matrix[r.tn] || {}; matrix[r.tn][r.ex] = (matrix[r.tn][r.ex] || 0) + r.m; });
  const appears = tn => exams.filter(e => matrix[tn][e]).length;

  /* week-by-topic map (from the lecture transcript) */
  const weekOf = (tid, sub) => tid === 'linear-regression' ? (/Probabilistic/.test(sub || '') ? 6 : 5) : ({ 'kernel-regression': 5, 'ridge-lasso-map': 6, 'cross-validation': 6, 'knn': 7, 'decision-trees': 7, 'naive-bayes': 8, 'legacy': 0 })[tid];
  const wk = {}; rows.forEach(r => { const w = weekOf(r.t, r.sub); wk[w] = wk[w] || { m: 0, n: 0 }; wk[w].m += r.m; wk[w].n++; });
  const wm = w => (wk[w] ? wk[w].m : 0), wn = w => (wk[w] ? wk[w].n : 0);
  const L = (id, t) => '<a href="#t-' + id + '">' + t + '</a>';
  const weeks = [
    [5, 'Supervised learning, regression, linear regression (closed form, geometric view, gradient descent, SGD), kernel regression, first look at the probabilistic view.', [L('linear-regression', 'Linear regression and GD'), L('kernel-regression', 'Kernel regression')], 'Linear regression sections except the probabilistic view; all of kernel regression.'],
    [6, 'Probabilistic view of linear regression (Gaussian and Laplace noise, MLE), bias and variance, Ridge and Lasso, learning-rate curves, 5-fold and leave-one-out cross-validation.', [L('linear-regression', 'Probabilistic view (in Linear regression)'), L('ridge-lasso-map', 'Ridge, Lasso and MAP'), L('cross-validation', 'Cross-validation')], 'The MAP / Bayesian part of Ridge is placed here because it follows from the Week 6 probabilistic view; the transcript does not state it separately.'],
    [7, 'PCA versus linear regression, classification and 0-1 loss, k-NN (distances, extreme k, ties), decision trees (entropy, information gain, depth, overfitting).', [L('knn', 'k-NN'), L('decision-trees', 'Decision trees')], 'Cross-validation is used again to choose k and tree depth.'],
    [8, 'Discriminative versus generative models, Bayes rule decision, counting parameters for binary features. The transcript stops partway through this week.', [L('naive-bayes', 'Naive Bayes and generative models')], 'Naive Bayes, smoothing and Gaussian NB follow from generative models, so they are placed here; the part after the transcript cut-off is my placement, not stated in the lecture.']
  ];
  let wh = '<section class="hx"><h2>Week and topic map</h2><p class="notice">Built from your lecture transcript (Quiz 2 covers Weeks 5 to 8). Marks are the PYQ marks that fall in each week, counted from the questions on this site. Open the topic to study it; the site lists topics in learning order, so the week order below is the order the lectures came in.</p><div class="tablewrap"><table class="heat wk"><thead><tr><th>Week</th><th>Covered in the lectures</th><th>Study on this site</th><th>PYQ marks</th><th>Questions</th></tr></thead><tbody>';
  weeks.forEach(w => { wh += '<tr><td><b>Week ' + w[0] + '</b></td><td>' + w[1] + '<br><small>' + w[3] + '</small></td><td>' + w[2].join('<br>') + '</td><td><b>' + wm(w[0]) + '</b> (' + pct(wm(w[0])) + '%)</td><td>' + wn(w[0]) + '</td></tr>'; });
  wh += '<tr><td><b>Not in the Week 5 to 8 lectures</b></td><td>Logistic regression, softmax regression and SVM appear in past papers but are not in the lecture transcript you gave me. They are kept in the Legacy topic.</td><td>' + L('legacy', 'Legacy: logistic, softmax, SVM') + '</td><td><b>' + wm(0) + '</b> (' + pct(wm(0)) + '%)</td><td>' + wn(0) + '</td></tr>';
  wh += '</tbody></table></div><p><b>How to use it:</b> if your class is currently in Week N, study the topics in that row first, then revisit the earlier weeks with the quick-fire tests on the Cheatsheet page. The PYQ analysis below shows how often each topic appeared across past papers.</p></section>';
  const hbarsP = prow => '<div class="hbars">' + prow.map(r => '<div class="hbar"><span class="hbl">' + esc(r.t.title) + '</span><span class="hbt"><i style="width:' + Math.max(2, Math.round(100 * r.ps / (r.pn || 1))) + '%"></i></span><span class="hbv">' + r.ps + '/' + r.pn + ' PYQs, ' + r.sr + '/' + r.sa + ' sections</span></div>').join('') + '</div>';
  /* your progress dashboard (from this browser's saved progress) */
  let ph = '';
  if (X.Store && X.TS) {
    const Sx = X.Store, TSx = X.TS;
    let secsRead = 0, secsAll = 0, solved = 0, tried = 0;
    const prow = all.map(t => { const T = TSx(t.id); const sr = Object.keys(T.read).length, sa = t.sections.length, ps = Object.keys(T.pyq).filter(k => T.pyq[k].status === 'correct').length, pt = Object.keys(T.pyq).length; secsRead += sr; secsAll += sa; solved += ps; tried += pt; return { t, sr, sa, ps, pt, pn: t.pyqs.length }; });
    const next = prow.find(r => r.ps < r.pn);
    const weak = []; all.forEach(t => { const T = TSx(t.id); Object.keys(T.concept || {}).forEach(k => { const s = T.concept[k]; if (s.tries >= 2 && s.miss > 0) weak.push({ t, k, name: ((t.concepts || {})[k] || {}).name || k, rate: s.miss / s.tries, miss: s.miss, tries: s.tries }); }); });
    weak.sort((a, b) => b.rate - a.rate || b.miss - a.miss);
    ph = '<section class="hx"><h2>Your progress</h2><div class="stats"><div><b>' + secsRead + '/' + secsAll + '</b><small>sections read</small></div><div><b>' + solved + '/' + n + '</b><small>PYQs solved</small></div><div><b>' + tried + '</b><small>PYQs attempted</small></div><div><b>' + ((Sx.s.mistakes || []).length) + '</b><small>in mistake review</small></div></div>';
    ph += next ? '<p><b>Next step:</b> ' + L(next.t.id, esc(next.t.title)) + ' (' + (next.sa - next.sr) + ' sections unread, ' + (next.pn - next.ps) + ' PYQs left to solve).</p>' : '<p><b>All PYQs solved.</b> Use the timed mock test and quick-fire tests to keep them fresh.</p>';
    ph += hbarsP(prow);
    ph += '<h3>Ideas to work on</h3>' + (weak.length ? '<ol>' + weak.slice(0, 5).map(w => '<li>' + L(w.t.id, esc(w.name)) + ' <small>(' + esc(w.t.title) + ': missed ' + w.miss + ' of ' + w.tries + ' tries)</small></li>').join('') + '</ol>' : '<p class="notice">Nothing flagged yet. After you answer a few quiz or PYQ questions, the ideas you miss most often appear here.</p>');
    ph += '<details class="bk"><summary>Back up or move your progress</summary><p class="notice">Progress is stored in this browser only. Copy the text below and keep it somewhere safe; paste it on another device and press Restore.</p><textarea id="bk-text" rows="5" style="width:100%" placeholder="Press Export, or paste backup text here and press Restore" aria-label="Backup text"></textarea><div class="row"><button class="btn small" id="bk-exp">Export</button><button class="btn small sec" id="bk-imp">Restore from text</button><span id="bk-msg" class="notice"></span></div></details></section>';
  }
  let h = ph + wh + '<section class="hx"><h2>PYQ analysis</h2><p class="notice">Computed from the ' + n + ' past-year questions on this site (' + total + ' marks, ' + exams.length + ' papers). Marks are the marks printed in the question papers; sub-questions of a case study are counted separately. This shows what was asked before, not what will be asked.</p>';
  h += '<div class="stats"><div><b>' + n + '</b><small>questions</small></div><div><b>' + total + '</b><small>marks</small></div><div><b>' + exams.length + '</b><small>papers</small></div><div><b>' + topicList.length + '</b><small>topics</small></div></div>';
  h += '<h3>Marks by topic</h3>' + bars(topicList.map(k => [k, byTopic[k].m, byTopic[k].m + ' marks (' + pct(byTopic[k].m) + '%), ' + byTopic[k].n + ' Qs']), byTopic[topicList[0]].m);
  h += '<p><b>Reading it:</b> the top three topics (' + top3.map(esc).join(', ') + ') hold ' + top3m + ' of ' + total + ' marks, which is ' + pct(top3m) + '%.</p>';
  h += '<h3>Question types</h3>' + bars(Object.keys(byType).sort((a, b) => byType[b].m - byType[a].m).map(k => [k, byType[k].m, byType[k].m + ' marks, ' + byType[k].n + ' Qs']), Math.max.apply(null, Object.keys(byType).map(k => byType[k].m)));
  h += '<h3>Marks per paper in this bank</h3>' + bars(exams.map(e => [e, byEx[e].m, byEx[e].m + ' marks, ' + byEx[e].n + ' Qs']), Math.max.apply(null, exams.map(e => byEx[e].m))) + '<p class="notice">Papers differ because only the questions of these topics are counted, and some papers carry only part of the syllabus.</p>';
  h += '<h3>Which topics appeared in which paper (marks)</h3><div class="tablewrap"><table class="heat"><thead><tr><th>Topic</th>' + exams.map(e => '<th>' + esc(e) + '</th>').join('') + '<th>Papers</th></tr></thead><tbody>' + topicList.map(tn => '<tr><td>' + esc(tn) + '</td>' + exams.map(e => { const v = matrix[tn][e] || 0; return '<td class="h' + (v === 0 ? 0 : v < 4 ? 1 : v < 8 ? 2 : 3) + '">' + (v || '') + '</td>'; }).join('') + '<td><b>' + appears(tn) + '/' + exams.length + '</b></td></tr>').join('') + '</tbody></table></div><p class="notice">Darker cell means more marks from that topic in that paper. A topic that shows up in most papers is a safe investment.</p>';
  h += '<h3>Ten highest-mark ideas</h3><ol>' + topConcepts.map(k => '<li>' + esc(k) + ' <small>(' + cg[k].m + ' marks, ' + cg[k].n + ' Qs)</small></li>').join('') + '</ol></section>';

  /* study guides */
  h += '<section class="hx"><h2>How to study for the first time</h2><p class="notice">Use this if you are meeting the topics for the first time. Plan about 6 to 8 hours per topic, spread over two days.</p><ol class="guide">'
    + '<li><b>Set up (10 min).</b> Open the topic, read the orientation section: what you will learn and how many marks it carried in past papers.</li>'
    + '<li><b>Prerequisites first (20 to 30 min).</b> Do the "Start here" section even if it looks easy. Most mistakes later come from weak basics such as dot products, logs or probabilities.</li>'
    + '<li><b>One idea at a time (45 to 60 min each).</b> For every concept section: read the intuition and the analogy, then the definition, then follow every worked example with a pen, and only then do the quick check. If you miss a check question, re-read that section before moving on.</li>'
    + '<li><b>Say it back.</b> After each section close the page and explain the idea aloud in two sentences, then write the formula from memory with every symbol defined.</li>'
    + '<li><b>Attempt PYQs before opening solutions (60 to 90 min).</b> Try each question for a few minutes on paper, enter your answer, then read the solution. When you are wrong, note the cause with the mistake tags.</li>'
    + '<li><b>Revision page and topic test (30 min).</b> Read the revision page once, then take the topic test and give an honest confidence for each answer.</li>'
    + '<li><b>Next day, 20 minutes.</b> Redo the mistakes from the Mistake review page, then the checklist. Tick a skill only if you can do it without notes.</li>'
    + '<li><b>Follow the topic order.</b> Topics are listed in the order to learn them: linear regression, then ridge/lasso and MAP, then kernels; then k-NN, decision trees and Naive Bayes; cross-validation comes after the models it compares; legacy material is last.</li></ol>'
    + '<h2>How to study to maximise marks</h2><p class="notice">Use this when time is short or you already know the basics. It is a strategy built from the analysis above.</p><ol class="guide">'
    + '<li><b>Spend time where the marks are.</b> The three highest-mark topics (' + top3.map(esc).join(', ') + ') carry ' + pct(top3m) + '% of the marks in this bank. Secure them completely before polishing small topics.</li>'
    + '<li><b>Prefer topics that appear in many papers.</b> Use the paper-by-topic table: a topic present in most papers is more dependable than one that appeared once.</li>'
    + '<li><b>Go for easy marks first.</b> Many numeric questions need one or two steps (parameter counts, one entropy, one kernel value). Practise these until they take under 3 minutes each.</li>'
    + '<li><b>Learn the fixed patterns.</b> The same question types repeat with new numbers: the Cheatsheet page lists the formula and the first move for each pattern.</li>'
    + '<li><b>Study your own errors.</b> Open Mistake review: fix the ones where you were sure and wrong first, because those cost marks in the exam.</li>'
    + '<li><b>Read the traps list.</b> Many lost marks come from a repeated trap such as forgetting the bias term or the +1 in a kernel. The Cheatsheet page collects them.</li>'
    + '<li><b>Exam technique.</b> Write the formula before the numbers; for MSQ judge every option separately; keep the number of decimals the question asks for; leave a hard question after two minutes and return to it.</li>'
    + '<li><b>Last day.</b> Follow the plan on the Cheatsheet page: top topics first, redo mistakes, quick-fire tests, then stop.</li></ol>'
    + '<p><a class="btn" href="#cheat">Open the cheatsheet and exam revision page</a></p></section>';
  host.innerHTML = h;
  const bt = host.querySelector('#bk-text');
  if (bt) {
    const msg = t => { host.querySelector('#bk-msg').textContent = t; };
    host.querySelector('#bk-exp').addEventListener('click', () => { const txt = JSON.stringify(X.Store.s); bt.value = txt; bt.select(); try { const b = new Blob([txt], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'mlt-quiz2-progress.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { } msg('Exported. Copy the text in the box and keep it safe.'); });
    host.querySelector('#bk-imp').addEventListener('click', () => { let o; try { o = JSON.parse(bt.value); } catch (e) { msg('That is not valid backup text.'); return; } if (!o || typeof o !== 'object' || typeof o.topics !== 'object') { msg('That text does not look like a progress backup.'); return; } if (window.confirm && !window.confirm('Replace the progress in this browser with the backup?')) return; const s = X.Store.s; Object.keys(s).forEach(k => { delete s[k]; }); Object.assign(s, o); s.topics = s.topics || {}; s.mistakes = s.mistakes || []; s.meta = s.meta || {}; s.epoch = Date.now(); X.Store.save(); const mc = document.getElementById('mistake-count'); if (mc) mc.textContent = s.mistakes.length || ''; msg('Restored.'); if (window.MLTQ) window.MLTQ.route(); });
  }
  X.renderMath(host);
};
