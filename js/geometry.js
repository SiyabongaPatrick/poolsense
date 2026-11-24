(function (root) {
'use strict';
const V=(x,y)=>({x,y}),add=(a,b)=>V(a.x+b.x,a.y+b.y),sub=(a,b)=>V(a.x-b.x,a.y-b.y),mul=(a,k)=>V(a.x*k,a.y*k),
  dot=(a,b)=>a.x*b.x+a.y*b.y,len=a=>Math.hypot(a.x,a.y),dist=(a,b)=>len(sub(a,b)),
  norm=a=>{const l=len(a)||1;return V(a.x/l,a.y/l);};
// 9-ft table in millimetres: playing surface w x h, ball radius R
const TABLE={w:2540,h:1270,R:28.575};
const pockets=(t=TABLE)=>[V(0,0),V(t.w/2,0),V(t.w,0),V(0,t.h),V(t.w/2,t.h),V(t.w,t.h)];
// Ghost ball: where the cue ball centre must be at impact to send target toward pocket
const ghostBall=(tg,pk,R=TABLE.R)=>sub(tg,mul(norm(sub(pk,tg)),2*R));
const cutAngle=(cue,tg,pk,R=TABLE.R)=>{
  const a=norm(sub(ghostBall(tg,pk,R),cue)),b=norm(sub(pk,tg));
  return Math.acos(Math.max(-1,Math.min(1,dot(a,b))))*180/Math.PI;};
// Distance along unit ray d from o to circle (c,r); null if missed
const rayCircle=(o,d,c,r)=>{const oc=sub(o,c),b=dot(oc,d),D=b*b-(dot(oc,oc)-r*r);
  if(D<0)return null;const t=-b-Math.sqrt(D);return t>=0?t:null;};
const segDist=(p,a,b)=>{const ab=sub(b,a),l2=dot(ab,ab),s=l2?Math.max(0,Math.min(1,dot(sub(p,a),ab)/l2)):0;
  return dist(p,add(a,mul(ab,s)));};
// First ball obstructing a ball travelling a->b (centre path), ignoring listed ids
const blocker=(a,b,balls,ignore,R=TABLE.R)=>{
  for(const o of balls){if(o.pocketed||ignore.includes(o.id))continue;if(segDist(o,a,b)<2*R-0.5)return o;}return null;};
// Bank shots: reflect destination across the rail line (ball-centre rail)
const RAILS=['top','bottom','left','right'];
const railLine=(r,t=TABLE)=>({top:t.R,bottom:t.h-t.R,left:t.R,right:t.w-t.R})[r];
const horiz=r=>r==='top'||r==='bottom';
const mirror=(p,r,t=TABLE)=>{const c=railLine(r,t);return horiz(r)?V(p.x,2*c-p.y):V(2*c-p.x,p.y);};
function bankShot(src,dst,r,t=TABLE){
  const c=railLine(r,t),m=mirror(dst,r,t),a=horiz(r)?src.y:src.x,b=horiz(r)?m.y:m.x;
  if(b===a)return null;const s=(c-a)/(b-a);if(!(s>0&&s<1))return null;
  const p=add(src,mul(sub(m,src),s)),o=horiz(r)?p.x:p.y,lim=horiz(r)?t.w:t.h;
  if(o<t.R||o>lim-t.R)return null;return {contact:p,mirrored:m};}
// Cue-ball aim so the target travels target -> rail -> pocket
function aimBank(tg,pk,r,t=TABLE){
  const b=bankShot(tg,pk,r,t);if(!b)return null;
  return {ghost:sub(tg,mul(norm(sub(b.contact,tg)),2*t.R)),contact:b.contact};}
// Cue-ball direction after contact (stun shot, no spin): tangent to the contact normal
function cueTangent(cue,ghost,tg){
  const d=norm(sub(ghost,cue)),n=norm(sub(tg,ghost)),tn=sub(d,mul(n,dot(d,n)));
  return len(tn)<1e-6?null:norm(tn);}
const API={V,add,sub,mul,dot,len,dist,norm,TABLE,pockets,ghostBall,cutAngle,rayCircle,segDist,blocker,RAILS,railLine,mirror,bankShot,aimBank,cueTangent};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.PoolGeo=API;
})(typeof self!=='undefined'?self:globalThis);
