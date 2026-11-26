"""Checks for js/data/topic-rest-api.js and its pack. Ids Trest-api-NN.
Flask 3.1.3, Flask-RESTful 0.3.10, Flask-SQLAlchemy 3.1.1 run in the pinned environment; app.run() is a no-op."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assertlib import check, run_py, eq, main  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402

RUN = r'''
import json, flask
flask.Flask.run = lambda *a, **k: None
ns = {"__name__": "appmod"}
exec(compile(PRE + APP + POST, "app.py", "exec"), ns)
c = ns["app"].test_client()
out = []
for m, u, kw in REQS:
    r = c.open(u, method=m, **kw)
    out.append([r.status_code, r.get_data(as_text=True), r.content_type, r.headers.get("Location")])
print(json.dumps(out))
for line in ns.get("AFTER", lambda c: [])(c):
    print(line)
'''


def call(app, reqs, pre="", post=""):
    norm = [(r[0], r[1], r[2] if len(r) > 2 else {}) for r in reqs]
    o, e, rc = run_py("PRE = %r\nAPP = %r\nPOST = %r\nREQS = %r\n" % (pre, app, post, norm) + RUN)
    if rc:
        raise AssertionError(e[-700:])
    lines = o.strip().splitlines()
    res = json.loads(lines[0])
    return res, lines[1:]


def body(r):
    try:
        return json.loads(r[1])
    except ValueError:
        return r[1].strip()


# ================= PYQs
@check("Trest-api-01")
def pyq_640653351986():
    r, _ = call(CODE["640653351986"][0], [("GET", "/"), ("GET", "/home")])
    eq((r[0][0], r[0][2]), (200, "application/json"), "/ is JSON")
    eq(body(r[1]), {"The list of gadgets": [{"tech": "Smartwatch, Digital camera"}, {"mobile": "Headphones, Speakers"}, {"Laptop": "Keyboard, Mouse"}]}, "/home body is a list")


@check("Trest-api-02")
def pyq_640653771139():
    r, _ = call("from flask import Flask, jsonify\napp = Flask(__name__)\n" + CODE["640653771139"][0].split("app = Flask(__name__)\n", 1)[1], [("GET", "/api/courses")])
    eq((r[0][0], r[0][2]), (200, "application/json"), "status and mimetype")


@check("Trest-api-03")
def pyq_640653352000():
    r, _ = call(CODE["640653352000"][0], [("POST", "/myinfo", {"json": {"Id": 3, "name": "user_1", "email": "user_1@gmail.com"}})])
    eq(body(r[0]), {"Id": 3, "name": "user_1"}, "marshal_with keeps Id (as int) and name")


@check("Trest-api-04")
def pyq_640653586803():
    app = CODE["640653586803"][0]
    reqs = [("get", "/api/get"), ("put", "/api/put"), ("post", "/api/post"), ("put", "/api/get"), ("get", "/api/put"), ("get", "/api/post")]
    r, _ = call(app, reqs)
    eq([x[0] for x in r], [200, 200, 405, 200, 200, 200], "only 3 fails (lower-case methods are upper-cased)")


@check("Trest-api-05")
def pyq_6406531021285():
    r, _ = call(CODE["6406531021285"][0], [("GET", "/api/salaries")])
    eq(body(r[0]), {"1": {"name": "Ravi", "basic": 14500, "hra": 1450.0}, "2": {"name": "David", "basic": 9500, "hra": 950.0}, "3": {"name": "Tinu", "basic": 15009, "hra": 1500.9}}, "hra added")


@check("Trest-api-06")
def pyq_6406531173008():
    r, _ = call(CODE["6406531173008"][0], [("GET", u) for u in ("/", "/x=6/y=2", "/6/2", "/6", "/2")])
    eq([x[0] for x in r], [200, 404, 200, 404, 404], "status")
    eq((body(r[0]), body(r[2])), ({"output": "Default computed value: 0"}, {"output": "Computed x^y =36"}), "bodies")


@check("Trest-api-07")
def pyq_6406532180395():
    r, _ = call(CODE["6406532180395"][0], [("POST", "/", {"json": {"n": 3}})])
    eq((r[0][0], body(r[0])), (200, {"n": 3}), "args")


@check("Trest-api-08")
def pyq_640653771143():
    pre = "from flask import Flask\nfrom flask_restful import Resource, Api\napp = Flask(__name__)\napi = Api(app)\n"
    r, _ = call(CODE["640653771143"][0], [("GET", "/api/user"), ("GET", "/Meera"), ("POST", "/user-data"), ("POST", "/user_data"), ("GET", "/")], pre=pre)
    eq([x[0] for x in r], [200, 200, 500, 201, 500], "status")
    eq(body(r[0]), {"name": "mad1_admin", "role": "admin"}, "B body")


@check("Trest-api-09")
def pyq_640653856983():
    r, _ = call(CODE["640653856983"][0], [("GET", u) for u in ("/api/ver1/12727", "/api/12727", "/ver2/12727", "/api/ver2")])
    eq([x[0] for x in r], [200, 404, 404, 308], "status (D redirects to /api/ver2/)")
    r2, _ = call(CODE["640653856983"][0], [("GET", "/api/ver2", {"follow_redirects": True})])
    eq((r2[0][0], len(body(r2[0]))), (200, 3), "D after the redirect")


@check("Trest-api-10")
def pyq_6406531021282():
    urls = ["/api/maruti/swift", "/api/brand=Hundai/model=Creta", "/api/brand=Ford, model=Fiesta", "/api/Honda&City", "/api/model=Accent/brand=Hundai"]
    r, _ = call(CODE["6406531021282"][0], [("GET", u) for u in urls])
    eq([x[0] for x in r], [200, 200, 404, 404, 200], "status")


@check("Trest-api-11")
def pyq_6406531173014():
    r, _ = call(CODE["6406531173014"][0], [("GET", "/student/2"), ("PUT", "/student/4", {"json": {"grade": "A+"}}), ("GET", "/student/10"), ("PUT", "/student/1", {"json": {"grade": "A+"}})])
    eq([(x[0], body(x)) for x in r], [(200, {"name": "Kiran", "grade": "B+"}), (404, {"message": "Student not found"}), (404, {"message": "Student not found"}),
                                      (200, {"message": "Student record updated", "student": {"name": "Arjun", "grade": "A+"}})], "A-D")


@check("Trest-api-12")
def pyq_6406531325151():
    app = CODE["6406531325151"][0]
    reqs = [("POST", "/", {"json": {"val1": 27, "val2": 3, "operator": op}}) for op in "+*/"] + [("POST", "/", {"data": '{"val1":27,"val2": 3, "operator":"/"}'}), ("POST", "/", {"json": {"val1": 27, "val2": 3, "operator": "-"}})]
    r, _ = call(app, reqs)
    eq([(x[0], body(x)) for x in r], [(200, {"Sum=": 30}), (200, {"Product=": 81}), (401, {"Error": "Invalid option"}), (415, r[3][1].strip() and body(r[3])), (200, {"Difference=": 24})], "A-E")
    eq(r[3][0], 415, "D has no JSON content type")


PRODUCTS = CODE["6406532035125"][0]
OPTS_6406532035125 = {
    "A": '    def post(self):\n        for p in products:\n            if p["id"] == id:\n                return f"{p[\'id\']}, {p[\'name\']}, {p[\'price\']}"\n        return f"msg: {id} not found"\n',
    "B": '    def get(self,id):\n        for p in products:\n            if p["id"] == id:\n                return f"{p[\'id\']}, {p[\'name\']}, {p[\'price\']}"\n        return f"msg: {id} not found"\n',
    "C": '    def get(self):\n        for p in products:\n            if p["id"] == id:\n                return f"{p[\'id\']}, {p[\'name\']}, {p[\'price\']}"\n        return f"msg: {id} not found"\n',
    "D": '    def post(self, id):\n        for p in products:\n            if p["id"] == id:\n                return f"{p[\'id\']}, {p[\'name\']}, {p[\'price\']}"\n        return f"msg: {id} not found"\n'}


@check("Trest-api-13")
def pyq_6406532035125():
    res = {}
    for k, code in OPTS_6406532035125.items():
        app = PRODUCTS.replace("    ### Missing code ###\n", code)
        r, _ = call(app, [("GET", "/2"), ("POST", "/2"), ("GET", "/9")])
        res[k] = [(x[0], body(x)) for x in r]
    eq(res["B"], [(200, "2, pens, 61"), (405, {"message": "The method is not allowed for the requested URL."}), (200, "msg: 9 not found")], "B: GET works")
    eq(res["D"][1], (200, "2, pens, 61"), "D: POST works")
    eq((res["A"][0][0], res["A"][1][0], res["C"][0][0]), (405, 500, 500), "A and C fail")


@check("Trest-api-14")
def pyq_6406532180400():
    r, _ = call(CODE["6406532180400"][0], [("GET", "/users/5001"), ("POST", "/users/5001"), ("POST", "/users"), ("GET", "/users")])
    eq([x[0] for x in r], [500, 201, 500, 200], "A and C raise TypeError (500)")


STUDENT_PRE = '''from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"
db = SQLAlchemy(app)
api = Api(app)
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    roll = db.Column(db.String)
    course = db.Column(db.String)
with app.app_context():
    db.create_all()
    for i, (n, r, c) in enumerate([("Sandeep","STU101","History"),("Ramesh","STU102","Physics"),("Aarav","STU103","Chemistry"),("Meera","STU104","Biotechnology"),("Ramesh","STU105","Mechanics"),("Rishav","STU106","Mathematics")], 1):
        db.session.add(Student(id=i, name=n, roll=r, course=c))
    db.session.commit()
'''
STUDENT_POST = '''
def AFTER(c):
    with app.app_context():
        return [s.course for s in Student.query.filter_by(name="Ramesh").all()]
'''


@check("Trest-api-15")
def pyq_640653690110():
    r, _ = call(CODE["parent:640653690109"][0], [("GET", "/api/Meera"), ("PUT", "/app/STU103/Sociology"), ("POST", "/student/", {"json": {"roll": "STU107", "name": "Tara", "course": "Art"}}), ("POST", "/student")], pre=STUDENT_PRE)
    eq([x[0] for x in r], [200, 200, 201, 308], "GET b, PUT c, POST a (the slash-less URL redirects to /student/)")


@check("Trest-api-16")
def pyq_640653690111():
    r, after = call(CODE["parent:640653690109"][0], [("PUT", "/app/STU105/Robotics")], pre=STUDENT_PRE, post=STUDENT_POST)
    eq((r[0][0], after), (200, ["Physics", "Robotics"]), "Ramesh rows in id order")


TEST_API = CODE["parent:6406531021277"][0]


@check("Trest-api-17")
def pyq_6406531021278():
    r, _ = call(TEST_API, [("GET", "/delete/val1")])
    eq(r[0][0], 500, "get() does not accept val: TypeError, Internal Server Error")


@check("Trest-api-18")
def pyq_6406531021279():
    r, _ = call(TEST_API, [("PUT", "/delete/val1")])
    eq((r[0][0], body(r[0])), (200, {"message": "Value updated successfully", "value": "val1"}), "PUT on /delete runs put()")


@check("Trest-api-19")
def curl_put_form():
    o = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{method}", "-X", "PUT", "-d", "status=active&role=admin", "http://127.0.0.1:9/"], capture_output=True, text=True).stdout
    eq(o, "PUT", "method")
    o = subprocess.run(["curl", "-s", "-v", "-o", "/dev/null", "-X", "PUT", "-d", "a=1", "http://127.0.0.1:9/"], capture_output=True, text=True)
    eq("application/x-www-form-urlencoded" in o.stderr or o.returncode != 0, True, "-d sends form-encoded data")
    # the same request against Flask: the fields arrive in request.form
    r, _ = call("from flask import Flask, request\napp = Flask(__name__)\n@app.route('/u', methods=['PUT'])\ndef u():\n    return dict(request.form)\n", [("PUT", "/u", {"data": {"status": "active", "role": "admin"}})])
    eq(body(r[0]), {"status": "active", "role": "admin"}, "form fields")



# ================= lessons
RP = "from flask import Flask\nfrom flask_restful import Resource, Api, reqparse, fields, marshal_with\napp = Flask(__name__)\napi = Api(app)\n"


@check("Trest-api-20")
def required_missing():
    app = RP + 'parser = reqparse.RequestParser()\nparser.add_argument("n", type=int, required=True)\nclass R(Resource):\n    def post(self):\n        return parser.parse_args()\napi.add_resource(R, "/")\n'
    r, _ = call(app, [("POST", "/", {"json": {}}), ("POST", "/", {"json": {"n": "7"}})])
    eq((r[0][0], body(r[1])), (400, {"n": 7}), "required -> 400; type int converts")


@check("Trest-api-21")
def fields_integer():
    app = RP + 'class R(Resource):\n    @marshal_with({"n": fields.Integer})\n    def get(self):\n        return {"n": "7"}\napi.add_resource(R, "/")\n'
    r, _ = call(app, [("GET", "/")])
    eq(body(r[0]), {"n": 7}, "converted")


@check("Trest-api-22")
def created_201():
    app = RP + 'class R(Resource):\n    def post(self):\n        return {"message": "created"}, 201\napi.add_resource(R, "/")\n'
    r, _ = call(app, [("POST", "/")])
    eq(r[0][0], 201, "201")


@check("Trest-api-23")
def d_implies_post():
    o = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{method}", "-d", "a=1", "http://127.0.0.1:9/"], capture_output=True, text=True).stdout
    eq(o, "POST", "-d without -X is POST")


@check("Trest-api-24")
def jsonify_list():
    r, _ = call("from flask import Flask, jsonify\napp = Flask(__name__)\n@app.route('/')\ndef h():\n    return jsonify({'x': [1, 2]})\n", [("GET", "/")])
    eq(body(r[0]), {"x": [1, 2]}, "list kept")


@check("Trest-api-25")
def power():
    app = RP + 'class Power(Resource):\n    def get(self, x, y):\n        return {"output": x ** y}\napi.add_resource(Power, "/<int:x>/<int:y>")\n'
    r, _ = call(app, [("GET", u) for u in ("/6/2", "/x=6/y=2", "/6", "/2/5")])
    eq([x[0] for x in r], [200, 404, 404, 200], "status"); eq((body(r[0]), body(r[3])), ({"output": 36}, {"output": 32}), "bodies")


@check("Trest-api-26")
def marshal_filter():
    app = RP + 'class R(Resource):\n    @marshal_with({"a": fields.String})\n    def get(self):\n        return {"a": "x", "b": 1}\napi.add_resource(R, "/")\n'
    r, _ = call(app, [("GET", "/")])
    eq(body(r[0]), {"a": "x"}, "filtered")


@check("Trest-api-27")
def resource_none():
    r, _ = call(CODE["640653856983"][0], [("GET", "/api/ver1/99999")])
    eq((r[0][0], r[0][1].strip(), r[0][2]), (200, "null", "application/json"), "Flask-RESTful sends None as JSON null")


# ================= depth upgrade (MLT pattern)
@check("Trest-api-28")
def resource_status_and_headers():
    app = RP + 'class R(Resource):\n    def post(self):\n        return {"id": 7}, 201\n    def put(self):\n        return {"ok": True}, 200, {"Cache-Control": "max-age=60"}\napi.add_resource(R, "/r")\n'
    r, _ = call(app, [("POST", "/r"), ("PUT", "/r"), ("HEAD", "/r"), ("DELETE", "/r")])
    eq([x[0] for x in r], [201, 200, 405, 405], "201 from a tuple; HEAD needs get; DELETE missing")
    eq(body(r[0]), {"id": 7}, "JSON body")


@check("Trest-api-29")
def resource_head_options():
    app = RP + 'class R(Resource):\n    def get(self):\n        return {"a": 1}\napi.add_resource(R, "/r")\n'
    r, _ = call(app, [("HEAD", "/r"), ("OPTIONS", "/r")])
    eq([x[0] for x in r], [200, 200], "a get method also answers HEAD and OPTIONS")


@check("Trest-api-30")
def reqparse_more():
    app = RP + 'parser = reqparse.RequestParser()\nparser.add_argument("n", type=int, default=5, location="args")\nparser.add_argument("c", choices=("red", "blue"), location="args")\nclass R(Resource):\n    def get(self):\n        return parser.parse_args()\napi.add_resource(R, "/r")\n'
    r, _ = call(app, [("GET", "/r"), ("GET", "/r?n=3&c=red"), ("GET", "/r?c=green"), ("GET", "/r?n=x")])
    eq([x[0] for x in r], [200, 200, 400, 400], "default, values, a choice not allowed, a bad int")
    eq((body(r[0]), body(r[1])), ({"n": 5, "c": None}, {"n": 3, "c": "red"}), "parsed values")
    eq("c" in body(r[2])["message"], True, "the 400 says which argument failed")


@check("Trest-api-31")
def marshal_types():
    app = RP + 'F = {"id": fields.String, "price": fields.Float, "tags": fields.List(fields.Integer), "missing": fields.String}\nclass R(Resource):\n    @marshal_with(F)\n    def get(self):\n        return {"id": 7, "price": 3, "tags": ["1", 2], "extra": 1}\napi.add_resource(R, "/r")\n'
    r, _ = call(app, [("GET", "/r")])
    eq(body(r[0]), {"id": "7", "price": 3.0, "tags": [1, 2], "missing": None}, "converted, listed, missing becomes null, extra dropped")


@check("Trest-api-32")
def restful_abort():
    app = RP.replace("reqparse, fields", "reqparse, fields, abort") + 'class R(Resource):\n    def get(self, i):\n        if i > 3:\n            abort(404, message="no item {}".format(i))\n        return {"i": i}\napi.add_resource(R, "/r/<int:i>")\n'
    r, _ = call(app, [("GET", "/r/2"), ("GET", "/r/9")])
    eq((r[1][0], body(r[1]), r[1][2]), (404, {"message": "no item 9"}, "application/json"), "flask_restful.abort sends a JSON message")


@check("Trest-api-33")
def jsonify_sorts_keys():
    r, _ = call("from flask import Flask, jsonify\napp = Flask(__name__)\n@app.route('/j')\ndef j():\n    return jsonify({'b': 1, 'a': 2})\n@app.route('/d')\ndef d():\n    return {'b': 1, 'a': 2}\n", [("GET", "/j"), ("GET", "/d")])
    eq([x[1].strip() for x in r], ['{"a":2,"b":1}', '{"a":2,"b":1}'], "Flask sorts JSON keys by default")


@check("Trest-api-34")
def restful_endpoints():
    app = RP + 'class R(Resource):\n    def get(self, i=0):\n        return {"i": i}\napi.add_resource(R, "/r", "/r/<int:i>", endpoint="item")\n'
    r, _ = call(app, [("GET", "/r"), ("GET", "/r/4")])
    eq([body(x) for x in r], [{"i": 0}, {"i": 4}], "one class, two URLs, a default argument")
    r2, _ = call(app.replace("def get(self, i=0)", "def get(self, i)"), [("GET", "/r"), ("GET", "/r/4")])
    eq([x[0] for x in r2], [500, 200], "without the default, /r calls get() with no i: 500")


if __name__ == "__main__":
    main()
