import {products,priceFor,volumeScales,currency,readBasket,addToBasket,basketTotal,imageFor} from './shop-model.js';

const assetLoads=new Map();
export function loadAsset(url){
 if(!assetLoads.has(url))assetLoads.set(url,new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>{assetLoads.delete(url);resolve(false);};image.src=url;}));
 return assetLoads.get(url);
}

export function initShop({isCalm}){
 const root=document.documentElement;
 const productDialog=document.querySelector('#product-dialog');
 const menu=document.querySelector('#menu-dialog');
 const basketDialog=document.querySelector('#basket-dialog');
 const infoDialog=document.querySelector('#info-dialog');
 const dialogs=[menu,productDialog,basketDialog,infoDialog];
 const image=productDialog.querySelector('.dialog-bottle');
 const morph=productDialog.querySelector('.bottle-morph');
 const scene=productDialog.querySelector('.product-scene');
 const sweep=productDialog.querySelector('.light-sweep');
 const information=productDialog.querySelector('.product-information');
 const caption=productDialog.querySelector('.scene-caption');
 const brand=productDialog.querySelector('.dialog-top>.wordmark');
 const addButton=productDialog.querySelector('.add-to-basket');
 const buyButton=productDialog.querySelector('.buy-now');
 let currentProduct=products[0],currentVolume=50,displayedVolume=50;
 let volumeTimeline=null,openingTimeline=null,closingTimeline=null,shineTimeline=null,basketTween=null,closePromise=null;
 let menuTimeline=null;
 const menuEdge=document.querySelector('#menu-liquid-edge');
 const liquidPath=top=>`M0,${top} C.2,${top-.1} .3,${top+.1} .5,${top} S.8,${top-.1} 1,${top} L1,1.2 L0,1.2 Z`;
 let variantRevision=0,confirmationTimer=0;
 let savedY=0,sourceImage=null,buyPending=false;
 const openers=new WeakMap();
 let basket=[];try{basket=readBasket(localStorage.getItem('obsidian-basket'));}catch{}
 const animated=()=>!isCalm()&&Boolean(window.gsap);

 function show(dialog,opener){
  if(dialog.open)return false;
  if(dialogs.some(d=>d.open))return false;
  openers.set(dialog,opener);savedY=scrollY;
  document.dispatchEvent(new CustomEvent('obsidian:modal',{detail:{open:true,top:savedY}}));root.classList.add('has-modal');
  root.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;
  dialog.querySelector('[data-close-dialog]')?.focus({preventScroll:true});return true;
 }
 function resetConfirmation(){clearTimeout(confirmationTimer);addButton.classList.remove('is-added');addButton.querySelector('.purchase-label').textContent='В корзину';}
 function applyImage(volume){
  const url=imageFor(currentProduct.id,volume);
  image.src=url;image.alt=`Флакон ${currentProduct.name}, ${volume} ml`;
  morph.style.setProperty('--bottle-mask',`url("${url}")`);morph.dataset.volume=String(volume);displayedVolume=volume;
 }
 function revealImmediately(){
  information.inert=false;productDialog.dataset.phase='open';scene.style.overflow='';
  if(window.gsap){gsap.set([image,information,...information.children,caption,brand],{clearProps:'transform,opacity,visibility'});}
 }
 function finishOpening(){
  if(openingTimeline){const timeline=openingTimeline;openingTimeline=null;timeline.progress(1);timeline.kill();}
  revealImmediately();
 }
 function runShine(){
  shineTimeline?.kill();if(!animated()||!productDialog.open)return;
  shineTimeline=gsap.timeline().set(sweep,{'--shine-x':'135%',opacity:0})
   .to(sweep,{opacity:.6,duration:.55,ease:'sine.inOut'},0)
   .to(sweep,{'--shine-x':'-35%',duration:3.2,ease:'sine.inOut'},0)
   .to(sweep,{opacity:0,duration:.7,ease:'sine.inOut'},2.5);
 }
 function settleMotion(){
  if(menuTimeline){const timeline=menuTimeline;menuTimeline=null;timeline.progress(1);timeline.kill();}
  menu.style.removeProperty('clip-path');
  variantRevision++;volumeTimeline?.kill();volumeTimeline=null;finishOpening();
  if(closingTimeline){const timeline=closingTimeline;closingTimeline=null;timeline.progress(1);timeline.kill();}
  applyImage(currentVolume);
  shineTimeline?.kill();shineTimeline=null;
  basketTween?.kill();basketTween=null;if(window.gsap)gsap.set(basketDialog,{clearProps:'transform'});
  if(window.gsap){gsap.set(morph,{scale:volumeScales[currentVolume],rotationY:0,y:0,autoAlpha:1});gsap.set(sweep,{opacity:0,'--shine-x':'150%'});}
  else morph.style.transform=`scale(${volumeScales[currentVolume]})`;
 }
 function close(dialog){
  if(!dialog.open)return Promise.resolve();
  if(closePromise)return closePromise;
  settleMotion();resetConfirmation();
  closePromise=new Promise(resolve=>dialog.addEventListener('close',()=>{closePromise=null;resolve();},{once:true}));
  const complete=()=>{
   if(sourceImage)delete sourceImage.dataset.flightHidden;
   closingTimeline=null;root.style.overflow='';root.classList.remove('has-modal');dialog.close();
   window.scrollTo({top:savedY,behavior:'instant'});document.dispatchEvent(new CustomEvent('obsidian:modal',{detail:{open:false,top:savedY}}));openers.get(dialog)?.focus({preventScroll:true});
  };
  if(dialog===menu&&animated()){
   menu.style.clipPath='url(#menu-liquid)';menu.dataset.phase='draining';
   menuTimeline=gsap.timeline({onComplete:()=>{menuTimeline=null;menu.style.removeProperty('clip-path');complete();}})
    .to(menu.querySelectorAll('nav a,.menu-signature'),{opacity:0,y:15,duration:.22},0)
    .fromTo(menuEdge,{attr:{d:liquidPath(-.15)}},{attr:{d:liquidPath(1.15)},duration:.65,ease:'power2.inOut'},0);
   return closePromise;
  }
  if(dialog!==productDialog||!animated()){complete();return closePromise;}
  productDialog.dataset.phase='closing';information.inert=true;
  const sourceVisible=sourceImage&&sourceImage.getBoundingClientRect().bottom>0&&sourceImage.getBoundingClientRect().top<innerHeight;
  if(!sourceVisible||!window.Flip){complete();return closePromise;}
  scene.style.overflow='visible';
  const changedVariant=displayedVolume!==50;
  closingTimeline=gsap.timeline({onComplete:complete})
   .to([information,caption,brand],{autoAlpha:0,duration:.18},0);
  if(changedVariant)closingTimeline.to(image,{opacity:0,duration:.12},0).call(()=>{image.src=sourceImage.currentSrc;image.alt=sourceImage.alt;},[],.12).to(image,{opacity:1,duration:.18},.12);
  closingTimeline.to(image,{...Flip.fit(image,sourceImage,{getVars:true,scale:true}),duration:.72,ease:'power3.inOut'},changedVariant?.18:.08)
   .to(productDialog,{'--backdrop-blur':'0px','--backdrop-dim':0,duration:.45},changedVariant?.4:.3);
  return closePromise;
 }
 dialogs.forEach(dialog=>{
  dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>close(dialog)));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog);});
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close(dialog);});
  dialog.addEventListener('close',()=>{variantRevision++;volumeTimeline?.kill();volumeTimeline=null;root.style.overflow='';scene.style.overflow='';if(dialog===productDialog&&sourceImage)delete sourceImage.dataset.flightHidden;});
 });
 document.querySelector('.menu-open').addEventListener('click',event=>{
  if(!show(menu,event.currentTarget))return;
  const content=menu.querySelectorAll('.dialog-top,nav a,.menu-signature');
  if(!animated()){menu.dataset.phase='open';if(window.gsap)gsap.set(content,{clearProps:'opacity,transform'});return;}
  menu.style.clipPath='url(#menu-liquid)';menu.dataset.phase='filling';
  menuTimeline=gsap.timeline({onComplete:()=>{menuTimeline=null;menu.dataset.phase='open';menu.style.removeProperty('clip-path');}})
   .fromTo(menuEdge,{attr:{d:liquidPath(1.15)}},{attr:{d:liquidPath(-.15)},duration:1.05,ease:'power2.inOut'},0)
   .fromTo(content,{opacity:0,y:24},{opacity:1,y:0,stagger:.055,duration:.45,ease:'power3.out',clearProps:'transform,opacity'},.55);
 });

 async function setVolume(volume,animate=true){
  priceFor(currentProduct.id,volume);currentVolume=volume;const revision=++variantRevision;
  finishOpening();resetConfirmation();volumeTimeline?.kill();volumeTimeline=null;shineTimeline?.kill();shineTimeline=null;
  productDialog.dataset.volume=String(volume);
  productDialog.querySelectorAll('.volume-picker button[data-volume]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.volume)===volume)));
  productDialog.querySelector('.product-price').textContent=currency(priceFor(currentProduct.id,volume));
  productDialog.querySelector('.volume-caption').textContent=`${volume} ml`;
  productDialog.querySelector('.product-feedback').textContent='';
  if(window.gsap){gsap.set(morph,{autoAlpha:1,rotationY:0,y:0,scale:volumeScales[displayedVolume]});gsap.set(sweep,{opacity:0});}
  if(!animate||!animated()){
   applyImage(volume);morph.style.opacity='1';morph.style.visibility='visible';
   if(window.gsap)gsap.set(morph,{scale:volumeScales[volume],rotationY:0,y:0,autoAlpha:1});else morph.style.transform=`scale(${volumeScales[volume]})`;
   return;
  }
  const available=await loadAsset(imageFor(currentProduct.id,volume));
  if(revision!==variantRevision||!productDialog.open)return;
  if(!available){productDialog.querySelector('.product-feedback').textContent='Изображение этого объёма не загрузилось. Попробуй выбрать его ещё раз.';return;}
  volumeTimeline=gsap.timeline();
  volumeTimeline.to(morph,{autoAlpha:0,rotationY:-28,y:12,scale:volumeScales[displayedVolume]*.9,duration:.16,ease:'power2.in'})
   .call(()=>applyImage(volume))
   .set(morph,{rotationY:24,y:8,scale:volumeScales[volume]*.9})
   .to(morph,{autoAlpha:1,rotationY:0,y:0,scale:volumeScales[volume],duration:.58,ease:'expo.out'})
   .call(runShine,[],.45);
 }
 document.querySelectorAll('button[data-product],button[data-footer-product]').forEach(button=>button.addEventListener('click',()=>{
  if(dialogs.some(d=>d.open))return;
  currentProduct=products.find(p=>p.id===(button.dataset.product||button.dataset.footerProduct));if(!currentProduct)return;
  document.dispatchEvent(new Event('obsidian:product-open'));
  sourceImage=button.querySelector('img');
  scene.dataset.scent=currentProduct.id;productDialog.dataset.product=currentProduct.id;
  productDialog.querySelector('h2').textContent=currentProduct.name;
  productDialog.querySelector('.product-family').textContent=currentProduct.family;
  productDialog.querySelector('.product-description').textContent=currentProduct.description;
  productDialog.querySelector('.product-notes').replaceChildren(...currentProduct.notes.map(([label,value])=>{const row=document.createElement('div');const dt=document.createElement('dt');const dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);return row;}));
  setVolume(50,false);show(productDialog,button);
  productDialog.style.setProperty('--backdrop-blur','28px');productDialog.style.setProperty('--backdrop-dim','.62');
  loadAsset(imageFor(currentProduct.id,20));loadAsset(imageFor(currentProduct.id,100));
  if(!animated()||!window.Flip){revealImmediately();return;}
  if(sourceImage)sourceImage.dataset.flightHidden='true';
  const mobile=matchMedia('(max-width:760px)').matches;
  productDialog.dataset.phase='bottle';information.inert=true;scene.style.overflow='visible';
  gsap.set([information,...information.children,caption,brand],{autoAlpha:0});
  gsap.set(productDialog,{'--backdrop-blur':'0px','--backdrop-dim':0});
  openingTimeline=gsap.timeline({onComplete:()=>{openingTimeline=null;revealImmediately();runShine();}})
   .from(image,{...(sourceImage?Flip.fit(image,sourceImage,{getVars:true,scale:true}):{scale:.85,autoAlpha:0}),duration:mobile?.75:.9,ease:'expo.inOut',clearProps:'transform,opacity,visibility'},0)
   .to(productDialog,{'--backdrop-blur':'28px','--backdrop-dim':.62,duration:mobile?.5:.7,ease:'power2.inOut'},mobile?.35:.15)
   .call(()=>{productDialog.dataset.phase='details';scene.style.overflow='';})
   .set(information,{autoAlpha:1})
   .to([caption,brand],{autoAlpha:1,duration:.35},mobile?.8:.92)
   .fromTo(information.children,{y:16,autoAlpha:0},{y:0,autoAlpha:1,duration:.5,stagger:.035,ease:'power2.out'},mobile?.8:.92);
 }));
 productDialog.querySelectorAll('.volume-picker button[data-volume]').forEach(button=>button.addEventListener('click',()=>setVolume(Number(button.dataset.volume))));

 function persist(){try{localStorage.setItem('obsidian-basket',JSON.stringify(basket));}catch{}renderBasket();}
 function renderBasket(){
  const count=basket.reduce((sum,item)=>sum+item.quantity,0);
  document.querySelector('.bag-open').setAttribute('aria-label',count?`Открыть корзину, товаров: ${count}`:'Открыть корзину');
  const container=basketDialog.querySelector('.basket-items');container.replaceChildren();
  if(!basket.length){const empty=document.createElement('p');empty.className='basket-empty';empty.textContent='Здесь будет твой аромат.';container.append(empty);}
  basket.forEach((item,index)=>{
   const product=products.find(p=>p.id===item.id);const row=document.createElement('article');row.className='basket-line';
   row.innerHTML=`<img src="${imageFor(item.id,item.volume)}" alt="${product.name}" width="90" height="140"><div><h3>${product.name}</h3><p>${item.volume} ml / Extrait de parfum</p><div class="basket-line-bottom"><span class="quantity-control"><button type="button" data-change="-1" aria-label="Уменьшить количество ${product.name}">−</button><span>${item.quantity}</span><button type="button" data-change="1" aria-label="Увеличить количество ${product.name}">+</button></span><span>${currency(priceFor(item.id,item.volume)*item.quantity)}</span></div><button class="remove-item" type="button">Убрать аромат</button></div>`;
   row.querySelectorAll('[data-change]').forEach(button=>button.addEventListener('click',()=>{const change=button.dataset.change;item.quantity=Math.min(99,item.quantity+Number(change));if(item.quantity<1)basket.splice(index,1);persist();const next=basketDialog.querySelectorAll('.basket-line')[index]?.querySelector(`[data-change="${change}"]`);(next||basketDialog.querySelector('.dialog-close')).focus({preventScroll:true});}));
   row.querySelector('.remove-item').addEventListener('click',()=>{basket.splice(index,1);persist();basketDialog.querySelector('.dialog-close').focus({preventScroll:true});});container.append(row);
  });
  basketDialog.querySelector('[data-basket-total]').textContent=currency(basketTotal(basket));
  basketDialog.querySelector('.checkout-button').disabled=!basket.length;
 }
 function addCurrentVariant(){
  if(information.inert)return;
  basket=addToBasket(basket,currentProduct.id,currentVolume);persist();resetConfirmation();
  addButton.classList.add('is-added');addButton.querySelector('.purchase-label').textContent='Добавлено';
  productDialog.querySelector('.product-feedback').textContent=`${currentProduct.name}, ${currentVolume} ml — в твоей корзине.`;
  confirmationTimer=setTimeout(resetConfirmation,1800);
 }
 function openBasket(opener){renderBasket();if(show(basketDialog,opener)&&animated())basketTween=gsap.fromTo(basketDialog,{xPercent:100},{xPercent:0,duration:.55,ease:'power3.out',clearProps:'transform',onComplete:()=>{basketTween=null;}});}
 addButton.addEventListener('click',addCurrentVariant);
 buyButton.addEventListener('click',async()=>{
  if(information.inert||buyPending)return;buyPending=true;buyButton.disabled=true;
  try{const opener=openers.get(productDialog);addCurrentVariant();await close(productDialog);openBasket(opener);}finally{buyPending=false;buyButton.disabled=false;}
 });
 document.querySelectorAll('.bag-open,[data-open-basket]').forEach(button=>button.addEventListener('click',event=>openBasket(event.currentTarget)));
 const informationPages={
  choose:['Как выбрать аромат','Начни с ощущения: тёплый Ambre, прохладный Iris или древесный Cèdre. Остальные шесть ароматов раскрывают цветочные, мягкие и зелёные грани коллекции.','Открой карточку, сравни характер и пирамиду нот. В каждом аромате можно выбрать один из трёх объёмов: 20, 50 или 100 ml.'],
  concentration:['Extrait de parfum','Коллекция задумана в формате парфюмерного экстракта: камерное звучание, глубина и внимание к каждой ноте.','На этой витрине представлены художественные описания ароматов. Точные формулы и характеристики реального продукта не заявлены.'],
  care:['Хранение флакона','Храни флакон плотно закрытым, вдали от прямого солнечного света и сильных перепадов температуры.','Гранёная крышка и стекло — часть образа OBSIDIAN. Для ухода достаточно мягкой сухой ткани.'],
  delivery:['Доставка и оплата','OBSIDIAN — концептуальная витрина для портфолио. Доставка и приём платежей не подключены.','Корзина помогает собрать собственную коллекцию и сравнить объёмы. Заказ не отправляется, списаний нет.'],
  orders:['О заказе','Выбранные ароматы и количество сохраняются в этом браузере. Их можно изменить или удалить в корзине.','Оформление здесь демонстрационное: персональные данные не запрашиваются, заказ не передаётся продавцу.'],
  house:['О коллекции','Девять ароматов на границе света и тёмной материи: Ambre, Iris, Cèdre, Santal, Rose, Oud, Néroli, Musc и Figue.','Обсидиан стал отправной точкой для формы флакона, игры отражений и тёплой глубины цвета.'],
  project:['Об этом проекте','OBSIDIAN — независимый концепт парфюмерного дома. Изображения, названия ароматов и цены созданы для демонстрации дизайна и взаимодействия.','Сайт сочетает покадровое видео, 3D-скульптуру обсидиана и локальную корзину. Реальные продажи не осуществляются.']
 };
 document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{
  const content=informationPages[button.dataset.info];if(!content)return;
  infoDialog.querySelector('h2').textContent=content[0];infoDialog.querySelector('.info-content').replaceChildren(...content.slice(1).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));show(infoDialog,button);
 }));
 basketDialog.querySelector('.checkout-button').addEventListener('click',async()=>{
  if(!basket.length)return;
  const opener=openers.get(basketDialog);await close(basketDialog);
  infoDialog.querySelector('h2').textContent='Твой заказ';
  const list=document.createElement('ul');list.className='basket-review-list';
  basket.forEach(item=>{const row=document.createElement('li'),name=document.createElement('span'),price=document.createElement('strong');name.textContent=`${products.find(p=>p.id===item.id).name} · ${item.volume} ml × ${item.quantity}`;price.textContent=currency(priceFor(item.id,item.volume)*item.quantity);row.append(name,price);list.append(row);});
  const total=document.createElement('p');total.className='order-total';const label=document.createElement('span'),value=document.createElement('span');label.textContent='Итого';value.textContent=currency(basketTotal(basket));total.append(label,value);
  const actions=document.createElement('div');actions.className='order-actions';const back=document.createElement('button'),browse=document.createElement('button');back.type=browse.type='button';back.textContent='Изменить состав';browse.textContent='Продолжить выбор';
  back.addEventListener('click',async()=>{await close(infoDialog);openBasket(opener);});browse.addEventListener('click',async()=>{await close(infoDialog);document.querySelector('.site-header a[href="#catalog"]')?.click();});actions.append(back,browse);
  infoDialog.querySelector('.info-content').replaceChildren(list,total,actions);show(infoDialog,opener);
 });
 renderBasket();return {closeMenu:()=>close(menu),settleMotion};
}
