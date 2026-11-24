(function (root) {
'use strict';
const G=root.PoolGeo,COL=['#1e4fd8','#f5c400','#d62828','#6a2c91','#f77f00','#00a0b0','#8b1a1a','#111'];
const color=id=>id==='cue'?'#f4f4f4':COL[(id-1)%8];
const layout=(cv,t)=>{const m=14,sc=(cv.width-2*m)/t.w;return {m,sc,h:t.h*sc+2*m};};
const toTable=(cv,e,t)=>{const L=layout(cv,t),r=cv.getBoundingClientRect(),k=cv.width/r.width;
  return {x:((e.clientX-r.left)*k-L.m)/L.sc,y:((e.clientY-r.top)*k-L.m)/L.sc};};
// S: {t, balls, target, aim:{ghost,contact,pocket}, frames, fi}
function draw(cv,S){
  const t=S.t,L=layout(cv,t),ctx=cv.getContext('2d');cv.height=Math.round(L.h);
  const X=x=>L.m+x*L.sc,Y=y=>L.m+y*L.sc,circle=(p,r)=>{ctx.beginPath();ctx.arc(X(p.x),Y(p.y),r*L.sc,0,7);};
  ctx.fillStyle='#5a3a1e';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.fillStyle='#1f7a3d';ctx.fillRect(L.m,L.m,t.w*L.sc,t.h*L.sc);
  ctx.fillStyle='#050505';G.pockets(t).forEach((p,i)=>{circle(p,i%3===1?50:60);ctx.fill();});
  const balls=S.frames?S.frames[S.fi]:S.balls;
  if(S.frames){ctx.globalAlpha=0.7;ctx.lineWidth=2;
    S.frames[0].forEach((b0,k)=>{ctx.beginPath();ctx.strokeStyle=color(b0.id)==='#111'?'#888':color(b0.id);
      for(let f=0;f<=S.fi;f++){const b=S.frames[f][k];f?ctx.lineTo(X(b.x),Y(b.y)):ctx.moveTo(X(b.x),Y(b.y));}ctx.stroke();});
    ctx.globalAlpha=1;}
  const A=S.aim,cue=S.balls.find(b=>b.id==='cue'),tg=S.balls.find(b=>b.id===S.target);
  if(A&&cue&&tg&&!S.frames){
    ctx.setLineDash([8,6]);ctx.lineWidth=2;ctx.strokeStyle='#fff';
    ctx.beginPath();ctx.moveTo(X(cue.x),Y(cue.y));ctx.lineTo(X(A.ghost.x),Y(A.ghost.y));ctx.stroke();
    ctx.strokeStyle='#ffd400';ctx.beginPath();ctx.moveTo(X(tg.x),Y(tg.y));
    if(A.contact)ctx.lineTo(X(A.contact.x),Y(A.contact.y));ctx.lineTo(X(A.pocket.x),Y(A.pocket.y));ctx.stroke();
    ctx.setLineDash([]);ctx.strokeStyle='#fff';circle(A.ghost,t.R);ctx.stroke();}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=Math.max(9,t.R*L.sc*1.1)+'px sans-serif';
  for(const b of balls){if(b.pocketed)continue;
    ctx.fillStyle=color(b.id);circle(b,t.R);ctx.fill();
    if(b.id===S.target){ctx.strokeStyle='#ffd400';ctx.lineWidth=3;ctx.stroke();}
    if(b.id!=='cue'){ctx.fillStyle='#fff';ctx.fillText(b.id,X(b.x),Y(b.y));}}
}
const API={draw,layout,toTable,color};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.PoolRender=API;
})(typeof self!=='undefined'?self:globalThis);
