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
  cols.forEach(function(w,ci){var ids=byCol[w];ids.forEach(function(id,k){pos[id]=[90+ci*((W-180)/Math.max(1,cols.length-1)),ids.length===1?(ci%2?110:200):80+k*130]})});
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
/* ---------- home sections: PYQ analysis, week and topic map, your progress (all computed from live data) ---------- */
function tiles(list){return '<div class="tiles">'+list.map(function(x){return '<div class="tile"><b>'+x[0]+"</b><span>"+esc(x[1])+"</span></div>"}).join("")+"</div>"}
function hbars(rows,max){return '<div class="hbars">'+rows.map(function(r){return '<div class="hbar"><span class="hb-l">'+r[0]+'</span><span class="hb-t"><i style="width:'+Math.max(r[1]>0?2:0,Math.round(100*r[1]/(max||1)))+'%"></i></span><span class="hb-v">'+r[2]+"</span></div>"}).join("")+"</div>"}
function pct(a,b){return b?A.fmt(Math.round(1000*a/b)/10)+"%":"0%"}
function subWeek(id){var w=null;A.manifest.topics.forEach(function(m){(m.subs||[]).forEach(function(s){if(s.id===id)w=s.week})});return w}
A.pyqAnalysis=function(ex,T){
  var all=[],papers={};T.forEach(function(m){A.pyqsOf(m.id,ex).forEach(function(q){all.push(q);papers[q.paper]=1})});
  if(!all.length)return "";
  var marks=all.reduce(function(a,q){return a+(+q.marks||0)},0),np=Object.keys(papers).length,live=T.filter(function(m){return A.pyqsOf(m.id,ex).length});
  var byT=live.map(function(m){var q=A.pyqsOf(m.id,ex);return {m:m,n:q.length,mk:q.reduce(function(a,x){return a+(+x.marks||0)},0)}}).sort(function(a,b){return b.mk-a.mk});
  var top=byT.slice(0,3),topMk=top.reduce(function(a,x){return a+x.mk},0);
  var TY={MCQ:["Single answer (MCQ)",0,0],MSQ:["Multiple answers (MSQ)",0,0],NUM:["Numeric answer",0,0],SA:["Typed answer",0,0]};
  all.forEach(function(q){var k=q.type==="COMP"?q.childType:q.type;if(k==="TF")k="MCQ";var o=TY[k]||TY.MCQ;o[1]+=+q.marks||0;o[2]++});
  var ty=Object.keys(TY).map(function(k){return TY[k]}).filter(function(o){return o[2]}).sort(function(a,b){return b[1]-a[1]});
  var comp=all.filter(function(q){return q.type==="COMP"}).length;
  var byP=Object.keys(papers).sort(function(a,b){return A.paperTime(a)-A.paperTime(b)}).map(function(p){var q=all.filter(function(x){return x.paper===p});return [esc(p),q.reduce(function(a,x){return a+(+x.marks||0)},0),q.length]});
  return '<section class="hsec"><h2 class="h2">PYQ analysis</h2><p class="note">Computed from the '+all.length+" past questions on this site ("+A.fmt(marks)+" marks, "+np+" papers). Marks are the marks printed in the papers; sub-questions of a case study are counted separately. This shows what was asked before, not what will be asked.</p>"
    +tiles([[all.length,"questions"],[A.fmt(marks),"marks"],[np,"papers"],[live.length,"topics"]])
    +'<h3 class="h3">Marks by topic</h3>'+hbars(byT.map(function(x){return ['<a href="#topic/'+x.m.id+'">'+esc(x.m.name)+"</a>",x.mk,A.fmt(x.mk)+" marks ("+pct(x.mk,marks)+"), "+x.n+" Qs"]}),byT[0].mk)
    +'<p class="reading"><b>Reading it:</b> the top three topics ('+top.map(function(x){return esc(x.m.short)}).join(", ")+") hold "+A.fmt(topMk)+" of "+A.fmt(marks)+" marks, which is "+pct(topMk,marks)+".</p>"
    +'<h3 class="h3">Question types</h3>'+hbars(ty.map(function(o){return [esc(o[0]),o[1],A.fmt(o[1])+" marks, "+o[2]+" Qs"]}),ty[0][1])
    +(comp?'<p class="sub">'+comp+" of these are sub-questions of a case study (a passage or code shared by two or three questions).</p>":"")
    +'<h3 class="h3">Marks per paper in this bank</h3>'+hbars(byP.map(function(r){return [r[0],r[1],A.fmt(r[1])+" marks, "+r[2]+" Qs"]}),Math.max.apply(null,byP.map(function(r){return r[1]})))
    +A.paperTopicTable(ex,T)+A.topIdeas(ex,T,10)
    +"</section>";
};
/* which topics appeared in which paper, and the ideas that carried the most marks */
A.paperTopicTable=function(ex,T){
  var papers={},live=T.filter(function(m){return A.pyqsOf(m.id,ex).length});
  live.forEach(function(m){A.pyqsOf(m.id,ex).forEach(function(q){papers[q.paper]=1})});
  var P=Object.keys(papers).sort(function(a,b){return A.paperTime(a)-A.paperTime(b)});if(!P.length)return "";
  var rows=live.map(function(m){var q=A.pyqsOf(m.id,ex),cells=P.map(function(p){return q.filter(function(x){return x.paper===p}).reduce(function(a,x){return a+(+x.marks||0)},0)});return {m:m,cells:cells,tot:cells.reduce(function(a,b){return a+b},0)}}).sort(function(a,b){return b.tot-a.tot});
  var mx=Math.max.apply(null,rows.map(function(r){return Math.max.apply(null,r.cells)}));
  function short(p){var d=p.match(/^(\d+ )?([A-Za-z]{3})[a-z]* (\d{4})$/);return d?d[2]+" "+d[3]:p}
  return '<h3 class="h3">Which topics appeared in which paper (marks)</h3><div class="tw heat"><table><thead><tr><th>Topic</th>'+P.map(function(p){return "<th>"+esc(short(p))+"</th>"}).join("")+"<th>Papers</th></tr></thead><tbody>"
    +rows.map(function(r){return '<tr><td><a href="#topic/'+r.m.id+'">'+esc(r.m.short)+"</a></td>"+r.cells.map(function(c){return '<td style="--h:'+(c?(0.12+0.7*c/mx).toFixed(2):0)+'">'+(c?A.fmt(c):"")+"</td>"}).join("")+"<td>"+r.cells.filter(function(c){return c}).length+"/"+P.length+"</td></tr>"}).join("")
    +'</tbody></table></div><p class="sub">Darker cell, more marks from that topic in that paper. A topic that shows up in most papers is a safe investment.</p>';
};
A.topIdeas=function(ex,T,n){
  var all=[];T.filter(A.isReady).forEach(function(m){var cm=A.conceptMarks(m.id,ex),t=A.topics[m.id];Object.keys(cm).forEach(function(k){var c=t.concepts[k],sec=t.sections.find(function(s){return (s.concepts||[]).indexOf(k)>=0});all.push({m:m,name:c?c.name:k,mk:cm[k].marks,n:cm[k].n,href:"#topic/"+m.id+(sec?"/lesson/"+sec.id:"")})})});
  all.sort(function(a,b){return b.mk-a.mk||b.n-a.n});
  return all.length?'<h3 class="h3">Ten highest-mark ideas</h3><ol class="prose ideas">'+all.slice(0,n||10).map(function(x){return '<li><a href="'+x.href+'">'+esc(x.m.short)+" / "+A.inline(x.name)+"</a> ("+A.fmt(x.mk)+" marks, "+x.n+" Qs)</li>"}).join("")+"</ol>":"";
};
A.toolkit=function(){
  var items=[["plan","Study plan","Pick 1 hour, a day or a week; get an ordered list with times."],["cards","Flashcards","Spaced recall of every idea, command and trap."],["glossary","Glossary","Every term in plain English, from all the lessons."],["cheat","Cheatsheet","Every topic's methods and traps on one page."],["things","Things to remember","Facts, cues and exam moves, all topics."],["mock","Mock exam","A timed paper of past questions that marks itself."]];
  return '<section class="hsec"><h2 class="h2">Study toolkit</h2><div class="toolkit">'+items.map(function(x){return '<a class="tk" href="#'+x[0]+'">'+A.ico(x[0]==="things"?"things":x[0]==="cheat"?"sheet":x[0])+"<b>"+esc(x[1])+"</b><span>"+esc(x[2])+"</span></a>"}).join("")+'</div><p class="note">Progress is stored in this browser. Sign in from Settings to sync it to your other devices, or <a href="#settings">back it up to a file</a>.</p></section>';
};
A.studyGuides=function(ex,T){
  var byT=T.filter(function(m){return A.pyqsOf(m.id,ex).length}).map(function(m){var q=A.pyqsOf(m.id,ex);return {m:m,mk:q.reduce(function(a,x){return a+(+x.marks||0)},0)}}).sort(function(a,b){return b.mk-a.mk});
  var tot=byT.reduce(function(a,x){return a+x.mk},0),top=byT.slice(0,3),topMk=top.reduce(function(a,x){return a+x.mk},0);
  var order=T.filter(A.isReady).map(function(m){return esc(m.short)}).join(", then ");
  return '<section class="hsec guide"><h2 class="h2">How to study for the first time</h2><p class="sub">Use this if you are meeting MAD 1 for the first time. Plan about 4 to 6 hours per topic, spread over two days.</p><ol class="prose steps">'
    +"<li><b>Set up (10 min).</b> Open the topic and read its orientation: what you will learn, and how many marks it carried in past papers.</li>"
    +"<li><b>Prerequisites first (15 min).</b> Do the refresher under \"What comes before\" even if it looks easy. Most Flask and database mistakes come from a shaky picture of one HTTP request.</li>"
    +"<li><b>One lesson at a time (30 to 45 min each).</b> Read the In short box, then the lesson. Follow every worked example with a pen and say the next step before you reveal it. Then answer the checks; if you miss one, reread that lesson.</li>"
    +"<li><b>Say it back.</b> After each lesson, close the page and explain the idea in two sentences in the Teach it back box.</li>"
    +"<li><b>Past questions before solutions (45 to 60 min).</b> Try each one on paper first, mark how sure you are, then read the solution. When you are wrong, note why.</li>"
    +"<li><b>Revise and test (30 min).</b> Read the Revise tab once, then take the topic test with an honest confidence for each answer.</li>"
    +"<li><b>Next day, 20 minutes.</b> Redo your Mistakes, then go through the Checklist. Tick a skill only if you can do it without notes.</li>"
    +"<li><b>Follow the topic order.</b> "+order+". Each topic uses the ones before it.</li></ol>"
    +'<h2 class="h2">How to study to maximise marks</h2><p class="sub">Use this when time is short or you know the basics. It is built from the analysis above.</p><ol class="prose steps">'
    +"<li><b>Spend time where the marks are.</b> The three highest-mark topics ("+top.map(function(x){return esc(x.m.short)}).join(", ")+") carry "+(tot?Math.round(1000*topMk/tot)/10:0)+"% of the marks in this bank. Secure them completely before polishing small topics.</li>"
    +"<li><b>Prefer topics that appear in many papers.</b> Use the paper-by-topic table: a topic present in most papers is more dependable than one that appeared once.</li>"
    +"<li><b>Learn the fixed patterns.</b> The same question types repeat with new code: each topic's orientation lists the patterns and the first move for each.</li>"
    +"<li><b>Run the code in your head the same way every time.</b> Write the route table, the model's keys, or the template's variables first; most traps vanish once that is on paper.</li>"
    +"<li><b>Study your own errors.</b> Open Mistakes and fix the ones where you were sure and wrong first: those cost marks in the exam.</li>"
    +"<li><b>Exam technique.</b> For multiple-answer questions judge every option on its own; check status codes and exact output text letter by letter; leave a hard question after two minutes and come back.</li>"
    +'<li><b>Last day.</b> Top topics first, redo mistakes, read each topic\'s Revise tab, then stop.</li></ol><p><a class="btn ghost" href="#cheat">Open the cheatsheet</a></p></section>';
};
A.weekMap=function(ex,T){
  var E=A.examInfo(ex),M=A.manifest,all=[];T.forEach(function(m){A.pyqsOf(m.id,ex).forEach(function(q){all.push(q)})});
  var marks=all.reduce(function(a,q){return a+(+q.marks||0)},0);
  var weeks=M.weeks.filter(function(w){return E.weeks.indexOf(w.num)>=0}),later=M.weeks.filter(function(w){return E.weeks.indexOf(w.num)<0});
  var rows=weeks.map(function(w){
    var q=all.filter(function(x){return subWeek(x.sub)===w.num}),mk=q.reduce(function(a,x){return a+(+x.marks||0)},0);
    var study=[];T.forEach(function(m){(m.subs||[]).forEach(function(s){if(s.week===w.num)study.push('<a href="#topic/'+m.id+'/sub/'+s.id+'">'+esc(m.short)+": "+A.inline(s.name.replace(/\s*\(.*\)$/,""))+"</a>")})});
    return ['<a href="#week/'+w.num+'"><b>Week '+w.num+"</b></a><br><small>"+esc(w.title)+(E.newWeeks&&E.newWeeks.indexOf(w.num)>=0?' <span class="pill">new for '+esc(E.label)+"</span>":"")+"</small>",
      esc((w.lectures||[]).join(", "))+(w.note?'<br><small class="mute">'+esc(w.note)+"</small>":""),
      study.join("<br>")||'<span class="mute">no PYQs</span>',
      q.length?"<b>"+A.fmt(mk)+"</b> <small>("+pct(mk,marks)+")</small>":"0",String(q.length)]});
  var after=later.length?'<p class="sub">Weeks '+later[0].num+"–"+later[later.length-1].num+" ("+later.map(function(w){return esc(w.title)}).join(", ")+") come after "+esc(E.label)+".</p>":"";
  return '<section class="hsec"><h2 class="h2">Week and topic map</h2><p class="note">Built from the course syllabus ('+esc(E.label)+" covers weeks "+E.weeks[0]+" to "+E.weeks[E.weeks.length-1]+(E.newWeeks&&E.newWeeks.length?", with weeks "+E.newWeeks[0]+" to "+E.newWeeks[E.newWeeks.length-1]+" new":"")+"). Marks are the PYQ marks whose sub-topic falls in that week, counted from the questions on this site. Small notes say where a placement is mine and not stated in the lectures.</p>"
    +'<div class="wmap">'+A.rawTable(["Week","Covered in the lectures","Study on this site","PYQ marks","Questions"],rows)+"</div>"+after+"</section>";
};
A.progressBlock=function(ex,T){
  var S=A.load(),R=T.filter(A.isReady);if(!R.length)return "";
  var secs=0,read=0,pq=0,solved=0,tried=0;
  R.forEach(function(m){var st=A.topicStats(m,ex);secs+=st.secs;read+=st.read;pq+=st.pyqs;solved+=st.solved;A.pyqsOf(m.id,ex).forEach(function(q){if(S.ans[q.uid])tried++})});
  var review=Object.keys(S.ans).filter(function(k){var a=S.ans[k];return !a.ok||a.conf==="Unsure"||a.conf==="Guess"}).length;
  var nx=A.nextStep(),nxt="";
  if(nx.m){var st=A.topicStats(nx.m,ex);nxt='<p class="reading"><b>Next step:</b> <a href="'+nx.href+'">'+esc(nx.m.name)+"</a> ("+(st.secs-st.read)+" lesson"+(st.secs-st.read===1?"":"s")+" unread, "+(st.pyqs-st.solved)+" PYQ"+(st.pyqs-st.solved===1?"":"s")+" left to solve).</p>"}
  var bars=hbars(R.map(function(m){var st=A.topicStats(m,ex);return ['<a href="#topic/'+m.id+'">'+esc(m.name)+"</a>",st.pct,st.solved+"/"+st.pyqs+" PYQs, "+st.read+"/"+st.secs+" lessons"]}),100);
  var C={};Object.keys(S.ans).forEach(function(k){var a=S.ans[k];if(!a.concept||!a.topic||!A.topics[a.topic])return;var key=a.topic+"|"+a.concept,o=C[key]=C[key]||{t:a.topic,c:a.concept,n:0,bad:0};o.n++;if(!a.ok)o.bad++});
  var weak=Object.keys(C).map(function(k){return C[k]}).filter(function(o){return o.bad}).sort(function(a,b){return b.bad-a.bad||b.bad/b.n-a.bad/a.n}).slice(0,5);
  var ideas=weak.length?'<h3 class="h3">Ideas to work on</h3><ol class="prose ideas">'+weak.map(function(o){var t=A.topics[o.t],cn=(t.concepts[o.c]||{}).name||o.c,sec=t.sections.find(function(s){return (s.concepts||[]).indexOf(o.c)>=0});
      return '<li><a href="#topic/'+o.t+(sec?"/lesson/"+sec.id:"")+'">'+A.inline(cn)+"</a> ("+esc(A.topicMeta(o.t).short)+": missed "+o.bad+" of "+o.n+" question"+(o.n===1?"":"s")+")</li>"}).join("")+"</ol>"
    :'<p class="sub">Ideas to work on will appear here once you have answered some questions: the concepts you miss most, each linked to its lesson.</p>';
  return '<section class="hsec"><h2 class="h2">Your progress</h2>'
    +tiles([[read+"/"+secs,"lessons read"],[solved+"/"+pq,"PYQs solved"],[tried,"PYQs attempted"],[review,"in mistake review"]])+nxt
    +bars+ideas+"</section>";
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
    +'<h2 class="h2">Topics</h2><ol class="tlist" id="home-cards"></ol>'
    +'<section class="mapcard"><h2 class="h2">'+esc(E.label)+' on one page: how the topics connect</h2><p class="sub">Each arrow points from a topic to a topic that uses it. Click any circle to open it.</p><div class="mapwrap">'+A.routeGraph(T,false,nx.m&&nx.m.id)+A.routeGraph(T,true,nx.m&&nx.m.id)+'</div><ul class="legend"><li><i class="lg visited"></i>Done</li><li><i class="lg frontier"></i>In progress</li><li><i class="lg unvisited"></i>Not started</li><li><i class="lg planned"></i>Planned</li></ul></section>'
    +A.toolkit()+A.progressBlock(ex,T)+A.weekMap(ex,T)+A.pyqAnalysis(ex,T)+A.studyGuides(ex,T)

    +(M.flags&&M.flags.length?'<p class="flagline">'+M.flags.map(function(f){return '<span class="tag FLAG">[FLAG]</span> '+esc(f)}).join(" · ")+"</p>":"")
    +"</div>";
  root.innerHTML=h;
  var he=$("#h-exam",root);if(he)he.onchange=function(){var S2=A.load();S2.prefs.examDates=S2.prefs.examDates||{};S2.prefs.examDates[ex]=this.value;A.save();A.route()};
  var cards=$("#home-cards",root);
  T.forEach(function(m){
    var st=A.topicStats(m,ex),t=A.topics[m.id],state=A.stateOf(m,st),li=el("li","trow "+state);li.style.setProperty("--tc",A.topicColor(m.id));
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
    +(w.lectures&&w.lectures.length?'<h2 class="h2">Lectures</h2><ul class="prose">'+w.lectures.map(function(l){return "<li>"+esc(l)+"</li>"}).join("")+"</ul>":"")
    +(w.note?'<p class="note">'+esc(w.note)+"</p>":"")
    +(w.flag?'<p class="flagbox"><b>[FLAG]</b> '+esc(w.flag)+"</p>":"")
    +(w.outcomes&&w.outcomes.length?'<div class="rem"><h4>By the end of the week you can</h4><ul>'+w.outcomes.map(function(o){return "<li>"+A.inline(o)+"</li>"}).join("")+"</ul></div>":"")
    +(w.topicIds.length?'<h2 class="h2">Topics this week</h2>':"")+'<ol class="tlist">'+w.topicIds.map(function(id){var m=A.topicMeta(id);if(!m)return "";return '<li class="trow '+A.stateOf(m)+'"><a href="#topic/'+id+'"><span class="tnode">'+esc(m.mark||"")+'</span><span class="tmain"><b>'+esc(m.name)+'</b><span class="twhy">'+esc(m.why)+"</span></span></a></li>"}).join("")+"</ol>"
    +'<nav class="lnav">'+(n>1?'<a class="btn ghost" href="#week/'+(n-1)+'">Week '+(n-1)+"</a>":"<span></span>")+(n<A.manifest.weeks.length?'<a class="btn" href="#week/'+(n+1)+'">Week '+(n+1)+"</a>":"")+"</nav>";
  root.appendChild(p);
};
})();
