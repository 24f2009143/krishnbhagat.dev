/* Shared engine: page, quiz runner, PYQ cards, search, formula drawer, checklist, mistakes, progress.
   Topics are plain data files in topics/. Nothing here is topic specific. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ERROR_TAGS = [
    ['PREREQ', 'Missing prerequisite'], ['CONCEPT', 'Concept not understood'], ['RECOGNITION', 'Did not recognise the question type'],
    ['METHOD', 'Wrong method'], ['EXECUTION', 'Right method, slipped in steps'], ['ARITHMETIC', 'Arithmetic or log slip'],
    ['READING', 'Misread the question'], ['EDGE CASE', 'Edge case / tie / boundary'], ['MEMORY', 'Forgot a fact or formula'], ['TIME', 'Rushed']
  ];

  /* ---------- storage (falls back to memory if blocked) ---------- */
  const Store = (function () {
    const KEY = 'mltq2.v1';
    let persistent = true;
    function fresh() { return { theme: 'light', large: false, topics: {}, mistakes: [], meta: {}, events: [] }; }
    let state = null;
    try { const r = window.localStorage.getItem(KEY); if (r) state = JSON.parse(r); } catch (e) { persistent = false; }
    if (!state || typeof state !== 'object') state = fresh();
    state.topics = state.topics || {}; state.mistakes = state.mistakes || []; state.meta = state.meta || {}; state.events = state.events || [];
    try { window.localStorage.setItem('__t', '1'); window.localStorage.removeItem('__t'); } catch (e) { persistent = false; }
    function save() { try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { persistent = false; } try { window.dispatchEvent(new CustomEvent('mltq-saved')); } catch (e) { /* ignore */ } }
    return {
      get s() { return state; }, save, get persistent() { return persistent; },
      resetAll() { state = fresh(); state.epoch = Date.now(); save(); },
      resetTopic(id) { delete state.topics[id]; state.mistakes = state.mistakes.filter(m => m.topic !== id); state.events = (state.events || []).filter(e => e.topic !== id); state.epoch = Date.now(); save(); }
    };
  })();
  function TS(id) {
    const t = Store.s.topics[id] || (Store.s.topics[id] = {});
    ['read', 'q', 'pyq', 'check', 'concept'].forEach(k => { t[k] = t[k] || {}; });
    return t;
  }

  /* ---------- helpers ---------- */
  function renderMath(root) {
    try { if (window.renderMathInElement) window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { /* ignore */ }
  }
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
  function strip(html) { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  const M = () => window.MANIFEST;
  const loaded = {};
  function loadTopic(id) {
    const m = M().topics.find(t => t.id === id);
    if (!m || m.status !== 'ready') return Promise.resolve(null);
    if (window.TOPICS && window.TOPICS[id]) return Promise.resolve(window.TOPICS[id]);
    if (loaded[id]) return loaded[id];
    loaded[id] = new Promise(res => {
      const s = document.createElement('script'); s.src = m.file;
      s.onload = () => res((window.TOPICS || {})[id] || null);
      s.onerror = () => res(null);
      document.head.appendChild(s);
    });
    return loaded[id];
  }

  /* ---------- quiz runner ---------- */
  function isCorrect(q, ans) {
    if (q.type === 'num') { const v = parseFloat(ans); return !isNaN(v) && Math.abs(v - q.num.ans) <= (q.num.tol || 0) + 1e-9; }
    const ok = q.options.map((o, i) => o.ok ? i : -1).filter(i => i >= 0);
    const ch = (ans || []).slice().sort((a, b) => a - b);
    return ok.length === ch.length && ok.every((v, i) => v === ch[i]);
  }
  function tagSelect(current, onchange) {
    const s = el('select', { class: 'tagsel', 'aria-label': 'Error tag' });
    s.appendChild(el('option', { value: '' }, 'Tag this mistake...'));
    ERROR_TAGS.forEach(t => { const o = el('option', { value: t[0] }, t[0] + ' - ' + t[1]); if (t[0] === current) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onchange(s.value));
    return s;
  }
  function logMistake(entry) {
    const arr = Store.s.mistakes;
    const idx = arr.findIndex(m => m.key === entry.key);
    if (idx >= 0) { entry.tag = arr[idx].tag || entry.tag; arr.splice(idx, 1); }
    arr.unshift(entry); if (arr.length > 300) arr.length = 300;
    Store.save(); updateMistakeBadge();
  }
  function setMistakeTag(key, tag) { const m = Store.s.mistakes.find(x => x.key === key); if (m) { m.tag = tag; Store.save(); } }
  function updateMistakeBadge() { const n = Store.s.mistakes.length; $('#mistake-count').textContent = n ? n : ''; }

  /* one row per answered question; the adaptive model (js/adapt.js) is rebuilt from these */
  function logEvent(topicId, concept, ok, conf, src) {
    if (!concept) return;
    const a = Store.s.events || (Store.s.events = []);
    a.push({ t: Date.now(), topic: topicId, concept, ok: ok ? 1 : 0, conf: (conf === 'Sure' || conf === 'Guess') ? conf : 'Unsure', src });
    if (a.length > 4000) a.splice(0, a.length - 4000);
    Store.save();
  }

  function conceptName(topic, c) { return (topic.concepts && topic.concepts[c] && topic.concepts[c].name) || c; }

  function recordResult(topic, q, ok, conf, source) {
    const T = TS(topic.id), C = (T.concept[q.concept] = T.concept[q.concept] || { miss: 0, secure: 0, right: 0, tries: 0 });
    const qs = (T.q[q.id] = T.q[q.id] || { tries: 0, right: 0 });
    qs.tries++; C.tries++;
    let note = null, repair = false, moved = false;
    if (ok) { qs.right++; C.right++; if (conf === 'Sure') { C.secure++; if (C.secure === 3) { C.moved = true; moved = true; } } else { C.secure = 0; note = 'Correct but not yet secure: you were ' + conf.toLowerCase() + '. Re-test this idea later.'; } }
    else { C.miss++; C.secure = 0; if (C.miss % 3 === 0) repair = true; if (conf === 'Sure') note = 'DANGEROUS MISCONCEPTION: you were sure and wrong. Read the explanation of your chosen option twice.'; }
    qs.last = ok ? 1 : 0; qs.conf = conf;
    logEvent(topic.id, q.concept, ok, conf, source || 'Quiz');
    Store.save();
    return { note, repair, moved, C };
  }

  function runQuiz(host, topic, questions, opts) {
    opts = opts || {};
    const title = opts.title || 'Check yourself';
    let list = questions.slice(), idx = 0, results = [];
    function start(qs) { list = qs; idx = 0; results = []; show(); }
    function show() {
      host.innerHTML = '';
      const box = el('div', { class: 'qz' }); host.appendChild(box);
      if (idx >= list.length) return summary(box);
      const q = list[idx];
      let chosen = [], conf = null, done = false;
      const top = el('div', { class: 'qz-top' });
      top.innerHTML = '<span><b>' + esc(title) + '</b></span><span>Question ' + (idx + 1) + ' of ' + list.length + '</span><span class="pill">' + esc(q.level || 'moderate') + '</span><span class="pill">' + esc(conceptName(topic, q.concept)) + '</span>';
      box.appendChild(top);
      box.appendChild(el('div', { class: 'qz-stem' }, q.stem));
      const optsBox = el('div', { class: 'opts' }); box.appendChild(optsBox);
      let numInput = null;
      const submit = el('button', { class: 'btn', disabled: 'disabled' }, 'Submit');
      function ready() { const has = q.type === 'num' ? (numInput.value.trim() !== '' && !isNaN(parseFloat(numInput.value))) : chosen.length > 0; submit.disabled = !(has && conf) || done; }
      if (q.type === 'num') {
        const wrap = el('div', { class: 'row' });
        numInput = el('input', { class: 'num', type: 'text', inputmode: 'decimal', placeholder: 'Type a number', 'aria-label': 'Your numeric answer' });
        numInput.addEventListener('input', ready); wrap.appendChild(numInput);
        if (q.num.unit) wrap.appendChild(el('span', {}, esc(q.num.unit)));
        optsBox.appendChild(wrap);
      } else {
        const multi = q.type === 'msq';
        if (multi) optsBox.appendChild(el('p', { class: 'notice' }, 'Select all that apply.'));
        q.options.forEach((o, i) => {
          const lab = el('label', { class: 'opt' });
          const inp = el('input', { type: multi ? 'checkbox' : 'radio', name: 'q' + q.id });
          inp.addEventListener('change', () => {
            if (done) return;
            if (multi) { chosen = $$('input', optsBox).map((x, j) => x.checked ? j : -1).filter(j => j >= 0); }
            else chosen = [i];
            $$('.opt', optsBox).forEach((l, j) => l.classList.toggle('sel', chosen.indexOf(j) >= 0));
            ready();
          });
          lab.appendChild(inp); lab.appendChild(el('span', { class: 'optbody' }, o.t)); optsBox.appendChild(lab);
        });
      }
      if (q.hint) { const d = el('details', {}, '<summary>Hint</summary><p>' + q.hint + '</p>'); box.appendChild(d); }
      const confRow = el('div', { class: 'conf' }, '<span>How sure are you?</span>');
      ['Sure', 'Unsure', 'Guess'].forEach(c => {
        const b = el('button', { type: 'button' }, c);
        b.addEventListener('click', () => { if (done) return; conf = c; $$('button', confRow).forEach(x => x.classList.toggle('on', x === b)); ready(); });
        confRow.appendChild(b);
      });
      box.appendChild(confRow);
      const fb = el('div', { class: 'fb' });
      submit.addEventListener('click', () => {
        if (submit.disabled) return;
        done = true; submit.disabled = true;
        const ans = q.type === 'num' ? numInput.value : chosen;
        const ok = isCorrect(q, ans);
        const info = recordResult(topic, q, ok, conf, 'quiz');
        results.push({ q, ok, conf });
        if (!ok) logMistake({ key: topic.id + ':q:' + q.id, topic: topic.id, src: 'Quiz', ref: q.id, label: strip(q.stem).slice(0, 110), conf, tag: '', when: Date.now(), concept: q.concept });
        let h = '<div class="verdict ' + (ok ? (conf === 'Sure' ? 'ok' : 'mid') : 'no') + '">' + (ok ? 'Correct' : 'Not correct') + ' (you said: ' + conf + ')</div>';
        if (info.note) h += '<p class="notice">' + info.note + '</p>';
        fb.innerHTML = h;
        if (q.type === 'num') fb.appendChild(el('p', {}, 'Answer: <b>' + esc(q.num.show || q.num.ans) + '</b>' + (q.num.tol ? ' (accepted within &plusmn;' + q.num.tol + ')' : '')));
        else {
          $$('.opt', optsBox).forEach((l, i) => {
            const o = q.options[i]; const isChosen = chosen.indexOf(i) >= 0;
            l.classList.toggle('right', !!o.ok); l.classList.toggle('wrong', isChosen && !o.ok);
            const body = $('.optbody', l);
            body.appendChild(el('span', { class: 'why' }, (o.ok ? '<b>Right.</b> ' : '<b>Wrong.</b> ') + (isChosen ? '(your choice) ' : '') + (o.why || '')));
            $('input', l).disabled = true;
          });
        }
        if (q.explain) fb.appendChild(el('div', { class: 'box tip' }, '<div class="bt">Why</div>' + q.explain));
        if (info.repair) { const cm = (topic.concepts || {})[q.concept]; fb.appendChild(el('div', { class: 'repair' }, '<b>Repair lesson (3 misses on this idea).</b> ' + (cm && cm.repair ? cm.repair : 'Re-read the concept section, then retry.'))); }
        if (info.moved) fb.appendChild(el('p', { class: 'notice' }, '<b>3 secure wins</b> on ' + esc(conceptName(topic, q.concept)) + '. This idea now moves into the harder combined questions in the topic test.'));
        if (!ok) { const row = el('div', { class: 'row' }, '<span>Why did it go wrong?</span>'); row.appendChild(tagSelect('', t => setMistakeTag(topic.id + ':q:' + q.id, t))); fb.appendChild(row); }
        const nx = el('button', { class: 'btn' }, idx + 1 >= list.length ? 'See summary' : 'Next question');
        nx.addEventListener('click', () => { idx++; show(); });
        fb.appendChild(nx);
        renderMath(fb);
      });
      box.appendChild(el('div', { class: 'row' })).appendChild(submit);
      box.appendChild(fb);
      renderMath(box);
    }
    function summary(box) {
      const right = results.filter(r => r.ok).length;
      const T = TS(topic.id);
      const byC = {};
      results.forEach(r => { const c = r.q.concept; byC[c] = byC[c] || { n: 0, ok: 0, marks: 0 }; byC[c].n++; if (r.ok) byC[c].ok++; });
      const secure = results.filter(r => r.ok && r.conf === 'Sure').length;
      const shaky = results.filter(r => r.ok && r.conf !== 'Sure').length;
      const danger = results.filter(r => !r.ok && r.conf === 'Sure').length;
      let h = '<div class="qz-title">' + esc(title) + ': summary</div><h3 style="margin-top:0">Score: ' + right + ' / ' + results.length + '</h3>';
      h += '<p>Secure (correct and sure): <b>' + secure + '</b> &middot; Correct but not yet secure: <b>' + shaky + '</b> &middot; Wrong and sure (dangerous): <b>' + danger + '</b></p>';
      const rank = Object.keys(byC).map(c => {
        const cm = (topic.concepts || {})[c] || {}; const missed = byC[c].n - byC[c].ok; const hist = (T.concept[c] || {}).miss || 0;
        const marks = cm.marks || 1, ease = cm.ease || 2;
        return { c, missed, hist, marks, ease, score: (missed * 2 + hist) * marks * ease };
      }).filter(r => r.missed > 0 || r.hist > 0).sort((a, b) => b.score - a.score);
      if (rank.length) {
        h += '<h4>Weak concepts, ranked</h4><p class="notice">Rank = (misses now x2 + misses so far) x marks at stake in PYQs x ease of repair (3 = easy). Fix the top one first.</p><table><tr><th>#</th><th>Concept</th><th>Missed now</th><th>Misses so far</th><th>PYQ marks at stake</th><th>Ease</th></tr>';
        rank.forEach((r, i) => { h += '<tr><td>' + (i + 1) + '</td><td>' + esc(conceptName(topic, r.c)) + '</td><td>' + r.missed + '</td><td>' + r.hist + '</td><td>' + r.marks + '</td><td>' + ['', 'hard', 'medium', 'easy'][r.ease] + '</td></tr>'; });
        h += '</table>';
      } else h += '<p>No weak concepts in this set. Move on to the next section.</p>';
      box.innerHTML = h;
      const row = el('div', { class: 'row' }); box.appendChild(row);
      const retryAll = el('button', { class: 'btn sec' }, 'Retry all');
      retryAll.addEventListener('click', () => start(questions.slice()));
      row.appendChild(retryAll);
      const missed = results.filter(r => !r.ok).map(r => r.q);
      if (missed.length) { const rm = el('button', { class: 'btn' }, 'Retry only the ' + missed.length + ' missed'); rm.addEventListener('click', () => start(missed)); row.appendChild(rm); }
      if (opts.onDone) opts.onDone(right, results.length);
      renderMath(box);
    }
    show();
  }

  /* ---------- worked-example stepper ---------- */
  function initWorked(root) {
    $$('.worked', root).forEach(w => {
      const steps = $$('.wk-step', w), after = $$('.wk-after', w);
      if (!steps.length) return;
      steps.forEach((s, i) => { if (!$('.sn', s)) s.insertBefore(el('div', { class: 'sn' }, 'Step ' + (i + 1) + ' of ' + steps.length), s.firstChild); });
      let n = 0;
      const bar = el('div', { class: 'wk-bar' });
      const next = el('button', { class: 'btn small' }, 'Show first step');
      const all = el('button', { class: 'btn small sec wk-all' }, 'Show all');
      const reset = el('button', { class: 'btn small sec' }, 'Hide steps');
      const info = el('span', {}, '0 / ' + steps.length);
      function paint() {
        steps.forEach((s, i) => s.classList.toggle('on', i < n));
        after.forEach(a => a.classList.toggle('on', n >= steps.length));
        info.textContent = n + ' / ' + steps.length;
        next.textContent = n === 0 ? 'Show first step' : 'Next step'; next.disabled = n >= steps.length;
      }
      next.addEventListener('click', () => { if (n < steps.length) n++; paint(); });
      all.addEventListener('click', () => { n = steps.length; paint(); });
      reset.addEventListener('click', () => { n = 0; paint(); });
      bar.append(next, all, reset, info); w.appendChild(bar); paint();
    });
  }

  /* ---------- PYQ cards ---------- */
  function pyqLabel(p) { return p.exam + ' &middot; ' + p.qno; }
  function renderPYQ(topic, p, host, forceOpen) {
    const T = TS(topic.id);
    const card = el('article', { class: 'pyq', id: 'pyq-' + p.id, 'data-year': p.year, 'data-type': p.type });
    const st = T.pyq[p.id];
    const head = el('div', { class: 'ph' }, '<b>' + pyqLabel(p) + '</b><span>' + p.marks + ' mark' + (p.marks === 1 ? '' : 's') + '</span><span class="pill">' + p.type + '</span><span class="pill">' + esc(conceptName(topic, p.concept)) + '</span>' + (p.sub ? '<span class="pill sub">' + esc(p.sub) + '</span>' : '') + '<span class="status-chip ' + (st ? st.status : '') + '">' + (st ? (st.status === 'correct' ? 'Solved ✓' : st.status === 'wrong' ? 'Attempted: wrong' : 'Solution viewed') : '') + '</span>');
    const body = el('div', { class: 'pb' });
    body.hidden = !forceOpen && !!st;
    head.addEventListener('click', () => { body.hidden = !body.hidden; });
    card.append(head, body);
    if (p.context) body.appendChild(el('div', { class: 'ctx' }, '<b>Passage:</b> ' + p.context));
    body.appendChild(el('div', { class: 'qz-stem' }, p.wording));
    let chosen = [], conf = null, done = false, numInput = null;
    const optsBox = el('div', { class: 'opts' }); body.appendChild(optsBox);
    const submit = el('button', { class: 'btn', disabled: 'disabled' }, 'Submit');
    const give = el('button', { class: 'btn sec' }, 'I give up, show me');
    function ready() { const has = p.type === 'SA' ? (numInput.value.trim() !== '' && !isNaN(parseFloat(numInput.value))) : chosen.length > 0; submit.disabled = !(has && conf) || done; }
    if (p.type === 'SA') {
      const wrap = el('div', { class: 'row' });
      numInput = el('input', { class: 'num', type: 'text', inputmode: 'decimal', placeholder: 'Your numeric answer', 'aria-label': 'Your numeric answer' });
      numInput.addEventListener('input', ready); wrap.appendChild(numInput); optsBox.appendChild(wrap);
    } else {
      const multi = p.type === 'MSQ';
      if (multi) optsBox.appendChild(el('p', { class: 'notice' }, 'Select all that apply.'));
      p.options.forEach((o, i) => {
        const lab = el('label', { class: 'opt' });
        const inp = el('input', { type: multi ? 'checkbox' : 'radio', name: 'p' + p.id });
        inp.addEventListener('change', () => {
          if (done) return;
          chosen = multi ? $$('input', optsBox).map((x, j) => x.checked ? j : -1).filter(j => j >= 0) : [i];
          $$('.opt', optsBox).forEach((l, j) => l.classList.toggle('sel', chosen.indexOf(j) >= 0));
          ready();
        });
        lab.appendChild(inp); lab.appendChild(el('span', { class: 'optbody' }, o)); optsBox.appendChild(lab);
      });
    }
    const confRow = el('div', { class: 'conf' }, '<span>How sure are you?</span>');
    ['Sure', 'Unsure', 'Guess'].forEach(c => {
      const b = el('button', { type: 'button' }, c);
      b.addEventListener('click', () => { if (done) return; conf = c; $$('button', confRow).forEach(x => x.classList.toggle('on', x === b)); ready(); });
      confRow.appendChild(b);
    });
    body.appendChild(confRow);
    const row = el('div', { class: 'row' }); row.append(submit, give); body.appendChild(row);
    const out = el('div', { class: 'out' }); body.appendChild(out);

    function check() {
      if (p.type === 'SA') { const v = parseFloat(numInput.value); return !isNaN(v) && v >= p.key.lo - 1e-9 && v <= p.key.hi + 1e-9; }
      const ch = chosen.slice().sort((a, b) => a - b);
      return [p.key.opts].concat(p.key.alt || []).some(set => { const ok = set.slice().sort((a, b) => a - b); return ok.length === ch.length && ok.every((v, i) => v === ch[i]); });
    }
    function reveal(status, ok) {
      done = true; submit.disabled = true; give.disabled = true;
      $$('input', optsBox).forEach(i => { i.disabled = true; }); if (numInput) numInput.disabled = true;
      T.pyq[p.id] = { status, conf: conf || '-', when: Date.now() }; Store.save();
      if (status === 'correct' || status === 'wrong') logEvent(topic.id, p.concept, status === 'correct', conf, 'PYQ');
      $('.status-chip', head).className = 'status-chip ' + status;
      $('.status-chip', head).textContent = status === 'correct' ? 'Solved ✓' : status === 'wrong' ? 'Attempted: wrong' : 'Solution viewed';
      let h = '';
      if (status === 'correct') h += '<div class="verdict ' + (conf === 'Sure' ? 'ok' : 'mid') + '">Correct (you said: ' + conf + ')' + (conf !== 'Sure' ? ': not yet secure' : '') + '</div>';
      else if (status === 'wrong') h += '<div class="verdict no">Not correct (you said: ' + conf + ')' + (conf === 'Sure' ? ': dangerous misconception' : '') + '</div>';
      else h += '<div class="verdict mid">Solution opened without an attempt</div>';
      out.innerHTML = h;
      if (status !== 'correct') {
        logMistake({ key: topic.id + ':p:' + p.id, topic: topic.id, src: 'PYQ', ref: p.id, label: p.exam + ' ' + p.qno + ': ' + strip(p.wording).slice(0, 90), conf: conf || '-', tag: '', when: Date.now(), concept: p.concept });
        const r = el('div', { class: 'row' }, '<span>Why did it go wrong?</span>'); r.appendChild(tagSelect('', t => setMistakeTag(topic.id + ':p:' + p.id, t))); out.appendChild(r);
      }
      out.appendChild(buildSolution(topic, p));
      renderMath(out);
    }
    submit.addEventListener('click', () => { if (!submit.disabled) { const ok = check(); reveal(ok ? 'correct' : 'wrong', ok); } });
    give.addEventListener('click', () => reveal('shown', false));
    /* Expand all: open the card and show the solution without recording an attempt; answering later still works */
    card._peek = () => { if (done || card._peeked) return; card._peeked = true; body.hidden = false; out.innerHTML = '<div class="verdict mid">Shown by Expand all. Not counted as an attempt.</div>'; out.appendChild(buildSolution(topic, p)); renderMath(out); };
    host.appendChild(card);
    renderMath(card);
    return card;
  }

  function buildSolution(topic, p) {
    const s = p.sol, wrap = el('div', { class: 'sol' });
    const keyTxt = p.type === 'SA' ? (p.key.show || (p.key.lo + ' to ' + p.key.hi)) : p.key.opts.map(i => (i + 1)).join(', ') + ((p.key.alt || []).length ? ' (also accepted: ' + p.key.alt.map(a => a.map(i => i + 1).join(', ')).join('; ') + ')' : '');
    let h = '<p><b>Key:</b> ' + (p.type === 'SA' ? '' : 'option(s) ') + esc(keyTxt) + ' <span class="tag ' + p.tag + '">[' + p.tag + ']</span> ' + (p.tagNote ? '<span class="notice">' + p.tagNote + '</span>' : '') + '</p>';
    h += '<h4>1. What is asked, what is given, clue words</h4>' + s.asked;
    h += '<h4>2. The governing idea and why it applies</h4>' + s.idea;
    h += '<h4>3. Best exam method, worked completely</h4>' + s.method;
    if (p.type === 'SA') h += '<h4>4. Accepted answer</h4>' + (s.range || '<p>Accepted: ' + esc(keyTxt) + '.</p>');
    else {
      h += '<h4>4. Every option, one by one</h4><div class="opts">';
      p.options.forEach((o, i) => {
        const ok = p.key.opts.indexOf(i) >= 0 || (p.key.alt || []).some(a => a.indexOf(i) >= 0);
        h += '<div class="opt ' + (ok ? 'right' : 'wrong') + '"><span class="optbody">' + o + '<span class="why"><b>' + (ok ? 'Right.' : 'Wrong.') + '</b> ' + s.optWhy[i] + '</span></span></div>';
      });
      h += '</div>';
    }
    h += '<h4>5. Other valid methods</h4>' + s.others;
    h += '<h4>6. Verification</h4>' + s.verify;
    h += '<h4>7. Trap, recognition rule, transfer question</h4><div class="mistake">' + s.trap + '</div><div class="box tip"><div class="bt">Recognition rule</div>' + s.rule + '</div>';
    wrap.innerHTML = h;
    const tq = el('div', { class: 'box analogy' }, '<div class="bt">Transfer question (answer hidden until you try)</div><div>' + s.transfer.q + '</div>');
    const ta = el('input', { class: 'num', type: 'text', placeholder: 'Your answer', 'aria-label': 'Your answer to the transfer question' });
    const chk = el('button', { class: 'btn small' }, 'Check my answer'), gv = el('button', { class: 'btn small sec' }, 'I give up');
    const ans = el('div', { class: 'wk-reveal' }); ans.hidden = true;
    ans.innerHTML = '<p><b>Answer:</b> ' + s.transfer.a + '</p>';
    const r = el('div', { class: 'row' }); r.append(ta, chk, gv);
    chk.addEventListener('click', () => { if (!ta.value.trim()) { toast('Type an attempt first, or press "I give up".'); return; } ans.hidden = false; renderMath(ans); });
    gv.addEventListener('click', () => { ans.hidden = false; renderMath(ans); });
    tq.append(r, ans); wrap.appendChild(tq);
    return wrap;
  }

  /* ---------- search ---------- */
  const index = [];
  function indexTopic(t) {
    if (index.some(i => i.topic === t.id)) return;
    t.sections.forEach(s => { if (s.html) index.push({ topic: t.id, kind: 'note', sec: 'sec-' + s.id, title: s.title, tname: t.title, text: strip(s.html) }); });
    (t.pyqs || []).forEach(p => index.push({ topic: t.id, kind: 'pyq', sec: 'pyq-' + p.id, title: p.exam + ' ' + p.qno + ' (' + p.marks + ' marks)', tname: t.title, text: strip(p.wording + ' ' + (p.context || '') + ' ' + (p.options || []).join(' ')) }));
    (t.formulas || []).forEach(f => index.push({ topic: t.id, kind: 'formula', sec: 'sec-' + (t.sections[0] && t.sections[0].id), title: 'Formula: ' + f.name, tname: t.title, text: strip(f.name + ' ' + (f.note || '') + ' ' + f.tex) }));
  }
  function doSearch(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const res = [];
    index.forEach(it => {
      const low = (it.title + ' ' + it.text).toLowerCase();
      if (words.every(w => low.indexOf(w) >= 0)) {
        const pos = low.indexOf(words[0]); const tx = it.text; const at = Math.max(0, tx.toLowerCase().indexOf(words[0]) - 60);
        let snip = tx.slice(at, at + 200); words.forEach(w => { snip = snip.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), m => '\u0001' + m + '\u0002'); });
        snip = esc(snip).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>');
        res.push({ it, snip: (at > 0 ? '...' : '') + snip + '...', score: (it.title.toLowerCase().indexOf(words[0]) >= 0 ? 0 : 1) + (it.kind === 'note' ? 0 : 0.5) });
      }
    });
    return res.sort((a, b) => a.score - b.score).slice(0, 40);
  }

  /* ---------- drawer ---------- */
  function openDrawer(topicId) {
    const d = $('#drawer');
    if (!d.hidden) { d.hidden = true; return; }
    const t = (window.TOPICS || {})[topicId];
    let h = '<div class="row"><h3 style="flex:1">Formula drawer</h3><button class="btn small sec" id="dr-close">Close</button></div>';
    if (!t || !t.formulas) h += '<p>Open a topic to see its formulas here.</p>';
    else {
      h += '<p class="notice">' + esc(t.title) + '. Every symbol is defined in the notes; conditions are listed here.</p><input class="num" id="dr-filter" style="width:100%" placeholder="Filter formulas" aria-label="Filter formulas">';
      t.formulas.forEach(f => { h += '<div class="fcard" data-k="' + esc((f.name + ' ' + (f.note || '')).toLowerCase()) + '"><b>' + f.name + '</b><div>$$' + f.tex + '$$</div><div>' + (f.note || '') + '</div></div>'; });
    }
    d.innerHTML = h; d.hidden = false; renderMath(d);
    $('#dr-close', d).addEventListener('click', () => { d.hidden = true; });
    const fl = $('#dr-filter', d);
    if (fl) fl.addEventListener('input', () => { const q = fl.value.toLowerCase(); $$('.fcard', d).forEach(c => { c.hidden = q && c.getAttribute('data-k').indexOf(q) < 0; }); });
  }

  /* ---------- views ---------- */
  const main = () => $('#main');
  let cur = { view: 'home', topic: null }, obs = null, pending = null;

  function dispN(t) { if (t.course !== 'q1') return t.n; return M().topics.filter(x => x.course === 'q1').findIndex(x => x.id === t.id) + 1; }
  function sideHTML(activeId, topic) {
    let h = '';
    const topics = M().topics.filter(t => t.course !== 'q1');
    const link = t => '<a class="tlink ' + (t.id === activeId ? 'cur' : '') + '" href="#t-' + t.id + '">' + dispN(t) + '. ' + esc(t.title) + (t.status === 'ready' ? '<span class="badge ready">ready</span>' : '<span class="badge">planned</span>') + '<small>' + esc(t.blurb) + '</small></a>';
    const withToc = t => {
      let x = link(t);
      if (t.id === activeId && topic) {
        const T = TS(topic.id);
        x += '<div class="toc">' + topic.sections.map(s => '<a href="#t-' + topic.id + '" data-sec="sec-' + s.id + '" class="' + (T.read[s.id] ? 'done' : '') + '">' + esc(s.title) + '</a>').join('') + '</div>';
      }
      return x;
    };
    const q1first = activeId && (M().topics.find(t => t.id === activeId) || {}).course === 'q1';
    const q1t0 = M().topics.filter(t => t.course === 'q1'); let q1h = q1t0.length ? '<h4>Quiz 1 topics</h4>' + q1t0.map(withToc).join('') : '';
    if (q1first) h += q1h;
    h += '<h4>Quiz 2 topics</h4>';
    topics.filter(t => !t.legacy).forEach(t => { h += withToc(t); });
    const leg = topics.filter(t => t.legacy);
    h += '<details class="side-legacy"' + (leg.some(t => t.id === activeId) ? ' open' : '') + '><summary>Legacy (last)</summary>' + leg.map(withToc).join('') + '</details>';
    if (!q1first) h += q1h;
    h += '<h4>Tools</h4><a class="tlink" href="#practice">Practice next (adaptive)</a><a class="tlink" href="#mock">Timed mock test</a><a class="tlink" href="#cheat">Cheatsheet and exam revision</a><a class="tlink" href="#mistakes">Mistake review</a><h4>Learn and revise</h4><a class="tlink" href="#plan">Study plan (1 hour, 1 day, 1 week)</a><a class="tlink" href="#cards">Flashcards</a><a class="tlink" href="#glossary">Glossary</a><a class="tlink" href="#refresh">Maths refreshers</a><a class="tlink" href="#revise">Last-night sheets</a><a class="tlink" href="#home">Home and progress</a>';
    return h;
  }
  function paintSide(activeId, topic) {
    const s = $('#side'); s.innerHTML = sideHTML(activeId, topic);
    $$('.toc a', s).forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollToId(a.getAttribute('data-sec')); document.body.classList.remove('menu'); }));
    $$('a.tlink', s).forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu')));
  }
  function scrollToId(id) { const n = document.getElementById(id); if (n) { if (n.classList.contains('pyq')) { const b = $('.pb', n); if (b) b.hidden = false; } n.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }

  function topicStats(id) {
    const T = TS(id), meta = Store.s.meta[id] || {};
    const secs = Object.keys(T.read).length, pq = Object.keys(T.pyq).length, solved = Object.keys(T.pyq).filter(k => T.pyq[k].status === 'correct').length;
    const C = (window.COUNTS || {})[id] || {};
    return { secs, pq, solved, nSecs: meta.sections || C.sections || 0, nPyq: meta.pyqs || C.pyqs || 0 };
  }

  function viewHome() {
    cur = { view: 'home', topic: null };
    paintSide(null, null);
    const m = main(); m.innerHTML = '';
    const c = el('div', { class: 'col' }); m.appendChild(c);
    c.className = 'col home';
    c.innerHTML = '<div class="hero"><div class="eyebrow">Quiz 2, weeks 5 to 8</div><h1>Regression to cross-validation</h1><p class="lead">Read each topic like a notebook, check yourself as you go, then try every past-year question before you open its solution. Topics are in the order to learn them.</p></div>';
    if (window.Guide && Guide.courseMap) c.appendChild(Guide.courseMap());
    if (window.Study && Study.homeCard) c.appendChild(Study.homeCard());
    const list = el('div', { class: 'tlist one' });
    M().topics.filter(t => t.course !== 'q1').forEach(t => {
      let right = '';
      if (t.status === 'ready') { const st = topicStats(t.id); right = st.solved + (st.nPyq ? ' / ' + st.nPyq : '') + ' solved'; } else right = 'Planned';
      list.appendChild(el('a', { class: 'trow', href: t.status === 'ready' ? '#t-' + t.id : '#home' }, '<span><b>' + t.n + '. ' + esc(t.title.replace(/^Legacy: /, '')) + (t.legacy ? ' <span class="badge">legacy, study last</span>' : '') + '</b><small>' + esc(t.blurb) + '</small></span><span class="tn">' + right + '</span>'));
    });
    c.appendChild(list);
    c.appendChild(el('h2', { class: 'hh' }, 'Tools'));
    c.appendChild(el('div', { class: 'tools' }, '<a class="tool" href="#practice"><b>Practice next</b><span>Ranks ideas by the marks you are likely to lose.</span></a><a class="tool" href="#mock"><b>Mock test</b><span>Timed past-paper questions with a topic breakdown.</span></a><a class="tool" href="#cheat"><b>Cheatsheet</b><span>Formulas, traps and a last-day plan.</span></a><a class="tool" href="#mistakes"><b>Mistakes</b><span>Your wrong answers, confident ones first.</span></a>'));
    c.appendChild(el('p', { class: 'notice' }, Store.persistent ? 'Progress is stored in this browser only. It does not sync to other devices.' : 'Browser storage is blocked here, so progress lasts only for this session.'));
    if (window.Shell) Shell.home(c);
    const hx = el('div', { id: 'home-extra' }); c.appendChild(hx);
    Promise.all(M().topics.filter(t => t.status === 'ready').map(t => loadTopic(t.id))).then(ts => {
      if (cur.view !== 'home') return;
      const go = () => window.HOMEX(hx, { el, esc, topics: ts.filter(t => t && (M().topics.find(m => m.id === t.id) || {}).course !== 'q1'), M, renderMath, Store, TS });
      if (window.HOMEX) go(); else { const s = document.createElement('script'); s.src = 'js/home.js'; s.onload = go; document.head.appendChild(s); }
    });
  }

  function viewTopic(id) {
    const meta = M().topics.find(t => t.id === id);
    if (!meta) { location.hash = 'home'; return; }
    if (meta.status !== 'ready') { viewHome(); toast('That topic is planned and not built yet.'); return; }
    main().innerHTML = '<div class="col"><p>Loading...</p></div>'; paintSide(id, null);
    loadTopic(id).then(topic => {
      if (!topic) { main().innerHTML = '<div class="col"><div class="box warn"><div class="bt">Could not load</div>The topic file failed to load.</div></div>'; return; }
      cur = { view: 'topic', topic: id };
      if (window.Guide) Guide.augment(topic);
      indexTopic(topic);
      Store.s.meta[id] = { sections: topic.sections.length, pyqs: (topic.pyqs || []).length }; Store.save();
      paintSide(id, topic);
      const m = main(); m.innerHTML = '';
      const col = el('div', { class: 'col' }); m.appendChild(col);
      col.appendChild(el('div', { class: 'hero' }, '<div class="eyebrow">' + (meta.course === 'q1' ? 'Quiz 1' : 'Quiz 2') + ', topic ' + dispN(meta) + '</div><h1>' + esc(topic.title) + '</h1><p class="lead">' + topic.tagline + '</p><div class="bar" title="Sections read"><i id="topic-bar"></i></div><small id="topic-bar-txt" style="font:13px var(--sans);color:var(--muted)"></small>'));
      (function pathBar() {
        const ids = topic.sections.map(s => s.id), has = x => ids.indexOf(x) >= 0;
        const steps = [['Learn', ids.find(x => x !== 'pyqs' && x !== 'test' && x !== 'checklist' && x !== 'revision' && x !== 'rev')], ['Practice PYQs', has('pyqs') ? 'pyqs' : (ids.find(x => /pyq/.test(x)) || null)], ['Topic test', has('test') ? 'test' : null], ['Revise', has('revision') ? 'revision' : (has('rev') ? 'rev' : null)], ['Checklist', has('checklist') ? 'checklist' : (has('check') ? 'check' : null)]].filter(x => x[1]);
        if (steps.length < 3) return;
        const bar = el('div', { class: 'pathbar' }, '<span class="pb-l">Path:</span>');
        steps.forEach((st, k) => { const b = el('button', { class: 'btn small sec' }, (k + 1) + '. ' + st[0]); b.addEventListener('click', () => scrollToId('sec-' + st[1])); bar.appendChild(b); });
        const links = []; const rx = /href="(#q1-[a-z0-9]+)">([^<]+)</g; let mm; const seen = {}; (topic.sections[0].html || '').replace(rx, (_, h, t) => { if (!seen[h]) { seen[h] = 1; links.push([h, t]); } return ''; });
        if (links.length) { const d = el('details', { class: 'pb-q1' }, '<summary>Quiz 1 original notes and interactive explorers</summary>' + links.map(l => '<a href="' + l[0] + '">' + l[1] + '</a>').join(' &middot; ')); bar.appendChild(d); }
        col.appendChild(bar);
      })();
      topic.sections.forEach((s, i) => {
        const sec = el('section', { class: 'sec', id: 'sec-' + s.id });
        sec.appendChild(el('div', { class: 'eyebrow' }, 'Section ' + (i + 1) + ' of ' + topic.sections.length));
        sec.appendChild(el('h2', {}, s.title));
        const body = el('div', { class: 'secbody' });
        if (s.html) body.innerHTML = s.html;
        sec.appendChild(body);
        if (s.kind === 'pyq') buildPYQSection(topic, body);
        if (s.kind === 'test') { const host = el('div'); body.appendChild(host); runQuiz(host, topic, topic.test, { title: 'Topic test' }); }
        if (s.kind === 'checklist') buildChecklist(topic, body);
        if (s.quiz && s.quiz.length) { const host = el('div'); sec.appendChild(host); runQuiz(host, topic, s.quiz, { title: 'Quick check: ' + s.title }); }
        const nav = el('div', { class: 'secnav' });
        if (i > 0) { const b = el('button', { class: 'btn sec' }, '← ' + topic.sections[i - 1].title); b.addEventListener('click', () => scrollToId('sec-' + topic.sections[i - 1].id)); nav.appendChild(b); } else nav.appendChild(el('span'));
        if (i < topic.sections.length - 1) { const b = el('button', { class: 'btn' }, topic.sections[i + 1].title + ' →'); b.addEventListener('click', () => scrollToId('sec-' + topic.sections[i + 1].id)); nav.appendChild(b); }
        else {
          const tl = M().topics.filter(t => (t.course === 'q1') === (meta.course === 'q1')); const k = tl.findIndex(t => t.id === id);
          const prev = tl[k - 1], next = tl[k + 1];
          const w = el('div', { class: 'row' });
          if (prev && prev.status === 'ready') w.appendChild(el('a', { class: 'btn sec', href: '#t-' + prev.id }, '← Topic: ' + esc(prev.title)));
          if (next) w.appendChild(next.status === 'ready' ? el('a', { class: 'btn', href: '#t-' + next.id }, 'Next topic: ' + esc(next.title) + ' →') : el('span', { class: 'notice' }, 'Next topic (' + esc(next.title) + ') is planned for the next run.'));
          nav.appendChild(w);
        }
        sec.appendChild(nav);
        sec.appendChild(el('div', { class: 'sec-end', 'data-sec': s.id }));
        col.appendChild(sec);
      });
      if (window.Guide) { window.__guideMath = renderMath; Guide.decorate(topic, col, meta); }
      renderMath(col); initWorked(col);
      if (window.Study) Study.decorate(topic, col, meta);
      if (window.Shell) Shell.topic(topic, col, meta);
      if (col.querySelector('[data-widget]')) {
        const runW = () => { const Wd = window.Q1W || {}; col.querySelectorAll('[data-widget]').forEach(w => { const f = Wd[w.getAttribute('data-widget')]; if (f && !w.__done) { w.__done = 1; try { f(w); } catch (er) { w.textContent = 'Explorer failed to load: ' + er.message; } } }); renderMath(col); };
        const ld = (src, ok, next) => { if (ok()) return next(); const s = document.createElement('script'); s.src = src; s.onload = next; s.onerror = next; document.head.appendChild(s); };
        ld('js/q1-widgets.js', () => window.Q1W && window.Q1W.kmstep, () => ld('js/q2-widgets.js', () => window.Q1W && window.Q1W.lsq, runW));
      }
      watch(topic);
      updateBar(topic);
      if (pending) { const p = pending; pending = null; setTimeout(() => scrollToId(p), 60); } else window.scrollTo(0, 0);
    });
  }

  function updateBar(topic) {
    const T = TS(topic.id), n = Object.keys(T.read).length, tot = topic.sections.length;
    const b = $('#topic-bar'); if (b) { b.style.width = Math.round(100 * n / tot) + '%'; $('#topic-bar-txt').textContent = n + ' of ' + tot + ' sections read'; }
    $$('#side .toc a').forEach(a => { const id = a.getAttribute('data-sec').replace('sec-', ''); a.classList.toggle('done', !!T.read[id]); });
  }
  function watch(topic) {
    if (obs) obs.disconnect();
    if (!('IntersectionObserver' in window)) return;
    const T = TS(topic.id);
    obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.target.classList.contains('sec-end')) { if (en.isIntersecting) { const id = en.target.getAttribute('data-sec'); if (!T.read[id]) { T.read[id] = 1; Store.save(); updateBar(topic); } } }
        else if (en.isIntersecting) { $$('#side .toc a').forEach(a => a.classList.toggle('cur', a.getAttribute('data-sec') === en.target.id)); }
      });
    }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });
    $$('section.sec').forEach(s => obs.observe(s));
    $$('.sec-end').forEach(s => obs.observe(s));
  }

  function buildChecklist(topic, host) {
    const T = TS(topic.id);
    const info = el('p', { class: 'notice' }); host.appendChild(info);
    function paint() { const n = topic.checklist.filter(c => T.check[c.id]).length; info.textContent = n + ' of ' + topic.checklist.length + ' skills ticked. Tick a skill only after you did it without notes.'; }
    topic.checklist.forEach(c => {
      const l = el('label', { class: 'opt' }); const i = el('input', { type: 'checkbox' }); i.checked = !!T.check[c.id];
      i.addEventListener('change', () => { if (i.checked) T.check[c.id] = 1; else delete T.check[c.id]; Store.save(); paint(); });
      l.append(i, el('span', { class: 'optbody' }, c.t)); host.appendChild(l);
    });
    paint(); renderMath(host);
  }

  function buildPYQSection(topic, host) {
    const T = TS(topic.id);
    const years = Array.from(new Set(topic.pyqs.map(p => p.year))).sort();
    const types = Array.from(new Set(topic.pyqs.map(p => p.type)));
    const subs = Array.from(new Set(topic.pyqs.map(p => p.sub).filter(Boolean)));
    const bar = el('div', { class: 'filters' }, (subs.length ? '<label>Subtopic <select id="f-sub"><option value="">All</option>' + subs.map(y => '<option value="' + esc(y) + '">' + esc(y) + '</option>').join('') + '</select></label>' : '') + '<label>Year <select id="f-year"><option value="">All</option>' + years.map(y => '<option>' + y + '</option>').join('') + '</select></label><label>Type <select id="f-type"><option value="">All</option>' + types.map(y => '<option>' + y + '</option>').join('') + '</select></label><label><input type="checkbox" id="f-hide"> Hide solved</label><span id="f-count"></span>');
    host.appendChild(bar);
    const list = el('div', { class: 'pyqlist' }); host.appendChild(list);
    const cards = {};
    topic.pyqs.forEach(p => { cards[p.id] = renderPYQ(topic, p, list, false); });
    function apply() {
      const y = $('#f-year', bar).value, t = $('#f-type', bar).value, sb = $('#f-sub', bar) ? $('#f-sub', bar).value : '', hide = $('#f-hide', bar).checked; let n = 0;
      topic.pyqs.forEach(p => { const c = cards[p.id]; const st = T.pyq[p.id]; const hid = (y && p.year !== y) || (t && p.type !== t) || (sb && p.sub !== sb) || (hide && st && st.status === 'correct'); c.classList.toggle('hidden', !!hid); if (!hid) n++; });
      $('#f-count', bar).textContent = 'Showing ' + n + ' of ' + topic.pyqs.length;
    }
    $$('select,input', bar).forEach(i => i.addEventListener('change', apply)); apply();
    bar.addEventListener('change', apply);
  }

  function viewMistakes() {
    cur = { view: 'mistakes', topic: null }; paintSide(null, null);
    const m = main(); m.innerHTML = ''; const c = el('div', { class: 'col' }); m.appendChild(c);
    const all = Store.s.mistakes;
    c.innerHTML = '<div class="hero"><div class="eyebrow">Review</div><h1>Mistake review</h1><p class="lead">Every quiz and PYQ miss is kept here with your confidence and an error tag. Fix the dangerous ones first.</p></div>';
    if (!all.length) { c.appendChild(el('div', { class: 'notice' }, 'No mistakes recorded yet. Misses from quizzes and PYQs appear here.')); return; }
    const counts = {}; all.forEach(x => { const k = x.tag || 'UNTAGGED'; counts[k] = (counts[k] || 0) + 1; });
    const dang = all.filter(x => x.conf === 'Sure').length;
    c.appendChild(el('div', { class: 'box ' + (dang ? 'warn' : 'tip') }, '<div class="bt">Summary</div><p><b>' + all.length + '</b> recorded. Wrong while sure (dangerous): <b>' + dang + '</b>.</p><p>' + Object.keys(counts).map(k => '<span class="pill">' + esc(k) + ': ' + counts[k] + '</span>').join(' ') + '</p>'));
    const flt = el('div', { class: 'filters' }, '<label>Tag <select id="m-tag"><option value="">All</option><option value="UNTAGGED">UNTAGGED</option>' + ERROR_TAGS.map(t => '<option>' + t[0] + '</option>').join('') + '</select></label><label><input type="checkbox" id="m-danger"> Dangerous only</label>');
    c.appendChild(flt); const list = el('div'); c.appendChild(list);
    function paint() {
      const tg = $('#m-tag', flt).value, dg = $('#m-danger', flt).checked; list.innerHTML = '';
      all.filter(x => (!tg || (x.tag || 'UNTAGGED') === tg) && (!dg || x.conf === 'Sure')).forEach(x => {
        const row = el('div', { class: 'hit' }); const tp = M().topics.find(t => t.id === x.topic);
        row.innerHTML = '<small>' + esc(tp ? tp.title : x.topic) + ' &middot; ' + x.src + ' &middot; confidence: ' + esc(x.conf) + (x.conf === 'Sure' ? ' <b style="color:var(--bad-bd)">(dangerous)</b>' : '') + '</small><div>' + esc(x.label) + '</div>';
        const r = el('div', { class: 'row' });
        r.appendChild(tagSelect(x.tag, t => { x.tag = t; Store.save(); }));
        if (x.src === 'PYQ') { const o = el('button', { class: 'btn small sec' }, 'Open question'); o.addEventListener('click', () => { pending = 'pyq-' + x.ref; location.hash = 't-' + x.topic; if (cur.view === 'topic' && cur.topic === x.topic) route(); }); r.appendChild(o); }
        const fx = el('button', { class: 'btn small sec' }, 'Mark fixed'); fx.addEventListener('click', () => { const i = Store.s.mistakes.indexOf(x); if (i >= 0) Store.s.mistakes.splice(i, 1); (Store.s.fixedMistakes = Store.s.fixedMistakes || {})[x.key] = Date.now(); Store.save(); updateMistakeBadge(); viewMistakes(); });
        r.appendChild(fx); row.appendChild(r); list.appendChild(row);
      });
      if (!list.children.length) list.appendChild(el('p', {}, 'Nothing matches this filter.'));
    }
    $$('select,input', flt).forEach(i => i.addEventListener('change', paint)); paint();
  }

  function viewSearch(q) {
    cur = { view: 'search', topic: null }; paintSide(null, null);
    const m = main(); m.innerHTML = ''; const c = el('div', { class: 'col' }); m.appendChild(c);
    c.innerHTML = '<div class="hero"><div class="eyebrow">Search</div><h1>Results for “' + esc(q) + '”</h1></div><p class="notice">Searches notes, formulas and PYQ wording. Solutions are not searched, so nothing is given away.</p>';
    Promise.all(M().topics.filter(t => t.status === 'ready').map(t => loadTopic(t.id))).then(ts => {
      ts.forEach(t => t && indexTopic(t));
      const res = doSearch(q);
      if (!res.length) { c.appendChild(el('p', {}, 'No matches. Try a shorter word.')); return; }
      res.forEach(r => {
        const a = el('a', { class: 'hit', href: '#t-' + r.it.topic }, '<small>' + esc(r.it.tname) + ' &middot; ' + r.it.kind + '</small><div><b>' + esc(r.it.title) + '</b></div><div>' + r.snip + '</div>');
        a.addEventListener('click', () => { pending = r.it.sec; });
        c.appendChild(a);
      });
    });
  }

  function viewCheat() {
    cur = { view: 'cheat', topic: null }; paintSide(null, null);
    const m = main(); m.innerHTML = '<div class="col"><p class="notice">Loading the cheatsheet...</p></div>';
    Promise.all(M().topics.filter(t => t.status === 'ready').map(t => loadTopic(t.id))).then(ts => {
      if (cur.view !== 'cheat') return;
      m.innerHTML = '';
      const go = () => window.CHEAT(m, { el, esc, topics: ts, M, Store, TS, runQuiz, renderMath });
      if (window.CHEAT) go(); else { const s = document.createElement('script'); s.src = 'js/cheat.js'; s.onload = go; document.head.appendChild(s); }
    });
  }

  function viewPractice() {
    cur = { view: 'practice', topic: null }; paintSide(null, null);
    const m = main(); m.innerHTML = '<div class="col"><p class="notice">Loading the practice planner...</p></div>';
    Promise.all(M().topics.filter(t => t.status === 'ready').map(t => loadTopic(t.id))).then(ts => {
      if (cur.view !== 'practice') return;
      m.innerHTML = '';
      const go = () => window.PRACTICE(m, { el, esc, topics: ts, M, Store, TS, renderMath, runQuiz, conceptName });
      const need = (src, ok, next) => { if (ok()) return next(); const s = document.createElement('script'); s.src = src; s.onload = next; document.head.appendChild(s); };
      need('js/adapt.js', () => window.ADAPT, () => need('js/evidence.js', () => window.EVIDENCE, () => need('js/practice.js', () => window.PRACTICE, go)));
    });
  }

  function viewMock() {
    cur = { view: 'mock', topic: null }; paintSide(null, null);
    const m = main(); m.innerHTML = '<div class="col"><p class="notice">Loading the mock test...</p></div>';
    Promise.all(M().topics.filter(t => t.status === 'ready').map(t => loadTopic(t.id))).then(ts => {
      if (cur.view !== 'mock') return;
      m.innerHTML = '';
      const go = () => window.MOCK(m, { el, esc, topics: ts, M, Store, TS, renderMath, logMistake, logEvent });
      if (window.MOCK) go(); else { const s = document.createElement('script'); s.src = 'js/mock.js'; s.onload = go; document.head.appendChild(s); }
    });
  }

  /* ---------- modal reset ---------- */
  function openReset() {
    const md = $('#modal'); const tid = cur.topic;
    md.innerHTML = '<div class="mbox"><h3 style="margin-top:0">Reset progress</h3><p>This clears sections read, quiz and PYQ results, checklist ticks and mistake logs. It cannot be undone.</p><div class="row" id="rs-row"></div></div>'; md.hidden = false;
    const r = $('#rs-row', md);
    const mk = (t, cls, fn) => { const b = el('button', { class: 'btn ' + cls }, t); b.addEventListener('click', fn); r.appendChild(b); };
    if (tid) mk('Reset this topic', '', () => { Store.resetTopic(tid); md.hidden = true; updateMistakeBadge(); toast('Topic progress reset'); route(); });
    mk('Reset everything', 'sec', () => { Store.resetAll(); md.hidden = true; applyPrefs(); updateMistakeBadge(); toast('All progress reset'); route(); });
    mk('Cancel', 'sec', () => { md.hidden = true; });
  }

  /* ---------- routing, prefs ---------- */
  function route() {
    const h = (location.hash || '#hub').slice(1);
    if (window.COURSEX && window.COURSEX.handles(h)) { window.COURSEX.view(h); return; }
    if (window.COURSEX) window.COURSEX.tabs(h);
    if (h.indexOf('t-') === 0) viewTopic(h.slice(2));
    else if (h === 'mistakes') viewMistakes();
    else if (h === 'cheat') viewCheat();
    else if (h === 'mock') viewMock();
    else if (h === 'practice') viewPractice();
    else if (h === 'search') viewSearch(window.__q || '');
    else if (window.Study && window.Study.handles(h)) window.Study.view(h);
    else viewHome();
  }
  /* Expand all: opens every collapsed block, worked example, PYQ solution and hidden answer, and keeps doing it as new content appears */
  let xpObs = null, xpT = 0;
  function expandAll(root) {
    root = root || $('#main'); if (!root) return;
    $$('details:not([open])', root).forEach(d => { d.open = true; });
    $$('.worked .wk-all', root).forEach(b => { if (b.dataset.xp) return; b.dataset.xp = '1'; b.click(); });
    $$('.wk-reveal[hidden]', root).forEach(a => { a.hidden = false; renderMath(a); });
    $$('.pyq', root).forEach(c => { if (c._peek) c._peek(); });
  }
  function applyExpand() {
    const on = !!Store.s.expand, b = $('#btn-xp'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (xpObs) { xpObs.disconnect(); xpObs = null; }
    if (on && $('#main')) { xpObs = new MutationObserver(() => { clearTimeout(xpT); xpT = setTimeout(expandAll, 60); }); xpObs.observe($('#main'), { childList: true, subtree: true }); expandAll(); }
  }
  function applyPrefs() {
    document.documentElement.setAttribute('data-theme', Store.s.theme === 'dark' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-large', Store.s.large ? 'true' : 'false');
    $('#btn-large').setAttribute('aria-pressed', Store.s.large ? 'true' : 'false');
  }
  function init() {
    applyPrefs(); applyExpand(); updateMistakeBadge();
    if ($('#btn-xp')) $('#btn-xp').addEventListener('click', () => { Store.s.expand = !Store.s.expand; Store.save(); applyExpand(); });
    if (!Store.persistent) $('#storage-note').hidden = false;
    $('#btn-theme').addEventListener('click', () => { Store.s.theme = Store.s.theme === 'dark' ? 'light' : 'dark'; Store.save(); applyPrefs(); });
    $('#btn-large').addEventListener('click', () => { Store.s.large = !Store.s.large; Store.save(); applyPrefs(); });
    $('#btn-reset').addEventListener('click', openReset);
    $('#btn-menu').addEventListener('click', () => document.body.classList.toggle('menu'));
    $('#btn-formulas').addEventListener('click', () => openDrawer(cur.topic || 'decision-trees'));
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });
    $('#search-form').addEventListener('submit', e => {
      e.preventDefault(); const q = $('#search-input').value.trim(); if (!q) return;
      window.__q = q; if ((location.hash || '') === '#search') route(); else location.hash = 'search';
    });
    window.addEventListener('hashchange', route);
    route();
  }
  function goTo(tid, sid) { if (cur.view === 'topic' && cur.topic === tid) { scrollToId(sid); return; } pending = sid; if (location.hash === '#t-' + tid) route(); else location.hash = 't-' + tid; }
  function enterStudy(v) { cur = { view: v, topic: null }; paintSide(null, null); }
  window.MLTQ = { Store, runQuiz, renderMath, route, api: { el, esc, loadTopic, TS, topicStats, M, main, renderMath, go: goTo, enter: enterStudy, scrollToId } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
