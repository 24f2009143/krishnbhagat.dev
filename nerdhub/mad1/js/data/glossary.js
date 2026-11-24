/* Glossary: every term in plain words. Topic chats append terms; ids are the terms themselves. [ADDED] */
APP.registerGlossary([
 {term:"HTTP",alias:["HyperText Transfer Protocol"],def:"The rules a browser and a server use to talk: the browser sends a **request** (a method such as GET and a URL), the server sends back a **response** (a status code, headers and a body)."},
 {term:"status code",alias:["status codes"],def:"A three-digit number at the top of every HTTP response. 200 means OK, 302 means redirect, 400 Bad Request, 404 Not Found, 405 Method Not Allowed, 500 server error."},
 {term:"URL",def:"The address of a resource, such as `http://127.0.0.1:5000/user/7?tab=info`: scheme, host, port, **path** (`/user/7`) and **query string** (`?tab=info`)."},
 {term:"query string",def:"The part of a URL after `?`, made of `key=value` pairs joined by `&`. Flask reads it with `request.args`."},
 {term:"route",def:"A rule that connects a URL pattern to a Python function. In Flask you write it with `@app.route(\"/path\")` above the function."},
 {term:"view function",def:"The Python function a route calls. Whatever it returns becomes the response body (or status and body)."},
 {term:"decorator",def:"A function that takes a function and returns a replacement for it. `@d` above `def f` means `f = d(f)`."},
 {term:"wrapper",def:"The inner function a decorator returns. Calls to the decorated name run the wrapper, which may or may not call the original function."},
 {term:"endpoint",def:"In Flask, the name of a route, by default the view function's name. `url_for` takes the endpoint, not the URL."},
 {term:"JSON",alias:["JavaScript Object Notation"],def:"A text format for data: objects in `{ }` with double-quoted keys, arrays in `[ ]`, strings in double quotes, numbers, `true`, `false`, `null`."},
 {term:"template",def:"A text file with placeholders that a program fills with data to produce HTML (Jinja2 uses `{{ }}` and `{% %}`)."},
 {term:"ORM",alias:["object-relational mapper"],def:"A library that lets you treat database rows as Python objects (Flask-SQLAlchemy is one)."},
 {term:"DOM",alias:["Document Object Model"],def:"The browser's tree of objects for a page. JavaScript reads and changes the page through it."},
 {term:"stateless",def:"Each request is handled on its own; the server keeps no memory of earlier requests unless something (such as a cookie) carries it."},
 {term:"bandwidth",def:"How much data can move per second, in bits per second (network) or bytes per second (memory)."}
]);
