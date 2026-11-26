"""Checks for js/data/topic-flask-core.js: every status code, body and printed value in the lessons, worked examples,
quizzes, practice and test. Ids Tflask-core-NN. Apps run with Flask's test client in the pinned environment
(tests/requirements.txt); app.run() is replaced by a no-op so no server starts."""
import json, os, shlex, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assertlib import check, run_py, out_of, eq, main  # noqa: E402

RUNNER = r'''
import json, os, sys, flask
if ARGV:
    sys.argv = ARGV
for _p, _t in FILES.items():
    os.makedirs(os.path.dirname(_p) or ".", exist_ok=True)
    open(_p, "w").write(_t)
flask.Flask.run = lambda *a, **k: None
from flask import *
ns = {"__name__": "appmod"}
exec(compile(APP_SRC, "app.py", "exec"), ns)
app = ns["app"]
c = app.test_client()
out = []
for method, url, kw, follow in REQS:
    r = c.open(url, method=method, follow_redirects=follow, **kw)
    out.append({"status": r.status_code, "body": r.get_data(as_text=True), "location": r.headers.get("Location"), "ctype": r.content_type})
print(json.dumps(out))
'''
HEAD = "from flask import Flask, request, abort, redirect, url_for\napp = Flask(__name__)\n"


def flask(app_src, reqs, files=None, argv=None):
    """reqs: list of (method, url) or (method, url, kwargs, follow). files: {relative path: text} written first
    (templates/...). Returns list of dicts."""
    norm = [(r[0], r[1], r[2] if len(r) > 2 else {}, r[3] if len(r) > 3 else False) for r in reqs]
    src = "APP_SRC = %r\nREQS = %r\nFILES = %r\nARGV = %r\n" % (app_src, norm, files or {}, argv) + RUNNER
    o, e, rc = run_py(src)
    if rc != 0:
        raise AssertionError("app failed: " + e[-600:])
    return json.loads(o.strip().splitlines()[-1])


def st(res):
    return [r["status"] for r in res]


def bodies(res):
    return [r["body"].strip() for r in res]


def ctx(app_src, exprs):
    """Evaluate url_for expressions inside app.test_request_context(); errors are returned as their class name."""
    code = ("import flask\nflask.Flask.run=lambda *a,**k: None\nfrom flask import *\nns={'__name__':'appmod'}\nexec(%r, ns)\napp=ns['app']\n"
            "with app.test_request_context():\n" % app_src)
    for x in exprs:
        code += "    try:\n        print(%s)\n    except Exception as e:\n        print(type(e).__name__)\n" % x
    return out_of(code).split("\n")


# ---------------- lesson 1: cycle
CYCLE = HEAD + '@app.route("/")\ndef home():\n    return "Hello, MAD 1!"\n\napp.run(debug=True)\n'


@check("Tflask-core-01")
def cycle():
    r = flask(CYCLE, [("GET", "/"), ("GET", "/about")])
    eq(st(r), [200, 404], "status"); eq(r[0]["body"], "Hello, MAD 1!", "body")
    r = flask(HEAD + '@app.route("/")\ndef home():\n    return "Hi"\n', [("GET", "/about")])
    eq(st(r), [404], "diagnostic")


@check("Tflask-core-02")
def hello_case():
    src = HEAD + '@app.route("/hello")\ndef hello():\n    name = "MAD"\n    return f"<h1>Hello {name}</h1>"\n'
    r = flask(src, [("GET", "/hello"), ("GET", "/Hello")])
    eq(st(r), [200, 404], "status"); eq(r[0]["body"], "<h1>Hello MAD</h1>", "body")


@check("Tflask-core-03")
def home_case():
    eq(st(flask(HEAD + '@app.route("/home")\ndef h():\n    return "x"\n', [("GET", "/Home")])), [404], "status")


@check("Tflask-core-04")
def bold():
    r = flask(HEAD + '@app.route("/")\ndef h():\n    return "<b>Done</b>"\n', [("GET", "/")])
    eq((r[0]["body"], r[0]["ctype"]), ("<b>Done</b>", "text/html; charset=utf-8"), "html body")


# ---------------- lesson 2: routes
@check("Tflask-core-05")
def stacked():
    src = HEAD + '@app.route("/start")\n@app.route("/begin")\ndef start():\n    return "Let us begin"\n'
    r = flask(src, [("GET", "/start"), ("GET", "/begin"), ("GET", "/stop")])
    eq(st(r), [200, 200, 404], "status"); eq(bodies(r)[:2], ["Let us begin"] * 2, "body")


@check("Tflask-core-06")
def menu_slash():
    src = HEAD + '@app.route("/menu/")\ndef menu():\n    return "Menu"\n'
    r = flask(src, [("GET", "/menu"), ("GET", "/menu", {}, True), ("GET", "/menu/"), ("GET", "/menu/x")])
    eq(st(r), [308, 200, 200, 404], "status"); eq(r[0]["location"].endswith("/menu/"), True, "location"); eq(r[1]["body"], "Menu", "followed")


@check("Tflask-core-07")
def double_slash():
    r = flask(HEAD + '@app.route("/")\ndef h():\n    return "root"\n', [("GET", "//"), ("GET", "//", {}, True)])
    eq(r[0]["status"], 308, "status"); eq(r[0]["location"].rstrip("/").endswith("localhost"), True, "merged to /"); eq(r[1]["body"], "root", "followed")


BOTH = HEAD + '@app.route("/home")\ndef home1():\n    return "homepage 1"\n\n@app.route("/home/")\ndef home2():\n    return "homepage 2"\n'


@check("Tflask-core-08")
def both_forms():
    eq(bodies(flask(BOTH, [("GET", "/home"), ("GET", "/home/")])), ["homepage 1", "homepage 2"], "bodies")


@check("Tflask-core-09")
def ab():
    src = HEAD + '@app.route("/a")\n@app.route("/b")\ndef ab():\n    return "AB"\n'
    eq(st(flask(src, [("GET", u) for u in ("/a", "/b", "/ab", "/a/b")])), [200, 200, 404, 404], "status")


@check("Tflask-core-10")
def about_slash():
    eq(st(flask(HEAD + '@app.route("/about")\ndef a():\n    return "About"\n', [("GET", "/about/")])), [404], "status")


@check("Tflask-core-11")
def docs_slash():
    r = flask(HEAD + '@app.route("/docs/")\ndef docs():\n    return "Docs"\n', [("GET", "/docs"), ("GET", "/docs", {}, True)])
    eq(r[0]["status"], 308, "first"); eq((r[1]["status"], r[1]["body"]), (200, "Docs"), "followed")


# ---------------- lesson 3: converters
@check("Tflask-core-12")
def user_name():
    src = HEAD + '@app.route("/user/<name>")\ndef user(name):\n    return f"Hello, {name}!"\n'
    r = flask(src, [("GET", "/user/Ana"), ("GET", "/user/07"), ("GET", "/user/")])
    eq(st(r), [200, 200, 404], "status"); eq(bodies(r)[:2], ["Hello, Ana!", "Hello, 07!"], "bodies")


@check("Tflask-core-13")
def path_conv():
    a = flask(HEAD + '@app.route("/files/<path:p>")\ndef f(p):\n    return p\n', [("GET", "/files/a/b.txt")])
    b = flask(HEAD + '@app.route("/docs/<p>")\ndef d(p):\n    return p\n', [("GET", "/docs/a/b.txt")])
    eq((a[0]["status"], a[0]["body"], b[0]["status"]), (200, "a/b.txt", 404), "path vs default")


@check("Tflask-core-14")
def name_mismatch():
    eq(st(flask(HEAD + '@app.route("/item/<item_id>")\ndef item(id):\n    return id\n', [("GET", "/item/7")])), [500], "status")


