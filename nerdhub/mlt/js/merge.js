/* Merge two copies of the study state (this device and the cloud copy) without losing either.
 * Pure function, no DOM, so it is unit-tested in Node (eval/merge.test.js).
 *
 * Rules
 *  - events (the answer log): union, de-duplicated, oldest dropped past the cap
 *  - pyq results: the newer attempt wins
 *  - per-question and per-idea counters: the larger count wins (counters cannot be added without a log)
 *  - sections read and checklist ticks: union
 *  - mistakes: union, newer entry wins, minus those marked fixed after they were logged (fixedMistakes)
 *  - mock history: union by time
 *  - epoch: a reset bumps it; the caller replaces instead of merging when the epochs differ
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MERGE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CAP_EVENTS = 4000, CAP_MISTAKES = 300, CAP_MOCKS = 30;
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  const arr = x => Array.isArray(x) ? x : [];
  const num = x => (typeof x === 'number' && isFinite(x)) ? x : 0;

  function pickBy(a, b, score) { return score(b) > score(a) ? b : a; }

  function mergeTopic(a, b) {
    a = obj(a); b = obj(b);
    const out = { read: {}, q: {}, pyq: {}, check: {}, concept: {} };
    ['read', 'check'].forEach(k => { Object.assign(out[k], obj(a[k]), obj(b[k])); });
    const lastWins = (k, score) => { const ka = obj(a[k]), kb = obj(b[k]); new Set(Object.keys(ka).concat(Object.keys(kb))).forEach(id => { out[k][id] = ka[id] && kb[id] ? pickBy(ka[id], kb[id], score) : (ka[id] || kb[id]); }); };
    lastWins('pyq', v => num(v && v.when));
    lastWins('q', v => num(v && v.tries));
    lastWins('concept', v => num(v && v.tries));
    return out;
  }

  function mergeStates(a, b) {
    a = obj(a); b = obj(b);
    const out = { theme: a.theme || b.theme || 'light', large: !!(a.large || b.large), topics: {}, meta: Object.assign({}, obj(b.meta), obj(a.meta)) };
    const ta = obj(a.topics), tb = obj(b.topics);
    new Set(Object.keys(ta).concat(Object.keys(tb))).forEach(id => { out.topics[id] = mergeTopic(ta[id], tb[id]); });

    const seen = new Set(), ev = [];
    arr(a.events).concat(arr(b.events)).forEach(e => { if (!e || typeof e.t !== 'number') return; const k = e.t + '|' + e.topic + '|' + e.concept + '|' + e.src; if (!seen.has(k)) { seen.add(k); ev.push(e); } });
    ev.sort((x, y) => x.t - y.t); out.events = ev.length > CAP_EVENTS ? ev.slice(ev.length - CAP_EVENTS) : ev;

    out.fixedMistakes = Object.assign({}, obj(b.fixedMistakes)); const fa = obj(a.fixedMistakes);
    Object.keys(fa).forEach(k => { out.fixedMistakes[k] = Math.max(num(out.fixedMistakes[k]), num(fa[k])); });
    const mm = {};
    arr(a.mistakes).concat(arr(b.mistakes)).forEach(m => {
      if (!m || !m.key) return;
      const cur = mm[m.key];
      if (!cur) { mm[m.key] = m; return; }
      const win = num(m.when) > num(cur.when) ? m : cur, lose = win === m ? cur : m;
      mm[m.key] = Object.assign({}, win, { tag: win.tag || lose.tag || '' });
    });
    out.mistakes = Object.keys(mm).map(k => mm[k]).filter(m => num(out.fixedMistakes[m.key]) < num(m.when)).sort((x, y) => num(y.when) - num(x.when)).slice(0, CAP_MISTAKES);

    const mk = {}; arr(a.mocks).concat(arr(b.mocks)).forEach(m => { if (m && typeof m.when === 'number') mk[m.when] = m; });
    out.mocks = Object.keys(mk).map(k => mk[k]).sort((x, y) => y.when - x.when).slice(0, CAP_MOCKS);
    out.epoch = Math.max(num(a.epoch), num(b.epoch));
    return out;
  }
  return { mergeStates, CAP_EVENTS };
});
