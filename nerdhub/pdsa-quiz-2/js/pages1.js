/* PDSA pages: home + topic */
(function(){
var P=window.PDSA,esc=P.esc,el=P.el,md=P.md,$=P.$,$$=P.$$;
P.topicList=function(){return P.manifest.topics};
P.T=function(id){return P.topics[id]};
P.readMins=function(o){return Math.max(1,Math.round(JSON.stringify(o||"").length/1150))};
P.pyqsOf=function(t){return (t&&t.pyqs)||[]};
P.topicStats=function(m){
  var t=P.topics[m.id],S=P.load();
  if(!t)return {ready:false,pyqs:m.subs.reduce(function(a,s){return a+s[1]},0),marks:m.marks,solved:0,read:0,secs:0,pct:0};
  var q=t.pyqs,solved=q.filter(function(x){return S.ans[x.id]&&S.ans[x.id].ok}).length;
  var secs=(t.prereqs||[]).concat(t.sections),read=secs.filter(function(s){return S.read[t.id+":"+s.id]}).length;
  var tst=(S.steps[t.id]||{}).test?1:0;
  var pct=Math.round(100*(0.35*read/Math.max(1,secs.length)+0.45*solved/Math.max(1,q.length)+0.2*tst));
  return {ready:true,pyqs:q.length,marks:q.reduce(function(a,x){return a+x.marks},0),solved:solved,read:read,secs:secs.length,pct:pct};
};
function pathBar(m){
  var S=P.load(),t=P.topics[m.id],stp=(S.steps[m.id]||{}),st=P.topicStats(m);
  var done=[st.secs&&st.read===st.secs,st.pyqs&&st.solved>=st.pyqs*0.8,!!stp.test,!!stp.revise,!!stp.check];
  return '<ol class="path">'+["Learn","Practice PYQs","Topic test","Revise","Checklist"].map(function(s,i){return '<li class="'+(done[i]?"done":"")+'">'+(i+1)+". "+s+"</li>"}).join("")+"</ol>";
}
/* ---------- HOME: the course is a graph ---------- */
P.pages={};
function stateOf(st){return !st.ready?"unvisited":st.pct>=80?"visited":(st.read||st.solved)?"frontier":"unvisited"}
P.stateOf=stateOf;
P.nextStep=nextStep;
function nextStep(){
  var S=P.load(),T=P.manifest.topics;
  for(var i=0;i<T.length;i++){var m=T[i],t=P.topics[m.id];if(!t)continue;
    var secs=t.sections;for(var k=0;k<secs.length;k++){if(!S.read[m.id+":"+secs[k].id])return {m:m,t:t,kind:"lesson",sec:secs[k],no:k+1,n:secs.length,href:"#topic-"+m.id+"/"+secs[k].id}}
    var left=t.pyqs.filter(function(q){return !(S.ans[q.id]&&S.ans[q.id].ok)});
    if(left.length>t.pyqs.length*0.2)return {m:m,t:t,kind:"pyqs",left:left.length,href:"#topic-"+m.id+"/pyqs"};
    if(!(S.steps[m.id]||{}).test)return {m:m,t:t,kind:"test",href:"#topic-"+m.id+"/test"};
  }
  return {kind:"done",href:"#mock"};
}
function courseGraph(T,vert,nextId){
  var pos=vert?{"divide-conquer":[95,70],"trees":[255,205],"heaps":[95,340],"greedy":[255,475],"graphs":[95,610]}:{"divide-conquer":[110,215],"trees":[290,115],"heaps":[470,215],"greedy":[650,115],"graphs":[830,215]},R=vert?40:46;
  var defs='<defs><marker id="cm" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0 0L10 5L0 10z" class="carrow"/></marker></defs>';
  var edges="",nodes="",k=0;
  T.forEach(function(m,mi){m.uses.forEach(function(u){var a=pos[u],b=pos[m.id];if(!a||!b||!T[mi-1]||T[mi-1].id!==u)return;var d;
    if(Math.abs(b[0]-a[0])<=200){var dx=b[0]-a[0],dy=b[1]-a[1],L=Math.sqrt(dx*dx+dy*dy),ux=dx/L,uy=dy/L;d="M"+(a[0]+ux*(R+9))+" "+(a[1]+uy*(R+9))+" L"+(b[0]-ux*(R+14))+" "+(b[1]-uy*(R+14));edges+='<path class="cedge" style="--d:'+(k++)+'" d="'+d+'" marker-end="url(#cm)"/>'}
    })});
  T.forEach(function(m,i){var p=pos[m.id],st=P.topicStats(m),state=stateOf(st),C=2*Math.PI*(R+6),top=!vert&&p[1]<150,left=p[0]<150;if(state==='unvisited'&&m.id===nextId)state='frontier';
    nodes+='<a href="#topic-'+m.id+'" class="cnode '+state+'"><title>'+esc(m.name)+": "+st.pct+'% done</title><circle class="track" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(R+6)+'"/>'
     +(st.pct?'<circle class="ring" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(R+6)+'" stroke-dasharray="'+(C*st.pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 '+p[0]+" "+p[1]+')"/>':"")
     +'<circle class="disc" cx="'+p[0]+'" cy="'+p[1]+'" r="'+R+'"/><text class="ti" x="'+p[0]+'" y="'+(p[1]+9)+'" text-anchor="middle">'+(i+1)+'</text>'
     +(vert?'<text class="lb" x="'+(left?p[0]+R+18:p[0]-R-18)+'" y="'+(p[1]-2)+'" text-anchor="'+(left?"start":"end")+'">'+esc(m.short)+'</text><text class="lm" x="'+(left?p[0]+R+18:p[0]-R-18)+'" y="'+(p[1]+18)+'" text-anchor="'+(left?"start":"end")+'">'+st.marks+' marks</text>'
      :'<text class="lb" x="'+p[0]+'" y="'+(top?p[1]-R-30:p[1]+R+34)+'" text-anchor="middle">'+esc(m.short)+'</text><text class="lm" x="'+p[0]+'" y="'+(top?p[1]-R-12:p[1]+R+52)+'" text-anchor="middle">'+st.marks+' marks</text>')+'</a>'});
  return '<svg class="course '+(vert?"vert":"horiz")+'" viewBox="'+(vert?"0 0 350 680":"0 16 940 312")+'" role="img" aria-label="Course map of the five topics. Arrows point from a topic to the topics that build on it.">'+defs+edges+nodes+"</svg>";
}
function countdown(S,tot){
  var d=S.prefs.exam,left=tot.p-tot.s;
  if(!d)return '<div class="cd"><label for="h-exam"><b>Exam date</b><small>Set it to get a countdown and a daily target</small></label><input type="date" id="h-exam" class="field"></div>';
  var days=Math.ceil((new Date(d+"T09:00:00")-Date.now())/864e5);
  if(days<0)return '<div class="cd"><span><b>Exam date passed</b><small>Change it in Settings</small></span></div>';
  var per=Math.ceil(left/Math.max(1,days));
  return '<div class="cd"><b>'+days+'</b><span>'+(days===1?"day":"days")+" to the exam"+(left?"; solve <strong>"+per+"</strong> PYQ"+(per===1?"":"s")+" a day to finish":"; every PYQ solved")+"</span></div>";
}
P.pages.home=function(root){
  var M=P.manifest,S=P.load(),T=M.topics,tot={p:0,m:0,s:0,mk:0};
  T.forEach(function(m){var st=P.topicStats(m);tot.p+=st.pyqs;tot.m+=st.marks;tot.s+=st.solved;if(P.topics[m.id])tot.mk+=P.topics[m.id].pyqs.filter(function(q){return S.ans[q.id]&&S.ans[q.id].ok}).reduce(function(a,q){return a+q.marks},0)});
  var nx=nextStep(),nxHTML;
  if(nx.kind==="lesson")nxHTML='<p class="nx-k">Next lesson</p><h2>'+esc(nx.sec.title)+'</h2><p class="nx-m">'+esc(nx.m.name)+", lesson "+nx.no+" of "+nx.n+'</p><p class="nx-p">'+P.inline(nx.sec.plain||nx.sec.studying||"")+'</p><a class="btn" href="'+nx.href+'">'+(nx.no===1&&!S.prefs.last?"Start learning":"Continue learning")+"</a>";
  else if(nx.kind==="pyqs")nxHTML='<p class="nx-k">Next up</p><h2>Solve the '+esc(nx.m.short)+' PYQs</h2><p class="nx-p">'+nx.left+' questions left. Try each one yourself before opening the solution.</p><a class="btn" href="'+nx.href+'">Practise '+esc(nx.m.short)+"</a>";
  else if(nx.kind==="test")nxHTML='<p class="nx-k">Next up</p><h2>'+esc(nx.m.short)+' topic test</h2><p class="nx-p">Mixed questions from the whole topic, with a list of weak spots at the end.</p><a class="btn" href="'+nx.href+'">Take the test</a>';
  else nxHTML='<p class="nx-k">All five topics done</p><h2>Sit a full mock exam</h2><p class="nx-p">Timed, marked, and drawn from every paper.</p><a class="btn" href="#mock">Start a mock exam</a>';
  var h='<div class="page home">'
   +'<header class="home-head"><h1>PDSA Quiz 2, one topic at a time</h1><p>All '+tot.p+' past questions from '+M.papers.length+' papers ('+esc(M.papers[0])+" to "+esc(M.papers[M.papers.length-1])+'), taught from zero. Learn the topics in order: each one builds on the one before it.</p></header>'
   +'<section class="mapcard"><div class="mapwrap">'+courseGraph(T,false,nx.m&&nx.m.id)+courseGraph(T,true,nx.m&&nx.m.id)+'</div><ul class="legend"><li><i class="lg visited"></i>Done</li><li><i class="lg frontier"></i>In progress</li><li><i class="lg unvisited"></i>Not started</li></ul></section>'
   +'<div class="home-grid"><section class="nextup">'+nxHTML+'</section>'
   +'<section class="tally">'+countdown(S,tot)+'<div><b>'+tot.s+'</b><span>of '+tot.p+' PYQs solved</span></div><div><b>'+tot.mk+'</b><span>of '+tot.m+' marks covered</span></div><div><b>'+Object.keys(S.read).length+'</b><span>lessons read</span></div></section></div>'
   +'<h2 class="h2">Topics</h2><ol class="tlist" id="home-cards"></ol>'
   +'<h2 class="h2">When the exam is close</h2><div class="tools" id="home-tools"></div>'
   +'<details class="backup"><summary>Back up or move your progress</summary><p>'+(P.storeOK?"Progress is saved in this browser only.":"This browser blocks storage, so progress lasts only until you close the page.")+' Copy the export text and paste it into Restore on another device.</p><textarea id="exp" class="field" aria-label="Progress export text"></textarea><p><button class="btn sm ghost" id="b-exp">Export</button> <button class="btn sm ghost" id="b-imp">Restore from text</button> <button class="btn sm ghost" id="b-reset">Reset all progress</button> <span id="exp-msg"></span></p></details>'
   +"</div>";
  root.innerHTML=h;
  var he=$("#h-exam",root);if(he)he.onchange=function(){var S2=P.load();S2.prefs.exam=this.value;P.save();var be=document.getElementById("b-exam");if(be)be.value=this.value;P.route()};
  var cards=$("#home-cards",root);
  T.forEach(function(m,i){
    var st=P.topicStats(m),t=P.topics[m.id],state=stateOf(st),li=el("li","trow "+state);
    var segs=t?t.sections.map(function(sec){return '<i class="'+(S.read[m.id+":"+sec.id]?"on":"")+'"></i>'}).join(""):"";
    li.innerHTML='<a href="#topic-'+m.id+'"><span class="tnode">'+(i+1)+'</span><span class="tmain"><b>'+esc(m.name)+'</b><span class="twhy">'+esc(m.why)+'</span><span class="segs" aria-label="'+st.read+" of "+st.secs+' lessons read">'+segs+'</span></span><span class="tnums"><span><b>'+st.solved+"/"+st.pyqs+'</b> PYQs</span><span><b>'+st.marks+'</b> marks</span></span></a>';
    cards.appendChild(li);
  });
  var tools=[["#mock","mock","Mock exam","Timed paper from any topics; auto-submits."],["#practice","practice","Practice","Questions picked from your weak spots, weighted by marks."],["#cards","cards","Flashcards","Spaced repetition on ideas, formulas and traps."],["#sheet","sheet","Last-night sheet","Every topic's formulas and traps on one page."],["#mistakes","mistakes","Mistakes","Everything you missed or guessed."],["#plan","plan","Study plan","A plan for 1 hour, half a day, a day or a week."]];
  $("#home-tools",root).innerHTML=tools.map(function(t){return '<a class="tool" href="'+t[0]+'">'+P.ico(t[1])+'<span><b>'+t[2]+'</b><small>'+t[3]+"</small></span></a>"}).join("");
  $("#b-exp",root).onclick=function(){$("#exp",root).value=P.exportState();$("#exp-msg",root).textContent="Copy the text above."};
  $("#b-imp",root).onclick=function(){try{P.importState($("#exp",root).value);P.toast("Progress restored");P.route()}catch(e){$("#exp-msg",root).textContent="That text is not a valid export."}};
  $("#b-reset",root).onclick=function(){if(this.dataset.s){try{localStorage.removeItem("pdsa-q2-v1")}catch(e){}location.reload()}else{this.dataset.s=1;this.textContent="Click again to erase everything"}};
};

/* ---------- mind map ---------- */
function mindmap(mm,ac){
  var B=mm.branches,W=900,rowH=0,L=[],R=[];
  B.forEach(function(b,i){(i%2?R:L).push(b)});
  function boxH(b){return 30+b.kids.length*17}
  var Hn=Math.max(L.reduce(function(a,b){return a+boxH(b)+16},0),R.reduce(function(a,b){return a+boxH(b)+16},0))+30,cy=Hn/2;
  var s='<svg viewBox="0 0 '+W+" "+Hn+'" role="img" aria-label="Mind map">';
  s+='<g class="root"><rect x="'+(W/2-90)+'" y="'+(cy-26)+'" width="180" height="52" rx="26" fill="'+ac+'"/><text x="'+(W/2)+'" y="'+(cy+5)+'" text-anchor="middle">'+esc(mm.center)+"</text></g>";
  function side(arr,left){var y=15;arr.forEach(function(b){var h=boxH(b),x=left?20:W-290,w=270,ym=y+h/2,x0=left?x+w:x,x1=W/2+(left?-90:90);
    s+='<path d="M'+x1+" "+cy+" C"+((x1+x0)/2)+" "+cy+" "+((x1+x0)/2)+" "+ym+" "+x0+" "+ym+'" fill="none" stroke="'+ac+'" stroke-width="2" opacity=".55"/>';
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" fill="var(--card)" stroke="'+ac+'" stroke-width="2"/><text x="'+(x+12)+'" y="'+(y+21)+'" style="fill:'+ac+'">'+esc(b.t)+"</text>";
    b.kids.forEach(function(k,i){s+='<text x="'+(x+12)+'" y="'+(y+40+i*17)+'" style="font-weight:400;font-size:12px">• '+esc(k)+"</text>"});
    y+=h+16})}
  side(L,true);side(R,false);
  return s+"</svg>";
}
function bigPicture(t){
  var w=el("div","box"),tabs=["Story","Mind map","How the ideas connect","Where the marks come from","Roadmap"],cur=0;
  var tb=el("div","tabs"),body=el("div");
  tabs.forEach(function(n,i){var b=el("button",i===0?"on":"",n);b.type="button";b.onclick=function(){cur=i;$$("button",tb).forEach(function(x,k){x.classList.toggle("on",k===i)});draw()};tb.appendChild(b)});
  function draw(){
    var h="";
    if(cur===0)h='<div class="prose">'+md(t.story)+"</div>";
    if(cur===1)h='<div class="mm">'+mindmap(t.mindmap,t.accent)+'</div><ul class="outline-list">'+t.mindmap.branches.map(function(b){return "<li><b>"+esc(b.t)+"</b><ul>"+b.kids.map(function(k){return "<li>"+esc(k)+"</li>"}).join("")+"</ul></li>"}).join("")+"</ul>";
    if(cur===2){var nodes=[],edges=[];t.connect.forEach(function(c){[c[0],c[1]].forEach(function(n){if(nodes.indexOf(n)<0)nodes.push(n)});edges.push([c[0],c[1]])});
      h='<div class="fig">'+P.graphSVG({nodes:nodes,edges:edges,directed:true,W:640,H:320,alt:"how the ideas connect"}).replace(/<circle[^>]*r="18"[^>]*\/><text[^>]*>([^<]*)<\/text>/g,function(m,n){return m})+'</div>'+'<div class="prose"><ul>'+t.connect.map(function(c){return "<li><b>"+esc(c[0])+"</b> → <b>"+esc(c[1])+"</b>: "+P.inline(c[2])+"</li>"}).join("")+"</ul></div>";
      /* node labels are long: use a named-card layout instead of tiny circles */
      h='<div class="prose"><ul>'+t.connect.map(function(c){return "<li><b>"+esc(c[0])+"</b> → <b>"+esc(c[1])+"</b>: "+P.inline(c[2])+"</li>"}).join("")+"</ul></div>";
    }
    if(cur===3){var g=P.ideaStats(t);h='<p>Computed from this topic\'s PYQs only.</p>'+P.tableHTML(["Idea","PYQs","Marks","Share"],g.map(function(x){return [x.idea,String(x.n),String(x.marks),x.share+"%"]}))+g.map(function(x){return '<div style="margin:6px 0"><div style="font-size:.86rem">'+esc(x.idea)+'</div><div class="bar"><i style="width:'+x.share+'%"></i></div></div>'}).join("")}
    if(cur===4)h='<ol class="prose">'+t.roadmap.map(function(r){return '<li><a href="#" data-go="'+r[1]+'">'+esc(r[0])+"</a></li>"}).join("")+"</ol>";
    body.innerHTML=h;P.math(body);
    $$("[data-go]",body).forEach(function(a){a.onclick=function(e){e.preventDefault();location.hash="#topic-"+t.id+"/"+a.dataset.go}});
  }
  w.appendChild(tb);w.appendChild(body);draw();return w;
}
P.ideaStats=function(t){
  var m={},tot=0;t.pyqs.forEach(function(q){var k=q.idea;m[k]=m[k]||{idea:k,n:0,marks:0,types:{},papers:{},sec:q.sec};m[k].n++;m[k].marks+=q.marks;m[k].types[q.type]=1;m[k].papers[q.exam]=1;tot+=q.marks});
  return Object.keys(m).map(function(k){var x=m[k];x.share=+(100*x.marks/tot).toFixed(1);return x}).sort(function(a,b){return b.marks-a.marks});
};

/* ---------- TOPIC: tabs + one lesson at a time ---------- */
P.pages.topic=function(root,id,sub,arg){
  var m=P.manifest.topics.find(function(x){return x.id===id}),t=P.topics[id],S=P.load();
  if(!t){root.innerHTML='<div class="page"><div class="box"><h2>'+esc(m?m.name:id)+'</h2><p>This topic is not available.</p><a class="btn" href="#home">Back to the course map</a></div></div>';return}
  S.prefs.last="topic-"+id+(sub&&sub!=="pyqs"&&sub!=="test"&&sub!=="revise"?"/"+sub:"");P.save();P.curTopic=id;
  var idx=P.manifest.topics.indexOf(m),secs=t.sections,view=sub==="pyqs"||sub==="test"||sub==="revise"?sub:"learn";
  var cur=view==="learn"?(sub?secs.findIndex(function(x){return x.id===sub}):-1):-1;
  if(view==="learn"&&sub&&cur<0)cur=-1;
  if(cur>=0){S.read[id+":"+secs[cur].id]=1;P.save()}
  var st=P.topicStats(m),base="#topic-"+id;
  var wrap=el("div","topic");
  var tabs=[["learn","Lessons",base+(cur>=0?"/"+secs[cur].id:""),secs.length],["pyqs","PYQs",base+"/pyqs",t.pyqs.length],["test","Topic test",base+"/test",t.test.length],["revise","Revise",base+"/revise",null]];
  var head=el("header","t-head");
  var cq=[];secs.forEach(function(x){(x.quiz||[]).forEach(function(q){cq.push(q)})});
  var cok=cq.filter(function(q){return S.ans[q.id]&&S.ans[q.id].ok}).length;
  var words=0;secs.forEach(function(x){words+=JSON.stringify(x.blocks).replace(/<[^>]+>|\\[a-z]+|[{}\[\]":,]/g," ").split(/\s+/).length*0.55});
  var mins=Math.round(words/170+t.pyqs.length*4+t.test.length*1.5),dur=(mins>=60?Math.floor(mins/60)+" h ":"")+(mins%60)+" min";
  var firstUnread=secs.findIndex(function(x){return !S.read[id+":"+x.id]});
  var contHref=firstUnread<0?base+"/pyqs":base+"/"+secs[firstUnread].id,contLab=firstUnread<0?"Lessons done: practise":firstUnread===0?"Start lesson 1":"Continue with lesson "+(firstUnread+1);
  var R=38,C=2*Math.PI*R,state=stateOf(st);
  head.innerHTML='<nav class="crumb"><a href="#home">Course map</a><span>Topic '+(idx+1)+" of "+P.manifest.topics.length+'</span></nav>'
    +'<div class="t-top"><div class="t-main"><h1>'+esc(t.name)+'</h1><p class="tag-line">'+P.inline(t.tagline)+'</p>'
    +'<p class="t-facts"><span><b>'+secs.length+'</b> lessons</span><span><b>'+t.pyqs.length+'</b> past questions</span><span><b>'+st.marks+'</b> marks</span><span>about <b>'+dur+'</b></span></p>'
    +'<div class="t-cta"><a class="btn" href="'+contHref+'">'+contLab+'</a><a class="btn ghost" href="'+base+'/pyqs">Practise '+t.pyqs.length+' PYQs</a><a class="btn ghost" href="#cards" id="t-cards">Flashcards</a></div></div>'
    +'<aside class="t-ready '+state+'"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="'+R+'" class="tr"/>'+(st.pct?'<circle cx="50" cy="50" r="'+R+'" class="fg" stroke-dasharray="'+(C*st.pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 50 50)"/>':"")+'<text x="50" y="52" text-anchor="middle" class="pc">'+st.pct+'%</text><text x="50" y="68" text-anchor="middle" class="rd">ready</text></svg>'
    +'<dl><div><dt>Lessons read</dt><dd>'+st.read+"/"+st.secs+'</dd></div><div><dt>Checks right</dt><dd>'+cok+"/"+cq.length+'</dd></div><div><dt>PYQs solved</dt><dd>'+st.solved+"/"+st.pyqs+'</dd></div><div><dt>Topic test</dt><dd>'+((S.steps[id]||{}).test?Math.round(S.steps[id].test*100)+"%":"not taken")+"</dd></div></dl></aside></div>"
    +'<nav class="ttabs" aria-label="Topic sections">'+tabs.map(function(x){return '<a href="'+x[2]+'" class="'+(x[0]===view?"on":"")+'"'+(x[0]===view?' aria-current="page"':"")+">"+x[1]+(x[3]!=null?" <small>"+x[3]+"</small>":"")+"</a>"}).join("")+"</nav>";
  head.querySelector("#t-cards").onclick=function(){var S2=P.load();S2.prefs.cardTopic=id;P.save()};
  wrap.appendChild(head);
  var body=el("div","t-body "+view);wrap.appendChild(body);
  if(view==="learn"){
    var route=el("aside","route");
    var items=[["","Overview",-1]].concat(secs.map(function(x,i){return [x.id,x.title,i]}));
    route.innerHTML='<button class="route-hide" type="button" aria-expanded="true" aria-label="Hide the lesson list"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span>Hide lessons</span></button><button class="route-show" type="button" aria-label="Show the lesson list" title="Show lessons"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span>Lessons</span></button><button class="route-toggle" type="button" aria-expanded="false">'+(cur<0?"All lessons":"All lessons (you are on "+(cur+1)+" of "+secs.length+")")+'<span aria-hidden="true">▾</span></button><ol>'+items.map(function(x){var read=x[2]<0?true:!!S.read[id+":"+x[0]],on=x[2]===cur;
      return '<li class="'+(on?"frontier":read?"visited":"unvisited")+'"><a href="'+base+(x[0]?"/"+x[0]:"")+'"'+(on?' aria-current="page"':"")+'><span class="rn">'+(x[2]<0?"":x[2]+1)+"</span><span>"+esc(x[1])+"</span></a></li>"}).join("")
      +'<li class="after"><a href="'+base+'/pyqs"><span class="rn"></span><span>Then: practise the PYQs</span></a></li></ol>';
    var tg=route.querySelector(".route-toggle");tg.onclick=function(){var o=route.classList.toggle("open");tg.setAttribute("aria-expanded",o)};
    if(S.prefs.routemin)body.classList.add("routemin");
    function setRoute(min){body.classList.toggle("routemin",min);route.querySelector(".route-hide").setAttribute("aria-expanded",!min);S.prefs.routemin=min;P.save()}
    route.querySelector(".route-hide").onclick=function(){setRoute(true)};route.querySelector(".route-show").onclick=function(){setRoute(false)};
    body.appendChild(route);
    var art=el("article","lesson");body.appendChild(art);
    if(cur<0){
      art.innerHTML='<p class="kicker">Overview</p><h2>Before you start</h2><div class="lead prose">'+md(t.story)+"</div>";
      art.appendChild(bigPicture(t));
      var ol=el("ol","lesson-index");ol.innerHTML=secs.map(function(x,i){return '<li><a href="'+base+"/"+x.id+'"><span class="rn">'+(i+1)+"</span><span><b>"+esc(x.title)+"</b><small>"+P.inline(x.plain||"")+"</small></span></a></li>"}).join("");
      art.appendChild(el("h3","h3","The lessons"));art.appendChild(ol);
      art.appendChild(lessonNav(null,{href:base+"/"+secs[0].id,label:"Start lesson 1: "+secs[0].title}));
    } else {
      var sec=secs[cur];S.read[id+":"+sec.id]=1;P.save();
      art.innerHTML='<p class="kicker">Lesson '+(cur+1)+" of "+secs.length+"</p><h2>"+esc(sec.title)+"</h2>"
        +(sec.plain?'<p class="lead">'+P.inline(sec.plain)+"</p>":"")
        +(sec.studying?'<dl class="why2"><div><dt>What it is</dt><dd>'+P.inline(sec.studying)+"</dd></div><div><dt>Why it is on the exam</dt><dd>"+P.inline(sec.why)+"</dd></div></dl>":"");
      art.appendChild(P.blocks(sec.blocks));
      if(sec.remember)art.appendChild(el("div","rem","<h4>Remember</h4><ul>"+sec.remember.map(function(r){return "<li>"+P.inline(r)+"</li>"}).join("")+"</ul>"));
      if(sec.quiz&&sec.quiz.length){art.appendChild(el("h3","h3","Check yourself"));sec.quiz.forEach(function(q){q.topicId=id;art.appendChild(P.qcard(q))})}
      var prev=cur>0?{href:base+"/"+secs[cur-1].id,label:secs[cur-1].title}:{href:base,label:"Overview"};
      var next=cur<secs.length-1?{href:base+"/"+secs[cur+1].id,label:"Next: "+secs[cur+1].title}:{href:base+"/pyqs",label:"Next: practise the "+t.pyqs.length+" PYQs"};
      art.appendChild(lessonNav(prev,next));
    }
  } else {
    var pane=el("div","pane");body.appendChild(pane);
    if(view==="pyqs")buildPyqs(pane,t,arg);
    if(view==="test")buildTest(pane,t,m);
    if(view==="revise"){buildRemember(pane,t);buildCheat(pane,t,m)}
    var idx2=P.manifest.topics[idx+1];
    if(view!=="pyqs"||true){var nv=el("nav","lnav");nv.innerHTML=(view==="pyqs"?'<a class="btn ghost" href="'+base+'/'+secs[secs.length-1].id+'">Back to the lessons</a><a class="btn" href="'+base+'/test">Next: topic test</a>':view==="test"?'<a class="btn ghost" href="'+base+'/pyqs">Back to the PYQs</a><a class="btn" href="'+base+'/revise">Next: revise</a>':'<a class="btn ghost" href="'+base+'/test">Back to the test</a>'+(idx2?'<a class="btn" href="#topic-'+idx2.id+'">Next topic: '+esc(idx2.short)+"</a>":'<a class="btn" href="#mock">Sit a mock exam</a>'));pane.appendChild(nv)}
  }
  root.innerHTML="";root.appendChild(wrap);P.math(wrap);
  P.openSection=function(k){if(k==="pyqs"||k==="test")location.hash=base+"/"+k;else if(k==="remember"||k==="cheat")location.hash=base+"/revise";else location.hash=base+"/"+k};
};
function lessonNav(prev,next){var n=el("nav","lnav");n.innerHTML=(prev?'<a class="btn ghost" href="'+prev.href+'"><span class="dir">Previous</span>'+esc(prev.label)+"</a>":"<span></span>")+(next?'<a class="btn" href="'+next.href+'">'+esc(next.label)+"</a>":"");return n}
/* ---------- PYQ section ---------- */
function buildPyqs(sp,t,focus){
  var S=P.load(),papers=[],types={};
  t.pyqs.forEach(function(q){if(papers.indexOf(q.exam)<0)papers.push(q.exam);types[q.type]=1});
  sp.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Past questions</h2><p class="sub">Try each question before opening the solution. Hint 1 tells you what to look for; hint 2 gives your first move.</p>');
  var pm=el("div",null,'<h3 class="h3">Question patterns and your first move</h3><div class="patterns">'+t.patterns.map(function(p){return '<div class="pat"><b>'+esc(p.name)+'</b><span>'+P.inline(p.first)+'</span><small>'+p.ids.length+" PYQs</small></div>"}).join("")+"</div>");sp.appendChild(pm);
  var f=el("div","filters");
  f.innerHTML='<label>Paper <select id="f-paper"><option value="">All</option>'+papers.map(function(p){return "<option>"+esc(p)+"</option>"}).join("")+'</select></label><label>Type <select id="f-type"><option value="">All</option>'+Object.keys(types).map(function(p){return "<option>"+p+"</option>"}).join("")+'</select></label><label class="chk"><input type="checkbox" id="f-hide"> Hide solved</label><span id="f-count" style="color:var(--mute);font-size:.86rem"></span>';
  sp.appendChild(f);
  var groups=el("div");sp.appendChild(groups);
  var ideas=P.ideaStats(t).map(function(x){return x.idea});
  function filt(q){var fp=$("#f-paper",f).value,ft=$("#f-type",f).value,fh=$("#f-hide",f).checked;return (!fp||q.exam===fp)&&(!ft||q.type===ft)&&!(fh&&S.ans[q.id]&&S.ans[q.id].ok)}
  var dets=[];
  function fillGroup(d,idea){
    var box=d.querySelector(".gb");box.innerHTML="";var list=t.pyqs.filter(function(q){return q.idea===idea&&filt(q)});
    if(!list.length)box.innerHTML='<p style="color:var(--mute)">No questions match the filters.</p>';
    list.forEach(function(q){q.topicId=t.id;var c=P.qcard(q,{onDone:function(){updCount()}});c.id="q-"+q.id;box.appendChild(c)});
  }
  function updCount(){var n=t.pyqs.filter(filt).length,s=t.pyqs.filter(function(q){return S.ans[q.id]&&S.ans[q.id].ok}).length;$("#f-count",f).textContent=n+" shown · "+s+" of "+t.pyqs.length+" solved"}
  ideas.forEach(function(idea,gi){
    var qs=t.pyqs.filter(function(q){return q.idea===idea}),marks=qs.reduce(function(a,q){return a+q.marks},0);
    var d=el("details");var fq=focus&&t.pyqs.find(function(q){return q.id===focus});d.open=fq?fq.idea===idea:gi===0;
    d.className="pgroup";d.innerHTML='<summary><span>'+esc(idea)+'</span><small>'+qs.length+" PYQs, "+marks+" marks</small></summary><div class='gb'></div>";
    d._idea=idea;d._filled=false;
    d.addEventListener("toggle",function(){if(d.open&&!d._filled){d._filled=true;fillGroup(d,idea)}});
    groups.appendChild(d);dets.push(d);
    if(d.open){d._filled=true;fillGroup(d,idea)}
  });
  [$("#f-paper",f),$("#f-type",f),$("#f-hide",f)].forEach(function(c){c.onchange=function(){dets.forEach(function(d){if(d._filled)fillGroup(d,d._idea)});updCount()}});
  updCount();
  if(focus)setTimeout(function(){var c=document.getElementById("q-"+focus);if(c){c.scrollIntoView({block:"start"});c.classList.add("flash")}},80);
  if(t.practice&&t.practice.length){
    sp.appendChild(el("div","prose",'<h4 style="margin-top:28px">Practice variations <span class="tag" style="display:inline">[ADDED]</span></h4><p>These are not PYQs. They are exam-style questions made by changing the numbers or the twist of a PYQ, so you can check that you learned the method and not the answer.</p>'));
    t.practice.forEach(function(q){q.topicId=t.id;q.tag="ADDED";sp.appendChild(P.qcard(q))});
  }
}
function buildRemember(sr,t){
  var r=t.remember;
  sr.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Revise</h2><p class="sub">Everything to remember from this topic, on one page.</p>');
  sr.appendChild(el("div","rem","<h4>Core facts</h4><ul>"+r.facts.map(function(x){return "<li>"+P.inline(x)+"</li>"}).join("")+"</ul>"));
  sr.appendChild(el("div",null,'<div class="prose"><h4>Formulas and complexities, with their conditions</h4></div>'+P.tableHTML(["Fact","Formula / value","Condition"],t.formulas.map(function(f){return [f.name,"$"+f.tex+"$",f.cond||""]}))));
  sr.appendChild(el("div",null,'<div class="prose"><h4>Trigger cues: wording → first move</h4></div>'+P.tableHTML(["If the question says…","First move"],r.triggers)));
  sr.appendChild(el("div",null,'<div class="prose"><h4>Exam moves: question type → fast method → time → sanity check</h4></div>'+P.tableHTML(["Question type","Fast method","Time","Sanity check"],r.moves)));
  sr.appendChild(el("div","co warn",'<div class="ic">!</div><div><div class="ti">Traps</div><div class="bd prose"><ul>'+r.traps.map(function(x){return "<li>"+P.inline(x)+"</li>"}).join("")+"</ul></div></div>"));
  sr.appendChild(el("div","co analogy",'<div class="ic">≈</div><div><div class="ti">Memory hooks</div><div class="bd prose"><ul>'+r.hooks.map(function(x){return "<li>"+P.inline(x)+"</li>"}).join("")+"</ul></div></div>"));
  var S=P.load(),stp=S.steps[t.id]=S.steps[t.id]||{};stp.revise=1;P.save();
  P.math(sr);
}
function buildTest(sec,t,m){
  var S=P.load();
  sec.insertAdjacentHTML("beforeend",'<h2 class="pane-h">Topic test</h2><p class="sub">'+t.test.length+" mixed questions from the whole topic. Answer them all, then submit to see your score and the ideas to revisit.</p>");
  var cards=[],box=el("div");sec.appendChild(box);
  t.test.forEach(function(q,i){q.topicId=t.id;var c=P.qcard(q,{mock:true});cards.push(c);box.appendChild(c)});
  var sub=el("button","btn","Submit test");sub.type="button";var out=el("div");sec.appendChild(sub);sec.appendChild(out);
  sub.onclick=function(){
    if(cards.some(function(c){return !c.hasResp()})&&!sub.dataset.force){sub.dataset.force=1;sub.textContent="Some are unanswered. Click again to submit anyway";return}
    sub.disabled=true;var ok=0,weak={};
    cards.forEach(function(c,i){var q=t.test[i],before=c.hasResp();c.grade();var good=P.check(q,c.getResp());if(good)ok++;else{weak[q.concept]=(weak[q.concept]||0)+1}});
    var stp=S.steps[t.id]=S.steps[t.id]||{};stp.test=Math.max(stp.test||0,ok/t.test.length||0.001);P.save();
    var w=Object.keys(weak);
    out.innerHTML='<div class="box" style="margin-top:16px"><h3>Score: '+ok+" / "+t.test.length+"</h3>"+(w.length?"<p><b>Weak concepts to revisit:</b></p><ul>"+w.map(function(k){var q=t.test.find(function(x){return x.concept===k});return '<li>'+esc(k)+(q.sec?' → <a href="#" data-s="'+q.sec+'">open the section</a>':"")+"</li>"}).join("")+"</ul>":"<p>No weak concepts. Move on to the next topic.</p>")+"</div>";
    $$("[data-s]",out).forEach(function(a){a.onclick=function(e){e.preventDefault();P.openSection(a.dataset.s)}});
  };
  var cl=el("div","box");cl.style.marginTop="18px";
  var stp=S.steps[t.id]=S.steps[t.id]||{};stp.checks=stp.checks||{};
  cl.innerHTML="<h3 style='font-size:1.1rem'>Checklist: can you do each of these without help?</h3>"+t.checklist.map(function(c,i){return '<label class="chk" style="margin:6px 0;align-items:flex-start"><input type="checkbox" data-i="'+i+'" '+(stp.checks[i]?"checked":"")+"> <span>"+P.inline(c)+"</span></label>"}).join("");
  sec.appendChild(cl);
  $$("input",cl).forEach(function(c){c.onchange=function(){stp.checks[c.dataset.i]=c.checked?1:0;stp.check=$$("input",cl).every(function(x){return x.checked})?1:0;P.save()}});
  P.math(sec);
}
function buildCheat(sc,t,m){
  var g=P.ideaStats(t),tot=t.pyqs.reduce(function(a,q){return a+q.marks},0);
  sc.insertAdjacentHTML("beforeend",'<h3 class="h3">Where the marks are</h3>');
  sc.appendChild(el("div",null,'<div class="prose"><h4>Ideas ranked by marks</h4></div>'+P.tableHTML(["Idea","PYQs","Marks","Share","Types","Papers","Learn it"],g.map(function(x){return [x.idea,String(x.n),String(x.marks),x.share+"%",Object.keys(x.types).join(", "),String(Object.keys(x.papers).length),'<a href="#" data-s="'+x.sec+'">section</a>']}))));
  var byPaper={},byType={};t.pyqs.forEach(function(q){byPaper[q.exam]=(byPaper[q.exam]||0)+q.marks;byType[q.type]=(byType[q.type]||0)+q.marks});
  sc.appendChild(el("div","grid g2",'<div>'+'<div class="prose"><h4>Marks by paper</h4></div>'+P.tableHTML(["Paper","Marks"],Object.keys(byPaper).map(function(k){return [k,String(byPaper[k])]}))+"</div><div>"+'<div class="prose"><h4>Marks by question type</h4></div>'+P.tableHTML(["Type","Marks"],Object.keys(byType).map(function(k){return [k,String(byType[k])]}))+"</div>"));
  var nums=t.pyqs.filter(function(q){return P.isNum(q)});
  if(nums.length)sc.appendChild(el("div",null,'<div class="prose"><h4>Numeric answers that appeared</h4></div>'+P.tableHTML(["Paper","Id","Answer"],nums.map(function(q){return [q.exam,q.id,String(q.num.ans)]}))));
  var idx=el("div");idx.innerHTML='<div class="prose"><h4>Every PYQ grouped by idea</h4></div>'+g.map(function(x){return "<p><b>"+esc(x.idea)+"</b><br>"+t.pyqs.filter(function(q){return q.idea===x.idea}).map(function(q){return '<a href="#" data-q="'+q.id+'">'+esc(q.exam)+" Q"+esc(q.qno)+"</a>"}).join(" · ")+"</p>"}).join("");
  sc.appendChild(idx);
  var one=el("div");one.innerHTML='<div class="prose"><h4>One-page summary</h4></div>';one.appendChild(P.blocks(t.cheat));sc.appendChild(one);
  var cp=el("button","btn ghost","Copy the summary as text");cp.type="button";cp.onclick=function(){var txt=t.name+"\n\n"+t.remember.facts.map(function(x){return "- "+P.plain(x)}).join("\n")+"\n\nFormulas:\n"+t.formulas.map(function(f){return "- "+f.name+": "+f.tex+(f.cond?" ("+f.cond+")":"")}).join("\n")+"\n\nTraps:\n"+t.remember.traps.map(function(x){return "- "+P.plain(x)}).join("\n");try{navigator.clipboard.writeText(txt).then(function(){P.toast("Copied")},function(){P.toast("Copy blocked here")})}catch(e){P.toast("Copy blocked here")}};
  sc.appendChild(cp);
  $$("[data-s]",sc).forEach(function(a){a.onclick=function(e){e.preventDefault();P.openSection(a.dataset.s)}});
  $$("[data-q]",sc).forEach(function(a){a.onclick=function(e){e.preventDefault();location.hash="#topic-"+t.id+"/pyqs/"+a.dataset.q}});
  P.math(sc);
}
})();