@check("Tflask-core-15")
def int_conv():
    src = HEAD + '@app.route("/order/<int:n>")\ndef o(n):\n    return str(n)\n'
    eq(st(flask(src, [("GET", "/order/" + x) for x in ("12", "-3", "1.5", "007")])), [200, 404, 404, 200], "status")
    # hand-trace table in the lesson: /n/<int:n> and /f/<float:x>
    src2 = HEAD + '@app.route("/n/<int:n>")\ndef n(n):\n    return str(n)\n@app.route("/f/<float:x>")\ndef f(x):\n    return str(x)\n'
    eq(st(flask(src2, [("GET", u) for u in ("/n/5", "/n/-1", "/n/5.0", "/f/55", "/f/5.5")])), [200, 404, 404, 404, 200], "hand trace")


@check("Tflask-core-16")
def greet_empty():
    eq(st(flask(HEAD + '@app.route("/greet/<name>")\ndef g(name):\n    return name\n', [("GET", "/greet/")])), [404], "status")


@check("Tflask-core-17")
def float_conv():
    src = HEAD + '@app.route("/price/<float:p>")\ndef p(p):\n    return str(p)\n'
    eq(st(flask(src, [("GET", "/price/" + x) for x in ("55", "55.0", "abc", "")])), [404, 200, 404, 404], "status")


# ---------------- lesson 4: url_for
PROFILE = HEAD + '@app.route("/user/<username>")\ndef profile(username):\n    return f"{username}\'s page"\n'


@check("Tflask-core-18")
def urlfor_profile():
    eq(ctx(PROFILE, ['url_for("profile", username="Ana")', 'url_for("profile", username="Ana", tab="posts")']), ["/user/Ana", "/user/Ana?tab=posts"], "url_for")


@check("Tflask-core-19")
def urlfor_item():
    eq(ctx(HEAD + '@app.route("/item/<int:id>")\ndef item(id):\n    return str(id)\n', ['url_for("item", id=7, page=2)']), ["/item/7?page=2"], "url_for")


@check("Tflask-core-20")
def urlfor_endpoint():
    eq(ctx(HEAD + '@app.route("/home")\ndef index():\n    return "Welcome"\n', ['url_for("index")', 'url_for("home")']), ["/home", "BuildError"], "endpoint")


@check("Tflask-core-21")
def urlfor_encoding():
    eq(ctx(HEAD + '@app.route("/post")\ndef post():\n    return ""\n', ['url_for("post", q="a b")', 'url_for("post", a=1, b=2)']), ["/post?q=a+b", "/post?a=1&b=2"], "query")


@check("Tflask-core-22")
def return_urlfor():
    src = HEAD + '@app.route("/about")\ndef about():\n    return "About"\n@app.route("/go")\ndef go():\n    return url_for("about")\n'
    eq(bodies(flask(src, [("GET", "/go")])), ["/about"], "body")


@check("Tflask-core-23")
def urlfor_course():
    eq(ctx(HEAD + '@app.route("/course/<code>")\ndef course(code):\n    return code\n', ['url_for("course", code="MAD1", sem="jan")']), ["/course/MAD1?sem=jan"], "url_for")


# ---------------- lesson 5: redirects
OLDNEW = HEAD + '@app.route("/old")\ndef old():\n    return redirect(url_for("new"))\n\n@app.route("/new")\ndef new():\n    return "New page"\n'


@check("Tflask-core-24")
def old_new():
    r = flask(OLDNEW, [("GET", "/old"), ("GET", "/old", {}, True)])
    eq((r[0]["status"], r[0]["location"]), (302, "/new"), "redirect"); eq((r[1]["status"], r[1]["body"]), (200, "New page"), "followed")


GUEST = HEAD + '''@app.route("/admin")
def hello_admin():
    return "Hello Admin"

@app.route("/guest/<guest>")
def hello_guest(guest):
    return "Hello " + guest + " as Guest"

@app.route("/user/<name>")
def hello_user(name):
    if name == "admin":
        return redirect(url_for("hello_admin"))
    return redirect(url_for("hello_guest", guest=name))
'''


@check("Tflask-core-25")
def guest_bob():
    eq(bodies(flask(GUEST, [("GET", "/user/bob?x=1", {}, True)])), ["Hello bob as Guest"], "final page")


@check("Tflask-core-26")
def urlfor_function_object():
    src = HEAD + '@app.route("/signup")\ndef signup():\n    return redirect(url_for(signup))\n'
    eq(st(flask(src, [("GET", "/signup")])), [500], "status")


@check("Tflask-core-27")
def guest_admin():
    eq(bodies(flask(GUEST, [("GET", "/user/admin?guest=x", {}, True)])), ["Hello Admin"], "final page")


# ---------------- lesson 6: request data
SEARCH = 'from flask import Flask, request\n\napp = Flask(__name__)\n\n@app.route("/search")\ndef search():\n    q = request.args.get("q")\n    page = request.args.get("page", "1")\n    return q + " " + page\n'


@check("Tflask-core-28")
def search():
    r = flask(SEARCH, [("GET", "/search?q=flask&page=2"), ("GET", "/search?q=flask"), ("GET", "/search?page=2")])
    eq(st(r), [200, 200, 500], "status"); eq(bodies(r)[:2], ["flask 2", "flask 1"], "bodies")


LOGIN = HEAD + '''@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if data["uid"] == "admin" and data["pwd"] == "12345":
        return "Welcome Admin!"
    return "Invalid credentials..."
'''


@check("Tflask-core-29")
def login_json():
    body = {"uid": "admin", "pwd": "12345"}
    r = flask(LOGIN, [("POST", "/login", {"json": body}), ("GET", "/login", {"json": body}), ("GET", "/login"),
                      ("POST", "/login", {"data": "uid=admin", "content_type": "text/plain"})])
    eq(st(r), [200, 405, 405, 415], "status"); eq(r[0]["body"], "Welcome Admin!", "body")


@check("Tflask-core-30")
def argv_quoting():
    eq(shlex.split('python app.py Application Development DBMS')[2:], ["Application", "Development", "DBMS"], "unquoted")
    args = shlex.split('python app.py "Application Development" DBMS')[2:]
    eq(out_of("import sys\nprint(sys.argv[1:])\n", args, "app.py"), "['Application Development', 'DBMS']", "quoted")


@check("Tflask-core-31")
def args_missing():
    eq(st(flask(HEAD + '@app.route("/greet")\ndef greet():\n    return "Hi " + request.args["name"]\n', [("GET", "/greet")])), [400], "status")


@check("Tflask-core-32")
def args_empty():
    r = flask(HEAD + '@app.route("/u")\ndef u():\n    return repr(request.args.get("name", "Guest"))\n', [("GET", "/u?name"), ("GET", "/u")])
    eq(bodies(r), ["''", "'Guest'"], "bodies")


@check("Tflask-core-33")
def query_not_path():
    eq(st(flask(HEAD + '@app.route("/user/<id>")\ndef u(id):\n    return id\n', [("GET", "/user?id=5")])), [404], "status")


@check("Tflask-core-34")
def post_only():
    eq(st(flask(HEAD + '@app.route("/save", methods=["POST"])\ndef s():\n    return "saved"\n', [("GET", "/save")])), [405], "status")


# ---------------- lesson 7: errors
CHECKW = HEAD + '@app.route("/check/<word>")\ndef check(word):\n    if word.isalpha():\n        abort(400, "Bad Request: letters only")\n    return f"Accepted: {word}"\n'


