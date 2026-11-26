"""Checks for js/data/topic-templating.js and its pack. Ids Ttemplating-NN.
string.Template, PyHTML (1.3.2), Jinja2 (3.1.6) and Flask (3.1.3) run in the pinned environment."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assertlib import check, out_of, run_py, eq, main  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402

squash = lambda s: re.sub(r"\s+", "", s)


def jinja(tpl, **kw):
    return out_of("from jinja2 import Template\nprint(Template(%r).render(**%r), end='')\n" % (tpl, kw))


def jinja_env(templates, name):
    return out_of("from jinja2 import Environment, DictLoader\ntry:\n    print(Environment(loader=DictLoader(%r)).get_template(%r).render(), end='')\nexcept Exception as e:\n    print(type(e).__name__)\n" % (templates, name))


def pyhtml(expr):
    return out_of("from pyhtml import *\nprint((%s).render())\n" % expr)


FLASK_RUN = r'''
import json, os, flask
flask.Flask.run = lambda *a, **k: None
for p, t in FILES.items():
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    open(p, "w").write(t)
ns = {"__name__": "appmod"}
exec(compile(APP, "app.py", "exec"), ns)
c = ns["app"].test_client()
print(json.dumps([[r.status_code, r.get_data(as_text=True)] for r in (c.get(u) for u in URLS)]))
'''


def flask(app, files, urls):
    o, e, rc = run_py("APP = %r\nFILES = %r\nURLS = %r\n" % (app, files, urls) + FLASK_RUN)
    if rc:
        raise AssertionError(e[-500:])
    return json.loads(o.strip().splitlines()[-1])


def pack_options(qid):
    data = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")], capture_output=True, text=True, check=True).stdout)
    return next(q for q in data["packs"]["q2"]["templating"]["pyqs"] if q["id"] == qid)["options"]


def fence(t):
    return re.search(r"```[\w]*\n(.*?)\n\s*```", t, re.S).group(1)


T1 = 'from string import Template\nt = Template("The $color car is near the $building.")\nprint(t.substitute(color="red", building="office"))\nprint(t.safe_substitute(color="green"))\nprint(t.substitute({"color": "blue", "building": "mall", "place": "Chennai"}))\n'


@check("Ttemplating-01")
def template_basics():
    eq(out_of(T1), "The red car is near the office.\nThe green car is near the $building.\nThe blue car is near the mall.", "outputs")
    o, e, rc = run_py('from string import Template\nTemplate("Hi $name").substitute({})\n')
    eq("KeyError: 'name'" in e, True, "KeyError")


@check("Ttemplating-02")
def lang_desc():
    o, e, rc = run_py('from string import Template\nTemplate("$lang is $desc").substitute({"lang": "Python"})\n')
    eq("KeyError: 'desc'" in e, True, "substitute")
    eq(out_of('from string import Template\nprint(Template("$lang is $desc").safe_substitute({"lang": "Python"}))\n'), "Python is $desc", "safe")


@check("Ttemplating-03")
def template_then_jinja():
    eq(out_of(CODE["640653690112"][0]), "A student needs to complete foundation level to get to the {{c2}} level.\nA student needs to complete foundation level to get to the diploma level.", "two lines")


@check("Ttemplating-04")
def xy_ab():
    o, e, rc = run_py('from string import Template\nTemplate("$x-$y").substitute(x=1)\n')
    eq("KeyError" in e, True, "B raises")
    eq(out_of('from string import Template\nt = Template("$x-$y")\nprint(t.substitute(x=1, y=2), t.safe_substitute(x=1), t.substitute(x=1, y=2, z=3))\n'), "1-2 1-$y 1-2", "others")
    eq(out_of('from string import Template\nprint(Template("$a and $b").safe_substitute(a=1))\n'), "1 and $b", "safe")


@check("Ttemplating-05")
def pyhtml_page():
    o = pyhtml('html(head(title("Quiz")), body(h2("Hi"), p("One")))')
    eq(squash(o), "<!DOCTYPEhtml><html><head><title>Quiz</title></head><body><h2>Hi</h2><p>One</p></body></html>", "structure")
    eq("\n      Quiz\n" in o, True, "1.3.2 puts text on its own line")


@check("Ttemplating-06")
def pyhtml_where():
    eq(squash(pyhtml('html(head(title("T")), body(div("D"), p("P")))')), "<!DOCTYPEhtml><html><head><title>T</title></head><body><div>D</div><p>P</p></body></html>", "structure")
    eq(squash(pyhtml('html(head(title("A")), body(h1("B")))')), "<!DOCTYPEhtml><html><head><title>A</title></head><body><h1>B</h1></body></html>", "h1 in body")


@check("Ttemplating-07")
def pyhtml_siblings():
    eq(squash(pyhtml('body(h2("H"), div("D"), p("P1"), p("P2"))')), "<body><h2>H</h2><div>D</div><p>P1</p><p>P2</p></body>", "siblings")


@check("Ttemplating-08")
def pyhtml_children():
    eq(squash(pyhtml('div(p("a"), p("b"))')), "<div><p>a</p><p>b</p></div>", "children")


MACRO = '{% macro show(items) %}\n  {% for c in items %}\n    <p>{{ c }}</p>\n  {% endfor %}\n{% endmacro %}\n{{ show(courses) }}'


@check("Ttemplating-09")
def macro():
    eq(squash(jinja(MACRO, courses=["App1", "App2"])), "<p>App1</p><p>App2</p>", "macro")


@check("Ttemplating-10")
def loop_text():
    eq(out_of("from jinja2 import Template\nprint(repr(Template('{% for x in [1, 2, 3] %}{{ x }} {% endfor %}').render()))\n"), "'1 2 3 '", "text (each number followed by a space)")


@check("Ttemplating-11")
def list_repr():
    eq(jinja("{{ items }}", items=["a", "b"]), "['a', 'b']", "repr")


@check("Ttemplating-12")
def range3():
    eq(jinja("{% for i in range(3) %}{{ i }}{% endfor %}"), "012", "012")


@check("Ttemplating-13")
def set_in_loop():
    eq(jinja("{% for i in range(3) %}{% set x = i %}{% endfor %}[{{ x }}]"), "[]", "empty")
    eq(jinja("{% for i in [1,2] %}{% set z = i %}{% endfor %}[{{ z }}]"), "[]", "test item")


@check("Ttemplating-14")
def outer_unchanged():
    eq(jinja("{% set x = 0 %}{% for i in [1,2] %}{% set x = i %}{% endfor %}{{ x }}"), "0", "0")


@check("Ttemplating-15")
def namespace():
    eq(jinja("{% set ns = namespace(x=0) %}{% for i in range(3) %}{% set ns.x = i %}{% endfor %}{{ ns.x }}"), "2", "2")


@check("Ttemplating-16")
def undefined_empty():
    eq(jinja("[{{ missing_var }}]"), "[]", "empty")


@check("Ttemplating-17")
def inheritance():
    base = "<h3>Welcome</h3>\n{% block content %}{% endblock %}"
    child = '{% extends "base.html" %}\n{% block content %}<p>Hello</p>{% endblock %}'
    eq(squash(jinja_env({"base.html": base, "child.html": child}, "child.html")), "<h3>Welcome</h3><p>Hello</p>", "render")


@check("Ttemplating-18")
def unnamed_block():
    eq(jinja_env({"base.html": "{% block abc %}{% endblock %}", "c.html": '{% extends "base.html" %}{% block %}X{% endblock %}'}, "c.html"), "TemplateSyntaxError", "unnamed")
    eq(jinja_env({"base.html": "{% block abc %}{% endblock %}", "c.html": '{% extends "base.html" %}{% block abc %}X{% endblock %}'}, "c.html"), "X", "named")


@check("Ttemplating-19")
def misnamed_block():
    eq(jinja_env({"base.html": "B{% block abc %}{% endblock %}", "c.html": '{% extends "base.html" %}{% block xyz %}X{% endblock %}'}, "c.html"), "B", "child block ignored")


@check("Ttemplating-20")
def replace_block():
    eq(jinja_env({"base.html": "<h3>W</h3>{% block c %}B{% endblock %}", "c.html": '{% extends "base.html" %}{% block c %}C{% endblock %}'}, "c.html"), "<h3>W</h3>C", "replaced")


FOLDERS = {"my_templates/public/home.html": "home", "my_templates/private/dashboard.html": "dash", "templates/page.html": "page", "templates/base.html": "base", "views/index.html": "index"}


@check("Ttemplating-21")
def template_folder():
    r = flask(CODE["6406532180393"][1], FOLDERS, ["/", "/dashboard", "/view", "/page"])
    eq([x[0] for x in r], [200, 200, 500, 500], "status")


SIZE_TPL = CODE["6406531325143"][1]


@check("Ttemplating-22")
def url_into_template():
    r = flask(CODE["6406531325143"][0], {"templates/index.html": SIZE_TPL}, ["/text/size/20/red", "/text/size/red/20"])
    eq((r[0][0], "color: red; font-size:20px;" in r[0][1], r[1][0]), (200, True, 404), "results")


@check("Ttemplating-23")
def default_folder():
    app = 'from flask import Flask, render_template\napp = Flask(__name__)\n@app.route("/a")\ndef a():\n    return render_template("a.html", name="Ana")\n@app.route("/b")\ndef b():\n    return render_template("nope.html")\n'
    r = flask(app, {"templates/a.html": "{{ name }}"}, ["/a", "/b"])
    eq((r[0], r[1][0]), ([200, "Ana"], 500), "default folder, variable, missing template")


@check("Ttemplating-24")
def pyhtml_div_p():
    eq(squash(pyhtml('body(div(p("x")), p("y"))')), "<body><div><p>x</p></div><p>y</p></body>", "structure")


@check("Ttemplating-25")
def angle_loop():
    eq(jinja('{% for c in ["x", "y"] %}<{{ c }}>{% endfor %}'), "<x><y>", "text")


@check("Ttemplating-26")
def macro_double():
    eq(jinja("{% macro m(n) %}{{ n * 2 }}{% endmacro %}{{ m(4) }}"), "8", "8")


@check("Ttemplating-27")
def set_inside_used_inside():
    eq(jinja("{% for i in [5] %}{% set y = i %}{{ y }}{% endfor %}"), "5", "5")


@check("Ttemplating-28")
def views_folder():
    app = 'from flask import Flask, render_template\napp = Flask(__name__, template_folder="views")\n@app.route("/")\ndef h():\n    return render_template("x.html")\n'
    eq(flask(app, {"templates/x.html": "x"}, ["/"])[0][0], 500, "not found")


@check("Ttemplating-29")
def extras_ok():
    eq(out_of('from string import Template\nprint(Template("$a $b").substitute(a=1, b=2, c=3))\n'), "1 2", "extras ignored")


@check("Ttemplating-30")
def age_name():
    app = 'from flask import Flask, render_template\napp = Flask(__name__)\n@app.route("/u/<int:age>/<name>")\ndef u(age, name):\n    return render_template("u.html", age=age, name=name)\n'
    r = flask(app, {"templates/u.html": "{{ name }} {{ age }}"}, ["/u/30/Ana", "/u/Ana/30"])
    eq((r[0], r[1][0]), ([200, "Ana 30"], 404), "results")


# ================= PYQs
@check("Ttemplating-31")
def pyq_640653351993():
    out = out_of(CODE["640653351993"][0])
    opts = [squash(fence(o)) for o in pack_options("640653351993")]
    eq([squash(out) == o for o in opts], [True, False, False, False], "structure matches option A only")


@check("Ttemplating-32")
def pyq_640653690112():
    eq(out_of(CODE["640653690112"][0]).split("\n")[0], "A student needs to complete foundation level to get to the {{c2}} level.", "first line keeps {{c2}}")


def template_options(qid, exprs):
    base = CODE[qid][0]
    res = []
    for x in exprs:
        o, e, rc = run_py(base.replace("print(=== OUTPUT ===)", "print(%s)" % x))
        res.append("KeyError" if "KeyError" in e else o.strip())
    return res


@check("Ttemplating-33")
def pyq_640653771133():
    r = template_options("640653771133", ["template.substitute({'color':'red'})", "template.substitute({'color': 'blue', 'building':'office', 'place': 'Chennai'})", "template.safe_substitute({'color':'green'})", "template.safe_substitute({'color':'yellow', 'building':'apartment', 'place': 'Chennai'})"])
    eq([x == "KeyError" for x in r], [True, False, False, False], "only A raises")
    eq(r[2], "The green car is parked in front of the $building.", "C output")


@check("Ttemplating-34")
def pyq_6406531325145():
    r = template_options("6406531325145", ["template.substitute({'lang': 'Python'})", "template.substitute({'lang': 'Python', 'desc': 'popular', 'useful': 'useful'})", "template.safe_substitute({'lang': 'Python'})", "template.safe_substitute({'lang': 'Python', 'desc': 'versatile'})"])
    eq([x == "KeyError" for x in r], [True, False, False, False], "only A raises")
    eq(r[1], "The Python programming language is popular and useful for web development.", "B output")


@check("Ttemplating-35")
def pyq_640653351994():
    r = flask(CODE["640653351994"][0], {"templates/index.html": CODE["640653351994"][1]}, ["/"])
    eq(re.findall(r"<p>(.*?)</p>", r[0][1]), ["App1", "App2", "python", "Data science", "Database", "machine learning"], "one paragraph per course")


@check("Ttemplating-36")
def pyq_6406531173004():
    base = CODE["6406531173004"][0]
    opts = [fence(o) for o in pack_options("6406531173004")]
    res = [jinja_env({"base_layout.html": base, "c.html": o}, "c.html") for o in opts]
    eq(["Company Directors" in res[0], res[1], res[2], res[3]], [True, "TemplateSyntaxError", "TemplateSyntaxError", "TemplateSyntaxError"], "only A renders")


@check("Ttemplating-37")
def pyq_6406531325143():
    r = flask(CODE["6406531325143"][0], {"templates/index.html": SIZE_TPL}, ["/?text=red&size=20", "/?size=20&text=red", "/text/size/red/20", "/text/size/20/red"])
    eq([x[0] for x in r], [404, 404, 404, 200], "only D")


@check("Ttemplating-38")
def pyq_6406532035119():
    r = flask(CODE["6406532035119"][0], {"templates/index.html": CODE["6406532035119"][1]}, ["/"])
    eq(squash(re.sub(r"<[^>]+>", "", r[0][1])), "Outputis:", "nothing after the label")


@check("Ttemplating-39")
def pyq_6406532180406():
    eq(out_of(CODE["6406532180406"][0]).strip(), "", "nothing rendered")


@check("Ttemplating-40")
def pyq_6406532180393():
    r = flask(CODE["6406532180393"][1], FOLDERS, ["/", "/dashboard", "/view", "/page"])
    eq([x[0] for x in r], [200, 200, 500, 500], "/ and /dashboard work")


# ---- transfers
@check("Ttemplating-41")
def tr_missing_c1():
    o, e, rc = run_py(CODE["640653690112"][0].replace("{'c1': 'foundation', 'c2': 'diploma'}", "{'c2': 'diploma'}"))
    eq("KeyError: 'c1'" in e, True, "KeyError")


@check("Ttemplating-42")
def tr_green():
    eq(template_options("640653771133", ["template.safe_substitute({'color':'green'})"])[0], "The green car is parked in front of the $building.", "output")


@check("Ttemplating-43")
def tr_useful():
    eq(template_options("6406531325145", ["template.safe_substitute({'lang': 'Python', 'desc': 'versatile'})"])[0], "The Python programming language is versatile and $useful for web development.", "output")


@check("Ttemplating-44")
def tr_blue35():
    r = flask(CODE["6406531325143"][0], {"templates/index.html": SIZE_TPL}, ["/text/size/35/blue"])
    eq("color: blue; font-size:35px;" in r[0][1], True, "style")


@check("Ttemplating-45")
def tr_i_after():
    eq(jinja("{% for i in range(3) %}{% endfor %}[{{ i }}]"), "[]", "loop variable gone")


@check("Ttemplating-46")
def tr_default_folder():
    app = CODE["6406532180393"][1].replace("Flask(__name__, template_folder='my_templates')", "Flask(__name__)")
    eq([x[0] for x in flask(app, FOLDERS, ["/", "/dashboard", "/view", "/page"])], [500, 500, 500, 200], "only /page")



# ================= depth upgrade (MLT pattern)
def jx(tpl, **ctx):
    return out_of("from jinja2 import Environment\nprint(Environment().from_string(%r).render(**%r), end='')\n" % (tpl, ctx))


@check("Ttemplating-47")
def template_dollar_and_braces():
    eq(out_of("from string import Template\nprint(Template('Cost: $$${amt} for ${item}s').substitute(amt=5, item='pen'))\n"), "Cost: $5 for pens", "$$ is a dollar sign; ${name} lets letters follow")


@check("Ttemplating-48")
def jinja_undefined_and_default():
    eq(jx("[{{ missing }}]"), "[]", "an undefined variable prints nothing")
    eq(jx("{{ x|default('none') }} {{ y|default('none') }}", y="set"), "none set", "default filter")


@check("Ttemplating-49")
def jinja_loop_helpers():
    eq(jx("{% for n in xs %}{{ loop.index }}{{ n }}{% if not loop.last %},{% endif %}{% else %}empty{% endfor %}", xs=["a", "b"]), "1a,2b", "loop.index and loop.last")
    eq(jx("{% for n in xs %}{{ n }}{% else %}empty{% endfor %}", xs=[]), "empty", "for ... else runs when the list is empty")


@check("Ttemplating-50")
def jinja_filters():
    eq(jx("{{ name|upper }} {{ xs|length }} {{ xs|join('-') }} {{ t|title }} {{ p|round(1) }}", name="asha", xs=[1, 2, 3], t="web app", p=3.14159), "ASHA 3 1-2-3 Web App 3.1", "common filters")


@check("Ttemplating-51")
def flask_autoescape():
    r = flask("from flask import Flask, render_template_string\napp = Flask(__name__)\n@app.route('/a')\ndef a():\n    return render_template_string('{{ s }}|{{ s|safe }}', s='<b>hi</b>')\n", {}, ["/a"])
    eq(r[0][1], "&lt;b&gt;hi&lt;/b&gt;|<b>hi</b>", "Flask escapes HTML in variables; |safe turns it off")


@check("Ttemplating-52")
def jinja_super_and_include():
    files = {"templates/base.html": "<h1>{% block title %}Site{% endblock %}</h1>{% include 'foot.html' %}", "templates/foot.html": "<p>foot</p>",
             "templates/page.html": "{% extends 'base.html' %}{% block title %}Page - {{ super() }}{% endblock %}"}
    r = flask("from flask import Flask, render_template\napp = Flask(__name__)\n@app.route('/')\ndef p():\n    return render_template('page.html')\n", files, ["/"])
    eq(r[0][1], "<h1>Page - Site</h1><p>foot</p>", "super() keeps the parent's block text; include pastes another file")
    files["templates/page.html"] = "{% extends 'base.html' %}{% block title %}Page{% endblock %}"
    r = flask("from flask import Flask, render_template\napp = Flask(__name__)\n@app.route('/')\ndef p():\n    return render_template('page.html')\n@app.route('/m')\ndef m():\n    return render_template('nope.html')\n", files, ["/", "/m"])
    eq((r[0][1], r[1][0]), ("<h1>Page</h1><p>foot</p>", 500), "without super() the block is replaced; a missing template is a 500")



@check("Ttemplating-53")
def by_hand_vs_template():
    by_hand = out_of("names = ['Asha', 'Ravi']\nhtml = '<ul>' + ''.join('<li>' + n + '</li>' for n in names) + '</ul>'\nprint(html)\n")
    eq(by_hand, "<ul><li>Asha</li><li>Ravi</li></ul>", "string building by hand")
    eq(jx("<ul>{% for n in names %}<li>{{ n }}</li>{% endfor %}</ul>", names=["Asha", "Ravi"]), "<ul><li>Asha</li><li>Ravi</li></ul>", "the same with a template")


@check("Ttemplating-54")
def jinja_if_elif_and_macro_args():
    eq(jx("{% for m in ms %}{% if m >= 90 %}A{% elif m >= 75 %}B{% else %}C{% endif %}{% endfor %}", ms=[95, 80, 40]), "ABC", "if / elif / else")
    eq(jx("{% macro badge(text, kind='info') %}[{{ kind }}:{{ text }}]{% endmacro %}{{ badge('hi') }}{{ badge('x', 'warn') }}"), "[info:hi][warn:x]", "macro with a default argument")


@check("Ttemplating-55")
def whitespace_control():
    eq(jx("a\n{% if true %}\nb\n{% endif %}\nc"), "a\n\nb\n\nc", "tags leave their newlines behind")
    eq(jx("a\n{%- if true %}\nb\n{%- endif %}\nc"), "a\nb\nc", "a minus sign trims the whitespace on that side")


if __name__ == "__main__":
    main()
