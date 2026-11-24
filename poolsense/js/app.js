(function () {
'use strict';
const G=PoolGeo,Ph=PoolPhys,An=PoolAnalyzer,R=PoolRender,St=PoolStore,T=G.TABLE;
const $=id=>document.getElementById(id),cv=$('c');cv.width=900;
const NAMES=['Top-left','Top-middle','Top-right','Bottom-left','Bottom-middle','Bottom-right'];
const SAMPLE=[{id:'cue',x:600,y:635},{id:1,x:1300,y:500},{id:2,x:1500,y:800},{id:3,x:1800,y:300},{id:8,x:1900,y:900}];
const S={t:T,balls:[],target:null,pocket:2,rail:'direct',frames:null,fi:0,aim:null};
let raf=0;
const say=s=>{$('info').textContent=s;},draw=()=>R.draw(cv,S),deg=r=>(r*180/Math.PI).toFixed(1)+'°';
const stop=()=>{cancelAnimationFrame(raf);S.frames=null;};
function compute(){
  S.aim=null;const cue=S.balls.find(b=>b.id==='cue'),tg=S.balls.find(b=>b.id===S.target);
  if(!cue||!tg)return say('Drag balls to move them. Tap a numbered ball to make it the target.');
  const pk=G.pockets(T)[S.pocket];let ghost,contact=null,to=pk;
  if(S.rail==='direct')ghost=G.ghostBall(tg,pk,T.R);
  else{const a=G.aimBank(tg,pk,S.rail,T);if(!a)return say('No valid bank off that rail for this pocket.');ghost=a.ghost;contact=a.contact;to=contact;}
  const dir=G.norm(G.sub(ghost,cue)),cut=Math.acos(Math.max(-1,Math.min(1,G.dot(dir,G.norm(G.sub(to,tg))))));
  const tan=G.cueTangent(cue,ghost,tg),L=['Target '+tg.id+' → '+NAMES[S.pocket]+(contact?' via '+S.rail+' rail':'')];
  L.push('Aim angle '+deg(Math.atan2(dir.y,dir.x))+', cut '+deg(cut)+', distance '+Math.round(G.dist(cue,ghost))+' mm');
  if(tan)L.push('Cue ball after contact (no spin): '+deg(Math.atan2(tan.y,tan.x)));
  const b1=G.blocker(cue,ghost,S.balls,['cue',S.target],T.R),b2=G.blocker(tg,to,S.balls,['cue',S.target],T.R);
  if(b1)L.push('⚠ Cue path blocked by ball '+b1.id);if(b2)L.push('⚠ Object-ball path blocked by ball '+b2.id);
  if(cut>1.4)L.push('⚠ Cut too thin to be practical');
  if(ghost.x<T.R||ghost.x>T.w-T.R||ghost.y<T.R||ghost.y>T.h-T.R)L.push('⚠ Ghost ball position is against/through a cushion');
  S.aim={ghost,contact,pocket:pk,angle:Math.atan2(dir.y,dir.x)};say(L.join('\n'));
}
const refresh=()=>{stop();compute();draw();};
function apply(r){
  if(r.error)return say(r.error);
  S.balls=r.balls;S.target=(r.balls.find(b=>b.id!=='cue')||{}).id||null;refresh();
  say('Detected '+r.balls.length+' balls (drag to correct).\n'+r.warnings.join('\n')+'\n'+$('info').textContent);
}
const fromCanvas=c=>apply(An.analyze(c.getContext('2d').getImageData(0,0,c.width,c.height),T));
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const im=new Image();
  im.onload=()=>{const k=Math.min(1,480/im.width),c=document.createElement('canvas');
    c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    URL.revokeObjectURL(im.src);fromCanvas(c);};im.src=URL.createObjectURL(f);};
$('sampleImg').onclick=()=>{const c=document.createElement('canvas');c.width=640;
  R.draw(c,{t:T,balls:SAMPLE.map(b=>Object.assign({},b)),target:null});fromCanvas(c);};
$('sampleLay').onclick=()=>{S.balls=SAMPLE.map(b=>Object.assign({},b));S.target=1;refresh();};
$('clear').onclick=()=>{S.balls=[];S.target=null;refresh();};
$('add').onclick=()=>{let id='cue';if(S.balls.some(b=>b.id==='cue')){id=1;while(S.balls.some(b=>b.id===id))id++;}
  S.balls.push({id,x:T.w/2,y:T.h/2});if(id!=='cue'&&!S.target)S.target=id;refresh();};
$('pocket').onchange=e=>{S.pocket=+e.target.value;refresh();};
$('rail').onchange=e=>{S.rail=e.target.value;refresh();};
let drag=null,moved=false;
cv.addEventListener('pointerdown',e=>{stop();const p=R.toTable(cv,e,T);let best=null,bd=3*T.R;
  for(const b of S.balls){const d=G.dist(b,p);if(d<bd){bd=d;best=b;}}
  if(best){drag=best;moved=false;cv.setPointerCapture(e.pointerId);}else refresh();});
cv.addEventListener('pointermove',e=>{if(!drag)return;const p=R.toTable(cv,e,T);moved=true;
  drag.x=Math.max(T.R,Math.min(T.w-T.R,p.x));drag.y=Math.max(T.R,Math.min(T.h-T.R,p.y));compute();draw();});
cv.addEventListener('pointerup',()=>{if(drag&&!moved&&drag.id!=='cue')S.target=drag.id;drag=null;refresh();});
$('shoot').onclick=()=>{compute();if(!S.aim)return;stop();
  const r=Ph.predict(S.balls,'cue',S.aim.angle,$('pw').value*450);S.frames=r.frames;S.fi=0;
  const loop=()=>{S.fi=Math.min(S.fi+2,S.frames.length-1);draw();
    if(S.fi<S.frames.length-1)raf=requestAnimationFrame(loop);
    else{const p=r.events.filter(e=>e.type==='pocket').map(e=>(e.id==='cue'?'Cue ball (scratch)':'Ball '+e.id)+' → '+NAMES[e.pocket]);
      say($('info').textContent+'\nResult: '+(p.length?p.join('; '):'nothing pocketed')+'. Tap the table to reset.');}};
  loop();};
const fill=()=>{$('scn').innerHTML=St.list().map(n=>'<option>'+n.replace(/</g,'&lt;')+'</option>').join('');};
$('save').onclick=()=>{const n=prompt('Scenario name','scene'+(St.list().length+1));if(!n)return;
  say(St.save(n,{balls:S.balls,target:S.target,pocket:S.pocket,rail:S.rail})?'Saved '+n:'Storage unavailable');fill();};
$('load').onclick=()=>{const d=St.load($('scn').value);if(!d)return say('Nothing to load');
  Object.assign(S,{balls:d.balls,target:d.target,pocket:d.pocket,rail:d.rail});$('pocket').value=S.pocket;$('rail').value=S.rail;refresh();};
$('pocket').innerHTML=NAMES.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('');$('pocket').value=S.pocket;
fill();$('sampleLay').click();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
