/* MAD 1 pages: progress model, home (route graph, Next card, exam switcher, countdown, block weightage), week page. */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el,$=A.$,$$=A.$$;

/* ---------- index of every question (for practice, mistakes, mock) ---------- */
A.buildIndex=function(){
  var ix={};
  Object.keys(A.packs).forEach(function(ex){Object.keys(A.packs[ex]).forEach(function(tid){A.packs[ex][tid].pyqs.forEach(function(q){ix[q.uid]=q})})});
  Object.keys(A.topics).forEach(function(id){var t=A.topics[id];
    function add(q,kind){q.topicId=id;q.kind=kind;q.uid=q.uid||("x:"+id+":"+q.id);ix[q.uid]=q}
    (t.practice||[]).forEach(function(q){add(q,"practice")});(t.test||[]).forEach(function(q){add(q,"test")});
    (t.sections||[]).forEach(function(s){(s.quiz||[]).forEach(function(q){q.sec=q.sec||s.id;add(q,"quiz")});if(s.diagnostic){s.diagnostic.sec=s.id;add(s.diagnostic,"diagnostic")}});
  });
  A.qIndex=ix;
};
A.wordsMins=function(o){var s=JSON.stringify(o||"").replace(/"svg":"[^"]*"/g,"");return s.split(/\s+/).length/170};
A.sectionMins=function(s){var inter=0;(s.core||[]).concat(s.deep||[]).forEach(function(b){if(/^(ex|player|yourMove|handTrace|trace)$/.test(b.t))inter+=2});return Math.max(3,Math.round(A.wordsMins([s.core,s.deep,s.studying,s.why,s.plain])+inter+(s.quiz||[]).length*1.5))};
A.topicStats=function(m,ex){
  ex=ex||A.exam();var t=A.topics[m.id],S=A.load(),C=A.countsFor(ex).topics[m.id]||{pyqs:0,marks:0};
  if(!A.isReady(m))return {ready:false,pyqs:C.pyqs,marks:C.marks,solved:0,read:0,secs:0,checks:0,checksOk:0,test:0,pct:0};
  var q=A.pyqsOf(m.id,ex),solved=q.filter(function(x){var a=S.ans[x.uid];return a&&a.ok}).length;
  var secs=t.sections||[],read=secs.filter(function(s){return S.read[m.id+":"+s.id]}).length;
  var cq=[];secs.forEach(function(s){(s.quiz||[]).forEach(function(x){cq.push(x)})});
  var cok=cq.filter(function(x){var a=S.ans[A.uidOf(x)];return a&&a.ok}).length;
  var tst=(S.steps[m.id]||{}).test||0;
  var pct=Math.round(100*(0.3*read/Math.max(1,secs.length)+0.15*cok/Math.max(1,cq.length)+0.4*solved/Math.max(1,q.length)+0.15*tst));
  return {ready:true,pyqs:q.length,marks:q.reduce(function(a,x){return a+(+x.marks||0)},0),solved:solved,read:read,secs:secs.length,checks:cq.length,checksOk:cok,test:tst,pct:pct};
};
A.stateOf=function(m,st){if(!A.isReady(m))return "planned";st=st||A.topicStats(m);return st.pct>=80?"visited":(st.read||st.solved)?"frontier":"unvisited"};
A.nextStep=function(){
  var S=A.load(),ex=A.exam(),T=A.examTopics(ex).filter(A.isReady);
  for(var i=0;i<T.length;i++){var m=T[i],t=A.topics[m.id],secs=t.sections;
    for(var k=0;k<secs.length;k++)if(!S.read[m.id+":"+secs[k].id])return {kind:"lesson",m:m,sec:secs[k],no:k+1,n:secs.length,mins:A.sectionMins(secs[k]),href:"#topic/"+m.id+"/lesson/"+secs[k].id,label:m.short+", lesson "+(k+1)};
    var q=A.pyqsOf(m.id,ex),left=q.filter(function(x){var a=S.ans[x.uid];return !(a&&a.ok)});
    if(q.length&&left.length>q.length*0.2)return {kind:"pyqs",m:m,left:left.length,href:"#topic/"+m.id+"/pyqs",label:m.short+" PYQs"};
    if(!(S.steps[m.id]||{}).test)return {kind:"test",m:m,href:"#topic/"+m.id+"/test",label:m.short+" topic test"};
  }
  if(!T.length)return {kind:"none",href:"#home",label:"No topic is built yet"};
  return {kind:"done",href:"#mock",label:"Mock exam"};
};

/* ---------- route graph: fixed positions by first week (horizontal) or by row (vertical, phone) ---------- */
function layout(T,vert){
  var pos={},byCol={};
  T.forEach(function(m){var w=Math.min.apply(null,m.weeks);(byCol[w]=byCol[w]||[]).push(m.id)});
  var cols=Object.keys(byCol).map(Number).sort(function(a,b){return a-b});
  if(vert){var y=60;T.slice().sort(function(a,b){return Math.min.apply(null,a.weeks)-Math.min.apply(null,b.weeks)}).forEach(function(m,i){pos[m.id]=[i%2?250:95,y];y+=100});return {pos:pos,W:350,H:y-20}}
  var W=Math.max(640,cols.length*118+80);
  cols.forEach(function(w,ci){var ids=byCol[w];ids.forEach(function(id,k){pos[id]=[60+ci*((W-120)/Math.max(1,cols.length-1)),ids.length===1?(ci%2?110:200):80+k*130]})});
  return {pos:pos,W:W,H:290};
}
A.routeGraph=function(T,vert,nextId){
  var L=layout(T,vert),pos=L.pos,R=vert?30:32,ids=T.map(function(m){return m.id});
  var defs='<defs><marker id="rgm'+(vert?"v":"h")+'" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0 0L10 5L0 10z" class="carrow"/></marker></defs>';
  var edges="",nodes="";
  T.forEach(function(m){(m.uses||[]).forEach(function(u){if(ids.indexOf(u)<0)return;var a=pos[u],b=pos[m.id],dx=b[0]-a[0],dy=b[1]-a[1],Ln=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/Ln,uy=dy/Ln;
    edges+='<path class="cedge" d="M'+(a[0]+ux*(R+8)).toFixed(1)+" "+(a[1]+uy*(R+8)).toFixed(1)+" L"+(b[0]-ux*(R+12)).toFixed(1)+" "+(b[1]-uy*(R+12)).toFixed(1)+'" marker-end="url(#rgm'+(vert?"v":"h")+')"/>'})});
  T.forEach(function(m){var p=pos[m.id],st=A.topicStats(m),state=A.stateOf(m,st),C=2*Math.PI*(R+5),left=p[0]<175;
    if(state==="unvisited"&&m.id===nextId)state="frontier";
    var lab=vert?'<text class="lb" x="'+(left?p[0]+R+14:p[0]-R-14)+'" y="'+(p[1]-2)+'" text-anchor="'+(left?"start":"end")+'">'+esc(m.short)+'</text><text class="lm" x="'+(left?p[0]+R+14:p[0]-R-14)+'" y="'+(p[1]+16)+'" text-anchor="'+(left?"start":"end")+'">'+A.fmt(st.marks)+" marks · "+(A.isReady(m)?st.pct+"%":esc(m.status))+"</text>"
      :'<text class="lb" x="'+p[0]+'" y="'+(p[1]+R+24)+'" text-anchor="middle">'+esc(m.short)+'</text><text class="lm" x="'+p[0]+'" y="'+(p[1]+R+40)+'" text-anchor="middle">'+A.fmt(st.marks)+" marks</text>";
    nodes+='<a href="#topic/'+m.id+'" class="cnode '+state+'"><title>'+esc(m.name)+": "+(A.isReady(m)?st.pct+"% ready":m.status)+'</title><circle class="track" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(R+5)+'"/>'
      +(st.pct?'<circle class="ring" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(R+5)+'" stroke-dasharray="'+(C*st.pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 '+p[0]+" "+p[1]+')"/>':"")
      +'<circle class="disc" cx="'+p[0]+'" cy="'+p[1]+'" r="'+R+'"/><text class="ti" x="'+p[0]+'" y="'+(p[1]+6)+'" text-anchor="middle">'+esc(m.mark||"")+"</text>"+lab+"</a>"});
  return '<svg class="course '+(vert?"vert":"horiz")+'" viewBox="0 0 '+L.W+" "+L.H+'" role="img" aria-label="Course route. Arrows point from a topic to the topics that use it. Solid: done, amber: in progress, dashed: planned.">'+defs+edges+nodes+"</svg>";
};
function countdown(ex,tot){
  if(ex==="all")return '<div class="cd"><span><b>Full course</b><small>Pick an exam to see its countdown</small></span></div>';
  var d=A.examDate(ex),days=A.days(d),left=tot.p-tot.s;
  if(days==null)return '<div class="cd"><label for="h-exam"><b>'+esc(A.examLabel(ex))+' date</b><small>Not given yet. Set it for a countdown and a daily target.</small></label><input type="date" id="h-exam" class="field"></div>';
  if(days<0)return '<div class="cd"><span><b>Exam date passed</b><small>Change it in <a href="#settings">Settings</a></small></span></div>';
  var per=Math.ceil(left/Math.max(1,days));
  return '<div class="cd"><b>'+days+'</b><span>'+(days===1?"day":"days")+" left"+(left?"; about <strong>"+per+"</strong> PYQ"+(per===1?"":"s")+" a day":"; every PYQ solved")+"</span></div>";
}
A.blockTable=function(ex){
  var C=A.countsFor(ex),b=C.blocks||{},keys=Object.keys(b).sort(function(x,y){return parseInt(x)-parseInt(y)}),E=A.examInfo(ex);
  if(!keys.length)return "";
  var tot=keys.reduce(function(a,k){return a+b[k]},0);
  return '<section class="blocks"><h2 class="h2">Marks per 4-week block</h2><p class="sub">'+esc(A.examLabel(ex))+(E.newWeeks&&E.newWeeks.length?" is cumulative: new weeks "+E.newWeeks[0]+"–"+E.newWeeks[E.newWeeks.length-1]+", but earlier weeks are tested too. ":" ")+"A topic counts in the block of its first week.</p>"
    +keys.map(function(k){var pc=Math.round(100*b[k]/tot);return '<div class="blk"><span>Weeks '+esc(k)+'</span><div class="bar-track"><i style="width:'+pc+'%"></i></div><b>'+A.fmt(b[k])+" marks · "+pc+"%</b></div>"}).join("")+"</section>";
};
A.pages.home=function(root){
  var M=A.manifest,S=A.load(),ex=A.exam(),E=A.examInfo(ex),T=A.examTopics(ex),C=A.countsFor(ex),tot={p:0,s:0,mk:0,m:0};
  T.forEach(function(m){var st=A.topicStats(m,ex);tot.p+=st.pyqs;tot.s+=st.solved;tot.m+=st.marks;
    A.pyqsOf(m.id,ex).forEach(function(q){var a=S.ans[q.uid];if(a&&a.ok)tot.mk+=+q.marks||0})});
  if(!tot.p){tot.p=C.pyqs;tot.m=C.marks}
  var nx=A.nextStep(),nh;
  if(nx.kind==="lesson")nh='<p class="nx-k">'+esc(((A.flavour||{}).copy||{}).nextLabel||"Today")+'</p><h2>'+esc(nx.m.name)+", lesson "+nx.no+'</h2><p class="nx-m">'+esc(nx.sec.title)+" · about "+nx.mins+' min <small>(reading at 170 words a minute, plus 2 min per worked example or interactive and 1.5 min per check)</small></p><a class="btn" href="'+nx.href+'">'+(nx.no===1&&!S.read[nx.m.id+":"+nx.sec.id]?"Start":"Resume")+"</a>";
  else if(nx.kind==="pyqs")nh='<p class="nx-k">'+esc(((A.flavour||{}).copy||{}).nextLabel||"Today")+'</p><h2>Solve the '+esc(nx.m.short)+' PYQs</h2><p class="nx-p">'+nx.left+' left. Try each one before opening the solution.</p><a class="btn" href="'+nx.href+'">Resume</a>';
  else if(nx.kind==="test")nh='<p class="nx-k">'+esc(((A.flavour||{}).copy||{}).nextLabel||"Today")+'</p><h2>'+esc(nx.m.short)+' topic test</h2><p class="nx-p">Mixed questions from the whole topic, then a list of weak spots.</p><a class="btn" href="'+nx.href+'">Take the test</a>';
  else if(nx.kind==="none")nh='<p class="nx-k">Being built</p><h2>The first topic is on its way</h2><p class="nx-p">'+esc(A.examLabel(ex))+' topics are written one at a time, starting with Flask. Until then the course route below shows what is coming and how many marks each topic carries.</p>';
  else nh='<p class="nx-k">Every built topic done</p><h2>Sit a timed mock</h2><a class="btn" href="#mock">Start a mock</a>';
  var planned=E.status&&E.status!=="ready"&&E.status!=="in-progress";
  var FL=A.flavour||{},CP=FL.copy||{};
  var h='<div class="page home"><header class="'+(FL.hero?"hero":"home-head")+'"><div><p class="kicker">'+esc(CP.heroKicker||M.subject)+'</p><h1>'+esc(CP.heroTitle||(E.label+(ex!=="all"?" study guide":"")))+'</h1>'
    +'<p class="sub">'+(CP.heroTitle?"<b>"+esc(E.label)+"</b>. ":"")+(planned?esc(E.label)+" is "+esc(E.status)+": its past papers are not added yet. The lessons below are shared across exams.":(C.pyqs?C.pyqs+" past questions from "+(C.papers||[]).length+" papers, "+A.fmt(C.marks)+" marks, taught from zero.":(E.expected&&E.expected.pyqs?E.expected.pyqs+" past questions from "+E.expected.papers+" papers ("+A.fmt(E.expected.marks)+" marks) are being written up, one topic at a time.":"Past questions are being added.")))+'</p>'
    +'<div class="home-ex">'+A.examSelect("home-exam")+"</div></div>"+(FL.hero?FL.hero():"")+"</header>"
    +'<div class="home-grid"><section class="nextup">'+nh+'</section><section class="tally">'+countdown(ex,tot)
    +'<div><b>'+tot.s+'</b><span>of '+tot.p+' PYQs solved</span></div><div><b>'+A.fmt(tot.mk)+'</b><span>of '+A.fmt(tot.m)+' marks secured</span></div><div><b>'+Object.keys(S.read).length+'</b><span>lessons read</span></div></section></div>'
    +'<section class="mapcard"><h2 class="h2">The course route</h2><div class="mapwrap">'+A.routeGraph(T,false,nx.m&&nx.m.id)+A.routeGraph(T,true,nx.m&&nx.m.id)+'</div><ul class="legend"><li><i class="lg visited"></i>Done</li><li><i class="lg frontier"></i>In progress</li><li><i class="lg unvisited"></i>Not started</li><li><i class="lg planned"></i>Planned</li></ul></section>'
    +A.blockTable(ex)
    +'<h2 class="h2">Topics</h2><ol class="tlist" id="home-cards"></ol>'
    +'<h2 class="h2">Weeks</h2><div class="weeks">'+M.weeks.filter(function(w){return E.weeks.indexOf(w.num)>=0}).map(function(w){return '<a class="wk" href="#week/'+w.num+'"><b>Week '+w.num+(E.newWeeks&&E.newWeeks.indexOf(w.num)>=0?' <span class="pill">new</span>':"")+"</b><span>"+esc(w.title)+"</span></a>"}).join("")+"</div>"
    +(M.flags&&M.flags.length?'<p class="flagline">'+M.flags.map(function(f){return '<span class="tag FLAG">[FLAG]</span> '+esc(f)}).join(" · ")+"</p>":"")
    +"</div>";
  root.innerHTML=h;
  var he=$("#h-exam",root);if(he)he.onchange=function(){var S2=A.load();S2.prefs.examDates=S2.prefs.examDates||{};S2.prefs.examDates[ex]=this.value;A.save();A.route()};
  var cards=$("#home-cards",root);
  T.forEach(function(m){
    var st=A.topicStats(m,ex),t=A.topics[m.id],state=A.stateOf(m,st),li=el("li","trow "+state);
    var segs=t&&A.isReady(m)?t.sections.map(function(sec){return '<i class="'+(S.read[m.id+":"+sec.id]?"on":"")+'"></i>'}).join(""):"";
    if(A.flavour&&A.flavour.topicCard){li.innerHTML='<a href="#topic/'+m.id+'">'+A.flavour.topicCard(m,st,state,t&&A.isReady(m)?t.sections.length:(m.subs||[]).length)+"</a>";cards.appendChild(li);return}
    li.innerHTML='<a href="#topic/'+m.id+'"><span class="tnode">'+esc(m.mark||"")+'</span><span class="tmain"><b>'+esc(m.name)+(A.isReady(m)?"":' <span class="pill">'+esc(m.status)+"</span>")+'</b><span class="twhy">'+esc(m.why)+'</span><span class="segs" aria-label="'+st.read+" of "+st.secs+' lessons read">'+segs+'</span></span><span class="tnums"><span><b>'+st.solved+"/"+st.pyqs+'</b> PYQs</span><span><b>'+A.fmt(st.marks)+"</b> marks</span><span>weeks "+m.weeks.join(", ")+"</span></span></a>";
    cards.appendChild(li);
  });
};
A.pages.week=function(root,parts){
  var n=+parts[0],w=A.manifest.weeks.find(function(x){return x.num===n});
  if(!w){A.pages.home(root);return}
  var p=el("div","page");p.innerHTML='<nav class="crumb"><a href="#home">Course</a><span>Week '+n+'</span></nav><h1>Week '+n+": "+esc(w.title)+'</h1><p class="sub">'+esc(w.goal||"")+"</p>"
    +(w.flag?'<p class="flagbox"><b>[FLAG]</b> '+esc(w.flag)+"</p>":"")
    +(w.outcomes&&w.outcomes.length?'<div class="rem"><h4>By the end of the week you can</h4><ul>'+w.outcomes.map(function(o){return "<li>"+A.inline(o)+"</li>"}).join("")+"</ul></div>":"")
    +'<h2 class="h2">Topics this week</h2><ol class="tlist">'+w.topicIds.map(function(id){var m=A.topicMeta(id);if(!m)return "";return '<li class="trow '+A.stateOf(m)+'"><a href="#topic/'+id+'"><span class="tnode">'+esc(m.mark||"")+'</span><span class="tmain"><b>'+esc(m.name)+'</b><span class="twhy">'+esc(m.why)+"</span></span></a></li>"}).join("")+"</ol>"
    +'<nav class="lnav">'+(n>1?'<a class="btn ghost" href="#week/'+(n-1)+'">Week '+(n-1)+"</a>":"<span></span>")+(n<A.manifest.weeks.length?'<a class="btn" href="#week/'+(n+1)+'">Week '+(n+1)+"</a>":"")+"</nav>";
  root.appendChild(p);
};
})();
