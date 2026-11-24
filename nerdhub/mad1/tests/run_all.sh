#!/bin/sh
# All gates of the engine spec (C-2.7). Independent gates run in parallel and every step is timed.
#   sh tests/run_all.sh [BANK.md]                 full run (engine checkpoint, pilot, release)
#   sh tests/run_all.sh --fast [BANK.md] [ROUTES] fast run while building: assertions, validate, verify_claims,
#                                                 counts, and the browser test only for routes matching ROUTES
#                                                 (comma-separated substrings, e.g. "home,topic/db-sql"; default: all)
# A step slower than 180 s is reported. Exit code is non-zero if any gate fails.
cd "$(dirname "$0")/.." || exit 2
FAST=0; [ "$1" = "--fast" ] && { FAST=1; shift; }
BANK="${1:-$MAD1_BANK}"; ROUTES="$2"
T=$(mktemp -d); fail=0
step() { name="$1"; shift; ( s=$(date +%s); "$@" >"$T/$name.log" 2>&1; rc=$?; e=$(( $(date +%s) - s )); echo "$rc $e" >"$T/$name.rc" ) & }
# 1. independent gates, in parallel
for f in tests/assertions_*.py; do step "assert_$(basename "$f" .py)" python3 -I "$f"; done
step validate node tests/validate.js
step validate_fixture node tests/validate.js --fixture
step counts node tests/gen_counts.js --check
step adapt node tests/adapt_sim.js
[ -n "$BANK" ] && step wording python3 -I tests/wording_check.py "$BANK"
[ $FAST -eq 0 ] && step depth python3 -I tests/depth_parity.py
if [ $FAST -eq 1 ]; then
  step browser node tests/browser_test.js --fixture ${ROUTES:+--only "$ROUTES"}
else
  step browser node tests/browser_test.js
  step browser_fixture node tests/browser_test.js --fixture
fi
wait
# 2. verify_claims runs every assertions file itself, so it goes after the parallel batch
step verify_claims python3 -I tests/verify_claims.py; wait
for r in "$T"/*.rc; do
  n=$(basename "$r" .rc); set -- $(cat "$r")
  last=$(tail -n 1 "$T/$n.log")
  if [ "$1" -ne 0 ]; then fail=1; echo "FAIL  $n (${2}s)"; tail -n 15 "$T/$n.log" | sed 's/^/      /'; else echo "ok    $n (${2}s)  $last"; fi
  [ "$2" -gt 180 ] && echo "SLOW  $n took ${2}s (over 3 minutes)"
done
rm -rf "$T"
echo; [ $fail -eq 0 ] && echo "ALL GATES PASS" || echo "SOME GATES FAILED"
exit $fail
