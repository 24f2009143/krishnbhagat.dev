#!/usr/bin/env node
/* Gate 2: schema and content checks for manifest, refreshers, glossary, topics, patches and PYQ packs.
 * Usage: node tests/validate.js [--fixture]   (exit 1 on any error; warnings do not fail) */
"use strict";
const fs = require("fs"), path = require("path");
const { loadData, ROOT } = require("./load_data");
const FIX = process.argv.includes("--fixture");
const { APP, missing } = loadData({ fixture: FIX });
const M = APP.manifest, errs = [], warns = [];
const E = (w, m) => errs.push(w + ": " + m), W = (w, m) => warns.push(w + ": " + m);
missing.forEach(f => E("loader", "missing file " + f));
APP.errors.forEach(e => E("loader", e));

/* ---------- manifest ---------- */
["slug", "subject", "dataVersion", "engineVersion", "toolkit", "defaultExam", "hubUrl", "conventions", "exams", "weeks", "topics"].forEach(k => { if (M[k] == null) E("manifest", "missing " + k) });
if (M.engineVersion !== APP.ENGINE_VERSION) E("manifest", "engineVersion " + M.engineVersion + " differs from core.js " + APP.ENGINE_VERSION);
const EXAM_ST = ["ready", "in-progress", "planned", "hidden"], TOPIC_ST = ["ready", "stub", "planned"];
const weekNums = M.weeks.map(w => w.num);
Object.entries(M.exams).forEach(([k, e]) => {
  ["label", "status", "weeks", "newWeeks", "examDate", "papers", "expected"].forEach(f => { if (e[f] == null) E("exam " + k, "missing " + f) });
  if (!EXAM_ST.includes(e.status)) E("exam " + k, "bad status " + e.status);
  (e.newWeeks || []).forEach(w => { if (!e.weeks.includes(w)) E("exam " + k, "newWeek " + w + " not in weeks") });
});
if (!M.exams[M.defaultExam]) E("manifest", "defaultExam " + M.defaultExam + " is not an exam");
const tids = M.topics.map(t => t.id);
M.weeks.forEach(w => { ["num", "title", "goal", "topicIds", "outcomes"].forEach(f => { if (w[f] == null) E("week " + w.num, "missing " + f) }); (w.topicIds || []).forEach(t => { if (!tids.includes(t)) E("week " + w.num, "unknown topic " + t) }) });
const seenT = {};
M.topics.forEach(m => {
  const w = "topic " + m.id;
  if (seenT[m.id]) E(w, "duplicate topic id"); seenT[m.id] = 1;
  ["id", "name", "short", "mark", "weeks", "status", "uses", "why", "subs", "packs"].forEach(f => { if (m[f] == null) E(w, "missing " + f) });
  if (!TOPIC_ST.includes(m.status)) E(w, "bad status " + m.status);
  (m.weeks || []).forEach(x => { if (!weekNums.includes(x)) E(w, "week " + x + " not in manifest.weeks") });
  (m.uses || []).forEach(u => { if (!tids.includes(u)) E(w, "uses unknown topic " + u) });
  const sids = {}; (m.subs || []).forEach(s => { if (!s.id || !s.name || !Array.isArray(s.aliases)) E(w, "sub needs id, name, aliases[]"); if (sids[s.id]) E(w, "duplicate sub " + s.id); sids[s.id] = 1 });
  if (m.fixture) return;
  Object.entries(m.packs || {}).forEach(([ex, files]) => { if (!M.exams[ex]) E(w, "pack for unknown exam " + ex); files.forEach(f => { if (!fs.existsSync(path.join(ROOT, "js/data/pyqs", ex, f))) E(w, "pack file missing " + ex + "/" + f) }) });
  (m.patches || []).forEach(f => { if (!fs.existsSync(path.join(ROOT, "js/data", f))) E(w, "patch file missing " + f) });
  if (m.status === "ready" && !APP.topics[m.id]) E(w, "status ready but topic-" + m.id + ".js did not register");
});

