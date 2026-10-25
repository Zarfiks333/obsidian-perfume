// Deterministic perspective flight: scroll is the camera, never elapsed time.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
export function constellationState(progress,width,height){
 const p=clamp(progress),w=Math.max(1,width),h=Math.max(1,height);
 const portrait=w/h<.8;
 const travel=clamp(p/.69),camera=travel*20;
 const gather=smooth((p-.69)/.24);
 const sizeGather=smooth((p-.67)/.15),solid=smooth((p-.69)/.1);
 const rx=Math.min(w*.34,h*(w/h>1.8?.55:.31)),ry=portrait?Math.min(h*.27,w*.46):h*.31;
 const finalHeight=Math.min(h*.22,w*.24);
 const bottles=Array.from({length:9},(_,i)=>{
  const depth=4.5+i*2.2-camera;
  const projection=7/(7+Math.max(-4.2,depth));
  const angle=Math.PI+i*1.05-travel*.8;
  const ring=-Math.PI/2+i*Math.PI*2/9;
  const entry=smooth((p-i*.065)/.045);
  const passed=smooth((depth+4.2)/2.6);
  return {
   x:mix(Math.cos(angle)*w*.33*projection,Math.cos(ring)*rx,gather),
   y:mix(Math.sin(angle)*h*.23*projection,Math.sin(ring)*ry,gather),
   height:mix(Math.min(h*.5,w*.44)*projection,finalHeight,sizeGather),
   rotation:mix(Math.sin(angle)*22,Math.cos(ring)*-7,gather),
   turn:mix(Math.cos(angle)*18,0,gather),
   opacity:mix(entry*passed,1,solid),
   brightness:mix(.5+Math.min(1,projection)*.5,1,gather),
   layer:Math.round(mix(100-depth*3,100+Math.sin(ring)*10,gather))
  };
 });
 return {camera,gather,bottles,title:smooth((p-.8)/.12),glow:mix(.22,.6,gather)};
}

export function createConstellation(panel){
 const field=panel.querySelector('.constellation-field');
 const bottles=[...field.querySelectorAll('.constellation-bottle')];
 const copy=panel.querySelector('.gallery-copy');
 let lastProgress=1;
 function render(progress){
  lastProgress=progress;
  const state=constellationState(progress,field.clientWidth,field.clientHeight);
  bottles.forEach((bottle,i)=>{
   const pose=state.bottles[i];
   bottle.style.height=`${pose.height}px`;
   bottle.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) translate(-50%,-50%) rotate(${pose.rotation}deg) rotateY(${pose.turn}deg)`;
   bottle.style.opacity=String(pose.opacity);
   bottle.style.zIndex=String(pose.layer);
   bottle.style.filter=`brightness(${pose.brightness}) drop-shadow(0 18px 26px #0008)`;
  });
  field.style.setProperty('--sphere-glow',state.glow);
  field.style.setProperty('--sphere-scale',1+state.camera*.045);
  copy.style.opacity=String(state.title);
  panel.dataset.orbit=String(progress);
 }
 const observer=new ResizeObserver(()=>render(lastProgress));observer.observe(field);
 return {render,destroy:()=>observer.disconnect()};
}
