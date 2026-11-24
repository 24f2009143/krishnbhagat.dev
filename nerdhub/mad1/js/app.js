/* MAD 1 app shell: menu (collapsible rail), exam switcher, phone bottom bar, router, search, formula drawer, boot. */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el,$=A.$,$$=A.$$;
var ICON={
 map:'<circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M7.3 6h9.4M6.2 8.1l4.6 7.8M17.8 8.1l-4.6 7.8"/>',
 practice:'<path d="M4 12.5l5 5L20 6.5"/>',
 mock:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 1.6M10 2.8h4"/>',
 cards:'<rect x="3.5" y="6" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v12"/>',
 mistakes:'<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.3v.2"/>',
 plan:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 sheet:'<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
 glossary:'<path d="M5 4.5h10a4 4 0 0 1 4 4v11H9a4 4 0 0 1-4-4z"/><path d="M9 9h6"/>',
 things:'<path d="M6 4.5h12v15l-6-3.5-6 3.5z"/>',
 traps:'<path d="M4 18l8-13 8 13z"/><path d="M9 14h6"/>',
 coverage:'<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7" class="fillish"/>',
 examday:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
 more:'<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
 f:'<path d="M14.5 4.5c-2.5-.6-4 .6-4.4 3L8.6 18c-.4 2.4-1.9 3.4-4.1 2.8M7 10h8"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
};
function ico(n){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(ICON[n]||"")+"</svg>"}
A.ico=ico;
/* [route, label, icon, one-line description] */
A.NAV=[["home","Course","map","The route through every topic and your progress"],["practice","Practice next","practice","The question worth the most marks to you right now"],["mock","Mock exam","mock","A timed paper that marks itself"],["cards","Flashcards","cards","Quick recall of ideas, commands and traps"],["mistakes","Mistakes","mistakes","Wrong answers and guesses, to redo"]];
A.NAV2=[["plan","Study plan","plan","A plan for the time you have"],["cheat","Cheatsheet","sheet","Every topic's methods and traps on one page"],["things","Things to remember","things","Facts, cues and exam moves, all topics"],["traps","Trap bank","traps","Every trap with the cause behind it"],["coverage","Coverage","coverage","Which PYQs and concepts you have covered"],["examday","Exam-day mode","examday","Calm last-hour routine"],["glossary","Glossary","glossary","Every term in plain words"]];
var LOGO='<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="24" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 11h24" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8.5" r="1" fill="currentColor"/><path d="M10 16l-3 3 3 3M22 16l3 3-3 3M17 15l-2 8" fill="none" stroke="var(--visited)" stroke-width="2" stroke-linecap="round"/></svg>';
function link(n){return '<a href="#'+n[0]+'" data-n="'+n[0]+'" title="'+esc(n[1]+": "+n[3])+'">'+ico(n[2])+'<span class="lt"><b>'+esc(n[1])+(n[0]==="mistakes"?' <em class="mc"></em>':"")+"</b><small>"+esc(n[3])+"</small></span></a>"}
function ring(pct,state){var r=8,C=2*Math.PI*r;return '<svg class="mring '+state+'" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="'+r+'" class="tr"/>'+(pct?'<circle cx="11" cy="11" r="'+r+'" class="fg" stroke-dasharray="'+(C*pct/100).toFixed(1)+" "+C.toFixed(1)+'" transform="rotate(-90 11 11)"/>':"")+"</svg>"}
A.ring=ring;
function examSelect(id){
  var cur=A.exam();
  return '<label class="exsw" for="'+id+'"><span>Exam</span><select id="'+id+'" class="field exsel">'+A.examIds().map(function(k){var e=A.manifest.exams[k];return '<option value="'+k+'"'+(k===cur?" selected":"")+">"+esc(e.label)+(e.status!=="ready"&&e.status!=="in-progress"?" ("+esc(e.status)+")":"")+"</option>"}).join("")+'<option value="all"'+(cur==="all"?" selected":"")+'>Full course</option></select></label>';
}
A.examSelect=examSelect;
document.addEventListener("change",function(e){if(e.target.classList&&e.target.classList.contains("exsel")){A.setExam(e.target.value);$$(".exsel").forEach(function(s){s.value=e.target.value});location.hash="#exam/"+e.target.value}});
function railTopics(){
  var box=$("#rtopics");if(!box)return;var cur=A.curTopic;
  var T=A.examTopics(A.exam());
  box.innerHTML=T.map(function(m){var st=A.topicStats(m),state=A.stateOf(m,st);
    return '<a href="#topic/'+m.id+'" class="'+(m.id===cur&&document.body.dataset.page==="topic"?"on":"")+'" title="'+esc(m.name)+(A.isReady(m)?": "+st.pct+"% ready":": "+m.status)+'">'+ring(st.pct,state)+'<span class="lt"><b>'+esc(m.short)+"</b></span><i>"+(A.isReady(m)?st.pct+"%":"soon")+"</i></a>"}).join("")||'<p class="rempty">No topics in this exam.</p>';
}
A.railTopics=railTopics;
function updContinue(){var nx=A.nextStep();var lab=nx.label;$$(".cont").forEach(function(a){a.href=nx.href;a.title="Continue: "+lab;var t=a.querySelector(".cl");if(t)t.textContent=lab})}
function sw(id,label,sub){return '<div class="swrow"><span><b>'+label+"</b>"+(sub?"<small>"+sub+"</small>":"")+'</span><button class="switch" id="'+id+'" type="button" role="switch" aria-checked="false" aria-label="'+label+'"><i></i></button></div>'}
function buildTop(){
  var M=A.manifest;
  $("#app-top").innerHTML='<div class="rail-in"><div class="rail-head"><a class="brand" href="#home">'+LOGO+'<span><b>'+esc(M.short||"MAD 1")+'</b><small>'+esc(M.subject)+'</small></span></a><button class="railbtn" id="b-rail" type="button" aria-label="Collapse the menu" aria-expanded="true">'+'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15M15.5 10l-2 2 2 2"/></svg></button></div>'
   +'<a class="hubback" href="'+esc(M.hubUrl)+'" title="Back to nerdhub">← nerdhub</a>'
   +'<div class="rail-exam">'+examSelect("rail-exam")+"</div>"
   +'<a class="cont" href="#home" title="Continue"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg><span class="lt"><b>Continue</b><small class="cl"></small></span></a>'
   +'<button class="search-btn" id="b-search" type="button" title="Search (/ or Ctrl K)">'+ico("search")+'<span>Search</span><kbd>/</kbd></button>'
   +'<nav class="nav" aria-label="Main">'+A.NAV.map(link).join("")+"</nav>"
   +'<div class="rgroup"><p class="rh">Topics in this exam</p><nav class="nav rtopics" id="rtopics" aria-label="Topics"></nav></div>'
   +'<details class="rgroup more" id="rmore"><summary class="rh">More tools</summary><nav class="nav nav2" aria-label="More tools">'+A.NAV2.map(link).join("")+'<a href="#" id="b-f" data-n="formulas" title="Every formula and command in a side drawer">'+ico("f")+'<span class="lt"><b>Formula drawer</b><small>Every formula and command</small></span></a></nav></details>'
   +'<a class="setlink" href="#settings" data-n="settings" title="Settings">'+ico("gear")+'<span class="lt"><b>Settings</b><small>Theme, text size, exam dates, backup</small></span></a></div>';
  var mb=el("nav","mbar");mb.setAttribute("aria-label","Main (phone)");
  mb.innerHTML=[["home","Course","map"],["practice","Practice","practice"],["mock","Mock","mock"],["cards","Cards","cards"]].map(function(n){return '<a href="#'+n[0]+'" data-n="'+n[0]+'">'+ico(n[2])+"<span>"+n[1]+"</span></a>"}).join("")+'<a href="#" id="b-more" data-n="more">'+ico("more")+"<span>More</span></a>";
  document.body.appendChild(mb);
  var mt=el("div","mtop");mt.innerHTML='<a class="brand" href="#home">'+LOGO+'<span><b>'+esc(M.short||"MAD 1")+'</b></span></a><span class="mt-r"><a class="cont mini btn sm" href="#home">Continue</a><button class="iconbtn" id="b-search2" type="button" aria-label="Search">'+ico("search")+"</button></span>";
  document.body.insertBefore(mt,$("#main"));
  $("#b-more").onclick=function(e){e.preventDefault();document.body.classList.toggle("railopen")};
  $("#b-search2").onclick=function(){openSearch()};$("#b-search").onclick=function(){openSearch()};
  document.addEventListener("click",function(e){if(document.body.classList.contains("railopen")&&!e.target.closest("#app-top")&&!e.target.closest("#b-more"))document.body.classList.remove("railopen")});
  document.addEventListener("keydown",keys);
  var S0=A.load();$("#rmore").open=!!S0.prefs.moreOpen;$("#rmore").ontoggle=function(){var S=A.load();S.prefs.moreOpen=this.open;A.save()};
  $("#b-rail").onclick=function(){setRail(!document.body.classList.contains("railmin"))};
  $("#b-f").onclick=function(e){e.preventDefault();openFormulas()};
}
/* keyboard: / or Ctrl/Cmd K search; A-E or 1-5 pick an option of the active question; Enter submits that one question (never a whole mock) */
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
  if($(".sr")||document.body.dataset.page==="cards")return;
  var k=e.key.toLowerCase(),idx="abcde".indexOf(k);if(idx<0&&/^[1-5]$/.test(k))idx=+k-1;
  if(idx>=0||e.key==="Enter"){
    var c=pickCard();if(!c)return;
    if(idx>=0&&c._keys.pick(idx)){e.preventDefault();activeQ=c}
    else if(e.key==="Enter"&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("button,a,summary"))&&c._keys.submit()){e.preventDefault()}
  }
}
A.setTheme=function(d){document.documentElement.setAttribute("data-theme",d?"dark":"light");var S=A.load();S.prefs.dark=d;A.save()};
A.setLarge=function(on){document.documentElement.setAttribute("data-large",on?"on":"off");var S=A.load();S.prefs.large=on;A.save()};
A.setTags=function(on){document.body.classList.toggle("showtags",on);var S=A.load();S.prefs.tags=on;A.save()};
function setRail(min){document.body.classList.toggle("railmin",min);var b=$("#b-rail");if(b){b.setAttribute("aria-expanded",!min);b.setAttribute("aria-label",min?"Expand the menu":"Collapse the menu")}var S=A.load();S.prefs.railmin=min;A.save()}
A.badge=function(){var S=A.load(),n=0;Object.keys(S.ans).forEach(function(k){var a=S.ans[k];if(!a.ok||a.conf==="Unsure"||a.conf==="Guess")n++});$$(".mc").forEach(function(m){m.textContent=n?String(n):""})};

