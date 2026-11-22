/* Cheatsheet and exam revision page. Built from the loaded topic data, so it never goes out of date. */
window.CHEAT = function (host, X) {
  const { el, esc, topics, M, Store, TS, runQuiz, renderMath } = X;
  const c = el('div', { class: 'col cheat' }); host.appendChild(c);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const meta = id => M().topics.find(t => t.id === id) || {};
  const all = topics.filter(Boolean).sort((a, b) => (meta(a.id).n || 0) - (meta(b.id).n || 0));
  const totalMarks = all.reduce((s, t) => s + t.pyqs.reduce((x, p) => x + (+p.marks || 0), 0), 0);

  c.innerHTML = '<div class="hero"><div class="eyebrow">Exam mode</div><h1>Cheatsheet and exam revision</h1><p class="lead">Everything you need in the last days: priorities by marks, every formula, the facts to remember, the traps that cost marks, a last-day plan and quick-fire tests. ' + all.length + ' topics, ' + all.reduce((s, t) => s + t.pyqs.length, 0) + ' PYQs, ' + totalMarks + ' marks in total.</p></div>';
  const bar = el('div', { class: 'row cheat-bar' }); c.appendChild(bar);
  const pb = el('button', { class: 'btn' }, 'Print / save as PDF'); pb.addEventListener('click', () => { $all('details', c).forEach(d => d.open = true); window.print(); });
  bar.appendChild(pb);
  const jump = el('div', { class: 'cheat-jump' }, '<a href="#cheat" data-j="c-prio">Priorities</a><a href="#cheat" data-j="c-plan">Last-day plan</a>' + all.map(t => '<a href="#cheat" data-j="c-' + t.id + '">' + esc(t.title.replace(/^Legacy: /, '')) + '</a>').join('') + '<a href="#cheat" data-j="c-trap">Traps</a><a href="#cheat" data-j="c-flag">Check before exam</a><a href="#cheat" data-j="c-quick">Quick-fire</a>');
  c.appendChild(jump);
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  $all('a[data-j]', jump).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const n = document.getElementById(a.getAttribute('data-j')); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));

  /* A. priorities */
  const rows = [];
  all.forEach(t => Object.keys(t.concepts || {}).forEach(k => { const cc = t.concepts[k]; if (cc.marks > 0) { const st = (TS(t.id).concept || {})[k] || {}; rows.push({ t, k, cc, miss: st.miss || 0, tries: st.tries || 0 }); } }));
  rows.sort((a, b) => b.cc.marks - a.cc.marks);
  const ease = e => e >= 3 ? 'easy' : e === 2 ? 'medium' : 'harder';
  let h = '<h2 id="c-prio">1. What to revise first (by PYQ marks)</h2><p class="notice">Marks come from the past-year questions in this project. Start at the top: high marks and easy to secure. "Your misses" is from your own quiz and PYQ attempts on this browser.</p><div class="tablewrap"><table><thead><tr><th>Topic</th><th>Idea</th><th>PYQ marks</th><th>Difficulty</th><th>Your misses</th><th>One-line repair</th></tr></thead><tbody>';
  rows.forEach(r => { h += '<tr><td><a href="#t-' + r.t.id + '">' + esc(r.t.title.replace(/^Legacy: /, 'Legacy: ')) + '</a></td><td>' + esc(r.cc.name) + '</td><td><b>' + r.cc.marks + '</b></td><td>' + ease(r.cc.ease) + '</td><td>' + (r.tries ? r.miss + ' of ' + r.tries + ' tries' : '-') + '</td><td>' + (r.cc.repair || '') + '</td></tr>'; });
  h += '</tbody></table></div>';
  c.appendChild(el('section', { class: 'csec' }, h));

  /* B. last-day plan */
  c.appendChild(el('section', { class: 'csec' }, '<h2 id="c-plan">2. Last-day plan</h2><ol class="plan"><li><b>Morning (about 90 min).</b> Read the topic cards below for the three highest-mark topics. Say each formula aloud and cover the page to write it from memory.</li><li><b>Late morning (about 60 min).</b> Re-attempt the PYQs you missed (Mistake review page). For each, name the trap before you solve.</li><li><b>Afternoon (about 60 min).</b> Quick-fire tests for the topics where "Your misses" is not empty. Aim for full marks twice in a row.</li><li><b>Evening (about 30 min).</b> Read the Traps section once and the "Check before exam" list. Stop. Sleep.</li><li><b>In the exam.</b> Write the formula first, then plug in numbers; check units and signs; for MSQ test every option on its own; for numeric answers keep the decimals the question asks for.</li></ol>'));

  /* C. per topic cheat cards */
  all.forEach(t => {
    const rev = (t.sections || []).find(s => s.id === 'revision');
    let s = '<h2 id="c-' + t.id + '">' + (meta(t.id).n || '') + '. ' + esc(t.title) + ' <a class="small" href="#t-' + t.id + '">open topic</a></h2>';
    s += '<h3>Formulas</h3><div class="fgrid">' + (t.formulas || []).map(f => '<div class="fcard"><b>' + f.name + '</b><div>$$' + f.tex + '$$</div><div>' + (f.note || '') + '</div></div>').join('') + '</div>';
    if (rev) s += '<div class="revbox">' + rev.html + '</div>';
    c.appendChild(el('section', { class: 'csec' }, s));
  });

  /* D. traps */
  let tr = '<h2 id="c-trap">Traps that cost marks</h2><p class="notice">Taken from the solution of every PYQ. Skim these before the exam.</p>';
  all.forEach(t => {
    const seen = {}, items = [];
    t.pyqs.forEach(p => { const x = p.sol && p.sol.trap; if (x && !seen[x]) { seen[x] = 1; items.push('<li>' + x + ' <small>(' + esc(p.exam.replace(/ \(.*\)/, '')) + ' ' + esc(p.qno) + ')</small></li>'); } });
    tr += '<details><summary>' + esc(t.title) + ' <small>(' + items.length + ')</small></summary><ul>' + items.join('') + '</ul></details>';
  });
  c.appendChild(el('section', { class: 'csec' }, tr));

  /* E. flags */
  const flags = [['Aug 2024 SA Q3 (linear regression)', 'Bank key 0.73, but the printed data give 0.673. If the exam gives this style, trust your own calculation.'], ['Dec 2023 Q10 (ridge)', 'Computed w is about [1.049, 0.024], which is none of the listed options: answer "None of these".'], ['Aug 2024 Q26 (Naive Bayes, a+c+e)', 'Bank key 1.5, computed 1.25 from the printed data.'], ['Aug 2023 Q17 (Bayes error)', 'Key is clipped in the bank (0.25 or 0.5); the overall Bayes error works out to 0.25.'], ['Jul 2022 Q21, Q22 (k-NN Manhattan)', 'Figure coordinates are not in the bank, so these two are not solved on the site. Revise Manhattan distance by hand.'], ['[DERIVED] answers', 'Many MCQ/MSQ keys are missing from the bank. They are marked [DERIVED] with the reasoning; check the ones you are unsure about with your lecture notes.']];
  c.appendChild(el('section', { class: 'csec' }, '<h2 id="c-flag">Check before the exam</h2><p class="notice">Places where a key and my calculation disagree, or where the bank is incomplete.</p><ul>' + flags.map(f => '<li><b>' + f[0] + '.</b> ' + f[1] + '</li>').join('') + '</ul>'));

  /* F. quick-fire */
  const qs = el('section', { class: 'csec' }, '<h2 id="c-quick">Quick-fire tests</h2><p class="notice">Eight mixed questions per topic, shuffled each time. Results are saved like any other quiz.</p>'); c.appendChild(qs);
  const qrow = el('div', { class: 'cheat-jump' }); qs.appendChild(qrow);
  const qhost = el('div', { class: 'noprint' }); qs.appendChild(qhost);
  all.forEach(t => { if (!t.test || !t.test.length) return; const b = el('button', { class: 'btn sec small' }, esc(t.title.replace(/^Legacy: /, '')) + ' (' + t.test.length + ')'); b.addEventListener('click', () => { runQuiz(qhost, t, shuffle(t.test), { title: 'Quick-fire: ' + t.title }); renderMath(qhost); qhost.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); qrow.appendChild(b); });
  renderMath(c);
};
