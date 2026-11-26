/* python-fund: decorators and logging. Teaching prose is [ADDED] (bank-only mode).
 * Every output printed here is checked in tests/assertions_python-fund.py (Python 3.12.12). */
APP.registerTopic("python-fund",{
 name:"Python Fundamentals",
 intro:"This topic covers the two Python features Flask leans on: **decorators** and **logging**. A decorator is a function that wraps another function, which is exactly what `@app.route` does, so once decorators make sense, Flask's routing stops looking like magic.\n\nLogging questions ask which messages appear for a given level and handler setup. Both kinds of PYQ are output-tracing: read the code line by line and say what prints.",
 tagline:"Decorators and logging: the two Python features the PYQs test, and the reason `@app.route` works.",
 story:"Two kinds of Python question appear in every paper. **Decorator questions** show a function with `@something` above it and ask what is printed. **Logging questions** show `logging.basicConfig(...)` and some `logging.info(...)` calls and ask which lines appear on the terminal.\n\nBoth are tracing questions: the answer is whatever the code really does, line by line. This topic teaches the two rules that decide them. A decorator *replaces* the function, so only the replacement's code runs. A logger prints a message only if its *level* is at least the threshold.",
 mindmap:{center:"Python tools",branches:[
  {t:"Functions are values",kids:["pass a function","return a function","closures remember"]},
  {t:"@decorator",kids:["f = d(f)","once, at definition","the wrapper runs on calls"]},
  {t:"Wrapper patterns",kids:["before / after prints","change the result","call twice or never"]},
  {t:"Stacking",kids:["nearest def wraps first","outer runs first on a call"]},
  {t:"Logging",kids:["DEBUG < INFO < WARNING < ERROR < CRITICAL","basicConfig(level, format)","sys.argv strings"]}]},
 connect:[["functions as values","decorator","a decorator is a function that takes and returns functions"],["decorator","@app.route","Flask's routes are decorators that register a function"],["wrapper","output","only what the wrapper does happens on a call"],["level threshold","printed lines","a call below the threshold prints nothing"]],
 roadmap:[["Functions are values","values"],["What @decorator does","decorate"],["Wrapper patterns","patterns"],["Stacked decorators","stacking"],["Logging and sys.argv","logging"]],
 prereqs:["rf-decorators"],
 concepts:{
  "decorator-replace":{name:"A decorator replaces the function",sub:"decorators",ease:1,repair:"Read `@d` above `def f` as the line `f = d(f)` placed right after the definition. From then on the name `f` means whatever `d` returned, usually a wrapper function. Every later call `f(...)` runs that wrapper, not the original body."},
  "dead-original":{name:"A wrapper that never calls the original",sub:"decorators",ease:2,repair:"Look inside the wrapper for a call to the function it received (often named `func`). If there is none, the original body never runs: its prints never happen and its return value is never used. The output comes only from the wrapper's own code."},
  "wrapper-order":{name:"What the wrapper runs, and in what order",sub:"decorators",ease:2,repair:"Number the wrapper's lines and execute them top to bottom. The original runs exactly where the wrapper calls it, and it may be called twice or not at all. A `return` sends a value back silently; only `print` writes to the terminal, and an outer `print(...)` runs after the wrapper has finished."},
  "wrapper-result":{name:"A wrapper that changes the result",sub:"decorators",ease:2,repair:"First compute what the original function returns for the given arguments. Then apply exactly what the wrapper does to that value (square it, add 5, reverse it, halve each item). Do the two steps separately so you do not mix up which happens first."},
  "stacked-order":{name:"Stacked decorators",sub:"decorators",ease:3,repair:"With `@a` above `@b` above `def f`, Python builds `f = a(b(f))`: the decorator nearest the function wraps first. On a call, the outer wrapper (`a`) starts first, calls the inner wrapper, which calls the original. Results therefore pass through `b`'s change first, then `a`'s."},
  "log-levels":{name:"Logging levels and the threshold",sub:"logging",ease:1,repair:"The five levels in order are DEBUG, INFO, WARNING, ERROR, CRITICAL. `basicConfig(level=X)` prints messages at X and above and silently drops the rest; with no level the threshold is WARNING. A call being reached does not mean it prints."},
  "log-format-argv":{name:"Log format and command-line arguments",sub:"logging",ease:2,repair:"The `format` string is copied exactly, so `%(levelname)s:%(message)s` gives `WARNING:text` with no space, and the default format is `LEVEL:root:message`. `sys.argv` is a list of strings: `sys.argv[0]` is the file name and the first argument is `sys.argv[1]`. Convert with `int(...)` before doing arithmetic."}
 },
 sections:[
 {id:"values",title:"Functions are values",studying:"passing functions around, returning them, and closures",why:"a decorator is nothing more than a function that takes and returns a function",plain:"A function name is a label on an object; you can hand that object to other functions.",concepts:["decorator-replace"],
  diagnostic:{id:"pf-diag-values",concept:"decorator-replace",type:"MCQ",stem:"```python\ndef shout(t):\n    return t.upper()\n\nsay = shout\nprint(say(\"hi\"))\n```\n\nWhat is printed?",options:["`hi`","`HI`","`shout`","an error"],key:"B",diff:"easy",hints:["`say` and `shout` are the same object."],explain:"`say = shout` makes a second name for the same function, so `say(\"hi\")` returns `HI`.",asserts:["Tpython-fund-01"]},
  core:[
   {t:"p",text:"In Python, `def greet(): ...` creates a **function object** and puts the label `greet` on it. Writing `greet` without brackets refers to the object; writing `greet()` *calls* it. Because a function is an object, you can store it in another name, pass it to another function, or return it from a function."},
   {t:"co",kind:"analogy",text:"A function is like a recipe card. `greet` is the card; `greet()` is cooking from it. You can hand the card to someone else (pass it), or someone can give you a new card (return it). The analogy breaks in one place: a card returned from inside another function can remember values from where it was written (a closure)."},
   {t:"code",lang:"python",title:"values.py",src:String.raw`def twice(f, x):
    return f(f(x))

def add3(n):
    return n + 3

print(twice(add3, 10))`,lines:[[1,"`twice` takes a function `f` and a value `x`."],[2,"It calls `f` on `x`, then calls `f` again on that result."],[7,"`twice(add3, 10)` = `add3(add3(10))` = `add3(13)` = `16`. [assert:Tpython-fund-02]"]]},
   {t:"co",kind:"def",title:"Closure",text:"A **closure** is an inner function that remembers variables of the function it was made in, even after that outer function has returned. Every decorator's wrapper is a closure: it remembers `func`, the function it wraps."},
   {t:"code",lang:"python",title:"A function that returns a function",src:String.raw`def make_adder(k):
    def add(n):
        return n + k
    return add

add5 = make_adder(5)
print(add5(10))`,lines:[[1,"Outer function with parameter `k`."],[2,"Inner function `add` uses `k` from the outer function."],[4,"Return the inner function itself (no brackets: not called)."],[6,"`add5` is the inner function, remembering `k = 5`."],[7,"`add5(10)` = `10 + 5` = `15`. [assert:Tpython-fund-03]"]]},
   {t:"ex",level:"foundation",title:"Passing a function",problem:"Using `twice` and `add3` above, what does `print(twice(add3, 0))` show?",asked:"The printed number.",idea:"`twice` applies `f` two times.",steps:["`twice(add3, 0)` returns `add3(add3(0))`.","Inner: `add3(0) = 3`.","Outer: `add3(3) = 6`, which is printed."],answer:"`6`",mistake:"Answering 3 (applying it once).",asserts:["Tpython-fund-04"]},
   {t:"ex",level:"exam",title:"Brackets or no brackets",problem:"What do `print(make_adder(2)(3))` and `print(make_adder(2))` show?",asked:"Both outputs.",idea:"`make_adder(2)` returns a function; adding `(3)` calls it.",steps:["`make_adder(2)` returns the inner `add` with `k = 2`.","`make_adder(2)(3)` calls it: `3 + 2 = 5`.","`print(make_adder(2))` prints the function object itself, shown as `<function make_adder.<locals>.add at 0x...>` (the address varies)."],answer:"`5`, then a `<function ...add ...>` description",mistake:"Expecting a number from `make_adder(2)` alone.",asserts:["Tpython-fund-05"]},
   {t:"co",kind:"notice",text:"`return add` hands back the function; `return add()` would call it and hand back its result. Decorators always use the first form: `return wrapper`."}
  ],
  deep:[
   {t:"compare",title:"Name, call, and reference",cols:["You write","Meaning","Example value"],rows:[["`add3`","the function object","`<function add3 ...>`"],["`add3(1)`","call it and use the result","`4`"],["`f = add3`","a second name for the same function","`f(1)` gives `4`"],["`return add3`","give the function back","caller can call it later"]]},
   {t:"p",text:"**Why this matters for decorators.** The decorator receives the function object (no brackets), builds a wrapper closure around it, and returns the wrapper (no brackets). Missing or extra brackets are the most common way to misread a decorator."}
  ],
  remember:["A function name is a label on a function object.","`f` refers to the function; `f()` calls it.","A closure remembers variables of the function that made it.","`return wrapper` returns a function; `return wrapper()` would return its result."],
  teachBack:{prompt:"What is the difference between `return add` and `return add()`?",model:"`return add` gives back the function itself to be called later; `return add()` calls it now and gives back its result."},
  quiz:[
   {id:"pf-v-q1",concept:"decorator-replace",type:"MCQ",stem:"```python\ndef apply(f, x):\n    return f(x) * 2\n\ndef inc(n):\n    return n + 1\n\nprint(apply(inc, 4))\n```\n\nOutput?",options:["`5`","`9`","`10`","`8`"],key:"C",diff:"easy",hints:["`inc(4)` first."],explain:"`inc(4) = 5`, doubled: `10`.",asserts:["Tpython-fund-06"]},
   {id:"pf-v-q2",concept:"decorator-replace",type:"MCQ",stem:"```python\ndef outer():\n    msg = \"hi\"\n    def inner():\n        return msg + \"!\"\n    return inner\n\nf = outer()\nprint(f())\n```\n\nOutput?",options:["`hi`","`hi!`","an error: `msg` no longer exists","`<function ...>`"],key:"B",diff:"medium",hints:["Closures remember outer variables."],explain:"`inner` is a closure that keeps `msg`, so `f()` returns `hi!`.",asserts:["Tpython-fund-07"]},
   {id:"pf-v-q3",concept:"decorator-replace",type:"TF",stem:"In `def d(func): ... return wrapper`, the decorator calls `wrapper` before returning it.",key:"B",diff:"easy",hints:["No brackets after `wrapper`."],explain:"False. `return wrapper` returns the function without calling it."}
  ]},
 {id:"decorate",title:"What @decorator does",studying:"the meaning of the `@` line and which code runs on a call",why:"every one of the 8 decorator PYQs depends on it",plain:"`@d` swaps your function for whatever `d` hands back.",concepts:["decorator-replace","dead-original"],
  core:[
   {t:"co",kind:"def",title:"The @ line",text:"`@d` written above `def f` means: define `f`, then immediately run `f = d(f)`. This happens **once**, when Python reads the definition. After that, the name `f` refers to whatever `d` returned."},
   {t:"code",lang:"python",title:"the usual shape",src:String.raw`def shout(func):
    def wrapper(name):
        return func(name).upper()
    return wrapper

@shout
def greet(name):
    return "hi " + name

print(greet("ram"))`,lines:[[1,"The decorator receives the original function as `func`."],[2,"It defines `wrapper`, which will replace `greet`."],[3,"The wrapper calls the original and changes its result."],[4,"It returns the wrapper (not called)."],[6,"`greet = shout(greet)`: the name `greet` now means `wrapper`."],[10,"`greet(\"ram\")` runs `wrapper(\"ram\")`: `\"hi ram\".upper()` → `HI RAM`. [assert:Tpython-fund-08]"]]},
   {t:"flow",caption:"What Python does with a decorated definition",W:560,H:300,nodes:[{id:"a",text:"read def greet",x:280,y:30,kind:"start"},{id:"b",text:"call shout(greet)",x:280,y:100},{id:"c",text:"shout returns wrapper",x:280,y:170,w:170},{id:"d",text:"greet = wrapper",x:280,y:250,kind:"end"}],edges:[["a","b"],["b","c"],["c","d"]]},
   {t:"co",kind:"warn",title:"Dead original",text:"If the wrapper never calls `func`, the original body **never runs**: none of its prints happen and its return value is never used. Many PYQs hide the real computation in the wrapper and put a distracting body in the original."},
   {t:"yourMove",id:"pf-move-dead",title:"Which body runs?",state:{code:String.raw`def modify(func):
    def wrapper(n):
        return n * 10
    return wrapper

@modify
def triple(n):
    return n * 3

print(triple(2))`,lang:"python"},prompt:"`triple(2)` is called. Which code computes the printed value?",choices:["`triple`'s body: `2 * 3`","the wrapper: `2 * 10`","both: `2 * 3 * 10`","neither: it prints the function"],key:"B",why:["`triple` now names `wrapper`, and the wrapper never calls `func`.","Yes: `triple(2)` runs `wrapper(2)`, which returns `20`; the original is never called.","That would need the wrapper to call `func`; it does not.","`print(triple(2))` calls the function, so a number is printed."]},
   {t:"ex",level:"foundation",title:"A wrapper that ignores the original",problem:"With `modify` and `triple` above, what is printed?",asked:"The printed value.",idea:"Rebind `triple = modify(triple)`, then trace only the wrapper.",steps:["`@modify` makes `triple` mean `wrapper`.","`triple(2)` runs `wrapper(2)`.","The wrapper returns `2 * 10 = 20`; `func` is never called."],answer:"`20`",mistake:"Answering 6, or 60.",asserts:["Tpython-fund-09"]},
   {t:"ex",level:"exam",title:"A list built only by the wrapper",problem:"Trace the code below.",code:String.raw`def update(func):
    def wrapper(N):
        out = []
        for i in range(N):
            out.append(i * i)
        return out
    return wrapper

@update
def func(N):
    return N + 100

print(func(4))`,lang:"python",asked:"The printed list.",idea:"Only the wrapper runs; it builds squares for `i` from 0 to `N - 1`.",steps:["`func` now names `wrapper`; the original (`N + 100`) never runs.","`wrapper(4)`: `i` takes 0, 1, 2, 3.","Squares: 0, 1, 4, 9."],answer:"`[0, 1, 4, 9]`",mistake:"Answering `104` from the original body.",asserts:["Tpython-fund-10"]}
  ],
  deep:[
   {t:"trace",title:"Trace of `greet(\"ram\")`",cols:["step","running","name","value"],rows:[["1","wrapper","name","ram"],["2","func (original greet)","returns","hi ram"],["3","wrapper","returns","HI RAM"],["4","print","shows","HI RAM"]],notes:["The call goes to the wrapper.","The wrapper calls the original.","It changes the result.","Only the final value is printed."]},
   {t:"p",text:"**Name of the decorated function.** After decoration, `greet.__name__` is `\"wrapper\"`, because `greet` now *is* the wrapper. (`functools.wraps` can copy the original name; it is not asked in PYQs.) [assert:Tpython-fund-11]"},
   {t:"co",kind:"extra",text:"Flask's `@app.route(\"/\")` is a decorator that records the function in the route table and returns the same function unchanged, so the view itself is not wrapped."}
  ],
  remember:["`@d` above `def f` means `f = d(f)`, once.","A call to `f` runs the wrapper.","If the wrapper never calls `func`, the original never runs.","The decorated function's `__name__` is the wrapper's."],
  teachBack:{prompt:"How do you find the output of a decorated function call?",model:"Rewrite the @ line as `f = d(f)`, then trace only the wrapper, noting where (or whether) it calls the original."},
  quiz:[
   {id:"pf-d-q1",concept:"dead-original",type:"MCQ",stem:"```python\ndef stop(func):\n    def wrapper():\n        return \"blocked\"\n    return wrapper\n\n@stop\ndef hello():\n    print(\"hi\")\n    return \"done\"\n\nprint(hello())\n```\n\nOutput?",options:["`hi` then `blocked`","`blocked`","`done`","`hi` then `done`"],key:"B",diff:"medium",hints:["Does the wrapper call `func`?"],explain:"Only the wrapper runs; it returns `blocked`. `hi` is never printed.",asserts:["Tpython-fund-12"]},
   {id:"pf-d-q2",concept:"decorator-replace",type:"MCQ",stem:"```python\ndef keep(func):\n    return func\n\n@keep\ndef f():\n    return 5\n\nprint(f())\n```\n\nOutput?",options:["`5`","`None`","an error","`keep`"],key:"A",diff:"easy",hints:["What does `keep` return?"],explain:"`keep` returns the original unchanged, so `f()` returns 5.",asserts:["Tpython-fund-13"]},
   {id:"pf-d-q3",concept:"dead-original",type:"MCQ",stem:"```python\ndef mute(func):\n    def wrapper(n):\n        return 0\n    return wrapper\n\n@mute\ndef double(n):\n    return 2 * n\n\nprint(double(21))\n```\n\nOutput?",options:["`42`","`0`","`21`","an error"],key:"B",diff:"easy",hints:["Trace only the wrapper."],explain:"The wrapper ignores `func` and returns 0.",asserts:["Tpython-fund-14"]}
  ]},
 {id:"patterns",title:"Wrapper patterns: before, after, change, repeat",studying:"the common shapes a wrapper takes and the output each one produces",why:"most decorator PYQs are one of these four shapes",plain:"Read the wrapper line by line; the original runs only where it is called.",concepts:["wrapper-order","wrapper-result"],
  core:[
   {t:"table",title:"Four wrapper shapes",head:["Shape","Wrapper body","Effect"],rows:[["before / after","`print(...)`; `r = func(x)`; `print(...)`; `return r`","prints around the call; the result is unchanged"],["change the result","`return func(a, b) ** 2`","the caller gets a transformed value"],["call twice","`r1 = func(); r2 = func(); return r1, r2`","the body runs twice; a tuple comes back"],["never call","`return something_else`","the original is dead code"]]},
   {t:"code",lang:"python",title:"before and after",src:String.raw`def log(func):
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

print(inc(1))`,lines:[[3,"Printed first."],[4,"The original runs here and prints `work`."],[5,"Printed after the original returns."],[6,"The result goes back to the caller without being printed."],[14,"Only now does the outer `print` show `2`. Full output: `in`, `work`, `out`, `2`. [assert:Tpython-fund-15]"]]},
   {t:"player",title:"Watch the order",frames:[
    {state:{code:String.raw`def wrapper(x):
    print("in")
    r = func(x)
    print("out")
    return r`,lang:"python",hl:[2],out:"in"},caption:"`inc(1)` runs `wrapper(1)`; the first line prints `in`."},
    {state:{code:String.raw`def wrapper(x):
    print("in")
    r = func(x)
    print("out")
    return r`,lang:"python",hl:[3],vars:{"r":"2"},out:"in\nwork"},caption:"The original runs here: it prints `work` and returns 2."},
    {state:{code:String.raw`def wrapper(x):
    print("in")
    r = func(x)
    print("out")
    return r`,lang:"python",hl:[4,5],out:"in\nwork\nout"},caption:"`out` is printed, then 2 is returned silently."},
    {state:{code:"print(inc(1))",lang:"python",hl:[1],out:"in\nwork\nout\n2"},caption:"The outer `print` finally shows the returned 2."}]},
   {t:"handTrace",title:"Fill the trace",prompt:"Trace `print(square_diff(7, 3))` where the wrapper returns `func(a, b) ** 2` and the original returns `a - b`.",cols:["step","expression","value"],given:[["1","func(7, 3)","?"],["2","result ** 2","?"],["3","printed","?"]],blanks:[[0,2],[1,2],[2,2]],key:["4","16","16"]},
   {t:"ex",level:"foundation",title:"Change the result",problem:"The wrapper returns `func(p, q) + 5`; the original `bar(a, b)` returns `a * b`. What does `print(bar(4, 5))` show?",code:String.raw`def modify(func):
    def wrapper(p, q):
        return func(p, q) + 5
    return wrapper

@modify
def bar(a, b):
    return a * b

print(bar(4, 5))`,lang:"python",asked:"The printed number.",idea:"Original first, then the wrapper's change.",steps:["`bar(4, 5)` runs `wrapper(4, 5)`.","`func(4, 5)` is the original: `4 * 5 = 20`.","The wrapper adds 5: `25`."],answer:"`25`",mistake:"Answering 20 or 45.",asserts:["Tpython-fund-16"]},
   {t:"ex",level:"exam",title:"Calling twice",problem:"What does the code below print?",code:String.raw`def twice(func):
    def wrapper():
        print("start")
        a = func()
        b = func()
        return a, b
    return wrapper

@twice
def ping():
    return "pong"

print(ping())`,lang:"python",asked:"Every printed line.",idea:"The wrapper prints once, calls the original twice, and returns a tuple.",steps:["`ping()` runs `wrapper()`: it prints `start`.","`func()` returns `pong` twice; nothing else prints (the original only returns).","The wrapper returns the tuple `('pong', 'pong')`, which the outer `print` shows."],answer:"`start` then `('pong', 'pong')`",mistake:"Printing `pong` on separate lines: the original returns, it does not print.",asserts:["Tpython-fund-17"]},
   {t:"co",kind:"tip",text:"Write the output column by column: a line appears only for each `print` that actually runs. A `return` adds no line until something prints it."}
  ],
  deep:[
   {t:"p",text:"**Tuples print with brackets and quotes.** `print(('a', 'b'))` shows `('a', 'b')`; `print(1, 2)` shows `1 2`. A wrapper that returns `res1, res2` returns one tuple."},
   {t:"compare",title:"print versus return inside the original",cols:["Original body","What appears","When"],rows:[["`print(\"x\")`","`x` on its own line","when the wrapper calls it"],["`return \"x\"`","nothing by itself","only if someone prints the result"]]}
  ],
  remember:["Execute the wrapper top to bottom; the original runs where it is called.","`return` is silent; only `print` writes a line.","A wrapper can transform the result before returning it.","Calling `func` twice runs the body twice."],
  teachBack:{prompt:"Why does `Hello, Ram!` come last in the before/after pattern when `greet` only returns it?",model:"`greet` returns the text to the wrapper, which prints its two messages and returns; only then does the outer print show the text."},
  quiz:[
   {id:"pf-p-q1",concept:"wrapper-order",type:"MCQ",stem:"```python\ndef log(func):\n    def wrapper(x):\n        print(\"in\")\n        r = func(x)\n        print(\"out\")\n        return r\n    return wrapper\n\n@log\ndef inc(x):\n    print(\"work\")\n    return x + 1\n\nprint(inc(1))\n```\n\nOutput?",options:["```\nin\nwork\nout\n2\n```","```\nin\nout\nwork\n2\n```","```\nwork\nin\nout\n2\n```","```\n2\nin\nwork\nout\n```"],key:"A",diff:"medium",hints:["The body runs where the wrapper calls it."],explain:"`in`, the body's `work`, `out`, then the outer print shows 2.",asserts:["Tpython-fund-15"]},
   {id:"pf-p-q2",concept:"wrapper-result",type:"NUM",stem:"A wrapper returns `func(a, b) ** 2`; the original returns `a - b`. What does `print(f(2, 5))` show?",key:9,diff:"easy",hints:["`2 - 5` first."],explain:"`2 - 5 = -3`; squared, 9.",asserts:["Tpython-fund-18"]},
   {id:"pf-p-q3",concept:"wrapper-order",type:"MCQ",stem:"```python\ndef twice(func):\n    def wrapper():\n        func()\n        func()\n    return wrapper\n\n@twice\ndef ping():\n    print(\"ping\")\n\nping()\n```\n\nOutput?",options:["`ping` once","`ping` twice","nothing","`ping` twice, then `None`"],key:"B",diff:"easy",hints:["Count the calls."],explain:"The original is called twice; `ping()` is not printed, so no `None` appears.",asserts:["Tpython-fund-19"]}
  ]},
 {id:"stacking",title:"Stacked decorators",studying:"two or more `@` lines above one function",why:"stacked-decorator PYQs reverse the order most people expect",plain:"The decorator nearest the function wraps it first; on a call, the outer one starts first.",concepts:["stacked-order"],
  core:[
   {t:"co",kind:"def",title:"Stacking rule",text:"With `@a` above `@b` above `def f`, Python builds `f = a(b(f))`. So `b` wraps the original first and `a` wraps the result. On a call, `a`'s wrapper runs first, calls `b`'s wrapper, which calls the original. The **result** therefore goes through `b`'s change first, then `a`'s."},
   {t:"code",lang:"python",src:String.raw`def a(f):
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

print(core())`,lines:[[11,"Outer decorator."],[12,"Inner decorator: applied first."],[16,"`core = a(b(core))`: prints `a(b(x))`. [assert:Tpython-fund-20]"]]},
   {t:"fig",caption:"Layers: the call goes in from the outside, the result comes out through the inner layer first",svg:"<svg class=\"fig-svg\" viewBox=\"0 0 440 200\" role=\"img\" aria-label=\"Nested boxes a around b around core\"><rect x=\"10\" y=\"10\" width=\"420\" height=\"180\" rx=\"12\" fill=\"var(--frontier-soft)\" stroke=\"var(--frontier)\"/><text x=\"24\" y=\"34\" font-size=\"14\" fill=\"var(--ink)\">a's wrapper (outer)</text><rect x=\"50\" y=\"50\" width=\"340\" height=\"120\" rx=\"10\" fill=\"var(--visited-soft)\" stroke=\"var(--visited)\"/><text x=\"64\" y=\"74\" font-size=\"14\" fill=\"var(--ink)\">b's wrapper (inner)</text><rect x=\"150\" y=\"95\" width=\"140\" height=\"50\" rx=\"8\" fill=\"var(--card)\" stroke=\"var(--ink2)\"/><text x=\"220\" y=\"125\" font-size=\"14\" text-anchor=\"middle\" fill=\"var(--ink)\">core()</text></svg>"},
   {t:"ex",level:"foundation",title:"Two string decorators",problem:"With `a`, `b` and `core` above, swap the two `@` lines (`@b` above `@a`). What is printed?",asked:"The printed text.",idea:"Now `core = b(a(core))`.",steps:["`a` is nearest the function, so it wraps first: `a(x)`.","`b` wraps that result: `b(a(x))`."],answer:"`b(a(x))`",mistake:"Keeping the old order.",asserts:["Tpython-fund-21"]},
   {t:"ex",level:"exam",title:"Reverse after halving",problem:"Trace the code below.",code:String.raw`def rev(func):
    def wrapper(l):
        return func(l)[::-1]
    return wrapper

def half(func):
    def wrapper(l):
        return [x / 2 for x in func(l)]
    return wrapper

@rev
@half
def squares(l):
    return [i ** 2 for i in l]

print(squares([2, 4, 6]))`,lang:"python",asked:"The printed list.",idea:"`squares = rev(half(squares))`: square, then halve, then reverse.",steps:["Original: `[4, 16, 36]`.","`half` (inner) divides each by 2: `[2.0, 8.0, 18.0]` (division always gives floats).","`rev` (outer) reverses: `[18.0, 8.0, 2.0]`."],answer:"`[18.0, 8.0, 2.0]`",mistake:"Reversing before halving, or writing `2` instead of `2.0`.",asserts:["Tpython-fund-22"]}
  ],
  deep:[
   {t:"code",lang:"python",title:"Decoration time, bottom-up",src:String.raw`def a(f):
    print("decorating with a")
    return f

def b(f):
    print("decorating with b")
    return f

@a
@b
def g():
    pass`,lines:[[2,"Runs once, when `@a` is applied."],[6,"Runs once, when `@b` is applied, which happens first."],[11,"Output, even though `g` is never called: `decorating with b`, then `decorating with a`. [assert:Tpython-fund-23]"]]},
   {t:"p",text:"**`/` always makes a float.** `8 / 2` is `4.0`, so lists that pass through a halving wrapper print with `.0` and with values such as `0.5` and `12.25`."}
  ],
  remember:["`@a @b def f` → `f = a(b(f))`.","The inner (nearest) decorator changes the result first.","Decoration-time prints run bottom-up, once.","`x / 2` is always a float."],
  teachBack:{prompt:"In `@rev @half def f`, which change is applied to the result first?",model:"`half`, because it is nearest the function and wraps the original directly; `rev` then works on half's output."},
  quiz:[
   {id:"pf-s-q1",concept:"stacked-order",type:"MCQ",stem:"`@x` above `@y` above `def f`. Which expression does Python build?",options:["`f = x(y(f))`","`f = y(x(f))`","`f = x(f); f = y(f)` with x last","`f = x(f) + y(f)`"],key:"A",diff:"easy",hints:["Nearest the def wraps first."],explain:"`y` wraps first, then `x` wraps that: `x(y(f))`."},
   {id:"pf-s-q2",concept:"stacked-order",type:"MCQ",stem:"```python\ndef add1(f):\n    def w(n):\n        return f(n) + 1\n    return w\n\ndef dbl(f):\n    def w(n):\n        return f(n) * 2\n    return w\n\n@add1\n@dbl\ndef ident(n):\n    return n\n\nprint(ident(5))\n```\n\nOutput?",options:["`11`","`12`","`10`","`6`"],key:"A",diff:"medium",hints:["dbl changes the result first."],explain:"`dbl` gives `5 * 2 = 10`, then `add1` gives `11`.",asserts:["Tpython-fund-24"]},
   {id:"pf-s-q3",concept:"stacked-order",type:"MCQ",stem:"Same `add1` and `dbl`, but the order is `@dbl` above `@add1`. What is `ident(5)`?",options:["`11`","`12`","`10`","`6`"],key:"B",diff:"medium",hints:["Now add1 is nearest."],explain:"`add1` first: 6; then `dbl`: 12.",asserts:["Tpython-fund-25"]}
  ]},
 {id:"logging",title:"Logging levels, format and sys.argv",studying:"which `logging` calls print, in what format, and how `sys.argv` feeds them",why:"3 logging PYQs are worth 13.5 marks",plain:"A message prints only if its level is at least the threshold; arguments arrive as strings.",concepts:["log-levels","log-format-argv"],
  core:[
   {t:"table",title:"The five levels",head:["Level","Number","Function"],rows:[["DEBUG","10","`logging.debug`"],["INFO","20","`logging.info`"],["WARNING","30","`logging.warning`"],["ERROR","40","`logging.error`"],["CRITICAL","50","`logging.critical`"]]},
   {t:"co",kind:"def",title:"Threshold",text:"`logging.basicConfig(level=X)` sets the **threshold**: a message prints only if its level number is at least X's. Without `level=`, the threshold is WARNING. Messages go to the terminal (standard error)."},
   {t:"code",lang:"python",title:"log.py",src:String.raw`import logging
import sys

logging.basicConfig(level=logging.INFO,
                    format="%(levelname)s - %(message)s")
a = int(sys.argv[1])
logging.debug("start")
logging.info(f"got {a}")
logging.warning("done")`,lines:[[4,"Threshold INFO: DEBUG messages are dropped."],[5,"Each line will look like `LEVEL - message`."],[6,"`sys.argv[1]` is the first argument, a string; `int(...)` converts it."],[7,"DEBUG < INFO: not printed."],[8,"Printed. With `python log.py 7`: `INFO - got 7`. [assert:Tpython-fund-26]"],[9,"Printed: `WARNING - done`. [assert:Tpython-fund-26]"]]},
   {t:"compare",title:"Format strings",cols:["format","example line"],rows:[["(default, no format)","`WARNING:root:done`"],["`%(levelname)s - %(message)s`","`WARNING - done`"],["`%(levelname)s:%(message)s`","`WARNING:done` (no space)"]]},
   {t:"co",kind:"def",title:"sys.argv",text:"`sys.argv` is the list of words on the command line. For `python log.py 25 5` it is `['log.py', '25', '5']`: index 0 is the file, and every item is a **string**."},
   {t:"ex",level:"foundation",title:"Which lines print",problem:"With `basicConfig(level=logging.WARNING)` (default format), the code calls `debug(\"d\")`, `info(\"i\")`, `warning(\"w\")`, `error(\"e\")`. What prints?",asked:"The printed lines.",idea:"Keep WARNING and above; default format `LEVEL:root:message`.",steps:["DEBUG and INFO are below WARNING: dropped.","`warning` prints `WARNING:root:w`.","`error` prints `ERROR:root:e`."],answer:"`WARNING:root:w` then `ERROR:root:e`",mistake:"Printing every call that is reached.",asserts:["Tpython-fund-27"]},
   {t:"ex",level:"exam",title:"A branch that reaches DEBUG",problem:"Trace `python div.py 9 3`.",code:String.raw`import logging, sys
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
a, b = int(sys.argv[1]), int(sys.argv[2])
logging.info("checking")
if a % b == 0:
    logging.debug(f"{b} divides {a}")
else:
    logging.warning(f"{b} does not divide {a}")`,lang:"python",asked:"Every printed line.",idea:"The branch taken reaches `debug`, which is below the threshold.",steps:["`a = 9`, `b = 3`.","`info(\"checking\")` prints `INFO - checking`.","`9 % 3 == 0`, so the `if` branch calls `debug`, which is below INFO: nothing printed.","The `else` branch does not run."],answer:"Only `INFO - checking`",mistake:"Adding a DEBUG line because the branch was taken.",asserts:["Tpython-fund-28"]}
  ],
  deep:[
   {t:"p",text:"**Where the lines go.** Logging writes to standard error, which the terminal shows mixed with `print` output; in exam questions treat both as \"on the terminal\"."},
   {t:"p",text:"**`basicConfig` acts once.** Only the first `basicConfig` call configures the root logger; later calls are ignored unless `force=True`. PYQs use one call."},
   {t:"code",lang:"python",title:"Strings, not numbers",src:String.raw`import sys
print(sys.argv[1] + sys.argv[2])
print(int(sys.argv[1]) + int(sys.argv[2]))`,lines:[[2,"With `python add.py 2 3`: string joining prints `23`. [assert:Tpython-fund-29]"],[3,"After `int`: prints `5`. [assert:Tpython-fund-29]"]]}
  ],
  remember:["DEBUG < INFO < WARNING < ERROR < CRITICAL.","`level=X` prints X and above; default threshold WARNING.","The format string is copied exactly; default is `LEVEL:root:message`.","`sys.argv[1]` is the first argument, a string."],
  teachBack:{prompt:"Why can a `logging.debug` line that is definitely reached print nothing?",model:"Because DEBUG is below the configured threshold, so the logger drops the message."},
  quiz:[
   {id:"pf-l-q1",concept:"log-levels",type:"MCQ",stem:"```python\nimport logging\nlogging.basicConfig(level=logging.ERROR)\nlogging.warning(\"w\")\nlogging.error(\"e\")\n```\n\nWhat prints?",options:["```\nWARNING:root:w\nERROR:root:e\n```","`ERROR:root:e`","nothing","`e`"],key:"B",diff:"easy",hints:["WARNING < ERROR."],explain:"Only ERROR and above; default format adds `ERROR:root:`.",asserts:["Tpython-fund-30"]},
   {id:"pf-l-q2",concept:"log-levels",type:"NUM",stem:"With `level=logging.WARNING`, how many of the five calls `debug`, `info`, `warning`, `error`, `critical` print a line?",key:3,diff:"easy",hints:["WARNING and above."],explain:"warning, error, critical: 3.",asserts:["Tpython-fund-31"]},
   {id:"pf-l-q3",concept:"log-format-argv",type:"SA",stem:"With `format='%(levelname)s:%(message)s'`, what exactly does `logging.warning('Saved')` print (threshold allows it)?",key:"WARNING:Saved",diff:"medium",hints:["Copy the format exactly."],explain:"Level name, colon, message, with no space: `WARNING:Saved`.",asserts:["Tpython-fund-32"]},
   {id:"pf-l-q4",concept:"log-format-argv",type:"MCQ",stem:"`python run.py 4 5` and the code prints `sys.argv[1] + sys.argv[2]`. Output?",options:["`9`","`45`","`run.py4`","an error"],key:"B",diff:"medium",hints:["Strings join."],explain:"Both are strings, so `+` joins them: `45`.",asserts:["Tpython-fund-29"]}
  ]}
 ],
 practice:[
  {id:"pf-pr1",concept:"decorator-replace",type:"MCQ",stem:"```python\ndef tag(func):\n    def wrapper(s):\n        return \"<b>\" + func(s) + \"</b>\"\n    return wrapper\n\n@tag\ndef name(s):\n    return s.title()\n\nprint(name(\"ana\"))\n```\n\nOutput?",options:["`ana`","`Ana`","`<b>Ana</b>`","`<b>ana</b>`"],key:"C",diff:"easy",hints:["Original first, then the wrapper."],explain:"`\"ana\".title()` is `Ana`; the wrapper adds the tags.",asserts:["Tpython-fund-33"]},
  {id:"pf-pr2",concept:"decorator-replace",type:"MCQ",stem:"After `@shout` decorates `greet` (with a wrapper called `wrapper`), what is `greet.__name__`?",options:["`greet`","`shout`","`wrapper`","`func`"],key:"C",diff:"medium",hints:["What does the name `greet` refer to now?"],explain:"`greet` is now the wrapper function, whose name is `wrapper`.",asserts:["Tpython-fund-11"]},
  {id:"pf-pr3",concept:"decorator-replace",type:"TF",stem:"A decorator's code (outside its wrapper) runs every time the decorated function is called.",key:"B",diff:"medium",hints:["When does `f = d(f)` happen?"],explain:"False. The decorator body runs once, at definition; only the wrapper runs on each call.",asserts:["Tpython-fund-23"]},
  {id:"pf-pr4",concept:"wrapper-order",type:"MCQ",stem:"```python\ndef note(func):\n    def wrapper():\n        r = func()\n        print(\"after\")\n        return r\n    return wrapper\n\n@note\ndef hi():\n    print(\"hi\")\n    return 1\n\nprint(hi())\n```\n\nOutput?",options:["```\nhi\nafter\n1\n```","```\nafter\nhi\n1\n```","```\nhi\n1\nafter\n```","```\n1\nhi\nafter\n```"],key:"A",diff:"medium",hints:["The original runs first inside the wrapper."],explain:"The original prints `hi`, the wrapper prints `after`, then the outer print shows 1.",asserts:["Tpython-fund-34"]},
  {id:"pf-pr5",concept:"wrapper-result",type:"MCQ",stem:"```python\ndef evens(func):\n    def wrapper(n):\n        return [x for x in func(n) if x % 2 == 0]\n    return wrapper\n\n@evens\ndef upto(n):\n    return list(range(1, n + 1))\n\nprint(upto(7))\n```\n\nOutput?",options:["`[1, 3, 5, 7]`","`[2, 4, 6]`","`[1, 2, 3, 4, 5, 6, 7]`","`[0, 2, 4, 6]`"],key:"B",diff:"medium",hints:["The original makes 1..7; the wrapper filters."],explain:"`upto(7)` gives 1 to 7; the wrapper keeps the even ones.",asserts:["Tpython-fund-35"]},
  {id:"pf-pr6",concept:"stacked-order",type:"MCQ",stem:"```python\ndef up(f):\n    def w(s):\n        return f(s).upper()\n    return w\n\ndef rev(f):\n    def w(s):\n        return f(s)[::-1]\n    return w\n\n@up\n@rev\ndef echo(s):\n    return s + \"!\"\n\nprint(echo(\"ab\"))\n```\n\nOutput?",options:["`!BA`","`BA!`","`AB!`","`!ba`"],key:"A",diff:"medium",hints:["`echo` gives `ab!`; rev, then up."],explain:"`ab!` reversed is `!ba`; upper: `!BA`.",asserts:["Tpython-fund-36"]},
  {id:"pf-pr7",concept:"stacked-order",type:"MCQ",stem:"`@a` above `@b` above `def g(): pass`, where each decorator prints its own name and returns the function unchanged. What prints when the file runs (g is never called)?",options:["`a` then `b`","`b` then `a`","nothing","only `a`"],key:"B",diff:"hard",hints:["Decoration is bottom-up."],explain:"`b` is applied first, then `a`, both at definition time.",asserts:["Tpython-fund-23"]},
  {id:"pf-pr8",concept:"log-levels",type:"MCQ",stem:"No `basicConfig` call at all. Which call prints?",options:["`logging.debug(\"x\")`","`logging.info(\"x\")`","`logging.warning(\"x\")`","none of them"],key:"C",diff:"easy",hints:["Default threshold."],explain:"The default threshold is WARNING, so only `warning` prints (`WARNING:root:x`).",asserts:["Tpython-fund-37"]},
  {id:"pf-pr9",concept:"log-format-argv",type:"MCQ",stem:"`python a.py 10` runs `print(sys.argv)`. Output?",options:["`['10']`","`['a.py', '10']`","`['a.py', 10]`","`10`"],key:"B",diff:"easy",hints:["Index 0 is the file name; everything is a string."],explain:"The list holds the script name and the argument, both as strings.",asserts:["Tpython-fund-38"]},
  {id:"pf-pr10",concept:"log-format-argv",type:"SA",stem:"With the default format and `level=logging.DEBUG`, what exactly does `logging.debug(\"ok\")` print?",key:"DEBUG:root:ok",diff:"medium",hints:["Default format: `LEVEL:root:message`."],explain:"The default format is `%(levelname)s:%(name)s:%(message)s`, and the logger name is `root`.",asserts:["Tpython-fund-39"]}
 ],
 test:[
  {id:"pf-t1",concept:"dead-original",type:"MCQ",stem:"```python\ndef mod(func):\n    def wrapper(n):\n        return [i for i in range(1, n + 1) if n % i == 0]\n    return wrapper\n\n@mod\ndef odds(n):\n    return [i for i in range(n) if i % 2]\n\nprint(odds(6))\n```\n\nOutput?",options:["`[1, 3, 5]`","`[1, 2, 3, 6]`","`[0, 2, 4]`","`[1, 2, 3, 4, 5, 6]`"],key:"B",diff:"medium",hints:["Only the wrapper runs."],explain:"The wrapper lists divisors of 6; the original never runs.",asserts:["Tpython-fund-40"]},
  {id:"pf-t2",concept:"wrapper-result",type:"NUM",stem:"Wrapper: `return func(a, b) * 3`. Original: `return a + b`. Value of `f(2, 4)`?",key:18,diff:"easy",hints:["Original first."],explain:"`2 + 4 = 6`, times 3 = 18.",asserts:["Tpython-fund-41"]},
  {id:"pf-t3",concept:"wrapper-order",type:"MCQ",stem:"A wrapper prints `A`, returns `func(x)`; the original prints `B` and returns `C`. What does `print(f(0))` show?",options:["`A B C` on three lines","`B A C` on three lines","`A C` on two lines","`C A B` on three lines"],key:"A",diff:"medium",hints:["Wrapper's print, then the original's, then the outer print."],explain:"`A` (wrapper), `B` (original), then `C` from the outer print.",asserts:["Tpython-fund-42"]},
  {id:"pf-t4",concept:"stacked-order",type:"MCQ",stem:"`@p` above `@q` above `def f`. On a call, whose wrapper starts first?",options:["`p`'s","`q`'s","the original's","both together"],key:"A",diff:"medium",hints:["`f = p(q(f))`."],explain:"The outer wrapper `p` is what `f` names, so it starts first and calls `q`'s."},
  {id:"pf-t5",concept:"log-levels",type:"MCQ",stem:"`basicConfig(level=logging.INFO)`; the code calls `debug`, `info`, `warning` once each. How many lines print?",options:["1","2","3","0"],key:"B",diff:"easy",hints:["INFO and above."],explain:"`info` and `warning` print: 2 lines.",asserts:["Tpython-fund-43"]},
  {id:"pf-t6",concept:"log-format-argv",type:"MCQ",stem:"`python c.py 7 2` and the code does `a, b = int(sys.argv[1]), int(sys.argv[2])` then `print(a // b)`. Output?",options:["`3`","`3.5`","`72`","an error"],key:"A",diff:"easy",hints:["Integer division."],explain:"`7 // 2 = 3`.",asserts:["Tpython-fund-44"]}
 ],
 remember:{
  facts:["`@d` above `def f` means `f = d(f)`, once at definition time.","A call to a decorated function runs the wrapper; the original runs only where the wrapper calls it.","`@a @b def f` → `f = a(b(f))`: the inner decorator changes the result first.","`return` is silent; only `print` writes a line.","Logging threshold: messages at or above `level` print; default WARNING; default format `LEVEL:root:message`.","`sys.argv` is a list of strings; `sys.argv[1]` is the first argument."],
  traps:[{text:"Counting prints or results from an original the wrapper never calls.",cause:"tracing the original instead of the wrapper"},{text:"Applying stacked decorators top-down.",cause:"reading the @ lines in reading order"},{text:"Printing a returned value inside the wrapper.",cause:"confusing return with print"},{text:"Showing a DEBUG line because its branch was taken.",cause:"forgetting the threshold"},{text:"Adding a space after the colon in `%(levelname)s:%(message)s`.",cause:"not copying the format exactly"},{text:"Doing arithmetic on `sys.argv` items without `int`.",cause:"forgetting they are strings"},{text:"Writing `2` instead of `2.0` after `/`.",cause:"forgetting `/` gives floats"}],
  formulas:[{tex:"f_{\\text{new}} = a(b(f))",means:"stacked decorators `@a @b def f`",when:"more than one @ line"},{tex:"\\text{print} \\iff \\text{level} \\ge \\text{threshold}",means:"when a logging call prints",when:"any logging question"}],
  cues:[["\"output of the following code\" with `@` above a def","rewrite as `f = d(f)`, trace the wrapper"],["two @ lines","build `a(b(f))`; inner change first"],["`basicConfig(level=...)` and several calls","drop calls below the level, then format"],["`python file.py args`","write `sys.argv` as a list of strings"]],
  selector:[["trace the wrapper","trace the original body","find what the name now refers to"],["compute the original's result, then the wrapper's change","doing both at once","two separate steps"]],
  examMoves:[["Decorator output","rebind, trace wrapper, list prints in order","60–90 s","count calls to func"],["Stacked decorators","build a(b(f)), apply inner change first","90 s","floats after `/`"],["Logging output","threshold, then format, then argv branch","60–90 s","no line for calls below the level"]],
  hooks:["The receptionist (wrapper) decides whether the manager (original) is ever seen.","Onion: the call goes in from the outside, the result comes out through the inner layer first.","Logging is a bouncer with a minimum level."]
 },
 methodCards:[{qType:"Decorator output",recipe:"Rewrite `@d` as `f = d(f)`; trace the wrapper top to bottom; the original runs only where `func(...)` is called."},{qType:"Stacked decorators",recipe:"Build `a(b(f))`; compute the original, apply `b`'s change, then `a`'s."},{qType:"Logging output",recipe:"Threshold from `level` (default WARNING); keep calls at or above it on the path taken; copy the format exactly."},{qType:"sys.argv",recipe:"Write the list `['file.py', 'arg1', ...]` as strings; convert with `int` where the code does."}],
 flash:[
  {front:"`@d` above `def f` means?",back:"`f = d(f)`, once, at definition time.",kind:"idea"},
  {front:"Wrapper never calls `func`: does the original run?",back:"No. Its prints and return value never happen.",kind:"trap"},
  {front:"`@a` above `@b` above `def f`?",back:"`f = a(b(f))`: b's change first, a's second.",kind:"formula"},
  {front:"Where does the original run inside a wrapper?",back:"Exactly where the wrapper calls `func(...)`.",kind:"idea"},
  {front:"`return x` versus `print(x)` in the original",back:"Return is silent; only print writes a line.",kind:"trap"},
  {front:"Logging levels in order",back:"DEBUG < INFO < WARNING < ERROR < CRITICAL.",kind:"formula"},
  {front:"Default logging threshold and format",back:"WARNING; `LEVEL:root:message`.",kind:"idea"},
  {front:"`sys.argv` for `python a.py 3 4`",back:"`['a.py', '3', '4']`: all strings.",kind:"idea"},
  {front:"Wording: \"python file.py ...\" in a logging question",back:"Write argv, take the branch, then apply the threshold.",kind:"cue"},
  {front:"`8 / 2` in a wrapper",back:"`4.0`: division gives floats.",kind:"trap"}
 ],
 checklist:["I can rewrite any `@` line as an assignment.","I can trace a wrapper that calls the original zero, one or two times.","I can apply stacked decorators in the right order.","I can list exactly which logging lines print and in what format.","I can write `sys.argv` for a command line."],
 cheat:{methods:["`@d` → `f = d(f)`; trace the wrapper.","Stacked: `a(b(f))`, inner change first.","Logging: threshold → format → branch."],traps:["Dead original body.","Return is not print.","DEBUG below INFO prints nothing.","`:` without a space in formats.","argv items are strings."]}
});