/* ---------- text checks ---------- */
const DRAFT = [/\bTODO\b/, /\bwait\b/i, /\bhmm+\b/i, /\blet me\b/i, /=1\?/, /\.\.\.\s*$/m, /\[\s*\.\.\.\s*\]/, /\bFIXME\b/, /\bXXX\b/];
const HIDERS = [/\bobviously\b/i, /\bclearly\b/i, /\bsimilarly\b/i, /after simplification/i, /it is easy to see/i, /apply the formula/i];
const HINGLISH = /\b(hai|nahi|kya|matlab|yaani|accha|acha|bhai|samjho|dekho|jaise)\b/i;
function prose(s) { return String(s).replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, " ") }
function checkText(w, s, bank) {
  if (typeof s !== "string") return;
  const noEsc = s.replace(/\\\$/g, "").replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  if ((noEsc.match(/\$/g) || []).length % 2) E(w, "unbalanced $ in: " + s.slice(0, 80));
  if (bank) return;                       /* verbatim bank text is never edited */
  const p = prose(s);
  DRAFT.forEach(r => { if (r.test(p)) E(w, "draft text " + r + " in: " + s.slice(0, 80)) });
  HIDERS.forEach(r => { if (r.test(p)) E(w, "step-hider " + r + " in: " + s.slice(0, 80)) });
  if (HINGLISH.test(p)) E(w, "Hinglish remnant in: " + s.slice(0, 80));
  const q = p.replace(/\[(SRC|DERIVED|ADDED|FLAG)\]|\[assert:[^\]]*\]/g, "");
  if ((q.match(/\(/g) || []).length !== (q.match(/\)/g) || []).length && !/\d\)|[a-z]\)\s/.test(q)) W(w, "unbalanced ( ) in: " + s.slice(0, 80));
  if ((q.match(/\[/g) || []).length !== (q.match(/\]/g) || []).length) E(w, "stray bracket in: " + s.slice(0, 80));
}
function walk(o, w, bank) {
  if (o == null) return;
  if (typeof o === "string") return checkText(w, o, bank);
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, w + "[" + i + "]", bank));
  if (typeof o === "object") Object.keys(o).forEach(k => { if (k === "svg" || k === "src" || k === "code" || k === "tex") return; walk(o[k], w + "." + k, bank || ((k === "stem" || k === "options" || k === "parent") && w.indexOf(".pyqs[") >= 0 && w.indexOf(".transfer") < 0)) });
}

/* ---------- questions ---------- */
const QTYPES = ["MCQ", "MSQ", "NUM", "SA", "TF", "COMP"], DIFF = ["easy", "medium", "hard"], TAGS = ["[SRC]", "[DERIVED]", "[ADDED]", "[FLAG]"];
const allQid = {}, perConcept = {};
function keyLetters(k) { return k == null ? [] : (Array.isArray(k) ? k : String(k).split(/\s*,\s*/)).map(String) }
function checkKey(w, q, isPyq) {
  const t = q.type === "COMP" ? q.childType : q.type;
  if (q.type === "COMP" && !["MCQ", "MSQ", "NUM", "SA", "TF"].includes(q.childType)) E(w, "COMP needs childType");
  if (q.key == null || q.key === "") { if (!(isPyq && q.tag === "[FLAG]")) E(w, "no key (needs a key or [FLAG])"); return; }
  if (t === "NUM" || t === "SA") { if (q.options && q.options.length) E(w, t + " must not have options"); if (t === "NUM" && isNaN(parseFloat(q.key))) E(w, "NUM key is not a number"); return; }
  const n = t === "TF" ? 2 : (q.options || []).length;
  if (t !== "TF" && n < 2) E(w, "needs at least 2 options");
  [["key", q.key], ["altKey", q.altKey]].forEach(([nm, k]) => {
    if (k == null) return;
    const L = keyLetters(k);
    L.forEach(x => { const i = "ABCDEFGH".indexOf(x.toUpperCase()); if (!/^[A-H]$/i.test(x) || i >= n) E(w, nm + " " + x + " is not one of " + n + " options") });
    if (t === "MCQ" || t === "TF") { if (L.length !== 1) E(w, nm + " of a single-choice question must be one letter") }
    if (t === "MSQ" && !Array.isArray(k)) E(w, "MSQ " + nm + " must be an array");
  });
  if (q.altKey != null && q.tag !== "[FLAG]") E(w, "altKey needs tag [FLAG] with a tagNote");
}
function checkQ(w, q, topic, opt) {
  opt = opt || {};
  if (!q.id) E(w, "question without id"); else { const k = (topic ? topic.id : "") + ":" + q.id; if (allQid[k]) E(w, "duplicate question id " + q.id); allQid[k] = 1 }
  if (!QTYPES.includes(q.type)) E(w, "bad type " + q.type);
  if (!q.stem) E(w, "empty stem");
  if (topic && topic.concepts && !topic.concepts[q.concept]) E(w, "concept " + q.concept + " not in topic.concepts");
  if (!opt.transfer && !DIFF.includes(q.diff)) E(w, "diff must be easy|medium|hard");
  if (!q.explain || !String(q.explain).trim()) E(w, "empty explain");
  if (!opt.loose && !(Array.isArray(q.hints) && q.hints.length)) W(w, "no hints[]");
  if (q.tag && !TAGS.includes(q.tag)) E(w, "bad tag " + q.tag);
  if (q.tag === "[FLAG]" && !q.tagNote) E(w, "[FLAG] needs tagNote");
  if (q.type === "COMP" && !(q.parent && q.parent.id && q.parent.text)) E(w, "COMP needs parent{id,text}");
  if (q.optionNotes) Object.values(q.optionNotes).forEach(n => { if (!(typeof n === "string" ? n : n.why)) E(w, "empty optionNotes why") });
  checkKey(w, q, false);
}

