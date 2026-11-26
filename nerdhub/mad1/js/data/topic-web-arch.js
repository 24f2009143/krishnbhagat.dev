/* web-arch: the request cycle, HTTP methods, statelessness and cookies, SSR vs CSR, cloud models and scaling.
 * Teaching prose is [ADDED] (bank-only mode). Behaviour that can be run is checked in tests/assertions_web-arch.py. */
APP.registerTopic("web-arch",{
 name:"Web Architecture, Protocols & Rendering",
 intro:"This topic is the map of the whole course. You follow one **HTTP request** from the browser to a server and back, and learn the words the exam uses for it: client and server, **stateless**, status codes, where a page is rendered, and how sites **scale** when more people arrive.\n\nEverything later is one stop on this journey. Flask is the program at the server's end, templates build the response, REST APIs send data instead of pages, and the database is what the server remembers between requests.",
 tagline:"What happens between typing a URL and seeing a page, and the words used to describe big web systems.",
 story:"Before Flask, before HTML, there is the trip a request makes: the browser finds the server's address, asks for a page, gets an answer, and draws it. This topic names every step of that trip, explains why the server forgets you between requests (and how cookies fix that), where the HTML is built (server or browser), and the vocabulary for running many servers: cloud service models, scaling up and out, ACID and BASE, redundancy and replication.\n\nThe PYQs here are short theory questions worth 2–3 marks each. They reward exact definitions, so each lesson ends with a comparison table of the pairs that get confused.",
 mindmap:{center:"The web",branches:[
  {t:"Request cycle",kids:["DNS lookup","HTTP request","response or error","browser renders"]},
  {t:"HTTP methods",kids:["GET: fetch","HEAD: headers only","POST, PUT, DELETE"]},
  {t:"State",kids:["stateless server","cookies carry state"]},
  {t:"Rendering",kids:["SSR: server builds HTML","CSR: browser builds DOM"]},
  {t:"Scale",kids:["SaaS, PaaS, IaaS","scale up vs out","ACID vs BASE","redundancy vs replication"]}]},
 connect:[["DNS","HTTP request","the browser needs the server's IP address before it can send a request"],["stateless","cookies","because the server forgets, the browser sends a cookie with every request"],["SSR","Flask templates","Flask with Jinja2 renders HTML on the server"],["scale up","scale out","one bigger machine versus more machines"]],
 roadmap:[["The request cycle and HTTP methods","cycle"],["Statelessness and cookies","state"],["Server-side and client-side rendering","rendering"],["Cloud models and scaling","scale"]],
 prereqs:["rf-http"],
 concepts:{
  "http-methods":{name:"The request cycle and HTTP methods",sub:"http-cookies-stateless",ease:1,repair:"Put the steps in the order data must exist: the browser cannot send a request before it knows the server's IP address (DNS), and it cannot draw a page before the response arrives. For methods, remember GET asks for a resource and gets headers and body, while HEAD asks for the same thing but gets only the headers."},
  "cookies-stateless":{name:"Statelessness and cookies",sub:"http-cookies-stateless",ease:1,repair:"HTTP is stateless: each request is handled on its own and the server keeps no memory of earlier requests. A cookie is a small piece of data the server asks the browser to store and send back with every later request, which is how a site recognises you, keeps you logged in, or remembers your language."},
  "ssr-csr":{name:"Server-side versus client-side rendering",sub:"ssr-csr",ease:2,repair:"Ask where the HTML for the content is built. In SSR the server builds it (Flask with Jinja2) and sends a complete page, which loads fast and is easy for search engines to read. In CSR the server sends a near-empty page plus JavaScript, and the browser fetches data (often JSON) and builds the page, which moves work from the server to the browser."},
  "cloud-models":{name:"Cloud service models",sub:"cloud-scaling",ease:2,repair:"Ask what the customer still manages. IaaS gives raw machines, storage and network: you install the OS and everything above it. PaaS gives a ready platform (OS, runtime, web server, database): you bring only your code. SaaS gives a finished application: you just use it."},
  "scaling":{name:"Scaling up and out; ACID and BASE",sub:"cloud-scaling",ease:2,repair:"Scaling up means making one machine bigger (more RAM, faster CPU); scaling out means adding more machines. ACID databases (atomic, consistent, isolated, durable) suit money and transactions; BASE systems (basically available, soft state, eventually consistent) suit huge, spread-out apps such as social media."},
  "redundancy-replication":{name:"Redundancy versus replication",sub:"cloud-scaling",ease:3,repair:"Redundancy means having spare components so the system keeps working when one fails: it is about reliability, not speed. Replication means keeping copies of the same data or service on several machines: the copies mean data survives if one is destroyed, and requests can be shared among them."}
 },
 sections:[
 {id:"cycle",mistakes:[["GET and POST differ only in name.", "GET asks to read and puts data in the URL; POST sends data in the body and is meant to change something.", "Where would a password typed into a GET form end up? (In the URL, browser history and server logs.)"], ["A 404 means the server is down.", "404 comes from a running server that has no page for that path; a down server gives no status at all.", "Which part answered with 404? (The server: so it is up.)"], ["The browser and server stay connected between pages.", "Each request is answered and then the exchange is over; the next page is a new request.", "Does the server know you opened page 1 before page 2 without a cookie? (No.)"]],terms:[["client", "the program that asks, usually your browser"], ["server", "the program that answers, waiting for requests"], ["HTTP", "the rules for how a request and a response are written"], ["method", "the verb of a request: GET reads, POST sends data"], ["status code", "a three-digit result: 200 ok, 404 not found, 500 server error"]],title:"The request cycle and HTTP methods",studying:"the steps from typing a URL to seeing the page, and what GET, HEAD, POST, PUT and DELETE mean",why:"order-of-steps and method questions appear in four papers",plain:"Find the server, ask it, get an answer, draw it.",concepts:["http-methods"],
  diagnostic:{id:"wa-diag-cycle",concept:"http-methods",type:"MCQ",stem:"What must the browser do before it can send an HTTP request to `example.com`?",options:["Render the page","Find the server's IP address using DNS","Receive the response","Store a cookie"],key:"B",diff:"easy",hints:["Requests go to an address, not a name."],explain:"A request is sent to an IP address, so the name `example.com` is first looked up with DNS."},
  core:[
   {t:"p",text:"A URL such as `https://example.com/home.html` names a **host** (`example.com`) and a **resource** (`/home.html`). Computers on the internet are reached by **IP address**, so the name must first be turned into an address by the **DNS** (Domain Name System)."},
   {t:"flow",caption:"The four steps of one page visit",W:560,H:400,nodes:[{id:"a",text:"1. DNS lookup:\nexample.com → IP",x:280,y:40,kind:"start",w:200,h:50},{id:"b",text:"2. browser sends\nHTTP(S) request",x:280,y:140,w:200,h:50},{id:"c",text:"3. server sends the resource\nor an error code",x:280,y:240,w:240,h:50},{id:"d",text:"4. browser assembles\nand displays the page",x:280,y:345,kind:"end",w:220,h:50}],edges:[["a","b"],["b","c"],["c","d"]]},
   {t:"table",title:"HTTP methods",head:["Method","Asks the server to","Response has a body?"],rows:[["GET","send a resource","yes"],["HEAD","send only the headers GET would send","no"],["POST","accept new data (a form, JSON)","usually"],["PUT","store or replace a resource","usually"],["DELETE","delete a resource","usually"]]},
   {t:"co",kind:"def",title:"GET versus HEAD",text:"**GET** retrieves a resource: status line, headers and body. **HEAD** is identical except the server sends **no body**, only the headers. HEAD is used to check whether something exists or has changed without downloading it."},
   {t:"code",lang:"python",title:"HEAD has the same headers but no body",src:String.raw`from flask import Flask
app = Flask(__name__)

@app.route("/page")
def page():
    return "Hello there"

c = app.test_client()
g, h = c.get("/page"), c.head("/page")
print(g.status_code, len(g.data), g.headers["Content-Length"])
print(h.status_code, len(h.data), h.headers["Content-Length"])`,lines:[[9,"Send a GET and a HEAD for the same URL."],[10,"GET: `200 11 11`: an 11-byte body. [assert:Tweb-arch-01]"],[11,"HEAD: `200 0 11`: same status and Content-Length header, but zero bytes of body. [assert:Tweb-arch-01]"]]},
   {t:"handTrace",title:"Order the steps",prompt:"Write the step number (1–4) for each event of a visit to `https://example.com/home.html`.",cols:["event","step"],given:[["browser sends HTTPS request for home.html","?"],["browser displays the page","?"],["server returns home.html or an error code","?"],["browser asks DNS for example.com's IP","?"]],blanks:[[0,1],[1,1],[2,1],[3,1]],key:["2","4","3","1"]},
   {t:"ex",level:"foundation",title:"Ordering the steps",problem:"Put these in order: (P) server responds, (Q) DNS lookup, (R) browser displays, (S) browser sends request.",asked:"The order.",idea:"Each step needs the output of the one before it.",steps:["The request needs an IP address, so DNS (Q) is first.","With the address, the browser sends the request (S).","The server responds (P).","Only then can the browser display the page (R)."],answer:"Q, S, P, R",mistake:"Putting the request first: it has nowhere to go without an address."},
   {t:"ex",level:"exam",title:"Judging two statements about GET",problem:"Statement 1: GET is the same as HEAD and transfers only headers. Statement 2: GET retrieves a resource from the server using its URI.",asked:"Which statements are correct?",idea:"HEAD is the headers-only one.",steps:["GET returns headers and the body; HEAD returns headers only. So statement 1 describes HEAD, not GET: false.","Statement 2 is the definition of GET: true."],answer:"Only statement 2",mistake:"Accepting statement 1 because GET and HEAD share headers.",asserts:["Tweb-arch-01"]},
   {t:"co",kind:"notice",text:"HTTPS is HTTP sent through an encrypted connection (TLS). The steps are the same; a secure handshake is added before the request."}
  ],
  deep:[
   {t:"compare",title:"Pairs that get confused",cols:["","GET","HEAD","POST"],rows:[["Purpose","fetch","check headers","send data"],["Body in response","yes","no","usually"],["Data sent in","the URL (query string)","the URL","the request body"],["Safe to repeat","yes","yes","not always"]]},
   {t:"table",title:"Vocabulary",head:["Term","Meaning"],rows:[["Client-server model","clients request, servers respond; the two roles are kept separate"],["Software architecture pattern","a standard way to organise an app, such as MVC (Model-View-Controller)"],["Internet Protocol (IP)","the rules for addressing and routing packets across the internet"],["HTTP request method","the verb of a request: GET, POST, PUT, DELETE, HEAD"]]}
  ],
  remember:["DNS first: the name becomes an IP address.","Then request, response (or error code), and display.","GET returns headers and body; HEAD returns headers only.","MVC is a software architecture pattern; IP addresses and routes data."],
  teachBack:{prompt:"Why can't the request be the first step of a page visit?",model:"The request is sent to an IP address, which the browser only knows after the DNS lookup."},
  quiz:[
   {id:"wa-c-q1",concept:"http-methods",type:"MCQ",stem:"Which method returns the same headers as GET but no body?",options:["POST","PUT","HEAD","DELETE"],key:"C",diff:"easy",hints:["Headers only."],explain:"HEAD.",asserts:["Tweb-arch-01"]},
   {id:"wa-c-q2",concept:"http-methods",type:"MCQ",stem:"\"MVC\" is an example of:",options:["an HTTP method","a software architecture pattern","an internet protocol","a client"],key:"B",diff:"easy",hints:["Model-View-Controller."],explain:"MVC organises an application into model, view and controller: an architecture pattern."},
   {id:"wa-c-q3",concept:"http-methods",type:"TF",stem:"In a page visit, the server's response comes before the DNS lookup.",key:"B",diff:"easy",hints:["How does the request find the server?"],explain:"False. DNS comes first; the response is third."}
  ]},
 {id:"state",mistakes:[["The server remembers who you are because you logged in.", "HTTP is stateless; the browser sends a cookie on every request and the server looks you up from it.", "Delete the cookie and reload: are you still logged in? (No.)"], ["A cookie stores the whole user account.", "A cookie is usually a small id; the real data stays on the server (a session).", "How large can a cookie be? (About 4 KB, so it cannot hold everything.)"]],terms:[["stateless", "the server keeps no memory of earlier requests"], ["cookie", "a small note the server asks the browser to send back with every request"], ["session", "data the server keeps for one user, found again through a cookie"]],title:"Statelessness and cookies",studying:"why the server forgets you between requests, and how cookies let a site recognise you",why:"two PYQs test the meaning of stateless and what cookies do",plain:"HTTP has no memory; a cookie is a note the browser hands back every time.",concepts:["cookies-stateless"],
  core:[
   {t:"co",kind:"def",title:"Stateless",text:"A **stateless** server keeps no information about the client between requests. Each request must carry everything the server needs. HTTP is stateless by design: it makes servers simpler and easier to scale."},
   {t:"co",kind:"analogy",text:"A stateless server is a shop assistant who forgets every customer the moment they leave. A cookie is a loyalty card the shop gives you; you show it each visit and the assistant knows who you are. The analogy stops working here: you can read and delete the card (cookies live in your browser)."},
   {t:"co",kind:"def",title:"Cookie",text:"A **cookie** is a small name–value pair the server sends with `Set-Cookie`; the browser stores it and sends it back in the `Cookie` header with later requests to that site. Cookies let a web app **recognise users** and store things like login status, language or location preferences."},
   {t:"code",lang:"python",title:"Setting and reading a cookie in Flask",src:String.raw`from flask import Flask, request, make_response
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
c.get("/set")
print(c.get("/hello").data.decode())`,lines:[[7,"The response carries `Set-Cookie: lang=ta`."],[11,"Later requests carry the cookie; Flask exposes it as `request.cookies`."],[14,"Before the cookie exists: `lang=none`. [assert:Tweb-arch-02]"],[16,"After `/set`, the browser (here the test client) sends it back: `lang=ta`. [assert:Tweb-arch-02]"]]},
   {t:"player",title:"A cookie round trip",frames:[
    {state:{text:"Browser → `GET /hello` (no cookie)"},caption:"The server knows nothing about this browser: it answers `lang=none`."},
    {state:{text:"Browser → `GET /set`\n\nServer → `Set-Cookie: lang=ta`"},caption:"The server asks the browser to store a cookie."},
    {state:{text:"Browser → `GET /hello` with `Cookie: lang=ta`"},caption:"The browser sends the cookie back automatically, so the server answers `lang=ta`. The server still stored nothing itself."}]},
   {t:"ex",level:"foundation",title:"Two statements about cookies",problem:"S1: cookies let a web app recognise users. S2: cookies can hold information such as location, login data and language.",asked:"Which are correct?",idea:"Both are standard uses of cookies.",steps:["Recognising a returning user is exactly what a session cookie does: S1 true.","Preference and login cookies store language, location and login state: S2 true."],answer:"Both correct",mistake:"Rejecting S2 because cookies are \"only ids\"."},
   {t:"ex",level:"exam",title:"What \"stateless\" means",problem:"Which describes a stateless server: (a) it is not on any particular machine, (b) it keeps no information about the client's state, (c) it is short-lived?",asked:"The right description.",idea:"Stateless is about memory of the client, not about location or lifetime.",steps:["(a) describes something like serverless or distributed hosting, not statelessness.","(b) is the definition: no stored client state between requests.","(c) \"ephemeral\" means short-lived, a different idea."],answer:"(b)",mistake:"Choosing \"all of these\"."}
  ],
  deep:[
   {t:"compare",title:"Where state can live",cols:["","Cookie","Server session","Database"],rows:[["Stored in","the browser","server memory or store, keyed by a cookie id","the server's database"],["Sent each request","yes","only the id","no"],["Survives server restart","yes","depends","yes"]]},
   {t:"co",kind:"extra",text:"Flask's `session` object stores data in a signed cookie. Not asked in these PYQs."}
  ],
  remember:["Stateless: the server keeps no client state between requests.","A cookie is stored by the browser and sent back with each request.","Cookies let sites recognise users and remember login, language, location.","Flask reads cookies with `request.cookies` and sets them with `set_cookie`."],
  teachBack:{prompt:"How can a stateless server still keep you logged in?",model:"It gives the browser a cookie, and the browser sends it with every request, so each request carries the state."},
  quiz:[
   {id:"wa-s-q1",concept:"cookies-stateless",type:"MCQ",stem:"Who stores a cookie between requests?",options:["The server's memory","The browser","The DNS server","The router"],key:"B",diff:"easy",hints:["Set-Cookie asks someone to store it."],explain:"The browser stores it and sends it back.",asserts:["Tweb-arch-02"]},
   {id:"wa-s-q2",concept:"cookies-stateless",type:"MCQ",stem:"\"HTTP is stateless\" means:",options:["it never uses cookies","each request is handled without memory of earlier ones","it cannot send data","it runs without a server"],key:"B",diff:"easy",hints:["Memory between requests."],explain:"Each request stands alone."},
   {id:"wa-s-q3",concept:"cookies-stateless",type:"TF",stem:"A cookie set by `/set` is sent back by the browser on a later request to `/hello` on the same site.",key:"A",diff:"easy",hints:["Same site."],explain:"True: cookies are sent with every later request to that site.",asserts:["Tweb-arch-02"]}
  ]},
 {id:"rendering",mistakes:[["Client-side rendering means no server is involved.", "The server still sends the HTML skeleton, the JavaScript and the data; the browser assembles the page.", "Where does the data for a CSR page come from? (An API on a server.)"], ["SSR pages cannot have any JavaScript.", "An SSR page arrives finished, but scripts can still run on it afterwards.", "Can a Flask template page include a <script> tag? (Yes.)"]],terms:[["render", "turn data and templates into the page you see"], ["SSR", "server-side rendering: the server sends a finished HTML page"], ["CSR", "client-side rendering: JavaScript in the browser builds the page"], ["SEO", "how easily search engines can read a page"]],title:"Server-side and client-side rendering",studying:"where the page's HTML is built: on the server (SSR) or in the browser (CSR)",why:"two PYQs compare SSR and CSR",plain:"SSR sends a finished page; CSR sends a skeleton and builds the page in the browser.",concepts:["ssr-csr"],
  core:[
   {t:"co",kind:"def",title:"SSR and CSR",text:"**Server-side rendering (SSR):** the server builds the complete HTML for each request (Flask + Jinja2 templates) and sends it ready to display. **Client-side rendering (CSR):** the server sends a nearly empty HTML page plus JavaScript; the browser runs the script, fetches data (usually JSON) and builds the page (the DOM) itself."},
   {t:"compare",title:"SSR versus CSR",cols:["","SSR (e.g. Flask + Jinja2)","CSR (JS + JSON API)"],rows:[["HTML arrives","complete","nearly empty skeleton"],["First page load","fast: content is already there","slower: script must run and fetch"],["Search engines (SEO)","easy to read","harder: content appears only after JS"],["Server work per page","higher: builds HTML","lower: sends data, browser renders"],["Later updates","often a new page","small updates without reload"]]},
   {t:"code",lang:"python",title:"The same data, rendered two ways",src:String.raw`from flask import Flask, render_template_string, jsonify
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
print(c.get("/api").data.decode().strip())`,lines:[[7,"SSR: the server fills the template and sends finished HTML."],[11,"CSR's data source: only JSON; the browser's JavaScript would build the list."],[14,"Prints `<ul><li>tea</li><li>milk</li></ul>`. [assert:Tweb-arch-03]"],[15,"Prints `[\"tea\",\"milk\"]`. [assert:Tweb-arch-03]"]]},
   {t:"yourMove",id:"wa-move-render",title:"Which is it?",state:"A page's HTML arrives as `<div id=\"app\"></div><script src=\"app.js\"></script>`, and the list appears a moment later.",prompt:"Is this SSR or CSR?",choices:["SSR","CSR","Neither","Both"],key:"B",why:["SSR would send the list inside the HTML.","Yes: an empty container plus a script that builds the content is client-side rendering.","It is one of the two.","Only the browser builds this content."]},
   {t:"ex",level:"foundation",title:"Advantage of Jinja2 SSR",problem:"Which is a key advantage of Jinja2 server-side rendering over JSON-based client-side rendering: (a) no later data fetches ever, (b) faster first load and better SEO without client-side template logic, (c) the client renders everything?",asked:"The best advantage.",idea:"SSR sends finished content.",steps:["(a) overclaims: interactive updates may still need fetches.","(b) is the standard SSR advantage.","(c) describes CSR, not SSR."],answer:"(b)",mistake:"Picking (c), which is the opposite model."},
   {t:"ex",level:"exam",title:"Two statements",problem:"S1: in SSR the browser receives a nearly empty HTML skeleton and builds the DOM with JavaScript. S2: CSR reduces the server's processing load by moving rendering to the browser.",asked:"Which are correct?",idea:"S1 describes CSR, not SSR.",steps:["The empty skeleton plus JavaScript is CSR's behaviour, so S1 is false.","CSR does move rendering to the browser, lowering server work: S2 true."],answer:"Only statement 2",mistake:"Missing that S1 swapped the two models."}
  ],
  deep:[
   {t:"p",text:"**Hydration and hybrids** (extra, not asked): modern frameworks often render the first page on the server and then let JavaScript take over in the browser, to get both fast first loads and smooth updates."}
  ],
  remember:["SSR: the server sends complete HTML (Flask + Jinja2).","CSR: the server sends a skeleton and JS; the browser builds the DOM.","SSR: faster first load, better SEO.","CSR: less server rendering work, smoother partial updates."],
  teachBack:{prompt:"Why is SSR better for search engines?",model:"The content is already in the HTML the server sends, so a crawler can read it without running JavaScript."},
  quiz:[
   {id:"wa-r-q1",concept:"ssr-csr",type:"MCQ",stem:"A Flask view returns `render_template(\"list.html\", items=items)`. This is:",options:["CSR","SSR","neither","a JSON API"],key:"B",diff:"easy",hints:["Who builds the HTML?"],explain:"The server fills the template: SSR.",asserts:["Tweb-arch-03"]},
   {id:"wa-r-q2",concept:"ssr-csr",type:"MCQ",stem:"Which reduces work on the web server for building pages?",options:["SSR","CSR","both equally","neither"],key:"B",diff:"easy",hints:["Who renders in CSR?"],explain:"CSR moves rendering to the browser."},
   {id:"wa-r-q3",concept:"ssr-csr",type:"TF",stem:"In CSR the first HTML received is usually a nearly empty skeleton.",key:"A",diff:"easy",hints:["The content is built later."],explain:"True."}
  ]},
 {id:"scale",mistakes:[["Horizontal scaling means a bigger machine.", "Bigger machine is vertical; horizontal adds more machines.", "Adding a second server behind a load balancer is which? (Horizontal.)"], ["Replication and redundancy are the same thing.", "Replication keeps copies of data; redundancy keeps spare parts (machines, disks) ready to take over.", "Two web servers with no shared data: replication or redundancy? (Redundancy.)"]],terms:[["IaaS / PaaS / SaaS", "renting machines / a ready platform / a finished app"], ["vertical scaling", "a bigger machine"], ["horizontal scaling", "more machines sharing the work"], ["replication", "keeping copies of the same data on several machines"], ["redundancy", "spare parts ready to take over when one fails"]],title:"Cloud models and scaling",studying:"SaaS, PaaS, IaaS; scaling up and out; ACID and BASE; redundancy and replication",why:"four PYQs test this vocabulary",plain:"Who manages what, bigger or more machines, strict or relaxed consistency, spares or copies.",concepts:["cloud-models","scaling","redundancy-replication"],
  core:[
   {t:"table",title:"Cloud service models",head:["Model","Provider gives","You manage","Example use"],rows:[["IaaS","machines, storage, network","OS, runtime, server, database, app","rent a virtual machine"],["PaaS","OS, runtime, web server, database","your code only","deploy a Flask app without managing servers"],["SaaS","the whole application","nothing; you use it","web email, online docs"]]},
   {t:"compare",title:"Scaling and consistency",cols:["Term","Meaning","Typical example"],rows:[["Scale up (vertical)","make one machine bigger","add RAM, faster CPU"],["Scale out (horizontal)","add more machines","more servers behind a load balancer"],["ACID","atomic, consistent, isolated, durable transactions","bank and financial transactions"],["BASE","basically available, soft state, eventually consistent","social media feeds"]]},
   {t:"compare",title:"Redundancy versus replication",cols:["","Redundancy","Replication"],rows:[["What","spare components that can take over","copies of the same data or service on several machines"],["Main goal","keep working when a part fails","data survives the loss of a copy; load can be shared"],["Improves speed?","not by itself","can, by spreading reads"]]},
   {t:"ex",level:"foundation",title:"Which cloud model",problem:"A developer wants an environment with a language runtime, OS, web server and database, so he only writes and runs code without managing servers, storage or networking. Which model?",asked:"SaaS, PaaS or IaaS.",idea:"Platform provided, code brought by the customer.",steps:["IaaS would leave the OS, server and database to him.","SaaS is a finished app; he wants to build his own.","PaaS provides exactly the platform and leaves the code to him."],answer:"PaaS",mistake:"Choosing IaaS because servers are involved."},
   {t:"ex",level:"exam",title:"Is one server enough?",problem:"Each server and the backbone link have 10 Gbps. The app serves 10,000 requests per second of 50 KB each (1 KB = 1000 B), with little CPU work. Is scaling out needed?",asked:"Required throughput and the sensible strategy.",idea:"Compare required bandwidth with what one server and the backbone can carry.",steps:["Bytes per second: $10{,}000 \\times 50{,}000 = 5 \\times 10^8$ B/s.","In bits: $5 \\times 10^8 \\times 8 = 4 \\times 10^9$ b/s $= 4$ Gbps.","4 Gbps is below one server's 10 Gbps, and every server shares the same 10 Gbps backbone, so more servers add no network capacity.","With CPU and memory sufficient, keep (or scale up) a single server; scaling out gains nothing here."],answer:"4 Gbps; a single server (scale up) is appropriate",mistake:"Scaling out by reflex: the shared backbone stays the limit.",asserts:["Tweb-arch-04"]},
   {t:"co",kind:"warn",text:"Read redundancy and replication questions word by word: redundancy is about surviving failures, replication is about copies (which also protect data and can share load). \"Redundancy improves performance\" is not its purpose."}
  ],
  deep:[
   {t:"p",text:"**Units.** Network speeds use bits per second (b/s); data sizes use bytes. Multiply bytes by 8. When a question says 50 KB it usually means 50,000 bytes; state the convention you use."},
   {t:"p",text:"**Load balancer.** Scaling out needs something to share requests among servers: a load balancer. It does not raise the capacity of a shared link above all the servers."}
  ],
  remember:["IaaS: machines; PaaS: platform (bring code); SaaS: finished app.","Scale up = bigger machine (RAM); scale out = more machines.","ACID for financial transactions; BASE for social media scale.","Redundancy = spares for failure; replication = copies of data/service."],
  teachBack:{prompt:"Why would scaling out not help when the bottleneck is a shared 10 Gbps backbone?",model:"All servers send through the same backbone, so adding servers adds no network capacity beyond it."},
  quiz:[
   {id:"wa-sc-q1",concept:"cloud-models",type:"MCQ",stem:"You rent virtual machines and install the OS and database yourself. Which model?",options:["SaaS","PaaS","IaaS","None"],key:"C",diff:"easy",hints:["Raw machines."],explain:"IaaS provides infrastructure; you manage the rest."},
   {id:"wa-sc-q2",concept:"scaling",type:"MCQ",stem:"Adding more RAM to the existing server is:",options:["scaling out","scaling up","replication","BASE"],key:"B",diff:"easy",hints:["Bigger, not more."],explain:"Vertical scaling: scale up."},
   {id:"wa-sc-q3",concept:"scaling",type:"NUM",stem:"How many Gbps do 2,000 requests per second of 100 KB each need (1 KB = 1000 B)?",key:1.6,tolerance:0.01,diff:"medium",hints:["Bytes × 8."],explain:"$2000 \\times 100{,}000 \\times 8 = 1.6 \\times 10^9$ b/s = 1.6 Gbps.",asserts:["Tweb-arch-05"]},
   {id:"wa-sc-q4",concept:"redundancy-replication",type:"MCQ",stem:"Keeping copies of a database on three machines so data survives if one disk is destroyed is mainly:",options:["replication","scaling up","SaaS","ACID"],key:"A",diff:"easy",hints:["Copies."],explain:"Keeping copies of data on several machines is replication."}
  ]}
 ],
 practice:[
  {id:"wa-p1",concept:"cookies-stateless",type:"MCQ",stem:"Which header does a server use to ask the browser to store a cookie?",options:["`Cookie`","`Set-Cookie`","`Location`","`Content-Type`"],key:"B",diff:"easy",hints:["The server sets it."],explain:"`Set-Cookie` in the response; the browser later sends `Cookie`.",asserts:["Tweb-arch-06"]},
  {id:"wa-p2",concept:"ssr-csr",type:"MCQ",stem:"A news site wants its articles indexed well by search engines and shown fast on first load. Which rendering suits it best?",options:["CSR","SSR","neither","only JSON"],key:"B",diff:"easy",hints:["Content in the first HTML."],explain:"SSR sends complete HTML: fast first load and easy indexing."},
  {id:"wa-p3",concept:"cloud-models",type:"MCQ",stem:"A team uses an online spreadsheet in the browser with nothing to install or manage. Which model?",options:["IaaS","PaaS","SaaS","None"],key:"C",diff:"easy",hints:["Finished application."],explain:"Software as a Service."},
  {id:"wa-p4",concept:"cloud-models",type:"MCQ",stem:"Which model leaves the operating system for the customer to manage?",options:["SaaS","PaaS","IaaS","All of them"],key:"C",diff:"medium",hints:["Lowest level."],explain:"In IaaS the customer installs and manages the OS."},
  {id:"wa-p5",concept:"scaling",type:"MCQ",stem:"Which kind of system is BASE usually chosen for?",options:["bank transfers","social media feeds","payroll","stock trades"],key:"B",diff:"easy",hints:["Eventually consistent is fine."],explain:"Social media tolerates short delays in consistency; money does not."},
  {id:"wa-p6",concept:"redundancy-replication",type:"TF",stem:"The main purpose of redundancy is to keep a system running when a component fails.",key:"A",diff:"easy",hints:["Spares."],explain:"True: redundancy is about fault tolerance."},
  {id:"wa-p7",concept:"redundancy-replication",type:"MCQ",stem:"Read requests are spread over three copies of the same database. This uses:",options:["replication","scaling up","SaaS","statelessness"],key:"A",diff:"medium",hints:["Copies."],explain:"Copies of the same data on several machines: replication, which also shares the load."}
 ],
 test:[
  {id:"wa-t1",concept:"http-methods",type:"MCQ",stem:"Which comes first when you open `https://site.org/a.html`?",options:["server response","DNS lookup","rendering","HTTPS request"],key:"B",diff:"easy",hints:["Name to address."],explain:"DNS gives the IP address before any request."},
  {id:"wa-t2",concept:"http-methods",type:"MCQ",stem:"A HEAD request to a page whose GET body is 11 bytes returns how many body bytes?",options:["0","11","headers only, 11 bytes","depends on the browser"],key:"A",diff:"medium",hints:["HEAD has no body."],explain:"HEAD returns headers only; the body is empty.",asserts:["Tweb-arch-01"]},
  {id:"wa-t3",concept:"cookies-stateless",type:"MCQ",stem:"Which lets a stateless site remember your language choice?",options:["DNS","a cookie","the HEAD method","scaling out"],key:"B",diff:"easy",hints:["Sent with every request."],explain:"A cookie stores the choice in the browser."},
  {id:"wa-t4",concept:"ssr-csr",type:"MCQ",stem:"\"The browser fetches JSON and builds the DOM with JavaScript\" describes:",options:["SSR","CSR","DNS","PaaS"],key:"B",diff:"easy",hints:["Built in the browser."],explain:"Client-side rendering."},
  {id:"wa-t5",concept:"scaling",type:"MCQ",stem:"Match: scale out → ?",options:["increasing RAM","adding more servers","financial transactions","social media"],key:"B",diff:"easy",hints:["Horizontal."],explain:"Scaling out adds machines."},
  {id:"wa-t6",concept:"redundancy-replication",type:"MCQ",stem:"Which statement is correct?",options:["Redundancy mainly improves performance.","Replication keeps copies so data survives the loss of one.","Replication means adding RAM.","Redundancy means eventually consistent."],key:"B",diff:"medium",hints:["Copies."],explain:"Replication keeps copies; redundancy is for fault tolerance, not mainly speed."}
 ],
 remember:{
  facts:["Page visit: DNS → request → response or error → display.","GET returns headers and body; HEAD returns headers only.","HTTP is stateless; cookies (stored by the browser) carry state.","SSR: server builds HTML (fast first load, SEO). CSR: browser builds DOM from JSON (less server rendering).","IaaS machines, PaaS platform, SaaS app.","Scale up = bigger machine; scale out = more machines; ACID = transactions; BASE = social scale.","Redundancy = spares for failure; replication = copies of data/service."],
  traps:[{text:"Saying GET transfers only headers.",cause:"confusing GET with HEAD"},{text:"Putting the HTTP request before DNS.",cause:"forgetting requests need an IP address"},{text:"Describing SSR as an empty skeleton built by JavaScript.",cause:"swapping SSR and CSR"},{text:"Choosing IaaS when the OS and database are provided.",cause:"mixing up who manages what"},{text:"Saying redundancy's purpose is performance.",cause:"mixing redundancy with replication"},{text:"Scaling out when a shared link is the limit.",cause:"forgetting the backbone is shared"}],
  formulas:[{tex:"\\text{Gbps} = \\frac{\\text{requests/s} \\times \\text{bytes} \\times 8}{10^9}",means:"network throughput needed",when:"scaling questions with request sizes"}],
  cues:[["\"correct order of tasks\" for a URL","DNS first, display last"],["\"same as HEAD\"","GET has a body; HEAD does not"],["\"stateless\"","no client information kept between requests"],["\"empty HTML skeleton\"","that is CSR"],["\"build, compile and run ... without worrying about servers\"","PaaS"],["\"increasing RAM\"","scale up"]],
  selector:[["compare the first HTML received","guessing by framework names","SSR if content is in it, CSR if not"],["ask who manages the OS","guessing by the word \"cloud\"","IaaS / PaaS / SaaS"]],
  examMoves:[["Statement pair","test each statement against the definition","45 s","watch for swapped terms"],["Match the following","fill the surest pair first, then eliminate","45 s","each item used once"],["Scaling choice","compute Gbps, compare with each limit","60 s","bits = bytes × 8"]],
  hooks:["DNS is the phone book; HTTP is the call.","HEAD is GET with its mouth shut.","SSR cooks in the kitchen; CSR ships ingredients to your table."]
 },
 methodCards:[{qType:"Order of steps",recipe:"Each step needs the previous one's output: DNS → request → response → display."},{qType:"Statement pairs",recipe:"Check each statement against its definition separately; look for swapped terms (GET/HEAD, SSR/CSR)."},{qType:"Cloud model",recipe:"What does the customer still manage? OS → IaaS; only code → PaaS; nothing → SaaS."},{qType:"Scaling",recipe:"Compute required Gbps; compare with each server and any shared link; pick up or out."}],
 flash:[
  {front:"First step of a page visit?",back:"DNS lookup of the host name.",kind:"idea"},
  {front:"GET vs HEAD",back:"Same headers; HEAD has no body.",kind:"trap"},
  {front:"Stateless server",back:"Keeps no client state between requests.",kind:"idea"},
  {front:"What do cookies let a site do?",back:"Recognise users; remember login, language, location.",kind:"idea"},
  {front:"Nearly empty HTML + JavaScript builds the page",back:"Client-side rendering (CSR).",kind:"cue"},
  {front:"SSR advantages",back:"Fast first load, better SEO.",kind:"idea"},
  {front:"PaaS",back:"Platform (OS, runtime, server, DB) provided; you bring code.",kind:"idea"},
  {front:"Scale up vs scale out",back:"Bigger machine (RAM) vs more machines.",kind:"trap"},
  {front:"ACID vs BASE examples",back:"ACID: financial transactions. BASE: social media.",kind:"idea"},
  {front:"Redundancy vs replication",back:"Spares for failure vs copies of data/service.",kind:"trap"}
 ],
 checklist:["I can order the steps of a page visit.","I can tell GET from HEAD.","I can explain statelessness and cookies.","I can tell SSR from CSR and give one advantage of each.","I can match SaaS, PaaS, IaaS, scale up/out, ACID/BASE, redundancy/replication."],
 cheat:{methods:["DNS → request → response → display.","SSR = server builds HTML; CSR = browser builds DOM.","Who manages the OS? IaaS. Only code? PaaS. Nothing? SaaS."],traps:["GET is not headers-only.","Redundancy is not for speed.","Scale out cannot beat a shared link."]}
});