@check("Tflask-core-35")
def abort_check():
    r = flask(CHECKW, [("GET", "/check/abc"), ("GET", "/check/ab1")])
    eq(st(r), [400, 200], "status")
    eq(("<h1>Bad Request</h1>" in r[0]["body"], "Bad Request: letters only" in r[0]["body"]), (True, True), "error page")
    eq(r[1]["body"], "Accepted: ab1", "body")


@check("Tflask-core-36")
def handler_status():
    a = flask(HEAD + '@app.errorhandler(404)\ndef e(err):\n    return "custom"\n', [("GET", "/nothing")])
    b = flask(HEAD + '@app.errorhandler(404)\ndef e(err):\n    return "custom", 404\n', [("GET", "/nothing")])
    eq([(x[0]["body"], x[0]["status"]) for x in (a, b)], [("custom", 200), ("custom", 404)], "handler")


@check("Tflask-core-37")
def method_first():
    src = HEAD + '''@app.route("/home/<string:username>", methods=["POST"])
def home(username):
    abort(404)

@app.errorhandler(404)
def e404(error):
    return "No such user"

@app.errorhandler(405)
def e405(error):
    return "Check the request method"
'''
    eq(bodies(flask(src, [("GET", "/home/user_9")])), ["Check the request method"], "body")


@check("Tflask-core-38")
def string_tests():
    got = out_of('for s in ["MAD-I", "CS2003", "101"]:\n    print(s.isalpha(), s.isalnum(), s.isnumeric(), s.isdigit())\n')
    eq(got, "False False False False\nFalse True False False\nFalse True True True", "string tests")


@check("Tflask-core-39")
def abort_407():
    eq(st(flask(HEAD + '@app.route("/proxy")\ndef proxy():\n    abort(407)\n', [("GET", "/proxy")])), [500], "status")
    o = out_of("from flask import abort\ntry:\n    abort(407)\nexcept Exception as e:\n    print(type(e).__name__, e)\n")
    eq(o, "LookupError no exception for 407", "abort(407)")
    reg = out_of("from flask import Flask\napp = Flask('a')\ntry:\n    app.errorhandler(407)(lambda e: 'x')\nexcept Exception as e:\n    print(type(e).__name__, e)\n")
    eq(reg.startswith("ValueError '407' is not a recognized HTTP error code"), True, "errorhandler(407) at load time: " + reg)


@check("Tflask-core-40")
def handler_dict():
    r = flask(HEAD + '@app.errorhandler(404)\ndef nf(e):\n    return {"message": "invalid endpoint!"}\n', [("GET", "/endpoint/a/b")])
    eq((r[0]["status"], json.loads(r[0]["body"]), r[0]["ctype"]), (200, {"message": "invalid endpoint!"}, "application/json"), "handler dict")


@check("Tflask-core-41")
def v_query():
    src = HEAD + '@app.route("/v/<int:n>")\ndef v(n):\n    if n % 2 == 0:\n        abort(400, "Even")\n    return f"Odd {n}"\n'
    eq(st(flask(src, [("GET", "/v?n=4")])), [404], "status")


@check("Tflask-core-42")
def isalnum_ids():
    src = HEAD + '@app.route("/id/<code>")\ndef id_(code):\n    if code.isalnum():\n        abort(400, "Invalid")\n    return "OK " + code\n'
    r = flask(src, [("GET", "/id/" + x) for x in ("CS2003", "MAD-I", "abc", "a_b")])
    eq(st(r), [400, 200, 400, 200], "status")


# ---------------- lesson 8: forms
SIGNUP = HEAD + '''@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return """<form method="post">
          <input name="user" required>
          <input name="pwd" type="password" minlength="8">
          <button>Join</button></form>"""
    pwd = request.form.get("pwd", "")
    if len(pwd) < 8:
        return redirect(url_for("signup"))
    return "Welcome, " + request.form.get("user") + "!"
'''


@check("Tflask-core-43")
def signup():
    r = flask(SIGNUP, [("POST", "/signup", {"data": {"user": "ana", "pwd": "abc"}}), ("POST", "/signup", {"data": {"user": "ana", "pwd": "abcdefgh"}})])
    eq((r[0]["status"], r[0]["location"]), (302, "/signup"), "short password"); eq((r[1]["status"], r[1]["body"]), (200, "Welcome, ana!"), "valid")


@check("Tflask-core-44")
def form_missing():
    src = HEAD + '@app.route("/f", methods=["POST"])\ndef f():\n    return repr(request.form.get("email"))\n@app.route("/g", methods=["POST"])\ndef g():\n    return request.form["pwd"]\n'
    r = flask(src, [("POST", "/f", {"data": {"x": "1"}}), ("POST", "/f", {"data": {"email": ""}}), ("POST", "/g", {"data": {"x": "1"}})])
    eq((r[0]["body"], r[1]["body"], r[2]["status"]), ("None", "''", 400), "form reads")


# ---------------- lesson 9: return values
@check("Tflask-core-45")
def dict_201():
    r = flask(HEAD + '@app.route("/u")\ndef u():\n    return {"user": "ana"}, 201\n', [("GET", "/u")])
    eq((r[0]["status"], r[0]["body"].strip(), r[0]["ctype"]), (201, '{"user":"ana"}', "application/json"), "response")


@check("Tflask-core-46")
def loop_return():
    src = HEAD + '''users = [{"uid": "ana", "pwd": "1"}, {"uid": "bob", "pwd": "2"}]

@app.route("/signin")
def signin():
    for u in users:
        if u["uid"] == request.args["uid"] and u["pwd"] == request.args["pwd"]:
            return "Authorized"
        else:
            return "Unauthorized"
'''
    eq(bodies(flask(src, [("GET", "/signin?uid=bob&pwd=2")])), ["Unauthorized"], "body")


@check("Tflask-core-47")
def none_return():
    eq(st(flask(HEAD + '@app.route("/s")\ndef s():\n    print("saved")\n', [("GET", "/s")])), [500], "status")


@check("Tflask-core-48")
def return_types():
    src = HEAD + '@app.route("/a")\ndef a():\n    return ["x", "y"]\n\n@app.route("/b")\ndef b():\n    return "Created", 201\n\n@app.route("/c")\ndef c():\n    print("done")\n'
    r = flask(src, [("GET", "/a"), ("GET", "/b"), ("GET", "/c")])
    eq(st(r), [200, 201, 500], "status"); eq((r[0]["body"].strip(), r[0]["ctype"], r[1]["body"]), ('["x","y"]', "application/json", "Created"), "bodies")


# ---------------- practice
@check("Tflask-core-49")
def p_index():
    src = HEAD + '@app.route("/")\n@app.route("/index")\ndef index():\n    return "Home"\n\n@app.route("/help")\ndef help_page():\n    return "Help"\n'
    r = flask(src, [("GET", u) for u in ("/", "/index", "/help", "/home")])
    eq([(x["status"], x["body"].strip()[:4]) for x in r][:3], [(200, "Home"), (200, "Home"), (200, "Help")], "pages"); eq(r[3]["status"], 404, "/home")


@check("Tflask-core-50")
def p_shop():
    src = HEAD + '@app.route("/shop/")\ndef shop():\n    return "Shop"\n@app.route("/cart")\ndef cart():\n    return "Cart"\n'
    r = flask(src, [("GET", "/shop", {}, True), ("GET", "/cart/", {}, True)])
    eq((r[0]["body"], r[1]["status"]), ("Shop", 404), "results")


@check("Tflask-core-51")
def p_chain():
    src = HEAD + '@app.route("/a")\ndef a():\n    return redirect(url_for("b"))\n\n@app.route("/b")\ndef b():\n    return redirect(url_for("c", x=1))\n\n@app.route("/c")\ndef c():\n    return "C got " + request.args.get("x", "none")\n'
    eq(bodies(flask(src, [("GET", "/a", {}, True)])), ["C got 1"], "final")


