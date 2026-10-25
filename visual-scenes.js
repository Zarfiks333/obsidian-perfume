// Heavy WebGL code is loaded only when a material scene approaches the viewport.
export function initVisualScenes({isCalm}){
 const records=[...document.querySelectorAll('[data-scene]')].map(host=>({host,scene:null,visible:false,pending:false}));
 let disposed=false;
 async function prepare(record){
  if(record.scene||record.pending||disposed)return;record.pending=true;
  try{
   const {createScene}=await import('./webgl-material.js');
   if(disposed)return;
   record.scene=createScene(record.host,{isCalm});
   record.scene.setVisible(record.visible&&!document.hidden);
  }catch{record.host.dataset.ready='false';record.host.dataset.fallback='true';}
 }
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const record=records.find(r=>r.host===entry.target);record.visible=entry.isIntersecting;
  if(entry.isIntersecting)prepare(record);
  record.scene?.setVisible(entry.isIntersecting&&!document.hidden);
 }),{rootMargin:'160px'});
 records.forEach(record=>observer.observe(record.host));
 const visibility=()=>records.forEach(r=>r.scene?.setVisible(r.visible&&!document.hidden));
 document.addEventListener('visibilitychange',visibility);
 return {reset(){records.forEach(r=>r.scene?.reset());},destroy(){disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',visibility);records.forEach(r=>r.scene?.dispose());}};
}
