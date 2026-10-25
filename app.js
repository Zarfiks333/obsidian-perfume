import {createScrollVideo} from './scroll-video.js';
import {initShop} from './shop.js';
import {initInteractions} from './interactions.js';
import {createSmoothScroll} from './smooth-scroll.js';
import {createMineralReveal} from './mineral-reveal.js';
import {storyState,storyTimeForPanel,STORY_DURATION} from './story-progress.js';
import {initLiquidReflection} from './liquid-reflection.js';
import {createConstellation} from './constellation.js';

const root=document.documentElement;
const hero=document.querySelector('.hero');
const heritage=document.querySelector('.heritage');
const essence=document.querySelector('#essence');
const cinematic=document.querySelector('.cinematic-story');
const constellation=createConstellation(document.querySelector('.scene-spectrum'));
const creationBeats=[...document.querySelectorAll('.creation-beat')];
creationBeats.forEach(beat=>{
 beat.setAttribute('aria-label',beat.textContent);
 const walker=document.createTreeWalker(beat,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){fragment.append(document.createTextNode(word));return;}const span=document.createElement('span');span.className='creation-word';span.setAttribute('aria-hidden','true');span.textContent=word;fragment.append(span);});node.replaceWith(fragment);});
});
initLiquidReflection(document.querySelector('.liquid-reflection')); 
const header=document.querySelector('.site-header');
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery=matchMedia('(max-width: 760px)');
const shortQuery=matchMedia('(max-height: 579px)');
const hasGSAP=Boolean(window.gsap&&window.ScrollTrigger);
if(hasGSAP)gsap.registerPlugin(ScrollTrigger, ...(window.Flip?[Flip]:[]));
let calm=reducedQuery.matches;
let animationContext=null,player=null,essencePlayer=null,essenceObserver=null,revision=0,pendingPanelFocus=null,lastGalleryFocus=null;
document.addEventListener('focusin',event=>{if(event.target.closest('.heritage-panel'))lastGalleryFocus=event.target;else lastGalleryFocus=pendingPanelFocus=null;});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.heritage-panel'))lastGalleryFocus=pendingPanelFocus=null;},{passive:true});
const shop=initShop({isCalm:()=>calm||!hasGSAP});
const interactions=initInteractions({isCalm:()=>calm||!hasGSAP});
const smooth=createSmoothScroll({isCalm:()=>calm||!hasGSAP});
const mineral=createMineralReveal(document.querySelector('.mineral-stage'));
const erosionValues=offset=>`0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 8 0 0 0 ${offset}`;

