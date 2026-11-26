"""Checks for js/data/topic-frontend.js and js/data/pyqs/q2/frontend.js. Ids Tfrontend-NN.
HTML, CSS and JavaScript claims are rendered in headless Chrome (render_html.js) or typed like a user (type_html.js)."""
import json, os, re, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assertlib import check, eq, main  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402


def _tmp(html):
    f = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=HERE)
    f.write(html); f.close(); return f.name


def render(html, expr):
    p = _tmp(html)
    try:
        return json.loads(subprocess.run(["node", os.path.join(HERE, "render_html.js"), p, expr], capture_output=True, text=True, timeout=90).stdout)
    finally:
        os.remove(p)


def typed(html, sel, text, expr):
    p = _tmp(html)
    try:
        return json.loads(subprocess.run(["node", os.path.join(HERE, "type_html.js"), p, sel, text, expr], capture_output=True, text=True, timeout=90).stdout)
    finally:
        os.remove(p)


def pack_options(qid):
    data = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")], capture_output=True, text=True, check=True).stdout)
    for q in data["packs"]["q2"]["frontend"]["pyqs"]:
        if q["id"] == qid:
            return q["options"]
    raise AssertionError("PYQ %s not in the frontend pack" % qid)


BORDER = "(function(){return [...document.body.children].filter(function(e){return e.tagName!=='SCRIPT'&&e.id!=='__out'}).map(function(e){var s=getComputedStyle(e);return e.textContent.trim().slice(0,12)+'|'+s.borderTopWidth+'|'+s.borderTopColor})})()"


# ================= PYQs
@check("Tfrontend-01")
def pyq_640653351990():
    got = render(CODE["640653351990"][0], BORDER)
    eq(got, ["Hello World!|0px|rgb(0, 0, 0)", "Hey!|10px|rgb(255, 0, 0)", "My name is F|0px|rgb(0, 0, 0)", "I am learnin|0px|rgb(0, 0, 0)",
             "Are you also|10px|rgb(255, 0, 0)", "Welcome to t|5px|rgb(255, 255, 0)", "Have a nice |0px|rgb(0, 0, 0)"], "borders")


@check("Tfrontend-02")
def pyq_6406532035118():
    eq(render(CODE["6406532035118"][0], "getComputedStyle(document.querySelector('p')).color"), "rgb(0, 0, 0)", "inline style wins: black")


@check("Tfrontend-03")
def pyq_640653586801():
    v = typed(CODE["640653586801"][0], "input", "madcourse.mail.com", "getComputedStyle(document.querySelector('input')).backgroundColor")
    eq((v[0], v[1], v[7], v[8], v[-1]), ("rgb(0, 128, 0)", "rgb(255, 0, 0)", "rgb(255, 0, 0)", "rgb(0, 128, 0)", "rgb(0, 128, 0)"), "green when empty, red 1-7, green from 8; final green")


@check("Tfrontend-04")
def pyq_640653771141():
    expr = ("(function(){var f=document.forms.myForm,a=[];window.alert=function(m){a.push(m)};"
            "var ok1=f.checkValidity(),msg=f.password.validationMessage;"
            "f.password.value='12345678';f.username.value='';var ok2=f.checkValidity();validateForm();"
            "f.username.value='u';f.password.value='abc';var ok3=f.checkValidity();validateForm();"
            "return [ok1,msg,ok2,ok3,a]})()")
    v = render(CODE["640653771141"][0], expr)
    eq((v[0], v[1] in ("Please fill out this field.", "Please fill in this field."), v[2], v[3], v[4]), (False, True, True, True, ["Username must be filled out", "Password must be at least 8 characters long"]), "validation (message wording follows the browser language: en-US 'fill out', en-GB 'fill in')")


@check("Tfrontend-05")
def pyq_640653856986():
    v = typed(CODE["640653856986"][0], "#password", "mad1password", "(function(){var i=document.querySelector('#password');return i.value.length+':'+getComputedStyle(i).backgroundColor})()")
    eq(v, ["0:rgb(255, 0, 0)"] + ["%d:rgb(255, 0, 0)" % n for n in range(1, 5)] + ["%d:rgb(0, 128, 0)" % n for n in range(5, 9)] + ["8:rgb(0, 128, 0)"] * 4, "red 1-4, green 5-8, stops at 8")


