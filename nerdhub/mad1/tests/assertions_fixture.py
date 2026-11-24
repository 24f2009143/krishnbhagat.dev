"""Checks for the engine fixture (tests/fixture/fixture.js): every number and code output printed in its
sections, worked examples, questions and PYQ solutions. Ids Tfixture-NN."""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assertlib import check, run_py, out_of, eq, main  # noqa: E402

# ---------- real PYQs (code copied from the bank) ----------
PYQ_6406531325144 = '''def calculate(funx):
    def wrapper(a, b):
        x = funx(a, b)
        return x**2
    return wrapper

@calculate
def foo(x, y):
    return x - y

# main code
print(foo(5, 2))
'''


@check("Tfixture-01")
def pyq_6406531325144():
    eq(out_of(PYQ_6406531325144), "9", "foo(5, 2)")
    opts = {"A": "10", "B": "9", "C": "3", "D": "4"}
    eq([k for k, v in opts.items() if v == "9"], ["B"], "key")


PYQ_640653690117 = '''import logging
import sys

logging.basicConfig(level=logging.WARNING,
                    format='%(levelname)s - %(message)s')

num1, num2 = int(sys.argv[1]), int(sys.argv[2])

if num2 > 0:
    logging.debug(f"Division {num1}/{num2} is possible")
else:
    logging.critical("FATAL - Division by zero is not possible")
'''


@check("Tfixture-02")
def pyq_640653690117():
    claims = {"A": (("12", "24"), "DEBUG - Division 12/24 is possible"),
              "B": (("0", "24"), "DEBUG - Division 0/24 is possible"),
              "C": (("15", "0"), "CRITICAL - FATAL - Division by zero is not possible"),
              "D": (("0", "0"), "CRITICAL - FATAL - Division by zero is not possible")}
    true = [k for k, (args, want) in claims.items() if out_of(PYQ_640653690117, args, "log.py") == want]
    eq(true, ["C", "D"], "true statements")
    eq(out_of(PYQ_640653690117, ("12", "24"), "log.py"), "", "output for 12 24")


@check("Tfixture-03")
def pyq_6406531325152():
    before = math.ceil(math.log2(8))
    after = math.ceil(math.log2(8 + 5))
    eq((before, after), (3, 4), "bits per character")
    eq(2000 * (after - before), 2000, "increase in bits")


@check("Tfixture-04")
def pyq_640653351999():
    n = 10 ** 8
    ta, tb = 0.001 * n, 500 * math.sqrt(n)
    eq((ta, tb), (100000.0, 5000000.0), "times in ms")
    eq("A" if ta < tb else "B", "A", "faster package")


PYQ_640653771140 = '''def modify(func):
    def wrapper(name):
        print("Before function execution")
        result = func(name)
        print("After function execution")
        return result
    return wrapper

@modify
def greet(name):
    return f"Hello, {name}!"

print(greet("Ram"))
'''


@check("Tfixture-05")
def pyq_640653771140():
    eq(out_of(PYQ_640653771140), "Before function execution\nAfter function execution\nHello, Ram!", "output")


# ---------- lesson code and worked examples ----------
TWICE = '''def twice(func):
    def wrapper(x):
        return func(func(x))
    return wrapper

@twice
def add3(n):
    return n + 3

print(add3(10))
'''


@check("Tfixture-06")
def twice_add3():
    eq(out_of(TWICE), "16", "add3(10)")
    eq(out_of(TWICE.replace("print(add3(10))", "print(add3(13 - 3) - 3)")), "13", "func(10) then func(13)")


@check("Tfixture-07")
def stop_decorator():
    src = '''def stop(func):
    def wrapper():
        return "blocked"
    return wrapper

@stop
def hello():
    print("hi")
    return "done"

print(hello())
'''
    eq(out_of(src), "blocked", "output")


@check("Tfixture-08")
def stacked_order():
    src = '''def a(f):
    def w():
        return "a(" + f() + ")"
    return w

def b(f):
    def w():
        return "b(" + f() + ")"
    return w

@a
@b
def core():
    return "x"

print(core())
'''
    eq(out_of(src), "a(b(x))", "output")


LOG_LEVELS = '''import logging
logging.basicConfig(level=logging.INFO)
logging.debug("d")
logging.info("i")
logging.warning("w")
logging.error("e")
logging.critical("c")
'''


@check("Tfixture-09")
def info_threshold():
    eq(out_of(LOG_LEVELS), "INFO:root:i\nWARNING:root:w\nERROR:root:e\nCRITICAL:root:c", "printed lines")


@check("Tfixture-10")
def transfer_time():
    eq(10 * 10 ** 6 * 8 / (4 * 10 ** 6), 20.0, "seconds for 10 MB at 4 Mbps")


@check("Tfixture-11")
def hello_admin():
    eq(out_of('print("Hello " + "Admin")'), "Hello Admin", "output")


COUNT = '''calls = 0
def count(func):
    def wrapper(*args):
        global calls
        calls += 1
        return func(*args)
    return wrapper

@count
def sq(n):
    return n * n
'''


@check("Tfixture-12")
def comp_child_1():
    eq(out_of(COUNT + "print(sq(4), calls)\n"), "16 1", "output")


@check("Tfixture-13")
def comp_child_2():
    eq(out_of(COUNT + "sq(2)\nsq(3)\nprint(calls == 2, sq.__name__)\n"), "True wrapper", "calls and name")
    eq(out_of(COUNT + "print(sq.__closure__[0].cell_contents.__name__)\n"), "sq", "original still reachable")


