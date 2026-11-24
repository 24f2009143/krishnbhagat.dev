/* Refreshers: short prerequisites for topics not built yet. upgradesTo turns the card into a link to the full lesson
 * once that topic is ready. Checks of computed outputs: tests/assertions_refreshers.py. [ADDED] */
APP.registerRefreshers([
 {id:"rf-http",title:"One HTTP request, start to end",upgradesTo:"web-arch",summary:"Request, response, status code, in five minutes",
  blocks:[
   {t:"p",text:"When you type `http://127.0.0.1:5000/home` into a browser, the browser sends an **HTTP request** to the program listening on port 5000 of your own computer (`127.0.0.1` always means \"this machine\"). The request says *which method* (usually `GET`) and *which path* (`/home`)."},
   {t:"p",text:"The server answers with an **HTTP response**: a **status code**, some headers, and a body (often HTML). The browser shows the body. If the code is 404, it shows the server's \"Not Found\" page instead."},
   {t:"table",head:["Code","Name","Typical cause in Flask"],rows:[["200","OK","The view function returned normally"],["302","Found (redirect)","The view returned `redirect(...)`"],["400","Bad Request","`request.args['k']` with `k` missing"],["404","Not Found","No route matches the path"],["405","Method Not Allowed","The route exists but not for this method"]]},
   {t:"co",kind:"remember",text:"Path and query string are different parts: in `/user/7?tab=info` the path is `/user/7` and the query string is `tab=info`."}
  ],
  quiz:[{id:"rf-http-q1",concept:"status",type:"MCQ",stem:"A Flask app has only the route `@app.route('/home')`. What status code does `GET /about` get?",options:["200","302","404","405"],key:"C",diff:"easy",hints:["Does any route match the path /about?"],explain:"No route matches `/about`, so Flask answers 404 Not Found before any view function runs.",tag:"[ADDED]"}]},
 {id:"rf-decorators",title:"Decorators in one page",upgradesTo:"python-fund",summary:"Why @app.route works",
  blocks:[
   {t:"p",text:"A **decorator** is a function that receives a function and returns a function. Writing `@shout` above `def greet` is the same as writing `greet = shout(greet)` right after the definition."},
   {t:"code",lang:"python",src:"def shout(func):\n    def wrapper(name):\n        return func(name).upper()\n    return wrapper\n\n@shout\ndef greet(name):\n    return \"hi \" + name\n\nprint(greet(\"ram\"))",lines:[[1,"`shout` takes the original function as `func`."],[2,"It builds a new function, `wrapper`, that will run instead of `greet`."],[3,"The wrapper calls the original and changes its result."],[6,"`@shout` replaces `greet` with `shout(greet)`, that is, with `wrapper`."],[10,"Calling `greet(\"ram\")` runs `wrapper(\"ram\")`, which prints `HI RAM`. [assert:Trefreshers-01]"]]},
   {t:"co",kind:"tip",text:"`@app.route(\"/home\")` is a decorator too: it records \"the URL `/home` belongs to this function\" and hands the function back unchanged."}
  ],
  quiz:[{id:"rf-dec-q1",concept:"decorator",type:"MCQ",stem:"Using the `shout` decorator above, what does `print(greet(\"ab\"))` print?",options:["hi ab","HI AB","Hi Ab","an error"],key:"B",diff:"easy",hints:["Which function actually runs when you call greet?"],explain:"`greet` now names `wrapper`, which returns `\"hi ab\".upper()`, that is `HI AB`.",asserts:["Trefreshers-02"],tag:"[ADDED]"}]},
 {id:"rf-forms",title:"HTML forms, briefly",upgradesTo:"frontend",summary:"What a form sends and how",
  blocks:[
   {t:"p",text:"An HTML `<form>` collects inputs and sends them to the URL in its `action` attribute. With `method=\"get\"` the values travel in the query string; with `method=\"post\"` they travel in the request body, and Flask reads them with `request.form`."},
   {t:"code",lang:"html",src:"<form action=\"/login\" method=\"post\">\n  <input type=\"text\" name=\"user\" required>\n  <input type=\"submit\" value=\"Go\">\n</form>",lines:[[1,"Send the inputs to `/login` as a POST request."],[2,"The value is sent under the key `user`; `required` stops the browser from submitting an empty field."]]}
  ],
  quiz:[{id:"rf-forms-q1",concept:"form-method",type:"MCQ",stem:"A form uses `method=\"post\"`. Where does Flask find the field `user`?",options:["`request.args['user']`","`request.form['user']`","In the URL path","`request.json` only"],key:"B",diff:"easy",hints:["POST sends the fields in the body, not the query string."],explain:"POST form fields arrive in the request body and Flask exposes them as `request.form`.",tag:"[ADDED]"}]}
]);
