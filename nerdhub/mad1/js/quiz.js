/* MAD 1 engine: quiz engine (C-2.5). One question card handles PYQs and [ADDED] questions:
 * MCQ, MSQ, NUM (tolerance / accepted list), SA (exact string), TF, COMP (child of a shared parent text). */
(function(){
"use strict";
var A=window.APP,esc=A.esc,el=A.el,L="ABCDEFGH";
A.ERROR_TAGS=["PREREQ","CONCEPT","RECOGNITION","METHOD","EXECUTION","ARITHMETIC","READING","EDGE CASE","MEMORY","TIME","TRACE","OFF-BY-ONE","BASE-CASE","COMPLEXITY"];
var TAGINFO={"[SRC]":["SRC","Key from the bank, checked by running"],"[DERIVED]":["DERIVED","Key derived by running or computing (the bank has none)"],"[FLAG]":["FLAG","Flagged: the bank or question has an error or ambiguity; read the note"],"[ADDED]":["ADDED","Exam-style question written for this site, not a PYQ"]};

A.qType=function(q){var t=q.type==="COMP"?(q.childType||"MCQ"):q.type;return t||"MCQ"};
A.qOptions=function(q){
  var t=A.qType(q),o=q.options;
  if((!o||!o.length)&&t==="TF")o=["True","False"];
  return (o||[]).map(function(x,i){return typeof x==="string"?{label:L[i],text:x}:{label:x.label||L[i],text:x.text!=null?x.text:""}});
};
function keySet(k,opts){
  if(k==null)return null;
  var arr=Array.isArray(k)?k:String(k).split(/\s*,\s*/);
  return arr.map(function(x){if(typeof x==="number")return x;var s=String(x).trim();if(/^[A-H]$/i.test(s))return L.indexOf(s.toUpperCase());if(/^true$/i.test(s))return 0;if(/^false$/i.test(s))return 1;return -1}).filter(function(i){return i>=0&&i<opts.length}).sort();
}
A.keyIdx=function(q,which){return keySet(which==="alt"?q.altKey:q.key,A.qOptions(q))};
function normStr(s){return String(s==null?"":s).trim().replace(/\s+/g," ")}
function numMatch(k,v,tol){
  var a=parseFloat(String(k).replace(/,/g,"")),b=parseFloat(String(v).replace(/,/g,""));
  if(isNaN(a)||isNaN(b))return false;return Math.abs(a-b)<=(+tol||0)+1e-9;
}
/* returns "key" | "alt" | null */
A.check=function(q,resp){
  var t=A.qType(q);
  if(t==="NUM"||t==="SA"){
    var v=normStr(resp);if(!v)return null;
    var keys=[].concat(q.key),alts=[].concat(q.altKey==null?[]:q.altKey).concat(q.accept||[]);
    function hit(k){return t==="NUM"||(typeof k==="number")?numMatch(k,v,q.tolerance):normStr(k)===v}
    if(keys.some(hit))return "key";if(alts.some(hit))return "alt";return null;
  }
  var r=(resp||[]).slice().sort().join(","),k=A.keyIdx(q),a=A.keyIdx(q,"alt");
  if(k&&k.join(",")===r)return "key";if(a&&a.length&&a.join(",")===r)return "alt";return null;
};
A.keyText=function(q){
  var t=A.qType(q);if(t==="NUM"||t==="SA")return String([].concat(q.key)[0])+(q.tolerance?" (± "+q.tolerance+")":"");
  return (A.keyIdx(q)||[]).map(function(i){return L[i]}).join(", ");
};
A.uidOf=function(q){return q.uid||("x:"+q.id)};
function recordAnswer(q,ok,conf,resp,tag){
  var S=A.load(),u=A.uidOf(q),rec=S.ans[u]||{n:0};
  rec.n=(rec.n||0)+1;rec.ok=!!ok;rec.conf=conf||"none";rec.t=Date.now();rec.resp=resp;rec.exam=q.exam||null;rec.topic=q.topicId||null;rec.concept=q.concept||null;rec.pyq=!!q.pyq;if(tag)rec.tag=tag;
  S.ans[u]=rec;
  if(q.topicId&&q.concept&&A.adapt){var ck=q.topicId+":"+q.concept;S.bkt[ck]=A.adapt.update(S.bkt[ck],!!ok,conf||"none",Date.now())}
  A.save();if(A.badge)A.badge();return rec;
}
A.recordAnswer=recordAnswer;

function badgeFor(q){
  var tg=q.tag||(q.pyq?"[SRC]":"[ADDED]"),i=TAGINFO[tg]||[tg.replace(/[\[\]]/g,""),""];
  return '<span class="tag '+i[0]+'" title="'+esc(i[1])+'">['+esc(i[0])+"]</span>"+(q.pyq?'<span class="ksrc ksrc-'+i[0]+'">'+(i[0]==="SRC"?"key from the bank":i[0]==="DERIVED"?"key derived by running":i[0]==="FLAG"?"key flagged":"")+"</span>":"");
}
function head(q){
  var lab=q.pyq?esc(q.paper||q.date||"")+(q.paper&&/^[A-Z][a-z]{2,3} \d{4}$|^[A-Z][a-z]+ \d{4}$/.test(q.paper)?' <small class="nodate">(day not given)</small>':"")+(q.qno?" · Q"+esc(q.qno):""):(q.diff?esc(q.diff)+" · ":"")+"Practice";
  var t=A.qType(q);
  return '<div class="qh"><b>'+lab+"</b>"+(q.pyq?'<span class="qid" title="Bank id">id '+esc(q.id)+"</span>":"")
    +(q.marks!=null?'<span class="pill">'+A.fmt(q.marks)+" mark"+(+q.marks===1?"":"s")+"</span>":"")
    +'<span class="pill">'+esc(q.type==="COMP"?"Comprehension · "+t:t)+"</span>"
    +(q.seconds?'<span class="pill" title="Time budget">'+Math.round(q.seconds/60*10)/10+" min</span>":"")
    +badgeFor(q)+'<span class="push status"></span></div>';
}
function noteFor(notes,lab){return notes&&(notes[lab]||notes[L.indexOf(lab)])}

/* q: question; opt: {mock, noConf, noHints, showPrev, onDone, shuffle} */
A.qcard=function(q,opt){
  opt=opt||{};
  var S=A.load(),card=el("div","qcard"),t=A.qType(q),opts=A.qOptions(q),multi=t==="MSQ",isText=t==="NUM"||t==="SA";
  var order=opts.map(function(_,i){return i});
  if(opt.shuffle&&!q.pyq&&q.shuffle!==false&&t!=="TF"){for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=order[i];order[i]=order[j];order[j]=x}}
  var sel=[],conf=null,done=false,hintsShown=0,ctx={seen:null};
  card.dataset.uid=A.uidOf(q);card.setAttribute("aria-label","Question "+(q.pyq?q.id:q.id||""));
  var h=head(q);
  if(q.parent&&q.parent.text)h+='<details class="qparent" open><summary>Shared text for this comprehension (parent id '+esc(q.parent.id)+')</summary><div class="prose">'+A.renderRich(q.parent.text)+"</div></details>";
  h+='<div class="qb"><div class="stem prose">'+A.renderRich(q.stem)+'</div><div data-slot="extra"></div><div data-slot="ans"></div><div data-slot="warn" aria-live="polite"></div><div data-slot="hints" aria-live="polite"></div><div data-slot="conf"></div><div class="qa"></div><div data-slot="res" aria-live="polite"></div></div>';
  card.innerHTML=h;
  var extra=card.querySelector("[data-slot=extra]");
  if(q.fig){var f=el("figure","fig");f.innerHTML=A.figInner(q.fig)+(q.fig.caption?"<figcaption>"+A.inline(q.fig.caption)+"</figcaption>":"");extra.appendChild(f)}
  if(q.figureNote)extra.appendChild(el("p","fignote",'<b>Picture in the paper:</b> '+A.inline(q.figureNote)));
  if(q.tag==="[FLAG]"&&q.tagNote)extra.appendChild(el("div","flagbox","<b>[FLAG]</b> "+A.inline(q.tagNote)));
  var ans=card.querySelector("[data-slot=ans]"),optEls=[],inp=null;
  if(isText){
    ans.innerHTML='<div class="numin"><label>Your answer <input type="text" '+(t==="NUM"?'inputmode="decimal"':"")+' autocomplete="off" spellcheck="false" placeholder="'+(t==="NUM"?"a number":"type the exact text")+'"></label>'+(t==="SA"?'<small>Exact text, as the page would show it (spaces at the ends are ignored).</small>':q.tolerance?"<small>Accepted within ± "+esc(q.tolerance)+".</small>":"")+"</div>";
    inp=ans.querySelector("input");
  } else {
    var ol=el("div","opts");ol.setAttribute("role",multi?"group":"radiogroup");
    order.forEach(function(oi,pos){
      var o=opts[oi],d=el("div","opt"+(multi?" msq":""),'<span class="k2">'+L[pos]+'</span><div class="ot prose">'+A.renderRich(o.text)+"</div>");
      d.setAttribute("role",multi?"checkbox":"radio");d.setAttribute("aria-checked","false");d.tabIndex=0;d.dataset.oi=oi;
      function pick(){if(done)return;
        if(multi){var k=sel.indexOf(oi);if(k>=0)sel.splice(k,1);else sel.push(oi);d.classList.toggle("sel")}
        else{sel=[oi];optEls.forEach(function(x){x.classList.remove("sel");x.setAttribute("aria-checked","false")});d.classList.add("sel")}
        d.setAttribute("aria-checked",d.classList.contains("sel"));card.querySelector("[data-slot=warn]").innerHTML="";
      }
      d.onclick=function(e){if(e.target.closest(".cb-copy"))return;pick()};d.onkeydown=function(e){if(e.key===" "){e.preventDefault();pick()}};
      ol.appendChild(d);optEls.push(d);
    });
    if(multi)ans.appendChild(el("p","msqrule","Select all that apply. Marked right only when you pick exactly the correct set (no partial credit here)."));
    ans.appendChild(ol);
  }
  var cf=card.querySelector("[data-slot=conf]");
  if(!opt.noConf){cf.innerHTML='<div class="conf" role="group" aria-label="How sure are you?">How sure are you? '+["Sure","Unsure","Guess"].map(function(c){return '<button type="button" data-c="'+c+'" aria-pressed="false">'+c+"</button>"}).join("")+"</div>";
    A.$$("button",cf).forEach(function(b){b.onclick=function(){conf=b.dataset.c;A.$$("button",cf).forEach(function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b)})}})}
  var qa=card.querySelector(".qa"),res=card.querySelector("[data-slot=res]"),hz=card.querySelector("[data-slot=hints]"),warn=card.querySelector("[data-slot=warn]");
  card.getResp=function(){return isText?inp.value.trim():sel.slice()};
  card.hasResp=function(){var r=card.getResp();return isText?r!=="":r.length>0};
  card.isDone=function(){return done};
  card.q=q;

  function hintList(){
    if(q.hints&&q.hints.length)return q.hints;
    var s=q.sol||{},out=[];
    if(s.clues)out.push(Array.isArray(s.clues)?s.clues.join("; "):s.clues);
    if(s.idea)out.push(s.idea);
    return out;
  }
  function paintReview(which){
    var K=A.keyIdx(q)||[],AK=A.keyIdx(q,"alt")||[];
    optEls.forEach(function(d){var oi=+d.dataset.oi,chosen=sel.indexOf(oi)>=0;d.classList.add("locked");d.classList.remove("sel");
      if(K.indexOf(oi)>=0)d.classList.add("right");
      else if(chosen&&which==="alt"&&AK.indexOf(oi)>=0){d.classList.add("right","alsoacc");d.insertAdjacentHTML("beforeend",'<span class="alsoacc-l">also accepted</span>')}
      else if(chosen)d.classList.add("wrong");
      if(chosen)d.classList.add("picked");
    });
    if(inp)inp.disabled=true;
  }
  function optionNotesHTML(notes){
    if(!notes||isText)return "";
    var K=A.keyIdx(q)||[];
    return '<h4>Every option</h4>'+order.map(function(oi,pos){var lab=opts[oi].label,n=noteFor(notes,lab)||{},ok=K.indexOf(oi)>=0;
      if(typeof n==="string")n={why:n};
      return '<div class="optnote '+(ok?"t":"f")+'"><b>'+L[pos]+'</b><div class="prose">'+A.renderRich((ok?"**Right.** ":"**Wrong.** ")+(n.why||""))+(n.cause&&!ok?'<p class="cause"><span class="cause-l">Why did I fall for this?</span> '+A.inline(n.cause)+"</p>":"")+"</div></div>"}).join("");
  }
  function solutionPYQ(){
    var s=q.sol||{},w=el("div","sol");
    function sec(t,body){return body?"<h4>"+t+"</h4>"+body:""}
    function rr(x){return x==null?"":Array.isArray(x)?"<ul>"+x.map(function(y){return "<li>"+A.inline(y)+"</li>"}).join("")+"</ul>":'<div class="prose">'+A.renderRich(x)+"</div>"}
    w.innerHTML=sec("What is asked",rr(s.asked))+sec("What is given",rr(s.given))+sec("Clue words",rr(s.clues))+sec("The governing idea",rr(s.idea))
      +(s.method?'<div class="method-card"><span>Method card</span>'+A.inline(s.method)+"</div>":"")+'<h4>Worked method, one step at a time</h4><div data-slot="steps"></div>'
      +optionNotesHTML(s.optionNotes)
      +sec("Other methods",typeof s.other==="string"?(/^one practical method$/i.test(s.other.trim())?"":rr(s.other)):(s.other||[]).map(function(o){return '<div class="other"><b>'+A.inline(o.idea)+"</b><p><i>Cue:</i> "+A.inline(o.cue||"")+"</p><p><i>Trade-off:</i> "+A.inline(o.tradeoff||"")+"</p>"+(o.work?'<div class="prose">'+A.renderRich(o.work)+"</div>":"")+"</div>"}).join(""))
      +sec("Verification",rr(s.verify)+(s.asserts&&s.asserts.length?'<p class="asserts" title="'+esc(s.asserts.join(", "))+'">Checked by running the code in the pinned environment.</p>':"")+(s.range?"<p>Accepted range: "+A.inline(s.range)+"</p>":""))
      +sec("Trap",rr(s.trap))+sec("Recognition rule",rr(s.rule))
      +(s.transfer?'<h4>Transfer question</h4><div data-slot="transfer"></div>':"")
      +'<p class="keysrc">Key: '+badgeFor(q)+(q.repeatOf?' · same idea as <a href="#pyq/'+esc(q.repeatOf)+'">'+esc(q.repeatOf)+"</a> (this variant's own working is above)":"")+"</p>";
    var st=w.querySelector("[data-slot=steps]");if(st)st.replaceWith(A.stepReveal(s.steps||[],null,{gate:false}));
    var tr=w.querySelector("[data-slot=transfer]");if(tr){var tq=Object.assign({id:q.id+"-transfer",tag:"[ADDED]",topicId:q.topicId,concept:q.concept},s.transfer);tr.replaceWith(A.qcard(tq,{noConf:true}))}
    return w;
  }
  function solutionQ(){
    var w=el("div","sol");w.innerHTML='<h4>Why</h4><div class="prose">'+A.renderRich(q.explain||"")+"</div>"+optionNotesHTML(q.optionNotes)+(q.asserts&&q.asserts.length?'<p class="asserts" title="'+esc(q.asserts.join(", "))+'">Checked by running the code.</p>':"");
    return w;
  }
  function errorPicker(rec){
    var w=el("div","errtag",'<b>Why did I get this wrong?</b> <span class="errtag-c"></span>');
    var c=w.querySelector(".errtag-c");
    A.ERROR_TAGS.forEach(function(tg){var b=el("button","chip"+(rec&&rec.tag===tg?" on":""),esc(tg));b.type="button";b.onclick=function(){var S2=A.load(),r=S2.ans[A.uidOf(q)];if(r){r.tag=tg;A.save()}A.$$(".chip",c).forEach(function(x){x.classList.toggle("on",x===b)})};c.appendChild(b)});
    return w;
  }
  function tools(){
    var w=el("div","qtools");
    var sh=el("button","linkbtn",A.load().shaky[A.uidOf(q)]?"Marked as shaky":"Mark as shaky");sh.type="button";
    sh.onclick=function(){var S2=A.load(),u=A.uidOf(q);if(S2.shaky[u])delete S2.shaky[u];else S2.shaky[u]=Date.now();A.save();sh.textContent=S2.shaky[u]?"Marked as shaky":"Mark as shaky"};
    var rep=el("button","linkbtn","Report an error");rep.type="button";var ask=el("button","linkbtn","Ask me to explain");ask.type="button";
    function copyBox(kind){var ex=w.querySelector(".qnote");if(ex)ex.remove();var bx=el("div","qnote",'<label>Note (optional)<textarea class="field" rows="2"></textarea></label><button class="btn sm" type="button">Copy to clipboard</button>');w.appendChild(bx);
      bx.querySelector("button").onclick=function(){var r=card.getResp(),txt=JSON.stringify({kind:kind,site:"nerdhub/mad1",id:q.id,uid:A.uidOf(q),exam:q.exam||null,answer:isText?r:(r||[]).map(function(i){return opts[i]&&opts[i].label}),note:bx.querySelector("textarea").value},null,1);A.copy(txt,"Copied. Paste it into a chat or a message.");bx.remove()}}
    rep.onclick=function(){copyBox("report-error")};ask.onclick=function(){copyBox("explain")};
    w.appendChild(sh);w.appendChild(rep);w.appendChild(ask);return w;
  }
  function finish(which,shown){
    done=true;var ok=!!which;
    card.classList.add(ok?"ok":"bad");paintReview(which);
    var rec=recordAnswer(q,ok,shown?"gave-up":conf,card.getResp());
    var msg;
    if(shown)msg="Shown without an attempt. The answer is "+esc(A.keyText(q))+". It counts as a miss, so try a variation after reading.";
    else if(ok){msg=which==="alt"?"Accepted. Your answer is the also-accepted one; the primary key is "+esc(A.keyText(q))+". Read the [FLAG] note.":"Correct.";
      if(conf&&conf!=="Sure")msg+=" You were not sure, so this stays <b>not yet secure</b>.";}
    else{msg="Not quite. The answer is "+esc(A.keyText(q))+".";if(conf==="Sure")msg+=" You were sure, so this is a <b>dangerous misconception</b>: read the explanation slowly.";
      if(isText&&A.qType(q)==="SA"&&normStr(card.getResp()).toLowerCase()===normStr([].concat(q.key)[0]).toLowerCase())msg+=" Check the capital letters: the page shows the text exactly.";}
    res.innerHTML='<div class="verdict '+(ok?"ok":shown?"skip":"bad")+'">'+msg+"</div>";
    qa.innerHTML="";cf.innerHTML="";warn.innerHTML="";
    if(!ok&&!shown)res.appendChild(errorPicker(rec));
    res.appendChild(q.sol?solutionPYQ():solutionQ());
    res.appendChild(tools());
    A.math(res);
    if(opt.onDone)opt.onDone(ok,card);
  }
  card.grade=function(){if(done)return;finish(A.check(q,card.getResp()),false)};
  card.reveal=function(){if(done)return;finish(null,true)};
  card._keys={done:function(){return done},pick:function(pos){if(!optEls[pos]||done)return false;optEls[pos].click();return true},submit:function(){return false}};
  if(opt.mock){return card}
  /* Expand all: show the solution without grading or recording an attempt; answering later still works */
  card.peek=function(){if(done||card._peeked)return;card._peeked=true;var d=el("div","peek");d.innerHTML='<div class="verdict skip">Shown by Expand all. Not counted as an attempt. The answer is '+esc(A.keyText(q))+".</div>";d.appendChild(q.sol?solutionPYQ():solutionQ());res.appendChild(d);A.math(d)};

  var sub=el("button","btn","Submit");sub.type="button";
  sub.onclick=function(){
    if(!card.hasResp()){A.toast(isText?"Type an answer first":"Pick an answer first");return}
    if(multi&&!sub.dataset.ok&&(sel.length===1||sel.length===opts.length)){sub.dataset.ok=1;warn.innerHTML='<p class="msqwarn">You picked '+(sel.length===1?"only one option":"every option")+'. Multiple-select questions usually have two or three right answers. Press Submit again to keep your choice.</p>';return}
    card.grade();
  };
  qa.appendChild(sub);
  if(inp)inp.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();sub.click()}};
  card._keys.submit=function(){if(done)return false;sub.click();return true};
  var hl=hintList();
  if(!opt.noHints&&hl.length){
    var hb=el("button","btn ghost","Hint 1 of "+hl.length);hb.type="button";
    hb.onclick=function(){if(hintsShown<hl.length){var d=el("div","hint","<b>Hint "+(hintsShown+1)+":</b> "+A.inline(hl[hintsShown]));hz.appendChild(d);A.math(d);hintsShown++}
      if(hintsShown>=hl.length){hb.disabled=true;hb.textContent="No more hints"}else hb.textContent="Hint "+(hintsShown+1)+" of "+hl.length};
    qa.appendChild(hb);
  }
  var gv=el("button","btn ghost","Show solution");gv.type="button";gv.title="Counts as a miss";gv.onclick=function(){card.reveal()};qa.appendChild(gv);
  var prev=S.ans[A.uidOf(q)];
  if(prev&&opt.showPrev!==false){var st=card.querySelector(".status");st.innerHTML=prev.ok?'<span class="pill ok">solved before'+(prev.conf==="Unsure"||prev.conf==="Guess"?", not yet secure":"")+"</span>":'<span class="pill bad">missed before</span>'}
  A.math(card);
  return card;
};
})();
