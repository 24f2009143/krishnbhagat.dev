/* Adaptive model: Bayesian knowledge tracing + a forgetting half-life per concept.
 * Pure functions, no DOM. Tested by tests/adapt_sim.js. Loadable in node and in the page. */
(function(root){
"use strict";
var P={init:0.2,learn:0.15,slip:0.1,guess:0.25,halfDays:4,minHalf:1,maxHalf:45};
var DAY=864e5;

/* knowledge now, after forgetting since the last update */
function recall(rec,now){
  if(!rec)return P.init;
  var dt=Math.max(0,(now-(rec.t||now))/DAY),h=rec.h||P.halfDays;
  var f=Math.pow(0.5,dt/h);
  return P.init+(rec.p-P.init)*f;   /* decays toward the prior, never below it */
}
/* one observation. conf: "Sure" | "Unsure" | "Guess" | "none". Returns a new record (inputs are not changed). */
function update(rec,ok,conf,now){
  var p=recall(rec,now),slip=P.slip,guess=P.guess;
  if(ok&&conf==="Guess")guess=0.6;          /* a guessed right answer says little */
  else if(ok&&conf==="Unsure")guess=0.4;
  if(!ok&&conf==="Sure")slip=0.03;           /* wrong and sure: strong evidence of a misconception */
  var post=ok?p*(1-slip)/(p*(1-slip)+(1-p)*guess):p*slip/(p*slip+(1-p)*(1-guess));
  var next=post+(1-post)*P.learn;
  var h=(rec&&rec.h)||P.halfDays;
  h=ok&&conf==="Sure"?Math.min(P.maxHalf,h*1.8):ok?Math.min(P.maxHalf,h*1.2):Math.max(P.minHalf,h*0.5);
  var streak=rec?rec.streak||0:0,miss=rec?rec.miss||0:0;
  if(ok&&conf==="Sure"){streak++;miss=0}else if(!ok){miss++;streak=0}else{streak=0}
  return {p:next,h:h,t:now,n:((rec&&rec.n)||0)+1,streak:streak,miss:miss};
}
/* expected marks at risk for one concept = marks the active exam puts on it x probability of not knowing it now */
function atRisk(rec,marks,now){return marks*(1-recall(rec,now))}
/* rule of 3: three misses in a row -> repair first; three secure wins in a row -> a combined, harder question */
function ruleOf3(rec){if(!rec)return null;if((rec.miss||0)>=3)return "repair";if((rec.streak||0)>=3)return "combine";return null}
/* choose the concept with the most expected marks at risk. concepts: [{key, marks}] ; state: {key: rec} */
function pickConcept(concepts,state,now,exclude){
  var best=null,bv=-1;
  concepts.forEach(function(c){
    if(exclude&&exclude.indexOf(c.key)>=0)return;
    var v=atRisk(state[c.key],c.marks,now);
    if(v>bv+1e-12){bv=v;best=c}
  });
  return best?{key:best.key,risk:bv}:null;
}
/* practice order inside a concept: single skill -> two skills -> full PYQ -> unfamiliar variation -> timed mixed */
var STAGES=["single","double","pyq","variation","timed"];
function stageFor(rec){var n=rec?rec.n||0:0,p=rec?rec.p:0;if(n===0||p<0.35)return "single";if(p<0.5)return "double";if(p<0.75)return "pyq";if(p<0.9)return "variation";return "timed"}
var api={params:P,recall:recall,update:update,atRisk:atRisk,ruleOf3:ruleOf3,pickConcept:pickConcept,stageFor:stageFor,STAGES:STAGES};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
else{root.APP=root.APP||{};root.APP.adapt=api}
})(this);