@check("Tflask-core-52")
def p_methods():
    src = HEAD + '@app.route("/item", methods=["GET", "POST"])\ndef item():\n    return request.method\n'
    eq(st(flask(src, [(m, "/item") for m in ("GET", "POST", "DELETE", "PUT")])), [200, 200, 405, 405], "status")


@check("Tflask-core-53")
def p_true():
    eq(bodies(flask(HEAD + '@app.route("/")\ndef h():\n    return {"ok": True}\n', [("GET", "/")])), ['{"ok":true}'], "json")


@check("Tflask-core-54")
def p_int_return():
    eq(st(flask(HEAD + '@app.route("/sum/<int:a>/<int:b>")\ndef s(a, b):\n    return a + b\n', [("GET", "/sum/2/3")])), [500], "status")


@check("Tflask-core-55")
def p_410():
    eq(st(flask(HEAD + '@app.route("/")\ndef h():\n    return ("Gone", 410)\n', [("GET", "/")])), [410], "status")


@check("Tflask-core-56")
def p_wiki():
    eq(bodies(flask(HEAD + '@app.route("/wiki/<path:page>")\ndef w(page):\n    return page.upper()\n', [("GET", "/wiki/a/b")])), ["A/B"], "body")


@check("Tflask-core-57")
def p_sq():
    src = HEAD + '@app.route("/sq")\ndef sq():\n    n = request.args["n"]\n    return str(int(n) * int(n))\n'
    r = flask(src, [("GET", "/sq?n=12"), ("GET", "/sq")])
    eq((r[0]["body"], r[1]["status"]), ("144", 400), "results")


# ---------------- topic test
@check("Tflask-core-58")
def t_book():
    src = HEAD + '@app.route("/book/<title>")\ndef b(title):\n    return title\n'
    eq(st(flask(src, [("GET", u) for u in ("/book/", "/book?title=Dune", "/book/Dune", "/book/Dune/2")])), [404, 404, 200, 404], "status")


@check("Tflask-core-59")
def t_urlfor():
    eq(ctx(HEAD + '@app.route("/p/<int:pid>")\ndef post(pid):\n    return ""\n', ['url_for("post", pid=3, ref="mail")']), ["/p/3?ref=mail"], "url_for")


@check("Tflask-core-60")
def t_get_json():
    eq(st(flask(HEAD + '@app.route("/add", methods=["POST"])\ndef add():\n    return "x"\n', [("GET", "/add", {"json": {"a": 1}})])), [405], "status")


@check("Tflask-core-61")
def t_handler_tuple():
    r = flask(HEAD + '@app.errorhandler(404)\ndef e(err):\n    return "Oops", 404\n', [("GET", "/x")])
    eq((r[0]["body"], r[0]["status"]), ("Oops", 404), "response")


@check("Tflask-core-62")
def t_403():
    src = HEAD + '@app.route("/age/<int:a>")\ndef age(a):\n    if a < 18:\n        abort(403)\n    return "Welcome"\n'
    eq(st(flask(src, [("GET", "/age/15")])), [403], "status")


@check("Tflask-core-63")
def t_redirect():
    src = HEAD + '@app.route("/")\ndef h():\n    return redirect("/login")\n@app.route("/login")\ndef login():\n    return "Please log in"\n'
    r = flask(src, [("GET", "/"), ("GET", "/", {}, True)])
    eq((r[0]["status"], r[1]["body"]), (302, "Please log in"), "redirect")


@check("Tflask-core-64")
def t_course():
    src = HEAD + '@app.route("/course/<name>")\ndef course(name):\n    return name + " " + request.args.get("id", "?")\n'
    r = flask(src, [("GET", u) for u in ("/course/MAD?id=7", "/course?name=MAD&id=7", "/course/MAD", "/MAD?id=7")])
    eq(st(r), [200, 404, 200, 404], "status"); eq((r[0]["body"], r[2]["body"]), ("MAD 7", "MAD ?"), "bodies")



# ================= part 2: PYQs routing-urlfor (12) and forms-validation (3); code from the bank, verbatim
import subprocess  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))


def placeholder(qid, expr):
    """Run a PYQ whose code has '#== print statement ==#' with expr substituted; errors print their class name."""
    src = CODE[qid][0].replace("    #== print statement ==#", "    try:\n        print(%s)\n    except Exception as e:\n        print(type(e).__name__)" % expr)
    return out_of(src)


def render(html, expr):
    with open(os.path.join(HERE, "_render_tmp.html"), "w") as f:
        f.write(html)
    try:
        o = subprocess.run(["node", os.path.join(HERE, "render_html.js"), os.path.join(HERE, "_render_tmp.html"), expr], capture_output=True, text=True, timeout=60).stdout
    finally:
        os.remove(os.path.join(HERE, "_render_tmp.html"))
    return json.loads(o)


@check("Tflask-core-65")
def pyq_640653586796():
    r = flask(CODE["640653586796"][0], [("GET", "/home"), ("GET", "/work")])
    eq(st(r), [200, 200], "both endpoints"); eq(r[0]["body"], "<h1>Hello! Reporting for my task</h1>", "body")


@check("Tflask-core-66")
def pyq_640653771135():
    eq(st(flask(CODE["640653771135"][0], [("GET", "/greet/")])), [404], "status")


@check("Tflask-core-67")
def pyq_640653351985():
    app, tpl = CODE["640653351985"]
    files = {"templates/index.html": tpl}
    r = flask(app, [("GET", "/XYZ/"), ("GET", "/second_index"), ("GET", "/ABC/"), ("GET", "/first_index/XYZ"), ("GET", "/first_index/ABC")], files)
    eq((r[0]["status"], r[0]["body"]), (200, "Hi XYZ! This is your home page."), "A: /XYZ/")
    eq('href="/ABC/"' in r[1]["body"], True, "B: Go back link points to /ABC/")
    eq(r[2]["body"], "Hi ABC! This is your home page.", "B: page behind the link")
    eq((r[3]["status"], r[3]["location"]), (302, "/XYZ/"), "C: /first_index/XYZ")
    eq((r[4]["status"], r[4]["location"]), (302, "/second_index"), "D: /first_index/ABC")


@check("Tflask-core-68")
def pyq_640653586804():
    got = [placeholder("640653586804", e) for e in ("url_for('home')", "url_for('profile', username='Harry')", "url_for('profile', username='Harry', next='course')", "url_for('index', username='Harry')")]
    eq(got, ["BuildError", "/user/Harry", "/user/Harry?next=course", "/home?username=Harry"], "outputs")


@check("Tflask-core-69")
def pyq_640653690103():
    got = [placeholder("640653690103", e) for e in ("url_for('index')", "url_for('profile', student_name='John', student_id= 101)", "url_for('profile', student_name='John', student_id=101)")]
    eq(got, ["/home", "/student/John/101", "/student/John/101"], "outputs")


@check("Tflask-core-70")
def pyq_6406531021283():
    r = flask(CODE["6406531021283"][0], [("GET", "/"), ("GET", "/numbers/5"), ("GET", "/7")])
    eq(bodies(r)[:2], ["0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10", "0, 1, 2, 3, 4, 5"], "A, B"); eq(r[2]["status"], 404, "C/D: /7")


@check("Tflask-core-71")
def pyq_6406531173010():
    r = flask(CODE["6406531173010"][0], [("GET", u) for u in ("/user/2001", "/user/id=2001", "/id=2001", "/2001")])
    eq(st(r), [200, 200, 404, 404], "status"); eq(r[1]["body"], "User Id : id=2001", "B body")


