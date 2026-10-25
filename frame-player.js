import {frameAtProgress, nearestFrame} from './frame-math.js';

export function createFramePlayer({canvas, first=24, last=191, mobile=false, basePath='assets/frames', cacheLimit, focusX=.5, onReady, onError}) {
  const context=canvas.getContext('2d', {alpha:false});
  if(!context){onError?.();return {setProgress(){},destroy(){}};}
  const cache=new Map();
  const pending=new Set();
  const failed=new Set();
  let queue=[];
  let inflight=0;
  let target=first;
  let previous=first;
  let active=true;
  let ready=false;
  let lastDrawn=-1;
  const limit=cacheLimit??(mobile?14:28);
  const path=mobile?'mobile':'desktop';
  const maxParallel=4;
  const url=frame=>`${basePath}/${path}/${String(frame).padStart(3,'0')}.webp`;

  function draw(force=false){
    if(!active||!cache.size)return;
    const selected=cache.has(target)?target:nearestFrame(target,cache.keys());
    if(selected===null||(!force&&selected===lastDrawn))return;
    const image=cache.get(selected);
    const w=canvas.width,h=canvas.height;
    const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
    const dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
    context.fillStyle='#17130f';context.fillRect(0,0,w,h);
    const progress=last===first?0:(selected-first)/(last-first);
    const focus=typeof focusX==='function'?focusX(progress):focusX;
    const left=Math.min(0,Math.max(w-dw,w/2-dw*focus));
    context.drawImage(image,left,(h-dh)/2,dw,dh);
    lastDrawn=selected;
    canvas.dataset.frame=String(selected);
    if(!ready){ready=true;onReady?.();}
  }

  function prune(){
    if(cache.size<=limit)return;
    const farthest=[...cache.keys()].sort((a,b)=>Math.abs(b-target)-Math.abs(a-target));
    for(const frame of farthest){
      if(cache.size<=limit)break;
      if(frame!==target&&frame!==lastDrawn)cache.delete(frame);
    }
  }

  function pump(){
    if(!active)return;
    while(inflight<maxParallel&&queue.length){
      const frame=queue.shift();
      if(cache.has(frame)||pending.has(frame)||failed.has(frame))continue;
      pending.add(frame);inflight++;
      const image=new Image();image.decoding='async';
      const done=success=>{
        pending.delete(frame);inflight--;
        if(!active)return;
        if(success){cache.set(frame,image);draw();prune();}
        else {failed.add(frame);if(!ready&&failed.has(target))onError?.();}
        pump();
      };
      image.onload=()=>done(true);image.onerror=()=>done(false);image.src=url(frame);
    }
  }

  function schedule(){
    const direction=target>=previous?1:-1;
    const desired=[target];
    const ahead=mobile?9:15;
    for(let step=1;step<=ahead;step++)desired.push(target+direction*step);
    for(let step=1;step<=4;step++)desired.push(target-direction*step);
    queue=[...new Set(desired)].filter(frame=>frame>=first&&frame<=last&&!cache.has(frame)&&!pending.has(frame)&&!failed.has(frame));
    pump();
  }

  function resize(){
    if(!active)return;
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,mobile?1.5:2);
    canvas.width=Math.max(1,Math.round(rect.width*dpr));
    canvas.height=Math.max(1,Math.round(rect.height*dpr));
    draw(true);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  resize();schedule();
  return {
    setProgress(progress){
      if(!active)return;
      const next=frameAtProgress(progress,first,last);
      if(next===target&&ready)return;
      previous=target;target=next;draw();schedule();
    },
    destroy(){active=false;observer.disconnect();queue=[];cache.clear();canvas.dataset.frame='';}
  };
}