@check("Tfrontend-06")
def pyq_640653351998():
    eq(render(CODE["640653351998"][0], "document.getElementById('jsonobj').textContent"), "icecream, vanilla, cup", "text")


@check("Tfrontend-07")
def pyq_6406532035127():
    html = CODE["6406532035127"][0].replace("console.log(lst_items.length);", "window.__n = lst_items.length;")
    eq(render(html, "[window.__n, document.getElementsByTagName('li').length]"), [3, 3], "live collection length")


@check("Tfrontend-08")
def pyq_640653586808():
    opts = pack_options("640653586808")
    res = []
    for o in opts:
        src = re.search(r"```[\w]*\n(.*?)\n\s*```", o, re.S).group(1)
        try:
            json.loads(src); res.append(True)
        except ValueError:
            res.append(False)
    eq(res, [True, True, False, True], "valid JSON A-D")


@check("Tfrontend-09")
def pyq_6406531325147():
    html = CODE["6406531325147"][0]
    expr = ("(function(){var log=[];window.alert=function(m){log.push('alert:'+m)};console.log=function(m){log.push('log:'+m)};"
            "console.error=function(m){log.push('error:'+m)};var b=document.querySelectorAll('button');b[0].click();b[1].click();b[3].click();return log})()")
    eq(render(html, expr), ["alert:Hello, welcome", "log:Hello, welcome", "error:Hello, welcome"], "only Greet1 uses a dialog (alert); 2 and 4 write to the console")



# ================= lessons, quizzes, practice, test
def color(css, el, sel="p"):
    return render("<style>%s</style>%s" % (css, el), "getComputedStyle(document.querySelector('%s')).color" % sel)


def matches(selector, elements):
    html = "".join(elements)
    return render(html, "[...document.body.children].filter(function(e){return e.tagName!=='SCRIPT'}).map(function(e){return e.matches(%s)})" % json.dumps(selector))


@check("Tfrontend-10")
def script_src_vs_href():
    html = '<script src="data:text/javascript,window.__a=1"></script><script href="data:text/javascript,window.__b=1"></script>'
    eq(render(html, "[window.__a||0, window.__b||0]"), [1, 0], "src loads, href does not")


@check("Tfrontend-11")
def class_over_tag():
    eq(color("p{color:blue}.note{color:green}", '<p class="note">Hi</p>'), "rgb(0, 128, 0)", "green")


@check("Tfrontend-12")
def later_on_tie():
    eq(color(".a{color:red}.b{color:purple}", '<p class="a b">x</p>'), "rgb(128, 0, 128)", "purple")
    eq(color(".a{color:red}.b{color:purple}", '<p class="b a">x</p>'), "rgb(128, 0, 128)", "class order irrelevant")


@check("Tfrontend-13")
def id_over_class():
    eq(color("#x{color:red}.y{color:green}", '<p id="x" class="y">x</p>'), "rgb(255, 0, 0)", "red")
    eq(color("p{color:blue}.t{color:green}#q{color:red}", '<p id="q" class="t">x</p>'), "rgb(255, 0, 0)", "test item")


@check("Tfrontend-14")
def word_match():
    eq(matches("[class~=out]", ['<p class="box out"></p>', '<p class="outbox"></p>', '<p class="out"></p>']), [True, False, True], "matches")


@check("Tfrontend-15")
def note_and_substring():
    eq(matches("[class~=note]", ['<p class="notes"></p>', '<p class="big note"></p>', '<p class="note-1"></p>', '<p class="footnote"></p>']), [False, True, False, False], "~=")
    eq(matches("[class*=out]", ['<p class="outcontent"></p>']), [True], "*=")
    eq(matches("[class~=out]", ['<p class="outcontent"></p>']), [False], "~= no")


@check("Tfrontend-16")
def empty_validity():
    eq(render('<input id="a" required><input id="b" minlength="3">', "[document.getElementById('a').matches(':invalid'), document.getElementById('b').matches(':valid')]"), [True, True], "required empty invalid; minlength empty valid")


