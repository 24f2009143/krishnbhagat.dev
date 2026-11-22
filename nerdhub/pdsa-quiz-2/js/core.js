/* PDSA engine core: escape, markdown-lite, glossary, math, SVG drawers, storage */
window.PDSA = window.PDSA || {topics:{}, glossary:[], refreshers:[], widgets:{}, manifest:null};
(function(){
var P = window.PDSA;
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
P.esc = esc;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
P.$=$;P.$$=$$;
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
P.el=el;

/* ---------- glossary linking ---------- */
var glRe=null, glMap={};
P.buildGlossary=function(){
  var terms=[];glMap={};
  P.glossary.forEach(function(g,i){([g.term].concat(g.alias||[])).forEach(function(t){glMap[t.toLowerCase()]=i;terms.push(t)})});
  terms.sort(function(a,b){return b.length-a.length});
  if(!terms.length){glRe=null;return}
  glRe=new RegExp("(^|[^A-Za-z0-9_])("+terms.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("|")+")(?![A-Za-z0-9_])","gi");
};
function glossify(html,seen){
  if(!glRe) return html;
  return html.split(/(<[^>]+>)/).map(function(seg){
    if(seg.charAt(0)==="<") return seg;
    return seg.replace(glRe,function(m,pre,t){
      var k=t.toLowerCase(), gi=glMap[k]; if(gi==null||seen[gi]) return m;
      seen[gi]=1; return pre+'<span class="gl" data-g="'+gi+'" tabindex="0">'+t+'</span>';
    });
  }).join("");
}

/* ---------- inline + block markdown-lite (everything escaped; math $..$ kept for KaTeX) ---------- */
function inlineText(t){
  t=esc(t);
  t=t.replace(/\[ADDED\]\s*/g,'<span class="added" title="Added example, not from a past paper">Added</span>');
  t=t.replace(/\*\*([^*]+?)\*\*/g,"<strong>$1</strong>");
  t=t.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g,"$1<em>$2</em>");
  t=t.replace(/==([^=]+?)==/g,"<mark>$1</mark>");
  return t;
}
function inline(s,seen){
  var out="", parts=String(s).split("`");
  for(var i=0;i<parts.length;i++){
    if(i%2===1){out+="<code>"+esc(parts[i])+"</code>";continue}
    var re=/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g,last=0,m,seg=parts[i];
    var buf="",maths=[];
    while((m=re.exec(seg))){buf+=inlineText(seg.slice(last,m.index))+"\u0001"+maths.length+"\u0002";maths.push(esc(m[0]));last=m.index+m[0].length}
    buf+=inlineText(seg.slice(last));
    buf=glossify(buf,seen||{});
    out+=buf.replace(/\u0001(\d+)\u0002/g,function(_,i){return maths[+i]});
  }
  return out;
}
P.inline=function(s){return inline(s,{})};
P.md=function(src){
  if(src==null) return "";
  var seen={}, lines=String(src).replace(/\r/g,"").split("\n"), out=[], list=null, para=[];
  function flushP(){if(para.length){out.push("<p>"+inline(para.join(" "),seen)+"</p>");para=[]}}
  function flushL(){if(list){out.push("</"+list+">");list=null}}
  var tbl=null,code=null,disp=null;
  function flushT(){if(tbl){var rows=tbl.filter(function(r){return !/^\|?[\s\-:|]+\|?$/.test(r)}).map(function(r){return r.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(function(c){return c.trim()})});
    out.push(P.tableHTML?P.tableHTML(rows[0],rows.slice(1)):"");tbl=null}}
  lines.forEach(function(ln){
    var m;
    if(code!==null){if(/^\s*```/.test(ln)){out.push('<pre class="mdcode"><code>'+esc(code.join("\n"))+"</code></pre>");code=null}else code.push(ln);return}
    if(disp!==null){if(/^\s*\$\$\s*$/.test(ln)){out.push('<div class="dm">'+esc("$$"+disp.join(" ")+"$$")+"</div>");disp=null}else disp.push(ln.trim());return}
    if(/^\s*```/.test(ln)){flushP();flushL();flushT();code=[];return}
    if(/^\s*\$\$\s*$/.test(ln)){flushP();flushL();flushT();disp=[];return}
    if(/^\s*\|/.test(ln)){flushP();flushL();(tbl=tbl||[]).push(ln);return}
    flushT();
    if(/^\s*$/.test(ln)){flushP();flushL();return}
    if((m=ln.match(/^\s*[*]\s+(.*)$/))){flushP();if(list!=="ul"){flushL();out.push("<ul>");list="ul"}out.push("<li>"+inline(m[1],seen)+"</li>");return}
    if((m=ln.match(/^\s*[-•]\s+(.*)$/))){flushP();if(list!=="ul"){flushL();out.push("<ul>");list="ul"}out.push("<li>"+inline(m[1],seen)+"</li>");return}
    if((m=ln.match(/^\s*(\d+)[.)]\s+(.*)$/))){flushP();if(list!=="ol"){flushL();out.push("<ol>");list="ol"}out.push("<li>"+inline(m[2],seen)+"</li>");return}
    if((m=ln.match(/^###\s+(.*)$/))){flushP();flushL();out.push("<h4>"+inline(m[1],seen)+"</h4>");return}
    if(/^\$\$[\s\S]*\$\$\s*$/.test(ln)){flushP();flushL();out.push('<div class="dm">'+esc(ln.trim())+"</div>");return}
    flushL();para.push(ln.trim());
  });
  flushP();flushL();flushT();
  if(code!==null)out.push('<pre class="mdcode"><code>'+esc(code.join("\n"))+"</code></pre>");
  return out.join("");
};
P.plain=function(src){return String(src||"").replace(/[`*=$\\]/g,"").replace(/\s+/g," ").trim()};

P.math=function(root){
  try{
    if(window.renderMathInElement) window.renderMathInElement(root,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],throwOnError:false,ignoredTags:["script","noscript","style","textarea","pre","code","option"]});
  }catch(e){console.error("katex",e)}
};

/* ---------- python highlighter ---------- */
var KW="def|class|if|elif|else|for|while|return|import|from|in|not|and|or|is|None|True|False|pass|break|continue|lambda|global|try|except|raise|with|as|yield";
var BI="print|range|len|min|max|sorted|sum|abs|int|float|list|dict|set|append|insert|pop|sort|reverse";
P.pyHL=function(line){
  var re=new RegExp("(#.*$)|(\"[^\"]*\"|'[^']*')|\\b("+KW+")\\b|\\b("+BI+")(?=\\()|\\b(\\d+\\.?\\d*)\\b","g"),o="",last=0,m;
  while((m=re.exec(line))){
    o+=esc(line.slice(last,m.index));
    if(m[1])o+='<span class="c">'+esc(m[1])+"</span>";
    else if(m[2])o+='<span class="s">'+esc(m[2])+"</span>";
    else if(m[3])o+='<span class="k">'+m[3]+"</span>";
    else if(m[4])o+='<span class="f">'+m[4]+"</span>";
    else o+='<span class="nu">'+m[5]+"</span>";
    last=m.index+m[0].length;
  }
  return o+esc(line.slice(last));
};

/* ---------- SVG drawers ---------- */
var NS="http://www.w3.org/2000/svg";
function fr(nodes,edges,W,H,fixed){
  var n=nodes.length,pos={},R=Math.min(W,H)/2-50;
  nodes.forEach(function(v,i){
    if(fixed&&fixed[v]){pos[v]={x:fixed[v][0],y:fixed[v][1]}} else {var a=2*Math.PI*i/n-Math.PI/2;pos[v]={x:W/2+R*Math.cos(a),y:H/2+R*Math.sin(a)}}
  });
  if(fixed&&Object.keys(fixed).length===n) return pos;
  var k=Math.sqrt(W*H/n)*0.75;
  for(var it=0;it<260;it++){
    var d={};nodes.forEach(function(v){d[v]={x:0,y:0}});
    for(var i=0;i<n;i++)for(var j=i+1;j<n;j++){
      var a=pos[nodes[i]],b=pos[nodes[j]],dx=a.x-b.x,dy=a.y-b.y,L=Math.sqrt(dx*dx+dy*dy)||0.01,f=k*k/L;
      d[nodes[i]].x+=dx/L*f;d[nodes[i]].y+=dy/L*f;d[nodes[j]].x-=dx/L*f;d[nodes[j]].y-=dy/L*f;
    }
    edges.forEach(function(e){var a=pos[e[0]],b=pos[e[1]],dx=a.x-b.x,dy=a.y-b.y,L=Math.sqrt(dx*dx+dy*dy)||0.01,f=L*L/k;
      d[e[0]].x-=dx/L*f;d[e[0]].y-=dy/L*f;d[e[1]].x+=dx/L*f;d[e[1]].y+=dy/L*f});
    var t=(1-it/260)*W/8+1;
    nodes.forEach(function(v){
      if(fixed&&fixed[v])return;
      var dd=d[v],L=Math.sqrt(dd.x*dd.x+dd.y*dd.y)||0.01;
      pos[v].x+=dd.x/L*Math.min(L,t);pos[v].y+=dd.y/L*Math.min(L,t);
    });
  }
  var xs=nodes.map(function(v){return pos[v].x}),ys=nodes.map(function(v){return pos[v].y});
  var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
  nodes.forEach(function(v){
    pos[v].x=40+(x1===x0?(W-80)/2:(pos[v].x-x0)/(x1-x0)*(W-80));
    pos[v].y=34+(y1===y0?(H-68)/2:(pos[v].y-y0)/(y1-y0)*(H-68));
  });
  return pos;
}
/* g:{nodes,edges:[[u,v,w]],directed,pos,hl:{edges:[idx],nodes:[...]},W,H,label:false} */
P.graphSVG=function(g){
  var W=g.W||520,H=g.H||300,nodes=g.nodes,edges=g.edges,pos=fr(nodes,edges,W,H,g.pos);
  var hlE={};(g.hlEdges||[]).forEach(function(i){hlE[i]=1});
  var hlN={};(g.hlNodes||[]).forEach(function(v){hlN[v]=1});
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(g.alt||"graph")+'"><defs><marker id="ga'+(g.id||"")+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mute)"/></marker><marker id="gh'+(g.id||"")+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--visited)"/></marker></defs>';
  var pair={};
  edges.forEach(function(e){var k=e[0]+">"+e[1];pair[k]=1});
  edges.forEach(function(e,i){
    var a=pos[e[0]],b=pos[e[1]],dx=b.x-a.x,dy=b.y-a.y,L=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/L,uy=dy/L,r=18;
    var curved=g.directed&&pair[e[1]+">"+e[0]],off=curved?16:0,nx=-uy,ny=ux;
    var x1=a.x+ux*r,y1=a.y+uy*r,x2=b.x-ux*(g.directed?r+3:r),y2=b.y-uy*(g.directed?r+3:r);
    var cx=(x1+x2)/2+nx*off*2,cy=(y1+y2)/2+ny*off*2,hl=hlE[i];
    var col=hl?"var(--visited)":"var(--unvisited)",sw=hl?3.2:1.8;
    if(curved) s+='<path d="M'+x1+" "+y1+" Q"+cx+" "+cy+" "+x2+" "+y2+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'"'+(g.directed?' marker-end="url(#'+(hl?"gh":"ga")+(g.id||"")+')"':"")+"/>";
    else s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="'+sw+'"'+(g.directed?' marker-end="url(#'+(hl?"gh":"ga")+(g.id||"")+')"':"")+"/>";
    if(e[2]!=null){
      var mx=curved?(x1+2*cx+x2)/4:(x1+x2)/2,my=curved?(y1+2*cy+y2)/4:(y1+y2)/2,t=String(e[2]);
      s+='<rect x="'+(mx-9-(t.length-1)*3.2)+'" y="'+(my-9)+'" width="'+(18+(t.length-1)*6.4)+'" height="17" rx="6" fill="var(--card)" stroke="var(--line2)"/><text x="'+mx+'" y="'+(my+4)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+(hl?"var(--visited)":"var(--ink)")+'">'+esc(t)+"</text>";
    }
  });
  nodes.forEach(function(v){
    var p=pos[v],h=hlN[v];
    s+='<circle cx="'+p.x+'" cy="'+p.y+'" r="18" fill="'+(h?"var(--visited)":"var(--card)")+'" stroke="'+(h?"var(--visited)":"var(--ink2)")+'" stroke-width="2.4"/><text x="'+p.x+'" y="'+(p.y+5)+'" text-anchor="middle" font-size="14" font-weight="700" fill="'+(h?"var(--surface)":"var(--ink)")+'">'+esc(v)+"</text>";
  });
  return s+"</svg>";
};
/* tree: {v,l,r,c?(class: 'hl'|'bad'), s?(sub label)} */
P.treeSVG=function(t,opt){
  opt=opt||{};var items=[],idx=0;
  function lay(n,d){if(!n)return;lay(n.l,d+1);n._x=idx++;n._d=d;items.push(n);lay(n.r,d+1)}
  lay(t,0);
  var maxd=Math.max.apply(null,items.map(function(n){return n._d})),dx=opt.dx||42,dy=opt.dy||58,W=Math.max(180,idx*dx+30),H=(maxd+1)*dy+30;
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(opt.alt||"binary tree")+'" style="max-width:'+Math.min(W,760)+'px">';
  function X(n){return 24+n._x*dx} function Y(n){return 28+n._d*dy}
  items.forEach(function(n){[n.l,n.r].forEach(function(c){if(c)s+='<line x1="'+X(n)+'" y1="'+Y(n)+'" x2="'+X(c)+'" y2="'+Y(c)+'" stroke="var(--unvisited)" stroke-width="1.8"/>'})});
  items.forEach(function(n){
    var c=n.c,fill=c==="hl"?"var(--frontier-soft)":c==="bad"?"var(--error-soft)":"var(--card)",st=c==="bad"?"var(--error)":c==="hl"?"var(--frontier)":"var(--ink2)";
    s+='<circle cx="'+X(n)+'" cy="'+Y(n)+'" r="16" fill="'+fill+'" stroke="'+st+'" stroke-width="2.2"/><text x="'+X(n)+'" y="'+(Y(n)+5)+'" text-anchor="middle" font-size="13" font-weight="700" fill="'+(c?"#17242C":"var(--ink)")+'">'+esc(n.v)+"</text>";
    if(n.s!=null) s+='<text x="'+(X(n)+19)+'" y="'+(Y(n)-12)+'" font-size="10.5" fill="var(--mute)" font-weight="600">'+esc(n.s)+"</text>";
  });
  return s+"</svg>";
};
/* heap: array drawn as complete tree + array strip */
P.heapSVG=function(a,opt){
  opt=opt||{};var n=a.length,lv=Math.floor(Math.log2(n))+1,W=Math.max(300,Math.pow(2,lv-1)*40+20),H=lv*52+70,hl=opt.hl||[];
  var pos=[];for(var i=0;i<n;i++){var d=Math.floor(Math.log2(i+1)),k=i+1-Math.pow(2,d),cnt=Math.pow(2,d);pos.push([W*(k+0.5)/cnt,26+d*52])}
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(opt.alt||"heap")+'" style="max-width:'+Math.min(W,720)+'px">';
  for(var i=1;i<n;i++){var p=Math.floor((i-1)/2);s+='<line x1="'+pos[p][0]+'" y1="'+pos[p][1]+'" x2="'+pos[i][0]+'" y2="'+pos[i][1]+'" stroke="var(--unvisited)" stroke-width="1.7"/>'}
  for(var i=0;i<n;i++){var h=hl.indexOf(i)>=0;s+='<circle cx="'+pos[i][0]+'" cy="'+pos[i][1]+'" r="16" fill="'+(h?"var(--frontier-soft)":"var(--card)")+'" stroke="'+(h?"var(--frontier)":"var(--ink2)")+'" stroke-width="2.2"/><text x="'+pos[i][0]+'" y="'+(pos[i][1]+5)+'" text-anchor="middle" font-size="13" font-weight="700" fill="'+(h?"#17242C":"var(--ink)")+'">'+esc(a[i])+'</text><text x="'+(pos[i][0]+17)+'" y="'+(pos[i][1]-11)+'" font-size="9.5" fill="var(--mute)">'+i+"</text>"}
  var bw=Math.min(36,(W-20)/n),y0=lv*52+16;
  for(var i=0;i<n;i++){var x=10+i*bw;s+='<rect x="'+x+'" y="'+y0+'" width="'+bw+'" height="26" fill="var(--card)" stroke="var(--line2)"/><text x="'+(x+bw/2)+'" y="'+(y0+17)+'" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">'+esc(a[i])+'</text><text x="'+(x+bw/2)+'" y="'+(y0+39)+'" text-anchor="middle" font-size="9" fill="var(--mute)">'+i+"</text>"}
  return s+"</svg>";
};
P.arrSVG=function(a,opt){
  opt=opt||{};var bw=opt.bw||38,W=a.length*bw+20,hl=opt.hl||[],s='<svg viewBox="0 0 '+W+' 62" role="img" aria-label="array" style="max-width:'+W+'px">';
  a.forEach(function(v,i){var x=10+i*bw,h=hl.indexOf(i)>=0;s+='<rect x="'+x+'" y="6" width="'+bw+'" height="30" fill="'+(h?"var(--frontier-soft)":"var(--card)")+'" stroke="var(--mute)"/><text x="'+(x+bw/2)+'" y="26" text-anchor="middle" font-size="13" font-weight="700" fill="'+(h?"#17242C":"var(--ink)")+'">'+esc(v)+'</text><text x="'+(x+bw/2)+'" y="50" text-anchor="middle" font-size="10" fill="var(--mute)">'+i+"</text>"});
  return s+"</svg>";
};


/* ---------- more drawers: bars, lines, timeline, scatter, array rows ---------- */
var PAL=["var(--visited)","var(--frontier)","var(--ink2)","var(--error)","var(--unvisited)","#2B5FA6","#7B4BB0"];
P.PAL=PAL;
function nice(v){var p=Math.pow(10,Math.floor(Math.log10(v||1))),f=v/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p}
P.barSVG=function(o){
  var L=o.labels,V=o.values,W=o.W||520,H=o.H||240,m={l:46,r:12,t:o.title?30:12,b:44},n=V.length,max=nice(Math.max.apply(null,V)),bw=(W-m.l-m.r)/n,hl=o.hl||[];
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||o.title||"bar chart")+'">';
  if(o.title)s+='<text x="'+(W/2)+'" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">'+esc(o.title)+"</text>";
  for(var g=0;g<=4;g++){var y=m.t+(H-m.t-m.b)*(1-g/4);s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(m.l-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10.5" fill="var(--mute)">'+(max*g/4)+"</text>"}
  V.forEach(function(v,i){var h=(H-m.t-m.b)*v/max,x=m.l+i*bw+bw*0.15,w=bw*0.7,col=hl.indexOf(i)>=0?"var(--frontier)":(o.color||"var(--ink2)");
    s+='<rect x="'+x+'" y="'+(H-m.b-h)+'" width="'+w+'" height="'+h+'" rx="5" fill="'+col+'" opacity="'+(hl.length&&hl.indexOf(i)<0?0.55:0.95)+'"/><text x="'+(x+w/2)+'" y="'+(H-m.b-h-5)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">'+v+'</text><text x="'+(x+w/2)+'" y="'+(H-m.b+16)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+esc(L[i])+"</text>"});
  if(o.xlabel)s+='<text x="'+(W/2)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+esc(o.xlabel)+"</text>";
  return s+"</svg>";
};
/* o:{xs,series:[{name,ys}],logy,title,W,H} */
P.lineSVG=function(o){
  var W=o.W||560,H=o.H||300,m={l:54,r:110,t:o.title?30:14,b:36},xs=o.xs,all=[];o.series.forEach(function(se){se.ys.forEach(function(v){all.push(v)})});
  var ymax=Math.max.apply(null,all),ymin=o.logy?1:0,xmax=xs[xs.length-1],xmin=xs[0];
  function X(x){return m.l+(x-xmin)/(xmax-xmin)*(W-m.l-m.r)} function Y(v){if(o.logy){v=Math.max(v,1);return H-m.b-(Math.log10(v)/Math.log10(ymax))*(H-m.t-m.b)}return H-m.b-(v/ymax)*(H-m.t-m.b)}
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||o.title||"growth chart")+'">';
  if(o.title)s+='<text x="'+(W/2)+'" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">'+esc(o.title)+"</text>";
  for(var g=0;g<=4;g++){var y=m.t+(H-m.t-m.b)*(1-g/4),val=o.logy?Math.round(Math.pow(ymax,g/4)):Math.round(ymax*g/4);s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(m.l-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10.5" fill="var(--mute)">'+val+"</text>"}
  [xmin,Math.round((xmin+xmax)/2),xmax].forEach(function(x){s+='<text x="'+X(x)+'" y="'+(H-m.b+16)+'" text-anchor="middle" font-size="11" fill="var(--mute)">'+x+"</text>"});
  s+='<text x="'+((m.l+W-m.r)/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="11" fill="var(--mute)">n</text>';
  o.series.forEach(function(se,i){var col=se.color||PAL[i%PAL.length],pts=xs.map(function(x,k){return X(x)+","+Y(se.ys[k])}).join(" ");
    s+='<polyline fill="none" stroke="'+col+'" stroke-width="2.6" points="'+pts+'"/>';
    var lx=W-m.r+8,ly=Math.max(m.t+6,Math.min(H-m.b-4,Y(se.ys[se.ys.length-1])));s+='<text x="'+lx+'" y="'+(ly+4)+'" font-size="12" font-weight="700" fill="'+col+'">'+esc(se.name)+"</text>"});
  return s+"</svg>";
};
/* items:[{name,s,e,hl,row}] */
P.timelineSVG=function(o){
  var it=o.items.map(function(x,i){return {name:x.name,s:x.s,e:x.e,hl:x.hl,row:x.row,i:i}}),W=o.W||560,m={l:58,r:14,t:o.title?30:14,b:30};
  var tmin=o.tmin!=null?o.tmin:Math.min.apply(null,it.map(function(x){return x.s})),tmax=o.tmax!=null?o.tmax:Math.max.apply(null,it.map(function(x){return x.e}));
  var rows=0;if(it.some(function(x){return x.row==null})){var ends=[];it.slice().sort(function(a,b){return a.s-b.s||a.e-b.e}).forEach(function(x){if(x.row!=null)return;var r=0;while(ends[r]!=null&&ends[r]>x.s)r++;x.row=r;ends[r]=x.e})}
  rows=Math.max.apply(null,it.map(function(x){return x.row}))+1;var rh=o.rowH||26,H=m.t+rows*rh+m.b;
  function X(t){return m.l+(t-tmin)/(tmax-tmin)*(W-m.l-m.r)}
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||o.title||"timeline")+'">';
  if(o.title)s+='<text x="'+(W/2)+'" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">'+esc(o.title)+"</text>";
  for(var t=Math.ceil(tmin);t<=tmax;t++){s+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="var(--line)"/><text x="'+X(t)+'" y="'+(H-m.b+15)+'" text-anchor="middle" font-size="10.5" fill="var(--mute)">'+t+"</text>"}
  for(var r=0;r<rows;r++)s+='<text x="'+(m.l-8)+'" y="'+(m.t+r*rh+rh/2+4)+'" text-anchor="end" font-size="10.5" fill="var(--mute)">'+(o.rowLabel?o.rowLabel+" ":"")+(r+1)+"</text>";
  it.forEach(function(x){var col=x.hl==="bad"?"var(--error)":x.hl?"var(--visited)":"var(--unvisited)",y=m.t+x.row*rh+3;
    s+='<rect x="'+X(x.s)+'" y="'+y+'" width="'+Math.max(4,X(x.e)-X(x.s)-1)+'" height="'+(rh-8)+'" rx="5" fill="'+col+'" opacity="'+(x.hl?0.95:0.5)+'"/><text x="'+((X(x.s)+X(x.e))/2)+'" y="'+(y+(rh-8)/2+4)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">'+esc(x.name)+"</text>"});
  return s+"</svg>";
};
/* o:{pts:[[x,y,label]],line:x,strip:[x0,x1],pair:[i,j],xr,yr} */
P.scatterSVG=function(o){
  var W=o.W||520,H=o.H||330,m={l:36,r:14,t:16,b:30},xr=o.xr||[0,10],yr=o.yr||[0,10];
  function X(x){return m.l+(x-xr[0])/(xr[1]-xr[0])*(W-m.l-m.r)} function Y(y){return H-m.b-(y-yr[0])/(yr[1]-yr[0])*(H-m.t-m.b)}
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||"points in the plane")+'">';
  for(var x=Math.ceil(xr[0]);x<=xr[1];x++)s+='<line x1="'+X(x)+'" x2="'+X(x)+'" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="var(--line)"/><text x="'+X(x)+'" y="'+(H-m.b+14)+'" text-anchor="middle" font-size="10" fill="var(--mute)">'+x+"</text>";
  for(var y=Math.ceil(yr[0]);y<=yr[1];y++)s+='<line y1="'+Y(y)+'" y2="'+Y(y)+'" x1="'+m.l+'" x2="'+(W-m.r)+'" stroke="var(--line)"/><text x="'+(m.l-6)+'" y="'+(Y(y)+3)+'" text-anchor="end" font-size="10" fill="var(--mute)">'+y+"</text>";
  if(o.strip)s+='<rect x="'+X(o.strip[0])+'" y="'+m.t+'" width="'+(X(o.strip[1])-X(o.strip[0]))+'" height="'+(H-m.t-m.b)+'" fill="var(--frontier)" opacity="0.14"/>';
  if(o.line!=null)s+='<line x1="'+X(o.line)+'" x2="'+X(o.line)+'" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="var(--frontier)" stroke-width="2" stroke-dasharray="6 4"/>';
  if(o.pair){var a=o.pts[o.pair[0]],b=o.pts[o.pair[1]];s+='<line x1="'+X(a[0])+'" y1="'+Y(a[1])+'" x2="'+X(b[0])+'" y2="'+Y(b[1])+'" stroke="var(--visited)" stroke-width="3.4"/>'}
  o.pts.forEach(function(p,i){var left=o.line!=null&&p[0]<=o.line,col=o.line==null?"var(--ink2)":left?"var(--ink2)":"var(--frontier)";s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="6.5" fill="'+col+'" stroke="#fff" stroke-width="1.5"/><text x="'+(X(p[0])+9)+'" y="'+(Y(p[1])-8)+'" font-size="11" font-weight="700" fill="var(--ink)">'+esc(p[2]||("("+p[0]+","+p[1]+")"))+"</text>"});
  return s+"</svg>";
};
/* rows:[{label,arr,hl,mark}] stacked array strips */
P.rowsSVG=function(o){
  var rows=o.rows,bw=o.bw||34,mx=Math.max.apply(null,rows.map(function(r){return r.arr.length})),W=100+mx*bw+16,H=rows.length*(o.rh||44)+10;
  var s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+esc(o.alt||"arrays")+'">';
  rows.forEach(function(r,k){var y=6+k*(o.rh||44);s+='<text x="92" y="'+(y+21)+'" text-anchor="end" font-size="11.5" font-weight="600" fill="var(--mute)">'+esc(r.label||"")+"</text>";
    r.arr.forEach(function(v,i){var x=100+i*bw,h=(r.hl||[]).indexOf(i)>=0,bad=(r.bad||[]).indexOf(i)>=0;s+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="30" fill="'+(bad?"var(--error-soft)":h?"var(--frontier-soft)":"var(--card)")+'" stroke="'+(bad?"var(--error)":"var(--mute)")+'"/><text x="'+(x+bw/2)+'" y="'+(y+20)+'" text-anchor="middle" font-size="13" font-weight="700" fill="'+(h||bad?"#17242C":"var(--ink)")+'">'+esc(v)+"</text>"});
    if(r.note)s+='<text x="'+(100+r.arr.length*bw+8)+'" y="'+(y+20)+'" font-size="11" fill="var(--mute)">'+esc(r.note)+"</text>"});
  return s+"</svg>";
};

/* ---------- storage ---------- */
var KEY="pdsa-q2-v1",mem=null;P.storeOK=true;
function blank(){return {ans:{},read:{},flash:{},steps:{},solved:{},prefs:{}}}
P.load=function(){if(mem)return mem;try{var r=localStorage.getItem(KEY);mem=r?JSON.parse(r):blank()}catch(e){P.storeOK=false;mem=blank()}
  ["ans","read","flash","steps","solved","prefs"].forEach(function(k){mem[k]=mem[k]||{}});return mem};
P.save=function(){try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){P.storeOK=false}};
P.exportState=function(){return JSON.stringify({v:1,state:P.load()})};
P.importState=function(t){var o=JSON.parse(t);if(!o||o.v!==1||typeof o.state!=="object")throw new Error("bad");mem=o.state;P.load();P.save()};
P.toast=function(m){var t=el("div","toast",esc(m));document.body.appendChild(t);setTimeout(function(){t.remove()},2200)};

/* ---------- answer checking ---------- */
P.letters="ABCDEFGH";
P.isNum=function(q){return q.type==="SA"||q.type==="NUM"};
P.check=function(q,resp){
  if(P.isNum(q)){
    var v=parseFloat(resp);if(isNaN(v))return false;
    var accs=[q.num.ans].concat(q.num.also||[]),tol=q.num.tol||0;
    return accs.some(function(a){return Math.abs(a-v)<=tol+1e-9});
  }
  var r=(resp||[]).slice().sort().join(","),keys=[q.key].concat(q.alsoKey?q.alsoKey:[]);
  return keys.some(function(k){return k&&k.slice().sort().join(",")===r});
};
P.keyText=function(q){
  if(P.isNum(q))return String(q.num.ans);
  return q.key.map(function(i){return P.letters[i]}).join(", ");
};
})();
