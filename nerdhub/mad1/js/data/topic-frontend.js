/* frontend: HTML, CSS, HTML5 validation, JavaScript output, JSON, DOM and AJAX. Teaching prose is [ADDED].
 * Browser behaviour is rendered in headless Chrome by tests/assertions_frontend.py. */
APP.registerTopic("frontend",{
 name:"Frontend Web Technologies (HTML, CSS, JavaScript & DOM)",
 tagline:"The page Flask sends: its structure (HTML), its look (CSS), its checks (HTML5) and its behaviour (JavaScript).",
 story:"Whatever a Flask view returns ends up in a browser. The browser reads the **HTML** to build the page, applies **CSS** rules to decide how it looks, enforces **HTML5** form rules before anything is sent, and runs **JavaScript** that can change the page through the **DOM**.\n\nThe PYQs ask you to be the browser: which colour wins, which border appears, when a box turns green, what the console prints, whether some text is valid JSON. Each lesson gives you the rule the browser follows, and every claim was checked by rendering it in Chrome.",
 mindmap:{center:"The browser side",branches:[
  {t:"HTML",kids:["structure and content","ul / ol / dl","<script src>"]},
  {t:"CSS",kids:["inline > #id > .class > tag","attribute selectors","~= matches a whole word"]},
  {t:"Forms",kids:["required, minlength, maxlength","type=email","valid / invalid styles"]},
  {t:"JavaScript",kids:["alert, console.log","document.write, innerHTML","JSON.parse"]},
  {t:"DOM & AJAX",kids:["live collections","innerHTML +=","update without reload"]}]},
 connect:[["HTML","CSS","CSS selects HTML elements and styles them"],["HTML5 attributes","Flask view","frontend checks run before the request; the view must check again"],["JSON","Flask jsonify","the format a Flask API sends and JavaScript parses"],["DOM","AJAX","AJAX fetches data, then JavaScript updates the DOM"]],
 roadmap:[["HTML structure and lists","html"],["Which CSS rule wins","cascade"],["Attribute selectors","attr"],[":valid and :invalid","validity"],["HTML5 validation and JS checks","html5"],["JavaScript output","jsout"],["JSON","json"],["The DOM and AJAX","dom"]],
 prereqs:["rf-forms","rf-http"],
 concepts:{
  "html-structure":{name:"HTML structure and the three languages",sub:"html-css",ease:1,repair:"HTML gives the page its content and structure, CSS gives it its look, and JavaScript adds behaviour. Use `<ul>` when order does not matter and `<ol>` when it does. An external script is linked with `<script src=\"file.js\"></script>`."},
  "css-cascade":{name:"Which CSS rule wins",sub:"html-css",ease:2,repair:"When several rules set the same property on an element, the more specific one wins: an inline `style` attribute beats an `#id` rule, which beats a `.class` rule, which beats a plain tag rule. Only when two rules are equally specific does the later one in the stylesheet win."},
  "attr-selectors":{name:"Attribute selectors",sub:"html-css",ease:3,repair:"`[attr=v]` needs the whole value to equal `v`. `[attr~=v]` needs `v` as one whole word in a space-separated list, so `[id~=out]` matches `id=\"out\"` but not `id=\"out-text\"`, and `[class~=out]` does not match `class=\"outcontent\"`."},
  "form-validation":{name:"HTML5 validation and :valid / :invalid",sub:"html5-validation",ease:2,repair:"The browser checks `required`, `minlength`, `maxlength` and `type` before submitting and shows its own message, such as \"Please fill out this field.\" The `:valid` and `:invalid` styles follow the field's state live as the user types; `minlength` only counts text the user has typed, and `maxlength` stops typing at the limit."},
  "js-output":{name:"JavaScript output methods",sub:"js-json-dom",ease:1,repair:"`alert(...)` opens a dialog box, `console.log` and `console.error` write to the developer console (not the page), and `document.write` writes into the document (after the page has loaded it replaces the whole page). To change part of a page, set an element's `innerHTML` or `textContent`."},
  "json-syntax":{name:"JSON syntax and parsing",sub:"js-json-dom",ease:2,repair:"JSON objects use `{ }` with keys in double quotes; arrays use `[ ]` and hold values only (no `key: value` pairs). Values can be strings in double quotes, numbers, `true`, `false`, `null`, objects or arrays, and arrays may mix types. `JSON.parse` turns JSON text into a JavaScript object whose properties you read by name."},
  "dom-live":{name:"The DOM and live collections",sub:"js-json-dom",ease:3,repair:"The DOM is the browser's tree of objects for the page, and scripts change the page by changing it. `getElementsByTagName` returns a live collection: it always reflects the current page, so elements added later are counted. `innerHTML +=` rewrites the container's content, adding the new elements."},
  "ajax":{name:"Asynchronous updates (AJAX)",sub:"ajax",ease:1,repair:"AJAX means JavaScript asks the server for data in the background and updates only part of the page, without reloading it. The user keeps working while the request runs, and only a small amount of data travels, so the page feels faster."}
 },
 sections:[
 {id:"html",title:"HTML structure, lists and linking scripts",studying:"what HTML is for, list tags, and how a page loads an external script",why:"three PYQs test the roles of HTML, CSS and JS, list tags and the script tag",plain:"HTML says what is on the page; CSS says how it looks; JS says what it does.",concepts:["html-structure"],
  diagnostic:{id:"fe-diag-html",concept:"html-structure",type:"MCQ",stem:"Which language defines a page's content and structure?",options:["CSS","HTML","JavaScript","JSON"],key:"B",diff:"easy",hints:["Headings, paragraphs, lists."],explain:"HTML defines content and structure; CSS styles it; JavaScript adds behaviour."},
  core:[
   {t:"table",title:"Three languages of the frontend",head:["Language","Job","Example"],rows:[["HTML","content and structure","`<h1>`, `<p>`, `<ul>`, `<form>`"],["CSS","presentation (styling)","`p { color: blue; }`"],["JavaScript","behaviour, optional extras","`alert(\"hi\")`, changing the page"]]},
   {t:"co",kind:"notice",text:"JavaScript is optional: a page made only of HTML and CSS works. So \"JavaScript is always the core part of a frontend\" is false, while \"JavaScript provides additional functionality\" is true."},
   {t:"code",lang:"html",title:"Lists and an external script",src:String.raw`<h3>Ingredients</h3>
<ul>
  <li>rice</li>
  <li>salt</li>
</ul>
<h3>Steps</h3>
<ol>
  <li>Wash the rice</li>
  <li>Boil it</li>
</ol>
<script src="jsfile.js"></script>`,lines:[[2,"`<ul>`: unordered list, bullets; order does not matter."],[7,"`<ol>`: ordered list, numbers; order matters."],[11,"An external script is linked with `src` (not `href`). The tag must be closed."]]},
   {t:"compare",title:"List tags",cols:["Tag","Shows","Use when"],rows:[["`<ul>`","bullets","the order does not matter (ingredients)"],["`<ol>`","numbers 1, 2, 3","the order matters (cooking steps)"],["`<dl>`","terms with descriptions","a glossary of `<dt>` / `<dd>` pairs"]]},
   {t:"ex",level:"foundation",title:"Choosing list tags",problem:"A recipe page lists ingredients (any order) and cooking steps (in order). Which tags?",asked:"One tag for each list.",idea:"Order matters → ordered list.",steps:["Ingredients: order does not matter → `<ul>`.","Steps: order matters → `<ol>`."],answer:"`<ul>` for ingredients, `<ol>` for steps",mistake:"Using `<dl>`, which is for term–description pairs."},
   {t:"ex",level:"exam",title:"Linking a script",problem:"Which line loads `jsfile.js`: `<script src=\"jsfile.js\"></script>`, `<script href=\"jsfile.js\"></script>`, `<import src=\"jsfile.js\">`?",asked:"The correct line.",idea:"Scripts use `src`; `href` belongs to `<a>` and `<link>`; there is no `<import>` tag.",steps:["`<script src=...>` is the standard way.","`href` on `<script>` is ignored by the browser.","`<import>` is not an HTML element."],answer:"`<script src=\"jsfile.js\"></script>`",mistake:"Using `href` because CSS files use `<link href>`.",asserts:["Tfrontend-10"]}
  ],
  deep:[{t:"p",text:"**Why `href` fails.** The browser only fetches a script from the `src` attribute. A `<script href=...>` is treated as an empty inline script, so nothing loads. [assert:Tfrontend-10]"}],
  remember:["HTML = content, CSS = styling, JS = extra behaviour.","`<ul>` unordered, `<ol>` ordered, `<dl>` term/description.","External JS: `<script src=\"file.js\"></script>`.","A page works without JavaScript."],
  teachBack:{prompt:"Why is \"JavaScript is always the core part of a frontend\" false?",model:"A page built only from HTML and CSS works; JavaScript adds optional behaviour."},
  quiz:[
   {id:"fe-h-q1",concept:"html-structure",type:"MCQ",stem:"Steps of an experiment must be followed in order. Which tag?",options:["`<ul>`","`<ol>`","`<dl>`","`<p>`"],key:"B",diff:"easy",hints:["Numbers."],explain:"An ordered list."},
   {id:"fe-h-q2",concept:"html-structure",type:"MSQ",stem:"Which statements are correct?",options:["CSS defines the styling","HTML defines the styling","JavaScript adds behaviour","A page cannot work without JavaScript"],key:["A","C"],diff:"easy",hints:["Roles of the three."],explain:"CSS styles, JS adds behaviour; HTML is content; pages can work without JS."},
   {id:"fe-h-q3",concept:"html-structure",type:"MCQ",stem:"Which attribute names the file in `<script ...></script>`?",options:["`href`","`src`","`link`","`file`"],key:"B",diff:"easy",hints:["Source."],explain:"`src`.",asserts:["Tfrontend-10"]}
  ]},
 {id:"cascade",title:"Which CSS rule wins",studying:"what happens when several CSS rules set the same property",why:"colour-wins questions appear every few papers",plain:"The most specific rule wins; inline style beats them all.",concepts:["css-cascade"],
  core:[
   {t:"p",text:"A **CSS rule** is a selector plus declarations: `p { color: blue; }`. When several rules set the same property on one element, the browser picks one by **specificity**: how precisely the selector targets the element."},
   {t:"table",title:"Specificity, strongest first",head:["Where the style is","Example","Strength"],rows:[["inline `style` attribute","`<p style=\"color:black\">`","strongest"],["id selector","`#para { color: red; }`","high"],["class selector","`.text { color: green; }`","medium"],["tag selector","`p { color: blue; }`","low"]]},
   {t:"code",lang:"html",src:String.raw`<style>
  p { color: blue; }
  .text { color: green; }
  #para { color: red; }
</style>
<p id="para" class="text" style="color: black;">IITM BS Degree Program</p>`,lines:[[2,"Matches the `<p>` (tag)."],[3,"Matches through `class=\"text\"`."],[4,"Matches through `id=\"para\"`."],[6,"The inline style is the most specific: the text is black. [assert:Tfrontend-02]"]]},
   {t:"handTrace",title:"Remove one rule at a time",prompt:"Using the snippet above, write the colour after each change (each row starts from the original).",cols:["change","colour"],given:[["no change","?"],["remove the inline style","?"],["remove inline style and #para rule","?"],["remove inline, #para and .text","?"]],blanks:[[0,1],[1,1],[2,1],[3,1]],key:["black","red","green","blue"]},
   {t:"ex",level:"foundation",title:"Class versus tag",problem:"`p { color: blue }` and `.note { color: green }`; the element is `<p class=\"note\">Hi</p>`. Colour?",asked:"The text colour.",idea:"A class is more specific than a tag.",steps:["Both rules match the element.","The class selector is more specific than the tag selector.","Green wins."],answer:"green",mistake:"Choosing blue because `p` comes first or last.",asserts:["Tfrontend-11"]},
   {t:"ex",level:"exam",title:"Equal specificity: the later rule",problem:"`.a { color: red }` then `.b { color: purple }`, element `<p class=\"a b\">`. Colour?",asked:"The text colour.",idea:"Two class selectors tie; the one written later wins.",steps:["Both selectors have the same specificity (one class).","The later rule in the stylesheet, `.b`, wins."],answer:"purple",mistake:"Thinking the order of classes in `class=\"a b\"` matters.",asserts:["Tfrontend-12"]}
  ],
  deep:[{t:"p",text:"**`!important`** (extra, not asked) overrides normal specificity. Without it, the order is always inline > id > class > tag, then later wins on a tie."}],
  remember:["inline > #id > .class > tag.","On a tie, the later rule wins.","The order of names inside `class=\"...\"` does not matter."],
  teachBack:{prompt:"Why is the text black in the snippet?",model:"The inline style attribute is more specific than the id, class and tag rules."},
  quiz:[
   {id:"fe-c-q1",concept:"css-cascade",type:"MCQ",stem:"`#x { color: red }`, `.y { color: green }`, `<p id=\"x\" class=\"y\">`. Colour?",options:["red","green","black","blue"],key:"A",diff:"easy",hints:["id vs class."],explain:"The id selector is more specific.",asserts:["Tfrontend-13"]},
   {id:"fe-c-q2",concept:"css-cascade",type:"MCQ",stem:"Which is the most specific?",options:["`p`","`.note`","`#main`","`style=\"...\"` on the element"],key:"D",diff:"easy",hints:["On the element itself."],explain:"Inline style beats selectors."},
   {id:"fe-c-q3",concept:"css-cascade",type:"TF",stem:"If two rules have equal specificity, the one written first wins.",key:"B",diff:"medium",hints:["Later or earlier?"],explain:"False: the later one wins.",asserts:["Tfrontend-12"]}
  ]},
 {id:"attr",title:"Attribute selectors",studying:"selectors such as `[id~=out]` and `[class=out]`",why:"a 4.5-mark PYQ turns on `~=`",plain:"`~=` means \"has this whole word in its list\".",concepts:["attr-selectors"],
  core:[
   {t:"table",title:"Attribute selectors",head:["Selector","Matches when the attribute","`out` matches","`out-text` / `outcontent`"],rows:[["`[a=v]`","equals `v` exactly","yes","no"],["`[a~=v]`","contains `v` as a whole space-separated word","yes","no"],["`[a*=v]`","contains `v` anywhere","yes","yes"],["`[a^=v]`","starts with `v`","yes","yes"],["`[a|=v]`","is `v` or starts with `v-`","yes","`out-text` yes"]]},
   {t:"yourMove",id:"fe-move-attr",title:"Does it match?",state:{code:String.raw`[class~=out] { border: 5px solid yellow; }
<p class="outcontent">...</p>`,lang:"html"},prompt:"Does `[class~=out]` match `class=\"outcontent\"`?",choices:["Yes: it contains out","No: out is not a whole word there","Only in some browsers","Yes, but only the first letters"],key:"B",why:["`~=` needs a whole word, not a substring.","Right: the only word is `outcontent`.","All browsers follow the same rule.","That is `^=`, not `~=`."]},
   {t:"ex",level:"foundation",title:"Whole words",problem:"`[class~=out]` against `class=\"box out\"`, `class=\"outbox\"`, `class=\"out\"`. Which match?",asked:"Matching elements.",idea:"Split the value at spaces; look for the exact word.",steps:["`box out` → words `box`, `out`: match.","`outbox` → one word `outbox`: no match.","`out` → match."],answer:"`box out` and `out`",mistake:"Matching `outbox` as a substring.",asserts:["Tfrontend-14"]},
   {t:"ex",level:"exam",title:"Borders on a page",problem:"`[id~=out]` gives a red 10px border and `[class~=out]` a yellow 5px border. Elements: `<h1 id=\"out\">`, `<p id=\"out-text\">`, `<p class=\"outcontent\">`, `<p id=\"out\">`, `<p class=\"out\">`. Which get which border?",asked:"The borders.",idea:"Whole-word match on the id or class value.",steps:["`h1#out` and the `p` with `id=\"out\"`: red.","`id=\"out-text\"`: the word is `out-text`, so no border.","`class=\"outcontent\"`: no border.","`class=\"out\"`: yellow."],answer:"red on both `id=\"out\"` elements, yellow on `class=\"out\"`, none on the others",mistake:"Bordering `out-text` and `outcontent`.",asserts:["Tfrontend-01"]}
  ],
  deep:[{t:"co",kind:"extra",text:"Using the same `id` twice is invalid HTML, but browsers still style both elements. PYQs sometimes do this on purpose."}],
  remember:["`~=` = whole word in a space-separated list.","`*=` = substring anywhere.","Hyphens do not split words for `~=`."],
  teachBack:{prompt:"Why does `[id~=out]` not match `id=\"out-text\"`?",model:"`~=` splits only at spaces, so the single word is `out-text`, not `out`."},
  quiz:[
   {id:"fe-a-q1",concept:"attr-selectors",type:"MCQ",stem:"Which element does `[class~=note]` match?",options:["`class=\"notes\"`","`class=\"big note\"`","`class=\"note-1\"`","`class=\"footnote\"`"],key:"B",diff:"medium",hints:["Whole word."],explain:"Only `big note` contains the whole word `note`.",asserts:["Tfrontend-15"]},
   {id:"fe-a-q2",concept:"attr-selectors",type:"MCQ",stem:"Which selector matches `class=\"outcontent\"`?",options:["`[class~=out]`","`[class=out]`","`[class*=out]`","none"],key:"C",diff:"medium",hints:["Substring."],explain:"`*=` matches a substring anywhere.",asserts:["Tfrontend-15"]},
   {id:"fe-a-q3",concept:"attr-selectors",type:"TF",stem:"`[id~=out]` matches `id=\"out\"`.",key:"A",diff:"easy",hints:["One word, exactly out."],explain:"True."}
  ]},
 {id:"validity",title:":valid and :invalid",studying:"how CSS can colour form fields by whether they pass their constraints",why:"two PYQs ask what colour a field is while typing",plain:"`:valid` and `:invalid` follow the field's state live.",concepts:["form-validation"],
  core:[
   {t:"co",kind:"def",title:"Validity pseudo-classes",text:"`input:valid` matches a field whose value passes all its constraints (`required`, `minlength`, `maxlength`, `type`); `input:invalid` matches one that fails. The match updates live as the user types."},
   {t:"table",title:"When is a field valid?",head:["Field","Empty","Some text"],rows:[["no constraints","valid","valid"],["`required`","invalid","valid"],["`minlength=\"8\"` (not required)","valid (empty is allowed)","invalid while under 8 typed characters"],["`required minlength=\"5\"`","invalid","invalid under 5, valid from 5"]]},
   {t:"player",title:"Typing `mad1password` into a required field with minlength 5 and maxlength 8",frames:[
    {state:{text:"Value: (empty) → **red** (`required` fails)"},caption:"Before typing, the required field is invalid."},
    {state:{text:"`mad1` (4 letters) → **red**"},caption:"Letters 1–4 are fewer than `minlength=\"5\"`."},
    {state:{text:"`mad1p` (5) … `mad1pass` (8) → **green**"},caption:"From the 5th letter the field is valid."},
    {state:{text:"`mad1pass` stays 8 letters → **green**"},caption:"`maxlength=\"8\"` stops further typing, so the field stays green."}]},
   {t:"ex",level:"foundation",title:"A field with minlength only",problem:"`<input type=\"text\" minlength=\"8\">` with `:invalid` red and `:valid` green. What colour when empty, after typing 3 letters, and after typing `madcourse.mail.com`?",asked:"Three colours.",idea:"Empty is allowed (not required); minlength applies to typed text.",steps:["Empty: no constraint fails, so green.","3 typed letters: fewer than 8, so red.","18 characters: at least 8, so green."],answer:"green, red, green",mistake:"Calling the empty field red: it is not required.",asserts:["Tfrontend-03"]},
   {t:"ex",level:"exam",title:"Typing past maxlength",problem:"`required minlength=\"5\" maxlength=\"8\"`, red for invalid and green for valid. The user types `mad1password` letter by letter.",asked:"The colour sequence.",idea:"minlength decides when it turns green; maxlength stops typing.",steps:["Letters 1–4: red.","Letters 5–8: green.","The 9th letter onwards cannot be typed (maxlength), so it stays green with 8 letters."],answer:"red for 4, then green, staying green",mistake:"Expecting it to turn red again after 8 letters.",asserts:["Tfrontend-05"]}
  ],
  deep:[{t:"p",text:"**Why minlength waits for typing.** The HTML standard applies `minlength` only to values the user has edited. A value set by a script, or a pre-filled `value=\"ab\"`, is not flagged as too short. `maxlength` prevents typing beyond the limit."}],
  remember:["`:valid` / `:invalid` update live.","Empty and not required → valid.","minlength counts typed characters only.","maxlength stops typing at the limit."],
  teachBack:{prompt:"Why does a field with maxlength 8 never turn red for being too long while typing?",model:"The browser stops the user from typing more than 8 characters, so it can never become too long."},
  quiz:[
   {id:"fe-v-q1",concept:"form-validation",type:"MCQ",stem:"`<input required>` with `input:invalid { background: red }`. Colour before typing?",options:["red","white","green","depends on the server"],key:"A",diff:"easy",hints:["Required and empty."],explain:"Empty required fields are invalid.",asserts:["Tfrontend-16"]},
   {id:"fe-v-q2",concept:"form-validation",type:"MCQ",stem:"`minlength=\"3\"` (not required) and the field is empty. Valid?",options:["valid","invalid","only after submit","undefined"],key:"A",diff:"medium",hints:["Empty is allowed."],explain:"Not required, so empty is valid.",asserts:["Tfrontend-16"]},
   {id:"fe-v-q3",concept:"form-validation",type:"NUM",stem:"`maxlength=\"6\"`. The user tries to type 10 characters. How many end up in the field?",key:6,diff:"easy",hints:["Typing stops."],explain:"The browser stops at 6.",asserts:["Tfrontend-17"]}
  ]},
 {id:"html5",title:"HTML5 validation attributes and JavaScript checks",studying:"browser-enforced attributes and a JavaScript validation function on submit",why:"three PYQs mix HTML5 attributes with JS validation",plain:"The browser checks attributes first; your script and the server can check more.",concepts:["form-validation"],
  core:[
   {t:"table",title:"Validation attributes",head:["Attribute","Blocks submit when","Browser message (en-US)"],rows:[["`required`","the field is empty","Please fill out this field."],["`minlength=\"n\"`","fewer than n typed characters","Please lengthen this text…"],["`maxlength=\"n\"`","(typing is stopped at n)","none"],["`type=\"email\"`","not an email address","Please include an '@'…"]]},
   {t:"co",kind:"def",title:"Order of checks on submit",text:"When the user presses Submit, the browser first runs **HTML5 validation**. If a field fails, it shows its message next to that field and **does not fire the submit event**, so a JavaScript `onsubmit` function does not run. Only a form that passes reaches your script (client-side JS validation), and then the server (backend validation)."},
   {t:"flow",caption:"What happens when Submit is pressed",W:360,H:400,nodes:[{id:"a",text:"Submit pressed",x:180,y:30,kind:"start",w:150},{id:"b",text:"HTML5 checks\npass?",x:180,y:120,kind:"decision",w:160,h:64},{id:"c",text:"browser message\n(no submit event)",x:180,y:215,kind:"end",w:200,h:46},{id:"d",text:"onsubmit JS runs",x:180,y:300,w:170},{id:"e",text:"request to server\n(backend checks)",x:180,y:375,kind:"end",w:190,h:46}],edges:[["a","b"],["b","c","no"],["b","d","yes"],["d","e"]]},
   {t:"ex",level:"foundation",title:"Empty required password",problem:"A form has `<input type=\"password\" name=\"password\" required>` and `onsubmit=\"validateForm()\"`, which alerts if the password is shorter than 8. The password is left empty and Submit is pressed. What does the user see?",asked:"The message and its source.",idea:"HTML5 validation runs first and blocks the submit event.",steps:["`required` fails, so the browser shows its own message next to the field: \"Please fill out this field.\" (wording depends on the browser's language).","The submit event does not fire, so `validateForm` and its alert do not run."],answer:"The browser's \"Please fill out this field.\" message",mistake:"Expecting the script's alert.",asserts:["Tfrontend-04"]},
   {t:"ex",level:"exam",title:"Which kind of validation?",problem:"Is a JavaScript `validateForm()` run on submit frontend or backend validation?",asked:"Classify it.",idea:"It runs in the browser.",steps:["The function runs in the user's browser before any request.","So it is client-side (frontend) validation, not backend processing."],answer:"Client-side (frontend) validation",mistake:"Calling JavaScript \"backend\"."}
  ],
  deep:[{t:"p",text:"**The bug in many PYQ forms.** `onsubmit=\"validateForm()\"` without `return` cannot cancel the submit: even when the function returns `false`, the form still submits. The correct form is `onsubmit=\"return validateForm()\"`."}],
  remember:["HTML5 checks run first and block the submit event.","JS onsubmit checks = client-side validation.","Checks in the Flask view = backend validation.","Message wording follows the browser's language."],
  teachBack:{prompt:"Why doesn't the JavaScript alert appear when a required field is empty?",model:"The browser's HTML5 check fails first, so the submit event never fires and the script never runs."},
  quiz:[
   {id:"fe-5-q1",concept:"form-validation",type:"MCQ",stem:"A JS function checks the form in the browser before submitting. This is:",options:["backend validation","client-side validation","database validation","server rendering"],key:"B",diff:"easy",hints:["Where does it run?"],explain:"It runs in the browser."},
   {id:"fe-5-q2",concept:"form-validation",type:"MCQ",stem:"A `required` field is empty and the form has `onsubmit=\"check()\"`. Does `check()` run when Submit is pressed?",options:["yes","no","only if check returns true","only in Chrome"],key:"B",diff:"medium",hints:["Which check runs first?"],explain:"HTML5 validation fails first, so no submit event, so `check()` does not run.",asserts:["Tfrontend-04"]},
   {id:"fe-5-q3",concept:"form-validation",type:"TF",stem:"`type=\"email\"` makes the browser reject `abc` on submit.",key:"A",diff:"easy",hints:["No @."],explain:"True: it must look like an email address.",asserts:["Tfrontend-18"]}
  ]},
 {id:"jsout",title:"JavaScript output: alert, console, document.write, innerHTML",studying:"where each JavaScript output method shows its text",why:"a 4.5-mark PYQ asks which button shows a dialog box",plain:"alert → dialog; console → developer tools; innerHTML → part of the page.",concepts:["js-output"],
  core:[
   {t:"table",title:"Where output goes",head:["Code","Shows text in"],rows:[["`alert(\"Hi\")`","a dialog box (pop-up)"],["`console.log(\"Hi\")`","the developer console"],["`console.error(\"Hi\")`","the developer console, as an error"],["`document.write(\"Hi\")`","the document (after load it replaces the page)"],["`el.innerHTML = \"Hi\"`","inside that element"]]},
   {t:"code",lang:"html",src:String.raw`<button onclick="alert('Hello')">One</button>
<button onclick="console.log('Hello')">Two</button>
<p id="out"></p>
<script>
  document.getElementById("out").innerHTML = "Set by JS";
</script>`,lines:[[1,"Clicking opens a dialog box. [assert:Tfrontend-09]"],[2,"Clicking writes to the console only; the page does not change. [assert:Tfrontend-09]"],[5,"The paragraph shows `Set by JS`. [assert:Tfrontend-19]"]]},
   {t:"ex",level:"foundation",title:"Which shows a dialog?",problem:"Buttons call `alert`, `console.log`, `document.write`, `console.error`. Which shows a dialog box?",asked:"The button.",idea:"Only alert opens a dialog.",steps:["`alert` opens a dialog.","The console methods write to developer tools.","`document.write` writes into the page."],answer:"the `alert` button",mistake:"Choosing `console.error` because it looks like an error pop-up.",asserts:["Tfrontend-09"]},
   {t:"ex",level:"exam",title:"document.write after load",problem:"A button runs `document.write('Hi')` after the page has loaded. What happens?",asked:"The effect on the page.",idea:"Writing after load opens a new document.",steps:["The page has finished loading.","`document.write` then replaces the whole document.","The page shows only `Hi`."],answer:"The page is replaced by `Hi`",mistake:"Expecting `Hi` to be added at the bottom.",asserts:["Tfrontend-20"]}
  ],
  deep:[{t:"p",text:"**textContent vs innerHTML.** `textContent` inserts plain text; `innerHTML` parses HTML tags. Use textContent for user data to avoid injecting markup."}],
  remember:["alert = dialog box.","console.log / console.error = developer console.","innerHTML / textContent = inside an element.","document.write after load = replaces the page."],
  teachBack:{prompt:"Where does `console.log` output go?",model:"To the browser's developer console, not to the page."},
  quiz:[
   {id:"fe-j-q1",concept:"js-output",type:"MCQ",stem:"Which writes to the developer console only?",options:["`alert`","`console.log`","`document.write`","`innerHTML`"],key:"B",diff:"easy",hints:["console."],explain:"console.log.",asserts:["Tfrontend-09"]},
   {id:"fe-j-q2",concept:"js-output",type:"MCQ",stem:"`document.getElementById(\"x\").innerHTML = \"<b>Hi</b>\"` shows:",options:["the text `<b>Hi</b>`","**Hi** in bold inside #x","a dialog","nothing"],key:"B",diff:"easy",hints:["innerHTML parses tags."],explain:"The tags are parsed, so bold Hi appears.",asserts:["Tfrontend-19"]},
   {id:"fe-j-q3",concept:"js-output",type:"TF",stem:"`console.error` opens a red pop-up dialog.",key:"B",diff:"easy",hints:["console."],explain:"False: it writes to the console."}
  ]},
 {id:"json",title:"JSON syntax and parsing",studying:"what makes text valid JSON and how JavaScript reads it",why:"two PYQs: valid-JSON choices and JSON.parse output",plain:"Double-quoted keys in objects, values only in arrays.",concepts:["json-syntax"],
  core:[
   {t:"table",title:"JSON rules",head:["Rule","Valid","Invalid"],rows:[["keys in double quotes","`{\"a\": 1}`","`{a: 1}`, `{'a': 1}`"],["arrays hold values only","`[1, \"x\", true]`","`[\"k\": 1]`"],["strings in double quotes","`\"hi\"`","`'hi'`"],["literals","`true`, `false`, `null`","`True`, `None`"],["mixed types in an array","`[2125551234, \"212\"]`",""]]},
   {t:"code",lang:"javascript",src:String.raw`const txt = '{"name":"icecream","type":"cup","flavor":"vanilla"}';
const obj = JSON.parse(txt);
console.log(obj.name + ", " + obj.flavor + ", " + obj.type);`,lines:[[1,"JSON text in a string."],[2,"`JSON.parse` builds an object."],[3,"Properties are read by name, in the order you write them: `icecream, vanilla, cup`. [assert:Tfrontend-06]"]]},
   {t:"ex",level:"foundation",title:"Spot the invalid one",problem:"Which is invalid JSON: `{\"a\": [1, 2]}`, `{\"a\": [\"k\": 1]}`, `{\"a\": {\"k\": 1}}`?",asked:"The invalid text.",idea:"Key–value pairs belong in objects, not arrays.",steps:["The first holds an array of numbers: valid.","The second puts `\"k\": 1` inside `[ ]`: invalid.","The third nests an object: valid."],answer:"`{\"a\": [\"k\": 1]}`",mistake:"Thinking nesting is not allowed.",asserts:["Tfrontend-21"]},
   {t:"ex",level:"exam",title:"Order of output",problem:"With `obj` above, what does `obj.type + \", \" + obj.name` give?",asked:"The string.",idea:"The order you read properties in is the order printed.",steps:["`obj.type` is `cup`.","`obj.name` is `icecream`."],answer:"`cup, icecream`",mistake:"Following the order in the JSON text.",asserts:["Tfrontend-22"]}
  ],
  deep:[{t:"p",text:"**Python link.** Flask's `jsonify` and dict returns produce JSON; Python's `True` becomes JSON `true` and `None` becomes `null`."}],
  remember:["Object keys in double quotes.","Arrays hold values, not key: value pairs.","Mixed types in an array are fine.","Property access order decides output order."],
  teachBack:{prompt:"Why is `[\"addressLine\": \"x\"]` invalid?",model:"Arrays can only contain values; key–value pairs must be inside an object `{ }`."},
  quiz:[
   {id:"fe-js-q1",concept:"json-syntax",type:"MCQ",stem:"Which is valid JSON?",options:["`{'a': 1}`","`{\"a\": True}`","`{\"a\": null}`","`{a: 1}`"],key:"C",diff:"easy",hints:["Double quotes, lowercase literals."],explain:"Only `{\"a\": null}` follows the rules.",asserts:["Tfrontend-23"]},
   {id:"fe-js-q2",concept:"json-syntax",type:"TF",stem:"`[1, \"two\", 3]` is valid JSON.",key:"A",diff:"easy",hints:["Mixed values."],explain:"True: arrays may mix types.",asserts:["Tfrontend-23"]},
   {id:"fe-js-q3",concept:"json-syntax",type:"MCQ",stem:"`JSON.parse('{\"x\": 5}').x * 2` is:",options:["`10`","`\"55\"`","error","`undefined`"],key:"A",diff:"easy",hints:["5 is a number."],explain:"`x` is the number 5, so 10.",asserts:["Tfrontend-24"]}
  ]},
 {id:"dom",title:"The DOM, live collections and AJAX",studying:"the page as a tree of objects, collections that update themselves, and updating part of a page",why:"five PYQs on the DOM and AJAX",plain:"Scripts change the page through the DOM; AJAX fetches data without a reload.",concepts:["dom-live","ajax"],
  core:[
   {t:"co",kind:"def",title:"DOM",text:"The **Document Object Model** is the browser's programming interface to the page: an abstract tree of objects (document, elements, text). It can be changed at any time, and although JavaScript is the usual language, the DOM is a language-independent interface."},
   {t:"co",kind:"def",title:"Live collection",text:"`document.getElementsByTagName(\"li\")` returns a **live** `HTMLCollection`: it is not a snapshot, so its `length` always reflects the current page. (`querySelectorAll` returns a static list.)"},
   {t:"code",lang:"html",src:String.raw`<ol id="lst"><li>App Dev-1</li></ol>
<script>
  let items = document.getElementsByTagName("li");
  document.getElementById("lst").innerHTML += "<li>App Dev-2</li><li>Projects</li>";
  console.log(items.length);
</script>`,lines:[[3,"A live collection: 1 item now."],[4,"`innerHTML +=` re-parses the list with two more items."],[5,"The collection updates itself: logs `3`. [assert:Tfrontend-07]"]]},
   {t:"co",kind:"def",title:"AJAX",text:"**AJAX** (Asynchronous JavaScript and XML; today usually JSON) lets JavaScript request data from the server in the background and update part of the page **without reloading** the whole page. The user can keep working meanwhile, and only a little data is transferred, so the page responds faster."},
   {t:"compare",title:"AJAX versus a full page load",cols:["","Full reload","AJAX"],rows:[["Page during the request","blank or frozen","still usable"],["Data sent back","the whole HTML page","only what changed (often JSON)"],["What updates","everything","one part of the DOM"]]},
   {t:"ex",level:"foundation",title:"Live versus static",problem:"Same as the code above but with `document.querySelectorAll(\"li\")`. What is logged?",asked:"The number.",idea:"`querySelectorAll` returns a static NodeList.",steps:["The list is captured with 1 item.","Adding items later does not change a static list.","So `1` is logged."],answer:"`1`",mistake:"Answering 3, which is the live collection's answer.",asserts:["Tfrontend-25"]},
   {t:"ex",level:"exam",title:"Advantage of AJAX",problem:"Which is the main advantage of asynchronous updates: all elements load together, parts update without a full reload, the user is blocked until the server replies, or it needs fast internet?",asked:"The advantage.",idea:"Partial update without reload.",steps:["AJAX updates only part of the page.","It does not block the user and does not need fast internet."],answer:"parts of the page update without a full reload",mistake:"Choosing \"the client waits\", which is the opposite."}
  ],
  deep:[{t:"p",text:"**Why `innerHTML +=` matters.** It rebuilds the container's children from the new HTML string, so old element references inside it are replaced. A live collection still counts correctly because it re-queries the page."}],
  remember:["DOM = programming interface + abstract tree of the page; it can change.","`getElementsByTagName` is live; `querySelectorAll` is static.","AJAX = background request + partial update, no reload.","AJAX gives a better experience with less data."],
  teachBack:{prompt:"Why does the live collection report 3?",model:"A live HTMLCollection always reflects the current page, which has three li elements after innerHTML += added two."},
  quiz:[
   {id:"fe-d-q1",concept:"dom-live",type:"NUM",stem:"A page has 2 `<p>`. `let p = document.getElementsByTagName(\"p\")`; then a script adds 3 more paragraphs. What is `p.length`?",key:5,diff:"medium",hints:["Live collection."],explain:"It counts the current 5 paragraphs.",asserts:["Tfrontend-26"]},
   {id:"fe-d-q2",concept:"dom-live",type:"MSQ",stem:"Which are true of the DOM?",options:["It is a programming interface for web documents","Its structure cannot change after load","It can only be used from JavaScript","It represents the page as a tree of objects"],key:["A","D"],diff:"medium",hints:["Can scripts change the page?"],explain:"The DOM is an interface and a tree; it changes and is language-independent."},
   {id:"fe-d-q3",concept:"ajax",type:"MCQ",stem:"Which technique updates part of a page without reloading it?",options:["CGI","FTP","AJAX","SMTP"],key:"C",diff:"easy",hints:["Asynchronous."],explain:"AJAX."},
   {id:"fe-d-q4",concept:"ajax",type:"TF",stem:"With AJAX the user is blocked from using the page until the server replies.",key:"B",diff:"easy",hints:["Asynchronous."],explain:"False: the page stays usable."}
  ]}
 ],
 practice:[
  {id:"fe-p1",concept:"css-cascade",type:"MCQ",stem:"`h1 { color: red }` and `<h1 style=\"color: blue\">`. Colour?",options:["red","blue","black","purple"],key:"B",diff:"easy",hints:["Inline."],explain:"The inline style wins.",asserts:["Tfrontend-27"]},
  {id:"fe-p2",concept:"css-cascade",type:"MCQ",stem:"`.a { color: green }` and `#b { color: orange }` on `<p id=\"b\" class=\"a\">`. Colour?",options:["green","orange","black","depends on order"],key:"B",diff:"easy",hints:["id vs class."],explain:"The id is more specific.",asserts:["Tfrontend-28"]},
  {id:"fe-p3",concept:"attr-selectors",type:"MSQ",stem:"Which elements does `[id~=menu]` match?",options:["`id=\"menu\"`","`id=\"menu-top\"`","`id=\"mainmenu\"`","`id=\"top menu\"`"],key:["A","D"],diff:"medium",hints:["Whole words split at spaces."],explain:"Only `menu` and `top menu` contain the whole word.",asserts:["Tfrontend-29"]},
  {id:"fe-p4",concept:"attr-selectors",type:"MCQ",stem:"`[class=out]` matches which?",options:["`class=\"out big\"`","`class=\"out\"`","`class=\"outer\"`","all three"],key:"B",diff:"medium",hints:["Exact value."],explain:"`=` needs the whole value to be exactly `out`.",asserts:["Tfrontend-29"]},
  {id:"fe-p5",concept:"js-output",type:"MCQ",stem:"Which shows text in a pop-up box?",options:["`console.log`","`alert`","`console.error`","`textContent`"],key:"B",diff:"easy",hints:["Dialog."],explain:"`alert`.",asserts:["Tfrontend-09"]},
  {id:"fe-p6",concept:"js-output",type:"MCQ",stem:"After `el.textContent = \"<b>x</b>\"`, the element shows:",options:["**x** in bold","the characters `<b>x</b>`","nothing","a dialog"],key:"B",diff:"medium",hints:["Text, not HTML."],explain:"textContent inserts the characters as text.",asserts:["Tfrontend-30"]},
  {id:"fe-p7",concept:"json-syntax",type:"MCQ",stem:"Which is invalid JSON?",options:["`{\"a\": [1, 2]}`","`{\"a\": \"b\"}`","`{\"a\": 'b'}`","`[]`"],key:"C",diff:"easy",hints:["Quotes."],explain:"Single quotes are not allowed.",asserts:["Tfrontend-31"]},
  {id:"fe-p8",concept:"dom-live",type:"MCQ",stem:"`querySelectorAll(\"li\")` is captured with 2 items, then 1 item is added. Its length?",options:["2","3","1","0"],key:"A",diff:"medium",hints:["Static."],explain:"querySelectorAll returns a static list.",asserts:["Tfrontend-25"]}
 ],
 test:[
  {id:"fe-t1",concept:"html-structure",type:"MCQ",stem:"A shopping list where order does not matter uses:",options:["`<ol>`","`<ul>`","`<dl>`","`<table>`"],key:"B",diff:"easy",hints:["Bullets."],explain:"Unordered list."},
  {id:"fe-t2",concept:"css-cascade",type:"MCQ",stem:"`p {color:blue} .t {color:green} #q {color:red}`, element `<p id=\"q\" class=\"t\">`. Colour?",options:["blue","green","red","black"],key:"C",diff:"easy",hints:["No inline style."],explain:"The id rule is most specific.",asserts:["Tfrontend-13"]},
  {id:"fe-t3",concept:"attr-selectors",type:"MCQ",stem:"`[id~=out]` matches `id=\"out-text\"`?",options:["yes","no"],key:"B",diff:"medium",hints:["Hyphen."],explain:"The single word is `out-text`.",asserts:["Tfrontend-01"]},
  {id:"fe-t4",concept:"form-validation",type:"MCQ",stem:"`required minlength=\"5\"`, red when invalid. After typing 3 letters?",options:["red","green","white","depends"],key:"A",diff:"easy",hints:["Under 5."],explain:"Fewer than 5 typed letters: invalid.",asserts:["Tfrontend-05"]},
  {id:"fe-t5",concept:"json-syntax",type:"TF",stem:"`{\"k\": [\"a\": 1]}` is valid JSON.",key:"B",diff:"easy",hints:["Arrays hold values."],explain:"False.",asserts:["Tfrontend-21"]},
  {id:"fe-t6",concept:"dom-live",type:"MCQ",stem:"`getElementsByTagName` returns a collection that is:",options:["static","live","a copy of the HTML text","a JSON array"],key:"B",diff:"easy",hints:["Updates itself."],explain:"Live.",asserts:["Tfrontend-07"]},
  {id:"fe-t7",concept:"ajax",type:"MCQ",stem:"AJAX mainly improves:",options:["page reload speed by reloading everything","responsiveness by updating parts of the page","server storage","CSS specificity"],key:"B",diff:"easy",hints:["Partial update."],explain:"Parts update without a reload."}
 ],
 remember:{
  facts:["HTML content, CSS style, JS behaviour (optional).","`<ul>` unordered, `<ol>` ordered; `<script src=...>`.","inline > #id > .class > tag; ties go to the later rule.","`~=` whole word; `*=` substring; `=` exact.","`:valid` / `:invalid` update live; minlength counts typed text; maxlength stops typing.","HTML5 checks run before the submit event; JS onsubmit is client-side validation.","alert = dialog; console = dev tools; innerHTML = element.","JSON: double-quoted keys; arrays of values only.","getElementsByTagName is live; AJAX updates part of a page."],
  traps:[{text:"Picking the class colour over an inline style.",cause:"forgetting inline is most specific"},{text:"Matching `out-text` with `[id~=out]`.",cause:"treating ~= as substring"},{text:"Expecting a JS alert when a required field is empty.",cause:"forgetting HTML5 checks run first"},{text:"Expecting the field to turn red again past maxlength.",cause:"forgetting typing stops at maxlength"},{text:"Choosing console.error for a dialog box.",cause:"confusing console with alert"},{text:"Accepting key: value pairs inside an array.",cause:"mixing up arrays and objects"},{text:"Answering 1 for a live collection.",cause:"thinking collections are snapshots"}],
  formulas:[{tex:"\\text{inline} > \\#\\text{id} > .\\text{class} > \\text{tag}",means:"CSS specificity order",when:"two rules set the same property"}],
  cues:[["\"rendered in which colour\"","list matching rules, pick the most specific"],["`[x~=y]`","split at spaces, look for the whole word"],["\"letter by letter\" with minlength/maxlength","red below minlength, green from it, typing stops at maxlength"],["\"dialogue box\"","alert"],["\"valid JSON\"","check quotes and arrays"],["\"length\" after innerHTML +=","live collection counts the new items"]],
  selector:[["specificity first","source order first","order only breaks ties"],["render the field state live","judging only at submit","validity updates while typing"]],
  examMoves:[["CSS winner","inline → id → class → tag","30 s","tie → later rule"],["Attribute selector","split value at spaces","45 s","hyphens do not split"],["Validation colours","table of length vs constraints","60 s","maxlength caps typing"],["JSON validity","check each brace and quote","60 s","arrays hold values only"]],
  hooks:["Inline style is the boss on the spot.","`~=` reads words, not letters.","Live collections never go stale."]
 },
 methodCards:[{qType:"Which colour/border",recipe:"List rules that match the element; pick the most specific (inline > id > class > tag); tie → later."},{qType:"Validation colour while typing",recipe:"Write length k after each letter; invalid while k < minlength (or empty and required); maxlength caps k."},{qType:"Valid JSON",recipe:"Keys double-quoted; strings double-quoted; arrays hold only values; literals lowercase."},{qType:"DOM output",recipe:"Live collection → current count; innerHTML += adds elements; alert = dialog, console = dev tools."}],
 flash:[
  {front:"CSS specificity order",back:"inline > #id > .class > tag; tie → later rule.",kind:"formula"},
  {front:"`[a~=v]` means",back:"`v` is a whole word in the space-separated value.",kind:"idea"},
  {front:"Empty, not required, minlength 8: valid?",back:"Yes.",kind:"trap"},
  {front:"maxlength while typing",back:"Typing stops at the limit.",kind:"idea"},
  {front:"Empty required field + onsubmit JS",back:"Browser message; the JS does not run.",kind:"trap"},
  {front:"Which method shows a dialog?",back:"`alert`.",kind:"cue"},
  {front:"Arrays in JSON",back:"Values only; key: value pairs need `{ }`.",kind:"trap"},
  {front:"getElementsByTagName",back:"Live collection: reflects later changes.",kind:"idea"},
  {front:"AJAX",back:"Background request, partial update, no reload.",kind:"idea"},
  {front:"`<ul>` vs `<ol>`",back:"Unordered vs ordered.",kind:"idea"}
 ],
 checklist:["I can name the job of HTML, CSS and JS.","I can pick the winning CSS rule.","I can evaluate `~=` selectors.","I can give the colour of a validated field while typing.","I can say which output method shows where.","I can spot invalid JSON.","I can predict a live collection's length.","I can state what AJAX does."],
 cheat:{methods:["Specificity: inline > id > class > tag.","`~=` whole word.","Validation: red below minlength, green from it, maxlength caps.","alert dialog; console dev tools.","JSON: double quotes, arrays of values."],traps:["Inline beats id.","`out-text` is not `out`.","HTML5 checks block onsubmit.","console.error is not a dialog.","Live collections update."]}
});
