/* PDSA app shell: router, nav, search, drawers */
(function(){
var P=window.PDSA,esc=P.esc,el=P.el,$=P.$,$$=P.$$;
var ICON={
 map:'<circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M7.3 6h9.4M6.2 8.1l4.6 7.8M17.8 8.1l-4.6 7.8"/>',
 practice:'<path d="M4 12.5l5 5L20 6.5"/>',
 mock:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 1.6M10 2.8h4"/>',
 cards:'<rect x="3.5" y="6" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v12"/>',
 mistakes:'<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.3v.2"/>',
 plan:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 sheet:'<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
 glossary:'<path d="M5 4.5h10a4 4 0 0 1 4 4v11H9a4 4 0 0 1-4-4z"/><path d="M9 9h6"/>',
 refresh:'<path d="M5 12a7 7 0 0 1 12-5l2 2M19 12a7 7 0 0 1-12 5l-2-2"/><path d="M19 4.5V9h-4.5M5 19.5V15h4.5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
 more:'<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
 f:'<path d="M14.5 4.5c-2.5-.6-4 .6-4.4 3L8.6 18c-.4 2.4-1.9 3.4-4.1 2.8M7 10h8"/>'
};
function ico(n){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+ICON[n]+"</svg>"}
P.ico=ico;
var NAV=[["home","Course map","map","All five topics and your progress"],["practice","Practice","practice","Questions picked from your weak spots"],["mock","Mock exam","mock","A timed paper that marks itself"],["cards","Flashcards","cards","Quick recall of ideas, formulas and traps"],["mistakes","Mistakes","mistakes","Wrong answers and guesses, to redo"]];
var NAV2=[["plan","Study plan","plan","1 hour, half a day, a day or a week"],["sheet","Last-night sheet","sheet","All formulas and traps on one page"],["glossary","Glossary","glossary","Every term in plain words"],["refresh","Refreshers","refresh","Logs, sums and Python basics"]];
var LOGO='<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 9L24 9M8 9L16 23M24 9L16 23" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="9" r="4.2" fill="var(--visited)"/><circle cx="24" cy="9" r="4.2" fill="var(--visited)"/><circle cx="16" cy="23" r="4.2" fill="var(--frontier)"/></svg>';
function link(n,cls){return '<a href="#'+n[0]+'" data-n="'+n[0]+'" class="'+(cls||"")+'" title="'+esc(n[1]+(n[3]?": "+n[3]:""))+'">'+ico(n[2])+'<span class="lt"><b>'+n[1]+(n[0]==="mistakes"?' <em class="mc"></em>':"")+"</b>"+(n[3]?"<small>"+n[3]+"</small>":"")+"</span></a>"}
function ring(pct,state){var r=8,C=2*Math.PI*r;return '<svg class="mring '+state+'" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="'+r+'" class="tr"/>'+(pct?'<circle cx="11" cy="11" r="'+r+'" class="fg" stroke-dasharray="'+(C*pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 11 11)"/>':"")+"</svg>"}
function railTopics(){
  var box=$("#rtopics");if(!box||!P.topicStats)return;var cur=document.body.dataset.page==="topic"?P.curTopic:null;
  box.innerHTML=P.manifest.topics.map(function(m,i){var st=P.topicStats(m),state=P.stateOf?P.stateOf(st):"unvisited";
    return '<a href="#topic-'+m.id+'" class="'+(m.id===cur?"on":"")+'" title="'+esc(m.name)+": "+st.pct+'% done">'+ring(st.pct,state)+'<span class="lt"><b>'+(i+1)+". "+esc(m.short)+"</b></span><i>"+st.pct+"%</i></a>"}).join("");
}
function updContinue(){var nx=P.nextStep?P.nextStep():null;if(!nx)return;var lab=nx.kind==="lesson"?nx.m.short+", lesson "+nx.no+": "+nx.sec.title:nx.kind==="pyqs"?nx.m.short+" PYQs":nx.kind==="test"?nx.m.short+" topic test":"Mock exam";
  $$(".cont").forEach(function(a){a.href=nx.href;a.title="Continue: "+lab;var t=a.querySelector(".cl");if(t)t.textContent=lab})}
function sw(id,label,sub){return '<div class="swrow"><span><b>'+label+"</b>"+(sub?"<small>"+sub+"</small>":"")+'</span><button class="switch" id="'+id+'" type="button" role="switch" aria-checked="false" aria-label="'+label+'"><i></i></button></div>'}
function buildTop(){
  $("#app-top").innerHTML='<div class="rail-in"><div class="rail-head"><a class="brand" href="#home">'+LOGO+'<span><b>PDSA</b><small>Quiz 2 study guide</small></span></a><button class="railbtn" id="b-rail" type="button" aria-label="Collapse the menu" aria-expanded="true"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15M15.5 10l-2 2 2 2"/></svg></button></div>'
   +'<a class="cont" href="#home" title="Continue"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg><span class="lt"><b>Continue</b><small class="cl"></small></span></a>'
   +'<button class="search-btn" id="b-search" type="button" title="Search (Ctrl K or /)">'+ico("search")+'<span>Search</span><kbd>Ctrl K</kbd></button>'
   +'<nav class="nav" id="nav" aria-label="Main">'+NAV.map(function(n){return link(n)}).join("")+'</nav>'
   +'<div class="rgroup"><p class="rh">Topics</p><nav class="nav rtopics" id="rtopics" aria-label="Topics"></nav></div>'
   +'<details class="rgroup more" id="rmore"><summary class="rh">More tools</summary><nav class="nav nav2" aria-label="More tools">'+NAV2.map(function(n){return link(n)}).join("")+'<a href="#" id="b-f" data-n="formulas" title="All formulas">'+ico("f")+'<span class="lt"><b>All formulas</b><small>Every formula in a side drawer</small></span></a></nav></details>'
   +'<div class="setwrap"><button class="setbtn" id="b-set" type="button" aria-expanded="false" title="Settings"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span class="lt"><b>Settings</b></span></button>'
   +'<div class="setpop" id="setpop" hidden>'+sw("b-theme","Dark mode")+sw("b-large","Larger text")+sw("b-tags","Show source tags","DERIVED, FLAG and SRC labels on questions")+sw("b-xp","Expand all","Open every solution, worked step and trace. Not counted as an attempt.")
   +'<div class="swrow"><span><b>Exam date</b><small>Shows a countdown and a daily target</small></span><input type="date" id="b-exam" class="field" aria-label="Exam date"></div>'
   +'<div class="swrow keys"><span><b>Keyboard</b><small><kbd>Ctrl K</kbd> search, <kbd>A</kbd>–<kbd>E</kbd> pick an option, <kbd>Enter</kbd> submit</small></span></div>'
   +'<button class="linkbtn danger" id="b-reset2" type="button">Reset all progress</button></div></div></div>';
  var mb=el("nav","mbar");mb.setAttribute("aria-label","Main");
  mb.innerHTML=NAV.slice(0,4).map(function(n){return '<a href="#'+n[0]+'" data-n="'+n[0]+'">'+ico(n[2])+"<span>"+n[1].split(" ")[0]+"</span></a>"}).join("")+'<a href="#" id="b-more" data-n="more">'+ico("more")+"<span>More</span></a>";
  document.body.appendChild(mb);
  var mt=el("div","mtop");mt.innerHTML='<a class="brand" href="#home">'+LOGO+'<span><b>PDSA</b><small>Quiz 2 study guide</small></span></a><span class="mt-r"><a class="cont mini btn sm" href="#home">Continue</a><button class="iconbtn" id="b-search2" type="button" aria-label="Search">'+ico("search")+"</button></span>";
  document.body.insertBefore(mt,document.body.firstChild);
  $("#b-more").onclick=function(e){e.preventDefault();document.body.classList.toggle("railopen")};
  $("#b-search2").onclick=openSearch;
  document.addEventListener("click",function(e){if(document.body.classList.contains("railopen")&&!e.target.closest("#app-top")&&!e.target.closest("#b-more"))document.body.classList.remove("railopen");
    if(!e.target.closest(".setwrap")){$("#setpop").hidden=true;$("#b-set").setAttribute("aria-expanded","false")}});
  document.addEventListener("keydown",keys);
  $("#b-set").onclick=function(){var p=$("#setpop");p.hidden=!p.hidden;this.setAttribute("aria-expanded",!p.hidden)};
  $("#b-theme").onclick=function(){setTheme(document.documentElement.getAttribute("data-theme")!=="dark")};
  $("#b-large").onclick=function(){setLarge(document.documentElement.getAttribute("data-large")!=="on")};
  $("#b-tags").onclick=function(){setTags(!document.body.classList.contains("showtags"))};
  $("#b-xp").onclick=function(){setExpand(!P.load().prefs.expandAll)};
  var S0=P.load();$("#b-exam").value=S0.prefs.exam||"";$("#b-exam").onchange=function(){var S=P.load();S.prefs.exam=this.value;P.save();if(document.body.dataset.page==="home")P.route()};
  $("#b-reset2").onclick=function(){if(this.dataset.s){try{localStorage.removeItem("pdsa-q2-v1")}catch(e){}location.hash="#home";(window.PDSA_SYNC?PDSA_SYNC.wipe():Promise.resolve()).then(function(){location.reload()})}else{this.dataset.s=1;this.textContent="Click again to erase everything"}};
  $("#rmore").open=!!S0.prefs.moreOpen;$("#rmore").ontoggle=function(){var S=P.load();S.prefs.moreOpen=this.open;P.save()};
  $("#b-rail").onclick=function(){setRail(!document.body.classList.contains("railmin"))};
  $("#b-search").onclick=openSearch;$("#b-f").onclick=function(e){e.preventDefault();openFormulas()};
}
/* keyboard: Ctrl/Cmd K or / to search; A-E or 1-5 to pick an option in the active question; Enter to submit */
var activeQ=null;
document.addEventListener("pointerdown",function(e){var c=e.target.closest&&e.target.closest(".qcard");if(c)activeQ=c},true);
document.addEventListener("focusin",function(e){var c=e.target.closest&&e.target.closest(".qcard");if(c)activeQ=c});
function pickCard(){
  if(activeQ&&document.body.contains(activeQ)&&activeQ._keys&&!activeQ._keys.done()){var r=activeQ.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)return activeQ}
  var best=null,bd=1e9;$$(".qcard").forEach(function(c){if(!c._keys||c._keys.done())return;var r=c.getBoundingClientRect();if(r.bottom<60||r.top>innerHeight-60)return;var d=Math.abs(r.top+Math.min(r.height,400)/2-innerHeight/2);if(d<bd){bd=d;best=c}});return best;
}
function keys(e){
  var tag=document.activeElement&&document.activeElement.tagName,typing=/INPUT|TEXTAREA|SELECT/.test(tag);
  if((e.ctrlKey||e.metaKey)&&(e.key==="k"||e.key==="K")){e.preventDefault();openSearch();return}
  if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="/"){e.preventDefault();openSearch();return}
  if($(".sr"))return;
  var k=e.key.toLowerCase(),idx="abcde".indexOf(k);if(idx<0&&/^[1-5]$/.test(k))idx=+k-1;
  if(idx>=0||e.key==="Enter"){
    if(document.body.dataset.page==="cards")return;
    var c=pickCard();if(!c)return;
    if(idx>=0&&c._keys.pick(idx)){e.preventDefault();activeQ=c}
    else if(e.key==="Enter"&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("button,a"))&&c._keys.submit()){e.preventDefault()}
  }
}
function setTheme(d){document.documentElement.setAttribute("data-theme",d?"dark":"light");$("#b-theme").setAttribute("aria-checked",d);P.load().prefs.dark=d;P.save()}
function setLarge(on){document.documentElement.setAttribute("data-large",on?"on":"off");$("#b-large").setAttribute("aria-checked",on);P.load().prefs.large=on;P.save()}
function setRail(min){document.body.classList.toggle("railmin",min);var b=$("#b-rail");if(b){b.setAttribute("aria-expanded",!min);b.setAttribute("aria-label",min?"Expand the menu":"Collapse the menu")}var S=P.load();S.prefs.railmin=min;P.save()}
/* Expand all: opens every collapsed block, trace and question solution in the page, and keeps doing it as new content appears */
var xpObs=null,xpT=0;
P.expandAll=function(root){root=root||$("#main");if(!root)return;
  $$("details:not([open])",root).forEach(function(d){d.open=true});
  $$(".stepper .all",root).forEach(function(b){if(b.dataset.xp)return;b.dataset.xp=1;b.click()});
  $$(".qcard",root).forEach(function(c){if(c.peek)c.peek()});
};
function setExpand(on){var S=P.load();S.prefs.expandAll=on;P.save();var b=$("#b-xp");if(b)b.setAttribute("aria-checked",on);
  if(xpObs){xpObs.disconnect();xpObs=null}
  if(on&&$("#main")){xpObs=new MutationObserver(function(){clearTimeout(xpT);xpT=setTimeout(function(){P.expandAll()},60)});xpObs.observe($("#main"),{childList:true,subtree:true});P.expandAll()}
}
P.setExpand=setExpand;
function setTags(on){document.body.classList.toggle("showtags",on);$("#b-tags").setAttribute("aria-checked",on);P.load().prefs.tags=on;P.save()}
function badge(){var S=P.load(),n=0;Object.keys(S.ans).forEach(function(k){var a=S.ans[k];if(!a.ok||a.conf==="Unsure"||a.conf==="Guess")n++});$$(".mc").forEach(function(m){m.textContent=n?String(n):""})}
P.badge=badge;
/* ---------- router ---------- */
P.route=function(){
  if(P.cleanup){try{P.cleanup()}catch(e){}P.cleanup=null}
  var h=(location.hash||"#home").slice(1),root=$("#main");root.innerHTML="";
  var parts=h.split("-"),page=parts[0];
  document.body.classList.remove("railopen");$$("[data-n]").forEach(function(a){a.classList.toggle("on",a.dataset.n===page||(page==="topic"&&a.dataset.n==="home"&&a.closest(".mbar")))});document.body.dataset.page=page;
  try{
    if(page==="topic"){var rest=h.slice(6).split("/");P.pages.topic(root,rest[0],rest[1]||"",rest[2]||"")}
    else if(P.pages[page])P.pages[page](root);
    else P.pages.home(root);
  }catch(e){root.innerHTML='<div class="page"><div class="box"><h2>Something went wrong</h2><pre style="white-space:pre-wrap">'+esc(String(e&&e.stack||e))+"</pre></div></div>";console.error(e)}
  P.math(root);badge();railTopics();updContinue();if(!P._keepScroll)window.scrollTo(0,0);P._keepScroll=false;
  if(P._after){var f=P._after;P._after=null;setTimeout(f,60)}
};
/* ---------- search ---------- */
var IX=null;
function strings(o,out){if(o==null)return;if(typeof o==="string")out.push(o);else if(Array.isArray(o))o.forEach(function(x){strings(x,out)});else if(typeof o==="object")Object.keys(o).forEach(function(k){if(k!=="svg")strings(o[k],out)})}
function buildIX(){
  IX=[];
  P.manifest.topics.forEach(function(m){var t=P.topics[m.id];if(!t)return;
    (t.prereqs||[]).concat(t.sections).forEach(function(s){var a=[];strings(s.blocks,a);strings(s.studying,a);strings(s.plain,a);IX.push({k:"Section",t:s.title,sub:t.short,x:P.plain(a.join(" ")).toLowerCase(),go:[t.id,"sec",s.id]})});
    t.pyqs.forEach(function(q){var a=[];strings(q.stem,a);strings(q.options,a);strings(q.code,a);IX.push({k:"PYQ",t:q.exam+" Q"+q.qno+" · "+q.idea,sub:t.short+" · "+P.plain(q.stem).slice(0,90),x:P.plain(a.join(" ")).toLowerCase(),go:[t.id,"pyq",q.id]})});
  });
  P.glossary.forEach(function(g){IX.push({k:"Term",t:g.term,sub:P.plain(g.def).slice(0,100),x:(g.term+" "+g.def).toLowerCase(),go:[null,"gl",g.term]})});
}
function openSearch(){
  if(!IX)buildIX();
  var sr=el("div","sr",'<div class="pn"><input type="text" id="sq" placeholder="Search notes, PYQs and terms" aria-label="Search" autocomplete="off"><div id="sres" style="margin-top:8px"></div></div>');document.body.appendChild(sr);
  var inp=$("#sq",sr);inp.focus();
  function close(){sr.remove()}
  sr.onclick=function(e){if(e.target===sr)close()};
  document.addEventListener("keydown",function k(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",k)}});
  inp.oninput=function(){
    var q=inp.value.toLowerCase().trim(),out=$("#sres",sr);if(q.length<2){out.innerHTML='<p style="color:var(--mute)">Type at least two letters.</p>';return}
    var words=q.split(/\s+/),hits=[];
    IX.forEach(function(e){var sc=0;words.forEach(function(w){if(e.t.toLowerCase().indexOf(w)>=0)sc+=5;var c=e.x.indexOf(w);if(c>=0)sc+=1;else sc-=100});if(sc>0)hits.push([sc,e])});
    hits.sort(function(a,b){return b[0]-a[0]});
    out.innerHTML=hits.slice(0,30).map(function(h,i){var e=h[1];return '<a class="hit" data-i="'+i+'"><b>'+esc(e.t)+'</b> <span class="pill">'+e.k+"</span><small>"+esc(e.sub||"")+"</small></a>"}).join("")||'<p style="color:var(--mute)">No match.</p>';
    $$(".hit",out).forEach(function(a){a.onclick=function(){var e=hits[+a.dataset.i][1];close();goTo(e.go)}});
  };
}
function goTo(g){
  if(g[1]==="gl"){location.hash="#glossary";return}
  if(g[1]==="sec"){location.hash="#topic-"+g[0]+"/"+g[2];return}
  location.hash="#topic-"+g[0]+"/pyqs/"+g[2];
}
/* ---------- formula drawer ---------- */
function openFormulas(){
  var sc=el("div","scrim"),d=el("aside","drawer open");
  var h='<button class="tbtn x" type="button">Close</button><h3>Formulas and complexities</h3>';
  P.manifest.topics.forEach(function(m){var t=P.topics[m.id];if(!t)return;h+='<h4 style="margin:14px 0 4px;font:700 .78rem var(--sans);letter-spacing:.08em;text-transform:uppercase;color:'+m.accent+'">'+esc(t.name)+"</h4>"+P.tableHTML(["Fact","Value"],t.formulas.map(function(f){return [f.name+(f.cond?"<br><small>"+esc(f.cond)+"</small>":""),"$"+f.tex+"$"]}))});
  d.innerHTML=h;document.body.appendChild(sc);document.body.appendChild(d);P.math(d);
  function close(){d.remove();sc.remove()}
  sc.onclick=close;$(".x",d).onclick=close;
}
/* ---------- glossary tooltip ---------- */
function tip(e){
  var g=e.target.closest&&e.target.closest(".gl"),t=$("#gltip");
  if(!g){if(t)t.remove();return}
  var d=P.glossary[+g.dataset.g];if(!d)return;
  if(!t){t=el("div");t.id="gltip";document.body.appendChild(t)}
  t.innerHTML="<b>"+esc(d.term)+"</b><br>"+P.inline(d.def);P.math(t);
  var r=g.getBoundingClientRect();t.style.left=Math.max(8,Math.min(window.innerWidth-320,r.left))+"px";t.style.top=(r.bottom+8)+"px";
}
document.addEventListener("mouseover",tip);document.addEventListener("focusin",tip);document.addEventListener("click",tip);
document.addEventListener("mouseout",function(e){if(e.target.closest&&e.target.closest(".gl")){var t=$("#gltip");if(t)t.remove()}});
/* ---------- boot ---------- */
P.boot=function(){
  var S=P.load();if(S.prefs.railmin)document.body.classList.add("railmin");P.manifest.topics.forEach(function(m){m.accent='#1D6B5F';if(P.topics[m.id])P.topics[m.id].accent='#1D6B5F'});
  P.buildGlossary();P.buildIndex();buildTop();
  setTheme(!!S.prefs.dark);setLarge(!!S.prefs.large);setTags(!!S.prefs.tags);setExpand(!!S.prefs.expandAll);
  if(!P.storeOK)$("#main").insertAdjacentHTML("beforebegin",'<div style="background:var(--warnbg);color:var(--warn);text-align:center;padding:6px;font-size:.86rem">Browser storage is blocked here, so your progress lasts only for this session. Use Export on the home page.</div>');
  window.addEventListener("hashchange",P.route);P.route();
};
})();
