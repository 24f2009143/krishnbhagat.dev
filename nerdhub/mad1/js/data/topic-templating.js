/* templating: string.Template, PyHTML and Jinja2. Teaching prose is [ADDED].
 * Every output is checked in tests/assertions_templating.py (Python 3.12.12, Jinja2 3.1.6, Flask 3.1.3, PyHTML 1.3.2). */
APP.registerTopic("templating",{
 name:"Templating & HTML Generation",
 intro:"This topic is about building HTML from data instead of writing it by hand. You start with Python's **string.Template** and **PyHTML**, then move to **Jinja2**, the template language Flask uses: variables, **filters**, loops, conditions and template inheritance.\n\nPYQs show a template and some data and ask for the exact output, so the skill is careful tracing: which placeholders are filled, what a filter changes, and what a loop produces.",
 tagline:"Turning data into HTML: Python's `string.Template`, PyHTML, and Jinja2 with Flask.",
 story:"A Flask view rarely writes HTML by hand. It fills a **template**: text with placeholders, completed with data for each request. This topic covers three ways to do it, from the simplest (`string.Template` with `$name`), through building HTML from Python function calls (PyHTML), to Jinja2, the engine behind Flask's `render_template` with `{{ }}`, `{% for %}`, macros and template inheritance.\n\nThe PYQs ask what a template produces, which call raises an error, and which template file Flask can find. All three come down to a handful of exact rules.",
 mindmap:{center:"Templates",branches:[
  {t:"string.Template",kids:["dollar-sign placeholders","substitute: KeyError if missing","safe_substitute: leaves the gap"]},
  {t:"PyHTML",kids:["html(head(...), body(...))","nesting = structure","render()"]},
  {t:"Jinja2",kids:["{{ expr }}","{% for %} … {% endfor %}","macros"]},
  {t:"Scope",kids:["{% set %} in a loop stays in the loop"]},
  {t:"Inheritance",kids:["{% extends \"base.html\" %}","{% block name %}"]},
  {t:"Flask",kids:["render_template(file, **data)","template_folder"]}]},
 connect:[["string.Template","Jinja2","both fill placeholders, but Jinja2 has loops, logic and inheritance"],["render_template","template_folder","Flask looks only in the configured template folder"],["URL converters","template data","values from the URL are passed into the template"]],
 roadmap:[["string.Template","stringtemplate"],["PyHTML","pyhtml"],["Jinja2 expressions and loops","jinja"],["Macros and {% set %} scope","scope"],["Template inheritance","inherit"],["Template folders and passing data","folders"]],
 prereqs:["rf-http"],
 concepts:{
  "template-substitute":{name:"substitute versus safe_substitute",sub:"string-template-pyhtml",ease:1,repair:"`Template(\"Hi $name\")` marks `$name` as a placeholder. `substitute` must find a value for every placeholder, or it raises `KeyError`; `safe_substitute` leaves any missing placeholder as it was. Extra keys that the template does not use are ignored by both."},
  "pyhtml-structure":{name:"PyHTML: structure from nested calls",sub:"string-template-pyhtml",ease:2,repair:"In PyHTML every HTML tag is a Python function, and the arguments of a call become that tag's children. So `html(head(title(\"T\")), body(h2(\"H\")))` puts the title inside the head and the heading inside the body, exactly as the brackets nest. `render()` returns the HTML text."},
  "jinja-loops":{name:"Jinja2 expressions, loops and macros",sub:"jinja2",ease:2,repair:"`{{ x }}` prints a value; `{% for i in items %} ... {% endfor %}` repeats a block for each item. A macro is a reusable template function defined with `{% macro name(args) %}` and called with `{{ name(...) }}`. Each `<p>` produced shows on its own line in the browser."},
  "jinja-scope":{name:"{% set %} inside a loop",sub:"jinja2",ease:3,repair:"In Jinja2 a `{% for %}` loop has its own scope. A variable created with `{% set %}` inside the loop disappears when the loop ends, so using it after `{% endfor %}` prints nothing (an undefined variable renders as an empty string)."},
  "jinja-inherit":{name:"Template inheritance",sub:"jinja2",ease:2,repair:"A child template starts with `{% extends \"base.html\" %}` and fills the parent's named holes with `{% block name %} ... {% endblock %}`, using the same block name as the parent. A block must have a name, and there is no `{% link %}` or `{% block \"file\" %}` syntax."},
  "template-folder":{name:"Template folders and passing data",sub:"jinja2",ease:2,repair:"`render_template(\"x.html\", key=value)` looks for `x.html` only in the app's template folder (`templates/` by default, or whatever `template_folder=` names), including its subfolders; other folders are ignored, giving `TemplateNotFound`. Keyword arguments become variables in the template, and values often come from URL converters."}
 },
 sections:[
 {id:"stringtemplate",title:"Python's string.Template",studying:"`$name` placeholders and the two ways to fill them",why:"three PYQs: two KeyError questions and one mixed with Jinja2",plain:"`substitute` insists on every value; `safe_substitute` leaves gaps.",concepts:["template-substitute"],
  diagnostic:{id:"tp-diag-st",concept:"template-substitute",type:"MCQ",stem:"`Template(\"Hi $name\").substitute({})` does what?",options:["returns `Hi $name`","returns `Hi `","raises KeyError","returns `Hi None`"],key:"C",diff:"easy",hints:["substitute insists."],explain:"`substitute` needs a value for `$name`, so it raises KeyError.",asserts:["Ttemplating-01"]},
  core:[
   {t:"p",text:"`string.Template` is the simplest template in Python's standard library. Placeholders are written `$name` (or `${name}`). You fill them with a dictionary or keyword arguments."},
   {t:"code",lang:"python",src:String.raw`from string import Template
t = Template("The $color car is near the $building.")
print(t.substitute(color="red", building="office"))
print(t.safe_substitute(color="green"))
print(t.substitute({"color": "blue", "building": "mall", "place": "Chennai"}))`,lines:[[3,"Both names given: `The red car is near the office.` [assert:Ttemplating-01]"],[4,"`building` missing, but `safe_substitute` keeps `$building`: `The green car is near the $building.` [assert:Ttemplating-01]"],[5,"The extra key `place` is ignored: `The blue car is near the mall.` [assert:Ttemplating-01]"]]},
   {t:"compare",title:"Two methods",cols:["","`substitute`","`safe_substitute`"],rows:[["missing value","raises `KeyError`","leaves `$name` in the text"],["extra keys","ignored","ignored"],["use when","every value must be present","partial filling is fine"]]},
   {t:"handTrace",title:"Which calls raise KeyError?",prompt:"Template: `\"$a and $b\"`. Write `KeyError` or the result.",cols:["call","result"],given:[["substitute(a=1)","?"],["safe_substitute(a=1)","?"],["substitute(a=1, b=2, c=3)","?"]],blanks:[[0,1],[1,1],[2,1]],key:["KeyError","1 and $b","1 and 2"]},
   {t:"ex",level:"foundation",title:"A missing name",problem:"`Template(\"$lang is $desc\")`. What do `substitute({'lang': 'Python'})` and `safe_substitute({'lang': 'Python'})` give?",asked:"Both results.",idea:"Only substitute raises.",steps:["`desc` is missing.","`substitute` raises `KeyError: 'desc'`.","`safe_substitute` returns `Python is $desc`."],answer:"KeyError, then `Python is $desc`",mistake:"Thinking safe_substitute raises too.",asserts:["Ttemplating-02"]},
   {t:"ex",level:"exam",title:"Template then Jinja2",problem:"`T1(\"... $c1 ... {{c2}} ...\").substitute({'c1': 'foundation', 'c2': 'diploma'})`, then the result is rendered by Jinja2 with `c2='diploma'`.",asked:"What each step prints.",idea:"`string.Template` only knows `$name`; `{{c2}}` is plain text to it but a placeholder to Jinja2.",steps:["Step 1 replaces `$c1` with `foundation`; `{{c2}}` stays as it is; the extra key `c2` is ignored.","Step 2: Jinja2 replaces `{{c2}}` with `diploma`."],answer:"First the text with `{{c2}}` still in it, then the fully filled sentence",mistake:"Thinking `substitute` fills `{{c2}}` because the key `c2` was passed.",asserts:["Ttemplating-03"]}
  ],
  deep:[{t:"p",text:"**Escaping.** `$$` in a Template means a literal `$`. An invalid placeholder such as `$1` raises `ValueError` in `substitute`."}],
  remember:["`$name` placeholders.","substitute: missing value → KeyError.","safe_substitute: missing value stays as `$name`.","Extra keys are ignored by both."],
  teachBack:{prompt:"When does `substitute` raise KeyError?",model:"When a placeholder in the template has no value in the arguments; extra arguments do not matter."},
  quiz:[
   {id:"tp-st-q1",concept:"template-substitute",type:"MCQ",stem:"Template `\"$x-$y\"`. Which raises KeyError?",options:["`substitute(x=1, y=2)`","`substitute(x=1)`","`safe_substitute(x=1)`","`substitute(x=1, y=2, z=3)`"],key:"B",diff:"easy",hints:["Missing y."],explain:"Only B lacks `y` and uses substitute.",asserts:["Ttemplating-04"]},
   {id:"tp-st-q2",concept:"template-substitute",type:"SA",stem:"What does `Template(\"$a and $b\").safe_substitute(a=1)` return?",key:"1 and $b",diff:"easy",hints:["Keeps the gap."],explain:"`$b` stays.",asserts:["Ttemplating-04"]},
   {id:"tp-st-q3",concept:"template-substitute",type:"TF",stem:"Passing an extra key that the template does not use makes `substitute` fail.",key:"B",diff:"easy",hints:["Extras."],explain:"False: extra keys are ignored.",asserts:["Ttemplating-01"]}
  ]},
 {id:"pyhtml",title:"PyHTML: HTML from nested Python calls",studying:"how PyHTML function calls map to HTML structure",why:"one 4.5-mark PYQ shows a PyHTML program",plain:"The brackets of the calls are the nesting of the tags.",concepts:["pyhtml-structure"],
  core:[
   {t:"code",lang:"python",src:String.raw`from pyhtml import *
page = html(head(title("Quiz")), body(h2("Hi"), p("One")))
print(page.render())`,lines:[[2,"`title` is an argument of `head`, so it sits inside `<head>`; `h2` and `p` are arguments of `body`."],[3,"`render()` returns the HTML text, indented. With PyHTML 1.3.2 each text is on its own line inside its tag. [assert:Ttemplating-05]"]]},
   {t:"co",kind:"def",title:"PyHTML",text:"In PyHTML each HTML element is a Python function (`html`, `head`, `body`, `div`, `p`, …). The positional arguments of a call are the children of that element, so the HTML tree follows the brackets of your Python code exactly."},
   {t:"ex",level:"foundation",title:"Where does each tag go?",problem:"`html(head(title(\"T\")), body(div(\"D\"), p(\"P\")))`: which tags are inside `<body>`?",asked:"The children of body.",idea:"Read the arguments of `body(...)`.",steps:["`body` receives `div(\"D\")` and `p(\"P\")`.","So `<div>` and `<p>` are inside `<body>`; `<title>` is inside `<head>`."],answer:"`<div>` and `<p>`",mistake:"Putting the div inside the head.",asserts:["Ttemplating-06"]},
   {t:"ex",level:"exam",title:"Siblings, not nesting",problem:"`body(h2(\"H\"), div(\"D\"), p(\"P1\"), p(\"P2\"))`: are the paragraphs inside the div?",asked:"Yes or no.",idea:"They are separate arguments of body, so they are siblings of the div.",steps:["`div(\"D\")` closes after its own argument.","`p(\"P1\")` and `p(\"P2\")` are further arguments of `body`."],answer:"No: div and both p are siblings in body",mistake:"Reading the paragraphs as children of the div because they come after it.",asserts:["Ttemplating-07"]}
  ],
  deep:[{t:"p",text:"**Formatting is not structure.** Different PyHTML versions indent the output differently (1.3.2 puts text on its own line). Exam options are judged by which tag contains which, not by spaces."}],
  remember:["Each tag is a function.","Arguments = children.","Separate arguments = siblings.","`render()` returns the HTML text."],
  teachBack:{prompt:"How do you know which tag a PyHTML element sits inside?",model:"It is inside the function call whose brackets contain it."},
  quiz:[
   {id:"tp-ph-q1",concept:"pyhtml-structure",type:"MCQ",stem:"In `html(head(title(\"X\")), body(p(\"Y\")))`, where is `<title>`?",options:["in body","in head","outside html","in p"],key:"B",diff:"easy",hints:["Which call holds it?"],explain:"It is an argument of `head`.",asserts:["Ttemplating-06"]},
   {id:"tp-ph-q2",concept:"pyhtml-structure",type:"MCQ",stem:"`div(p(\"a\"), p(\"b\"))` gives:",options:["two p inside one div","a div inside a p","three siblings","an error"],key:"A",diff:"easy",hints:["Arguments are children."],explain:"Both paragraphs are children of the div.",asserts:["Ttemplating-08"]},
   {id:"tp-ph-q3",concept:"pyhtml-structure",type:"TF",stem:"`render()` returns HTML text.",key:"A",diff:"easy",hints:["Printed."],explain:"True.",asserts:["Ttemplating-05"]}
  ]},
 {id:"jinja",title:"Jinja2 expressions, loops and macros",studying:"`{{ }}`, `{% for %}` and macros, and how the browser shows the result",why:"loops and macros appear in Jinja2 PYQs",plain:"`{{ }}` prints, `{% %}` controls, macros are reusable snippets.",concepts:["jinja-loops"],
  core:[
   {t:"table",title:"Jinja2 syntax",head:["Syntax","Meaning"],rows:[["`{{ x }}`","print a value"],["`{% for i in items %} … {% endfor %}`","repeat for each item"],["`{% if c %} … {% endif %}`","condition"],["`{% macro f(a) %} … {% endmacro %}` then `{{ f(x) }}`","reusable snippet"],["`{# note #}`","comment, not printed"]]},
   {t:"code",lang:"jinja",title:"index.html",src:String.raw`{% macro show(items) %}
  {% for c in items %}
    <p>{{ c }}</p>
  {% endfor %}
{% endmacro %}
{{ show(courses) }}`,lines:[[1,"Define a macro `show` that takes a list."],[3,"One `<p>` per item."],[6,"Call the macro with the list passed from Flask. For `[\"App1\", \"App2\"]` it produces `<p>App1</p>` and `<p>App2</p>`. [assert:Ttemplating-09]"]]},
   {t:"player",title:"Rendering the loop",frames:[
    {state:{text:"`courses = [\"App1\", \"App2\"]` arrives from `render_template(\"index.html\", courses=...)`"},caption:"Flask passes the list as a template variable."},
    {state:{text:"First pass: `c = App1` → `<p>App1</p>`"},caption:"The loop body is emitted once per item."},
    {state:{text:"Second pass: `c = App2` → `<p>App2</p>`"},caption:"The browser shows each paragraph on its own line: App1, then App2."}]},
   {t:"ex",level:"foundation",title:"Printing a list",problem:"`{% for x in [1, 2, 3] %}{{ x }} {% endfor %}`. Output?",asked:"The text.",idea:"The body repeats per item.",steps:["Item 1 → `1 `.","Item 2 → `2 `, item 3 → `3 `."],answer:"`1 2 3 `",mistake:"Expecting the list's brackets.",asserts:["Ttemplating-10"]},
   {t:"ex",level:"exam",title:"A list passed straight to {{ }}",problem:"`{{ items }}` with `items = [\"a\", \"b\"]`. What appears?",asked:"The text.",idea:"Printing a list shows its Python representation; a loop is needed for one item per line.",steps:["`{{ items }}` converts the list to text: `['a', 'b']`.","Jinja2 escapes the quotes in HTML, but the browser shows `['a', 'b']`."],answer:"`['a', 'b']`",mistake:"Expecting separate lines without a loop.",asserts:["Ttemplating-11"]}
  ],
  deep:[{t:"p",text:"**Whitespace.** Jinja2 keeps the spaces and newlines around tags; browsers collapse them, so only the tags decide the layout. Each `<p>` is a block, so it starts a new line."}],
  remember:["`{{ }}` prints; `{% %}` controls.","A for loop repeats its body per item.","Macros are template functions.","Each `<p>` shows on its own line."],
  teachBack:{prompt:"Why does a macro that emits `<p>` per course show the courses on separate lines?",model:"Each course becomes its own paragraph element, and paragraphs are block elements that start on a new line."},
  quiz:[
   {id:"tp-j-q1",concept:"jinja-loops",type:"MCQ",stem:"Which prints a variable in Jinja2?",options:["`{% x %}`","`{{ x }}`","`$x`","`{# x #}`"],key:"B",diff:"easy",hints:["Double braces."],explain:"`{{ x }}`."},
   {id:"tp-j-q2",concept:"jinja-loops",type:"SA",stem:"What does `{% for i in range(3) %}{{ i }}{% endfor %}` render?",key:"012",diff:"easy",hints:["range(3)."],explain:"0, 1, 2 joined: `012`.",asserts:["Ttemplating-12"]},
   {id:"tp-j-q3",concept:"jinja-loops",type:"TF",stem:"`{# … #}` text is printed in the output.",key:"B",diff:"easy",hints:["Comment."],explain:"False: it is a comment."}
  ]},
 {id:"scope",title:"Macros and {% set %} scope",studying:"what a `{% set %}` inside a loop leaves behind",why:"two recent PYQs (Apr 2026, Aug 2026) test exactly this",plain:"Variables set inside a for loop vanish after it.",concepts:["jinja-scope"],
  core:[
   {t:"co",kind:"warn",title:"Loop scope",text:"A `{% for %}` loop has its own scope. `{% set x = i %}` inside the loop creates `x` only for that loop. After `{% endfor %}`, `x` is undefined, and an undefined variable renders as an **empty string**."},
   {t:"code",lang:"python",src:String.raw`from jinja2 import Template
t = Template("{% for i in range(3) %}{% set x = i %}{% endfor %}[{{ x }}]")
print(t.render())`,lines:[[2,"`x` is set inside the loop, then printed after it."],[3,"Prints `[]`: nothing between the brackets. (Jinja2 3.1.6.) [assert:Ttemplating-13]"]]},
   {t:"yourMove",id:"tp-move-scope",title:"After the loop",state:{code:String.raw`{% for i in [1, 2, 3] %}
  {% set x = i %}
{% endfor %}
Output is: {{ x }}`,lang:"jinja"},prompt:"What follows \"Output is:\"?",choices:["3","nothing","1 2 3","an error"],key:"B",why:["Python would print 3, but Jinja2 loop variables do not escape the loop.","Yes: x is undefined after the loop and renders as empty.","Nothing was printed inside the loop.","Undefined variables render as empty, not an error, by default."]},
   {t:"ex",level:"foundation",title:"Set outside the loop",problem:"`{% set x = 0 %}{% for i in [1,2] %}{% set x = i %}{% endfor %}{{ x }}`. Output?",asked:"The rendered value.",idea:"The loop's `x` is a new variable inside the loop; the outer `x` is unchanged.",steps:["Outer `x = 0`.","Inside the loop a separate `x` is set.","After the loop the outer `x` is still 0."],answer:"`0`",mistake:"Answering 2 as in Python.",asserts:["Ttemplating-14"]},
   {t:"ex",level:"exam",title:"Carrying a value out with a namespace",problem:"How can a loop update a value used after it?",asked:"The Jinja2 way.",idea:"`namespace` objects can be changed inside loops.",steps:["`{% set ns = namespace(x=0) %}` before the loop.","Inside: `{% set ns.x = i %}`.","After: `{{ ns.x }}` gives the last value, 2 for `range(3)`."],answer:"use `namespace`: output 2",mistake:"Expecting a plain `set` to work.",asserts:["Ttemplating-15"]}
  ],
  deep:[{t:"p",text:"**Undefined.** By default Jinja2 uses `Undefined`, which prints as an empty string. Flask uses the same default, so a misspelled variable prints nothing rather than raising an error."}],
  remember:["`{% set %}` inside a for loop stays in the loop.","After the loop the variable is undefined → empty.","Use `namespace` to carry values out."],
  teachBack:{prompt:"Why does `{{ x }}` after the loop print nothing?",model:"The loop has its own scope; x was set only inside it, so outside it is undefined, which renders as an empty string."},
  quiz:[
   {id:"tp-s-q1",concept:"jinja-scope",type:"MCQ",stem:"`{% for i in range(3) %}{% set x = i %}{% endfor %}{{ x }}` renders:",options:["0","2","nothing","an error"],key:"C",diff:"medium",hints:["Loop scope."],explain:"x is undefined after the loop.",asserts:["Ttemplating-13"]},
   {id:"tp-s-q2",concept:"jinja-scope",type:"MCQ",stem:"`{{ missing_var }}` with no such variable renders:",options:["an error","`None`","an empty string","`missing_var`"],key:"C",diff:"easy",hints:["Default Undefined."],explain:"Undefined prints as empty.",asserts:["Ttemplating-16"]},
   {id:"tp-s-q3",concept:"jinja-scope",type:"TF",stem:"In Jinja2, `{% set %}` inside a for loop changes a variable of the same name defined before the loop.",key:"B",diff:"medium",hints:["Separate scope."],explain:"False.",asserts:["Ttemplating-14"]}
  ]},
 {id:"inherit",title:"Template inheritance",studying:"`{% extends %}` and `{% block %}`",why:"one PYQ asks for the correct child template",plain:"A child fills the parent's named blocks.",concepts:["jinja-inherit"],
  core:[
   {t:"code",lang:"jinja",title:"base.html and child.html",src:String.raw`{# base.html #}
<h3>Welcome</h3>
{% block content %}{% endblock %}

{# child.html #}
{% extends "base.html" %}
{% block content %}<p>Hello</p>{% endblock %}`,lines:[[3,"The parent defines a named hole `content`."],[6,"The child names its parent, in quotes, first."],[7,"It fills the hole with the same name. Rendering `child.html` gives the heading, then `<p>Hello</p>`. [assert:Ttemplating-17]"]]},
   {t:"table",title:"Correct and incorrect syntax",head:["Written","Valid?"],rows:[["`{% extends \"base.html\" %}` + `{% block abc %}`","yes"],["`{% block %}` (no name)","no: a block needs a name"],["`{% link template \"base.html\" %}`","no: not a Jinja2 tag"],["`{% block \"base.html\" %}`","no: blocks take a name, not a file"]]},
   {t:"ex",level:"foundation",title:"Filling a block",problem:"Base has `{% block abc %}{% endblock %}`. Which child is correct: `{% extends \"base.html\" %}{% block abc %}X{% endblock %}` or `{% extends \"base.html\" %}{% block %}X{% endblock %}`?",asked:"The correct child.",idea:"Blocks must be named, and the name must match.",steps:["The first names `abc`: valid.","The second has an unnamed block: a syntax error."],answer:"the first",mistake:"Thinking the name is optional.",asserts:["Ttemplating-18"]},
   {t:"ex",level:"exam",title:"A misnamed block",problem:"The child fills `{% block xyz %}` but the parent has only `abc`. What happens?",asked:"The rendered result.",idea:"A child block with no matching parent block is never shown.",steps:["The parent renders its own `abc` (empty).","The child's `xyz` has nowhere to go."],answer:"the child's content does not appear",mistake:"Expecting it to be appended.",asserts:["Ttemplating-19"]}
  ],
  deep:[{t:"p",text:"**`{{ super() }}`** inside a child block keeps the parent's block content as well. Not asked in PYQs."}],
  remember:["`{% extends \"file\" %}` first.","`{% block name %}…{% endblock %}` with the parent's name.","Blocks need names.","There is no `{% link %}` tag."],
  teachBack:{prompt:"What two lines make a child template?",model:"`{% extends \"base.html\" %}` and a `{% block name %}…{% endblock %}` with a block name the parent defines."},
  quiz:[
   {id:"tp-i-q1",concept:"jinja-inherit",type:"MCQ",stem:"Which line makes a template inherit from `base.html`?",options:["`{% include \"base.html\" %}`","`{% extends \"base.html\" %}`","`{% link \"base.html\" %}`","`{% block \"base.html\" %}`"],key:"B",diff:"easy",hints:["extends."],explain:"`extends`."},
   {id:"tp-i-q2",concept:"jinja-inherit",type:"TF",stem:"`{% block %}` without a name is valid Jinja2.",key:"B",diff:"easy",hints:["Names."],explain:"False: it raises a syntax error.",asserts:["Ttemplating-18"]},
   {id:"tp-i-q3",concept:"jinja-inherit",type:"MCQ",stem:"Base: `<h3>W</h3>{% block c %}B{% endblock %}`. Child extends it with `{% block c %}C{% endblock %}`. Output?",options:["`<h3>W</h3>B`","`<h3>W</h3>C`","`C`","`<h3>W</h3>BC`"],key:"B",diff:"medium",hints:["Child replaces the block."],explain:"The child's block replaces the parent's.",asserts:["Ttemplating-20"]}
  ]},
 {id:"folders",title:"Template folders and passing data",studying:"where Flask looks for templates and how data reaches them",why:"two PYQs: TemplateNotFound and URL data into a template",plain:"Flask searches one template folder; keyword arguments become template variables.",concepts:["template-folder"],
  core:[
   {t:"co",kind:"def",title:"Template folder",text:"`render_template(\"x.html\")` searches only the app's template folder: `templates/` next to the app by default, or the folder given by `Flask(__name__, template_folder=\"...\")`. Paths such as `\"public/home.html\"` are relative to that folder. A file anywhere else raises `TemplateNotFound` (a 500 error)."},
   {t:"code",lang:"python",src:String.raw`app = Flask(__name__, template_folder="my_templates")

@app.route("/")
def home():
    return render_template("public/home.html")

@app.route("/page")
def page():
    return render_template("page.html")`,lines:[[1,"Only `my_templates/` is searched now, not `templates/`."],[5,"Found at `my_templates/public/home.html`. [assert:Ttemplating-21]"],[9,"`page.html` lives in `templates/`, which is no longer searched: TemplateNotFound. [assert:Ttemplating-21]"]]},
   {t:"code",lang:"python",title:"URL data into a template",src:String.raw`@app.route("/text/size/<int:size>/<color>")
def set_size(size, color):
    style = {"font-size": str(size) + "px", "color": color}
    return render_template("index.html", css_style=style)`,lines:[[1,"`/text/size/20/red` gives `size=20`, `color=\"red\"`."],[4,"The dict reaches the template as `css_style`; `{{ css_style['color'] }}` prints `red`. [assert:Ttemplating-22]"]]},
   {t:"ex",level:"foundation",title:"Which URL makes red 20px text?",problem:"Using `set_size` above, which URL: `/text/size/red/20` or `/text/size/20/red`?",asked:"The URL.",idea:"The rule's order is size, then color, and size must be an int.",steps:["`/text/size/red/20`: `red` is not an int: 404.","`/text/size/20/red`: matches with size 20 and color red."],answer:"`/text/size/20/red`",mistake:"Using query parameters, which the rule does not read.",asserts:["Ttemplating-22"]},
   {t:"ex",level:"exam",title:"Two folders",problem:"With `template_folder=\"my_templates\"`, which work: `render_template(\"private/dashboard.html\")` (file in my_templates/private) and `render_template(\"index.html\")` (file in views/)?",asked:"Which render.",idea:"Only the configured folder and its subfolders are searched.",steps:["`my_templates/private/dashboard.html` exists: works.","`views/index.html` is outside: TemplateNotFound."],answer:"the dashboard works; index.html fails",mistake:"Thinking Flask also searches every folder.",asserts:["Ttemplating-21"]}
  ],
  deep:[{t:"p",text:"**Blueprints** can add more template folders. Not asked in these PYQs."}],
  remember:["Default folder: `templates/`.","`template_folder=` replaces it.","Subfolders work: `\"public/home.html\"`.","Keyword arguments become template variables."],
  teachBack:{prompt:"Why does `render_template(\"page.html\")` fail when `page.html` is in `templates/` but `template_folder=\"my_templates\"`?",model:"Flask then searches only my_templates, so templates/ is ignored."},
  quiz:[
   {id:"tp-f-q1",concept:"template-folder",type:"MCQ",stem:"With no `template_folder` argument, Flask looks for templates in:",options:["the app's folder","`templates/`","`static/`","every folder"],key:"B",diff:"easy",hints:["Default."],explain:"`templates/`.",asserts:["Ttemplating-23"]},
   {id:"tp-f-q2",concept:"template-folder",type:"MCQ",stem:"`render_template(\"a.html\", name=\"Ana\")`. In `a.html`, `{{ name }}` prints:",options:["`name`","`Ana`","nothing","an error"],key:"B",diff:"easy",hints:["Keyword → variable."],explain:"`Ana`.",asserts:["Ttemplating-23"]},
   {id:"tp-f-q3",concept:"template-folder",type:"TF",stem:"A missing template gives a 404 Not Found.",key:"B",diff:"medium",hints:["It is an exception in the view."],explain:"False: TemplateNotFound is an error inside the view, so 500.",asserts:["Ttemplating-23"]}
  ]}
 ],
 practice:[
  {id:"tp-p1",concept:"pyhtml-structure",type:"MCQ",stem:"`body(div(p(\"x\")), p(\"y\"))`: which paragraph is inside the div?",options:["x","y","both","neither"],key:"A",diff:"medium",hints:["Brackets."],explain:"Only `p(\"x\")` is an argument of `div`.",asserts:["Ttemplating-24"]},
  {id:"tp-p2",concept:"pyhtml-structure",type:"MCQ",stem:"`html(head(title(\"A\")), body(h1(\"B\")))`: where is `<h1>`?",options:["head","body","title","outside"],key:"B",diff:"easy",hints:["Argument of body."],explain:"Inside body.",asserts:["Ttemplating-06"]},
  {id:"tp-p3",concept:"jinja-loops",type:"SA",stem:"`{% for c in [\"x\", \"y\"] %}<{{ c }}>{% endfor %}` renders as what text?",key:"<x><y>",diff:"medium",hints:["Body per item."],explain:"`<x>` then `<y>` (Jinja2 does not escape by default outside Flask).",asserts:["Ttemplating-25"]},
  {id:"tp-p4",concept:"jinja-loops",type:"MCQ",stem:"A macro `m(n)` returns `{{ n * 2 }}`. What does `{{ m(4) }}` show?",options:["4","8","n*2","an error"],key:"B",diff:"easy",hints:["Called like a function."],explain:"8.",asserts:["Ttemplating-26"]},
  {id:"tp-p5",concept:"jinja-scope",type:"MCQ",stem:"`{% for i in [5] %}{% set y = i %}{{ y }}{% endfor %}` renders:",options:["5","nothing","an error","i"],key:"A",diff:"medium",hints:["Used inside the loop."],explain:"Inside the loop y exists: 5.",asserts:["Ttemplating-27"]},
  {id:"tp-p6",concept:"jinja-inherit",type:"MCQ",stem:"A child template must start with:",options:["`{% block %}`","`{% extends \"base.html\" %}`","`{% include %}`","`{{ base }}`"],key:"B",diff:"easy",hints:["Names the parent."],explain:"`extends`."},
  {id:"tp-p7",concept:"jinja-inherit",type:"TF",stem:"A child block whose name the parent does not define is shown at the end of the page.",key:"B",diff:"medium",hints:["Nowhere to go."],explain:"False: it is not shown.",asserts:["Ttemplating-19"]},
  {id:"tp-p8",concept:"template-folder",type:"MCQ",stem:"`Flask(__name__, template_folder=\"views\")` and `render_template(\"x.html\")`; `x.html` is in `templates/`. Result?",options:["renders","TemplateNotFound","404","empty page"],key:"B",diff:"medium",hints:["Only views/ is searched."],explain:"Not in views/: TemplateNotFound.",asserts:["Ttemplating-28"]}
 ],
 test:[
  {id:"tp-t1",concept:"template-substitute",type:"MCQ",stem:"`Template(\"$a $b\").substitute(a=1, b=2, c=3)`:",options:["`1 2`","KeyError","`1 2 3`","ValueError"],key:"A",diff:"easy",hints:["Extras ignored."],explain:"`1 2`.",asserts:["Ttemplating-29"]},
  {id:"tp-t2",concept:"template-substitute",type:"MCQ",stem:"Which never raises KeyError for a missing value?",options:["substitute","safe_substitute","both","neither"],key:"B",diff:"easy",hints:["safe."],explain:"safe_substitute."},
  {id:"tp-t3",concept:"pyhtml-structure",type:"MCQ",stem:"In PyHTML, the arguments of `div(...)` become:",options:["attributes","children of the div","siblings","text after the div"],key:"B",diff:"easy",hints:["Nesting."],explain:"Children.",asserts:["Ttemplating-08"]},
  {id:"tp-t4",concept:"jinja-loops",type:"MCQ",stem:"Which is a Jinja2 statement?",options:["`{{ x }}`","`{% if x %}`","`$x`","`<% x %>`"],key:"B",diff:"easy",hints:["Control."],explain:"`{% %}`."},
  {id:"tp-t5",concept:"jinja-scope",type:"MCQ",stem:"After `{% for i in [1,2] %}{% set z = i %}{% endfor %}`, `{{ z }}` renders:",options:["2","1","nothing","error"],key:"C",diff:"medium",hints:["Scope."],explain:"Empty.",asserts:["Ttemplating-13"]},
  {id:"tp-t6",concept:"template-folder",type:"MCQ",stem:"Rule `/u/<int:age>/<name>`. Which URL passes age 30 and name Ana into the template?",options:["`/u/Ana/30`","`/u/30/Ana`","`/u?age=30&name=Ana`","`/u/30`"],key:"B",diff:"easy",hints:["Order of the rule."],explain:"Path order: age, then name.",asserts:["Ttemplating-30"]}
 ],
 remember:{
  facts:["`$name` placeholders; substitute raises KeyError on a missing value; safe_substitute keeps `$name`; extra keys ignored.","PyHTML: call arguments are children.","Jinja2: `{{ }}` prints, `{% %}` controls, macros reuse.","`{% set %}` in a for loop does not survive the loop.","Inheritance: `{% extends %}` + named `{% block %}`.","Flask searches only the template folder; keyword args become variables."],
  traps:[{text:"Expecting substitute to fill `{{c2}}`.",cause:"mixing Template and Jinja2 syntax"},{text:"Thinking extra keys raise KeyError.",cause:"misremembering the rule"},{text:"Nesting PyHTML siblings.",cause:"reading order instead of brackets"},{text:"Expecting the last loop value after `{% set %}` in a loop.",cause:"applying Python scope rules"},{text:"An unnamed `{% block %}`.",cause:"forgetting blocks need names"},{text:"Expecting Flask to search every folder.",cause:"forgetting template_folder replaces the default"}],
  formulas:[],
  cues:[["\"will throw a KeyError\"","find the call that is substitute with a missing name"],["\"PyHTML ... corresponding HTML\"","follow the brackets"],["`{% set %}` inside `{% for %}`","empty after the loop"],["\"correct implementation of template inheritance\"","extends + named block"],["`template_folder=`","only that folder"]],
  selector:[["follow call brackets","following line order","nesting = brackets"],["check scope","Python intuition","Jinja2 loop scope"]],
  examMoves:[["KeyError question","missing name + substitute","30 s","extras ignored"],["Template output","fill Template, then Jinja2","60 s","`{{ }}` untouched by Template"],["Folder question","list which folder each file is in","60 s","default templates/ replaced"]],
  hooks:["safe_substitute leaves the gap; substitute shouts.","What happens in the loop stays in the loop."]
 },
 methodCards:[{qType:"Template KeyError",recipe:"For each call: substitute and a placeholder without a value → KeyError; otherwise fine."},{qType:"PyHTML output",recipe:"Arguments are children; compare structure, not spacing."},{qType:"Jinja2 output",recipe:"Expand loops item by item; `{% set %}` in a loop is gone afterwards; undefined prints empty."},{qType:"Template folder",recipe:"Configured folder (default templates/) and its subfolders only."}],
 flash:[
  {front:"substitute with a missing value",back:"KeyError.",kind:"trap"},
  {front:"safe_substitute with a missing value",back:"Leaves `$name`.",kind:"idea"},
  {front:"Extra keys in substitute",back:"Ignored.",kind:"trap"},
  {front:"PyHTML structure rule",back:"Arguments of a call are its children.",kind:"idea"},
  {front:"`{% set %}` inside `{% for %}`, used after",back:"Empty (undefined).",kind:"trap"},
  {front:"Child template lines",back:"`{% extends \"base.html\" %}` + `{% block name %}`.",kind:"idea"},
  {front:"Default template folder",back:"`templates/`; `template_folder=` replaces it.",kind:"idea"},
  {front:"Wording: \"TemplateNotFound\"",back:"The file is outside the template folder.",kind:"cue"},
  {front:"Undefined variable in Jinja2",back:"Renders as an empty string.",kind:"idea"}
 ],
 checklist:["I can say which Template call raises KeyError.","I can turn PyHTML calls into HTML structure.","I can render a Jinja2 loop and macro by hand.","I can explain why `{% set %}` in a loop vanishes.","I can write a correct child template.","I can say which templates Flask can find."],
 cheat:{methods:["substitute = strict; safe_substitute = lenient.","PyHTML: brackets = nesting.","Loops expand per item; set in loop vanishes.","extends + named block.","Only the template folder."],traps:["Template does not fill `{{ }}`.","Extras never raise.","Unnamed block is invalid."]}
});