async function configureAnimations(){
 const current=++revision;
 if(document.activeElement?.closest('.heritage-panel'))pendingPanelFocus=document.activeElement;
 animationContext?.revert();animationContext=null;
 player?.destroy();player=null;
 essencePlayer?.destroy();essencePlayer=null;essenceObserver?.disconnect();essenceObserver=null;
 heritage.classList.remove('is-horizontal');cinematic.classList.remove('is-cinematic');
 ['--veil-blur','--veil-shade','--film-dim'].forEach(property=>cinematic.style.removeProperty(property));
 [heritage,heritage.querySelector('.heritage-track'),...creationBeats,...document.querySelectorAll('.creation-word,.gallery-copy,.gallery-art,.gallery-type')].forEach(el=>['transform','opacity','visibility','filter'].forEach(property=>el.style.removeProperty(property)));
 hero.classList.remove('has-frame');
 essence.classList.remove('has-frame');
 root.dataset.motion=calm?'calm':'full';
 document.querySelector('.film-poster').src=calm?'assets/final.webp':'assets/poster.webp';
 essence.querySelector('.essence-poster').src=calm?'assets/essence/final.webp':'assets/essence/poster.webp';
 mineral.render(1,0);
 if(calm||!hasGSAP){constellation.render(1);restorePanelFocus();smooth.resize();return;}
 const mobile=mobileQuery.matches;
 let manifest={startFrame:24,endFrame:191},essenceManifest={startFrame:0,endFrame:191};
 const manifests=await Promise.allSettled(['assets/frames/manifest.json','assets/essence/manifest.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Manifest unavailable');return response.json();}));
 if(manifests[0].status==='fulfilled')manifest=manifests[0].value;
 if(manifests[1].status==='fulfilled')essenceManifest=manifests[1].value;
 if(current!==revision||calm)return;
 player=createScrollVideo({canvas:document.querySelector('.film-canvas'),source:'assets/video/reveal-1080p.mp4',first:manifest.startFrame,last:manifest.endFrame,mobile,
  onReady:()=>{hero.classList.add('has-frame');document.querySelector('.frame-status').textContent='';},
  onError:()=>{document.querySelector('.frame-status').textContent='Доступен статичный просмотр.';}
 });
 const essenceProgress={value:0};
 const essenceFocus=progress=>{const points=[[0,.66],[.22,.65],[.45,.55],[.66,.43],[.84,.43],[1,.5]];const i=points.findIndex(point=>point[0]>=progress);if(i<=0)return points[0][1];const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(progress-a[0])/(b[0]-a[0]);};
 const prepareEssence=()=>{
  if(current!==revision||calm||essencePlayer)return;
  essencePlayer=createScrollVideo({canvas:essence.querySelector('canvas'),source:'assets/video/essence-1080p.mp4',first:essenceManifest.startFrame,last:essenceManifest.endFrame,mobile,basePath:'assets/essence',cacheLimit:mobile?12:20,focusX:mobile?essenceFocus:.5,onReady:()=>essence.classList.add('has-frame')});
  essencePlayer.setProgress(essenceProgress.value);
 };
 essenceObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))prepareEssence();},{rootMargin:'100% 0px'});essenceObserver.observe(essence);
 animationContext=gsap.context(()=>{
  const progress={value:0};
  const film=gsap.timeline({scrollTrigger:{id:'obsidian-film',trigger:hero,start:'top top',end:()=>shortQuery.matches?'bottom top':'+='+Math.round(innerHeight*(mobile?2.1:2.8)),pin:!shortQuery.matches,scrub:.55,anticipatePin:1,invalidateOnRefresh:true}});
  film.to(progress,{value:1,duration:1,ease:'none',onUpdate:()=>player?.setProgress(progress.value)},0);
  film.fromTo('[data-erosion="hero-erode"]',{attr:{values:erosionValues(1)}},{attr:{values:erosionValues(-8)},duration:.24,ease:'none'},0);
  film.to('.hero-word',{opacity:0,duration:.03,ease:'none'},.23);
  film.set('.hero-topline',{opacity:1},.44);
  film.fromTo('[data-erosion="top-erode"]',{attr:{values:erosionValues(-8)}},{attr:{values:erosionValues(1)},duration:.09,ease:'none'},.44);
  film.to('[data-erosion="top-erode"]',{attr:{values:erosionValues(-8)},duration:.08,ease:'none'},.61);
  film.set('.hero-poetry',{opacity:1},.70);
  film.fromTo('[data-erosion="side-erode"]',{attr:{values:erosionValues(-8)}},{attr:{values:erosionValues(1)},duration:.09,ease:'none'},.70);
  film.to('[data-erosion="side-erode"]',{attr:{values:erosionValues(-8)},duration:.08,ease:'none'},.92);
  document.querySelectorAll('.product-card').forEach((card,index)=>gsap.from(card,{y:110,scale:.94,rotation:[3,-3,3][index%3],opacity:0,filter:'blur(7px)',duration:1.25,ease:'power3.out',clearProps:'transform,opacity,filter',scrollTrigger:{trigger:card,start:'top 89%',once:true}}));
  gsap.from('.footer-invite .reveal',{y:40,autoAlpha:0,duration:1,stagger:.13,scrollTrigger:{trigger:'.footer-invite',start:'top 85%',once:true}});
  cinematic.classList.add('is-cinematic');heritage.classList.add('is-horizontal');
  const track=heritage.querySelector('.heritage-track');
  const panels=[...heritage.querySelectorAll('.heritage-panel')];
  const phase={time:0};
  const setRise=gsap.quickSetter(heritage,'yPercent');
  const setTrack=gsap.quickSetter(track,'x','px');
  const words=creationBeats.map(beat=>[...beat.querySelectorAll('.creation-word')]);
  const wordStates=words.map(list=>list.map(()=>-1));
  const clamp=value=>Math.max(0,Math.min(1,value));
  let panelDistance=0,lastFilm=-1,lastHorizontal=-1,lastReveal=-1,lastBlur=-1,lastDark=-1;
  function measureStage(){cinematic.style.setProperty('--scene-width',`${cinematic.clientWidth}px`);panelDistance=Math.max(0,panels.at(-1).offsetLeft-panels[0].offsetLeft);}
  measureStage();
  function renderStory(){
   const state=storyState(phase.time);
   if(state.reveal!==lastReveal){setRise(105*(1-state.reveal));lastReveal=state.reveal;}
   if(state.blur!==lastBlur){cinematic.style.setProperty('--veil-blur',`${2+state.blur*26}px`);cinematic.style.setProperty('--veil-shade',String(.18+state.blur*.72));lastBlur=state.blur;}
   if(state.dark!==lastDark){cinematic.style.setProperty('--film-dim',String(state.dark));lastDark=state.dark;}
   cinematic.dataset.film=state.film.toFixed(4);cinematic.dataset.reveal=state.reveal.toFixed(4);cinematic.dataset.horizontal=state.horizontal.toFixed(4);cinematic.dataset.orbit=state.orbit.toFixed(4);
   // Fictional chapters clear before the bottle crosses their negative space.
   if(state.film!==lastFilm){
   essenceProgress.value=state.film;essencePlayer?.setProgress(state.film);lastFilm=state.film;
   creationBeats.forEach((beat,index)=>{
    const start=[.08,.27,.49][index],end=[.25,.46,.76][index];
    const reveal=clamp((state.film-start)/.085),out=clamp((end-state.film)/.035);
    beat.style.opacity=String(out);beat.style.visibility=state.film>=start-.02&&state.film<=end?'visible':'hidden';
    if(beat.style.visibility==='hidden')return;
    words[index].forEach((word,i)=>{const v=clamp(reveal*1.5-i/words[index].length*.5);if(wordStates[index][i]===v)return;wordStates[index][i]=v;word.style.opacity=String(v);word.style.transform=`translateY(${(1-v)*12}px)`;word.style.filter=v===1?'none':`blur(${(1-v)*5}px)`;});
   });
   }
   if(state.horizontal!==lastHorizontal){
   lastHorizontal=state.horizontal;setTrack(-panelDistance*state.horizontal);
   panels.forEach((panel,index)=>{
    const position=state.horizontal*(panels.length-1)-index;
    const exposure=clamp(1.5+position)*clamp(1-Math.max(0,position-.25)/.65);
    const art=panel.querySelector('.gallery-art');
    if(art){art.style.transform=`translateX(${-position*11}%) rotate(${index===1?-13-position*4:-position*4}deg) scale(${1.02+Math.min(1,Math.abs(position))*.025})`;art.style.opacity=String(exposure);}
    const type=panel.querySelector('.gallery-type');if(type)type.style.opacity=String(exposure);
    const title=panel.querySelector('.gallery-copy');
    if(index!==panels.length-1){title.style.transform=`translateY(${Math.max(0,-position)*24}px)`;title.style.opacity=String(exposure);}
   });
   }
   mineral.render(state.reveal,state.horizontal);
   constellation.render(state.orbit);
  }
  gsap.to(phase,{time:STORY_DURATION,ease:'none',onUpdate:renderStory,scrollTrigger:{id:'obsidian-cinematic',trigger:cinematic,start:'top top',end:()=>'+='+Math.round(innerHeight*STORY_DURATION),pin:true,scrub:.7,anticipatePin:1,invalidateOnRefresh:true,onRefresh:()=>{measureStage();lastHorizontal=-1;renderStory();if(lastGalleryFocus)requestAnimationFrame(()=>{restorePanelFocus();alignFocusedPanel();});}}});
  renderStory();
 });
 ScrollTrigger.refresh();smooth.resize();restorePanelFocus();alignFocusedPanel();
}

