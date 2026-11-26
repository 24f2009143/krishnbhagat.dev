"""Checks for js/data/topic-python-fund.js and js/data/pyqs/q2/python-fund.js. Ids Tpython-fund-NN.
Code runs in the pinned environment (tests/requirements.txt)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assertlib import check, out_of, eq, main  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402

TWICE = "def twice(f, x):\n    return f(f(x))\n\ndef add3(n):\n    return n + 3\n\n"
ADDER = "def make_adder(k):\n    def add(n):\n        return n + k\n    return add\n\n"
SHOUT = 'def shout(func):\n    def wrapper(name):\n        return func(name).upper()\n    return wrapper\n\n@shout\ndef greet(name):\n    return "hi " + name\n\n'
LOGW = 'def log(func):\n    def wrapper(x):\n        print("in")\n        r = func(x)\n        print("out")\n        return r\n    return wrapper\n\n@log\ndef inc(x):\n    print("work")\n    return x + 1\n\nprint(inc(1))\n'
AB = 'def a(f):\n    def w():\n        return "a(" + f() + ")"\n    return w\n\ndef b(f):\n    def w():\n        return "b(" + f() + ")"\n    return w\n\n'
DECO_PRINT = 'def a(f):\n    print("decorating with a")\n    return f\n\ndef b(f):\n    print("decorating with b")\n    return f\n\n@a\n@b\ndef g():\n    pass\n'
ADD1DBL = 'def add1(f):\n    def w(n):\n        return f(n) + 1\n    return w\n\ndef dbl(f):\n    def w(n):\n        return f(n) * 2\n    return w\n\n'
LOGPY = 'import logging\nimport sys\n\nlogging.basicConfig(level=logging.INFO,\n                    format="%(levelname)s - %(message)s")\na = int(sys.argv[1])\nlogging.debug("start")\nlogging.info(f"got {a}")\nlogging.warning("done")\n'
LEVELS = 'import logging\n%s\nlogging.debug("d")\nlogging.info("i")\nlogging.warning("w")\nlogging.error("e")\nlogging.critical("c")\n'


@check("Tpython-fund-01")
def say():
    eq(out_of('def shout(t):\n    return t.upper()\n\nsay = shout\nprint(say("hi"))\n'), "HI", "output")


@check("Tpython-fund-02")
def twice10():
    eq(out_of(TWICE + "print(twice(add3, 10))\n"), "16", "output")


@check("Tpython-fund-03")
def adder5():
    eq(out_of(ADDER + "add5 = make_adder(5)\nprint(add5(10))\n"), "15", "output")


@check("Tpython-fund-04")
def twice0():
    eq(out_of(TWICE + "print(twice(add3, 0))\n"), "6", "output")


@check("Tpython-fund-05")
def adder_call():
    o = out_of(ADDER + "print(make_adder(2)(3))\nprint(make_adder(2))\n").split("\n")
    eq((o[0], o[1].startswith("<function make_adder.<locals>.add at 0x")), ("5", True), "outputs")


@check("Tpython-fund-06")
def apply_inc():
    eq(out_of("def apply(f, x):\n    return f(x) * 2\n\ndef inc(n):\n    return n + 1\n\nprint(apply(inc, 4))\n"), "10", "output")


@check("Tpython-fund-07")
def closure():
    eq(out_of('def outer():\n    msg = "hi"\n    def inner():\n        return msg + "!"\n    return inner\n\nf = outer()\nprint(f())\n'), "hi!", "output")


@check("Tpython-fund-08")
def shout_ram():
    eq(out_of(SHOUT + 'print(greet("ram"))\n'), "HI RAM", "output")


@check("Tpython-fund-09")
def triple_dead():
    eq(out_of("def modify(func):\n    def wrapper(n):\n        return n * 10\n    return wrapper\n\n@modify\ndef triple(n):\n    return n * 3\n\nprint(triple(2))\n"), "20", "output")


@check("Tpython-fund-10")
def update_squares():
    eq(out_of("def update(func):\n    def wrapper(N):\n        out = []\n        for i in range(N):\n            out.append(i * i)\n        return out\n    return wrapper\n\n@update\ndef func(N):\n    return N + 100\n\nprint(func(4))\n"), "[0, 1, 4, 9]", "output")


@check("Tpython-fund-11")
def wrapper_name():
    eq(out_of(SHOUT + "print(greet.__name__)\n"), "wrapper", "name")


@check("Tpython-fund-12")
def stop():
    eq(out_of('def stop(func):\n    def wrapper():\n        return "blocked"\n    return wrapper\n\n@stop\ndef hello():\n    print("hi")\n    return "done"\n\nprint(hello())\n'), "blocked", "output")


@check("Tpython-fund-13")
def keep():
    eq(out_of("def keep(func):\n    return func\n\n@keep\ndef f():\n    return 5\n\nprint(f())\n"), "5", "output")


@check("Tpython-fund-14")
def mute():
    eq(out_of("def mute(func):\n    def wrapper(n):\n        return 0\n    return wrapper\n\n@mute\ndef double(n):\n    return 2 * n\n\nprint(double(21))\n"), "0", "output")


@check("Tpython-fund-15")
def in_work_out():
    eq(out_of(LOGW), "in\nwork\nout\n2", "output")


@check("Tpython-fund-16")
def plus5():
    eq(out_of("def modify(func):\n    def wrapper(p, q):\n        return func(p, q) + 5\n    return wrapper\n\n@modify\ndef bar(a, b):\n    return a * b\n\nprint(bar(4, 5))\n"), "25", "output")


@check("Tpython-fund-17")
def pong():
    eq(out_of('def twice(func):\n    def wrapper():\n        print("start")\n        a = func()\n        b = func()\n        return a, b\n    return wrapper\n\n@twice\ndef ping():\n    return "pong"\n\nprint(ping())\n'), "start\n('pong', 'pong')", "output")


SQDIFF = "def sq(func):\n    def wrapper(a, b):\n        return func(a, b) ** 2\n    return wrapper\n\n@sq\ndef f(a, b):\n    return a - b\n\n"


@check("Tpython-fund-18")
def square_diff():
    eq(out_of(SQDIFF + "print(f(2, 5))\nprint(7 - 3, (7 - 3) ** 2, f(7, 3))\n"), "9\n4 16 16", "outputs (quiz and hand trace)")


@check("Tpython-fund-19")
def ping_twice():
    eq(out_of('def twice(func):\n    def wrapper():\n        func()\n        func()\n    return wrapper\n\n@twice\ndef ping():\n    print("ping")\n\nping()\n'), "ping\nping", "output")


@check("Tpython-fund-20")
def ab():
    eq(out_of(AB + '@a\n@b\ndef core():\n    return "x"\n\nprint(core())\n'), "a(b(x))", "output")


@check("Tpython-fund-21")
def ba():
    eq(out_of(AB + '@b\n@a\ndef core():\n    return "x"\n\nprint(core())\n'), "b(a(x))", "output")


@check("Tpython-fund-22")
def rev_half():
    src = "def rev(func):\n    def wrapper(l):\n        return func(l)[::-1]\n    return wrapper\n\ndef half(func):\n    def wrapper(l):\n        return [x / 2 for x in func(l)]\n    return wrapper\n\n@rev\n@half\ndef squares(l):\n    return [i ** 2 for i in l]\n\nprint(squares([2, 4, 6]))\n"
    eq(out_of(src), "[18.0, 8.0, 2.0]", "output")


@check("Tpython-fund-23")
def decoration_time():
    eq(out_of(DECO_PRINT), "decorating with b\ndecorating with a", "output")


@check("Tpython-fund-24")
def add1_dbl():
    eq(out_of(ADD1DBL + "@add1\n@dbl\ndef ident(n):\n    return n\n\nprint(ident(5))\n"), "11", "output")


@check("Tpython-fund-25")
def dbl_add1():
    eq(out_of(ADD1DBL + "@dbl\n@add1\ndef ident(n):\n    return n\n\nprint(ident(5))\n"), "12", "output")


@check("Tpython-fund-26")
def log_py():
    eq(out_of(LOGPY, ["7"], "log.py"), "INFO - got 7\nWARNING - done", "output")


@check("Tpython-fund-27")
def warning_default():
    src = 'import logging\nlogging.basicConfig(level=logging.WARNING)\nlogging.debug("d")\nlogging.info("i")\nlogging.warning("w")\nlogging.error("e")\n'
    eq(out_of(src), "WARNING:root:w\nERROR:root:e", "output")


@check("Tpython-fund-28")
def div_py():
    src = 'import logging, sys\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")\na, b = int(sys.argv[1]), int(sys.argv[2])\nlogging.info("checking")\nif a % b == 0:\n    logging.debug(f"{b} divides {a}")\nelse:\n    logging.warning(f"{b} does not divide {a}")\n'
    eq(out_of(src, ["9", "3"], "div.py"), "INFO - checking", "output")


@check("Tpython-fund-29")
def argv_strings():
    eq(out_of("import sys\nprint(sys.argv[1] + sys.argv[2])\nprint(int(sys.argv[1]) + int(sys.argv[2]))\n", ["2", "3"], "add.py"), "23\n5", "output")
    eq(out_of("import sys\nprint(sys.argv[1] + sys.argv[2])\n", ["4", "5"], "run.py"), "45", "quiz")


@check("Tpython-fund-30")
def error_level():
    eq(out_of('import logging\nlogging.basicConfig(level=logging.ERROR)\nlogging.warning("w")\nlogging.error("e")\n'), "ERROR:root:e", "output")


@check("Tpython-fund-31")
def warning_count():
    eq(len(out_of(LEVELS % "logging.basicConfig(level=logging.WARNING)").split("\n")), 3, "lines")


@check("Tpython-fund-32")
def colon_format():
    eq(out_of("import logging\nlogging.basicConfig(format='%(levelname)s:%(message)s')\nlogging.warning('Saved')\n"), "WARNING:Saved", "output")


@check("Tpython-fund-33")
def tag_bold():
    eq(out_of('def tag(func):\n    def wrapper(s):\n        return "<b>" + func(s) + "</b>"\n    return wrapper\n\n@tag\ndef name(s):\n    return s.title()\n\nprint(name("ana"))\n'), "<b>Ana</b>", "output")


@check("Tpython-fund-34")
def note_after():
    eq(out_of('def note(func):\n    def wrapper():\n        r = func()\n        print("after")\n        return r\n    return wrapper\n\n@note\ndef hi():\n    print("hi")\n    return 1\n\nprint(hi())\n'), "hi\nafter\n1", "output")


@check("Tpython-fund-35")
def evens():
    eq(out_of("def evens(func):\n    def wrapper(n):\n        return [x for x in func(n) if x % 2 == 0]\n    return wrapper\n\n@evens\ndef upto(n):\n    return list(range(1, n + 1))\n\nprint(upto(7))\n"), "[2, 4, 6]", "output")


@check("Tpython-fund-36")
def up_rev():
    eq(out_of('def up(f):\n    def w(s):\n        return f(s).upper()\n    return w\n\ndef rev(f):\n    def w(s):\n        return f(s)[::-1]\n    return w\n\n@up\n@rev\ndef echo(s):\n    return s + "!"\n\nprint(echo("ab"))\n'), "!BA", "output")


@check("Tpython-fund-37")
def no_config():
    eq(out_of('import logging\nlogging.debug("x")\nlogging.info("x")\nlogging.warning("x")\n'), "WARNING:root:x", "output")


@check("Tpython-fund-38")
def argv_list():
    eq(out_of("import sys\nprint(sys.argv)\n", ["10"], "a.py"), "['a.py', '10']", "output")


@check("Tpython-fund-39")
def debug_default():
    eq(out_of('import logging\nlogging.basicConfig(level=logging.DEBUG)\nlogging.debug("ok")\n'), "DEBUG:root:ok", "output")


@check("Tpython-fund-40")
def divisors6():
    eq(out_of("def mod(func):\n    def wrapper(n):\n        return [i for i in range(1, n + 1) if n % i == 0]\n    return wrapper\n\n@mod\ndef odds(n):\n    return [i for i in range(n) if i % 2]\n\nprint(odds(6))\n"), "[1, 2, 3, 6]", "output")


@check("Tpython-fund-41")
def times3():
    eq(out_of("def t(func):\n    def wrapper(a, b):\n        return func(a, b) * 3\n    return wrapper\n\n@t\ndef f(a, b):\n    return a + b\n\nprint(f(2, 4))\n"), "18", "output")


@check("Tpython-fund-42")
def abc():
    eq(out_of('def d(func):\n    def wrapper(x):\n        print("A")\n        return func(x)\n    return wrapper\n\n@d\ndef f(x):\n    print("B")\n    return "C"\n\nprint(f(0))\n'), "A\nB\nC", "output")


@check("Tpython-fund-43")
def info_two():
    eq(out_of('import logging\nlogging.basicConfig(level=logging.INFO)\nlogging.debug("d")\nlogging.info("i")\nlogging.warning("w")\n'), "INFO:root:i\nWARNING:root:w", "output")


@check("Tpython-fund-44")
def floor_div():
    eq(out_of("import sys\na, b = int(sys.argv[1]), int(sys.argv[2])\nprint(a // b)\n", ["7", "2"], "c.py"), "3", "output")


# ================= PYQs (bank code, verbatim)
PYQ_OUT = {"640653586798": "[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]", "640653690118": "[1, 2, 7, 14]",
           "640653771140": "Before function execution\nAfter function execution\nHello, Ram!",
           "640653856985": "[40.5, 12.5, 24.5, 0.5, 8.0, 2.0]", "6406531173003": "[0, 1, 8, 9, 64]",
           "6406531325144": "9", "6406532035114": "11",
           "6406532180399": "Function execution started\n('Data retrieved', 'Data retrieved')"}


def _pyq(qid, n):
    @check("Tpython-fund-%02d" % n)
    def f():
        eq(out_of(CODE[qid][0]), PYQ_OUT[qid], qid)
    return f


for _i, _q in enumerate(PYQ_OUT):
    _pyq(_q, 45 + _i)   # 45..52


@check("Tpython-fund-53")
def pyq_640653771142():
    eq(out_of(CODE["640653771142"][0], ["25", "5"], "log.py"), "INFO - This operation checks factors", "output")


@check("Tpython-fund-54")
def pyq_640653856987():
    eq(out_of(CODE["640653856987"][0], ["debug"], "code.py"), "WARNING:This is only for testing.\nWARNING:code execution complete!", "output")


@check("Tpython-fund-55")
def pyq_640653690117():
    src = CODE["640653690117"][0]
    got = [out_of(src, a, "log.py") for a in (["12", "24"], ["0", "24"], ["15", "0"], ["0", "0"])]
    eq(got, ["", "", "CRITICAL - FATAL - Division by zero is not possible", "CRITICAL - FATAL - Division by zero is not possible"], "A-D")


# ---- transfers
@check("Tpython-fund-56")
def tr_fib5():
    eq(out_of(CODE["640653586798"][0].replace("list_num(10)", "list_num(5)")), "[0, 1, 1, 2, 3]", "output")


@check("Tpython-fund-57")
def tr_div12():
    eq(out_of(CODE["640653690118"][0].replace("print(myFunc(14))", "print(myFunc(12))")), "[1, 2, 3, 4, 6, 12]", "output")


@check("Tpython-fund-58")
def tr_sita():
    eq(out_of(CODE["640653771140"][0].replace('greet("Ram")', 'greet("Sita")')), "Before function execution\nAfter function execution\nHello, Sita!", "output")


@check("Tpython-fund-59")
def tr_swap_stack():
    src = CODE["640653856985"][0].replace("@modify\n@update\n", "@update\n@modify\n").replace("[2,4,1,7,5,9]", "[2,4]")
    eq(out_of(src), "[8.0, 2.0]", "output")


@check("Tpython-fund-60")
def tr_func3():
    eq(out_of(CODE["6406531173003"][0].replace("print(func(5))", "print(func(3))")), "[0, 1, 8]", "output")


@check("Tpython-fund-61")
def tr_foo25():
    eq(out_of(CODE["6406531325144"][0].replace("foo(5, 2)", "foo(2, 5)")), "9", "output")


@check("Tpython-fund-62")
def tr_bar07():
    eq(out_of(CODE["6406532035114"][0].replace("bar(2, 3)", "bar(0, 7)")), "5", "output")


@check("Tpython-fund-63")
def tr_lines():
    eq(len(out_of(CODE["6406532180399"][0]).split("\n")), 2, "lines")


@check("Tpython-fund-64")
def tr_25_4():
    eq(out_of(CODE["640653771142"][0], ["25", "4"], "log.py"), "INFO - This operation checks factors\nWARNING - 4 is not the factor of 25", "output")


@check("Tpython-fund-65")
def tr_info_arg():
    eq(out_of(CODE["640653856987"][0], ["info"], "code.py"), "WARNING:This is only for testing.\nINFO:This code is working as expected.\nWARNING:code execution complete!", "output")


@check("Tpython-fund-66")
def tr_negative():
    eq(out_of(CODE["640653690117"][0], ["5", "-1"], "log.py"), "CRITICAL - FATAL - Division by zero is not possible", "output")



# ================= depth upgrade (MLT pattern)
@check("Tpython-fund-67")
def wraps_keeps_name():
    src = ("import functools\ndef plain(f):\n    def wrapper(*a, **k):\n        return f(*a, **k)\n    return wrapper\n"
           "def kept(f):\n    @functools.wraps(f)\n    def wrapper(*a, **k):\n        return f(*a, **k)\n    return wrapper\n"
           "@plain\ndef greet():\n    pass\n@kept\ndef hello():\n    pass\nprint(greet.__name__, hello.__name__)\n")
    eq(out_of(src), "wrapper hello", "without wraps the name is wrapper")


@check("Tpython-fund-68")
def flask_endpoint_clash_without_wraps():
    src = ("import flask\nflask.Flask.run = lambda *a, **k: None\nfrom flask import Flask\napp = Flask(__name__)\n"
           "def login_required(f):\n    def wrapper(*a, **k):\n        return f(*a, **k)\n    return wrapper\n"
           "@app.route('/a')\n@login_required\ndef a():\n    return 'a'\n@app.route('/b')\n@login_required\ndef b():\n    return 'b'\n")
    o = out_of(src)
    eq("View function mapping is overwriting an existing endpoint function: wrapper" in o, True, "two wrapped views share the endpoint name wrapper")


@check("Tpython-fund-69")
def decorator_with_arguments():
    src = ("def repeat(n):\n    def deco(f):\n        def wrapper():\n            for _ in range(n):\n                f()\n        return wrapper\n    return deco\n"
           "@repeat(3)\ndef hi():\n    print('hi')\nhi()\n")
    eq(out_of(src), "hi\nhi\nhi", "repeat(3) builds the decorator")
    o = out_of(src.replace("@repeat(3)", "@repeat").replace("hi()\n", "print(hi.__name__)\ntry:\n    hi()\nexcept TypeError as e:\n    print('TypeError')\n"))
    eq(o, "deco\nTypeError", "without brackets hi becomes deco, which needs an argument")


@check("Tpython-fund-70")
def decorator_runs_at_definition():
    src = ("def announce(f):\n    print('decorating', f.__name__)\n    return f\n@announce\ndef a():\n    print('a runs')\nprint('defined')\na()\n")
    eq(out_of(src), "decorating a\ndefined\na runs", "the decorator body runs when def runs")


@check("Tpython-fund-71")
def counting_calls():
    src = ("def count(f):\n    def wrapper(*a):\n        wrapper.calls += 1\n        return f(*a)\n    wrapper.calls = 0\n    return wrapper\n"
           "@count\ndef sq(x):\n    return x * x\nsq(2); sq(3)\nprint(sq.calls, sq(4))\n")
    eq(out_of(src), "2 16", "state kept on the wrapper")


@check("Tpython-fund-72")
def logging_defaults():
    eq(out_of("import logging\nlogging.debug('d')\nlogging.info('i')\nlogging.warning('w')\n"), "WARNING:root:w", "default threshold WARNING, default format LEVEL:name:message")
    eq(out_of("import logging\nlogging.basicConfig(level=logging.INFO)\nlogging.basicConfig(level=logging.DEBUG)\nlogging.debug('d')\nlogging.info('i')\n"), "INFO:root:i", "a second basicConfig is ignored")
    eq(out_of("import logging\nlogging.basicConfig(format='%(levelname)s - %(message)s')\nlogging.error('e')\n"), "ERROR - e", "format string")


@check("Tpython-fund-73")
def argv_strings():
    eq(out_of("import sys\nprint(sys.argv[0], sys.argv[1] + sys.argv[2], int(sys.argv[1]) + int(sys.argv[2]))\n", args=("2", "3")), "main.py 23 5", "argv[0] is the script; arguments are strings")


@check("Tpython-fund-74")
def route_must_be_on_top():
    base = ("import flask\nfrom flask import Flask\napp = Flask(__name__)\n"
            "def login_required(f):\n    def wrapper(*a, **k):\n        return 'login first'\n    wrapper.__name__ = f.__name__\n    return wrapper\n")
    top = base + "@app.route('/x')\n@login_required\ndef x():\n    return 'secret'\nprint(app.test_client().get('/x').get_data(as_text=True))\n"
    under = base + "@login_required\n@app.route('/x')\ndef x():\n    return 'secret'\nprint(app.test_client().get('/x').get_data(as_text=True))\n"
    eq((out_of(top), out_of(under)), ("login first", "secret"), "route on top registers the wrapped view; route underneath registers the bare one")


if __name__ == "__main__":
    main()
