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


if __name__ == "__main__":
    main()
