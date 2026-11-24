(function (root) {
'use strict';
const G=root.PoolGeo||require('./geometry');
function hsv(r,g,b){r/=255;g/=255;b/=255;const m=Math.max(r,g,b),d=m-Math.min(r,g,b);let h=0;
  if(d){if(m===r)h=((g-b)/d+6)%6;else if(m===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}
  return [h,m?d/m:0,m];}
// img: {width,height,data} (ImageData). Finds felt by dominant hue, then ball-sized blobs on it.
function analyze(img,t){
  t=t||G.TABLE;const W=img.width,H=img.height,D=img.data,N=W*H;
  const hh=new Float32Array(N),ss=new Float32Array(N),vv=new Float32Array(N),bins=new Array(36).fill(0);
  for(let i=0;i<N;i++){const q=hsv(D[4*i],D[4*i+1],D[4*i+2]);hh[i]=q[0];ss[i]=q[1];vv[i]=q[2];
    if(q[1]>0.35&&q[2]>0.25)bins[Math.floor(q[0]/10)%36]++;}
  const bm=Math.max(...bins);
  if(bm<N*0.08)return {error:'No table felt found. Use a clear, top-down photo of a coloured table.'};
  const peak=bins.indexOf(bm)*10+5,felt=new Uint8Array(N),cc=new Uint32Array(W),rc=new Uint32Array(H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=Math.abs(hh[i]-peak),dh=Math.min(d,360-d);
    if(ss[i]>0.25&&vv[i]>0.15&&dh<=20){felt[i]=1;cc[x]++;rc[y]++;}}
  const cm=Math.max(...cc),rm=Math.max(...rc);let x0=0,x1=W-1,y0=0,y1=H-1;
  while(cc[x0]<cm*0.2)x0++;while(cc[x1]<cm*0.2)x1--;while(rc[y0]<rm*0.2)y0++;while(rc[y1]<rm*0.2)y1--;
  const bw=x1-x0+1,bh=y1-y0+1,r=t.R*bw/t.w,ea=Math.PI*r*r,seen=new Uint8Array(N),blobs=[],
    pk=G.pockets(t).map(p=>({x:x0+p.x/t.w*bw,y:y0+p.y/t.h*bh}));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=y*W+x;if(felt[i]||seen[i])continue;
    const st=[i];seen[i]=1;let a=0,sx=0,sy=0,sv=0,sS=0,mnx=x,mxx=x,mny=y,mxy=y;
    while(st.length){const j=st.pop(),px=j%W,py=(j-px)/W;a++;sx+=px;sy+=py;sv+=vv[j];sS+=ss[j];
      if(px<mnx)mnx=px;if(px>mxx)mxx=px;if(py<mny)mny=py;if(py>mxy)mxy=py;
      const nb=[];if(px>x0)nb.push(j-1);if(px<x1)nb.push(j+1);if(py>y0)nb.push(j-W);if(py<y1)nb.push(j+W);
      for(const n of nb)if(!felt[n]&&!seen[n]){seen[n]=1;st.push(n);}}
    const w=mxx-mnx+1,h=mxy-mny+1,ar=w/h;
    if(a<ea*0.45||a>ea*1.8||ar<0.6||ar>1.6||a/(w*h)<0.55)continue;
    const cx=sx/a,cy=sy/a,mv=sv/a,ms=sS/a;
    if(mv<0.25&&pk.some(p=>Math.hypot(p.x-cx,p.y-cy)<2.5*r))continue;   // dark pocket, not a ball
    blobs.push({cx,cy,mv,ms});
  }
  const warnings=[];let ci=-1,best=-9;
  blobs.forEach((b,k)=>{const sc=b.mv-b.ms;if(b.ms<0.25&&b.mv>0.7&&sc>best){best=sc;ci=k;}});
  if(ci<0)warnings.push('No white cue ball found; use "Add ball" to place one.');
  let n=0;const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const balls=blobs.map((b,k)=>({id:k===ci?'cue':++n,
    x:cl((b.cx-x0+0.5)/bw*t.w,t.R,t.w-t.R),y:cl((b.cy-y0+0.5)/bh*t.h,t.R,t.h-t.R)}));
  if(balls.length>16)warnings.push('More than 16 blobs; results may include false positives.');
  return {balls,felt:{x0,y0,x1,y1},hue:peak,warnings};
}
const API={analyze,hsv};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.PoolAnalyzer=API;
})(typeof self!=='undefined'?self:globalThis);
