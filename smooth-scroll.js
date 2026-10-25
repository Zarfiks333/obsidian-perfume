export function createSmoothScroll({isCalm}){
 let lenis=null,ticker=null;
 const root=document.documentElement;
 const modal=event=>{
  if(event.detail.open)lenis?.stop();
  else{lenis?.start();jump(event.detail.top??scrollY);}
 };
 document.addEventListener('obsidian:modal',modal);
 function configure(){
  if(ticker&&window.gsap)gsap.ticker.remove(ticker);ticker=null;lenis?.destroy();lenis=null;
  root.dataset.smooth='native';
  if(isCalm()||!window.Lenis||!window.gsap)return;
  lenis=new Lenis({duration:1.1,smoothWheel:true,syncTouch:false,autoRaf:false,anchors:false,allowNestedScroll:true,prevent:node=>Boolean(node.closest?.('dialog'))});
  if(window.ScrollTrigger)lenis.on('scroll',()=>ScrollTrigger.update());
  ticker=time=>lenis?.raf(time*1000);
  gsap.ticker.add(ticker);gsap.ticker.lagSmoothing(0);
  root.dataset.smooth='lenis';if(document.querySelector('dialog[open]'))lenis.stop();
 }
 function jump(top){if(lenis)lenis.scrollTo(top,{immediate:true,force:true});else window.scrollTo({top,behavior:'instant'});}
 function to(top){if(lenis)lenis.scrollTo(top,{duration:1.15,force:true});else window.scrollTo({top,behavior:isCalm()?'instant':'smooth'});}
 configure();
 return {configure,jump,to,resize(){lenis?.resize();},destroy(){document.removeEventListener('obsidian:modal',modal);if(ticker&&window.gsap)gsap.ticker.remove(ticker);lenis?.destroy();lenis=null;}};
}
