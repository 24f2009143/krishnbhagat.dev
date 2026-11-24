# MAD 1 engine tests (gates of MAD1_ENGINE_SPEC.md C-2.7)

Run everything (pass the bank to include the wording check):

    sh tests/run_all.sh /path/to/appdev1_quiz_2_categorized_question_bank.md

| Gate | Script | What fails it |
|---|---|---|
| 1 one sanitizer | `browser_test.js` (fixture probe `fx-t4`) | any `<img>`/`<script>` from data reaching the page |
| 2 schema | `validate.js` | missing fields, unresolved ids, bad keys, draft text, step-hiders, Hinglish, odd `$`, < 3 questions per concept, stale counts |
| 3 numbers and outputs | `assertions_<id>.py` (helpers in `assertlib.py`) | any recomputed number or executed output that differs |
| 4 claims | `verify_claims.py` | an `asserts[]` id or `[assert:T<id>-NN]` tag with no passing check; a "ran the code" claim with no reference |
| 5 wording | `wording_check.py BANK` | stem, options, parent text, marks, qno or paper differing from the bank (whitespace aside) |
| 6 depth parity | `depth_parity.py` | a ready topic below the minimums; prints the weakest topic |
| 7 browser | `browser_test.js` | console/page/KaTeX errors, 404s, raw `\|` rows or fences, any route or lesson crashing, a PYQ not scored correct with its key, altKey colouring, 360 px sideways scroll, dark mode |
| 8 offline | `browser_test.js` | any request to another host (Firebase sync hosts are blocked too and must fail silently) |
| counts | `gen_counts.js` (`--check`) | `js/counts.js` not regenerated after a pack changed |
| adaptive model | `adapt_sim.js` | BKT, forgetting, rule of 3, marks-at-risk picking or merge misbehaving |

`--fixture` runs a gate on `tests/fixture/fixture.js` (built by `tests/fixture/build_fixture.py BANK` from
`topic.part.js` + `pack.part.js`; stems and options are copied from the bank). Open it in a browser with `index.html?fixture=1`.
Browser tests need Google Chrome (set `CHROME=/path` elsewhere); no npm packages are used.
Code in assertions runs with `python3 -I` in a temporary folder. Python used so far: 3.14.6. Flask and the other
runtime pins are decided in the pilot chat (flask-core) and recorded in `manifest.conventions[]`.
