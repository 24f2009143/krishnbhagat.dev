/* PDSA engine: content blocks, worked examples, trace steppers, question cards */
(function(){
var P=window.PDSA,esc=P.esc,el=P.el,md=P.md;
function prose(s){return '<div class="prose">'+md(s)+"</div>"}
P.prose=prose;
var CO={def:["Definition","D"],formula:["Formula","ƒ"],example:["Example","E"],warn:["Trap","!"],analogy:["Analogy","≈"],remember:["Remember","★"],notice:["Notice that","i"],tip:["Exam tip","✓"],extra:["Extra, not asked in PYQs","+"]};
function table(head,rows,cls,numcols){
  var h="<div class='tw'><table class='"+(cls||"")+"'>";
  if(head&&head.length)h+="<thead><tr>"+head.map(function(c){return "<th>"+P.inline(c)+"</th>"}).join("")+"</tr></thead>";
  h+="<tbody>"+rows.map(function(r){var hl=r.hl;var cells=r.cells||r;return "<tr"+(hl?' class="hlrow"':"")+">"+cells.map(function(c){return "<td>"+P.inline(String(c))+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>";
  return h;
}
P.tableHTML=table;
function codeBlock(b){
  var lines=String(b.code).replace(/\n$/,"").split("\n"),w=el("div","codeblk");
  var head='<div class="ch"><span>'+esc(b.title||"Python")+'</span><button class="cp" type="button">Copy</button></div>';
  var pre='<pre>'+lines.map(function(l,i){return '<div class="ln"><span class="n">'+(i+1)+'</span><span class="t">'+P.pyHL(l)+"</span></div>"}).join("")+"</pre>";
  var lex="";
  if(b.lex&&b.lex.length)lex='<div class="lex"><b>What each line does</b><ol>'+b.lex.map(function(x){return "<li><b>"+esc(x[0])+"</b><span>"+P.inline(x[1])+"</span></li>"}).join("")+"</ol></div>";
  w.innerHTML=head+pre+lex;
  w.querySelector(".cp").onclick=function(){try{navigator.clipboard.writeText(b.code).then(function(){P.toast("Copied")},function(){P.toast("Copy blocked here; select the text")})}catch(e){P.toast("Copy blocked here; select the text")}};
  return w;
}
function trace(b){
  var w=el("div","stepper"),rows=b.rows,n=rows.length;
  var h='<div class="sh"><b>'+esc(b.title||"Trace table")+"</b>";
  if(b.stepper!==false&&n>2)h+='<span class="cnt"></span><button class="btn sm ghost prev" type="button">Back</button><button class="btn sm next" type="button">Next step</button><button class="btn sm ghost all" type="button">Show all</button>';
  h+="</div>";
  var t="<div class='tw'><table class='trace'><thead><tr>"+b.head.map(function(c){return "<th>"+P.inline(c)+"</th>"}).join("")+"</tr></thead><tbody>";
  rows.forEach(function(r,i){var cells=r.cells||r;t+='<tr data-i="'+i+'"'+(r.hl?' class="hlrow"':"")+">"+cells.map(function(c,k){var last=(k===cells.length-1&&b.noteLast);return '<td'+(last?' class="note"':"")+">"+(last?P.inline(String(c)):esc(String(c)))+"</td>"}).join("")+"</tr>"});
  t+="</tbody></table></div>";
  w.innerHTML=h+t+(b.foot?'<div style="padding:8px 14px;font-size:.9rem;border-top:1px solid var(--line)">'+md(b.foot)+"</div>":"");
  if(b.stepper!==false&&n>2){
    var shown=1,trs=P.$$("tbody tr",w),cnt=w.querySelector(".cnt");
    function upd(){trs.forEach(function(r,i){r.classList.toggle("future",i>=shown)});cnt.textContent="step "+shown+" of "+n}
    w.querySelector(".next").onclick=function(){if(shown<n)shown++;upd()};
    w.querySelector(".prev").onclick=function(){if(shown>1)shown--;upd()};
    w.querySelector(".all").onclick=function(){shown=n;upd()};
    upd();
  }
  return w;
}
function figSVG(b){
  if(b.graph)return P.graphSVG(b.graph);if(b.tree)return P.treeSVG(b.tree,b.opt);if(b.heap)return P.heapSVG(b.heap,b.opt);if(b.arr)return P.arrSVG(b.arr,b.opt);
  if(b.bar)return P.barSVG(b.bar);if(b.line)return P.lineSVG(b.line);if(b.timeline)return P.timelineSVG(b.timeline);if(b.scatter)return P.scatterSVG(b.scatter);if(b.rows)return P.rowsSVG({rows:b.rows,bw:b.bw});
  if(b.multi)return '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">'+b.multi.map(function(m){return '<div style="flex:1 1 240px;min-width:0">'+figSVG(m)+(m.cap?'<div style="font-size:.82rem;color:var(--mute)">'+P.inline(m.cap)+"</div>":"")+"</div>"}).join("")+"</div>";
  if(b.svg)return b.svg;return "";
}
P.figSVG=figSVG;
function fig(b){
  var f=el("figure","fig"),s="";
  s=figSVG(b);
  f.innerHTML=s+(b.caption?"<figcaption>"+P.inline(b.caption)+"</figcaption>":"")+(b.explain?'<div class="prose" style="text-align:left;margin-top:8px">'+md(b.explain)+"</div>":"");
  return f;
}
P.figHTML=function(b){return fig(b).outerHTML};

function frames(b){
  var w=el("div","stepper"),n=b.frames.length,i=0,timer=null;
  w.innerHTML='<div class="sh"><b>'+esc(b.title||"Step through it")+'</b><span class="cnt"></span><button class="btn sm ghost prev" type="button">Back</button><button class="btn sm next" type="button">Next</button><button class="btn sm ghost play" type="button">Play</button></div><div class="fr" style="padding:10px 14px"></div>';
  var fr=w.querySelector(".fr"),cnt=w.querySelector(".cnt"),play=w.querySelector(".play");
  function draw(){var f=b.frames[i];fr.innerHTML='<div class="fig" style="margin:0">'+(f.fig?figSVG(f.fig):"")+'</div><div class="prose" style="margin-top:8px">'+md(f.text||"")+"</div>";P.math(fr);cnt.textContent="step "+(i+1)+" of "+n;
    w.querySelector(".prev").disabled=i===0;w.querySelector(".next").disabled=i===n-1}
  function stop(){if(timer){clearInterval(timer);timer=null;play.textContent="Play"}}
  w.querySelector(".next").onclick=function(){stop();if(i<n-1)i++;draw()};
  w.querySelector(".prev").onclick=function(){stop();if(i>0)i--;draw()};
  play.onclick=function(){if(timer){stop();return}if(i>=n-1)i=0;play.textContent="Pause";draw();timer=setInterval(function(){if(i<n-1){i++;draw()}else stop()},b.ms||1700)};
  draw();return w;
}
function example(b){
  var w=el("div","ex"),lv=b.level||"simple",labels={simple:"Simple",mid:"Exam level",exam:"Exam level",hard:"Tricky",tricky:"Tricky"};
  var cls=lv==="exam"?"mid":lv==="tricky"?"hard":lv;
  var h='<div class="eh"><span class="lv '+cls+'">'+labels[lv]+"</span>"+P.inline(b.title||"Worked example")+'</div><div class="eb">';
  function row(k,v){return v?'<div class="row"><b>'+k+"</b><div class='prose'>"+md(v)+"</div></div>":""}
  h+=row("Problem",b.problem)+row("What is asked",b.asked)+row("Idea",b.idea);
  h+='<div data-slot="fig"></div>';
  if(b.steps)h+='<div class="row"><b>Steps</b><div class="prose"><ol>'+b.steps.map(function(s){return "<li>"+P.inline(s)+"</li>"}).join("")+"</ol></div></div>";
  h+='<div data-slot="trace"></div>';
  if(b.ans)h+='<div class="row"><b>Answer</b><div><span class="ans">'+P.inline(b.ans)+"</span></div></div>";
  h+=row("Common mistake",b.mistake)+"</div>";
  w.innerHTML=h;
  if(b.fig)w.querySelector('[data-slot=fig]').replaceWith(fig(b.fig));
  if(b.trace)w.querySelector('[data-slot=trace]').replaceWith(trace(b.trace));
  return w;
}
P.block=function(b,ctx){
  var e;
  switch(b.t){
    case "p": e=el("div","prose",md(b.md));break;
    case "co": e=el("div","co "+(b.kind||"def"),'<div class="ic">'+(CO[b.kind||"def"][1])+'</div><div><div class="ti">'+esc(b.title||CO[b.kind||"def"][0])+'</div><div class="bd prose">'+md(b.md)+"</div></div>");break;
    case "code": e=codeBlock(b);break;
    case "table": e=el("div",null,table(b.head,b.rows,b.cls));break;
    case "trace": e=trace(b);break;
    case "ex": e=example(b);break;
    case "fig": e=fig(b);break;
    case "frames": e=frames(b);break;
    case "widget": e=el("div","wd",'<div class="wh"><span>Try it</span>'+esc(b.title||b.name)+'</div><div class="wb"></div>');
      var fn=P.widgets[b.name];if(fn)fn(e.querySelector(".wb"),b.props||{});else e.querySelector(".wb").textContent="Widget not available: "+b.name;break;
    case "compare": e=el("div",null,'<div class="prose"><h4>'+P.inline(b.title||"Compare")+"</h4></div>"+table(b.head,b.rows));break;
    case "cols": e=el("div","grid g2");b.items.forEach(function(it){e.appendChild(P.block(it,ctx))});break;
    default: e=el("div");
  }
  P.math(e);return e;
};
P.blocks=function(list,ctx){var f=document.createDocumentFragment();(list||[]).forEach(function(b){f.appendChild(P.block(b,ctx))});return f};

/* ---------- question card ---------- */
function solHTML(q){
  var s=q.sol||{},h='<div class="sol">';
  function sec(t,body){return body?"<h4>"+t+"</h4>"+body:""}
  var tg=function(x){return x?'<span class="tag '+x+'">['+x+"]</span>":""};
  h+=sec("1. What is asked, what is given, clue words",prose(s.asked));
  h+=sec("2. The governing idea and why it applies",prose(s.idea));
  h+='<div data-slot="method"></div>';
  if(s.opts){
    var ks=P.isNum(q)?[]:q.key,ok=function(i){return ks.indexOf(i)>=0};
    h+="<h4>4. Every option explained</h4>"+q.options.map(function(o,i){var L=P.letters[i];return '<div class="optnote '+(ok(i)?"t":"f")+'"><b>'+L+"</b><div class='prose'>"+md((s.opts[L]||s.opts[i]||""))+"</div></div>"}).join("");
  }
  h+=sec("5. Other valid methods",prose(s.other));
  h+=sec("6. Verification",prose(s.verify));
  h+=sec("7. Trap, recognition rule, transfer",prose([s.trap&&"**Trap:** "+s.trap,s.rule&&"**Recognition rule:** "+s.rule,s.transfer&&"**Hidden transfer question:** "+s.transfer].filter(Boolean).join("\n\n")));
  h+='<p style="font-size:.8rem;color:var(--mute)">Key source: '+tg(q.tag||"SRC")+"</p></div>";
  return h;
}
function optBody(o){
  if(typeof o==="string")return md(o);
  var h=o.md?md(o.md):"";
  if(o.tree)h+=P.treeSVG(o.tree,{dx:34,dy:48,alt:o.alt||"tree option"});
  if(o.table)h+=table(o.table.head,o.table.rows);
  return h;
}
P.qcard=function(q,opt){
  opt=opt||{};var S=P.load(),card=el("div","qcard"),sel=[],conf=null,done=false,hints=0;
  var multi=q.type==="MSQ",isnum=P.isNum(q);
  var label=q.exam?esc(q.exam)+(q.qno?" · Q"+esc(q.qno):""):(q.concept?esc(q.concept):"Practice");
  var head='<div class="qh"><b>'+label+"</b>"+(q.id?'<span title="Question id">id '+esc(q.id)+"</span>":"")+(q.marks!=null?'<span class="pill">'+q.marks+" mark"+(q.marks==1?"":"s")+"</span>":"")+'<span class="pill">'+esc(q.type||"MCQ")+"</span>"+(q.tag&&q.tag!=="SRC"?'<span class="tag '+esc(q.tag)+'">['+esc(q.tag)+"]</span>":(q.pyq?'<span class="tag">[SRC]</span>':""))+(q.diff?'<span class="pill">'+esc(q.diff)+"</span>":"")+'<span class="push status"></span></div>';
  var b='<div class="qb"><div class="stem">'+md(q.stem)+"</div><div data-slot='extra'></div><div data-slot='ans'></div><div data-slot='hints'></div><div data-slot='conf'></div><div class='qa'></div><div data-slot='res'></div></div>";
  card.innerHTML=head+b;
  var extra=card.querySelector("[data-slot=extra]");
  if(q.table)extra.appendChild(el("div",null,table(q.table.head,q.table.rows)));
  if(q.code)extra.appendChild(codeBlock({code:q.code,title:q.codeTitle||"Code from the question"}));
  if(q.fig)extra.appendChild(fig(q.fig));
  if(q.figNote)extra.appendChild(el("p","note",'<span style="font-size:.84rem;color:var(--mute)">'+P.inline(q.figNote)+"</span>"));
  if(q.flag)extra.appendChild(el("div","flagbox","<b>[FLAG]</b> "+P.inline(q.flag)));
  var ans=card.querySelector("[data-slot=ans]"),optEls=[],inp=null;
  if(isnum){ans.innerHTML='<div class="numin"><input type="text" inputmode="decimal" aria-label="Your numeric answer" placeholder="your answer"></div>';inp=ans.querySelector("input")}
  else{
    var ol=el("div","opts");
    q.options.forEach(function(o,i){
      var d=el("div","opt"+(multi?" msq":""),'<span class="k2">'+P.letters[i]+'</span><div class="ot">'+optBody(o)+"</div>");
      d.setAttribute("role",multi?"checkbox":"radio");d.tabIndex=0;
      function pick(){if(done)return;
        if(multi){var k=sel.indexOf(i);if(k>=0)sel.splice(k,1);else sel.push(i);d.classList.toggle("sel")}
        else{sel=[i];optEls.forEach(function(x){x.classList.remove("sel")});d.classList.add("sel")}
        d.setAttribute("aria-checked",d.classList.contains("sel"))}
      d.onclick=pick;d.onkeydown=function(e){if(e.key===" "||e.key==="Enter"){e.preventDefault();pick()}};
      ol.appendChild(d);optEls.push(d);
    });
    ans.appendChild(ol);if(multi)ans.insertAdjacentHTML("afterbegin",'<div style="font-size:.84rem;color:var(--mute)">Select all that apply.</div>');
  }
  var cf=card.querySelector("[data-slot=conf]");
  if(!opt.noConf){cf.innerHTML='<div class="conf">How sure are you? '+["Sure","Unsure","Guess"].map(function(c){return '<button type="button" data-c="'+c+'">'+c+"</button>"}).join("")+"</div>";
    P.$$("button",cf).forEach(function(bt){bt.onclick=function(){conf=bt.dataset.c;P.$$("button",cf).forEach(function(x){x.classList.toggle("on",x===bt)})}})}
  var qa=card.querySelector(".qa"),res=card.querySelector("[data-slot=res]"),hz=card.querySelector("[data-slot=hints]");
  card.getResp=function(){return isnum?inp.value.trim():sel.slice()};
  card.hasResp=function(){var r=card.getResp();return isnum?r!=="":r.length>0};
  card.getConf=function(){return conf};
  function showSolution(kind,ok){
    var sh=el("div",null,solHTML(q));
    var m=sh.querySelector("[data-slot=method]");
    var s=q.sol||{},mb=el("div");
    mb.innerHTML="<h4>3. Best exam method, worked fully</h4>"+prose(s.method);
    if(s.fig)mb.appendChild(fig(s.fig));
    if(s.trace)mb.appendChild(trace(s.trace));
    if(s.code)mb.appendChild(codeBlock({code:s.code,title:"Check by running it",lex:s.lex}));
    m.replaceWith(mb);
    res.appendChild(sh);P.math(res);
  }
  function showSimple(){
    var h='<div class="sol"><h4>Why</h4>'+prose(q.explain||"");
    if(q.why&&!isnum){var ks=q.key;h+="<h4>Every option</h4>"+q.options.map(function(o,i){var L=P.letters[i];return '<div class="optnote '+(ks.indexOf(i)>=0?"t":"f")+'"><b>'+L+"</b><div class='prose'>"+md(q.why[L]||"")+"</div></div>"}).join("")}
    if(q.fix)h+='<h4>If you got it wrong</h4>'+prose(q.fix);
    h+="</div>";var d=el("div",null,h);res.appendChild(d);P.math(d);
  }
  card.grade=function(final){
    if(done)return;var resp=card.getResp(),ok=P.check(q,resp);done=true;
    card.classList.add(ok?"ok":"bad");
    var rec=S.ans[q.id]||{n:0};rec.n=(rec.n||0)+1;rec.ok=ok;rec.conf=conf||"none";rec.t=Date.now();rec.topic=q.topicId;if(q.id)S.ans[q.id]=rec;
    if(ok)S.solved[q.id]=1;P.save();
    optEls.forEach(function(d,i){var isKey=q.key&&((q.key.indexOf(i)>=0)||(ok&&sel.indexOf(i)>=0));d.classList.add("locked");d.classList.remove("sel");
      if(isKey)d.classList.add("right");else if(sel.indexOf(i)>=0)d.classList.add("wrong")});
    if(inp)inp.disabled=true;
    var msg=ok?"Correct.":"Not quite. The accepted answer is "+P.keyText(q)+".";
    if(ok&&conf&&conf!=="Sure")msg+=" You were not sure, so we mark this as not yet secure.";
    if(!ok&&conf==="Sure")msg+=" You were sure, so this is a dangerous misconception: read the explanation carefully.";
    res.innerHTML='<div class="verdict '+(ok?"ok":"bad")+'">'+msg+"</div>";
    if(q.alsoKey||(q.num&&q.num.also))res.innerHTML+='<div class="flagbox">Both answers are accepted for this question. See the [FLAG] note.</div>';
    qa.innerHTML="";cf.innerHTML="";
    if(q.sol)showSolution("graded",ok);else if(q.explain)showSimple();
    if(opt.onDone)opt.onDone(ok,card);
  };
  card.reveal=function(){
    if(done)return;done=true;card.classList.add("bad");
    optEls.forEach(function(d,i){d.classList.add("locked");if(q.key&&q.key.indexOf(i)>=0)d.classList.add("right")});
    if(inp){inp.disabled=true}
    var rec=S.ans[q.id]||{n:0};rec.n=(rec.n||0)+1;rec.ok=false;rec.conf="gave-up";rec.t=Date.now();rec.topic=q.topicId;if(q.id)S.ans[q.id]=rec;P.save();
    res.innerHTML='<div class="verdict skip">Shown without an attempt. The answer is '+esc(P.keyText(q))+". It counts as a miss, so try the practice variation after reading.</div>";
    qa.innerHTML="";cf.innerHTML="";if(q.sol)showSolution("reveal",false);else if(q.explain)showSimple();
    if(opt.onDone)opt.onDone(false,card);
  };
  card._keys={done:function(){return done||card.classList.contains("ok")||card.classList.contains("bad")},pick:function(i){if(!optEls[i]||optEls[i].classList.contains("locked"))return false;optEls[i].click();return true},submit:function(){return false}};
  if(opt.mock){card.querySelector(".qh .status").textContent="";return card}
  var sub=el("button","btn","Submit");sub.type="button";
  sub.onclick=function(){if(!card.hasResp()){P.toast(isnum?"Type a number first":"Pick an answer first");return}card.grade()};
  qa.appendChild(sub);
  if(inp)inp.onkeydown=function(e){if(e.key==="Enter")sub.click()};
  card._keys.submit=function(){if(card._keys.done())return false;sub.click();return true};
  if(q.sol&&!opt.noHints){
    var hb=el("button","btn ghost","Need a hint?");hb.type="button";
    hb.onclick=function(){
      var hs=[q.sol.clue||q.hint&&q.hint[0],q.sol.first||q.hint&&q.hint[1]].filter(Boolean);
      if(hints<hs.length){hz.insertAdjacentHTML("beforeend",'<div class="hint"><b>Hint '+(hints+1)+(hints?" (first move)":" (what to look for)")+":</b> "+P.inline(hs[hints])+"</div>");hints++;P.math(hz)}
      if(hints>=hs.length)hb.disabled=true;
    };
    qa.appendChild(hb);
    var gv=el("button","btn ghost","I give up, show me");gv.type="button";
    gv.onclick=function(){card.reveal()};qa.appendChild(gv);
  }
  var prev=S.ans[q.id];
  if(prev&&opt.showPrev!==false&&q.id){var st=card.querySelector(".status");st.innerHTML=prev.ok?'<span class="pill ok">solved before'+(prev.conf&&prev.conf!=="Sure"&&prev.conf!=="none"?", not yet secure":"")+"</span>":'<span class="pill bad">missed before</span>'}
  P.math(card);
  return card;
};
})();