/* ---------- blocks ---------- */
const NEED = { p: ["text"], table: ["head", "rows"], co: ["kind", "text"], ex: ["problem", "asked", "idea", "steps", "answer", "mistake"], fig: [], code: ["src", "lang"], trace: ["cols", "rows"], player: ["frames"], yourMove: ["state", "prompt", "choices", "key", "why"], handTrace: ["cols", "given", "blanks", "key"], compare: ["cols", "rows"], flow: ["nodes", "edges"] };
const LANGS = ["python", "html", "css", "javascript", "sql", "jinja", "json", "bash", "text"];
const CO_KINDS = ["def", "formula", "example", "warn", "analogy", "remember", "notice", "tip", "extra"];
function checkBlocks(w, list) {
  (list || []).forEach((b, i) => {
    const bw = w + "[" + i + "]:" + b.t;
    if (!NEED[b.t]) return E(bw, "unknown block type");
    NEED[b.t].forEach(f => { if (b[f] == null || b[f] === "") E(bw, "missing " + f) });
    if (b.t === "co" && !CO_KINDS.includes(b.kind)) E(bw, "bad callout kind " + b.kind);
    if (b.t === "code" && !LANGS.includes(b.lang)) E(bw, "bad lang " + b.lang);
    if (b.t === "fig" && !(b.svg || b.graph || b.line || b.bar || b.flow)) E(bw, "fig needs svg, graph, line, bar or flow");
    if (b.t === "fig" && b.graph && Array.isArray(b.graph.nodes)) E(bw, "graph nodes need fixed positions {id:[x,y]}");
    if (b.t === "ex" && (!Array.isArray(b.steps) || !b.steps.length)) E(bw, "worked example needs steps");
    if (b.t === "trace" && b.rows.some(r => r.length !== b.cols.length)) E(bw, "trace row length differs from cols");
    if (b.t === "handTrace") { if (b.blanks.length !== b.key.length) E(bw, "blanks and key differ in length"); b.blanks.forEach(rc => { if (!b.given[rc[0]] || b.given[rc[0]][rc[1]] == null) E(bw, "blank " + rc + " outside the table") }) }
    if (b.t === "yourMove") { const k = typeof b.key === "number" ? b.key : "ABCDEFGH".indexOf(String(b.key)); if (k < 0 || k >= b.choices.length) E(bw, "key is not a choice") }
    if (b.t === "player" && !b.frames.every(f => f.state != null && f.caption)) E(bw, "every frame needs state and caption");
    if (b.t === "flow") { const ids = b.nodes.map(n => n.id); b.edges.forEach(e => { if (!ids.includes(e[0]) || !ids.includes(e[1])) E(bw, "edge to unknown node " + e) }); if (b.nodes.some(n => n.x == null || n.y == null)) E(bw, "flow nodes need fixed x, y") }
  });
}
function sentences(s) { return (String(s).replace(/`[^`]*`/g, "x").match(/[^.!?]+[.!?]+/g) || []).length }

/* ---------- topics ---------- */
const subIndex = {};
M.topics.forEach(m => { subIndex[m.id] = (m.subs || []).map(s => s.id) });
Object.keys(APP.topics).forEach(id => {
  const t = APP.topics[id], w = "topic-" + id, m = M.topics.find(x => x.id === id);
  if (!m) return E(w, "registered but not in manifest");
  ["id", "name", "tagline", "story", "mindmap", "connect", "roadmap", "prereqs", "concepts", "sections", "practice", "remember", "methodCards", "flash", "test", "checklist", "cheat"].forEach(f => { if (t[f] == null) E(w, "missing " + f) });
  if (m.status === "stub") return;
  (t.prereqs || []).forEach(r => { if (!APP.refreshers.find(x => x.id === r)) E(w, "prereq " + r + " is not a refresher") });
  Object.entries(t.concepts || {}).forEach(([k, c]) => {
    ["name", "sub", "ease", "repair"].forEach(f => { if (c[f] == null) E(w + " concept " + k, "missing " + f) });
    if (c.sub && !subIndex[id].includes(c.sub)) E(w + " concept " + k, "sub " + c.sub + " not in manifest subs");
    const n = sentences(c.repair || ""); if (n < 2 || n > 4) E(w + " concept " + k, "repair must be 2-4 sentences (has " + n + ")");
  });
  const secIds = {};
  (t.sections || []).forEach((s, i) => {
    const sw = w + " section " + (s.id || i);
    ["id", "title", "studying", "why", "plain", "concepts", "core", "remember", "quiz"].forEach(f => { if (s[f] == null || s[f] === "") E(sw, "missing " + f) });
    if (secIds[s.id]) E(sw, "duplicate section id"); secIds[s.id] = 1;
    (s.concepts || []).forEach(c => { if (!t.concepts[c]) E(sw, "concept " + c + " unknown") });
    if (s.remember && (s.remember.length < 3 || s.remember.length > 5)) E(sw, "remember needs 3-5 facts");
    if (s.quiz && (s.quiz.length < 3 || s.quiz.length > 4)) E(sw, "quiz needs 3-4 questions");
    checkBlocks(sw + " core", s.core); checkBlocks(sw + " deep", s.deep);
    (s.quiz || []).forEach((q, k) => checkQ(sw + " quiz[" + k + "]", q, t));
    if (s.diagnostic) checkQ(sw + " diagnostic", s.diagnostic, t);
    if (s.teachBack && !(s.teachBack.prompt && s.teachBack.model)) E(sw, "teachBack needs prompt and model");
  });
  (t.roadmap || []).forEach(r => { if (!secIds[r[1]]) E(w, "roadmap points at unknown section " + r[1]) });
  (t.practice || []).forEach((q, k) => { checkQ(w + " practice[" + k + "]", q, t); (perConcept[id + ":" + q.concept] = perConcept[id + ":" + q.concept] || []).push(q.id) });
  (t.test || []).forEach((q, k) => checkQ(w + " test[" + k + "]", q, t));
  if (t.test && (t.test.length < 6 || t.test.length > 8)) E(w, "topic test needs 6-8 questions");
  const r = t.remember || {};
  ["facts", "traps", "formulas", "cues", "selector", "examMoves", "hooks"].forEach(f => { if (!Array.isArray(r[f])) E(w, "remember." + f + " must be an array") });
  (r.traps || []).forEach(x => { if (!x.text || x.cause == null) E(w, "remember.traps need {text, cause}") });
  (r.formulas || []).forEach(x => { if (!x.tex || !x.means || !x.when) E(w, "remember.formulas need {tex, means, when}") });
  (t.flash || []).forEach(c => { if (!c.front || !c.back || !c.kind) E(w, "flash card needs front, back, kind") });
  walk(t, w, false);
});
/* ---------- patches ---------- */
M.topics.forEach(m => (m.patches || []).forEach(f => { if (!/^patch-[a-z0-9-]+-(q1|q2|et)\.js$/.test(f)) E("topic " + m.id, "patch file name " + f + " must be patch-<id>-<exam>.js") }));

/* ---------- packs ---------- */
const uids = {}, ids = {};
Object.keys(APP.packs).forEach(ex => Object.keys(APP.packs[ex]).forEach(tid => {
  const pk = APP.packs[ex][tid], t = APP.topics[tid], m = M.topics.find(x => x.id === tid), w0 = "pack " + ex + "/" + tid;
  if (!m) return E(w0, "topic not in manifest");
  if (!pk.patterns || !pk.patterns.length) E(w0, "patterns[] missing (the last part file supplies it)");
  (pk.patterns || []).forEach(p => { if (!p.name || p.count == null || !p.cue || !p.firstMove) E(w0, "pattern needs name, count, cue, firstMove") });
  pk.pyqs.forEach((q, i) => {
    const w = w0 + " " + (q.id || "#" + i);
    ["id", "uid", "exam", "paper", "date", "qno", "marks", "type", "concept", "sub", "sec", "seconds", "tag", "stem", "sol"].forEach(f => { if (q[f] == null || q[f] === "") E(w, "missing " + f) });
    if (typeof q.id !== "string") E(w, "bank id must be a string");
    if (q.uid !== ex + ":" + q.id) E(w, "uid must be " + ex + ":" + q.id);
    if (uids[q.uid]) E(w, "duplicate uid"); uids[q.uid] = 1;
    if (ids[q.id] && ids[q.id] !== ex) E(w, "bank id also used in exam " + ids[q.id]); ids[q.id] = ex;
    if (!["MCQ", "MSQ", "NUM", "SA", "TF", "COMP"].includes(q.type)) E(w, "bad type " + q.type);
    if (!TAGS.includes(q.tag) || q.tag === "[ADDED]") E(w, "PYQ tag must be [SRC], [DERIVED] or [FLAG]");
    if (q.tag === "[FLAG]" && !q.tagNote) E(w, "[FLAG] needs tagNote");
    if (t && !t.concepts[q.concept]) E(w, "concept " + q.concept + " not in topic");
    if (!subIndex[tid].includes(q.sub)) E(w, "sub " + q.sub + " not in manifest subs");
    if (t && !t.sections.some(s => s.id === q.sec)) E(w, "sec " + q.sec + " is not a section of " + tid);
    if (q.type === "COMP" && !(q.parent && q.parent.id && q.parent.text)) E(w, "COMP needs parent{id,text}");
    if (q.repeatOf && !Object.keys(APP.packs).some(e => Object.keys(APP.packs[e]).some(x => APP.packs[e][x].pyqs.some(p => p.id === q.repeatOf)))) W(w, "repeatOf " + q.repeatOf + " not loaded (yet)");
    if (q.altKey != null && q.tag !== "[FLAG]") E(w, "altKey needs [FLAG]");
    checkKey(w, q, true);
    const s = q.sol || {};
    ["asked", "given", "clues", "idea", "method", "steps", "verify", "asserts", "trap", "rule", "transfer"].forEach(f => { if (s[f] == null || s[f] === "" || (Array.isArray(s[f]) && !s[f].length && f !== "asserts")) E(w, "sol." + f + " missing") });
    if (s.other == null) E(w, "sol.other missing (use \"one practical method\" when there is none)");
    const t2 = q.type === "COMP" ? q.childType : q.type;
    if ((t2 === "MCQ" || t2 === "MSQ") && q.options) q.options.forEach((o, k) => { const L = "ABCDEFGH"[k], n = s.optionNotes && s.optionNotes[L]; if (!n || !(n.why || typeof n === "string")) E(w, "optionNotes." + L + " missing (every option needs a why)") });
    if (s.optionNotes) { const K = keyLetters(q.key).map(x => x.toUpperCase()); Object.entries(s.optionNotes).forEach(([L, n]) => { if (!K.includes(L) && typeof n === "object" && !n.cause) W(w, "wrong option " + L + " has no cause label") }) }
    if (s.transfer) checkQ(w + " transfer", Object.assign({ id: q.id + "-transfer", tag: "[ADDED]" }, s.transfer), t, { transfer: true, loose: true });
    (perConcept[tid + ":" + q.concept] = perConcept[tid + ":" + q.concept] || []).push(q.id);
    walk(q, w + ".pyqs[" + i + "]", false);
  });
}));
/* ---------- refreshers, glossary ---------- */
const rids = {};
APP.refreshers.forEach(r => {
  const w = "refresher " + r.id; if (rids[r.id]) E(w, "duplicate id"); rids[r.id] = 1;
  if (!r.title || !r.blocks) E(w, "needs title and blocks");
  if (r.upgradesTo && !tids.includes(r.upgradesTo)) E(w, "upgradesTo unknown topic " + r.upgradesTo);
  checkBlocks(w, r.blocks); (r.quiz || []).forEach((q, k) => checkQ(w + " quiz[" + k + "]", q, null)); walk(r, w, false);
});
const gt = {}; APP.glossary.forEach(g => { if (!g.term || !g.def) E("glossary", "entry needs term and def"); if (gt[g.term.toLowerCase()]) E("glossary", "duplicate term " + g.term); gt[g.term.toLowerCase()] = 1 });
/* ---------- every concept: at least 3 questions counting PYQs and [ADDED] practice ---------- */
/* A topic built in parts: the rule waits until every PYQ the manifest expects for it is loaded (topics[].expected). */
Object.keys(APP.topics).forEach(id => {
  const m = M.topics.find(x => x.id === id); if (!m || m.status !== "ready") return;
  let loaded = 0, want = 0, marks = 0;
  Object.keys(APP.packs).forEach(ex => { const pk = APP.packs[ex][id]; if (pk) { loaded += pk.pyqs.length; marks += pk.pyqs.reduce((a, q) => a + (+q.marks || 0), 0) } });
  Object.keys(m.expected || {}).forEach(ex => { want += m.expected[ex].pyqs || 0 });
  if (want && loaded > want) E("topic " + id, loaded + " PYQs loaded but the manifest expects " + want);
  const complete = !m.fixture && want > 0 ? loaded === want : loaded > 0;
  if (complete && m.expected) Object.keys(m.expected).forEach(ex => { const pk = APP.packs[ex] && APP.packs[ex][id], mk = pk ? pk.pyqs.reduce((a, q) => a + (+q.marks || 0), 0) : 0; if (Math.abs(mk - m.expected[ex].marks) > 1e-9) E("topic " + id, ex + " marks " + mk + " differ from expected " + m.expected[ex].marks) });
  Object.keys(APP.topics[id].concepts).forEach(c => { const n = (perConcept[id + ":" + c] || []).length; if (n < 3) (complete ? E : W)("topic-" + id + " concept " + c, "only " + n + " PYQ+practice questions (needs 3)" + (complete ? "" : "; " + loaded + " of " + want + " PYQs loaded, checked again when the last pack is added")) });
});
/* ---------- counts are generated, never typed ---------- */
if (!FIX) { const live = JSON.stringify(APP.liveCounts()); const fileTxt = fs.readFileSync(path.join(ROOT, "js/counts.js"), "utf8"); if (fileTxt.indexOf(live) < 0) E("counts.js", "stale: run node tests/gen_counts.js") }
/* ---------- expected totals per exam (when every topic of the exam is ready) ---------- */
Object.entries(M.exams).forEach(([k, e]) => { const C = APP.liveCounts().exams[k]; const allReady = M.topics.filter(m => m.weeks.some(x => e.weeks.includes(x)) && !m.fixture).every(m => m.status === "ready"); if (allReady && e.expected && e.expected.pyqs && C && (C.pyqs !== e.expected.pyqs || Math.abs(C.marks - e.expected.marks) > 1e-9)) E("exam " + k, "PYQs " + C.pyqs + "/" + C.marks + " marks, expected " + e.expected.pyqs + "/" + e.expected.marks) });

warns.slice(0, 30).forEach(x => console.log("warn  " + x));
errs.slice(0, 200).forEach(x => console.log("ERROR " + x));
const nPyq = Object.keys(uids).length;
console.log("validate" + (FIX ? " (fixture)" : "") + ": " + Object.keys(APP.topics).length + " topics, " + nPyq + " PYQs, " + APP.refreshers.length + " refreshers, " + APP.glossary.length + " terms; " + errs.length + " errors, " + warns.length + " warnings");
process.exit(errs.length ? 1 : 0);
