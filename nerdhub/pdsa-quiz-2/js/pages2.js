/* PDSA pages: study tools */
(function(){
var P=window.PDSA,esc=P.esc,el=P.el,md=P.md,$=P.$,$$=P.$$;
function ready(){return P.manifest.topics.filter(function(m){return P.topics[m.id]})}
P.buildIndex=function(){
  var ix={};
  ready().forEach(function(m){var t=P.topics[m.id];
    t.pyqs.forEach(function(q){q.pyq=true;q.topicId=t.id;ix[q.id]=q});
    (t.practice||[]).forEach(function(q){q.topicId=t.id;ix[q.id]=q});
    (t.test||[]).forEach(function(q){q.topicId=t.id;ix[q.id]=q});
    (t.prereqs||[]).concat(t.sections).forEach(function(s){(s.quiz||[]).forEach(function(q){q.topicId=t.id;ix[q.id]=q})});
  });
  P.qIndex=ix;
};
function wrap(root,title,sub){var p=el("div","page");p.innerHTML='<h1 style="font-size:1.9rem">'+esc(title)+'</h1><p class="sub">'+sub+"</p>";root.innerHTML="";root.appendChild(p);return p}
function none(p){p.appendChild(el("div","box","<p>No topics are built yet.</p>"))}

/* ---------- flashcards ---------- */
P.pages.cards=function(root){
  var p=wrap(root,"Flashcards","Answer in your head first, then flip. Cards you miss come back soon; cards you know come back later.");
  var S=P.load(),all=[];
  ready().forEach(function(m){(P.topics[m.id].flash||[]).forEach(function(c){c.topic=m.id;all.push(c)})});
  if(!all.length)return none(p);
  var INT=[10*60e3,864e5,3*864e5,7*864e5,16*864e5],kinds={concept:"Idea",idea:"Idea",formula:"Formula",trap:"Trap",trigger:"Wording to first move",move:"Exam move"};
  var ft=S.prefs.cardTopic||"",fk="";S.prefs.cardTopic="";P.save();
  var bar=el("div","chips");p.appendChild(bar);
  var kbar=el("div","chips small");p.appendChild(kbar);
  var stats=el("p","cstats");p.appendChild(stats);
  var area=el("div");p.appendChild(area);
  var kset={};all.forEach(function(c){kset[kinds[c.kind]||c.kind]=1});
  function chips(){
    bar.innerHTML=[["","All topics"]].concat(ready().map(function(m){return [m.id,m.short]})).map(function(x){return '<button type="button" class="chip'+(x[0]===ft?" on":"")+'" data-t="'+x[0]+'" aria-pressed="'+(x[0]===ft)+'">'+esc(x[1])+"</button>"}).join("");
    kbar.innerHTML=[""].concat(Object.keys(kset)).map(function(k){return '<button type="button" class="chip'+(k===fk?" on":"")+'" data-k="'+esc(k)+'" aria-pressed="'+(k===fk)+'">'+(k?esc(k):"Every kind")+"</button>"}).join("");
    $$("[data-t]",bar).forEach(function(b){b.onclick=function(){ft=b.dataset.t;start()}});
    $$("[data-k]",kbar).forEach(function(b){b.onclick=function(){fk=b.dataset.k;start()}});
  }
  function pool(){return all.filter(function(c){return (!ft||c.topic===ft)&&(!fk||(kinds[c.kind]||c.kind)===fk)})}
  function counts(){var now=Date.now(),pl=pool(),n=0,d=0,w=0;pl.forEach(function(c){var r=S.flash[c.id];if(!r)n++;else{if(r.due<=now)d++;if(r.box>=3)w++}});
    stats.innerHTML="<span><b>"+pl.length+"</b> cards</span><span><b>"+n+"</b> new</span><span><b>"+d+"</b> due</span><span><b>"+w+"</b> well known</span>"}
  function queue(){var now=Date.now();return pool().filter(function(c){var r=S.flash[c.id];return !r||r.due<=now}).sort(function(a,b){var ra=S.flash[a.id],rb=S.flash[b.id];return (ra?ra.due:0)-(rb?rb.due:0)}).slice(0,20)}
  var q=[],i=0,flipped=false;
  function start(){chips();counts();q=queue();i=0;flipped=false;draw()}
  function rate(x){var c=q[i],rr=S.flash[c.id]||{box:0},bx=x===0?0:x===1?rr.box:Math.min(4,rr.box+1);S.flash[c.id]={box:bx,due:Date.now()+INT[bx]/(x===1?2:1)};P.save();flipped=false;i++;counts();draw()}
  function draw(){
    area.innerHTML="";
    if(i>=q.length){area.innerHTML='<div class="box fdone"><h3>'+(q.length?"Session finished":"Nothing is due right now")+'</h3><p>Come back later, or pick another topic above.</p><button class="btn ghost" id="again" type="button">Check again</button></div>';$("#again",area).onclick=start;return}
    var c=q[i],r=S.flash[c.id];
    var card=el("div","fcard"+(flipped?" back":""),'<p class="fmeta"><b>'+esc(kinds[c.kind]||c.kind)+"</b><span>"+esc(P.topics[c.topic].name)+"</span><span>"+(i+1)+" of "+q.length+'</span></p><div class="prose ffront">'+md(c.front)+"</div>"+(flipped?'<div class="prose fback">'+md(c.back)+"</div>":""));
    card.tabIndex=0;card.setAttribute("role","button");card.setAttribute("aria-label",flipped?"Card answer":"Show the answer");
    area.appendChild(card);P.math(card);card.onclick=function(){if(!flipped){flipped=true;draw()}};
    var b=el("div","fbtns");
    if(!flipped){var sb=el("button","btn","Show answer <kbd>Space</kbd>");sb.type="button";sb.onclick=function(){flipped=true;draw()};b.appendChild(sb)}
    else [["Missed it","←",0,"bad"],["Almost","↓",1,"ghost"],["Got it","→",2,""]].forEach(function(x){var bt=el("button","btn "+x[3],x[0]+" <kbd>"+x[1]+"</kbd>");bt.type="button";bt.onclick=function(){rate(x[2])};b.appendChild(bt)});
    area.appendChild(b);
  }
  function key(e){if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$(".sr")||i>=q.length)return;
    if(e.key===" "&&!flipped){e.preventDefault();flipped=true;draw()}
    else if(flipped&&(e.key==="ArrowLeft"||e.key==="ArrowDown"||e.key==="ArrowRight")){e.preventDefault();rate(e.key==="ArrowLeft"?0:e.key==="ArrowDown"?1:2)}}
  document.addEventListener("keydown",key);P.cleanup=function(){document.removeEventListener("keydown",key)};
  start();
};

/* ---------- study plan ---------- */
function rawTable(head,rows){return "<div class='tw'><table><thead><tr>"+head.map(function(h){return "<th>"+esc(h)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return "<tr>"+r.map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>"}
function planHref(s){return s.h+"/"+(s.s==="remember"?"revise":s.s)}
P.pages.plan=function(root){
  var p=wrap(root,"Study plan","Pick how much time you have. The plan spends it by marks and by how much each topic needs.");
  var R=ready();if(!R.length)return none(p);
  var opts=[["1 hour",60],["Half a day",240],["1 day",480],["1 week",7*180]],cur=0,tabs=el("div","tabs");
  opts.forEach(function(o,i){var b=el("button",i===0?"on":"",o[0]);b.type="button";b.onclick=function(){cur=i;$$("button",tabs).forEach(function(x,k){x.classList.toggle("on",k===i)});draw()};tabs.appendChild(b)});
  p.appendChild(tabs);var area=el("div");p.appendChild(area);
  function draw(){
    var budget=opts[cur][1],tm=R.reduce(function(a,m){return a+m.marks},0),steps=[];
    function mins(x){return Math.max(2,Math.round(x))}
    R.forEach(function(m){
      var t=P.topics[m.id],share=m.marks/tm,b=budget*share*(cur===3?5/7:0.92);
      var learn=(t.prereqs||[]).concat(t.sections).reduce(function(a,s){return a+P.readMins(s.blocks)},0);
      var L=Math.min(learn,b*0.4),Pq=b*0.4,Tt=Math.min(10,b*0.12),Rv=Math.min(8,b*0.1);
      if(budget<=60){steps.push({t:m.name+": read 'Things to remember', then try the 3 biggest PYQ groups",m:mins(b),h:"#topic-"+m.id,s:"remember"});return}
      steps.push({t:m.name+": learn the ideas"+(L<learn?" (the biggest sections first)":""),m:mins(L),h:"#topic-"+m.id,s:t.sections[0].id});
      steps.push({t:m.name+": solve PYQs yourself, hints first, about "+Math.max(3,Math.round(Pq/3))+" questions",m:mins(Pq),h:"#topic-"+m.id,s:"pyqs"});
      steps.push({t:m.name+": topic test",m:mins(Tt),h:"#topic-"+m.id,s:"test"});
      steps.push({t:m.name+": revise with the one-page sheet",m:mins(Rv),h:"#topic-"+m.id,s:"remember"});
    });
    var h="<div class='box'><b>"+opts[cur][0]+"</b> · "+steps.reduce(function(a,s){return a+s.m},0)+" minutes planned</div>";
    if(cur===3){
      var days=["Day 1","Day 2","Day 3","Day 4","Day 5"];h+="";
      var perDay=R.map(function(m,i){return steps.slice(i*4,i*4+4)});
      h+=perDay.map(function(d,i){return "<h3 style='margin:18px 0 6px;font-size:1.1rem'>Day "+(i+1)+": "+esc(R[i].short)+"</h3>"+rawTable(["Step","Minutes"],d.map(function(s){return ['<a href="'+planHref(s)+'">'+esc(s.t)+"</a>",String(s.m)]}))}).join("");
      h+="<h3 style='margin:18px 0 6px;font-size:1.1rem'>Day 6: mixed practice</h3>"+rawTable(["Step","Minutes"],[['<a href="#mock">Mock exam on all topics</a>',"90"],['<a href="#mistakes">Review every mistake</a>',"45"],['<a href="#cards">Flashcards</a>',"30"]]);
      h+="<h3 style='margin:18px 0 6px;font-size:1.1rem'>Day 7: light revision</h3>"+rawTable(["Step","Minutes"],[['<a href="#sheet">Read the last-night sheet</a>',"40"],['<a href="#practice">Practice, only your weak spots</a>',"60"],["Rest. Sleep matters more than one more question.","-"]]);
    }else{
      h+=rawTable(["Step","Minutes"],steps.map(function(s){return ['<a href="'+planHref(s)+'">'+esc(s.t)+"</a>",String(s.m)]}));
      h+="<p style='color:var(--mute);font-size:.9rem'>Topics get time in proportion to their marks. If you finish early, use <a href='#practice'>Practice</a>.</p>";
    }
    area.innerHTML=h;
  }
  draw();
};

/* ---------- mock ---------- */
P.pages.mock=function(root){
  var p=wrap(root,"Mock exam","Pick topics, how many questions and how many minutes. The test submits itself when time is up.");
  var R=ready();if(!R.length)return none(p);
  var cfg=el("div","box");
  cfg.innerHTML='<b>Topics</b><div style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0 12px">'+R.map(function(m){return '<label class="chk"><input type="checkbox" class="mt" value="'+m.id+'" checked> '+esc(m.short)+"</label>"}).join("")+'</div><label>Questions <input type="number" id="mn" class="field" value="15" min="3" max="60" style="width:80px"></label> &nbsp; <label>Minutes <input type="number" id="mm" class="field" value="40" min="5" max="240" style="width:80px"></label> &nbsp; <label class="chk" style="display:inline-flex"><input type="checkbox" id="mq"> include concept quiz questions</label><p style="margin:12px 0 0"><button class="btn" id="mgo">Start the test</button></p>';
  p.appendChild(cfg);var area=el("div");p.appendChild(area);
  $("#mgo",cfg).onclick=function(){
    var sel=$$(".mt",cfg).filter(function(c){return c.checked}).map(function(c){return c.value}),n=+$("#mn",cfg).value,mins=+$("#mm",cfg).value,inc=$("#mq",cfg).checked;
    var pool=[];Object.keys(P.qIndex).forEach(function(k){var q=P.qIndex[k];if(sel.indexOf(q.topicId)<0)return;if(q.pyq||inc&&q.concept&&!q.id.match(/-t\d+$/))pool.push(q)});
    if(!pool.length){P.toast("Pick at least one topic");return}
    pool.sort(function(){return Math.random()-.5});var qs=pool.slice(0,Math.min(n,pool.length));
    cfg.classList.add("hidden");area.innerHTML="";
    var total=mins*60,left=total,tm=el("div","timer","");area.appendChild(tm);
    var cards=[],box=el("div");area.appendChild(box);
    qs.forEach(function(q,i){var c=P.qcard(q,{mock:true});c.dataset.n=i+1;box.appendChild(c);cards.push(c)});
    var sub=el("button","btn","Submit the test");sub.type="button";area.appendChild(sub);var out=el("div");area.appendChild(out);
    function fmt(s){return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
    var iv=setInterval(function(){left--;tm.textContent=fmt(Math.max(0,left));if(left<=0){finish(true)}},1000);tm.textContent=fmt(left);
    function finish(auto){
      clearInterval(iv);sub.disabled=true;tm.remove();var by={},ok=0,mk=0,mt=0;
      cards.forEach(function(c,i){var q=qs[i];c.grade();var g=P.check(q,c.getResp());var b=by[q.topicId]=by[q.topicId]||{n:0,ok:0,m:0,t:0};b.n++;b.t+=q.marks||0;mt+=q.marks||0;if(g){b.ok++;b.m+=q.marks||0;ok++;mk+=q.marks||0}});
      out.innerHTML='<div class="box" style="margin:18px 0"><h2 style="font-size:1.5rem">'+(auto?"Time is up. ":"")+"Score: "+ok+" / "+qs.length+" questions · "+mk+" / "+mt+" marks</h2>"+P.tableHTML(["Topic","Correct","Marks"],Object.keys(by).map(function(k){return [P.topics[k].name,by[k].ok+" / "+by[k].n,by[k].m+" / "+by[k].t]}))+"<p>Every wrong answer is now in <a href='#mistakes'>Mistake review</a>. Scroll up to read each solution.</p></div>";
      out.scrollIntoView();
    }
    sub.onclick=function(){finish(false)};
    P.cleanup=function(){clearInterval(iv)};
  };
};

/* ---------- adaptive practice ---------- */
P.pages.practice=function(root){
  var p=wrap(root,"Practice","The next question is chosen by marks at stake and by what you missed, felt unsure about or never tried.");
  var R=ready();if(!R.length)return none(p);
  var S=P.load(),area=el("div");p.appendChild(area);var lastId=null;
  function weight(q){var a=S.ans[q.id],w=(q.marks||3)*(q.pyq?1.2:0.8);
    if(!a)w*=1.6;else if(!a.ok)w*=3.2;else if(a.conf&&a.conf!=="Sure"&&a.conf!=="none")w*=2;else w*=0.25;
    if(a&&Date.now()-a.t<10*60e3)w*=0.05;if(q.id===lastId)w=0;return w}
  function why(q){var a=S.ans[q.id];if(!a)return "You have not tried this one yet.";if(!a.ok)return "You missed this before.";if(a.conf&&a.conf!=="Sure"&&a.conf!=="none")return "You got it right but were not sure.";return "A refresher: you solved it, but it is worth marks."}
  function next(){
    var ids=Object.keys(P.qIndex),ws=ids.map(function(k){return weight(P.qIndex[k])}),sum=ws.reduce(function(a,b){return a+b},0);
    if(sum<=0){area.innerHTML='<div class="box">You have worked through everything. Try a <a href="#mock">timed mock</a>.</div>';return}
    var r=Math.random()*sum,i=0;while(r>ws[i]){r-=ws[i];i++}
    var q=P.qIndex[ids[i]];lastId=q.id;area.innerHTML="";
    area.appendChild(el("div",null,'<p style="color:var(--mute);font-size:.9rem">'+esc(P.topics[q.topicId].name)+" · "+why(q)+"</p>"));
    var c=P.qcard(q,{onDone:function(){var b=el("button","btn","Next question");b.type="button";b.onclick=next;area.appendChild(b)}});area.appendChild(c);
  }
  next();
};

/* ---------- mistakes ---------- */
P.pages.mistakes=function(root){
  var p=wrap(root,"Mistakes","Everything you missed or got right without being sure. Retry until each one is secure.");
  var S=P.load(),A=S.ans,ids=Object.keys(A).filter(function(k){return P.qIndex[k]});
  var danger=[],missed=[],shaky=[];
  ids.forEach(function(k){var a=A[k];if(!a.ok&&a.conf==="Sure")danger.push(k);else if(!a.ok)missed.push(k);else if(a.conf==="Unsure"||a.conf==="Guess")shaky.push(k)});
  if(!danger.length&&!missed.length&&!shaky.length){p.appendChild(el("div","box","<p>Nothing to review yet. Answer some questions and anything you miss will appear here.</p>"));return}
  [["Dangerous misconceptions (wrong but sure)",danger],["Missed",missed],["Right, but not yet secure",shaky]].forEach(function(g){
    if(!g[1].length)return;p.appendChild(el("h2","h2",esc(g[0])+' <span class="pill">'+g[1].length+"</span>"));
    g[1].forEach(function(k){var q=P.qIndex[k];p.appendChild(P.qcard(q,{showPrev:false}))});
  });
};

/* ---------- glossary ---------- */
P.pages.glossary=function(root){
  var p=wrap(root,"Glossary","Every technical term in plain words. Terms in the notes show these on hover or tap.");
  var f=el("div","filters",'<input type="text" id="gs" placeholder="Search terms" aria-label="Search terms" style="width:min(380px,100%)">');p.appendChild(f);var l=el("div","grid");p.appendChild(l);
  function draw(){var q=$("#gs",f).value.toLowerCase();l.innerHTML="";P.glossary.slice().sort(function(a,b){return a.term.localeCompare(b.term)}).filter(function(g){return !q||g.term.toLowerCase().indexOf(q)>=0||g.def.toLowerCase().indexOf(q)>=0}).forEach(function(g){var b=el("div","box","<b>"+esc(g.term)+"</b><div class='prose'>"+md(g.def)+"</div>");l.appendChild(b);P.math(b)})}
  $("#gs",f).oninput=draw;draw();
};

/* ---------- refreshers ---------- */
P.pages.refresh=function(root,which){
  var p=wrap(root,"Refreshers","The small ideas every topic quietly uses. Each has a worked mini-example and a mini-quiz.");
  var nav=el("div","filters");nav.innerHTML=P.refreshers.map(function(r){return '<a class="btn sm ghost" href="#" data-r="'+r.id+'">'+esc(r.title)+"</a>"}).join("");p.appendChild(nav);
  P.refreshers.forEach(function(r){
    var s=el("section","sec");s.id="rf-"+r.id;s.innerHTML='<div class="sechead"><h2>'+esc(r.title)+"</h2></div>";
    s.appendChild(P.blocks(r.blocks));if(r.quiz&&r.quiz.length){s.appendChild(el("div","prose","<h4>Mini quiz</h4>"));r.quiz.forEach(function(q){s.appendChild(P.qcard(q,{noHints:true}))})}
    p.appendChild(s);
  });
  $$("[data-r]",nav).forEach(function(a){a.onclick=function(e){e.preventDefault();document.getElementById("rf-"+a.dataset.r).scrollIntoView()}});
  if(which){var s=document.getElementById("rf-"+which);if(s)setTimeout(function(){s.scrollIntoView()},50)}
};

/* ---------- last-night sheet ---------- */
P.pages.sheet=function(root){
  var p=wrap(root,"Last-night sheet","Every topic on one page. Copy it, or open this page in a normal browser tab to print it.");
  var R=ready();if(!R.length)return none(p);var txt=[];
  R.forEach(function(m){var t=P.topics[m.id],b=el("div","box");b.style.margin="14px 0";b.style.borderLeft="6px solid "+m.accent;
    b.innerHTML="<h2 style='font-size:1.3rem;margin-bottom:6px'>"+esc(t.name)+"</h2><div class='prose'><ul>"+t.remember.facts.map(function(x){return "<li>"+P.inline(x)+"</li>"}).join("")+"</ul></div>"+P.tableHTML(["Formula","Value","Condition"],t.formulas.map(function(f){return [f.name,"$"+f.tex+"$",f.cond||""]}))+"<div class='prose'><p><b>Traps:</b></p><ul>"+t.remember.traps.map(function(x){return "<li>"+P.inline(x)+"</li>"}).join("")+"</ul></div>";
    p.appendChild(b);P.math(b);txt.push(t.name+"\n"+t.remember.facts.map(function(x){return "- "+P.plain(x)}).join("\n")+"\nTraps:\n"+t.remember.traps.map(function(x){return "- "+P.plain(x)}).join("\n"))});
  var c=el("button","btn","Copy all as text");c.type="button";c.onclick=function(){try{navigator.clipboard.writeText(txt.join("\n\n")).then(function(){P.toast("Copied")},function(){P.toast("Copy blocked here")})}catch(e){P.toast("Copy blocked here")}};p.appendChild(c);
};
})();