@check("Tflask-core-72")
def pyq_6406531173013():
    r = flask(CODE["6406531173013"][0], [("GET", u) for u in ("/user/John", "/user/07", "/profile/10", "/user/")])
    eq(st(r), [200, 200, 200, 404], "status"); eq(bodies(r)[:3], ["Hello, John!", "Hello, 07!", "User Profile ID: 10"], "bodies")


@check("Tflask-core-73")
def pyq_6406531173015():
    r = flask(CODE["6406531173015"][0], [("GET", "/choice/for"), ("GET", "/choice/if")])
    eq(bodies(r), ["/for", "/if"], "bodies")


@check("Tflask-core-74")
def pyq_6406532035113():
    res = []
    for rule in ('"/user/id"', '"/user/<int:id>"', '"/user/<id>"', '"/user/<float:id>"'):
        arg = "id" if "<" in rule else ""
        res.append(flask(HEAD + "@app.route(%s)\ndef u(%s):\n    return 'ok'\n" % (rule, arg), [("GET", "/user/55")])[0]["status"])
    eq(res, [404, 200, 200, 404], "A-D")


@check("Tflask-core-75")
def pyq_6406532035120():
    r = flask(CODE["6406532035120"][0], [("GET", u) for u in ("/user/IITM", "/user/101", "/user/10/greet", "/user", "/user/BS?id=101")])
    eq(st(r), [200, 200, 404, 404, 200], "status"); eq(r[4]["body"], "<p>Welcome BS</p>", "E body")


@check("Tflask-core-76")
def pyq_640653586809():
    r = flask(CODE["640653586809"][0], [("GET", "/user/admin?guest=appdev1"), ("GET", "/user/admin?guest=appdev1", {}, True)])
    eq((r[0]["status"], r[0]["location"]), (302, "/admin"), "redirect"); eq(r[1]["body"], "Hello Admin", "final (bank key: Hello Admin)")


FORM_HEAD = "from flask import Flask, request, redirect, url_for, render_template\napp = Flask(__name__)\n"


@check("Tflask-core-77")
def pyq_640653586802():
    app = FORM_HEAD + CODE["640653586802"][0]
    r = flask(app, [("GET", "/signup"), ("POST", "/signup", {"data": {"username": "ana", "password": "abcdefgh"}}), ("POST", "/signup", {"data": {"username": "ana", "password": "abc"}})])
    eq((r[0]["status"], "required minlength=\"8\"" in r[0]["body"]), (200, True), "GET returns the form with HTML5 attributes")
    eq(r[1]["body"], "<h1>Welcome, ana!</h1>", "valid POST")
    eq(r[2]["status"], 500, "short password: url_for(signup) gets a function, not a name, so the redirect fails")


@check("Tflask-core-78")
def pyq_640653690116():
    app = FORM_HEAD + CODE["640653690116"][0]
    r = flask(app, [("GET", "/add"), ("POST", "/add", {"data": {"name": "", "category": "x"}}), ("POST", "/add", {"data": {"name": "Pen", "category": "Stationery"}})])
    eq(('minlength="2"' in r[0]["body"], "required" in r[0]["body"]), (True, True), "frontend attributes")
    eq((r[1]["status"], r[1]["location"]), (302, "/add"), "backend check redirects"); eq(r[2]["body"], "Product Pen is added in Stationery category.", "valid")


@check("Tflask-core-79")
def pyq_6406531021280():
    html, route = CODE["6406531021280"]
    app = FORM_HEAD + route
    r = flask(app, [("POST", "/submit_form", {"data": {"e-mail": "a@b.c"}}), ("POST", "/submit_form", {"data": {"e-mail": "abc"}})], {"templates/form.html": html})
    eq(r[0]["body"], "Form is validated", "backend accepts @"); eq("<form" in r[1]["body"], True, "backend rejects: form again")
    v = render(html, "[getComputedStyle(document.querySelector('input')).borderTopColor, document.querySelector('input').matches(':invalid')]")
    eq(v, ["rgb(118, 118, 118)", True], "blank required input is :invalid, so the :valid red border does not apply")


# ---- transfer questions of part 2
@check("Tflask-core-80")
def tr_work_case():
    eq(st(flask(CODE["640653586796"][0], [("GET", "/Work")])), [404], "status")


@check("Tflask-core-81")
def tr_greet_slash():
    eq(st(flask(CODE["640653771135"][0], [("GET", "/greet/Ravi/"), ("GET", "/greet/Ravi")])), [404, 200], "status")


@check("Tflask-core-82")
def tr_first_index_abc():
    app, tpl = CODE["640653351985"]
    r = flask(app, [("GET", "/first_index/abc", {}, True)], {"templates/index.html": tpl})
    eq("You are on the incorrect page." in r[0]["body"], True, "final page")


@check("Tflask-core-83")
def tr_urlfor_page():
    eq(placeholder("640653586804", "url_for('profile', username='Harry', page=2)"), "/user/Harry?page=2", "url_for")


@check("Tflask-core-84")
def tr_student_year():
    eq(placeholder("640653690103", "url_for('profile', student_name='Asha', student_id=7, year=2)"), "/student/Asha/7?year=2", "url_for")


@check("Tflask-core-85")
def tr_numbers_3():
    r = flask(CODE["6406531021283"][0], [("GET", "/numbers/3"), ("GET", "/numbers/-2")])
    eq((r[0]["body"], r[1]["status"]), ("0, 1, 2, 3", 404), "results")


@check("Tflask-core-86")
def tr_user_slash():
    eq(st(flask(CODE["6406531173010"][0], [("GET", "/user/7/")])), [404], "status")


@check("Tflask-core-87")
def tr_profile_abc():
    eq(st(flask(CODE["6406531173013"][0], [("GET", "/profile/abc")])), [404], "status")


@check("Tflask-core-88")
def tr_choice_while():
    eq(st(flask(CODE["6406531173015"][0], [("GET", "/choice/while")])), [500], "status")


@check("Tflask-core-89")
def tr_user_float():
    res = []
    for rule in ('"/user/<int:id>"', '"/user/<float:id>"', '"/user/<id>"', '"/user/<path:id>"'):
        res.append(flask(HEAD + "@app.route(%s)\ndef u(id):\n    return 'ok'\n" % rule, [("GET", "/user/5.5")])[0]["status"])
    eq(res, [404, 200, 200, 200], "A-D")


@check("Tflask-core-90")
def tr_user_iitm_slash():
    eq(st(flask(CODE["6406532035120"][0], [("GET", "/user/IITM/")])), [404], "status")


@check("Tflask-core-91")
def tr_guest_ravi():
    eq(bodies(flask(CODE["640653586809"][0], [("GET", "/user/Ravi?guest=x", {}, True)])), ["Hello Ravi as Guest"], "final")


@check("Tflask-core-92")
def tr_signup_short():
    r = flask(FORM_HEAD + CODE["640653586802"][0], [("POST", "/signup", {"data": {"username": "ana", "password": "abc"}})])
    eq(r[0]["status"], 500, "status")


@check("Tflask-core-93")
def tr_add_empty():
    r = flask(FORM_HEAD + CODE["640653690116"][0], [("POST", "/add", {"data": {"name": "", "category": "Toys"}})])
    eq((r[0]["status"], r[0]["location"]), (302, "/add"), "redirect")


@check("Tflask-core-94")
def tr_invalid_red():
    html = CODE["6406531021280"][0].replace("input:valid {border: 2px solid red;}", "input:invalid {border: 2px solid red;}")
    eq(render(html, "getComputedStyle(document.querySelector('input')).borderTopColor"), "rgb(255, 0, 0)", "blank field red")


# ================= part 3: PYQs request-params (14, two comprehension sets)
PARENT_COURSE = CODE["parent:640653856973"][0]
PARENT_USERS = CODE["parent:640653856980"][0]


