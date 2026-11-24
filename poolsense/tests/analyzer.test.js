// Synthetic-image test: draws felt + balls into raw RGBA and checks detection.
const assert=require('assert'),An=require('../js/analyzer');
const W=640,H=330,d=new Uint8ClampedArray(W*H*4);
const px=(x,y,c)=>{const i=(y*W+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255;};
for(let y=0;y<H;y++)for(let x=0;x<W;x++)px(x,y,(x>=14&&x<626&&y>=14&&y<316)?[31,122,61]:[90,58,30]);
const ball=(cx,cy,c)=>{for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++)if(x*x+y*y<=49)px(cx+x,cy+y,c);};
ball(150,150,[245,245,245]);ball(300,100,[245,196,0]);ball(450,200,[214,40,40]);
const r=An.analyze({width:W,height:H,data:d});
assert.strictEqual(r.balls.length,3);assert(r.balls.some(b=>b.id==='cue'));console.log('analyzer ok');
