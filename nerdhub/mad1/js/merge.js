/* Pure merge of two saved states (local a, remote b). Never loses progress from either side.
 * Used by sync.js. No DOM; loadable in node for tests. */
(function(root){
"use strict";
function pick(a,b){ /* keep the record with more attempts, then the newer */
  if(!a)return b;if(!b)return a;
  var an=a.n||0,bn=b.n||0;if(an!==bn)return an>bn?a:b;
  return (b.t||0)>(a.t||0)?b:a;
}
function mapMerge(A,B,fn){var o={};Object.keys(A||{}).concat(Object.keys(B||{})).forEach(function(k){o[k]=fn((A||{})[k],(B||{})[k])});return o}
function merge(a,b){
  a=a||{};b=b||{};
  var o={};Object.keys(b).forEach(function(k){o[k]=b[k]});Object.keys(a).forEach(function(k){o[k]=a[k]});
  o.prefs=Object.assign({},b.prefs||{},a.prefs||{});
  ["read","teach","moves","shaky"].forEach(function(f){o[f]=Object.assign({},b[f]||{},a[f]||{})});
  o.ans=mapMerge(a.ans,b.ans,pick);
  o.flash=mapMerge(a.flash,b.flash,function(x,y){return !x?y:!y?x:((y.box||0)>(x.box||0)?y:x)});
  o.steps=mapMerge(a.steps,b.steps,function(x,y){return Object.assign({},y||{},x||{})});
  o.bkt=mapMerge(a.bkt,b.bkt,function(x,y){return !x?y:!y?x:((y.t||0)>(x.t||0)?y:x)});
  o.savedAt=Math.max(a.savedAt||0,b.savedAt||0);
  return o;
}
var api={merge:merge,pick:pick};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
else{root.APP=root.APP||{};root.APP.mergeState=merge}
})(this);
