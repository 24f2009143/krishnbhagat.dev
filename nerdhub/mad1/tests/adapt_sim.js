#!/usr/bin/env node
/* Tests the pure functions in js/adapt.js (Bayesian knowledge tracing + forgetting half-life) and js/merge.js
 * with fixed cases and a seeded simulated student. Usage: node tests/adapt_sim.js */
"use strict";
const ad = require("../js/adapt.js"), { merge } = require("../js/merge.js");
let fails = 0, n = 0;
function ok(c, msg) { n++; if (!c) { fails++; console.log("FAIL " + msg) } }
const DAY = 864e5, T0 = Date.UTC(2026, 0, 1);
/* fixed cases */
const r1 = ad.update(null, true, "Sure", T0);
ok(r1.p > ad.params.init, "a sure correct answer raises knowledge");
const rg = ad.update(null, true, "Guess", T0);
ok(rg.p < r1.p, "a guessed correct answer raises it less than a sure one");
const rw = ad.update(null, false, "Guess", T0), rws = ad.update(null, false, "Sure", T0);
ok(rws.p <= rw.p + 1e-12, "wrong and sure counts at least as strongly as wrong and guessing");
ok(ad.recall(r1, T0 + 30 * DAY) < ad.recall(r1, T0 + DAY), "knowledge fades with time");
ok(ad.recall(r1, T0 + 3650 * DAY) >= ad.params.init - 1e-9, "fading never goes below the prior");
let r = null; for (let i = 0; i < 3; i++) r = ad.update(r, false, "Unsure", T0 + i);
ok(ad.ruleOf3(r) === "repair", "three misses in a row ask for the repair text");
r = null; for (let i = 0; i < 3; i++) r = ad.update(r, true, "Sure", T0 + i);
ok(ad.ruleOf3(r) === "combine", "three secure wins ask for a combined harder question");
r = ad.update(r, true, "Unsure", T0 + 5); ok(ad.ruleOf3(r) === null, "an unsure win resets the streak");
ok(ad.stageFor(null) === "single", "a new concept starts at single-skill questions");
let s = null; for (let i = 0; i < 12; i++) s = ad.update(s, true, "Sure", T0 + i * 60e3); ok(ad.stageFor(s) === "timed", "a mastered concept reaches timed mixed sets");
const pick = ad.pickConcept([{ key: "a", marks: 10 }, { key: "b", marks: 2 }], {}, T0);
ok(pick.key === "a", "with no history the concept with more marks is picked first");
ok(ad.pickConcept([{ key: "a", marks: 10 }, { key: "b", marks: 2 }], { a: { p: 0.99, h: 40, t: T0 } }, T0).key === "b", "a mastered concept gives way to a weaker one");
/* simulated student: three concepts, true skill differs; marks at risk must fall */
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const C = [{ key: "flask", marks: 121 }, { key: "db", marks: 101 }, { key: "web", marks: 23 }], skill = { flask: 0.35, db: 0.6, web: 0.9 };
const st = {}; let t = T0; const risk = () => C.reduce((a, c) => a + ad.atRisk(st[c.key], c.marks, t), 0), start = risk(), picks = {};
for (let i = 0; i < 400; i++) {
  const c = ad.pickConcept(C, st, t); picks[c.key] = (picks[c.key] || 0) + 1;
  const right = rnd() < skill[c.key]; skill[c.key] = Math.min(0.98, skill[c.key] + (right ? 0.002 : 0.006));
  st[c.key] = ad.update(st[c.key], right, right ? "Sure" : "Unsure", t); t += 20 * 60e3;
}
ok(risk() < start * 0.5, "400 practice steps at least halve the marks at risk (" + start.toFixed(1) + " -> " + risk().toFixed(1) + ")");
ok(picks.flask > picks.web, "the weak, high-mark concept is practised more than the strong, low-mark one");
ok(Object.values(st).every(x => x.p >= 0 && x.p <= 1 && x.h >= ad.params.minHalf && x.h <= ad.params.maxHalf), "probabilities and half-lives stay in range");
/* merge never loses progress */
const A = { ans: { "q2:1": { n: 2, ok: true, t: 5 }, "q2:2": { n: 1, ok: false, t: 9 } }, read: { "x:a": 1 }, flash: { f: { box: 1 } }, steps: { t: { test: 0.5 } }, prefs: { dark: true } };
const B = { ans: { "q2:1": { n: 1, ok: false, t: 7 }, "q2:3": { n: 1, ok: true, t: 3 } }, read: { "x:b": 1 }, flash: { f: { box: 3 } }, steps: { t: { revise: 1 } }, prefs: { large: true } };
const Mg = merge(A, B);
ok(Mg.ans["q2:1"].n === 2 && Mg.ans["q2:2"] && Mg.ans["q2:3"], "merge keeps every answer, preferring more attempts");
ok(Mg.read["x:a"] && Mg.read["x:b"], "merge keeps lessons read on both sides");
ok(Mg.flash.f.box === 3, "merge keeps the further flashcard box");
ok(Mg.steps.t.test === 0.5 && Mg.steps.t.revise === 1, "merge combines topic steps");
ok(JSON.stringify(merge(Mg, Mg).ans) === JSON.stringify(Mg.ans), "merge is idempotent");
console.log("adapt_sim: " + n + " checks, " + fails + " failed; picks " + JSON.stringify(picks));
process.exit(fails ? 1 : 0);
