/* MAD 1 engine: block renderers (core[] and deep[] of a section). Every string goes through renderRich/inline/esc. */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el;
function rich(s,ctx){return A.renderRich(s,{seen:ctx&&ctx.seen})}
function inl(s,ctx){return A.inline(s,ctx&&ctx.seen)}
var CO={def:["Definition","D"],formula:["Formula","f"],example:["Example","E"],warn:["Trap","!"],analogy:["Analogy","≈"],remember:["Remember","★"],notice:["Notice that","i"],tip:["Exam tip","✓"],extra:["Extra, not asked in PYQs","+"]};

/* ---------- reveal-steps helper: steps shown one at a time, only after the student commits to an attempt ---------- */
function stepReveal(steps,ctx,opt){
  opt=opt||{};var w=el("div","sr-steps"),n=steps.length,shown=0;
  var gate=opt.gate!==false;
  w.innerHTML=(gate?'<div class="sr-gate"><p class="sr-ask">Try it on paper first. When you have an answer (or you are stuck), open the steps.</p><button class="btn sm" type="button" data-a="start">I have tried: show step 1</button></div>':"")
    +'<ol class="sr-list"></ol><div class="sr-ctl" hidden><span class="sr-cnt" aria-live="polite"></span><button class="btn sm" type="button" data-a="next">Next step</button><button class="btn sm ghost" type="button" data-a="all">Show all steps</button></div><div class="sr-after" hidden></div>';
  var list=w.querySelector(".sr-list"),ctl=w.querySelector(".sr-ctl"),after=w.querySelector(".sr-after");
  function show(k){
    while(shown<k&&shown<n){var li=el("li","",rich(steps[shown],ctx));list.appendChild(li);A.math(li);shown++}
    ctl.hidden=false;w.querySelector(".sr-cnt").textContent="Step "+shown+" of "+n;
    if(shown>=n){w.querySelector("[data-a=next]").hidden=true;w.querySelector("[data-a=all]").hidden=true;if(opt.after){after.hidden=false;after.innerHTML=opt.after;A.math(after)}if(opt.onDone)opt.onDone()}
  }
  w.addEventListener("click",function(e){var b=e.target.closest("[data-a]");if(!b)return;var a=b.dataset.a;
    if(a==="start"){b.closest(".sr-gate").remove();show(1)}else if(a==="next")show(shown+1);else if(a==="all")show(n)});
  if(!gate)show(1);
  w.showAll=function(){var g=w.querySelector(".sr-gate");if(g)g.remove();show(n)};
  return w;
}
A.stepReveal=stepReveal;

