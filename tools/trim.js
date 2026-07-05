const fs=require('fs'),{PNG}=require('pngjs');
const p=PNG.sync.read(fs.readFileSync('assets/character.png'));
const {width:w,height:h,data:d}=p;
let minX=w,minY=h,maxX=0,maxY=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(d[(y*w+x)*4+3]>10){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
}
const pad=2;
minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);
maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
const nw=maxX-minX+1,nh=maxY-minY+1;
const out=new PNG({width:nw,height:nh});
for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){
  const s=((y+minY)*w+(x+minX))*4, t=(y*nw+x)*4;
  out.data[t]=d[s];out.data[t+1]=d[s+1];out.data[t+2]=d[s+2];out.data[t+3]=d[s+3];
}
fs.writeFileSync('assets/character.png',PNG.sync.write(out));
console.log(`trimmed to ${nw}x${nh}`);