@check("Tfrontend-17")
def maxlength_typing():
    v = typed('<input id="m" maxlength="6">', "#m", "abcdefghij", "document.getElementById('m').value.length")
    eq(v[-1], 6, "typing stops at 6")


@check("Tfrontend-18")
def email_type():
    eq(render('<input id="e" type="email">', "(function(){var e=document.getElementById('e');e.value='abc';return e.checkValidity()})()"), False, "abc is not an email")


@check("Tfrontend-19")
def inner_html():
    html = '<p id="out"></p><div id="x"></div><script>document.getElementById("out").innerHTML = "Set by JS";document.getElementById("x").innerHTML = "<b>Hi</b>";</script>'
    eq(render(html, "[document.getElementById('out').textContent, document.querySelector('#x b').textContent]"), ["Set by JS", "Hi"], "innerHTML")


@check("Tfrontend-20")
def write_after_load():
    eq(render("<p>Old page</p>", "(function(){document.write('Hi');document.close();return document.body.textContent})()"), "Hi", "page replaced")


@check("Tfrontend-21")
def json_examples():
    ok = []
    for t in ('{"a": [1, 2]}', '{"a": ["k": 1]}', '{"a": {"k": 1}}', '{"k": ["a": 1]}'):
        try:
            json.loads(t); ok.append(True)
        except ValueError:
            ok.append(False)
    eq(ok, [True, False, True, False], "validity")


@check("Tfrontend-22")
def parse_order():
    html = """<script>var o=JSON.parse('{"name":"icecream","type":"cup","flavor":"vanilla"}');window.__s=o.type+", "+o.name;</script>"""
    eq(render(html, "window.__s"), "cup, icecream", "order")


@check("Tfrontend-23")
def json_quiz():
    ok = []
    for t in ("{'a': 1}", '{"a": True}', '{"a": null}', "{a: 1}", '[1, "two", 3]'):
        try:
            json.loads(t); ok.append(True)
        except ValueError:
            ok.append(False)
    eq(ok, [False, False, True, False, True], "validity")


@check("Tfrontend-24")
def parse_number():
    eq(render("<p></p>", """JSON.parse('{"x": 5}').x * 2"""), 10, "10")


@check("Tfrontend-25")
def static_list():
    html = '<ol id="lst"><li>a</li></ol><script>var s=document.querySelectorAll("li");document.getElementById("lst").innerHTML += "<li>b</li><li>c</li>";window.__n=s.length;</script>'
    eq(render(html, "window.__n"), 1, "static NodeList")
    html2 = '<ul id="l"><li>a</li><li>b</li></ul><script>var s=document.querySelectorAll("li");document.getElementById("l").innerHTML += "<li>c</li>";window.__n=s.length;</script>'
    eq(render(html2, "window.__n"), 2, "practice item")


@check("Tfrontend-26")
def live_five():
    html = '<div id="d"><p>1</p><p>2</p></div><script>var p=document.getElementsByTagName("p");document.getElementById("d").innerHTML += "<p>3</p><p>4</p><p>5</p>";window.__n=p.length;</script>'
    eq(render(html, "window.__n"), 5, "live")


@check("Tfrontend-27")
def inline_blue():
    eq(color("h1{color:red}", '<h1 style="color: blue">x</h1>', "h1"), "rgb(0, 0, 255)", "blue")


@check("Tfrontend-28")
def id_orange():
    eq(color(".a{color:green}#b{color:orange}", '<p id="b" class="a">x</p>'), "rgb(255, 165, 0)", "orange")


@check("Tfrontend-29")
def menu_and_exact():
    eq(matches("[id~=menu]", ['<p id="menu"></p>', '<p id="menu-top"></p>', '<p id="mainmenu"></p>', '<p id="top menu"></p>']), [True, False, False, True], "~=")
    eq(matches("[class=out]", ['<p class="out big"></p>', '<p class="out"></p>', '<p class="outer"></p>']), [False, True, False], "=")