@check("Tfixture-14")
def template_placeholder():
    base = 'from string import Template\nt = Template("$a and $b")\nprint(%s)\n'
    res = {}
    for k, expr in {"A": "t.substitute(a=1)", "B": "t.safe_substitute(a=1)",
                    "C": "t.substitute(a=1, b=2, c=3)", "D": "t.substitute({'a': 1})"}.items():
        o, e, rc = run_py(base % expr)
        res[k] = "KeyError" in e and rc != 0
    eq([k for k, v in res.items() if v], ["A", "D"], "options that raise")
    eq(out_of(base % "t.safe_substitute(a=1)"), "1 and $b", "safe_substitute keeps $b")


@check("Tfixture-15")
def mute():
    src = 'def mute(func):\n    def wrapper(n):\n        return 0\n    return wrapper\n\n@mute\ndef double(n):\n    return 2 * n\n\nprint(double(21))\n'
    eq(out_of(src), "0", "output")


@check("Tfixture-16")
def keep():
    src = 'def keep(func):\n    return func\n\n@keep\ndef f():\n    return 5\n\nprint(f())\n'
    eq(out_of(src), "5", "output")


@check("Tfixture-17")
def log_wrapper_order():
    src = '''def log(func):
    def wrapper(x):
        print("in")
        r = func(x)
        print("out")
        return r
    return wrapper

@log
def inc(x):
    print("work")
    return x + 1

print(inc(1))
'''
    eq(out_of(src), "in\nwork\nout\n2", "output")


@check("Tfixture-18")
def ping_twice():
    src = 'def twice(func):\n    def wrapper():\n        func()\n        func()\n    return wrapper\n\n@twice\ndef ping():\n    print("ping")\n\nping()\n'
    eq(out_of(src), "ping\nping", "output")


@check("Tfixture-19")
def error_level():
    src = 'import logging\nlogging.basicConfig(level=logging.ERROR)\nlogging.warning("w")\nlogging.error("e")\n'
    eq(out_of(src), "ERROR:root:e", "output")


@check("Tfixture-20")
def warning_count():
    src = LOG_LEVELS.replace("logging.INFO", "logging.WARNING")
    eq(len(out_of(src).split("\n")), 3, "lines printed")


@check("Tfixture-21")
def letters_bits():
    eq(math.ceil(math.log2(26)), 5, "bits for 26 letters")


@check("Tfixture-22")
def transfer_tolerance():
    eq(round(10e6 * 8 / 4e6, 6), 20.0, "seconds")


@check("Tfixture-23")
def growth_small():
    n = 2 ** 20
    ta, tb = 0.01 * n, 100 * math.log2(n)
    eq((round(ta, 2), tb), (10485.76, 2000.0), "times")
    eq("B" if tb < ta else "A", "B", "faster")


@check("Tfixture-24")
def crossover():
    n = (500 / 0.001) ** 2
    eq(n, 2.5e11, "crossover n")
    eq(abs(0.001 * n - 500 * math.sqrt(n)) < 1e-6, True, "times equal")


@check("Tfixture-25")
def plus_five():
    src = 'def modify(func):\n    def wrapper(p, q):\n        return func(p, q) + 5\n    return wrapper\n\n@modify\ndef bar(a, b):\n    return a * b\n\nprint(bar(4, 5))\n'
    eq(out_of(src), "25", "output")


@check("Tfixture-26")
def doc_bits():
    eq(math.ceil(math.log2(13)), 4, "bits per char")
    eq(1000 * 4, 4000, "document bits")


@check("Tfixture-27")
def info_example():
    src = 'import logging\nlogging.basicConfig(level=logging.INFO)\nlogging.debug("start")\nlogging.info("ready")\nlogging.warning("slow")\n'
    eq(out_of(src), "INFO:root:ready\nWARNING:root:slow", "output")


@check("Tfixture-28")
def decoration_time():
    src = 'def a(f):\n    print("decorating with a")\n    return f\n\ndef b(f):\n    print("decorating with b")\n    return f\n\n@a\n@b\ndef g():\n    pass\n'
    eq(out_of(src), "decorating with b\ndecorating with a", "output")


@check("Tfixture-29")
def transfer_foo():
    eq(out_of(PYQ_6406531325144.replace("foo(5, 2)", "foo(2, 5)")), "9", "foo(2, 5)")


@check("Tfixture-30")
def transfer_log_debug():
    src = PYQ_640653690117.replace("level=logging.WARNING", "level=logging.DEBUG")
    eq(out_of(src, ("3", "4"), "log.py"), "DEBUG - Division 3/4 is possible", "output")


@check("Tfixture-31")
def transfer_bits():
    eq(500 * (math.ceil(math.log2(17)) - math.ceil(math.log2(16))), 500, "increase")


@check("Tfixture-32")
def transfer_growth():
    n = 10 ** 12
    ta, tb = 0.001 * n, 500 * math.sqrt(n)
    eq((ta, tb), (1e9, 5e8), "times")
    eq("B" if tb < ta else "A", "B", "faster")


@check("Tfixture-33")
def transfer_greet():
    src = PYQ_640653771140.replace('        result = func(name)\n        print("After function execution")\n        return result', '        return func(name)')
    eq(out_of(src), "Before function execution\nHello, Ram!", "output")


if __name__ == "__main__":
    main()
