#!/usr/bin/env python3
"""Gate 6: every ready topic meets the same minimums, so later topics are never thinner than the pilot.
Minimums (from the topic spec A3/A6): worked examples >= 2 per section; section quiz 3-4; topic test 6-8;
at least 1 player, 1 yourMove, 1 handTrace and 3 interactives in all; flashcards >= 8; every concept >= 3 PYQ+practice
questions; every PYQ has steps, optionNotes (MCQ/MSQ) and a transfer. Prints a table and names the weakest topic.
Usage: python3 -I tests/depth_parity.py [--fixture]"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
fixture = "--fixture" in sys.argv
data = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")] + (["--fixture"] if fixture else []), capture_output=True, text=True, check=True).stdout)
ready = [m["id"] for m in data["manifest"]["topics"] if m["status"] == "ready" and m["id"] in data["topics"]]
rows, fails = [], []
for tid in ready:
    t = data["topics"][tid]
    blocks = []
    for s in t["sections"]:
        blocks += s.get("core", []) + s.get("deep", [])
    kinds = [b["t"] for b in blocks]
    ex_per_sec = [sum(1 for b in s.get("core", []) + s.get("deep", []) if b["t"] == "ex") for s in t["sections"]]
    quiz = [len(s.get("quiz", [])) for s in t["sections"]]
    meta = next(x for x in data["manifest"]["topics"] if x["id"] == tid)
    want = sum(v.get("pyqs", 0) for v in (meta.get("expected") or {}).values()) or 0
    pyqs = []
    for ex in data["packs"].values():
        pyqs += ex.get(tid, {}).get("pyqs", [])
    per_concept = {c: 0 for c in t["concepts"]}
    for q in pyqs + t.get("practice", []):
        per_concept[q.get("concept")] = per_concept.get(q.get("concept"), 0) + 1
    sol_ok = sum(1 for q in pyqs if q.get("sol", {}).get("steps") and q["sol"].get("transfer")
                 and (q["type"] not in ("MCQ", "MSQ") or len(q["sol"].get("optionNotes", {})) == len(q.get("options", []))))
    m = {"sections": len(t["sections"]), "min ex/section": min(ex_per_sec or [0]), "quiz min": min(quiz or [0]), "quiz max": max(quiz or [0]),
         "player": kinds.count("player"), "yourMove": kinds.count("yourMove"), "handTrace": kinds.count("handTrace"),
         "interactives": sum(kinds.count(k) for k in ("player", "yourMove", "handTrace")) + sum(1 for s in t["sections"] if s.get("diagnostic")),
         "flash": len(t.get("flash", [])), "test": len(t.get("test", [])), "practice": len(t.get("practice", [])),
         "min q/concept": min(per_concept.values() or [0]), "PYQs": len(pyqs), "full PYQ sols": sol_ok}
    checks = [("min ex/section", m["min ex/section"] >= 2), ("quiz 3-4", 3 <= m["quiz min"] and m["quiz max"] <= 4), ("player", m["player"] >= 1),
              ("yourMove", m["yourMove"] >= 1), ("handTrace", m["handTrace"] >= 1), ("interactives", m["interactives"] >= 3),
              ("flash", m["flash"] >= 8), ("test 6-8", 6 <= m["test"] <= 8), ("q/concept", m["min q/concept"] >= 3 or len(pyqs) < want),  # checked once every expected PYQ is loaded
              ("PYQ sols", m["full PYQ sols"] == m["PYQs"])]
    met = sum(1 for _, ok in checks if ok)
    for name, ok in checks:
        if not ok:
            fails.append("%s: below minimum: %s (%s)" % (tid, name, json.dumps(m)))
    rows.append((met / len(checks), tid, m))
if not rows:
    print("depth_parity: no ready topics yet")
    sys.exit(0)
cols = list(rows[0][2].keys())
print("topic".ljust(16) + " ".join(c[:12].rjust(12) for c in cols))
for score, tid, m in rows:
    print(tid.ljust(16) + " ".join(str(m[c]).rjust(12) for c in cols))
w = min(rows, key=lambda r: (r[0], r[2]["min ex/section"] + r[2]["flash"]))
print("weakest topic: %s (%d%% of minimums met)" % (w[1], round(100 * w[0])))
for score, tid, m in rows:
    meta = next(x for x in data["manifest"]["topics"] if x["id"] == tid)
    want = sum(v.get("pyqs", 0) for v in (meta.get("expected") or {}).values())
    if want and m["PYQs"] < want:
        print("note: %s has %d of %d PYQs; questions per concept are checked when the last pack is added" % (tid, m["PYQs"], want))
for f in fails:
    print("FAIL " + f)
sys.exit(1 if fails else 0)