@check("Tflask-core-95")
def pyq_640653586806():
    app = "from flask import Flask, request\napp = Flask(__name__)\n" + CODE["640653586806"][0]
    r = flask(app, [("GET", u) for u in ("/student/Electrical/Diploma/MAD1", "/Electrical/Diploma/MAD1", "/student?dept=Electrical&level=Diploma&course=MAD1", "/?endpoint=student&dept=Electrical&level=Diploma&course=MAD1")])
    eq(st(r), [404, 404, 200, 404], "status"); eq(json.loads(r[2]["body"]), {"Department": "Electrical", "Course-level": "Diploma", "Course": "MAD1"}, "C body")


@check("Tflask-core-96")
def pyq_6406531173005():
    r = flask(CODE["6406531173005"][0], [("GET", u) for u in ("/response/n=6", "/response/", "/response&n=6", "/response?n=6")])
    eq(st(r), [404, 404, 404, 200], "status")
    eq(r[3]["body"], "even : 1\nodd : 2\neven : 3\nodd : 4\neven : 5\nodd : 6\n", "D body (is_odd really tests for even)")


@check("Tflask-core-97")
def pyq_6406531325146():
    eq(bodies(flask(CODE["6406531325146"][0], [("GET", "/signin?uid=professor&pwd=54321")])), ["You are unauthorized!!"], "body")


@check("Tflask-core-98")
def pyq_6406532035112():
    eq(bodies(flask(CODE["6406532035112"][0], [("GET", "/welcome?user=Alice&role=ADMIN")])), ["Hello ALICE! Your role is admin."], "body")


@check("Tflask-core-99")
def pyq_640653586810():
    r = flask(CODE["640653586810"][0], [("GET", u) for u in ("/?num=abc", "/?num=", "/?num=12")])
    eq(bodies(r), ["<html><body><h1>Enter a valid number</h1></body></html>", "<html><body> <h1>Invalid number</h1></body></html>", "<html><body> <h1>The output is 144</h1></body></html>"], "bodies")


@check("Tflask-core-100")
def pyq_640653771130():
    r = flask(CODE["640653771130"][0], [("GET", u) for u in ("/?uname=MAD-II", "/process", "/process?uname", "/process?uname=101MU")])
    eq(st(r), [404, 200, 200, 200], "status")
    eq(bodies(r)[1:], ["<h1>Valid Username: MAD-I</h1>", "<h1>Valid Username: </h1>", "<h1>Valid Username: 101MU</h1>"], "bodies")


@check("Tflask-core-101")
def pyq_640653771131():
    r = flask(CODE["640653771131"][0], [("GET", u) for u in ("/MAD-I?id=CS2003", "/course/Java?id=CS2005", "/course?course_name=MAD-II&id=CS2004", "/course/MAD-II?id=CS2003")])
    eq(st(r), [404, 200, 404, 400], "status"); eq(r[1]["body"], "<h1>The Course ID for Java is: CS2005</h1>", "B")
    eq("Bad Request: Invalid data" in r[3]["body"], True, "D message")


@check("Tflask-core-102")
def pyq_640653856972():
    r = flask(CODE["640653856972"][0], [("GET", u) for u in ("/home?method=GET", "/home?method=POST", "/home")])
    eq(st(r), [200, 200, 200], "status"); eq(r[2]["body"], "Invalid Method", "C/D")
    probe = "(function(){var n=[...document.body.querySelectorAll('p,span')].find(function(x){return x.textContent==='MADRAS'});var g=document.createRange();g.selectNodeContents(n);var b=g.getBoundingClientRect();return [Math.round(b.top),Math.round(b.left),Math.round(b.width),getComputedStyle(n).color,getComputedStyle(n).fontWeight]})()"
    eq(render(r[0]["body"], probe), render(r[1]["body"], probe), "MADRAS drawn at the same place, size, colour and weight")


@check("Tflask-core-103")
def pyq_6406531021275():
    r = flask(CODE["6406531021275"][0], [("GET", u) for u in ("/PDSA?id=CS2003", "/course/Java?id=CS2005", "/course?course_name=DBMS&id=CS2004", "/course/DBMS?id=CS2003")])
    eq(st(r), [404, 200, 404, 400], "status")


@check("Tflask-core-104")
def pyq_6406532035121():
    bad = {"uid": "admin", "pwd": "xyz"}; good = {"uid": "admin", "pwd": "12345"}
    r = flask(CODE["6406532035121"][0], [("POST", "/login", {"json": bad}), ("GET", "/login", {"json": bad}), ("GET", "/login"), ("POST", "/login", {"json": good}), ("POST", "/login", {"json": good})])
    eq(st(r), [200, 405, 405, 200, 200], "A-E (curl --json without -X is POST)"); eq((r[0]["body"], r[3]["body"]), ("Invalid credentials...", "Welcome Admin!"), "bodies")


@check("Tflask-core-105")
def curl_json_is_post():
    eq(subprocess.run(["curl", "--version"], capture_output=True, text=True).returncode, 0, "curl present")
    o = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{method}", "--json", '{"a":1}', "http://127.0.0.1:9/"], capture_output=True, text=True).stdout
    eq(o, "POST", "curl --json uses POST")
    o = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{method}", "-X", "GET", "--json", '{"a":1}', "http://127.0.0.1:9/"], capture_output=True, text=True).stdout
    eq(o, "GET", "-X GET overrides")


@check("Tflask-core-106")
def pyq_640653856975():
    argv = ["app.py"] + shlex.split("Application Development DBMS")
    r = flask(PARENT_COURSE, [("GET", "/?course=DBMS"), ("GET", "/course?course=DBMS")], argv=argv)
    eq(r[0]["status"], 404, "URL has no /course path: Not Found"); eq(r[1]["body"], "Welcome to DBMS!", "with the /course path it would be")


@check("Tflask-core-107")
def pyq_640653856974():
    res = []
    for cmd, url in (("Application Development Java", "/course?course=Java"), ("Application Development Java", "/course=Application Development"),
                     ('"Application Development" Java', "/course?course=Java"), ('"Application Development" DBMS', "/course?course=Application%20Development")):
        r = flask(PARENT_COURSE, [("GET", url)], argv=["app.py"] + shlex.split(cmd))[0]
        res.append(r["body"] if r["status"] == 200 else r["status"])
    eq(res, ["Welcome to Java!", 404, "Welcome to Application Development!", "Welcome to Application Development!"], "A-D")


@check("Tflask-core-108")
def pyq_640653856982():
    r = flask(PARENT_USERS, [("GET", u) for u in ("/104", "/user/104", "/?id=104", "/user?id=104")])
    eq(st(r), [404, 200, 404, 200], "status")
    eq(json.loads(r[3]["body"]), {"id": "104", "name": "Robert", "city": "Delhi"}, "D comes from get_user")


@check("Tflask-core-109")
def pyq_640653856981():
    r = flask(PARENT_USERS, [("GET", u) for u in ("/103", "/user/103", "/?id=103", "/user?id=103")])
    eq(st(r), [404, 200, 404, 200], "status"); eq(json.loads(r[1]["body"])["name"], "Rahim", "user 103")


# ---- transfers of part 3
@check("Tflask-core-110")
def tr_student_missing():
    app = "from flask import Flask, request\napp = Flask(__name__)\n" + CODE["640653586806"][0]
    eq(st(flask(app, [("GET", "/student?dept=Electrical&level=Diploma")])), [400], "missing course")


@check("Tflask-core-111")
def tr_response_3():
    eq(bodies(flask(CODE["6406531173005"][0], [("GET", "/response?n=3")])), ["even : 1\nodd : 2\neven : 3"], "body")


