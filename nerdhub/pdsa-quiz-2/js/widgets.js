/* PDSA interactive widgets (registry: P.widgets[name](container, props)) */
(function(){
var P=window.PDSA,esc=P.esc,el=P.el,$=P.$;
P.widgets=P.widgets||{};
function num(x){return parseFloat(x)}
/* ---- Master theorem solver ---- */
P.widgets.master=function(c){
  c.innerHTML='<div class="ctl"><label>T(n) = <input class="field" id="ma" type="number" value="2" min="1" style="width:64px"> · T(n / <input class="field" id="mb" type="number" value="2" min="2" style="width:64px">) + O(n<sup><input class="field" id="md" type="number" value="1" min="0" step="0.5" style="width:64px"></sup>)</label></div><div class="out"></div>';
  var out=c.querySelector(".out");
  function run(){
    var a=num(c.querySelector("#ma").value),b=num(c.querySelector("#mb").value),d=num(c.querySelector("#md").value);
    if(!(a>=1&&b>1&&d>=0)){out.textContent="Use a ≥ 1, b > 1, d ≥ 0.";return}
    var cc=Math.log(a)/Math.log(b),r=cc.toFixed(3).replace(/\.?0+$/,""),res,why;
    if(Math.abs(d-cc)<1e-9){res="O(n^"+(+d.toFixed(3))+" log n)"+(d===0?" = O(log n)":d===1?" = O(n log n)":"");why="the work is the <b>same</b> at every level, and there are log n levels"}
    else if(d<cc){res="O(n^"+r+")"+(Math.abs(cc-Math.round(cc))<1e-9?"":" (about n^"+cc.toFixed(2)+")");why="the leaves dominate: the <b>bottom</b> level does the most work"}
    else{res="O(n^"+(+d.toFixed(3))+")"+(d===1?" = O(n)":d===2?" = O(n²)":"");why="the root dominates: the <b>top</b> level does the most work"}
    out.innerHTML="<p>Step 1: $a="+a+"$, $b="+b+"$, $d="+d+"$.</p><p>Step 2: $\\log_b a=\\log_{"+b+"} "+a+"="+r+"$.</p><p>Step 3: compare $d="+d+"$ with $\\log_b a="+r+"$: "+(Math.abs(d-cc)<1e-9?"equal":d<cc?"$d<\\log_b a$":"$d>\\log_b a$")+", because "+why+".</p><p><span class='ans' style='background:var(--hl);padding:4px 10px;border-radius:8px;font-weight:700'>T(n) = "+esc(res)+"</span></p>";
    P.math(out);
  }
  c.addEventListener("input",run);run();
};
/* ---- Inversion counter ---- */
P.widgets.inversions=function(c,pr){
  c.innerHTML='<div class="ctl"><label>List (numbers separated by commas) <input class="field" id="il" value="'+esc((pr&&pr.list)||"1,5,4,8,6,2,7,3")+'" style="min-width:240px"></label><label class="chk"><input type="checkbox" id="ir"> significant (L[i] > 2·L[j])</label></div><div class="out"></div>';
  var out=c.querySelector(".out");
  function run(){
    var L=c.querySelector("#il").value.split(",").map(function(x){return parseFloat(x.trim())}).filter(function(x){return !isNaN(x)}),sig=c.querySelector("#ir").checked,tot=0,rows="";
    if(L.length>16){out.textContent="Keep the list to 16 numbers.";return}
    L.forEach(function(v,i){var js=[];for(var j=i+1;j<L.length;j++){if(sig?v>2*L[j]:v>L[j])js.push(L[j])}tot+=js.length;rows+="<tr><td>"+v+"</td><td>"+(js.length?js.join(", "):"none")+"</td><td class='cnt0'>"+js.length+"</td></tr>"});
    out.innerHTML="<div class='tw'><table><thead><tr><th>L[i]</th><th>later elements that form a "+(sig?"significant ":"")+"inversion with it</th><th class='cnt0'>count</th></tr></thead><tbody>"+rows+"</tbody></table></div><p><b>Total = "+tot+"</b> · maximum possible for length "+L.length+" is "+(L.length*(L.length-1)/2)+"</p>";
  }
  c.addEventListener("input",run);run();
};
/* ---- Median of medians runner ---- */
P.widgets.mom=function(c,pr){
  c.innerHTML='<div class="ctl"><label>List <input class="field" id="ml" value="'+esc((pr&&pr.list)||"7,13,5,18,9,33,15,9,14,60,1,17,14,15,41,6,11,8,6,15,19,17,2,31")+'" style="min-width:300px"></label></div><div class="out"></div>';
  var out=c.querySelector(".out");
  function run(){
    var L=c.querySelector("#ml").value.split(",").map(function(x){return parseFloat(x.trim())}).filter(function(x){return !isNaN(x)});
    if(!L.length){out.textContent="Enter some numbers.";return}
    var h="",round=1;
    function mom(A){
      if(A.length<=5){var s=A.slice().sort(function(a,b){return a-b}),r=s[Math.floor(s.length/2)];h+="<p><b>Round "+round+":</b> list has "+A.length+" ≤ 5 items. Sorted: ["+s.join(", ")+"]. Middle index "+Math.floor(s.length/2)+" → <mark>"+r+"</mark></p>";return r}
      var M=[],rows="";
      for(var i=0;i<A.length;i+=5){var X=A.slice(i,i+5),S=X.slice().sort(function(a,b){return a-b}),m=S[Math.floor(S.length/2)];M.push(m);rows+="<tr><td>["+X.join(", ")+"]</td><td>["+S.join(", ")+"]</td><td>"+m+"</td></tr>"}
      h+="<p><b>Round "+round+":</b> split "+A.length+" items into blocks of 5, sort each block, keep its middle.</p><div class='tw'><table><thead><tr><th>block</th><th>sorted</th><th>median</th></tr></thead><tbody>"+rows+"</tbody></table></div><p>Medians list: ["+M.join(", ")+"]</p>";round++;return mom(M);
    }
    var r=mom(L);out.innerHTML=h+"<p><b>MoM returns "+r+"</b></p>";
  }
  c.addEventListener("input",run);run();
};
})();
