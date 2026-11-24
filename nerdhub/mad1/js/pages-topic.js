/* MAD 1 pages: topic (overview, one lesson at a time, sub-topic, PYQs, topic test, revise) and single PYQ. */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el,$=A.$,$$=A.$$;
function rich(s){return A.renderRich(s)}
function pathBar(m,on){
  var S=A.load(),st=A.topicStats(m),stp=S.steps[m.id]||{};
  var done=[st.secs&&st.read===st.secs,st.pyqs&&st.solved>=st.pyqs*0.8,!!stp.test,!!stp.revise,!!stp.check];
  var href=["lesson","pyqs","test","revise","test#checklist"];
  return '<ol class="path" aria-label="Path through this topic">'+["Learn","Practice PYQs","Topic test","Revise","Checklist"].map(function(s,i){return '<li class="'+(done[i]?"done ":"")+(on===i?"on":"")+'"><a href="#topic/'+m.id+(i===0?"":"/"+href[i])+'">'+s+"</a></li>"}).join("")+"</ol>";
}
A.conceptMarks=function(id,ex){
  var out={};A.pyqsOf(id,ex).forEach(function(q){var k=q.concept||"(untagged)";var o=out[k]=out[k]||{n:0,marks:0,subs:{}};o.n++;o.marks+=+q.marks||0;o.subs[q.sub]=1});return out;
};
/* ---------- big picture ---------- */
function mindmap(mm){
  var B=mm.branches,W=900,Lf=[],Rt=[];B.forEach(function(b,i){(i%2?Rt:Lf).push(b)});
  function boxH(b){return 30+b.kids.length*17}
  var Hn=Math.max(Lf.reduce(function(a,b){return a+boxH(b)+16},0),Rt.reduce(function(a,b){return a+boxH(b)+16},0))+30,cy=Hn/2;
  var s='<svg class="fig-svg mm-svg" viewBox="0 0 '+W+" "+Hn+'" role="img" aria-label="Mind map of the topic"><g class="mm-root"><rect x="'+(W/2-95)+'" y="'+(cy-26)+'" width="190" height="52" rx="26"/><text x="'+(W/2)+'" y="'+(cy+5)+'" text-anchor="middle">'+esc(mm.center)+"</text></g>";
  function side(arr,left){var y=15;arr.forEach(function(b){var h=boxH(b),x=left?20:W-290,w=270,ym=y+h/2,x0=left?x+w:x,x1=W/2+(left?-95:95);
    s+='<path class="mm-link" d="M'+x1+" "+cy+" C"+((x1+x0)/2)+" "+cy+" "+((x1+x0)/2)+" "+ym+" "+x0+" "+ym+'"/><rect class="mm-box" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10"/><text class="mm-t" x="'+(x+12)+'" y="'+(y+21)+'">'+esc(b.t)+"</text>";
    b.kids.forEach(function(k,i){s+='<text class="mm-k" x="'+(x+12)+'" y="'+(y+40+i*17)+'">• '+esc(k)+"</text>"});y+=h+16})}
  side(Lf,true);side(Rt,false);return s+"</svg>";
}
function bigPicture(t,m){
  var w=el("div","box bigpic"),tabs=["Story","Mind map","How the ideas connect","Where the marks come from","Roadmap"],cur=0,tb=el("div","tabs"),body=el("div");
  tb.setAttribute("role","tablist");
  tabs.forEach(function(n,i){var b=el("button",i===0?"on":"",n);b.type="button";b.setAttribute("role","tab");b.onclick=function(){cur=i;$$("button",tb).forEach(function(x,k){x.classList.toggle("on",k===i)});draw()};tb.appendChild(b)});
  function draw(){
    var h="";
    if(cur===0)h='<div class="prose">'+rich(t.story)+"</div>";
    if(cur===1)h='<div class="mm">'+mindmap(t.mindmap)+'</div><ul class="outline-list">'+t.mindmap.branches.map(function(b){return "<li><b>"+esc(b.t)+"</b><ul>"+b.kids.map(function(k){return "<li>"+esc(k)+"</li>"}).join("")+"</ul></li>"}).join("")+"</ul>";
    if(cur===2)h='<div class="prose"><ul>'+(t.connect||[]).map(function(c){return "<li><b>"+esc(c[0])+"</b> → <b>"+esc(c[1])+"</b>: "+A.inline(c[2])+"</li>"}).join("")+"</ul></div>";
    if(cur===3){var cm=A.conceptMarks(t.id),keys=Object.keys(cm).sort(function(a,b){return cm[b].marks-cm[a].marks}),tot=keys.reduce(function(a,k){return a+cm[k].marks},0);
      h='<p class="sub">Computed from this topic\'s PYQs for '+esc(A.examLabel(A.exam()))+".</p>"+(keys.length?A.rawTable(["Concept","PYQs","Marks","Share"],keys.map(function(k){var c=t.concepts&&t.concepts[k];return [esc(c?c.name:k),String(cm[k].n),A.fmt(cm[k].marks),Math.round(100*cm[k].marks/(tot||1))+"%"]})):'<p class="mute">No PYQs are loaded for this topic yet.</p>')}
    if(cur===4)h='<ol class="prose roadmap">'+(t.roadmap||[]).map(function(r){return '<li><a href="#topic/'+t.id+"/lesson/"+esc(r[1])+'">'+esc(r[0])+"</a></li>"}).join("")+"</ol>";
    body.innerHTML=h;A.math(body);
  }
  w.appendChild(tb);w.appendChild(body);draw();return w;
}
function refresherCard(r){
  var up=r.upgradesTo&&A.isReady(A.topicMeta(r.upgradesTo));
  return '<a class="rfcard" href="'+(up?"#topic/"+esc(r.upgradesTo):"#refresher/"+esc(r.id))+'"><b>'+esc(r.title)+"</b><small>"+(up?"Now a full topic: open the lesson":esc(r.summary||"Short refresher"))+"</small></a>";
}
A.refresherCard=refresherCard;
/* ---------- one lesson ---------- */
function lesson(art,t,m,sec,cur,secs){
  var S=A.load(),base="#topic/"+t.id,ctx={seen:{}};
  S.read[t.id+":"+sec.id]=1;A.save();
  art.innerHTML='<p class="kicker">Lesson '+(cur+1)+" of "+secs.length+(sec.patch?' <span class="pill">added for '+esc(A.examLabel(A.exam()))+"</span>":"")+"</p><h2>"+esc(sec.title)+"</h2>"
    +'<dl class="lesson-banner"><div><dt>What you are studying</dt><dd>'+A.inline(sec.studying)+'</dd></div><div><dt>Why it matters</dt><dd>'+A.inline(sec.why)+'</dd></div><div><dt>In plain words</dt><dd>'+A.inline(sec.plain)+"</dd></div></dl>"
    +'<p class="mins">About '+A.sectionMins(sec)+" min</p>";
  if(sec.diagnostic){var dg=el("div","diag",'<h3 class="h3">Try this first</h3><p class="sub">If you get it right and you were sure, you can skip ahead to the check at the end.</p>');
    dg.appendChild(A.qcard(Object.assign({topicId:t.id,tag:"[ADDED]"},sec.diagnostic),{noHints:true,onDone:function(ok){if(ok){var a=el("a","btn sm ghost","Skip ahead to the check");a.href="#";a.onclick=function(e){e.preventDefault();var q=art.querySelector(".checks");if(q)q.scrollIntoView()};dg.appendChild(a)}}}));art.appendChild(dg)}
  art.appendChild(A.blocks(sec.core,ctx));
  if(sec.deep&&sec.deep.length){var d=el("details","deep");d.innerHTML='<summary>Go deeper <small>full working, every line explained</small></summary>';var inner=el("div","deep-in");d.appendChild(inner);var filled=false;
    function fill(){if(!filled){filled=true;inner.appendChild(A.blocks(sec.deep,ctx));A.math(inner)}}
    d.addEventListener("toggle",function(){if(d.open)fill()});if(A.load().prefs.deepOpen){d.open=true;fill()}art.appendChild(d)}
  if(sec.remember&&sec.remember.length)art.appendChild(el("div","rem","<h4>Remember</h4><ul>"+sec.remember.map(function(r){return "<li>"+A.inline(r)+"</li>"}).join("")+"</ul>"));
  if(sec.teachBack){var tbk=el("div","teach");var key=t.id+":"+sec.id;
    tbk.innerHTML='<h4>Teach it back</h4><p>'+A.inline(sec.teachBack.prompt)+'</p><textarea class="field" rows="2" aria-label="Your one-line explanation">'+esc(A.load().teach[key]||"")+'</textarea><button class="btn sm ghost" type="button">Compare with a model answer</button><div class="teach-model" hidden><b>Model answer:</b> '+A.inline(sec.teachBack.model)+"</div>";
    tbk.querySelector("button").onclick=function(){var S2=A.load();S2.teach[key]=tbk.querySelector("textarea").value;A.save();tbk.querySelector(".teach-model").hidden=false};art.appendChild(tbk)}
  if(sec.quiz&&sec.quiz.length){var ch=el("div","checks");ch.appendChild(el("h3","h3","Check yourself"));sec.quiz.forEach(function(q){q.topicId=t.id;ch.appendChild(A.qcard(q,{shuffle:true}))});art.appendChild(ch)}
  var prev=cur>0?{href:base+"/lesson/"+secs[cur-1].id,label:secs[cur-1].title}:{href:base,label:"Overview"};
  var next=cur<secs.length-1?{href:base+"/lesson/"+secs[cur+1].id,label:"Next: "+secs[cur+1].title}:{href:base+"/pyqs",label:"Next: practise the PYQs"};
  art.appendChild(lessonNav(prev,next));
}
function lessonNav(prev,next){var n=el("nav","lnav");n.innerHTML=(prev?'<a class="btn ghost" href="'+prev.href+'"><span class="dir">Previous</span> '+esc(prev.label)+"</a>":"<span></span>")+(next?'<a class="btn" href="'+next.href+'">'+esc(next.label)+"</a>":"");return n}
/* ---------- planned / stub topic ---------- */
function plannedTopic(root,m){
  var C=A.countsFor(A.exam()).topics[m.id]||{pyqs:0,marks:0},S=A.load();
  var rf=A.refreshers.filter(function(r){return r.upgradesTo===m.id});
  root.innerHTML='<div class="page"><nav class="crumb"><a href="#home">Course</a><span>'+esc(m.name)+'</span></nav><h1>'+esc(m.name)+' <span class="pill">'+esc(m.status)+'</span></h1><p class="lead">'+esc(m.why)+"</p>"
    +'<div class="box"><p>This topic is not written yet. It covers weeks '+m.weeks.join(", ")+(C.pyqs?" and carries "+C.pyqs+" PYQs worth "+A.fmt(C.marks)+" marks in "+esc(A.examLabel(A.exam())):"")+'.</p><h3 class="h3">What it will cover</h3><ul>'+(m.subs||[]).map(function(s){var c=(C.subs||{})[s.name];return "<li>"+A.inline(s.name)+(c?" <small class='mute'>("+c.pyqs+" PYQ"+(c.pyqs===1?"":"s")+", "+A.fmt(c.marks)+" marks)</small>":"")+"</li>"}).join("")+"</ul>"
    +(rf.length?'<h3 class="h3">Until then, the short refresher</h3><div class="rfs">'+rf.map(refresherCard).join("")+"</div>":"")+'<p><a class="btn" href="#home">Back to the course</a></p></div></div>';
}
/* ---------- topic page ---------- */
A.pages.topic=function(root,parts){
  var id=parts[0],m=A.topicMeta(id),t=A.topics[id],S=A.load(),ex=A.exam();
  if(!m){root.innerHTML='<div class="page"><div class="box"><h2>No such topic</h2><a class="btn" href="#home">Back to the course</a></div></div>';return}
  A.curTopic=id;
  if(!A.isReady(m)){plannedTopic(root,m);return}
  var view=parts[1]||"",secs=t.sections,cur=-1,subId=null;
  if(view==="lesson"){cur=secs.findIndex(function(x){return x.id===parts[2]});if(cur<0)view=""}
  if(view==="sub"){subId=parts[2]}
  var tabView=view==="lesson"||view===""?"learn":view==="sub"?"pyqs":view;
  if(view==="test#checklist")tabView="test";
  var st=A.topicStats(m),base="#topic/"+id,pyqs=A.pyqsOf(id,ex);
  var wrap=el("div","topic"),head=el("header","t-head");
  var mins=secs.reduce(function(a,s){return a+A.sectionMins(s)},0)+pyqs.reduce(function(a,q){return a+(q.seconds||180)/60},0)+(t.test||[]).length*2;
  var firstUnread=secs.findIndex(function(x){return !S.read[id+":"+x.id]});
  var contHref=firstUnread<0?base+"/pyqs":base+"/lesson/"+secs[firstUnread].id,contLab=firstUnread<0?"Lessons done: practise":firstUnread===0?"Start lesson 1":"Continue lesson "+(firstUnread+1);
  var R=38,C=2*Math.PI*R,state=A.stateOf(m,st);
  var tabs=[["learn","Lessons",base,secs.length],["pyqs","PYQs",base+"/pyqs",pyqs.length],["test","Topic test",base+"/test",(t.test||[]).length],["revise","Revise",base+"/revise",null]];
  head.innerHTML='<nav class="crumb"><a href="#home">Course</a><span>'+esc(A.examLabel(ex))+"</span><span>Weeks "+m.weeks.join(", ")+"</span></nav>"
    +'<div class="t-top"><div class="t-main"><h1><span class="tmark big">'+esc(m.mark||"")+"</span> "+esc(t.name)+'</h1><p class="tag-line">'+A.inline(t.tagline)+'</p>'
    +'<p class="t-facts"><span><b>'+secs.length+'</b> lessons</span><span><b>'+pyqs.length+'</b> PYQs</span><span><b>'+A.fmt(st.marks)+'</b> marks</span><span title="Lessons at 170 words a minute plus interactives, each PYQ at its time budget (3 min if none), 2 min per test question">about <b>'+(mins>=60?Math.floor(mins/60)+" h ":"")+Math.round(mins%60)+' min</b> <small>(how: reading + PYQ time budgets + test)</small></span></p>'
    +'<div class="t-cta"><a class="btn" href="'+contHref+'">'+contLab+'</a><a class="btn ghost" href="'+base+'/pyqs">Practise '+pyqs.length+' PYQs</a><a class="btn ghost" href="#cards" id="t-cards">Flashcards for this topic</a></div></div>'
    +'<aside class="t-ready '+state+'"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="'+R+'" class="tr"/>'+(st.pct?'<circle cx="50" cy="50" r="'+R+'" class="fg" stroke-dasharray="'+(C*st.pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 50 50)"/>':"")+'<text x="50" y="52" text-anchor="middle" class="pc">'+st.pct+'%</text><text x="50" y="68" text-anchor="middle" class="rd">ready</text></svg>'
    +'<dl><div><dt>Lessons read</dt><dd>'+st.read+"/"+st.secs+'</dd></div><div><dt>Checks right</dt><dd>'+st.checksOk+"/"+st.checks+'</dd></div><div><dt>PYQs solved</dt><dd>'+st.solved+"/"+st.pyqs+'</dd></div><div><dt>Topic test</dt><dd>'+(st.test?Math.round(st.test*100)+"%":"not taken")+"</dd></div></dl></aside></div>"
    +'<nav class="ttabs" aria-label="Topic sections">'+tabs.map(function(x){return '<a href="'+x[2]+'" class="'+(x[0]===tabView?"on":"")+'"'+(x[0]===tabView?' aria-current="page"':"")+">"+x[1]+(x[3]!=null?" <small>"+x[3]+"</small>":"")+"</a>"}).join("")+"</nav>"
    +pathBar(m,{learn:0,pyqs:1,test:2,revise:3}[tabView]);
  head.querySelector("#t-cards").onclick=function(){var S2=A.load();S2.prefs.cardTopic=id;A.save()};
  wrap.appendChild(head);
  var body=el("div","t-body "+tabView);wrap.appendChild(body);
  if(tabView==="learn"){
    var route=el("aside","route");
    var items=[["","Overview",-1]].concat(secs.map(function(x,i){return [x.id,x.title,i]}));
    route.innerHTML='<button class="route-hide" type="button" aria-expanded="true">Hide lessons</button><button class="route-show" type="button">Lessons</button><button class="route-toggle" type="button" aria-expanded="false">'+(cur<0?"All lessons":"Lesson "+(cur+1)+" of "+secs.length+": all lessons")+' ▾</button><ol>'
      +items.map(function(x){var read=x[2]<0||!!S.read[id+":"+x[0]],on=x[2]===cur;return '<li class="'+(on?"frontier":read?"visited":"unvisited")+'"><a href="'+base+(x[0]?"/lesson/"+x[0]:"")+'"'+(on?' aria-current="page"':"")+'><span class="rn">'+(x[2]<0?"":x[2]+1)+"</span><span>"+esc(x[1])+"</span></a></li>"}).join("")
      +'<li class="after"><a href="'+base+'/pyqs"><span class="rn"></span><span>Then: practise the PYQs</span></a></li></ol>';
    var tg=route.querySelector(".route-toggle");tg.onclick=function(){var o=route.classList.toggle("open");tg.setAttribute("aria-expanded",o)};
    if(S.prefs.routemin)body.classList.add("routemin");
    function setRoute(min){body.classList.toggle("routemin",min);var S2=A.load();S2.prefs.routemin=min;A.save()}
    route.querySelector(".route-hide").onclick=function(){setRoute(true)};route.querySelector(".route-show").onclick=function(){setRoute(false)};
    body.appendChild(route);
    var art=el("article","lesson");body.appendChild(art);
    if(cur<0){
      art.innerHTML='<p class="kicker">Overview</p><h2>Before you start</h2>';
      art.appendChild(bigPicture(t,m));
      var pre=(t.prereqs||[]).map(function(rid){return A.refreshers.find(function(r){return r.id===rid})}).filter(Boolean);
      if(pre.length||(t.prereqCheck&&t.prereqCheck.length)){var pw=el("div","prereq",'<h3 class="h3">What comes before</h3><p class="sub">Uses: '+(m.uses||[]).map(function(u){var um=A.topicMeta(u);return um?'<a href="#topic/'+u+'">'+esc(um.short)+"</a>":esc(u)}).join(", ")+'. Check yourself; if a question is hard, open the refresher.</p><div class="rfs">'+pre.map(refresherCard).join("")+"</div>");
        (t.prereqCheck||[]).forEach(function(q){q.topicId=id;pw.appendChild(A.qcard(q,{noHints:true}))});art.appendChild(pw)}
      var ol=el("ol","lesson-index");ol.innerHTML=secs.map(function(x,i){return '<li><a href="'+base+"/lesson/"+x.id+'"><span class="rn">'+(i+1)+"</span><span><b>"+esc(x.title)+"</b><small>"+A.inline(x.plain||"")+" · about "+A.sectionMins(x)+" min</small></span></a></li>"}).join("");
      art.appendChild(el("h3","h3","The lessons"));art.appendChild(ol);
      art.appendChild(lessonNav(null,{href:base+"/lesson/"+secs[0].id,label:"Start lesson 1: "+secs[0].title}));
    } else lesson(art,t,m,secs[cur],cur,secs);
  } else {
    var pane=el("div","pane");body.appendChild(pane);
    if(tabView==="pyqs")buildPyqs(pane,t,m,subId,parts[2]);
    else if(tabView==="test")buildTest(pane,t,m);
    else if(tabView==="revise")buildRevise(pane,t,m);
    else buildPyqs(pane,t,m,null,null);
    var nav=el("nav","lnav"),i2=A.examTopics(ex).filter(A.isReady),nxt=i2[i2.indexOf(m)+1];
    nav.innerHTML=tabView==="pyqs"?'<a class="btn ghost" href="'+base+'">Back to the lessons</a><a class="btn" href="'+base+'/test">Next: topic test</a>':tabView==="test"?'<a class="btn ghost" href="'+base+'/pyqs">Back to the PYQs</a><a class="btn" href="'+base+'/revise">Next: revise</a>':'<a class="btn ghost" href="'+base+'/test">Back to the test</a>'+(nxt?'<a class="btn" href="#topic/'+nxt.id+'">Next topic: '+esc(nxt.short)+"</a>":'<a class="btn" href="#mock">Sit a mock exam</a>');
    pane.appendChild(nav);
  }
  root.appendChild(wrap);A.math(wrap);
  if(cur>=0&&window.innerWidth<900)A._after=function(){var a=wrap.querySelector(".lesson");if(a)a.scrollIntoView({block:"start",behavior:"instant"})};
  if(tabView==="test"&&/#checklist$/.test(location.hash))A._after=function(){var c=wrap.querySelector(".checklist");if(c)c.scrollIntoView({block:"start",behavior:"instant"})};
};
/* ---------- scope pill (this exam only / all course) ---------- */
A.scopePill=function(onChange){
  var ex=A.exam();if(ex==="all"||Object.keys(A.packs).length<2&&!(A.examInfo(ex).newWeeks||[]).length)return null;
  var w=el("div","scope",'<span>PYQs:</span>'),cur=A.scope();
  [["exam",A.examLabel(ex)+" only"],["all","All course PYQs"]].forEach(function(o){var b=el("button","chip"+(cur===o[0]?" on":""),esc(o[1]));b.type="button";b.setAttribute("aria-pressed",cur===o[0]);b.onclick=function(){var S=A.load();S.prefs.scope=o[0];A.save();onChange()};w.appendChild(b)});
  return w;
};
function buildPyqs(sp,t,m,subId,focus){
  var S=A.load(),ex=A.exam(),all=A.pyqsOf(t.id,ex),pk=A.packOf(t.id,ex)||{};
  sp.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Past questions'+(subId?": "+A.inline((m.subs.find(function(s){return s.id===subId})||{}).name||subId):"")+'</h2><p class="sub">Try each question before opening the solution. Hints go from what to look for to the first move.</p>');
  var sc=A.scopePill(function(){A._keepScroll=true;A.route()});if(sc)sp.appendChild(sc);
  if(!all.length){sp.appendChild(el("div","box","<p>No PYQs for this topic in "+esc(A.examLabel(ex))+" yet.</p>"));return}
  if(pk.patterns&&pk.patterns.length)sp.appendChild(el("div",null,'<h3 class="h3">Patterns and your first move</h3><div class="patterns">'+pk.patterns.map(function(p){return '<div class="pat"><b>'+esc(p.name)+"</b><span>"+A.inline(p.cue||"")+"</span><span><i>First move:</i> "+A.inline(p.firstMove||"")+"</span><small>"+esc(p.count)+" PYQs</small></div>"}).join("")+"</div>"));
  var subs=(m.subs||[]).filter(function(s){return all.some(function(q){return q.sub===s.id})});
  var f=el("div","filters"),papers=[];all.forEach(function(q){if(papers.indexOf(q.paper)<0)papers.push(q.paper)});
  papers.sort(function(a,b){return A.paperTime(a)-A.paperTime(b)});
  f.innerHTML='<label>Paper <select id="f-paper" class="field"><option value="">All</option>'+papers.map(function(p){return "<option>"+esc(p)+"</option>"}).join("")+'</select></label><label class="chk"><input type="checkbox" id="f-hide"> Hide solved</label><span id="f-count" class="mute"></span>';
  sp.appendChild(f);
  if(!subId)sp.appendChild(el("p","subnav","Sub-topics: "+subs.map(function(s){return '<a href="#topic/'+t.id+"/sub/"+s.id+'">'+A.inline(s.name)+"</a>"}).join(" · ")));
  var groups=el("div");sp.appendChild(groups);
  function filt(q){var fp=$("#f-paper",f).value,fh=$("#f-hide",f).checked;return (!fp||q.paper===fp)&&!(fh&&S.ans[q.uid]&&S.ans[q.uid].ok)}
  function updCount(){var s=all.filter(function(q){return S.ans[q.uid]&&S.ans[q.uid].ok}).length;$("#f-count",f).textContent=all.filter(filt).length+" shown · "+s+" of "+all.length+" solved"}
  var dets=[];
  (subId?subs.filter(function(s){return s.id===subId}):subs).forEach(function(s,gi){
    var qs=all.filter(function(q){return q.sub===s.id}),marks=qs.reduce(function(a,q){return a+(+q.marks||0)},0),d=el("details","pgroup");
    var fq=focus&&qs.find(function(q){return q.id===focus||q.uid===focus});
    d.open=subId?true:fq?true:gi===0;
    d.innerHTML='<summary><span>'+A.inline(s.name)+"</span><small>"+qs.length+" PYQ"+(qs.length===1?"":"s")+", "+A.fmt(marks)+" marks</small></summary><div class='gb'></div>";
    function fill(){var box=d.querySelector(".gb");box.innerHTML="";var list=qs.filter(filt);if(!list.length)box.innerHTML='<p class="mute">No questions match the filters.</p>';list.forEach(function(q){var c=A.qcard(q,{onDone:updCount});c.id="q-"+q.id;box.appendChild(c)})}
    d._fill=fill;d.addEventListener("toggle",function(){if(d.open&&!d._done){d._done=true;fill()}});if(d.open){d._done=true;fill()}
    groups.appendChild(d);dets.push(d);
  });
  var orphan=all.filter(function(q){return !subs.some(function(s){return s.id===q.sub})});
  if(orphan.length&&!subId){var d=el("details","pgroup");d.open=true;d.innerHTML="<summary><span>Other</span></summary><div class='gb'></div>";orphan.forEach(function(q){d.querySelector(".gb").appendChild(A.qcard(q))});groups.appendChild(d)}
  [$("#f-paper",f),$("#f-hide",f)].forEach(function(c){c.onchange=function(){dets.forEach(function(d){if(d._done)d._fill()});updCount()}});
  updCount();
  if(focus)A._after=function(){var c=document.getElementById("q-"+focus);if(c){c.scrollIntoView({block:"start"});c.classList.add("flash")}};
  if(!subId&&t.practice&&t.practice.length){
    sp.appendChild(el("div","prose",'<h3 class="h3">Practice variations <span class="tag ADDED">[ADDED]</span></h3><p>Not PYQs: exam-style questions that change the code or the twist of a PYQ, so you check the method and not the memory of an answer.</p>'));
    t.practice.forEach(function(q){q.topicId=t.id;sp.appendChild(A.qcard(q,{shuffle:true}))});
  }
}
function buildTest(sec,t,m){
  var S=A.load(),T=t.test||[];
  sec.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Topic test</h2><p class="sub">'+T.length+" mixed questions. Answer them all, then submit for your score and the concepts to revisit. Enter does not submit the test.</p>");
  var cards=[],box=el("div");sec.appendChild(box);
  T.forEach(function(q){q.topicId=t.id;var c=A.qcard(q,{mock:true,shuffle:true});cards.push(c);box.appendChild(c)});
  var sub=el("button","btn","Submit the test");sub.type="button";var out=el("div");sec.appendChild(sub);sec.appendChild(out);
  sub.onclick=function(){
    if(cards.some(function(c){return !c.hasResp()})&&!sub.dataset.force){sub.dataset.force=1;sub.textContent="Some are unanswered. Click again to submit anyway";return}
    sub.disabled=true;var ok=0,weak={};
    cards.forEach(function(c,i){var q=T[i],good=!!A.check(q,c.getResp());c.grade();if(good)ok++;else weak[q.concept]=(weak[q.concept]||0)+1});
    var stp=S.steps[t.id]=S.steps[t.id]||{};stp.test=Math.max(stp.test||0,ok/T.length||0.001);A.save();
    var w=Object.keys(weak);
    out.innerHTML='<div class="box result"><h3>Score: '+ok+" / "+T.length+"</h3>"+(w.length?"<p><b>Concepts to revisit:</b></p><ul>"+w.map(function(k){var c=t.concepts[k]||{},s=t.sections.find(function(x){return (x.concepts||[]).indexOf(k)>=0});return "<li>"+esc(c.name||k)+(s?' → <a href="#topic/'+t.id+"/lesson/"+s.id+'">'+esc(s.title)+"</a>":"")+(c.repair?'<div class="repair">'+A.inline(c.repair)+"</div>":"")+"</li>"}).join("")+"</ul>":"<p>No weak concepts. Move on.</p>")+"</div>";
  };
  var stp=S.steps[t.id]=S.steps[t.id]||{};stp.checks=stp.checks||{};
  var cl=el("div","box checklist");
  cl.innerHTML="<h3>Checklist: can you do each of these without help?</h3>"+(t.checklist||[]).map(function(c,i){return '<label class="chk"><input type="checkbox" data-i="'+i+'" '+(stp.checks[i]?"checked":"")+"> <span>"+A.inline(c)+"</span></label>"}).join("");
  sec.appendChild(cl);
  $$("input",cl).forEach(function(c){c.onchange=function(){stp.checks[c.dataset.i]=c.checked?1:0;stp.check=$$("input",cl).every(function(x){return x.checked})?1:0;A.save()}});
}
function buildRevise(sr,t,m){
  var r=t.remember||{},S=A.load(),pk=A.packOf(t.id)||{};
  sr.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Revise</h2><p class="sub">The whole topic on one page: about 15 minutes.</p>');
  function sec(title,html){sr.appendChild(el("div","rv",'<h3 class="h3">'+title+"</h3>"+html))}
  if(r.facts&&r.facts.length)sec("Core facts","<div class='rem'><ul>"+r.facts.map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div>");
  if(r.formulas&&r.formulas.length)sec("Formulas and rules",A.rawTable(["Formula","Means","When"],r.formulas.map(function(f){return ["$"+esc(f.tex)+"$",A.inline(f.means||""),A.inline(f.when||"")]})));
  if(r.cues&&r.cues.length)sec("Wording → first move",A.tableHTML(["If the question says…","First move"],r.cues));
  if(r.selector&&r.selector.length)sec("Method selector",A.tableHTML(["Use","Avoid","Method"],r.selector));
  if(r.examMoves&&r.examMoves.length)sec("Exam moves",A.tableHTML(["Question type","Fast method","Time","Sanity check"],r.examMoves));
  var traps=(r.traps||[]).concat((pk.extraTraps||[]).map(function(x){return typeof x==="string"?{text:x,cause:""}:x}));
  if(traps.length)sec("Traps",'<div class="co warn"><div class="ic" aria-hidden="true">!</div><div class="bd prose"><ul>'+traps.map(function(x){return "<li>"+A.inline(x.text)+(x.cause?' <small class="cause">cause: '+A.inline(x.cause)+"</small>":"")+"</li>"}).join("")+"</ul></div></div>");
  if(r.hooks&&r.hooks.length)sec("Memory hooks","<div class='rem'><ul>"+r.hooks.map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div>");
  if(t.methodCards&&t.methodCards.length)sec("Method cards",'<div class="mcards">'+t.methodCards.map(function(c){return '<div class="method-card"><span>'+esc(c.qType)+"</span>"+A.inline(c.recipe)+"</div>"}).join("")+"</div>");
  if(t.cheat)sec("Cheat summary","<div class='grid g2'><div><h4>Methods</h4><ul>"+(t.cheat.methods||[]).map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div><div><h4>Traps</h4><ul>"+(t.cheat.traps||[]).map(function(x){return "<li>"+A.inline(x)+"</li>"}).join("")+"</ul></div></div>");
  if(pk.extraNotes)sec("Notes from the PYQs",'<div class="prose">'+rich(pk.extraNotes)+"</div>");
  var stp=S.steps[t.id]=S.steps[t.id]||{};stp.revise=1;A.save();
  var pr=el("button","btn ghost","Print this page");pr.type="button";pr.onclick=function(){window.print()};sr.appendChild(pr);
  A.math(sr);
}
/* ---------- single PYQ ---------- */
A.pages.pyq=function(root,parts){
  var q=A.findPyq(parts[0]);
  if(!q){root.innerHTML='<div class="page"><div class="box"><h2>No PYQ with id '+esc(parts[0]||"")+'</h2><a class="btn" href="#home">Back</a></div></div>';return}
  var m=A.topicMeta(q.topicId),list=A.pyqsOf(q.topicId,q.exam,"exam"),i=list.indexOf(q);
  var p=el("div","page");p.innerHTML='<nav class="crumb"><a href="#home">Course</a><a href="#topic/'+q.topicId+'/pyqs">'+esc(m?m.short:q.topicId)+" PYQs</a><span>"+(i+1)+" of "+list.length+"</span></nav><h1>PYQ "+esc(q.id)+"</h1>";
  p.appendChild(A.qcard(q));
  var nav=el("nav","lnav");nav.innerHTML=(i>0?'<a class="btn ghost" href="#pyq/'+esc(list[i-1].uid)+'">Previous PYQ</a>':"<span></span>")+(i<list.length-1?'<a class="btn" href="#pyq/'+esc(list[i+1].uid)+'">Next PYQ</a>':'<a class="btn" href="#topic/'+q.topicId+'/test">Topic test</a>');
  p.appendChild(nav);root.appendChild(p);
};
})();
