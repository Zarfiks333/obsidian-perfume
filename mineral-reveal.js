// Two photographic fracture faces reveal with the existing scroll clock.
// Only transforms and opacity change; no animation loop or WebGL context.
export function createMineralReveal(host){
 const halves=[...host.querySelectorAll('.mineral-half')];
 const light=host.querySelector('.mineral-light');
 let previous='';
 function render(reveal=1,horizontal=0){
  const r=Math.max(0,Math.min(1,reveal)),h=Math.max(0,Math.min(1,horizontal));
  const key=`${r.toFixed(4)},${h.toFixed(4)}`;if(key===previous)return;previous=key;
  const open=r*r*(3-2*r);
  halves.forEach((half,i)=>{const side=i?1:-1;half.style.transform=`translate3d(${side*(-3+open*8)}%,${(1-open)*9-side*open*1.5}%,0) rotate(${side*open*4}deg) scale(${.91+open*.09})`;});
  light.style.opacity=String(open*(1-Math.min(1,h*3))*.65);
  host.dataset.reveal=r.toFixed(4);
 }
 render();
 return {render};
}
