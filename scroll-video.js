import {frameAtProgress} from './frame-math.js';
import {createFramePlayer} from './frame-player.js';

// Native decoded video replaces hundreds of decoded images and canvas copies.
// There is only one outstanding seek; fast scrolling keeps the newest target.
export function createScrollVideo(options){
 const {canvas,source,first=24,last=191,focusX=.5,onReady,fps=24}=options;
 const host=canvas.parentElement,poster=host.querySelector('img');
 const video=document.createElement('video');
 video.className='scroll-video';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.controls=false;video.disablePictureInPicture=true;video.tabIndex=-1;video.setAttribute('aria-hidden','true');
 let active=true,target=first,progress=0,raf=0,ready=false,fallback=null,w=0,h=0;
 canvas.dataset.renderer='video';
 function crop(){
  if(!video.videoWidth||!w||!h)return;
  const scale=Math.max(w/video.videoWidth,h/video.videoHeight),dw=video.videoWidth*scale;
  const focus=typeof focusX==='function'?focusX(progress):focusX;
  const position=Math.abs(w-dw)<1?.5:Math.max(0,Math.min(1,(w/2-dw*focus)/(w-dw)));
  const value=`${position*100}% 50%`;video.style.objectPosition=value;if(poster)poster.style.objectPosition=value;
 }
 function schedule(){if(active&&!fallback&&!raf)raf=requestAnimationFrame(seek);}
 function presented(){
  if(!active||video.seeking||video.readyState<2)return;
  const frame=Math.max(first,Math.min(last,first+Math.round(video.currentTime*fps)));
  canvas.dataset.frame=String(frame);video.dataset.frame=String(frame);
  if(!ready){ready=true;onReady?.();}
  if(frame!==target)schedule();
 }
 function seek(){
  raf=0;if(!active||fallback||video.readyState<1||video.seeking)return;
  const time=Math.min(Math.max(0,video.duration-1/fps),(target-first)/fps);
  if(Math.abs(video.currentTime-time)<.5/fps){presented();return;}
  video.currentTime=time;
 }
 function metadata(){crop();schedule();}
 function sought(){presented();schedule();}
 function fail(){
  if(!active||fallback)return;
  cancelAnimationFrame(raf);raf=0;video.remove();observer.disconnect();
  canvas.dataset.renderer='frames';
  fallback=createFramePlayer(options);fallback.setProgress(progress);
 }
 video.addEventListener('loadedmetadata',metadata);video.addEventListener('loadeddata',sought);video.addEventListener('seeked',sought);video.addEventListener('error',fail);
 const observer=new ResizeObserver(()=>{const rect=host.getBoundingClientRect();w=rect.width;h=rect.height;crop();});observer.observe(host);
 canvas.after(video);video.src=source;video.load();
 return {
  setProgress(value){
   if(!active)return;
   progress=Math.max(0,Math.min(1,Number(value)||0));
   if(fallback){fallback.setProgress(progress);return;}
   const next=frameAtProgress(progress,first,last);if(next===target&&ready)return;
   target=next;crop();schedule();
  },
  destroy(){
   active=false;cancelAnimationFrame(raf);observer.disconnect();fallback?.destroy();
   video.removeEventListener('loadedmetadata',metadata);video.removeEventListener('loadeddata',sought);video.removeEventListener('seeked',sought);video.removeEventListener('error',fail);
   video.pause();video.removeAttribute('src');video.load();video.remove();
   canvas.dataset.frame='';delete canvas.dataset.renderer;poster?.style.removeProperty('object-position');
  }
 };
}
