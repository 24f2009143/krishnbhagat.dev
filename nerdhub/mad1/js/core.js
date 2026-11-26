/* MAD 1 engine core: state, storage, loaders, router helpers, escape(), renderRich(), highlighter, SVG drawers.
 * Copied from the pdsa-quiz-2 engine (PDSA.*) and extended to the nerdhub standard (APP.*). */
window.APP = window.APP || {};
(function(){
"use strict";
var A = window.APP;
A.ENGINE_VERSION = "mad1-engine-1.1.0";   /* 1.1.0: topic orientation, lessons teach before they test, rail shows the open topic's lessons. 1.0.1: review fixes (inline code in callouts, solution polish, phone layout) */
/* 1.0.0 frozen at B1-C */   /* stamped at B1-C; after the pilot only bug fixes, each bumping this */
A.topics = A.topics || {};
A.packs = A.packs || {};          /* packs[exam][topicId] = {pyqs, patterns, extraNotes, extraTraps, parts} */
A.patchesApplied = A.patchesApplied || {};
A.glossary = A.glossary || [];
A.refreshers = A.refreshers || [];
A.pages = A.pages || {};
A.widgets = A.widgets || {};
A.errors = A.errors || [];

/* ---------- one sanitizer ---------- */
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
A.esc = A.escape = esc;
A.$ = function(s,r){return (r||document).querySelector(s)};
A.$$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
A.el = function(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};

/* ---------- data registration (called by data files) ---------- */
A.registerTopic = function(id,obj){obj.id=obj.id||id;A.topics[id]=obj};
A.patchTopic = function(id,p){
  var t=A.topics[id];if(!t){A.errors.push("patch for unknown topic "+id);return}
  (p.sections||[]).forEach(function(s){s.patch=true;t.sections.push(s)});
  if(p.concepts)Object.keys(p.concepts).forEach(function(k){if(!t.concepts[k])t.concepts[k]=p.concepts[k]});
  if(p.formulas){t.remember=t.remember||{};t.remember.formulas=(t.remember.formulas||[]).concat(p.formulas)}
  if(p.flash)t.flash=(t.flash||[]).concat(p.flash);
  A.patchesApplied[id]=(A.patchesApplied[id]||0)+1;
};
A.registerPack = function(exam,id,obj){
  var E=A.packs[exam]=A.packs[exam]||{},pk=E[id]=E[id]||{pyqs:[],patterns:[],parts:0};
  (obj.pyqs||[]).forEach(function(q){q.id=String(q.id);q.exam=q.exam||exam;q.uid=q.uid||(exam+":"+q.id);q.topicId=id;q.pyq=true;pk.pyqs.push(q)});
  if(obj.patterns&&obj.patterns.length)pk.patterns=obj.patterns;   /* the last part file carries the whole topic's list */
  if(obj.extraNotes)pk.extraNotes=obj.extraNotes;
  if(obj.extraTraps)pk.extraTraps=obj.extraTraps;
  pk.parts++;
};
A.registerGlossary = function(list){A.glossary=A.glossary.concat(list)};
A.registerRefreshers = function(list){A.refreshers=A.refreshers.concat(list)};

/* ---------- loader: manifest order, sequential <script> tags, relative paths ---------- */
A.dataFiles = function(){
  var M=A.manifest,files=[];
  M.topics.forEach(function(m){
    if(m.fixture)return;   /* test fixture registers itself */
    if(m.status==="ready"||m.status==="stub")files.push("js/data/topic-"+m.id+".js");
    (m.patches||[]).forEach(function(f){files.push("js/data/"+f)});
    Object.keys(m.packs||{}).forEach(function(ex){(m.packs[ex]||[]).forEach(function(f){files.push("js/data/pyqs/"+ex+"/"+f)})});
  });
  return files;
};
A.loadScripts = function(files,done){
  var i=0;
  (function next(){
    if(i>=files.length)return done();
    var f=files[i++],s=document.createElement("script");s.src=f;
    s.onload=next;s.onerror=function(){A.errors.push("missing data file "+f);console.error("missing data file "+f);next()};
    document.body.appendChild(s);
  })();
};

/* ---------- inline + block rich text (everything escaped; math kept for KaTeX) ---------- */
var glRe=null,glMap={};
A.buildGlossary=function(){
  var terms=[];glMap={};
  A.glossary.forEach(function(g,i){([g.term].concat(g.alias||[])).forEach(function(t){glMap[t.toLowerCase()]=i;terms.push(t)})});
  terms.sort(function(a,b){return b.length-a.length});
  glRe=terms.length?new RegExp("(^|[^A-Za-z0-9_])("+terms.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("|")+")(?![A-Za-z0-9_])","gi"):null;
};
function glossify(html,seen){
  if(!glRe||!seen)return html;
  return html.split(/(<[^>]+>)/).map(function(seg){
    if(seg.charAt(0)==="<")return seg;
    return seg.replace(glRe,function(m,pre,t){var gi=glMap[t.toLowerCase()];if(gi==null||seen[gi])return m;seen[gi]=1;return pre+'<span class="gl" data-g="'+gi+'" tabindex="0">'+t+"</span>"});
  }).join("");
}
var TAGS=/\[(SRC|DERIVED|ADDED|FLAG)\]/g;
function inlineText(t){
  t=esc(t);
  t=t.replace(TAGS,function(_,k){return '<span class="tag '+k+'">['+k+"]</span>"});
  t=t.replace(/\[assert:(T[\w-]+-\d+)\]/g,'<span class="tag-assert" title="Checked by $1 in the assertion tests">checked</span>');
  t=t.replace(/\*\*([^*]+?)\*\*/g,"<strong>$1</strong>");
  t=t.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g,"$1<em>$2</em>");
  t=t.replace(/==([^=]+?)==/g,"<mark>$1</mark>");
  return t;
}
var DOLLAR="\u0003";
function inline(s,seen){
  var out="",src=String(s==null?"":s).replace(/\\\$/g,DOLLAR),parts=src.split("`");
  if(parts.length%2===0){parts[parts.length-2]+="`"+parts.pop()} /* unbalanced backtick: keep it literal */
  for(var i=0;i<parts.length;i++){
    if(i%2===1){out+='<code class="icode">'+esc(parts[i]).replace(new RegExp(DOLLAR,"g"),"\\$")+"</code>";continue}
    var re=/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g,last=0,m,seg=parts[i],buf="",maths=[];
    while((m=re.exec(seg))){buf+=inlineText(seg.slice(last,m.index))+"\u0001"+maths.length+"\u0002";maths.push(esc(m[0]));last=m.index+m[0].length}
    buf+=inlineText(seg.slice(last));
    buf=glossify(buf,seen);
    out+=buf.replace(/\u0001(\d+)\u0002/g,function(_,k){return maths[+k]});
  }
  return out.replace(new RegExp(DOLLAR,"g"),'<span class="dollar">$</span>');
}
A.inline=function(s,seen){return inline(s,seen||null)};

/* table rows: split on | that are not inside `code` */
function splitRow(r){
  r=r.trim().replace(/^\|/,"").replace(/\|$/,"");
  var cells=[],cur="",code=false;
  for(var i=0;i<r.length;i++){var c=r[i];if(c==="`")code=!code;if(c==="|"&&!code&&r[i-1]!=="\\"){cells.push(cur.trim());cur="";continue}cur+=c}
  cells.push(cur.trim());return cells.map(function(c){return c.replace(/\\\|/g,"|")});
}
A.tableHTML=function(head,rows,cls,seen){
  var h='<div class="tw"><table class="'+(cls||"")+'">';
  if(head&&head.length)h+="<thead><tr>"+head.map(function(c){return "<th>"+inline(String(c),seen)+"</th>"}).join("")+"</tr></thead>";
  h+="<tbody>"+rows.map(function(r){var cells=r.cells||r;return "<tr"+(r.hl?' class="hlrow"':"")+">"+cells.map(function(c){return "<td>"+inline(String(c),seen)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>";
  return h;
};
/* raw cells (already-built HTML), for tables the engine builds itself */
A.rawTable=function(head,rows,cls){return '<div class="tw"><table class="'+(cls||"")+'"><thead><tr>'+head.map(function(c){return "<th>"+esc(c)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(r){return "<tr>"+r.map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>"};

A.renderRich=function(src,opt){
  if(src==null)return "";
  opt=opt||{};var seen=opt.seen||(opt.gloss?{}:null);
  var lines=String(src).replace(/\r/g,"").split("\n"),out=[],list=null,para=[],tbl=null,code=null,codeLang="",disp=null;
  function flushP(){if(para.length){out.push("<p>"+inline(para.join(" "),seen)+"</p>");para=[]}}
  function flushL(){if(list){out.push("</"+list+">");list=null}}
  function flushT(){if(!tbl)return;var sepIdx=tbl.findIndex(function(r){return /^\s*\|?[\s\-:|]+\|?\s*$/.test(r)&&r.indexOf("-")>=0});
    var rows=tbl.filter(function(r,i){return i!==sepIdx}).map(splitRow);
    out.push(sepIdx===1?A.tableHTML(rows[0],rows.slice(1),"",seen):A.tableHTML(null,rows,"",seen));tbl=null}
  lines.forEach(function(ln){
    var m;
    if(code!==null){if(/^\s*```\s*$/.test(ln)){while(code.length&&!code[code.length-1].trim())code.pop();out.push(A.codeHTML(code.join("\n"),codeLang,{compact:true}));code=null}else code.push(ln);return}
    if(disp!==null){if(/^\s*\$\$\s*$/.test(ln)){out.push('<div class="dm">'+esc("$$"+disp.join(" ")+"$$")+"</div>");disp=null}else disp.push(ln.trim());return}
    if((m=ln.match(/^\s*```\s*([\w+-]*)\s*$/))){flushP();flushL();flushT();code=[];codeLang=m[1]||opt.lang||"";return}
    if(/^\s*\$\$\s*$/.test(ln)){flushP();flushL();flushT();disp=[];return}
    if(/^\s*\|.*\|\s*$/.test(ln)){flushP();flushL();(tbl=tbl||[]).push(ln);return}
    flushT();
    if(/^\s*$/.test(ln)){flushP();flushL();return}
    if((m=ln.match(/^\s*[*\-•]\s+(.*)$/))){flushP();if(list!=="ul"){flushL();out.push("<ul>");list="ul"}out.push("<li>"+inline(m[1],seen)+"</li>");return}
    if((m=ln.match(/^\s*(\d+)[.)]\s+(.*)$/))){flushP();if(list!=="ol"){flushL();out.push('<ol start="'+(+m[1])+'">');list="ol"}out.push("<li>"+inline(m[2],seen)+"</li>");return}
    if((m=ln.match(/^#{2,4}\s+(.*)$/))){flushP();flushL();out.push("<h4>"+inline(m[1],seen)+"</h4>");return}
    if(/^\s*\$\$[\s\S]*\$\$\s*$/.test(ln)){flushP();flushL();out.push('<div class="dm">'+esc(ln.trim())+"</div>");return}
    if(list&&/^\s{2,}\S/.test(ln)){var last=out.pop();out.push(last.replace(/<\/li>$/,"<br>"+inline(ln.trim(),seen)+"</li>"));return}
    flushL();para.push(ln.trim());
  });
  flushP();flushL();flushT();
  if(code!==null)out.push(A.codeHTML(code.join("\n"),codeLang,{compact:true}));
  return out.join("");
};
A.md=A.renderRich;
A.plain=function(s){return String(s||"").replace(/```[\w]*|[`*=$\\]/g,"").replace(/\s+/g," ").trim()};
A.math=function(root){
  try{if(window.renderMathInElement)window.renderMathInElement(root,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],throwOnError:false,ignoredTags:["script","noscript","style","textarea","pre","code","option"]})}
  catch(e){console.error("katex",e)}
};

/* ---------- syntax highlighter: tokens are escaped one by one, so raw code never reaches the page ---------- */
var LANG={
  python:{kw:"def|class|if|elif|else|for|while|return|import|from|in|not|and|or|is|None|True|False|pass|break|continue|lambda|global|nonlocal|try|except|finally|raise|with|as|yield|assert|del",bi:"print|range|len|min|max|sorted|sum|abs|int|float|str|list|dict|set|tuple|map|filter|zip|enumerate|open|super|isinstance",com:"#"},
  javascript:{kw:"var|let|const|function|return|if|else|for|while|do|new|this|class|extends|import|export|from|of|in|typeof|instanceof|null|undefined|true|false|try|catch|finally|throw|async|await|switch|case|break|continue|default",bi:"console|document|window|JSON|Math|alert|fetch|parseInt|parseFloat",com:"//"},
  sql:{kw:"SELECT|FROM|WHERE|GROUP|BY|HAVING|ORDER|ASC|DESC|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|AND|OR|AS|JOIN|LEFT|INNER|ON|DISTINCT|LIMIT|INTEGER|TEXT|REAL|UNIQUE|IN|IS|LIKE|BETWEEN",bi:"COUNT|SUM|AVG|MIN|MAX",com:"--",ci:true},
  bash:{kw:"curl|python|python3|pip|export|cd|ls|echo|flask|sqlite3",bi:"",com:"#"},
  json:{kw:"true|false|null",bi:"",com:null},
  css:{kw:"",bi:"",com:null,css:true},
  html:{kw:"",bi:"",com:null,markup:true},
  jinja:{kw:"",bi:"",com:null,markup:true}
};
LANG.js=LANG.javascript;LANG.py=LANG.python;LANG.shell=LANG.bash;LANG.text={kw:"",bi:"",com:null};
function hlGeneric(line,L){
  var parts=["("+(L.com?L.com.replace(/[/]/g,"\\/")+".*$":"(?!)")+")",'("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')'];
  parts.push(L.kw?"\\b("+L.kw+")\\b":"((?!))");parts.push(L.bi?"\\b("+L.bi+")\\b":"((?!))");parts.push("\\b(\\d+\\.?\\d*)\\b");
  var re=new RegExp(parts.join("|"),L.ci?"gi":"g"),o="",last=0,m;
  while((m=re.exec(line))){
    if(!m[0]){re.lastIndex++;continue}
    o+=esc(line.slice(last,m.index));
    var k=m[1]?"c":m[2]?"s":m[3]?"k":m[4]?"f":"nu";
    o+='<span class="hl-'+k+'">'+esc(m[0])+"</span>";last=m.index+m[0].length;
  }
  return o+esc(line.slice(last));
}
function hlMarkup(line){
  var re=/(\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\})|(<!--.*?-->)|(<\/?[A-Za-z][\w-]*)|("[^"]*"|'[^']*')|(\/?>)/g,o="",last=0,m;
  while((m=re.exec(line))){
    o+=esc(line.slice(last,m.index));
    var k=m[1]?"j":m[2]?"c":m[3]?"k":m[4]?"s":"k";
    o+='<span class="hl-'+k+'">'+esc(m[0])+"</span>";last=m.index+m[0].length;
  }
  return o+esc(line.slice(last));
}
function hlCss(line){
  var re=/(\/\*.*?\*\/)|("[^"]*"|'[^']*')|([#.]?[A-Za-z][\w-]*(?=\s*[{,:\[]))|(\d+(?:px|em|rem|%)?)/g,o="",last=0,m;
  while((m=re.exec(line))){o+=esc(line.slice(last,m.index));var k=m[1]?"c":m[2]?"s":m[3]?"k":"nu";o+='<span class="hl-'+k+'">'+esc(m[0])+"</span>";last=m.index+m[0].length}
  return o+esc(line.slice(last));
}
A.guessLang=function(src){
  if(/^\s*(<!DOCTYPE|<html|<[a-z]+[\s>])/i.test(src)||/\{%|\{\{/.test(src))return "html";
  if(/^\s*(SELECT|CREATE|INSERT|UPDATE|DELETE)\b/i.test(src))return "sql";
  if(/^\s*curl\b/.test(src))return "bash";
  if(/^\s*[{[]/.test(src)&&/"\s*:/.test(src))return "json";
  if(/\b(def|import|print|return)\b/.test(src))return "python";
  return "text";
};
A.hl=function(line,lang){
  var L=LANG[lang]||LANG.text;
  if(L.markup)return hlMarkup(line);if(L.css)return hlCss(line);
  return hlGeneric(line,L);
};
A.codeHTML=function(src,lang,o){
  o=o||{};lang=lang||A.guessLang(src);
  var lines=String(src).split("\n");
  return '<div class="cb'+(o.compact?" cb-compact":"")+'" data-lang="'+esc(lang)+'"><div class="cb-head"><span>'+esc(o.title||lang)+'</span><button class="cb-copy" type="button">Copy</button></div><pre class="cb-pre"><code>'
    +lines.map(function(l,i){return '<span class="cb-ln"><span class="cb-n">'+(i+1)+'</span><span class="cb-t">'+(A.hl(l,lang)||" ")+"</span></span>"}).join("")+"</code></pre></div>";
};
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".cb-copy");if(!b)return;
  var txt=A.$$(".cb-t",b.closest(".cb")).map(function(x){return x.textContent}).join("\n");
  A.copy(txt,"Code copied");
});
A.copy=function(txt,msg){
  try{navigator.clipboard.writeText(txt).then(function(){A.toast(msg||"Copied")},function(){A.toast("Copy is blocked here; select the text instead")})}
  catch(e){A.toast("Copy is blocked here; select the text instead")}
};
A.toast=function(m){var t=A.el("div","toast",esc(m));t.setAttribute("role","status");document.body.appendChild(t);setTimeout(function(){t.remove()},2400)};

/* ---------- SVG drawers (graphs use fixed node positions; no auto-layout) ---------- */
A.graphSVG=function(g){
  var W=g.W||520,H=g.H||300,pos=g.nodes,ids=Object.keys(pos),r=g.r||18;
  var s='<svg class="fig-svg" viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(g.alt||"graph")+'"><defs><marker id="ga'+esc(g.id||"")+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mute)"/></marker></defs>';
  (g.edges||[]).forEach(function(e){
    var a=pos[e[0]],b=pos[e[1]];if(!a||!b)return;
    var dx=b[0]-a[0],dy=b[1]-a[1],L=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/L,uy=dy/L;
    var x1=a[0]+ux*r,y1=a[1]+uy*r,x2=b[0]-ux*(g.directed?r+3:r),y2=b[1]-uy*(g.directed?r+3:r);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="var(--unvisited)" stroke-width="1.8"'+(g.directed?' marker-end="url(#ga'+esc(g.id||"")+')"':"")+"/>";
    if(e[2]!=null){var mx=(x1+x2)/2,my=(y1+y2)/2;s+='<rect x="'+(mx-14)+'" y="'+(my-9)+'" width="28" height="17" rx="6" fill="var(--card)" stroke="var(--line2)"/><text x="'+mx+'" y="'+(my+4)+'" text-anchor="middle" font-size="11" fill="var(--ink)">'+esc(e[2])+"</text>"}
  });
  ids.forEach(function(v){var p=pos[v];s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="var(--card)" stroke="var(--ink2)" stroke-width="2"/><text x="'+p[0]+'" y="'+(p[1]+4)+'" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">'+esc(v)+"</text>"});
  return s+"</svg>";
};
/* o:{xs,series:[{name,ys}],title,xlabel,ylabel,W,H,marks:[[x,y,label]]} */
A.lineSVG=function(o){
  var W=o.W||560,H=o.H||300,m={l:54,r:24,t:o.title?30:14,b:40},xs=o.xs,all=[];o.series.forEach(function(se){se.ys.forEach(function(v){all.push(v)})});
  var ymax=o.ymax||Math.max.apply(null,all),xmin=xs[0],xmax=xs[xs.length-1];
  function X(x){return m.l+(x-xmin)/((xmax-xmin)||1)*(W-m.l-m.r)}function Y(v){return H-m.b-(v/(ymax||1))*(H-m.t-m.b)}
  var s='<svg class="fig-svg" viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||o.title||"line chart")+'">';
  if(o.title)s+='<text x="'+(W/2)+'" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">'+esc(o.title)+"</text>";
  for(var g=0;g<=4;g++){var y=m.t+(H-m.t-m.b)*(1-g/4);s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(m.l-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10.5" fill="var(--mute)">'+(+(ymax*g/4).toFixed(2))+"</text>"}
  (o.xticks||[xmin,xmax]).forEach(function(x){s+='<text x="'+X(x)+'" y="'+(H-m.b+16)+'" text-anchor="middle" font-size="10.5" fill="var(--mute)">'+esc(x)+"</text>"});
  if(o.xlabel)s+='<text x="'+((m.l+W-m.r)/2)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+esc(o.xlabel)+"</text>";
  o.series.forEach(function(se,i){var col=["var(--visited)","var(--frontier)","var(--ink2)"][i%3];s+='<polyline fill="none" stroke="'+col+'" stroke-width="2.4" points="'+xs.map(function(x,k){return X(x)+","+Y(se.ys[k])}).join(" ")+'"/>'});
  (o.marks||[]).forEach(function(p){s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="4.5" fill="var(--frontier)"/><text x="'+(X(p[0])+7)+'" y="'+(Y(p[1])-7)+'" font-size="11" fill="var(--ink)">'+esc(p[2]||"")+"</text>"});
  return s+"</svg>";
};
A.barSVG=function(o){
  var L=o.labels,V=o.values,W=o.W||520,H=o.H||220,m={l:40,r:10,t:12,b:40},n=V.length,max=Math.max.apply(null,V.concat([1])),bw=(W-m.l-m.r)/n;
  var s='<svg class="fig-svg" viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||"bar chart")+'">';
  V.forEach(function(v,i){var h=(H-m.t-m.b)*v/max,x=m.l+i*bw+bw*.15,w=bw*.7;s+='<rect x="'+x+'" y="'+(H-m.b-h)+'" width="'+w+'" height="'+h+'" rx="4" fill="var(--visited)" opacity=".85"/><text x="'+(x+w/2)+'" y="'+(H-m.b-h-4)+'" text-anchor="middle" font-size="11" fill="var(--ink)">'+esc(v)+'</text><text x="'+(x+w/2)+'" y="'+(H-m.b+15)+'" text-anchor="middle" font-size="10.5" fill="var(--mute)">'+esc(L[i])+"</text>"});
  return s+"</svg>";
};

/* ---------- storage: one store per subject, uids namespaced by exam ---------- */
var mem=null;A.storeOK=true;
A.storeKey=function(){return "nerdhub:"+A.manifest.slug+":v"+A.manifest.dataVersion};
function blank(){return {v:A.manifest?A.manifest.dataVersion:1,ans:{},read:{},flash:{},steps:{},prefs:{},shaky:{},bkt:{},teach:{},moves:{},savedAt:0}}
var FIELDS=["ans","read","flash","steps","prefs","shaky","bkt","teach","moves"];
function norm(o){o=o&&typeof o==="object"?o:blank();FIELDS.forEach(function(k){if(!o[k]||typeof o[k]!=="object")o[k]={}});return o}
A.migrate=function(){
  /* older dataVersions of this subject, then legacyStorageKeys; the first one found is copied, never deleted */
  var M=A.manifest,cands=[];
  for(var v=M.dataVersion-1;v>=1;v--)cands.push("nerdhub:"+M.slug+":v"+v);
  (M.legacyStorageKeys||[]).forEach(function(k){cands.push(k)});
  for(var i=0;i<cands.length;i++){
    try{var r=localStorage.getItem(cands[i]);if(r){var o=norm(JSON.parse(r));o.migratedFrom=cands[i];o.v=M.dataVersion;return o}}catch(e){}
  }
  return null;
};
A.load=function(){
  if(mem)return mem;
  try{var r=localStorage.getItem(A.storeKey());mem=r?norm(JSON.parse(r)):(A.migrate()||blank())}
  catch(e){A.storeOK=false;mem=blank()}
  return mem;
};
A.save=function(){mem.savedAt=Date.now();try{localStorage.setItem(A.storeKey(),JSON.stringify(mem))}catch(e){A.storeOK=false}};
A.replaceState=function(o){mem=norm(o);A.save()};
A.exportState=function(){return JSON.stringify({app:"nerdhub",slug:A.manifest.slug,v:A.manifest.dataVersion,engine:A.ENGINE_VERSION,exportedAt:Date.now(),state:A.load()})};
A.importState=function(t){
  var o=JSON.parse(t);
  if(!o||o.slug!==A.manifest.slug||typeof o.state!=="object")throw new Error("not a "+A.manifest.slug+" export");
  mem=norm(o.state);mem.v=A.manifest.dataVersion;A.save();
};
A.resetState=function(){try{localStorage.removeItem(A.storeKey())}catch(e){}mem=blank()};

/* ---------- exam scoping ---------- */
A.examIds=function(){return Object.keys(A.manifest.exams).filter(function(k){return A.manifest.exams[k].status!=="hidden"})};
A.exam=function(){var S=A.load(),e=S.prefs.exam||A.manifest.defaultExam;return e==="all"||A.manifest.exams[e]?e:A.manifest.defaultExam};
A.setExam=function(e){var S=A.load();S.prefs.exam=e;A.save()};
A.examInfo=function(e){e=e||A.exam();if(e==="all")return {label:"Full course",weeks:A.manifest.weeks.map(function(w){return w.num}),newWeeks:[],status:"ready"};return A.manifest.exams[e]};
A.examLabel=function(e){return A.examInfo(e).label};
A.topicMeta=function(id){return A.manifest.topics.find(function(m){return m.id===id})};
A.examTopics=function(e){var W=A.examInfo(e).weeks;return A.manifest.topics.filter(function(m){return m.weeks.some(function(w){return W.indexOf(w)>=0})})};
A.blockOf=function(m){var w=Math.min.apply(null,m.weeks);var b=Math.floor((w-1)/4);return (b*4+1)+"-"+(b*4+4)};
/* PYQs of a topic for the active exam: scope "exam" (default) = this exam's pack, "all" = every exam's pack */
A.scope=function(){return A.load().prefs.scope||"exam"};
A.pyqsOf=function(id,e,scope){
  e=e||A.exam();scope=scope||A.scope();var out=[];
  var exams=(e==="all"||scope==="all")?Object.keys(A.packs):[e];
  exams.forEach(function(x){var pk=A.packs[x]&&A.packs[x][id];if(pk)out=out.concat(pk.pyqs)});
  return out;
};
A.packOf=function(id,e){e=e||A.exam();if(e==="all"){var k=Object.keys(A.packs).find(function(x){return A.packs[x][id]});return k?A.packs[k][id]:null}return A.packs[e]&&A.packs[e][id]};
A.allPyqs=function(e,scope){var out=[];A.examTopics(e).forEach(function(m){out=out.concat(A.pyqsOf(m.id,e,scope))});return out};
A.findPyq=function(ref){
  var hit=null;Object.keys(A.packs).forEach(function(x){Object.keys(A.packs[x]).forEach(function(t){A.packs[x][t].pyqs.forEach(function(q){if(q.uid===ref||q.id===ref)hit=hit||q})})});
  return hit;
};
A.isReady=function(m){return m&&m.status==="ready"&&!!A.topics[m.id]};

/* ---------- live counts (counts.js is the generated, checked copy) ---------- */
A.liveCounts=function(){
  var out={exams:{}};
  Object.keys(A.packs).forEach(function(ex){
    var E=out.exams[ex]={pyqs:0,marks:0,papers:[],topics:{},blocks:{}};
    Object.keys(A.packs[ex]).forEach(function(tid){
      var m=A.topicMeta(tid),T=E.topics[tid]={pyqs:0,marks:0,subs:{}};
      A.packs[ex][tid].pyqs.forEach(function(q){
        var mk=+q.marks||0;T.pyqs++;T.marks+=mk;E.pyqs++;E.marks+=mk;
        if(E.papers.indexOf(q.paper)<0)E.papers.push(q.paper);
        var s=T.subs[q.sub]=T.subs[q.sub]||{pyqs:0,marks:0};s.pyqs++;s.marks+=mk;
        if(m){var b=A.blockOf(m);E.blocks[b]=(E.blocks[b]||0)+mk}
      });
    });
  });
  return out;
};
A.countsFor=function(e){var C=A.counts&&A.counts.exams?A.counts:A.liveCounts();if(e!=="all")return C.exams[e]||{pyqs:0,marks:0,papers:[],topics:{},blocks:{}};
  var o={pyqs:0,marks:0,papers:[],topics:{},blocks:{}};Object.keys(C.exams).forEach(function(k){var E=C.exams[k];o.pyqs+=E.pyqs;o.marks+=E.marks;o.papers=o.papers.concat(E.papers);
    Object.keys(E.topics).forEach(function(t){var T=o.topics[t]=o.topics[t]||{pyqs:0,marks:0,subs:{}};T.pyqs+=E.topics[t].pyqs;T.marks+=E.topics[t].marks});
    Object.keys(E.blocks).forEach(function(b){o.blocks[b]=(o.blocks[b]||0)+E.blocks[b]})});return o};
A.paperTime=function(p){var t=Date.parse(/^\d/.test(p)?p:"01 "+p);return isNaN(t)?0:t};
A.fmt=function(n){return String(+(+n).toFixed(2))};
A.days=function(d){if(!d)return null;var t=new Date(d+"T09:00:00");if(isNaN(t))return null;return Math.ceil((t-Date.now())/864e5)};
A.examDate=function(e){var S=A.load();return (S.prefs.examDates||{})[e]||(A.manifest.exams[e]&&A.manifest.exams[e].examDate)||""};
})();
