(function (root) {
'use strict';
const G=root.PoolGeo||require('./geometry');
// Units: mm, seconds. decel = effective cloth deceleration (mm/s^2)
const P={decel:250,eCush:0.75,eBall:0.96,dt:1/480,pocketR:70,sidePocketR:60};
function step(balls,t,opts){
  const o=Object.assign({},P,opts),R=t.R,dt=o.dt,pk=G.pockets(t),ev=[];
  for(const b of balls){
    if(b.pocketed)continue;
    const s=Math.hypot(b.vx,b.vy);
    if(s>0){const n=s-o.decel*dt;if(n<=1)b.vx=b.vy=0;else{b.vx*=n/s;b.vy*=n/s;}}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    for(let i=0;i<6;i++)if(Math.hypot(b.x-pk[i].x,b.y-pk[i].y)<(i%3===1?o.sidePocketR:o.pocketR)){
      b.pocketed=true;b.vx=b.vy=0;ev.push({type:'pocket',id:b.id,pocket:i});break;}
    if(b.pocketed)continue;
    if(b.x<R){b.x=R;if(b.vx<0){b.vx*=-o.eCush;ev.push({type:'cushion',id:b.id});}}
    if(b.x>t.w-R){b.x=t.w-R;if(b.vx>0){b.vx*=-o.eCush;ev.push({type:'cushion',id:b.id});}}
    if(b.y<R){b.y=R;if(b.vy<0){b.vy*=-o.eCush;ev.push({type:'cushion',id:b.id});}}
    if(b.y>t.h-R){b.y=t.h-R;if(b.vy>0){b.vy*=-o.eCush;ev.push({type:'cushion',id:b.id});}}
  }
  for(let i=0;i<balls.length;i++){const a=balls[i];if(a.pocketed)continue;
    for(let j=i+1;j<balls.length;j++){const c=balls[j];if(c.pocketed)continue;
      const dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy);if(d>=2*R||d===0)continue;
      const nx=dx/d,ny=dy/d,ov=(2*R-d)/2,rel=(a.vx-c.vx)*nx+(a.vy-c.vy)*ny;
      a.x-=nx*ov;a.y-=ny*ov;c.x+=nx*ov;c.y+=ny*ov;
      if(rel>0){const k=(1+o.eBall)/2*rel;a.vx-=k*nx;a.vy-=k*ny;c.vx+=k*nx;c.vy+=k*ny;ev.push({type:'ball',a:a.id,b:c.id});}
    }}
  return ev;
}
// Simulate one shot. Returns frames (every 4 steps), events and final snapshot.
function predict(balls,cueId,angle,speed,opts){
  opts=opts||{};const t=opts.table||G.TABLE,o=Object.assign({},P,opts);
  const bs=balls.map(b=>({id:b.id,x:b.x,y:b.y,vx:0,vy:0,pocketed:false}));
  const cue=bs.find(b=>b.id===cueId);cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;
  const frames=[],events=[],snap=()=>frames.push(bs.map(b=>({id:b.id,x:b.x,y:b.y,pocketed:b.pocketed})));
  snap();
  for(let i=0;i<(o.maxSteps||14400);i++){
    for(const e of step(bs,t,o)){e.step=i;events.push(e);}
    if(i%4===3)snap();
    if(!bs.some(b=>b.vx||b.vy))break;
  }
  snap();return {frames,events,final:frames[frames.length-1]};
}
const API={P,step,predict};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.PoolPhys=API;
})(typeof self!=='undefined'?self:globalThis);
