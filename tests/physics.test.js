const assert=require('assert'),Ph=require('../js/physics'),G=require('../js/geometry');
const mk=(id,x,y,vx=0,vy=0)=>({id,x,y,vx,vy,pocketed:false});
{const a=mk('cue',500,635,1000),b=mk(1,700,635),o={decel:0,eBall:1};
 for(let i=0;i<600;i++)Ph.step([a,b],G.TABLE,o);assert(Math.abs(a.vx)<1e-6&&Math.abs(b.vx-1000)<1e-6,'head-on transfer');}
{const a=mk(1,100,635,-1000),o={decel:0};for(let i=0;i<200;i++)Ph.step([a],G.TABLE,o);assert(Math.abs(a.vx-750)<1e-6,'cushion');}
{const r=Ph.predict([mk('cue',500,635)],'cue',0,800),x=r.final[0].x;assert(x>1740&&x<1820,'friction stop '+x);}
{const a=mk(1,200,200,-1000,-1000);for(let i=0;i<300&&!a.pocketed;i++)Ph.step([a],G.TABLE,{decel:0});assert(a.pocketed,'pocket');}
{const r=Ph.predict([mk('cue',600,635),mk(1,1300,635)],'cue',0,2500);assert(r.events.some(e=>e.type==='ball'),'collision event');}
console.log('physics ok');
