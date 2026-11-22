/* Timed mock test built from the PYQs on this site. */
window.MOCK = function (host, X) {
  const { el, esc, topics, M, Store, TS, renderMath, logMistake } = X;
  const all = topics.filter(Boolean).sort((a, b) => ((M().topics.find(t => t.id === a.id) || {}).n || 0) - ((M().topics.find(t => t.id === b.id) || {}).n || 0));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const strip = h => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const c = el('div', { class: 'col mock' }); host.appendChild(c);
  let timer = null; const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const keyTxt = p => p.type === 'SA' ? (p.key.show || (p.key.lo + ' to ' + p.key.hi)) : 'option(s) ' + p.key.opts.map(i => i + 1).join(', ');
  const fmt = s => Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);

  function setup() {
    stop(); c.innerHTML = '';
    const hist = (Store.s.mocks || []).slice(0, 5);
    let h = '<div class="hero"><div class="eyebrow">Practice</div><h1>Timed mock test</h1><p class="lead">Questions are drawn from the past papers on this site. No solutions are shown until you submit, like the real exam. Full marks are given only for an exactly correct answer.</p></div>';
    h += '<div class="box"><h3 style="margin-top:0">1. Choose topics</h3><div class="mockt">' + all.map(t => '<label class="opt"><input type="checkbox" class="mt" value="' + t.id + '" checked><span class="optbody">' + esc(t.title) + ' <small>(' + t.pyqs.length + ' Qs)</small></span></label>').join('') + '</div>';
    h += '<h3>2. Choose size</h3><div class="row"><label>Questions <select id="mk-n"><option>5</option><option>10</option><option selected>15</option><option>20</option><option>30</option></select></label><label>Minutes <input id="mk-min" class="num" style="width:80px" type="text" inputmode="numeric" value="30"></label></div>';
    h += '<label class="opt"><input type="checkbox" id="mk-un"><span class="optbody">Only questions I have not solved correctly yet</span></label><label class="opt"><input type="checkbox" id="mk-mis"><span class="optbody">Only questions in my Mistake review</span></label>';
    h += '<p class="notice" id="mk-info"></p><button class="btn" id="mk-go">Start the test</button></div>';
    if (hist.length) h += '<h3>Your recent mock tests</h3><div class="tablewrap"><table class="heat"><thead><tr><th>When</th><th>Questions</th><th>Score</th><th>Time used</th></tr></thead><tbody>' + hist.map(x => '<tr><td>' + new Date(x.when).toLocaleString() + '</td><td>' + x.n + '</td><td>' + x.score + ' / ' + x.total + ' (' + Math.round(100 * x.score / (x.total || 1)) + '%)</td><td>' + fmt(x.used) + ' of ' + x.minutes + ' min</td></tr>').join('') + '</tbody></table></div>';
    c.innerHTML = h;
    const pool = () => {
      const ids = Array.prototype.slice.call(c.querySelectorAll('.mt:checked')).map(i => i.value);
      const un = c.querySelector('#mk-un').checked, mis = c.querySelector('#mk-mis').checked;
      const mk = new Set((Store.s.mistakes || []).map(m => m.key));
      const out = []; all.filter(t => ids.indexOf(t.id) >= 0).forEach(t => t.pyqs.forEach(p => { if (un && (TS(t.id).pyq[p.id] || {}).status === 'correct') return; if (mis && !mk.has(t.id + ':p:' + p.id)) return; out.push({ t, p }); })); return out;
    };
    const info = () => { const n = pool().length; const k = +c.querySelector('#mk-n').value; c.querySelector('#mk-info').textContent = n + ' questions match your choices' + (n < k ? '; the test will use all ' + n + '.' : '.'); c.querySelector('#mk-go').disabled = n === 0; };
    c.querySelectorAll('input,select').forEach(i => i.addEventListener('change', info)); info();
    c.querySelector('#mk-n').addEventListener('change', () => { c.querySelector('#mk-min').value = Math.round(+c.querySelector('#mk-n').value * 2); });
    c.querySelector('#mk-min').value = Math.round(+c.querySelector('#mk-n').value * 2);
    c.querySelector('#mk-go').addEventListener('click', () => { const pl = shuffle(pool()).slice(0, +c.querySelector('#mk-n').value); const mins = Math.max(1, parseInt(c.querySelector('#mk-min').value, 10) || 30); run(pl, mins); });
  }

  function run(list, mins) {
    stop(); c.innerHTML = '';
    const total = list.reduce((s, x) => s + (+x.p.marks || 0), 0), t0 = Date.now(); let left = mins * 60, finished = false;
    const bar = el('div', { class: 'mockbar' }, '<b>Mock test</b><span id="mk-left"></span><span>' + list.length + ' questions, ' + total + ' marks</span>'); const sb = el('button', { class: 'btn' }, 'Submit test'); bar.appendChild(sb); c.appendChild(bar);
    const ans = list.map(() => ({ ch: [], val: '' })), cards = [];
    list.forEach((x, qi) => {
      const p = x.p, card = el('article', { class: 'pyq mq' }); cards.push(card);
      card.appendChild(el('div', { class: 'ph' }, '<b>Q' + (qi + 1) + '</b><span>' + p.marks + ' mark' + (p.marks === 1 ? '' : 's') + '</span><span class="pill">' + p.type + '</span>'));
      const body = el('div', { class: 'pb' }); card.appendChild(body);
      if (p.context) body.appendChild(el('div', { class: 'ctx' }, '<b>Passage:</b> ' + p.context));
      body.appendChild(el('div', { class: 'qz-stem' }, p.wording));
      const box = el('div', { class: 'opts' }); body.appendChild(box);
      if (p.type === 'SA') { const inp = el('input', { class: 'num', type: 'text', inputmode: 'decimal', placeholder: 'Your numeric answer', 'aria-label': 'Your numeric answer' }); inp.addEventListener('input', () => { ans[qi].val = inp.value; }); box.appendChild(inp); }
      else { const multi = p.type === 'MSQ'; if (multi) box.appendChild(el('p', { class: 'notice' }, 'Select all that apply.')); p.options.forEach((o, i) => { const lab = el('label', { class: 'opt' }); const inp = el('input', { type: multi ? 'checkbox' : 'radio', name: 'mq' + qi }); inp.addEventListener('change', () => { ans[qi].ch = multi ? Array.prototype.slice.call(box.querySelectorAll('input')).map((z, j) => z.checked ? j : -1).filter(j => j >= 0) : [i]; }); lab.appendChild(inp); lab.appendChild(el('span', { class: 'optbody' }, o)); box.appendChild(lab); }); }
      c.appendChild(card);
    });
    renderMath(c);
    const tick = () => { const e = c.querySelector('#mk-left'); if (!e) { stop(); return; } e.textContent = 'Time left: ' + fmt(Math.max(0, left)); e.className = left < 60 ? 'low' : ''; if (left <= 0) finish(true); left--; };
    function finish(auto) {
      if (finished) return; finished = true; stop();
      const used = Math.min(mins * 60, Math.round((Date.now() - t0) / 1000));
      let score = 0; const per = {}; const res = list.map((x, qi) => {
        const p = x.p; let ok = false, given = '';
        if (p.type === 'SA') { const v = parseFloat(ans[qi].val); given = ans[qi].val.trim() || 'no answer'; ok = !isNaN(v) && v >= p.key.lo - 1e-9 && v <= p.key.hi + 1e-9; }
        else { const a = ans[qi].ch.slice().sort((u, v) => u - v), k = p.key.opts.slice().sort((u, v) => u - v); given = a.length ? 'option(s) ' + a.map(i => i + 1).join(', ') : 'no answer'; ok = a.length === k.length && k.every((v, i) => v === a[i]); }
        if (X.logEvent) X.logEvent(x.t.id, p.concept, ok, '-', 'Mock'); const m = +p.marks || 0; if (ok) score += m; per[x.t.id] = per[x.t.id] || { t: x.t, got: 0, of: 0 }; per[x.t.id].of += m; if (ok) per[x.t.id].got += m;
        if (!ok && logMistake) logMistake({ key: x.t.id + ':p:' + p.id, topic: x.t.id, src: 'Mock', ref: p.id, label: p.exam + ' ' + p.qno + ': ' + strip(p.wording).slice(0, 90), conf: '-', tag: '', when: Date.now(), concept: p.concept });
        return { x, ok, given };
      });
      Store.s.mocks = (Store.s.mocks || []); Store.s.mocks.unshift({ when: Date.now(), n: list.length, total, score, used, minutes: mins }); Store.s.mocks.length = Math.min(Store.s.mocks.length, 30); Store.save();
      c.innerHTML = '';
      let h = '<div class="hero"><div class="eyebrow">Result</div><h1>' + score + ' / ' + total + ' marks (' + Math.round(100 * score / (total || 1)) + '%)</h1><p class="lead">' + (auto ? 'Time ran out and the test was submitted. ' : '') + 'Time used: ' + fmt(used) + ' of ' + mins + ':00. Wrong answers were added to your Mistake review.</p></div>';
      h += '<h3>By topic</h3><div class="tablewrap"><table class="heat"><thead><tr><th>Topic</th><th>Marks</th></tr></thead><tbody>' + Object.keys(per).map(k => '<tr><td><a href="#t-' + k + '">' + esc(per[k].t.title) + '</a></td><td>' + per[k].got + ' / ' + per[k].of + '</td></tr>').join('') + '</tbody></table></div><h3>Question by question</h3>';
      c.innerHTML = h;
      res.forEach((r, i) => { const p = r.x.p; const d = el('details', { class: 'mres ' + (r.ok ? 'good' : 'bad') }); d.open = !r.ok; d.innerHTML = '<summary>' + (r.ok ? '✓' : '✗') + ' Q' + (i + 1) + ' &middot; ' + esc(p.exam) + ' ' + esc(p.qno) + ' &middot; ' + p.marks + ' mark(s) &middot; ' + esc(r.x.t.title) + '</summary><div class="qz-stem">' + p.wording + '</div><p><b>Your answer:</b> ' + esc(r.given) + '<br><b>Key:</b> ' + esc(keyTxt(p)) + ' <span class="tag ' + p.tag + '">[' + p.tag + ']</span></p>' + (p.sol && p.sol.rule ? '<div class="notice"><b>Rule:</b> ' + p.sol.rule + '</div>' : '') + '<p><a href="#t-' + r.x.t.id + '">Open the topic and the full solution</a></p>'; c.appendChild(d); });
      const again = el('button', { class: 'btn' }, 'Set up another test'); again.addEventListener('click', setup); c.appendChild(again);
      renderMath(c); window.scrollTo && c.scrollIntoView && c.scrollIntoView({ block: 'start' });
    }
    sb.addEventListener('click', () => { if (confirm_(list.length, ans)) finish(false); });
    tick(); timer = setInterval(tick, 1000);
  }
  function confirm_(n, ans) { const un = ans.filter(a => !a.ch.length && !String(a.val).trim()).length; if (!un) return true; return window.confirm ? window.confirm(un + ' of ' + n + ' questions are unanswered. Submit anyway?') : true; }
  setup();
};
