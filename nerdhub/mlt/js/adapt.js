/* Adaptive review model.
 * Pure functions, no DOM. Runs in the browser (window.ADAPT) and in Node (eval/simulate.js),
 * so the code that is evaluated offline is the same code that ships.
 *
 * State per concept:
 *   pL    probability the idea is known, measured at time `last` (Bayesian Knowledge Tracing)
 *   h     memory half-life in days (it doubles after a confident success, halves after a miss)
 *   last  time of the last observation, in days
 *
 * At time t the known-probability has decayed:   known(t) = pL * 2^(-(t - last) / h)
 * Probability of answering a fresh question right: P(t) = known*(1-slip) + (1-known)*guess
 * Expected marks lost on a concept:                 w * (1 - P(t)),   w = share of paper marks
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ADAPT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const P = {
    prior: 0.30,        // chance a never-seen idea is already known
    learn: 0.15,        // chance of learning the idea from one attempt plus its explanation
    slip: 0.10,         // known but answered wrong
    guessSure: 0.15,    // not known but answered right, when you said "Sure"
    guessUnsure: 0.30,  // ... when you said "Unsure"
    guessGuess: 0.55,   // ... when you said "Guess"
    h0: 1.0,            // starting half-life, days
    hMin: 0.5, hMax: 90,
    hUpSure: 2.0, hUpOther: 1.4, hDown: 0.5,
    wFloor: 0.02        // concepts worth 0 marks (prerequisites) still get a little weight
  };

  const DAY = 86400000;
  const guessOf = conf => conf === 'Sure' ? P.guessSure : conf === 'Guess' ? P.guessGuess : P.guessUnsure;

  function newState() { return { pL: P.prior, h: P.h0, last: null, n: 0 }; }

  function known(st, t) {
    if (st.last == null) return st.pL;
    const dt = Math.max(0, t - st.last);
    return st.pL * Math.pow(2, -dt / st.h);
  }
  function pCorrect(st, t) { const k = known(st, t); return k * (1 - P.slip) + (1 - k) * P.guessUnsure; }

  /* one observation: ok (bool), conf ('Sure'|'Unsure'|'Guess'|other), t in days */
  function update(st, ok, conf, t) {
    const k = known(st, t), g = guessOf(conf);
    const post = ok ? (k * (1 - P.slip)) / (k * (1 - P.slip) + (1 - k) * g)
                    : (k * P.slip) / (k * P.slip + (1 - k) * (1 - g));
    st.pL = post + (1 - post) * P.learn;
    st.h = ok ? Math.min(P.hMax, st.h * (conf === 'Sure' ? P.hUpSure : P.hUpOther))
              : Math.max(P.hMin, st.h * P.hDown);
    st.last = t; st.n++;
    return st;
  }

  /* concepts: [{key, marks}], events: [{t (ms), topic, concept, ok, conf}] -> {key: state} */
  function fromEvents(concepts, events) {
    const S = {}; concepts.forEach(c => { S[c.key] = newState(); });
    (events || []).slice().sort((a, b) => a.t - b.t).forEach(e => {
      const k = e.topic + ':' + e.concept; if (!S[k]) return;
      update(S[k], !!e.ok, e.conf, e.t / DAY);
    });
    return S;
  }

  function weights(concepts) {
    const tot = concepts.reduce((a, c) => a + Math.max(c.marks || 0, P.wFloor), 0) || 1;
    const w = {}; concepts.forEach(c => { w[c.key] = Math.max(c.marks || 0, P.wFloor) / tot; });
    return w;
  }

  /* highest expected loss first */
  function rank(concepts, S, t) {
    const w = weights(concepts);
    return concepts.map(c => {
      const st = S[c.key], p = pCorrect(st, t);
      return { c, st, p, w: w[c.key], loss: w[c.key] * (1 - p) };
    }).sort((a, b) => b.loss - a.loss);
  }

  function readiness(concepts, S, t) {
    const w = weights(concepts); let s = 0;
    concepts.forEach(c => { s += w[c.key] * pCorrect(S[c.key], t); });
    return s;
  }

  return { P, DAY, newState, known, pCorrect, update, fromEvents, weights, rank, readiness };
});
