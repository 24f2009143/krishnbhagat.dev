#!/usr/bin/env python3
"""Build tests/fixture/fixture.js from topic.part.js + pack.part.js, filling __STEM_id__ / __OPTIONS_id__ verbatim from the bank.
Usage: python3 -I tests/fixture/build_fixture.py /path/to/appdev1_quiz_2_categorized_question_bank.md"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from parse_mad1_q2 import parse  # noqa: E402

bank = sys.argv[1]
recs = {r["id"]: r for r in parse(bank, 1, 6673)}
pack = open(os.path.join(HERE, "pack.part.js"), encoding="utf-8").read()


def fill(m):
    kind, qid = m.group(1), m.group(2)
    r = recs[qid]
    return json.dumps(r["stem"] if kind == "STEM" else [o["text"] for o in r["options"]], ensure_ascii=False)


pack = re.sub(r"__(STEM|OPTIONS)_(\d+)__", fill, pack)
topic = open(os.path.join(HERE, "topic.part.js"), encoding="utf-8").read()
open(os.path.join(HERE, "fixture.js"), "w", encoding="utf-8").write(topic + "\n" + pack)
print("fixture.js written:", len(topic) + len(pack), "bytes")
