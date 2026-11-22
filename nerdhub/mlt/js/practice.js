/* "Practice next": adaptive planner. Uses window.ADAPT (js/adapt.js) and the answer log in Store.s.events. */
window.PRACTICE = function (host, X) {
  const { el, esc, topics, Store, TS, renderMath, runQuiz, conceptName } = X;
  const A = window.ADAPT, DAY = A.DAY;

  const concepts = [];
  topics.forEach(t => Object.keys(t.concepts || {}).forEach(cid => concepts.push({ key: t.id + ':' + cid, tid: t.id, cid, topic: t, name: t.concepts[cid].name || cid, marks: +t.concepts[cid].marks || 0 })));
  const events = Store.s.events || [];
  const now = Date.now() / DAY;
  const S = A.fromEvents(concepts, events);
  const rk = A.rank(concepts, S, now);
  const ready = A.readiness(concepts, S, now);
  const n = events.length;
  const pct = x => Math.round(x * 100);

  function ago(st) { if (st.last == null) return 'not attempted yet'; const d = now - st.last; return d < 1 / 24 ? 'under an hour ago' : d < 1 ? Math.round(d * 24) + ' hours ago' : (Math.round(d * 10) / 10) + ' days ago'; }
  function lastOutcome(key) { for (let i = events.length - 1; i >= 0; i--) if (events[i].topic + ':' + events[i].concept === key) return events[i].ok ? 'right' : 'wrong'; return null; }
  function why(r) {
    const st = r.st;
    if (st.n === 0) return 'You have not answered anything on this idea yet, so the model can only use its starting guess. It is worth ' + pct(r.w) + '% of the paper.';
    const lo = lastOutcome(r.c.key), fade = st.pL > 0 && A.known(st, now) < 0.7 * st.pL;
    return 'Your last answer was ' + lo + ' (' + ago(st) + '). ' + (fade ? 'Memory of this idea has faded since then (half-life about ' + (Math.round(st.h * 10) / 10) + ' days). ' : '') + 'It is worth ' + pct(r.w) + '% of the paper.';
  }
  function questionsFor(r) {
    const t = r.c.topic, T = TS(t.id), pool = [];
    (t.test || []).forEach(q => { if (q.concept === r.c.cid) pool.push(q); });
    (t.sections || []).forEach(s => (s.quiz || []).forEach(q => { if (q.concept === r.c.cid && !pool.some(x => x.id === q.id)) pool.push(q); }));
    return pool.sort((a, b) => ((T.q[a.id] || {}).tries || 0) - ((T.q[b.id] || {}).tries || 0)).slice(0, 3);
  }

  const col = el('div', { class: 'col' }); host.appendChild(col);
  col.appendChild(el('h1', {}, 'Practice next'));
  col.appendChild(el('p', { class: 'lead' }, 'This page ranks the ideas by how many marks you are expected to lose on them. It uses your answers, how sure you said you were, how long ago you practised each idea, and how many marks the idea carries in past papers.'));

  const sum = el('div', { class: 'stats' });
  sum.innerHTML = '<div><b>' + pct(ready) + '%</b><small>Estimated paper score today</small></div><div><b>' + n + '</b><small>Answers the model has seen</small></div><div><b>' + concepts.length + '</b><small>Ideas tracked</small></div>';
  col.appendChild(sum);
  col.appendChild(el('p', { class: 'notice' }, n < 20 ? 'You have answered only ' + n + ' question(s), so this estimate is mostly the model\'s starting guess. It gets more useful after about 20 answers (quiz questions, PYQs or the mock test all count).' : 'The estimate comes from your own answers only. It is a planning aid, not a prediction of your real marks.'));

  col.appendChild(el('h2', {}, 'Practise these next'));
  const panel = el('div', { class: 'ppanel' });
  const list = el('div', {});
  rk.slice(0, 8).forEach((r, i) => {
    const card = el('div', { class: 'pcard' });
    card.innerHTML = '<div class="phead"><b>' + (i + 1) + '. ' + esc(r.c.name) + '</b><span class="pill">' + esc(r.c.topic.title) + '</span></div>' +
      '<div class="pmeter"><span>Chance of getting a new question on this right: <b>' + pct(r.p) + '%</b></span><div class="ptrack"><i style="width:' + pct(r.p) + '%"></i></div></div>' +
      '<p>' + esc(why(r)) + '</p>';
    const row = el('div', { class: 'row' });
    const qs = questionsFor(r);
    if (qs.length) {
      const b = el('button', { class: 'btn small' }, 'Practise (' + qs.length + ' question' + (qs.length > 1 ? 's' : '') + ')');
      b.addEventListener('click', () => { panel.innerHTML = ''; panel.scrollIntoView && panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); runQuiz(panel, r.c.topic, qs, { title: 'Practice: ' + r.c.name }); });
      row.appendChild(b);
    }
    row.appendChild(el('a', { class: 'btn small sec', href: '#t-' + r.c.tid }, 'Open the topic'));
    card.appendChild(row); list.appendChild(card);
  });
  col.appendChild(panel); col.appendChild(list);
  const again = el('button', { class: 'btn sec' }, 'Refresh the plan'); again.addEventListener('click', () => window.MLTQ.route()); col.appendChild(again);

  /* ---- how it works ---- */
  const how = el('details', { class: 'bk' });
  how.innerHTML = '<summary>How the model works</summary>' +
    '<p>For every idea the page keeps three numbers: <b>p</b>, the chance you know it as of your last attempt; <b>h</b>, how many days your memory of it lasts; and the time of the last attempt.</p>' +
    '<p><b>Forgetting.</b> The chance you still know it after $\\Delta$ days is $p\\cdot 2^{-\\Delta/h}$. Every $h$ days it halves.</p>' +
    '<p><b>Learning from an answer.</b> Each answer updates $p$ with Bayes\' rule (Bayesian knowledge tracing). A right answer you were sure of raises it a lot. A right answer you only guessed raises it a little, because a guess can be right by luck. A wrong answer lowers it. After the update there is a small bonus for having read the explanation. A right answer you were sure of doubles $h$; a wrong answer halves it.</p>' +
    '<p><b>Chance of a right answer.</b> With known-probability $k$, the chance of getting a new question right is $0.9k + 0.3(1-k)$: you can slip when you know it, and guess right when you do not.</p>' +
    '<p><b>Ranking.</b> Expected marks lost on an idea is its share of paper marks $w$ times $(1 - \\text{chance right})$. The idea with the largest value comes first. The share $w$ is the idea\'s PYQ marks divided by the total.</p>' +
    '<p>All the settings are in <code>js/adapt.js</code>. They are reasonable guesses, not fitted to real students.</p>';
  col.appendChild(how);

  /* ---- evidence from the offline simulation ---- */
  const ev = window.EVIDENCE;
  if (ev && ev.settings && ev.settings.length) {
    const sec = el('section', { class: 'hx' });
    sec.appendChild(el('h2', {}, 'Does this ranking help? A simulation'));
    sec.appendChild(el('p', { class: 'notice' }, 'These are SIMULATED students (' + ev.N + ' per setting, ' + ev.concepts + ' ideas, marks taken from the real PYQs). The simulation uses a different forgetting law and different parameters from the model above, so the model is tested on something it was not built for. It shows the method behaves sensibly. It does not show it helps real students.'));
    const main = ev.settings[0], get = (rows, nm) => rows.find(x => x.name === nm);
    const mk = (s) => { let h = '<table class="heat"><thead><tr><th>Way of choosing what to practise</th><th>Exam score % (mean ± 95% CI)</th><th>Gain over random, points</th></tr></thead><tbody>'; s.rows.forEach(r => { h += '<tr' + (r.name === 'Adaptive (ours)' ? ' class="me"' : '') + '><td>' + esc(r.name) + '</td><td>' + r.mean.toFixed(1) + ' ± ' + r.ci.toFixed(1) + '</td><td>' + (r.dm >= 0 ? '+' : '') + r.dm.toFixed(1) + ' ± ' + r.dci.toFixed(1) + '</td></tr>'; }); return h + '</tbody></table>'; };
    const a = get(main.rows, 'Adaptive (ours)'), mw = get(main.rows, 'Marks-weighted random'), wk = get(main.rows, 'Weakest accuracy'), eq = get(main.rows, 'Adaptive, equal weights');
    const long = ev.settings.find(s => s.D === 30);
    const lg = long && get(long.rows, 'Adaptive (ours)'), lm = long && get(long.rows, 'Marks-weighted random');
    sec.appendChild(el('h3', {}, main.D + ' study days, ' + main.K + ' questions a day'));
    sec.appendChild(el('div', { class: 'tablewrap' }, mk(main)));
    let t = '<ul>';
    t += '<li><b>Most of the gain comes from using marks.</b> Choosing ideas in proportion to their marks gains ' + mw.dm.toFixed(1) + ' points over random. The adaptive model gains ' + a.dm.toFixed(1) + ', so at ' + main.D + ' days the memory model adds only ' + (a.dm - mw.dm).toFixed(1) + ' points on top.</li>';
    if (lg) t += '<li><b>The memory model matters more over a longer plan.</b> At 30 days the adaptive model gains ' + lg.dm.toFixed(1) + ' points against ' + lm.dm.toFixed(1) + ' for marks-weighted random.</li>';
    t += '<li><b>"Work on your weakest topic" does worse than random</b> here (' + wk.dm.toFixed(1) + ' points). Weak ideas are often small ones, so time goes to marks you cannot win back.</li>';
    t += '<li><b>Ignoring marks hurts:</b> the same adaptive model with equal weights scores ' + eq.dm.toFixed(1) + ' points against random.</li></ul>';
    sec.appendChild(el('div', {}, t));
    const more = el('details', { class: 'bk' }); more.innerHTML = '<summary>Other settings (7, 14 and 30 days; 5, 10 and 20 questions a day)</summary>';
    ev.settings.slice(1).forEach(s => { more.appendChild(el('h3', {}, s.D + ' study days, ' + s.K + ' questions a day')); more.appendChild(el('div', { class: 'tablewrap' }, mk(s))); });
    sec.appendChild(more);
    col.appendChild(sec);
  }
  renderMath(host);
};
