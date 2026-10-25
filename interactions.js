export function initInteractions({isCalm}){
 const root=document.documentElement;
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const canAnimate=()=>!isCalm()&&Boolean(window.gsap);
 const alphaCache=new WeakMap();
 let activeCard=null;
 const cards=[...document.querySelectorAll('.product-card')];
 function cacheAlpha(image){
  if(!image.complete||!image.naturalWidth)return;
  try{const canvas=document.createElement('canvas');canvas.width=128;canvas.height=Math.round(128*image.naturalHeight/image.naturalWidth);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);alphaCache.set(image,{data:ctx.getImageData(0,0,canvas.width,canvas.height).data,width:canvas.width,height:canvas.height});}catch{}
 }
 cards.forEach(card=>{const image=card.querySelector('img');image.addEventListener('load',()=>cacheAlpha(image));cacheAlpha(image);});
 function hitsBottle(image,x,y){
  const rect=image.getBoundingClientRect();
  const scale=Math.min(rect.width/image.naturalWidth,rect.height/image.naturalHeight);
  const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  const px=(x-rect.left-(rect.width-width)/2)/width,py=(y-rect.top-(rect.height-height)/2)/height;
  if(!Number.isFinite(px)||px<0||px>=1||py<0||py>=1)return false;
  const alpha=alphaCache.get(image);if(!alpha)return px>.22&&px<.78&&py>.03&&py<.97;
  return alpha.data[(Math.floor(py*alpha.height)*alpha.width+Math.floor(px*alpha.width))*4+3]>45;
 }
 function setSpotlight(card,immediate=false){
  if(card===activeCard)return;
  if(activeCard){const image=activeCard.querySelector('img'),title=activeCard.querySelector('.card-name');activeCard.classList.remove('is-spotlit');if(canAnimate()&&!immediate){gsap.to(image,{scale:1,y:0,duration:.5,ease:'power3.out',overwrite:true});gsap.to(title,{x:0,y:0,scale:1,duration:.55,ease:'power3.inOut',overwrite:true,clearProps:'transform'});}else if(window.gsap){gsap.killTweensOf([image,title]);gsap.set(image,{scale:1,y:0});gsap.set(title,{clearProps:'transform'});}else{image.style.transform='';title.style.transform='';}}
  activeCard=card;root.classList.toggle('spotlight-active',Boolean(card));
  if(card){card.classList.add('is-spotlit');const image=card.querySelector('img'),title=card.querySelector('.card-name');if(canAnimate()){gsap.killTweensOf(title);gsap.set(title,{x:0,y:0,scale:1});const from=title.getBoundingClientRect(),stage=card.querySelector('.product-stage').getBoundingClientRect();gsap.to(image,{scale:1.24,y:-8,duration:.7,ease:'power3.out',overwrite:true});gsap.to(title,{x:stage.left+stage.width/2-from.left-from.width/2,y:stage.bottom+12-from.top-from.height/2,scale:.86,duration:.75,ease:'power3.inOut',overwrite:true});}}
 }
 const clearSpotlight=()=>setSpotlight(null);
 document.addEventListener('pointermove',event=>{
  if(!fine.matches||isCalm()||document.querySelector('dialog[open]')){clearSpotlight();return;}
  if(activeCard&&hitsBottle(activeCard.querySelector('img'),event.clientX,event.clientY))return;
  const candidate=event.target.closest?.('.product-card');
  setSpotlight(candidate&&hitsBottle(candidate.querySelector('img'),event.clientX,event.clientY)?candidate:null);
 },{passive:true});
 document.addEventListener('pointerleave',clearSpotlight);
 document.addEventListener('obsidian:product-open',()=>setSpotlight(null,true));
 addEventListener('blur',clearSpotlight);addEventListener('scroll',clearSpotlight,{passive:true});addEventListener('resize',clearSpotlight,{passive:true});

 const word=document.querySelector('.footer-word');const letters=[...word.children];
 const waves=letters.map(letter=>window.gsap?{y:gsap.quickTo(letter,'y',{duration:.65,ease:'power3.out'}),rotation:gsap.quickTo(letter,'rotation',{duration:.65,ease:'power3.out'})}:null);
 function resetWord(){word.classList.remove('is-alive');letters.forEach((letter,i)=>{if(canAnimate()){waves[i]?.y(0);waves[i]?.rotation(0);}else{waves[i]?.y.tween.pause();waves[i]?.rotation.tween.pause();if(window.gsap)gsap.set(letter,{y:0,rotation:0});}letter.style.color='';letter.style.textShadow='';});}
 word.addEventListener('pointermove',event=>{
  if(!canAnimate()||!fine.matches)return;
  word.classList.add('is-alive');const r=word.getBoundingClientRect();const cursor=(event.clientX-r.left)/r.width;
  letters.forEach((letter,i)=>{const position=(i+.5)/letters.length;const d=position-cursor;const influence=Math.exp(-d*d*65);waves[i].y(-46*influence);waves[i].rotation(d*influence*32);letter.style.color=influence>.65?'#fff0ce':'#d4bf98';letter.style.textShadow=`0 0 ${Math.round(influence*35)}px #d4aa5755`;});
 },{passive:true});word.addEventListener('pointerleave',resetWord);

 const purchase=document.querySelector('.add-to-basket');
 const magneticX=window.gsap?gsap.quickTo(purchase,'x',{duration:.4,ease:'power3.out'}):null;
 const magneticY=window.gsap?gsap.quickTo(purchase,'y',{duration:.4,ease:'power3.out'}):null;
 purchase.addEventListener('pointermove',event=>{const r=purchase.getBoundingClientRect();const x=(event.clientX-r.left)/r.width;purchase.style.setProperty('--button-x',`${x*100}%`);if(canAnimate()&&fine.matches){magneticX?.((x-.5)*8);magneticY?.(((event.clientY-r.top)/r.height-.5)*6);}},{passive:true});
 const resetMagnetic=()=>{if(canAnimate()){magneticX?.(0);magneticY?.(0);}else{magneticX?.tween.pause();magneticY?.tween.pause();if(window.gsap)gsap.set(purchase,{x:0,y:0});}};
 purchase.addEventListener('pointerleave',resetMagnetic);
 const aura=document.querySelector('.cursor-aura');
 const auraX=window.gsap?gsap.quickTo(aura,'x',{duration:.24,ease:'power3.out'}):null;
 const auraY=window.gsap?gsap.quickTo(aura,'y',{duration:.24,ease:'power3.out'}):null;
 document.addEventListener('pointermove',event=>{if(!fine.matches||!canAnimate())return;aura.classList.add('is-present');aura.classList.toggle('is-link',Boolean(event.target.closest?.('button,a,[data-scene=obsidian]')));auraX?.(event.clientX);auraY?.(event.clientY);},{passive:true});
 document.addEventListener('pointerleave',()=>aura.classList.remove('is-present'));
 const heritage=document.querySelector('.heritage');let historyVisible=false;
 const syncAtmosphere=()=>heritage.classList.toggle('is-visible',historyVisible&&!document.hidden&&!isCalm());
 const atmosphereObserver=new IntersectionObserver(entries=>{historyVisible=entries[0].isIntersecting;syncAtmosphere();});atmosphereObserver.observe(heritage);
 const footer=document.querySelector('.site-footer');let footerVisible=false;
 const syncFooter=()=>footer.classList.toggle('is-lit',footerVisible&&!document.hidden&&!isCalm());
 const footerObserver=new IntersectionObserver(entries=>{footerVisible=entries[0].isIntersecting;syncFooter();});footerObserver.observe(footer);
 document.addEventListener('visibilitychange',()=>{syncAtmosphere();syncFooter();});
 return {reset(){clearSpotlight();resetWord();resetMagnetic();auraX?.tween.pause();auraY?.tween.pause();aura.classList.remove('is-present');syncAtmosphere();syncFooter();}};
}
