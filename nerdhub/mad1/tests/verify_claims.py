#!/usr/bin/env python3
"""Gate 4: every asserts[] entry (on sol, ex and Q objects) and every inline [assert:T<topic>-<nn>] tag must map to an
existing, passing check in tests/assertions_<id>.py. Any "verified by code" / "Code: ..." / "ran the code" claim in prose
must carry an asserts[] or [assert:] reference on the same object, otherwise reword it to "checked by reasoning".
Usage: python3 -I tests/verify_claims.py [--fixture]"""
import glob, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
fixture = "--fixture" in sys.argv
data = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")] + (["--fixture"] if fixture else []), capture_output=True, text=True, check=True).stdout)

results = {}
for f in sorted(glob.glob(os.path.join(HERE, "assertions_*.py"))):
    tid = os.path.basename(f)[len("assertions_"):-3]
    p = subprocess.run([sys.executable, "-I", f, "--json"], capture_output=True, text=True)
    try:
        res = json.loads(p.stdout.strip().splitlines()[-1])
    except Exception:  # noqa: BLE001
        print("ERROR %s did not produce results:\n%s" % (f, p.stderr[-800:])); sys.exit(1)
    for cid, v in res.items():
        if not cid.startswith("T%s-" % tid):
            print("ERROR check id %s in %s must start with T%s-" % (cid, os.path.basename(f), tid)); sys.exit(1)
        results[cid] = v

TAG = re.compile(r"\[assert:(T[\w-]+-\d+)\]")
CLAIM = re.compile(r"(?i:verified by code|\bran the code\b|\bby running\b|\bran `)|(?:^|[\n.] *)Code: ")
errors, refs = [], {}


def walk(o, where):
    if isinstance(o, dict):
        own = list(o.get("asserts") or [])
        texts = []
        for k, v in o.items():
            if isinstance(v, str):
                texts.append(v)
                own += TAG.findall(v)
            elif k == "lines" and isinstance(v, list):
                for row in v:
                    if len(row) > 1 and isinstance(row[1], str):
                        own += TAG.findall(row[1])
        for cid in own:
            refs.setdefault(cid, []).append(where)
        for t in texts:
            if CLAIM.search(t) and not own:
                errors.append("%s: claims a code check but has no asserts[] or [assert:] tag: %r" % (where, t[:90]))
        for k, v in o.items():
            if k in ("stem", "options") and ".pyqs[" in where:
                continue
            walk(v, where + "." + k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, "%s[%d]" % (where, i))


walk(data["topics"], "topics")
walk(data["packs"], "packs")
walk(data["refreshers"], "refreshers")
for cid, wh in sorted(refs.items()):
    if cid not in results:
        errors.append("%s: no check %s in any assertions_<id>.py" % (wh[0], cid))
    elif results[cid] != "pass":
        errors.append("%s: check %s fails: %s" % (wh[0], cid, results[cid]))
for e in errors[:100]:
    print("ERROR " + e)
unused = sorted(set(results) - set(refs))
scope = [c for c in unused if fixture or not c.startswith("Tfixture-")]
if scope:
    print("note: %d checks are not referenced from the data: %s" % (len(scope), ", ".join(scope[:20])))
print("verify_claims%s: %d references to %d checks, %d checks run (%d failing); %d errors" % (
    " (fixture)" if fixture else "", sum(len(v) for v in refs.values()), len(refs), len(results),
    sum(1 for v in results.values() if v != "pass"), len(errors)))
sys.exit(1 if errors or any(v != "pass" for v in results.values()) else 0)