/* ---------- router ---------- */
A.parseHash=function(h){
  h=(h||location.hash||"#home").replace(/^#/,"").split("#")[0];var p=h.split("/").map(function(x){try{return decodeURIComponent(x)}catch(e){return x}});
  return {page:p[0]||"home",parts:p.slice(1)};
};
A.PHASE_E=["things","traps","coverage","examday"];
A.route=function(){
  if(A.cleanup){try{A.cleanup()}catch(e){console.error(e)}A.cleanup=null}
  var r=A.parseHash(),root=$("#main"),page=r.page;root.innerHTML="";
  document.body.classList.remove("railopen");document.body.dataset.page=page;
  $$("[data-n]").forEach(function(a){var on=a.dataset.n===page||(page==="topic"&&a.dataset.n==="home"&&a.closest(".mbar"));a.classList.toggle("on",on);if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  try{
    if(page==="exam"){var ex=r.parts[0];if(ex&&(ex==="all"||A.manifest.exams[ex])){A.setExam(ex);$$(".exsel").forEach(function(s){s.value=ex})}A.pages.home(root)}
    else if(A.pages[page])A.pages[page](root,r.parts);
    else A.pages.home(root);
  }catch(e){root.innerHTML='<div class="page"><div class="box"><h2>Something went wrong</h2><pre style="white-space:pre-wrap">'+esc(String(e&&e.stack||e))+"</pre></div></div>";console.error(e)}
  var S=A.load();if(page!=="settings"&&page!=="search"){S.prefs.last=location.hash||"#home";A.save()}
  A.math(root);A.badge();railTopics();updContinue();
  var h1=root.querySelector("h1");document.title=(h1?h1.textContent.trim()+" · ":"")+A.manifest.short+" · nerdhub";
  if(!A._keepScroll)window.scrollTo({top:0,left:0,behavior:"instant"});A._keepScroll=false;
  if(A._after){var f=A._after;A._after=null;setTimeout(f,40)}
};

/* ---------- search ---------- */
var IX=null;
function strings(o,out){if(o==null)return;if(typeof o==="string")out.push(o);else if(Array.isArray(o))o.forEach(function(x){strings(x,out)});else if(typeof o==="object")Object.keys(o).forEach(function(k){if(k!=="svg")strings(o[k],out)})}
A.buildSearch=function(){
  IX=[];
  A.manifest.topics.forEach(function(m){var t=A.topics[m.id];
    IX.push({k:"Topic",t:m.name,sub:m.why,x:(m.name+" "+m.why+" "+(m.subs||[]).map(function(s){return s.name+" "+(s.aliases||[]).join(" ")}).join(" ")).toLowerCase(),go:"#topic/"+m.id});
    if(!t)return;
    (t.sections||[]).forEach(function(s){var a=[];strings([s.title,s.studying,s.plain,s.core,s.deep],a);IX.push({k:"Lesson",t:s.title,sub:t.name,x:A.plain(a.join(" ")).toLowerCase(),go:"#topic/"+m.id+"/lesson/"+s.id})});
  });
  Object.keys(A.packs).forEach(function(ex){Object.keys(A.packs[ex]).forEach(function(tid){A.packs[ex][tid].pyqs.forEach(function(q){var a=[];strings([q.stem,q.options,q.id],a);IX.push({k:"PYQ",t:(q.paper||"")+" Q"+(q.qno||"")+" · id "+q.id,sub:(A.topicMeta(tid)||{}).short+" · "+A.plain(q.stem).slice(0,90),x:A.plain(a.join(" ")).toLowerCase()+" "+q.id,go:"#pyq/"+q.uid})})})});
  A.glossary.forEach(function(g){IX.push({k:"Term",t:g.term,sub:A.plain(g.def).slice(0,100),x:(g.term+" "+(g.alias||[]).join(" ")+" "+g.def).toLowerCase(),go:"#glossary"})});
};
A.searchHits=function(q){
  if(!IX)A.buildSearch();q=q.toLowerCase().trim();if(q.length<2)return [];
  var words=q.split(/\s+/),hits=[];
  IX.forEach(function(e){var sc=0;words.forEach(function(w){if(e.t.toLowerCase().indexOf(w)>=0)sc+=5;if(e.x.indexOf(w)>=0)sc+=1;else sc-=100});if(sc>0)hits.push([sc,e])});
  hits.sort(function(a,b){return b[0]-a[0]});return hits.slice(0,40).map(function(h){return h[1]});
};
A.hitsHTML=function(hits){return hits.map(function(e){return '<a class="hit" href="'+esc(e.go)+'"><b>'+esc(e.t)+'</b> <span class="pill">'+e.k+"</span><small>"+esc(e.sub||"")+"</small></a>"}).join("")||'<p class="mute">No match.</p>'};
function openSearch(){
  if($(".sr"))return;
  var sr=el("div","sr",'<div class="pn" role="dialog" aria-modal="true" aria-label="Search"><input type="search" id="sq" placeholder="Search lessons, PYQs (text or bank id) and terms" aria-label="Search" autocomplete="off"><div id="sres" aria-live="polite"></div><p class="sr-foot"><kbd>Esc</kbd> closes · <a href="#search">open the search page</a></p></div>');document.body.appendChild(sr);
  var inp=$("#sq",sr),prevFocus=document.activeElement;inp.focus();
  function close(){sr.remove();document.removeEventListener("keydown",k);if(prevFocus&&prevFocus.focus)prevFocus.focus()}
  function k(e){if(e.key==="Escape")close()}
  document.addEventListener("keydown",k);
  sr.onclick=function(e){if(e.target===sr||e.target.closest("a"))setTimeout(close,0)};
  inp.oninput=function(){var out=$("#sres",sr);out.innerHTML=inp.value.trim().length<2?'<p class="mute">Type at least two letters.</p>':A.hitsHTML(A.searchHits(inp.value))};
}
A.openSearch=openSearch;
/* ---------- formula drawer ---------- */
function openFormulas(){
  var sc=el("div","scrim"),d=el("aside","drawer open");d.setAttribute("aria-label","Formula drawer");
  var h='<button class="btn sm ghost x" type="button">Close</button><h3>Formulas and commands</h3>',any=false;
  A.examTopics(A.exam()).forEach(function(m){var t=A.topics[m.id];if(!t||!t.remember||!t.remember.formulas||!t.remember.formulas.length)return;any=true;
    h+='<h4 class="dr-h">'+esc(t.name)+"</h4>"+A.rawTable(["Formula","Means","When"],t.remember.formulas.map(function(f){return ["$"+esc(f.tex)+"$",A.inline(f.means||""),A.inline(f.when||"")]}))});
  if(!any)h+='<p class="mute">No formulas yet: they appear here as topics are built.</p>';
  d.innerHTML=h;document.body.appendChild(sc);document.body.appendChild(d);A.math(d);d.querySelector(".x").focus();
  function close(){d.remove();sc.remove();document.removeEventListener("keydown",k)}function k(e){if(e.key==="Escape")close()}
  document.addEventListener("keydown",k);sc.onclick=close;$(".x",d).onclick=close;
}
A.openFormulas=openFormulas;
/* ---------- glossary tooltip ---------- */
function tip(e){
  var g=e.target.closest&&e.target.closest(".gl"),t=$("#gltip");
  if(!g){if(t)t.remove();return}
  var d=A.glossary[+g.dataset.g];if(!d)return;
  if(!t){t=el("div");t.id="gltip";t.setAttribute("role","tooltip");document.body.appendChild(t)}
  t.innerHTML="<b>"+esc(d.term)+"</b><br>"+A.inline(d.def);A.math(t);
  var r=g.getBoundingClientRect();t.style.left=Math.max(8,Math.min(window.innerWidth-320,r.left))+"px";t.style.top=(r.bottom+8)+"px";
}
document.addEventListener("mouseover",tip);document.addEventListener("focusin",tip);
document.addEventListener("mouseout",function(e){if(e.target.closest&&e.target.closest(".gl")){var t=$("#gltip");if(t)t.remove()}});
/* ---------- boot ---------- */
A.boot=function(){
  var extra=[];
  if(/[?&]fixture=1/.test(location.search))extra.push("tests/fixture/fixture.js");
  A.loadScripts(extra,function(){
    A.loadScripts(A.dataFiles(),function(){
      var S=A.load();
      if(S.prefs.railmin)document.body.classList.add("railmin");
      A.buildGlossary();A.buildIndex();buildTop();
      var sysDark=!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme",(S.prefs.dark!=null?S.prefs.dark:sysDark)?"dark":"light");
      A.setLarge(!!S.prefs.large);A.setTags(!!S.prefs.tags);
      if(!A.storeOK)$("#main").insertAdjacentHTML("beforebegin",'<div class="storewarn" role="status">This browser blocks storage, so progress lasts only for this visit. Use Settings → Export to keep it.</div>');
      if(S.migratedFrom){A.toast("Progress carried over from an older version");delete S.migratedFrom;A.save()}
      window.addEventListener("hashchange",A.route);A.route();
      document.documentElement.dataset.ready="1";
    });
  });
};
})();
