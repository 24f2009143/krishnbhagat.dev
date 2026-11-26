"""Checks for js/data/topic-web-arch.js and its pack. Ids Tweb-arch-NN. Flask runs in the pinned environment."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assertlib import check, out_of, eq, main  # noqa: E402

HEADGET = '''from flask import Flask
app = Flask(__name__)

@app.route("/page")
def page():
    return "Hello there"

c = app.test_client()
g, h = c.get("/page"), c.head("/page")
print(g.status_code, len(g.data), g.headers["Content-Length"])
print(h.status_code, len(h.data), h.headers["Content-Length"])
'''

COOKIE = '''from flask import Flask, request, make_response
app = Flask(__name__)

@app.route("/set")
def set_lang():
    r = make_response("saved")
    r.set_cookie("lang", "ta")
    return r

@app.route("/hello")
def hello():
    return "lang=" + request.cookies.get("lang", "none")

c = app.test_client()
print(c.get("/hello").data.decode())
s = c.get("/set")
print(c.get("/hello").data.decode())
print(s.headers["Set-Cookie"].split(";")[0])
'''

RENDER = '''from flask import Flask, render_template_string, jsonify
app = Flask(__name__)
items = ["tea", "milk"]

@app.route("/ssr")
def ssr():
    return render_template_string("<ul>{% for i in items %}<li>{{ i }}</li>{% endfor %}</ul>", items=items)

@app.route("/api")
def api():
    return jsonify(items)

c = app.test_client()
print(c.get("/ssr").data.decode())
print(c.get("/api").data.decode().strip())
'''


@check("Tweb-arch-01")
def get_head():
    eq(out_of(HEADGET), "200 11 11\n200 0 11", "GET has a body, HEAD has none")


@check("Tweb-arch-02")
def cookie_round_trip():
    eq(out_of(COOKIE).split("\n")[:2], ["lang=none", "lang=ta"], "cookie sent back")


@check("Tweb-arch-03")
def ssr_vs_api():
    eq(out_of(RENDER), '<ul><li>tea</li><li>milk</li></ul>\n["tea","milk"]', "outputs")


@check("Tweb-arch-04")
def four_gbps():
    bits = 10_000 * 50 * 1000 * 8
    eq(bits, 4 * 10 ** 9, "10,000 x 50 KB x 8 bits")
    eq(bits < 10 * 10 ** 9, True, "below one server's 10 Gbps")


@check("Tweb-arch-05")
def one_point_six():
    eq(2000 * 100 * 1000 * 8 / 1e9, 1.6, "Gbps")


@check("Tweb-arch-06")
def set_cookie_header():
    eq(out_of(COOKIE).split("\n")[2], "lang=ta", "the response header is Set-Cookie")



# ================= depth upgrade (MLT pattern)
@check("Tweb-arch-07")
def url_parts():
    o = out_of("from urllib.parse import urlsplit\nu = urlsplit('https://example.com:8443/shop/items?id=7&sort=price#reviews')\nprint(u.scheme, u.hostname, u.port, u.path, u.query, u.fragment)\n")
    eq(o, "https example.com 8443 /shop/items id=7&sort=price reviews", "the six parts of a URL")


@check("Tweb-arch-08")
def cookie_round_trip():
    src = ("from flask import Flask, request, make_response\napp = Flask(__name__)\n"
           "@app.route('/set')\ndef set_():\n    r = make_response('set')\n    r.set_cookie('theme', 'dark')\n    return r\n"
           "@app.route('/read')\ndef read():\n    return request.cookies.get('theme', 'none')\n"
           "c = app.test_client()\nprint(c.get('/read').get_data(as_text=True))\nr = c.get('/set')\nprint(r.headers['Set-Cookie'].split(';')[0])\nprint(c.get('/read').get_data(as_text=True))\n")
    eq(out_of(src), "none\ntheme=dark\ndark", "Set-Cookie in the response; the browser sends it back on the next request")


@check("Tweb-arch-09")
def flask_session_needs_secret():
    base = ("from flask import Flask, session\napp = Flask(__name__)\n%s"
            "@app.route('/inc')\ndef inc():\n    session['n'] = session.get('n', 0) + 1\n    return str(session['n'])\n"
            "app.testing = True\nc = app.test_client()\n"
            "try:\n    print(c.get('/inc').get_data(as_text=True), c.get('/inc').get_data(as_text=True))\nexcept Exception as e:\n    print(type(e).__name__)\n")
    eq(out_of(base % "app.secret_key = 'dev'\n"), "1 2", "the session survives between requests through a signed cookie")
    eq(out_of(base % ""), "RuntimeError", "no secret key: the session cannot be signed")


@check("Tweb-arch-10")
def availability_arithmetic():
    o = out_of("one = 0.99\nboth_down = (1 - one) ** 2\nprint(round(1 - both_down, 6), round((1 - one) * 365 * 24, 1), round(both_down * 365 * 24 * 60, 1))\n")
    eq(o, "0.9999 87.6 52.6", "two independent 99% servers: 99.99%; downtime hours and minutes per year")



@check("Tweb-arch-11")
def status_phrases():
    eq(out_of("from http import HTTPStatus as H\nprint([H(c).phrase for c in (200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 405, 500, 503)])\n"),
       "['OK', 'Created', 'No Content', 'Moved Permanently', 'Found', 'Not Modified', 'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Method Not Allowed', 'Internal Server Error', 'Service Unavailable']", "standard reason phrases")


@check("Tweb-arch-12")
def response_headers_flask():
    src = ("from flask import Flask\napp = Flask(__name__)\n@app.route('/')\ndef h():\n    return 'hi'\n@app.route('/j')\ndef j():\n    return {'a': 1}\n"
           "c = app.test_client()\nfor u in ('/', '/j'):\n    r = c.get(u)\n    print(r.headers['Content-Type'], r.headers['Content-Length'])\n")
    eq(out_of(src), "text/html; charset=utf-8 2\napplication/json 8", "Content-Type and Content-Length")


@check("Tweb-arch-13")
def round_robin():
    eq(out_of("servers = ['A', 'B', 'C']\nprint(''.join(servers[i % 3] for i in range(7)))\n"), "ABCABCA", "round robin hands requests out in turn")


if __name__ == "__main__":
    main()
