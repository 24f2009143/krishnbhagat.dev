#!/usr/bin/env python3
"""Gate 5: every PYQ stem, option and comprehension parent equals the bank text. Only whitespace may differ
(PDF-glued words re-spaced). Picture questions keep their text; the data goes in figureNote.
Usage: python3 -I tests/wording_check.py BANK.md [--fixture]"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from parse_mad1_q2 import parse  # noqa: E402
bank = sys.argv[1]
fixture = "--fixture" in sys.argv
recs = {r["id"]: r for r in parse(bank, 1, 6673)}
data = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")] + (["--fixture"] if fixture else []), capture_output=True, text=True, check=True).stdout)
squash = lambda s: re.sub(r"\s+", "", s or "")
errs, n = [], 0
for ex, tops in data["packs"].items():
    for tid, pk in tops.items():
        for q in pk["pyqs"]:
            n += 1
            r = recs.get(q["id"])
            if not r:
                errs.append("%s: id not in the bank" % q["id"]); continue
            if squash(q["stem"]) != squash(r["stem"]):
                errs.append("%s: stem differs from the bank" % q["id"])
            got = [o if isinstance(o, str) else o.get("text") for o in (q.get("options") or [])]
            if [squash(x) for x in got] != [squash(o["text"]) for o in r["options"]]:
                errs.append("%s: options differ from the bank" % q["id"])
            for f, want in (("marks", r["marks"]), ("qno", r["qno"]), ("paper", r["date"])):
                if (float(q[f]) if f == "marks" else q[f]) != want:
                    errs.append("%s: %s is %r, bank says %r" % (q["id"], f, q[f], want))
            if r.get("parent") and squash((q.get("parent") or {}).get("text")) != squash(r["parent"]["text"]):
                errs.append("%s: parent text differs from the bank" % q["id"])
            if r.get("figureNote") and not q.get("figureNote"):
                errs.append("%s: picture question needs figureNote" % q["id"])
for e in errs:
    print("ERROR " + e)
print("wording_check: %d PYQs compared with the bank, %d differences" % (n, len(errs)))
sys.exit(1 if errs else 0)
