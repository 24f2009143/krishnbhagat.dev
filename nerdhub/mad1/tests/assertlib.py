"""Shared helpers for tests/assertions_<id>.py.

Each check is a function decorated with @check("T<topic>-<nn>"). It returns None on success or raises AssertionError.
Run one file:  python3 -I tests/assertions_<id>.py        (prints a summary; exit code 1 on any failure)
               python3 -I tests/assertions_<id>.py --json (prints {"id": "pass" | "fail: reason"} for verify_claims.py)
Code is executed in a fresh `python3 -I` subprocess inside a temporary folder, never in this process.
"""
import json, os, subprocess, sys, tempfile, traceback

CHECKS = {}
# Code runs in the pinned environment (tests/requirements.txt): tests/.venv, or MAD1_PYTHON, else this interpreter.
_VENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv", "bin", "python")
PY = os.environ.get("MAD1_PYTHON") or (_VENV if os.path.exists(_VENV) else sys.executable)


def check(cid):
    def deco(fn):
        if cid in CHECKS:
            raise SystemExit("duplicate check id " + cid)
        CHECKS[cid] = fn
        return fn
    return deco


def run_py(src, args=(), filename="main.py", timeout=20):
    """Run src as `python3 -I <filename> args...` in an empty temp folder. Returns (stdout, stderr, returncode)."""
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(src)
        p = subprocess.run([PY, "-I", filename, *map(str, args)], cwd=d, capture_output=True, text=True, timeout=timeout)
        return p.stdout, p.stderr, p.returncode


def out_of(src, args=(), filename="main.py"):
    """stdout + stderr of a run, with trailing whitespace trimmed per line (logging writes to stderr)."""
    o, e, _ = run_py(src, args, filename)
    return "\n".join(line.rstrip() for line in (o + e).rstrip("\n").split("\n"))


def eq(got, want, what=""):
    if got != want:
        raise AssertionError("%s: got %r, want %r" % (what or "value", got, want))


def main():
    as_json = "--json" in sys.argv
    res = {}
    for cid, fn in CHECKS.items():
        try:
            fn()
            res[cid] = "pass"
        except Exception as e:  # noqa: BLE001 - every failure is reported
            res[cid] = "fail: " + (str(e) or traceback.format_exc().splitlines()[-1])
    if as_json:
        print(json.dumps(res))
    else:
        bad = {k: v for k, v in res.items() if v != "pass"}
        for k, v in res.items():
            print(("PASS " if v == "pass" else "FAIL ") + k + ("" if v == "pass" else "  " + v))
        ver = subprocess.run([PY, "-c", "import sys;print(sys.version.split()[0])"], capture_output=True, text=True).stdout.strip()
        print("%d checks, %d failed (code ran on python %s)" % (len(res), len(bad), ver))
    sys.exit(1 if any(v != "pass" for v in res.values()) else 0)
