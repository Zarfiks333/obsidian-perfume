// Reflect the actual film's first liquid rows, using its exact cover crop.
// This joins the generated rock/liquid plate to the supplied footage.
export function initLiquidReflection(canvas){
 if(!canvas)return;
 const image=new Image();let disposed=false;
 const context=canvas.getContext('2d');if(!context)return;
 function draw(){
  if(disposed||!image.complete||!image.naturalWidth)return;
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,1.5),w=rect.width,h=rect.height;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  context.setTransform(dpr,0,0,-dpr,0,h*dpr);
  const height=innerHeight,scale=Math.max(w/image.naturalWidth,height/image.naturalHeight);
  const dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
  const focus=matchMedia('(max-width:760px)').matches?.66:.5;
  const left=Math.min(0,Math.max(w-dw,w/2-dw*focus));
  context.drawImage(image,left,(height-dh)/2,dw,dh);
 }
 image.onload=draw;image.src='assets/essence/poster.webp';
 const observer=new ResizeObserver(draw);observer.observe(canvas);
 addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;observer.disconnect();image.onload=null;},{once:true});
}