@check("Tfrontend-30")
def text_content():
    eq(render('<p id="e"></p><script>document.getElementById("e").textContent="<b>x</b>";</script>', "[document.getElementById('e').textContent, document.querySelectorAll('#e b').length]"), ["<b>x</b>", 0], "plain text")


@check("Tfrontend-31")
def single_quotes():
    try:
        json.loads("{\"a\": 'b'}"); ok = True
    except ValueError:
        ok = False
    eq(ok, False, "single quotes invalid")


# ================= depth upgrade (MLT pattern)
@check("Tfrontend-32")
def specificity_ladder():
    css = "p{color:rgb(1,1,1)} .c{color:rgb(2,2,2)} #i{color:rgb(3,3,3)}"
    eq(color(css, '<p class="c" id="i">x</p>'), "rgb(3, 3, 3)", "id beats class beats tag")
    eq(color(css, '<p class="c" id="i" style="color:rgb(4,4,4)">x</p>'), "rgb(4, 4, 4)", "inline style beats the id rule")
    eq(color(css + " p{color:rgb(5,5,5)!important}", '<p class="c" id="i" style="color:rgb(4,4,4)">x</p>'), "rgb(5, 5, 5)", "!important beats inline style")


@check("Tfrontend-33")
def inner_vs_text():
    r = render("<p>x</p>", "(function(){var a=document.createElement('div');a.innerHTML='<b>x</b>';var b=document.createElement('div');b.textContent='<b>x</b>';return [a.querySelectorAll('b').length,b.querySelectorAll('b').length,b.innerHTML,a.textContent]})()")
    eq(r, [1, 0, "&lt;b&gt;x&lt;/b&gt;", "x"], "innerHTML parses tags; textContent shows them as text")


@check("Tfrontend-34")
def json_rules():
    r = render("<p>x</p>", "(function(){var r=[];['{\"a\":1}',\"{'a':1}\",'[1,2,]','{a:1}','\"hi\"','null'].forEach(function(t){try{JSON.parse(t);r.push('ok')}catch(e){r.push('err')}});r.push(JSON.stringify({a:undefined,b:1,c:[1,undefined]}));return r})()")
    eq(r, ["ok", "err", "err", "err", "ok", "ok", '{"b":1,"c":[1,null]}'], "JSON needs double quotes and no trailing comma; undefined is dropped (null in arrays)")


@check("Tfrontend-35")
def live_vs_static():
    r = render('<p class="k">a</p>', "(function(){var live=document.getElementsByClassName('k'),stat=document.querySelectorAll('.k');var n=document.createElement('p');n.className='k';document.body.appendChild(n);return [live.length,stat.length]})()")
    eq(r, [2, 1], "getElementsByClassName is live; querySelectorAll is a snapshot")
    r = render('<p class="item">1</p><p class="item">2</p><p class="item">3</p>', "(function(){var a=document.getElementsByClassName('item'),b=document.querySelectorAll('.item');for(var i=0;i<2;i++){var n=document.createElement('p');n.className='item';document.body.appendChild(n)}return [a.length,b.length]})()")
    eq(r, [5, 3], "three, then two more: live 5, snapshot 3")


@check("Tfrontend-36")
def validity_api():
    html = '<form><input id="e" type="email" value="x"><input id="r" required><input id="p" pattern="[0-9]{3}" value="12a"><input id="ok" type="email" value="a@b.co"></form>'
    r = render(html, "['e','r','p','ok'].map(function(i){return document.getElementById(i).checkValidity()})")
    eq(r, [False, False, False, True], "type, required and pattern each make a field invalid")


@check("Tfrontend-37")
def attribute_operators():
    els = ['<a href="https://iitm.ac.in/x.pdf" type="email" class="btn primary">a</a>', '<a href="http://site.com/page" class="btn-primary">b</a>']
    got = [matches(sel, els) for sel in ['[type]', '[type="email"]', '[class~="btn"]', '[href^="https"]', '[href$=".pdf"]', '[href*="iitm"]']]
    eq(got, [[True, False], [True, False], [True, False], [True, False], [True, False], [True, False]], "each operator matches only the first link")


if __name__ == "__main__":
    main()