function codeBlock(b,ctx){
  var w=el("div","code-wrap");
  w.innerHTML=A.codeHTML(b.src||b.code||"",b.lang,{title:b.title||b.lang});
  if(b.lines&&b.lines.length)w.insertAdjacentHTML("beforeend",'<div class="code-lex"><b>What each line does</b><ol>'+b.lines.map(function(x){return '<li><span class="code-lex-n">line '+esc(x[0])+'</span><span>'+inl(x[1],ctx)+"</span></li>"}).join("")+"</ol></div>");
  return w;
}
function trace(b,ctx){
  var w=el("div","stepper"),rows=b.rows,n=rows.length,notes=b.notes;
  var cols=b.cols.concat(Array.isArray(notes)?["What happens"]:[]);
  var h='<div class="sh"><b>'+esc(b.title||"Trace table")+'</b><span class="cnt" aria-live="polite"></span><button class="btn sm ghost prev" type="button">Back</button><button class="btn sm next" type="button">Next row</button><button class="btn sm ghost all" type="button">Show all</button></div>';
  h+='<div class="tw"><table class="trace"><thead><tr>'+cols.map(function(c){return "<th>"+inl(c,ctx)+"</th>"}).join("")+"</tr></thead><tbody>";
  rows.forEach(function(r,i){h+='<tr data-i="'+i+'">'+r.map(function(c){return '<td class="mono">'+esc(c)+"</td>"}).join("")+(Array.isArray(notes)?'<td class="note">'+inl(notes[i]||"",ctx)+"</td>":"")+"</tr>"});
  h+="</tbody></table></div>"+(typeof notes==="string"?'<div class="trace-foot prose">'+rich(notes,ctx)+"</div>":"");
  w.innerHTML=h;
  var shown=1,trs=A.$$("tbody tr",w),cnt=w.querySelector(".cnt");
  function upd(){trs.forEach(function(r,i){r.classList.toggle("future",i>=shown)});cnt.textContent="row "+shown+" of "+n}
  w.querySelector(".next").onclick=function(){if(shown<n)shown++;upd()};
  w.querySelector(".prev").onclick=function(){if(shown>1)shown--;upd()};
  w.querySelector(".all").onclick=function(){shown=n;upd()};
  upd();return w;
}
function figInner(b){
  if(b.svg)return b.svg;              /* SVG written by the content author (trusted data file, fixed coordinates) */
  if(b.graph)return A.graphSVG(b.graph);
  if(b.line)return A.lineSVG(b.line);
  if(b.bar)return A.barSVG(b.bar);
  if(b.flow)return flowSVG(b.flow);
  return "";
}
A.figInner=figInner;
function fig(b,ctx){var f=el("figure","fig");f.innerHTML=figInner(b)+(b.caption?"<figcaption>"+inl(b.caption,ctx)+"</figcaption>":"");return f}
/* flowchart with fixed positions: nodes[{id,text,x,y,w,h,kind:start|step|decision|end}], edges[[from,to,label]] */
function flowSVG(o){
  var W=o.W||560,H=o.H||360,N={};o.nodes.forEach(function(n){N[n.id]=n});
  var s='<svg class="fig-svg flow" viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||"flowchart")+'"><defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink2)"/></marker></defs>';
  function box(n){var w=n.w||150,h=n.h||40;return {x:n.x-w/2,y:n.y-h/2,w:w,h:h}}
  function edgePt(n,tx,ty){var b=box(n),cx=n.x,cy=n.y,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return [cx,cy];var sx=Math.abs(dx)>1e-9?(b.w/2)/Math.abs(dx):1e9,sy=Math.abs(dy)>1e-9?(b.h/2)/Math.abs(dy):1e9,k=Math.min(sx,sy);return [cx+dx*k,cy+dy*k]}
  (o.edges||[]).forEach(function(e){var a=N[e[0]],b=N[e[1]];if(!a||!b)return;var p=edgePt(a,b.x,b.y),q=edgePt(b,a.x,a.y);
    s+='<line x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'" stroke="var(--ink2)" stroke-width="1.6" marker-end="url(#fa)"/>';
    if(e[2])s+='<text x="'+((p[0]+q[0])/2+6)+'" y="'+((p[1]+q[1])/2-4)+'" font-size="11" fill="var(--mute)">'+esc(e[2])+"</text>"});
  o.nodes.forEach(function(n){var b=box(n),k=n.kind||"step";
    if(k==="decision")s+='<polygon points="'+n.x+","+b.y+" "+(b.x+b.w)+","+n.y+" "+n.x+","+(b.y+b.h)+" "+b.x+","+n.y+'" fill="var(--frontier-soft)" stroke="var(--frontier)" stroke-width="1.6"/>';
    else s+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="'+(k==="start"||k==="end"?b.h/2:6)+'" fill="'+(k==="end"?"var(--visited-soft)":"var(--card)")+'" stroke="'+(k==="end"?"var(--visited)":"var(--ink2)")+'" stroke-width="1.6"/>';
    String(n.text).split("\n").forEach(function(t,i,arr){s+='<text x="'+n.x+'" y="'+(n.y+4+(i-(arr.length-1)/2)*14)+'" text-anchor="middle" font-size="12" fill="var(--ink)">'+esc(t)+"</text>"})});
  return s+"</svg>";
}
A.flowSVG=flowSVG;
function stateHTML(st,ctx){
  if(st==null)return "";
  if(typeof st==="string")return '<div class="prose">'+rich(st,ctx)+"</div>";
  var h="";
  if(st.code!=null){var lines=String(st.code).split("\n"),hl=st.hl||[];
    h+='<div class="cb" data-lang="'+esc(st.lang||"python")+'"><pre class="cb-pre"><code>'+lines.map(function(l,i){return '<span class="cb-ln'+(hl.indexOf(i+1)>=0?" cb-on":"")+'"><span class="cb-n">'+(i+1)+'</span><span class="cb-t">'+(A.hl(l,st.lang||"python")||" ")+"</span></span>"}).join("")+"</code></pre></div>"}
  if(st.table)h+=A.tableHTML(st.table.head,st.table.rows,"",ctx&&ctx.seen);
  if(st.vars)h+='<div class="pl-vars">'+Object.keys(st.vars).map(function(k){return '<span><b>'+esc(k)+"</b> = <code>"+esc(st.vars[k])+"</code></span>"}).join("")+"</div>";
  if(st.out!=null)h+='<div class="pl-out"><b>Terminal</b><pre>'+esc(st.out)+"</pre></div>";
  if(st.svg||st.graph||st.flow||st.line)h+='<div class="fig">'+figInner(st)+"</div>";
  if(st.text)h+='<div class="prose">'+rich(st.text,ctx)+"</div>";
  return h;
}
A.stateHTML=stateHTML;
function player(b,ctx){
  var w=el("div","stepper player"),n=b.frames.length,i=0,timer=null;
  w.innerHTML='<div class="sh"><b>'+esc(b.title||"Step through it")+'</b><span class="cnt" aria-live="polite"></span><button class="btn sm ghost prev" type="button">Back</button><button class="btn sm next" type="button">Next</button><button class="btn sm ghost play" type="button">Play</button></div><div class="pl-frame"></div><div class="pl-cap prose" aria-live="polite"></div>';
  var fr=w.querySelector(".pl-frame"),cap=w.querySelector(".pl-cap"),cnt=w.querySelector(".cnt"),play=w.querySelector(".play");
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(){var f=b.frames[i];fr.innerHTML=stateHTML(f.state,ctx);cap.innerHTML=rich(f.caption||"",ctx);A.math(w);cnt.textContent="step "+(i+1)+" of "+n;
    w.querySelector(".prev").disabled=i===0;w.querySelector(".next").disabled=i===n-1}
  function stop(){if(timer){clearInterval(timer);timer=null;play.textContent="Play"}}
  w.querySelector(".next").onclick=function(){stop();if(i<n-1)i++;draw()};
  w.querySelector(".prev").onclick=function(){stop();if(i>0)i--;draw()};
  play.onclick=function(){if(timer){stop();return}if(i>=n-1)i=0;play.textContent="Pause";draw();timer=setInterval(function(){if(i<n-1){i++;draw()}else stop()},reduce?3500:(b.ms||2000))};
  draw();w._stop=stop;return w;
}
function keyIndex(k,n){if(typeof k==="number")return k;var i="ABCDEFGH".indexOf(String(k).toUpperCase());return i>=0&&i<n?i:-1}
function yourMove(b,ctx){
  var w=el("div","ym"),ki=keyIndex(b.key,b.choices.length),done=false;
  w.innerHTML='<div class="ym-h"><span class="ym-badge">Your move</span>'+esc(b.title||"")+'</div><div class="ym-state">'+stateHTML(b.state,ctx)+'</div><p class="ym-q">'+inl(b.prompt,ctx)+'</p><div class="ym-ch" role="group" aria-label="Choose the next step"></div><div class="ym-fb" aria-live="polite"></div>';
  var ch=w.querySelector(".ym-ch"),fb=w.querySelector(".ym-fb");
  b.choices.forEach(function(c,i){var bt=el("button","ym-opt",'<span class="k2">'+"ABCDEFGH"[i]+"</span><span>"+inl(c,ctx)+"</span>");bt.type="button";
    bt.onclick=function(){
      var why=Array.isArray(b.why)?b.why[i]:(i===ki?b.why:(b.whyNot&&b.whyNot[i])||"Not this one. Think about what the code does next.");
      if(i===ki){done=true;bt.classList.add("right");A.$$(".ym-opt",ch).forEach(function(x){x.disabled=true});fb.className="ym-fb ok";fb.innerHTML="<b>Yes.</b> "+rich(why,ctx)}
      else{bt.classList.add("wrong");bt.disabled=true;fb.className="ym-fb bad";fb.innerHTML="<b>Not quite.</b> "+rich(why,ctx)+" Try another move."}
      A.math(fb);var S=A.load();if(b.id){S.moves[b.id]=done?1:0;A.save()}
    };ch.appendChild(bt)});
  return w;
}
function norm(v){return String(v==null?"":v).trim().replace(/\s+/g," ").replace(/^['"]|['"]$/g,"").toLowerCase()}
function handTrace(b,ctx){
  var w=el("div","ht"),blanks=b.blanks||[],key=b.key||[],isBlank={};
  blanks.forEach(function(rc,k){isBlank[rc[0]+","+rc[1]]=k});
  var h='<div class="ht-h"><span class="ym-badge">Fill the trace</span>'+esc(b.title||"")+'</div>'+(b.prompt?'<div class="prose">'+rich(b.prompt,ctx)+"</div>":"")
    +'<div class="tw"><table class="trace ht-t"><thead><tr>'+b.cols.map(function(c){return "<th>"+inl(c,ctx)+"</th>"}).join("")+"</tr></thead><tbody>";
  b.given.forEach(function(r,ri){h+="<tr>"+r.map(function(c,ci){var k=isBlank[ri+","+ci];return k!=null?'<td><input class="ht-in field" data-k="'+k+'" aria-label="Row '+(ri+1)+", "+esc(A.plain(b.cols[ci]))+'" autocomplete="off" spellcheck="false"></td>':'<td class="mono">'+esc(c)+"</td>"}).join("")+"</tr>"});
  h+='</tbody></table></div><div class="ht-ctl"><button class="btn sm" type="button" data-a="check">Check my cells</button><button class="btn sm ghost" type="button" data-a="show">Show the answers</button><span class="ht-score" aria-live="polite"></span></div>';
  w.innerHTML=h;
  var ins=A.$$(".ht-in",w);
  function checkOne(inp){var k=+inp.dataset.k,v=inp.value;if(!v.trim()){inp.classList.remove("ok","bad");return null}
    var ok=norm(v)===norm(key[k]);inp.classList.toggle("ok",ok);inp.classList.toggle("bad",!ok);if(ok)inp.readOnly=true;return ok}
  ins.forEach(function(inp){inp.addEventListener("change",function(){checkOne(inp)});inp.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();checkOne(inp)}})});
  w.querySelector("[data-a=check]").onclick=function(){var ok=0;ins.forEach(function(i){if(checkOne(i))ok++});w.querySelector(".ht-score").textContent=ok+" of "+ins.length+" cells right"};
  w.querySelector("[data-a=show]").onclick=function(){ins.forEach(function(i){if(!i.classList.contains("ok")){i.value=String(key[+i.dataset.k]);i.classList.add("shown");i.readOnly=true}});w.querySelector(".ht-score").textContent="Answers shown in italics"};
  return w;
}
function example(b,ctx){
  var w=el("div","ex"),lv=b.level||"foundation",labels={foundation:"Foundation",simple:"Foundation",exam:"Exam level",mid:"Exam level",tricky:"Tricky",hard:"Tricky"};
  var h='<div class="eh"><span class="lv '+esc(lv)+'">'+(labels[lv]||"Worked example")+"</span>"+inl(b.title||"Worked example",ctx)+'</div><div class="eb">';
  function row(k,v){return v?'<div class="row"><b>'+k+'</b><div class="prose">'+rich(v,ctx)+"</div></div>":""}
  h+=row("Problem",b.problem);
  if(b.code)h+='<div data-slot="code"></div>';
  h+=row("What is asked",b.asked)+row("Idea",b.idea)+'<div data-slot="steps"></div></div>';
  w.innerHTML=h;
  if(b.code)w.querySelector("[data-slot=code]").replaceWith(codeBlock({src:b.code,lang:b.lang},ctx));
  var after=(b.answer?'<div class="row"><b>Answer</b><div><span class="ans">'+inl(b.answer,ctx)+"</span></div></div>":"")+(b.mistake?'<div class="row"><b>Common mistake</b><div class="prose">'+rich(b.mistake,ctx)+"</div></div>":"");
  w.querySelector("[data-slot=steps]").replaceWith(stepReveal(b.steps||[],ctx,{after:after}));
  return w;
}
function compare(b,ctx){
  var e=el("div","cmp");e.innerHTML=(b.title?'<div class="prose"><h4>'+inl(b.title,ctx)+"</h4></div>":"")+A.tableHTML(b.cols,b.rows,"cmp-t",ctx&&ctx.seen);return e;
}
A.block=function(b,ctx){
  var e;ctx=ctx||{seen:{}};
  switch(b.t){
    case "p": e=el("div","prose",rich(b.text,ctx));break;
    case "co": var k=CO[b.kind]?b.kind:"def";e=el("div","co "+k,'<div class="ic" aria-hidden="true">'+CO[k][1]+'</div><div><div class="ti">'+esc(b.title||CO[k][0])+'</div><div class="bd prose">'+rich(b.text,ctx)+"</div></div>");break;
    case "table": e=el("div","tbl",(b.title?'<div class="prose"><h4>'+inl(b.title,ctx)+"</h4></div>":"")+A.tableHTML(b.head,b.rows,"",ctx.seen));break;
    case "code": e=codeBlock(b,ctx);break;
    case "trace": e=trace(b,ctx);break;
    case "ex": e=example(b,ctx);break;
    case "fig": e=fig(b,ctx);break;
    case "flow": e=fig({flow:b,caption:b.caption},ctx);break;
    case "player": e=player(b,ctx);break;
    case "yourMove": e=yourMove(b,ctx);break;
    case "handTrace": e=handTrace(b,ctx);break;
    case "compare": e=compare(b,ctx);break;
    default: e=el("div","bad-block","Unknown block type: "+esc(b.t));console.error("unknown block type",b.t);
  }
  A.math(e);return e;
};
A.blocks=function(list,ctx){ctx=ctx||{seen:{}};var f=document.createDocumentFragment();(list||[]).forEach(function(b){f.appendChild(A.block(b,ctx))});return f};
A.BLOCK_TYPES=["p","table","co","ex","fig","code","trace","player","yourMove","handTrace","compare","flow"];
})();
