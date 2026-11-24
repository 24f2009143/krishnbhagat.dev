#!/bin/sh
# All gates of the engine spec (C-2.7), in the build-instructions order. Usage: sh tests/run_all.sh [BANK.md]
# With a bank path the wording check (gate 5) runs too. Exit code is non-zero if any gate fails.
cd "$(dirname "$0")/.." || exit 2
BANK="${1:-$MAD1_BANK}"
fail=0
run() { printf '\n== %s\n' "$1"; shift; "$@" || { echo "GATE FAILED: $*"; fail=1; }; }
for f in tests/assertions_*.py; do run "gate 3 assertions $(basename "$f")" python3 -I "$f"; done
run "gate 2 validate" node tests/validate.js
run "gate 2 validate (fixture)" node tests/validate.js --fixture
run "gate 4 verify_claims" python3 -I tests/verify_claims.py
run "gate 4 verify_claims (fixture)" python3 -I tests/verify_claims.py --fixture
if [ -n "$BANK" ]; then
  run "gate 5 wording" python3 -I tests/wording_check.py "$BANK"
  run "gate 5 wording (fixture)" python3 -I tests/wording_check.py "$BANK" --fixture
else echo; echo "== gate 5 wording: skipped (pass the bank path)"; fi
run "gate 6 depth_parity" python3 -I tests/depth_parity.py
run "gate 6 depth_parity (fixture)" python3 -I tests/depth_parity.py --fixture
run "counts are generated" node tests/gen_counts.js --check
run "adaptive model" node tests/adapt_sim.js
run "gates 1, 7, 8 browser + offline" node tests/browser_test.js
run "gates 1, 7, 8 browser + offline (fixture)" node tests/browser_test.js --fixture
echo; [ $fail -eq 0 ] && echo "ALL GATES PASS" || echo "SOME GATES FAILED"
exit $fail