function restorePanelFocus(){
 const target=pendingPanelFocus||lastGalleryFocus;pendingPanelFocus=null;
 if(target?.isConnected&&(document.activeElement===document.body||document.activeElement===target))target.focus({preventScroll:true});
}

mobileQuery.addEventListener('change',configureAnimations);
shortQuery.addEventListener('change',configureAnimations);
reducedQuery.addEventListener('change',()=>{calm=reducedQuery.matches;shop.settleMotion();interactions.reset();smooth.configure();configureAnimations();});
configureAnimations();

function updateHeader(){header.classList.toggle('is-scrolled',scrollY>30);}
addEventListener('scroll',updateHeader,{passive:true});updateHeader();

function navigateTo(link){
 const href=link.getAttribute('href');
 const target=document.querySelector(href);
 if(!target)return;
 const trigger=hasGSAP&&href==='#heritage'?ScrollTrigger.getById('obsidian-cinematic'):null;
 const top=href==='#top'?0:trigger?trigger.start+(trigger.end-trigger.start)*storyTimeForPanel(0,3)/STORY_DURATION:target.getBoundingClientRect().top+scrollY-85;
 target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
 smooth.to(top);history.replaceState(null,'',href);
}
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',async event=>{
 if(!document.querySelector(link.getAttribute('href')))return;
 event.preventDefault();
 await shop.closeMenu();navigateTo(link);
}));
function alignFocusedPanel(){
 if(!hasGSAP)return;
 const panel=document.activeElement?.closest('.heritage-panel');
 const trigger=ScrollTrigger.getById('obsidian-cinematic');
 if(!panel||!trigger)return;
 const panels=[...heritage.querySelectorAll('.heritage-panel')];
 const progress=storyTimeForPanel(panels.indexOf(panel),panels.length)/STORY_DURATION;
 const align=()=>{
  if(!panel.contains(document.activeElement)||ScrollTrigger.getById('obsidian-cinematic')!==trigger)return;
  heritage.scrollLeft=0;
  smooth.jump(trigger.start+(trigger.end-trigger.start)*progress);
  ScrollTrigger.update();trigger.getTween()?.progress(1);trigger.animation.progress(progress);
 };
 align();requestAnimationFrame(align);
}
heritage.addEventListener('focusin',alignFocusedPanel);
document.fonts?.ready.then(()=>{if(hasGSAP)ScrollTrigger.refresh();smooth.resize();});
addEventListener('pagehide',event=>{if(event.persisted)return;revision++;player?.destroy();essencePlayer?.destroy();essenceObserver?.disconnect();animationContext?.revert();smooth.destroy();constellation.destroy();});
addEventListener('pageshow',event=>{if(event.persisted){updateHeader();if(hasGSAP)ScrollTrigger.refresh();}});