@check("Tflask-core-112")
def tr_signin_student():
    eq(bodies(flask(CODE["6406531325146"][0], [("GET", "/signin?uid=student&pwd=12345")])), ["You are authorized!!"], "body")


@check("Tflask-core-113")
def tr_welcome_default():
    eq(bodies(flask(CODE["6406532035112"][0], [("GET", "/welcome")])), ["Hello GUEST! Your role is member."], "body")


@check("Tflask-core-114")
def tr_num_missing():
    eq(st(flask(CODE["640653586810"][0], [("GET", "/")])), [400], "status")


@check("Tflask-core-115")
def tr_uname_digits():
    r = flask(CODE["640653771130"][0], [("GET", "/process?uname=2024")])
    eq((r[0]["status"], "Bad Request: Numeric username provided" in r[0]["body"]), (400, True), "abort")


@check("Tflask-core-116")
def tr_course_noid():
    eq(st(flask(CODE["640653771131"][0], [("GET", "/course/Java")])), [400], "status")


@check("Tflask-core-117")
def tr_home_get_lower():
    eq(bodies(flask(CODE["640653856972"][0], [("GET", "/home?method=get")])), ["Invalid Method"], "case-sensitive comparison")


@check("Tflask-core-118")
def tr_login_put():
    eq(st(flask(CODE["6406532035121"][0], [("PUT", "/login", {"json": {"uid": "admin", "pwd": "12345"}})])), [405], "status")


@check("Tflask-core-119")
def tr_argv_java_dbms():
    r = flask(PARENT_COURSE, [("GET", "/course?course=DBMS")], argv=["app.py", "Java", "DBMS"])
    eq(r[0]["body"], "Welcome to Java!", "argv[1] wins")


@check("Tflask-core-120")
def tr_user_999():
    eq(st(flask(PARENT_USERS, [("GET", "/user/999")])), [500], "None from the view")


@check("Tflask-core-121")
def tr_java_lower():
    eq(st(flask(CODE["6406531021275"][0], [("GET", "/course/java?id=CS2005")])), [400], "status")


# ================= part 4: PYQs error-handling (10)
@check("Tflask-core-122")
def pyq_640653586805():
    r = flask(CODE["640653586805"][0], [("GET", "//"), ("GET", "//", {}, True)])
    eq((r[0]["status"], r[0]["location"].rstrip("/").endswith("localhost")), (308, True), "// is merged to / (Werkzeug 3.1)")
    eq((r[1]["status"], r[1]["body"]), (200, "This is generate1"), "browser ends on generate1")


@check("Tflask-core-123")
def pyq_640653690119():
    r = flask(CODE["640653690119"][0], [("GET", "/home/user_4"), ("POST", "/home/user_4"), ("POST", "/home/admin")])
    eq([(x["status"], x["body"]) for x in r], [(200, "<h1>Please check the web request.</h1>"), (200, "<h1>The user you are looking for is invalid.</h1>"), (200, "<h1>Hello admin, Welcome!</h1>")], "GET hits 405 first")


@check("Tflask-core-124")
def pyq_640653771128():
    eq(bodies(flask(CODE["640653771128"][0], [("GET", "/home/"), ("GET", "/home")])), ["This is homepage 2", "This is homepage 1"], "bodies")


@check("Tflask-core-125")
def pyq_6406531325148():
    o, e, rc = run_py("import flask\nflask.Flask.run = lambda *a, **k: None\n" + CODE["6406531325148"][0])
    eq((rc != 0, "ValueError: '407' is not a recognized HTTP error code" in e), (True, True), "app fails while loading")
    fixed = CODE["6406531325148"][0].replace("@app.errorhandler (407)\ndef user_error_4(error):\n    return \"<h1>Proxy authentication required.</h1>\"\n", "")
    eq(("@app.errorhandler (407)" in CODE["6406531325148"][0], "errorhandler (407)" in fixed), (True, False), "407 handler removed")
    eq(bodies(flask(fixed, [("GET", "/home/user_4")])), ["<h1>Please check the web request.</h1>"], "without that handler: 405 handler for a browser GET")


@check("Tflask-core-126")
def pyq_640653690105():
    r = flask(CODE["640653690105"][0], [("GET", "/MAD1?uname=102"), ("GET", "/102?uname=MAD1")])
    eq((r[0]["status"], r[0]["body"]), (200, "<h1>Good Username</h1>"), "MAD1"); eq((r[1]["status"], "<p>Bad Request</p>" in r[1]["body"]), (400, True), "102")


@check("Tflask-core-127")
def pyq_640653771129():
    r = flask(CODE["640653771129"][0], [("GET", u) for u in ("/validate/4", "/validate?number=5", "/validate/5")])
    eq(st(r), [400, 404, 200], "status"); eq(("Bad Request: Invalid number provided" in r[0]["body"], r[2]["body"]), (True, "<h1>Valid Number: 5</h1>"), "bodies")


@check("Tflask-core-128")
def pyq_640653856977():
    r = flask(CODE["640653856977"][0], [("GET", u) for u in ("/login?id=MAD-I", "/login/", "/login/CS2003", "/login/PDSA")])
    eq(st(r), [404, 404, 200, 400], "status"); eq(r[2]["body"], "<h1>Your ID is: CS2003</h1>", "C")


@check("Tflask-core-129")
def pyq_6406531021273():
    r = flask(CODE["6406531021273"][0], [("GET", u) for u in ("/login?id=MAD-I", "/login/", "/login/CS2003", "/login/PDSA")])
    eq(st(r), [404, 404, 400, 400], "status"); eq("Not Found" in r[0]["body"], True, "A shows Not Found")


@check("Tflask-core-130")
def pyq_6406531173011():
    r = flask(CODE["6406531173011"][0], [("GET", "/endpoint/user1/developer"), ("GET", "/endpoint/user1")])
    eq((r[0]["status"], json.loads(r[0]["body"])), (200, {"message": "invalid endpoint!"}), "404 handler output with status 200")
    eq((r[1]["status"], json.loads(r[1]["body"])), (200, {"username": "user1"}), "one segment works")


@check("Tflask-core-131")
def pyq_6406532180392():
    r = flask(CODE["6406532180392"][0], [("GET", u, {}, True) for u in ("/learn/web/Python?level=advanced", "/course/ML/Python?topic=NLP", "/learn/basics/Python?level=beginner", "/course/Java/React?type=Framework")])
    eq(bodies(r), ["Welcome to Python course!", "Welcome to Python course!", "Welcome to Python course!", "<h2>Course not available!</h2>"], "bodies")
    first = flask(CODE["6406532180392"][0], [("GET", "/learn/web/Python?level=advanced")])[0]
    eq((first["status"], first["location"]), (302, "/course/web/Python"), "A redirects, query dropped")


# ---- transfers of part 4
@check("Tflask-core-132")
def tr_generate_triple():
    r = flask(CODE["640653586805"][0], [("GET", "/x"), ("GET", "///", {}, True)])
    eq((r[0]["status"], r[0]["body"], r[1]["body"]), (200, "page not found", "This is generate1"), "handler 200; /// merged")


@check("Tflask-core-133")
def tr_post_user1():
    eq(bodies(flask(CODE["640653690119"][0], [("POST", "/home/user_1")])), ["<h1>Hello user_1, Welcome!</h1>"], "body")


@check("Tflask-core-134")
def tr_homepage_other():
    r = flask(CODE["640653771128"][0], [("GET", "/home//"), ("GET", "/homes")])
    eq(r[1]["body"], "page not found", "/homes handled by 404 handler")


@check("Tflask-core-135")
def tr_uname_digit_inside():
    eq(bodies(flask(CODE["640653690105"][0], [("GET", "/a1")])), ["<h1>Good Username</h1>"], "only the first character is tested")


