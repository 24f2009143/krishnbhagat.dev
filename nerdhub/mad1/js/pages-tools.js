/* MAD 1 pages: practice next (adaptive), mock, mistakes, flashcards, glossary, plan, cheatsheet, search, settings,
 * refreshers, and the site-wide layers that open after all topics (Phase E). */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el,$=A.$,$$=A.$$;
function wrap(root,title,sub){var p=el("div","page");p.innerHTML="<h1>"+esc(title)+'</h1><p class="sub">'+sub+"</p>";root.appendChild(p);return p}
function readyTopics(){return A.examTopics(A.exam()).filter(A.isReady)}
function none(p){p.appendChild(el("div","box",'<p>No topic of '+esc(A.examLabel(A.exam()))+' is built yet. This tool fills in as topics are added. <a href="#home">Back to the course</a></p>'))}

/* ---------- practice next ---------- */
A.pages.practice=function(root){
  var p=wrap(root,"Practice next","The next question comes from the concept with the most marks at risk for "+esc(A.examLabel(A.exam()))+": marks the exam puts on it times the chance you do not know it today (it fades if you have not practised).");
  var R=readyTopics();if(!R.length)return none(p);
  var sc=A.scopePill(function(){A.route()});if(sc)p.appendChild(sc);
  var area=el("div");p.appendChild(area);var recent=[];
  function concepts(){var out=[];R.forEach(function(m){var t=A.topics[m.id],cm=A.conceptMarks(m.id);Object.keys(t.concepts||{}).forEach(function(k){out.push({key:m.id+":"+k,topic:m.id,c:k,marks:(cm[k]?cm[k].marks:0)+1})})});return out}
  function poolFor(topic,c,stage){
    var all=Object.keys(A.qIndex).map(function(k){return A.qIndex[k]}).filter(function(q){return q.topicId===topic&&q.concept===c&&recent.indexOf(q.uid)<0&&(!q.pyq||A.pyqsOf(topic).indexOf(q)>=0)});
    var want={single:["quiz","diagnostic"],double:["practice","quiz"],pyq:["pyq"],variation:["practice","test"],timed:["pyq","test"]}[stage];
    var pick=all.filter(function(q){return want.indexOf(q.pyq?"pyq":q.kind)>=0});return pick.length?pick:all;
  }
  function next(){
    var S=A.load(),now=Date.now(),cs=concepts(),ex=[],tries=0,ch,pool;
    while(tries++<cs.length){ch=A.adapt.pickConcept(cs,S.bkt,now,ex);if(!ch)break;var c=cs.find(function(x){return x.key===ch.key});pool=poolFor(c.topic,c.c,A.adapt.stageFor(S.bkt[ch.key]));if(pool.length)break;ex.push(ch.key)}
    area.innerHTML="";
    if(!ch||!pool||!pool.length){area.innerHTML='<div class="box">You have worked through everything here. Try a <a href="#mock">timed mock</a>.</div>';return}
    var parts=ch.key.split(":"),t=A.topics[parts[0]],con=t.concepts[parts[1]]||{name:parts[1]},rec=S.bkt[ch.key],rule=A.adapt.ruleOf3(rec),stage=A.adapt.stageFor(rec);
    if(rule==="repair"){var rp=el("div","box repair-box",'<h3>Three misses on "'+esc(con.name)+'": read this first</h3><div class="prose">'+A.renderRich(con.repair||"")+'</div><button class="btn" type="button">I have read it: continue</button>');
      rp.querySelector("button").onclick=function(){var S2=A.load();S2.bkt[ch.key]=Object.assign({},S2.bkt[ch.key],{miss:0});A.save();next()};area.appendChild(rp);return}
    if(rule==="combine"){var hard=Object.keys(A.qIndex).map(function(k){return A.qIndex[k]}).filter(function(q){return q.topicId===parts[0]&&(q.diff==="hard"||q.pyq&&(+q.marks||0)>=4)&&recent.indexOf(q.uid)<0});if(hard.length){pool=hard;stage="combined"}}
    var q=pool[Math.floor(Math.random()*pool.length)];recent.push(q.uid);if(recent.length>8)recent.shift();
    area.appendChild(el("p","why-next",'<b>'+esc(t.name)+" · "+esc(con.name)+"</b> · "+A.fmt(ch.risk)+" marks at risk · stage: "+esc(stage==="combined"?"three secure wins, so a harder combined question":stage)));
    area.appendChild(A.qcard(q,{shuffle:true,onDone:function(){var b=el("button","btn","Next question");b.type="button";b.onclick=next;area.appendChild(b);b.focus()}}));
  }
  next();
};
/* ---------- mock ---------- */
A.pages.mock=function(root){
  var ex=A.exam(),p=wrap(root,"Mock exam",esc(A.examLabel(ex))+": pick how many questions and minutes. The paper submits itself when time is up. Enter never submits the whole paper.");
  var R=readyTopics();if(!R.length)return none(p);
  var sc=A.scopePill(function(){A.route()});if(sc)p.appendChild(sc);
  var cfg=el("div","box");
  cfg.innerHTML='<label>Questions <input type="number" id="mn" class="field" value="16" min="3" max="60"></label> <label>Minutes <input type="number" id="mm" class="field" value="60" min="5" max="240"></label> <p class="sub">Questions are drawn from each 4-week block in proportion to its marks in this exam.</p><button class="btn" id="mgo" type="button">Start</button>';
  p.appendChild(cfg);var area=el("div");p.appendChild(area);
  $("#mgo",cfg).onclick=function(){
    var n=+$("#mn",cfg).value||16,mins=+$("#mm",cfg).value||60,byBlock={};
    R.forEach(function(m){A.pyqsOf(m.id).forEach(function(q){var b=A.blockOf(m);(byBlock[b]=byBlock[b]||[]).push(q)})});
    var C=A.countsFor(ex).blocks||{},keys=Object.keys(byBlock),tot=keys.reduce(function(a,k){return a+(C[k]||1)},0),qs=[];
    keys.forEach(function(k){var arr=byBlock[k].slice().sort(function(){return Math.random()-.5}),take=Math.max(1,Math.round(n*(C[k]||1)/tot));qs=qs.concat(arr.slice(0,take))});
    qs=qs.sort(function(){return Math.random()-.5}).slice(0,n);
    if(!qs.length){A.toast("No PYQs to draw from yet");return}
    cfg.classList.add("hidden");area.innerHTML="";
    var left=mins*60,tm=el("div","timer");tm.setAttribute("role","timer");area.appendChild(tm);
    var cards=[],box=el("div");area.appendChild(box);
    qs.forEach(function(q){var c=A.qcard(q,{mock:true});box.appendChild(c);cards.push(c)});
    var sub=el("button","btn","Submit the paper");sub.type="button";area.appendChild(sub);var out=el("div");area.appendChild(out);
    function fmt(s){return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
    var iv=setInterval(function(){left--;tm.textContent=fmt(Math.max(0,left))+" left";if(left<=0)finish(true)},1000);tm.textContent=fmt(left)+" left";
    function finish(auto){
      clearInterval(iv);sub.disabled=true;tm.remove();var by={},ok=0,mk=0,mt=0;
      cards.forEach(function(c,i){var q=qs[i],g=!!A.check(q,c.getResp());c.grade();var b=by[q.topicId]=by[q.topicId]||{n:0,ok:0,m:0,t:0};b.n++;b.t+=+q.marks||0;mt+=+q.marks||0;if(g){b.ok++;b.m+=+q.marks||0;ok++;mk+=+q.marks||0}});
      out.innerHTML='<div class="box result"><h2>'+(auto?"Time is up. ":"")+"Score: "+A.fmt(mk)+" / "+A.fmt(mt)+" marks ("+ok+" / "+qs.length+" questions)</h2>"+A.rawTable(["Topic","Correct","Marks"],Object.keys(by).map(function(k){return [esc(A.topicMeta(k).name),by[k].ok+" / "+by[k].n,A.fmt(by[k].m)+" / "+A.fmt(by[k].t)]}))+'<p>Every wrong answer is now in <a href="#mistakes">Mistakes</a>.</p></div>';
      out.scrollIntoView();
    }
    sub.onclick=function(){finish(false)};A.cleanup=function(){clearInterval(iv)};
  };
};
/* ---------- mistakes ---------- */
A.pages.mistakes=function(root){
  var p=wrap(root,"Mistakes","Wrong answers and guesses, to redo until each one is secure. Shared across exams.");
  var S=A.load(),ids=Object.keys(S.ans).filter(function(k){return A.qIndex[k]}),danger=[],missed=[],shaky=[];
  ids.forEach(function(k){var a=S.ans[k];if(!a.ok&&a.conf==="Sure")danger.push(k);else if(!a.ok)missed.push(k);else if(a.conf==="Unsure"||a.conf==="Guess")shaky.push(k)});
  Object.keys(S.shaky).forEach(function(k){if(A.qIndex[k]&&shaky.indexOf(k)<0&&danger.indexOf(k)<0&&missed.indexOf(k)<0)shaky.push(k)});
  if(!danger.length&&!missed.length&&!shaky.length){p.appendChild(el("div","box","<p>Nothing to redo yet. Anything you miss, guess or mark as shaky appears here.</p>"));return}
  [["Dangerous misconceptions (wrong but sure)",danger],["Missed",missed],["Right but not yet secure, or marked shaky",shaky]].forEach(function(g){
    if(!g[1].length)return;p.appendChild(el("h2","h2",esc(g[0])+' <span class="pill">'+g[1].length+"</span>"));
    g[1].forEach(function(k){var tag=S.ans[k]&&S.ans[k].tag;if(tag)p.appendChild(el("p","errline","Your reason last time: <b>"+esc(tag)+"</b>"));p.appendChild(A.qcard(A.qIndex[k],{showPrev:false}))});
  });
};
/* ---------- flashcards (Space flips, ← again, ↓ almost, → got it) ---------- */
A.pages.cards=function(root){
  var p=wrap(root,"Flashcards","Answer in your head, then flip. Space flips; ← again, ↓ almost, → got it. Cards you miss come back soon.");
  var S=A.load(),all=[];
  A.manifest.topics.filter(A.isReady).forEach(function(m){(A.topics[m.id].flash||[]).forEach(function(c,i){c.topic=m.id;c.cid=c.id||m.id+":f"+i;all.push(c)})});
  if(!all.length)return none(p);
  var INT=[10*60e3,864e5,3*864e5,7*864e5,16*864e5],ft=S.prefs.cardTopic||"";S.prefs.cardTopic="";A.save();
  var bar=el("div","chips");p.appendChild(bar);var stats=el("p","cstats");p.appendChild(stats);var area=el("div");p.appendChild(area);
  function pool(){return all.filter(function(c){return !ft||c.topic===ft})}
  function chips(){bar.innerHTML=[["","All topics"]].concat(A.manifest.topics.filter(A.isReady).map(function(m){return [m.id,m.short]})).map(function(x){return '<button type="button" class="chip'+(x[0]===ft?" on":"")+'" data-t="'+x[0]+'" aria-pressed="'+(x[0]===ft)+'">'+esc(x[1])+"</button>"}).join("");$$("[data-t]",bar).forEach(function(b){b.onclick=function(){ft=b.dataset.t;start()}})}
  function counts(){var now=Date.now(),pl=pool(),n=0,d=0;pl.forEach(function(c){var r=S.flash[c.cid];if(!r)n++;else if(r.due<=now)d++});stats.innerHTML="<span><b>"+pl.length+"</b> cards</span> <span><b>"+n+"</b> new</span> <span><b>"+d+"</b> due</span>"}
  var q=[],i=0,flipped=false;
  function start(){chips();counts();var now=Date.now();q=pool().filter(function(c){var r=S.flash[c.cid];return !r||r.due<=now}).slice(0,25);i=0;flipped=false;draw()}
  function rate(x){var c=q[i],rr=S.flash[c.cid]||{box:0},bx=x===0?0:x===1?rr.box:Math.min(4,rr.box+1);S.flash[c.cid]={box:bx,due:Date.now()+INT[bx]/(x===1?2:1)};A.save();flipped=false;i++;counts();draw()}
  function draw(){
    area.innerHTML="";
    if(i>=q.length){area.innerHTML='<div class="box"><h3>'+(q.length?"Session finished":"Nothing is due right now")+'</h3><button class="btn ghost" id="again" type="button">Check again</button></div>';$("#again",area).onclick=start;return}
    var c=q[i],card=el("div","fcard"+(flipped?" back":""),'<p class="fmeta"><b>'+esc(c.kind||"idea")+"</b><span>"+esc(A.topicMeta(c.topic).short)+"</span><span>"+(i+1)+" of "+q.length+'</span></p><div class="prose">'+A.renderRich(c.front)+"</div>"+(flipped?'<div class="prose fback">'+A.renderRich(c.back)+"</div>":""));
    card.tabIndex=0;card.setAttribute("role","button");card.setAttribute("aria-label",flipped?"Card answer":"Show the answer");
    area.appendChild(card);A.math(card);card.onclick=function(){if(!flipped){flipped=true;draw()}};
    var b=el("div","fbtns");
    if(!flipped){var sb=el("button","btn","Show answer <kbd>Space</kbd>");sb.type="button";sb.onclick=function(){flipped=true;draw()};b.appendChild(sb)}
    else [["Again","←",0,"bad"],["Almost","↓",1,"ghost"],["Got it","→",2,""]].forEach(function(x){var bt=el("button","btn "+x[3],x[0]+" <kbd>"+x[1]+"</kbd>");bt.type="button";bt.onclick=function(){rate(x[2])};b.appendChild(bt)});
    area.appendChild(b);
  }
  function key(e){if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$(".sr")||i>=q.length)return;
    if(e.key===" "&&!flipped){e.preventDefault();flipped=true;draw()}
    else if(flipped&&(e.key==="ArrowLeft"||e.key==="ArrowDown"||e.key==="ArrowRight")){e.preventDefault();rate(e.key==="ArrowLeft"?0:e.key==="ArrowDown"?1:2)}}
  document.addEventListener("keydown",key);A.cleanup=function(){document.removeEventListener("keydown",key)};
  start();
};
/* ---------- glossary ---------- */
A.pages.glossary=function(root){
  var p=wrap(root,"Glossary","Every term in plain words. In lessons, a term is underlined the first time it appears in a section.");
  var f=el("div","filters",'<input type="search" id="gs" class="field" placeholder="Search terms" aria-label="Search terms">');p.appendChild(f);var l=el("div","grid g2");p.appendChild(l);
  /* the core glossary plus every lesson's New words, each linked to the lesson that teaches it */
  var all=A.glossary.map(function(g){return {term:g.term,def:g.def,alias:g.alias}}),seen={};all.forEach(function(g){seen[g.term.toLowerCase()]=1});
  A.examTopics(A.exam()).filter(A.isReady).forEach(function(m){(A.topics[m.id].sections||[]).forEach(function(sec){(sec.terms||[]).forEach(function(w){var k=w[0].replace(/`/g,"").toLowerCase();if(seen[k])return;seen[k]=1;all.push({term:w[0].replace(/`/g,""),code:/`/.test(w[0]),def:w[1],from:{href:"#topic/"+m.id+"/lesson/"+sec.id,label:m.short+": "+sec.title}})})})});
  p.querySelector(".sub").textContent="Every term in plain words: "+all.length+" terms from the course and its lessons. Each lesson word links to the lesson that teaches it.";
  function draw(){var q=$("#gs",f).value.toLowerCase();l.innerHTML="";all.slice().sort(function(a,b){return a.term.replace(/^\W+/,"").localeCompare(b.term.replace(/^\W+/,""))}).filter(function(g){return !q||(g.term+" "+g.def).toLowerCase().indexOf(q)>=0}).forEach(function(g){var b=el("div","box",(g.code?"<code class=\"icode\">"+esc(g.term)+"</code>":"<b>"+esc(g.term)+"</b>")+(g.from?' <small class="mute">from <a href="'+g.from.href+'">'+esc(g.from.label)+"</a></small>":"")+(g.alias&&g.alias.length?' <small class="mute">also: '+esc(g.alias.join(", "))+"</small>":"")+"<div class='prose'>"+A.renderRich(g.def)+"</div>");l.appendChild(b);A.math(b)})}
  $("#gs",f).oninput=draw;draw();
  if(A.refreshers.length){p.appendChild(el("h2","h2","Refreshers"));p.appendChild(el("div","rfs",A.refreshers.map(A.refresherCard).join("")))}
};
A.pages.refresher=function(root,parts){
  var r=A.refreshers.find(function(x){return x.id===parts[0]});
  if(!r){root.innerHTML='<div class="page"><div class="box"><h2>No such refresher</h2><a class="btn" href="#glossary">Glossary and refreshers</a></div></div>';return}
  var p=wrap(root,r.title,esc(r.summary||""));
  if(r.upgradesTo&&A.isReady(A.topicMeta(r.upgradesTo)))p.appendChild(el("div","box",'This is now a full topic: <a href="#topic/'+esc(r.upgradesTo)+'">open the lessons</a>.'));
  p.appendChild(A.blocks(r.blocks||[]));
  (r.quiz||[]).forEach(function(q){p.appendChild(A.qcard(q,{noHints:true}))});
};
/* ---------- plan ---------- */
A.pages.plan=function(root){
  var p=wrap(root,"Study plan","Pick how much time you have. Time goes to topics by their marks in "+esc(A.examLabel(A.exam()))+".");
  var R=readyTopics();if(!R.length)return none(p);
  var opts=[["1 hour",60],["Half a day",240],["1 day",480],["1 week",7*180]],cur=0,tabs=el("div","tabs");
  opts.forEach(function(o,i){var b=el("button",i===0?"on":"",o[0]);b.type="button";b.onclick=function(){cur=i;$$("button",tabs).forEach(function(x,k){x.classList.toggle("on",k===i)});draw()};tabs.appendChild(b)});
  p.appendChild(tabs);var area=el("div");p.appendChild(area);
  function draw(){
    var budget=opts[cur][1],C=A.countsFor(A.exam()).topics,tm=R.reduce(function(a,m){return a+((C[m.id]||{}).marks||1)},0),rows=[];
    R.forEach(function(m){var b=budget*((C[m.id]||{}).marks||1)/tm,t=A.topics[m.id];
      if(budget<=60){rows.push(['<a href="#topic/'+m.id+'/revise">'+esc(m.short)+": revise page, then the PYQ patterns</a>",String(Math.round(b))]);return}
      var learn=t.sections.reduce(function(a,s){return a+A.sectionMins(s)},0);
      rows.push(['<a href="#topic/'+m.id+'">'+esc(m.short)+": lessons"+(learn>b*0.4?" (largest-marks sections first)":"")+"</a>",String(Math.round(Math.min(learn,b*0.4)))]);
      rows.push(['<a href="#topic/'+m.id+'/pyqs">'+esc(m.short)+": PYQs, hints first</a>",String(Math.round(b*0.4))]);
      rows.push(['<a href="#topic/'+m.id+'/test">'+esc(m.short)+": topic test</a>",String(Math.round(b*0.12))]);
      rows.push(['<a href="#topic/'+m.id+'/revise">'+esc(m.short)+": revise</a>",String(Math.round(b*0.08))]);
    });
    area.innerHTML=A.rawTable(["Step","Minutes"],rows)+'<p class="sub">Finished early? Use <a href="#practice">Practice next</a>.</p>';
  }
  draw();
};
/* ---------- cheatsheet ---------- */
A.pages.cheat=function(root){
  var ex=A.exam(),p=wrap(root,"Cheatsheet","Every built topic of "+esc(A.examLabel(ex))+", ranked by marks: methods and traps on one page. Prints cleanly.");
  var R=readyTopics();if(!R.length)return none(p);
  var C=A.countsFor(ex).topics;
  R.slice().sort(function(a,b){return ((C[b.id]||{}).marks||0)-((C[a.id]||{}).marks||0)}).forEach(function(m){var t=A.topics[m.id],c=t.cheat||{};
    p.appendChild(el("section","box cheat",'<h2>'+esc(t.name)+' <small class="mute">'+A.fmt((C[m.id]||{}).marks||0)+" marks</small></h2><div class='grid g2'><div><h4>Methods</h4><ul>"+(c.methods||[]).map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div><div><h4>Traps</h4><ul>"+(c.traps||[]).map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div></div>"))});
  var pr=el("button","btn ghost","Print");pr.type="button";pr.onclick=function(){window.print()};p.appendChild(pr);
};
/* ---------- search page ---------- */
A.pages.search=function(root,parts){
  var p=wrap(root,"Search","Lessons, PYQs (by text or bank id) and glossary terms. Press / anywhere to search.");
  var f=el("div","filters",'<input type="search" id="sp" class="field" placeholder="Search" aria-label="Search" value="'+esc(parts[0]||"")+'">');p.appendChild(f);var out=el("div");out.setAttribute("aria-live","polite");p.appendChild(out);
  var inp=$("#sp",f);function run(){out.innerHTML=inp.value.trim().length<2?'<p class="mute">Type at least two letters.</p>':A.hitsHTML(A.searchHits(inp.value))}
  inp.oninput=run;run();setTimeout(function(){inp.focus()},0);
};
/* ---------- settings ---------- */
A.pages.settings=function(root){
  var p=wrap(root,"Settings","Look, exam dates, keyboard, and your progress backup."),S=A.load();
  function sw(id,label,sub,on){return '<div class="swrow"><span><b>'+label+"</b>"+(sub?"<small>"+sub+"</small>":"")+'</span><button class="switch" id="'+id+'" type="button" role="switch" aria-checked="'+(!!on)+'" aria-label="'+label+'"><i></i></button></div>'}
  var dates=A.examIds().map(function(k){return '<div class="swrow"><span><b>'+esc(A.manifest.exams[k].label)+' date</b><small>'+(A.manifest.exams[k].examDate?"Official: "+esc(A.manifest.exams[k].examDate):"Not given; set your own")+'</small></span><input type="date" class="field exdate" data-e="'+k+'" value="'+esc(A.examDate(k))+'" aria-label="'+esc(A.manifest.exams[k].label)+' date"></div>'}).join("");
  var b=el("div","box settings");
  b.innerHTML='<h2 class="h3">Look</h2>'+sw("s-theme","Dark mode","",document.documentElement.getAttribute("data-theme")==="dark")+sw("s-large","Larger text","",S.prefs.large)+sw("s-tags","Show source tags","[SRC], [DERIVED], [ADDED] and [FLAG] in notes",S.prefs.tags)+sw("s-deep","Open \"Go deeper\" by default","",S.prefs.deepOpen)+sw("s-xp","Expand all","Open every solution, worked step, trace and hidden answer on every page. Shown this way, a question does not count as an attempt.",S.prefs.expandAll)
    +'<h2 class="h3">Exam</h2><div class="swrow"><span><b>Active exam</b></span>'+A.examSelect("set-exam")+"</div>"+dates
    +'<h2 class="h3">Keyboard</h2><p><kbd>/</kbd> or <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> search · <kbd>A</kbd>–<kbd>E</kbd> or <kbd>1</kbd>–<kbd>5</kbd> pick an option · <kbd>Enter</kbd> submit one question (never a whole mock) · flashcards: <kbd>Space</kbd> flip, <kbd>←</kbd> again, <kbd>↓</kbd> almost, <kbd>→</kbd> got it</p>'
    +'<h2 class="h3">Your progress</h2><p>Saved in this browser only'+(A.storeOK?"":" (storage is blocked here, so it lasts only for this visit)")+'. Last saved: <b id="s-saved">'+(S.savedAt?new Date(S.savedAt).toLocaleString():"never")+"</b>. Store key <code>"+esc(A.storeKey())+'</code>. Export it to move it to another device.</p>'
    +'<textarea id="s-exp" class="field" rows="4" aria-label="Progress export text"></textarea><p><button class="btn sm ghost" id="s-export" type="button">Export</button> <button class="btn sm ghost" id="s-import" type="button">Restore from the text above</button> <button class="btn sm ghost" id="s-dl" type="button">Download a backup file</button> <span id="s-msg" role="status"></span></p>'
    +'<p><button class="linkbtn danger" id="s-reset" type="button">Reset all progress</button></p>'
    +'<h2 class="h3">Offline</h2><p>Everything (fonts, maths, code) is bundled, so the site works with no internet once loaded. Only optional sign-in sync uses the network.</p>'
    +'<p class="mute">Engine '+esc(A.ENGINE_VERSION)+" · data v"+esc(A.manifest.dataVersion)+"</p>";
  p.appendChild(b);
  function tog(id,fn){var x=$("#"+id,b);x.onclick=function(){var on=x.getAttribute("aria-checked")!=="true";x.setAttribute("aria-checked",on);fn(on)}}
  tog("s-theme",A.setTheme);tog("s-large",A.setLarge);tog("s-tags",A.setTags);tog("s-xp",A.setExpand);tog("s-deep",function(on){var S2=A.load();S2.prefs.deepOpen=on;A.save()});
  $$(".exdate",b).forEach(function(d){d.onchange=function(){var S2=A.load();S2.prefs.examDates=S2.prefs.examDates||{};S2.prefs.examDates[d.dataset.e]=d.value;A.save();A.toast("Exam date saved")}});
  $("#s-export",b).onclick=function(){$("#s-exp",b).value=A.exportState();$("#s-msg",b).textContent="Copy the text above."};
  $("#s-dl",b).onclick=function(){var blob=new Blob([A.exportState()],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mad1-progress.json";a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)};
  $("#s-import",b).onclick=function(){try{A.importState($("#s-exp",b).value);A.toast("Progress restored");A.route()}catch(e){$("#s-msg",b).textContent="That text is not a valid MAD 1 export."}};
  $("#s-reset",b).onclick=function(){var x=this;if(x.dataset.s){A.resetState();(window.APP_SYNC?APP_SYNC.wipe():Promise.resolve()).then(function(){location.hash="#home";location.reload()})}else{x.dataset.s=1;x.textContent="Click again to erase everything"}};
};
/* ---------- Phase E layers: honest placeholders until all topics are built (no dead links) ---------- */
A.PHASE_E.forEach(function(k){
  var n=A.NAV2.find(function(x){return x[0]===k});
  A.pages[k]=function(root){var p=wrap(root,n?n[1]:k,n?esc(n[3]):"");p.appendChild(el("div","box soon",'<p><b>Available after all topics.</b> This page gathers every topic at once, so it is built after the last '+esc(A.examLabel(A.exam()))+' topic is written. Until then each topic has its own Revise tab.</p><p><a class="btn ghost" href="#home">Back to the course</a></p>'))};
});
})();