@check("Tflask-core-136")
def tr_validate_10():
    r = flask(CODE["640653771129"][0], [("GET", "/validate/10")])
    eq(r[0]["status"], 400, "10 % 2 == 0 and 10 % 3 == 1")


@check("Tflask-core-137")
def tr_login_hyphen():
    eq(bodies(flask(CODE["640653856977"][0], [("GET", "/login/MAD-I")])), ["<h1>Your ID is: MAD-I</h1>"], "hyphen is not a letter")


@check("Tflask-core-138")
def tr_login_alnum_hyphen():
    eq(bodies(flask(CODE["6406531021273"][0], [("GET", "/login/MAD-I")])), ["<h1>Your ID is: MAD-I</h1>"], "isalnum False")


@check("Tflask-core-139")
def tr_endpoint_status():
    fixed = CODE["6406531173011"][0].replace('"message": "invalid endpoint!"\n    }', '"message": "invalid endpoint!"\n    }, 404')
    eq(flask(fixed, [("GET", "/endpoint/a/b")])[0]["status"], 404, "status with the tuple")


@check("Tflask-core-140")
def tr_learn_java():
    eq(bodies(flask(CODE["6406532180392"][0], [("GET", "/learn/Java", {}, True)])), ["<h2>Course not available!</h2>"], "body")


# ---------------- depth upgrade (MLT pattern): one check per new claim
@check("Tflask-core-141")
def auto_methods():
    r = flask(HEAD + '@app.route("/")\ndef h():\n    return "hi"\n', [("GET", "/"), ("HEAD", "/"), ("OPTIONS", "/"), ("POST", "/")])
    eq(st(r), [200, 200, 200, 405], "GET, HEAD, OPTIONS allowed; POST 405")
    eq(r[1]["body"], "", "HEAD has no body")


@check("Tflask-core-142")
def same_rule_and_name():
    r = flask(HEAD + '@app.route("/a")\ndef x():\n    return "x"\n@app.route("/a")\ndef y():\n    return "y"\n', [("GET", "/a")])
    eq(bodies(r), ["x"], "the first rule registered wins")
    o, e, rc = run_py("import flask\nflask.Flask.run=lambda *a,**k: None\n" + HEAD + '@app.route("/a")\ndef x():\n    return "x"\n@app.route("/b")\ndef x():\n    return "y"\n')
    eq("View function mapping is overwriting an existing endpoint function: x" in e, True, "two functions with one name fail at start-up")


@check("Tflask-core-143")
def converter_edges():
    r = flask(HEAD + '@app.route("/f/<float:x>")\ndef f(x):\n    return repr(x)\n@app.route("/n/<int:x>")\ndef n(x):\n    return repr(x)\n@app.route("/p/<path:p>")\ndef p(p):\n    return p\n@app.route("/s/<s>")\ndef s(s):\n    return s\n',
              [("GET", "/f/3"), ("GET", "/f/3.5"), ("GET", "/n/007"), ("GET", "/p/a/b/c"), ("GET", "/s/a/b"), ("GET", "/s/a%20b"), ("GET", "/f/-2.5"), ("GET", "/f/10.0")])
    eq(st(r), [404, 200, 200, 200, 404, 200, 404, 200], "status (float rejects a minus sign by default)")
    eq([b for b in bodies(r)][1:4] + [bodies(r)[5]], ["3.5", "7", "a/b/c", "a b"], "values")


@check("Tflask-core-144")
def url_for_edges():
    app = HEAD + '@app.route("/user/<name>")\ndef user(name):\n    return name\n'
    eq(ctx(app, ['url_for("user", name="a b")', 'url_for("user", name="x", _external=True)', 'url_for("static", filename="x.css")', 'url_for("user", name="q", tab=1)']),
       ["/user/a%20b", "http://localhost/user/x", "/static/x.css", "/user/q?tab=1"], "escaping, external, static, extra values")


@check("Tflask-core-145")
def redirect_codes():
    r = flask(HEAD + '@app.route("/a")\ndef a():\n    return redirect(url_for("b"))\n@app.route("/b")\ndef b():\n    return "B"\n@app.route("/c")\ndef c():\n    return redirect("/b", code=301)\n',
              [("GET", "/a"), ("GET", "/c"), ("GET", "/a", {}, True)])
    eq([(x["status"], x["location"]) for x in r[:2]], [(302, "/b"), (301, "/b")], "302 by default, 301 when asked; Location /b")
    eq((r[2]["status"], r[2]["body"]), (200, "B"), "following it shows B")


@check("Tflask-core-146")
def args_lists_and_types():
    r = flask("import json\n" + HEAD + '@app.route("/t")\ndef t():\n    return json.dumps([request.args.get("t"), request.args.getlist("t"), request.args.get("n", type=int), request.args.get("n", 5, type=int)])\n',
              [("GET", "/t?t=a&t=b&n=x"), ("GET", "/t?n=3")])
    eq([json.loads(b) for b in bodies(r)], [["a", ["a", "b"], None, 5], [None, [], 3, 3]], "get, getlist, type=int")


@check("Tflask-core-147")
def handler_500_and_description():
    r = flask(HEAD + '@app.errorhandler(500)\ndef e(err):\n    return "bad", 500\n@app.route("/z")\ndef z():\n    return 1/0\n@app.route("/q")\ndef q():\n    abort(403, description="no entry")\n', [("GET", "/z"), ("GET", "/q")])
    eq((r[0]["status"], r[0]["body"]), (500, "bad"), "a crash goes to the 500 handler")
    eq((r[1]["status"], "no entry" in r[1]["body"]), (403, True), "abort's description is shown")


@check("Tflask-core-148")
def form_missing_key():
    r = flask(HEAD + '@app.route("/f", methods=["POST"])\ndef f():\n    return request.form["x"]\n@app.route("/g", methods=["POST"])\ndef g():\n    return request.form.get("x", "none")\n', [("POST", "/f"), ("POST", "/g"), ("POST", "/f", {"data": {"x": "1"}})])
    eq(st(r), [400, 200, 200], "missing form key with [] is 400")
    eq(bodies(r)[1:], ["none", "1"], "get gives the default")


@check("Tflask-core-149")
def return_shapes():
    r = flask(HEAD + '@app.route("/a")\ndef a():\n    return "made", 201\n@app.route("/b")\ndef b():\n    return "h", {"X-A": "1"}\n@app.route("/c")\ndef c():\n    return [1, 2]\n@app.route("/d")\ndef d():\n    return 5\n@app.route("/e")\ndef e():\n    return "t", 202, {"X-B": "2"}\n',
              [("GET", "/a"), ("GET", "/b"), ("GET", "/c"), ("GET", "/d"), ("GET", "/e")])
    eq(st(r), [201, 200, 200, 500, 202], "status of each return shape")
    eq((r[2]["ctype"], json.loads(r[2]["body"])), ("application/json", [1, 2]), "a list becomes JSON")


@check("Tflask-core-150")
def route_decorator_returns_function():
    r = flask(HEAD + 'def v():\n    return "v"\nr = app.route("/v")(v)\n@app.route("/w")\ndef w():\n    return str(r is v)\n', [("GET", "/w"), ("GET", "/v")])
    eq(bodies(r), ["True", "v"], "app.route(...) registers the function and hands it back unchanged")


@check("Tflask-core-151")
def python_basics():
    eq(out_of('name = "MAD"\nd = {"a": 1}\nprint(f"Hello {name}")\nprint(d.get("b"), d.get("b", 0))\ndef f():\n    x = 1\nprint(f())\n'), "Hello MAD\nNone 0\nNone", "f-string, dict.get, a function without return")


if __name__ == "__main__":
    main()
