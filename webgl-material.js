import * as THREE from 'three';
import {RoomEnvironment} from './assets/vendor/RoomEnvironment.js';
import {ConvexGeometry} from './assets/vendor/ConvexGeometry.js';

function makeObsidian(group,onTextureReady){
 const surface=new THREE.TextureLoader().load('assets/obsidian-surface-v7.webp',onTextureReady);surface.colorSpace=THREE.SRGBColorSpace;surface.wrapS=surface.wrapT=THREE.RepeatWrapping;surface.repeat.set(1.2,1.6);
 const outer=new THREE.MeshPhysicalMaterial({color:'#a5a5a5',map:surface,metalness:0,roughness:.58,clearcoat:.13,clearcoatRoughness:.38,specularIntensity:.22,bumpMap:surface,bumpScale:.035,envMapIntensity:.24,side:THREE.DoubleSide});
 const fracture=new THREE.MeshPhysicalMaterial({color:'#bfb4a5',map:surface,metalness:0,roughness:.39,clearcoat:.22,clearcoatRoughness:.3,specularIntensity:.28,bumpMap:surface,bumpScale:.045,envMapIntensity:.28,side:THREE.DoubleSide});
 const halves=[];
 const rings=80,steps=56,depthSteps=48;
 const noise=(a,b)=>Math.sin(a*12.9898+b*78.233)*43758.5453%1;
 const profile=[0,.39,.69,.85,.95,1,.96,.84,.66,.36,0];
 const radius=y=>{const f=Math.max(0,Math.min(10,(y+1)*5)),i=Math.min(9,Math.floor(f));return profile[i]+(profile[i+1]-profile[i])*(f-i);};
 const split=(y,z)=>.13*Math.sin(y*2.5)+.055*Math.sin(y*7.2)+.045*Math.sin(z*7+y*3);
 function point(side,i,j,inside=false){
  const t=i/rings,yn=t*2-1,y=yn*1.78,r=radius(yn);
  const angle=j/steps*Math.PI,slot=j/steps*7,lo=Math.min(6,Math.floor(slot)),blend=slot-lo;
  const angular=(fn)=>fn(lo/7*Math.PI)*(1-blend)+fn((lo+1)/7*Math.PI)*blend;
  const z=.73*r*angular(Math.cos);
  const cut=split(y,z);
  const ridge=1+.045*Math.sin(y*4+angle*3);
  const fractureRipples=Math.sin(blend*Math.PI)**2*Math.cos(Math.hypot(y-.5,z*1.3)*30)*.008;
  return new THREE.Vector3(cut+side*(1.13*r*angular(Math.sin)*ridge+.008+fractureRipples),y,z);
 }
 function meshFromGrid(rows,columns,vertex,material,smooth=false){
  const positions=[],uvs=[];
  const triangle=(a,b,c,uv)=>{for(const [v,coord] of [[a,uv[0]],[b,uv[1]],[c,uv[2]]]){positions.push(v.x,v.y,v.z);uvs.push(...coord);}};
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
   const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i,j+1),d=vertex(i+1,j+1);
   const u=j/columns,v=i/rows,du=1/columns,dv=1/rows;
   // Alternating diagonals break up the regular grid into natural sharp chips.
   if((i+j)%2){triangle(a,b,c,[[u,v],[u,v+dv],[u+du,v]]);triangle(b,d,c,[[u,v+dv],[u+du,v+dv],[u+du,v]]);}
   else{triangle(a,b,d,[[u,v],[u,v+dv],[u+du,v+dv]]);triangle(a,d,c,[[u,v],[u+du,v+dv],[u+du,v]]);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  if(smooth){
   const p=geometry.attributes.position,n=geometry.attributes.normal,shared=new Map(),keys=[];
   for(let i=0;i<p.count;i++){const key=`${Math.round(p.getX(i)*1e5)},${Math.round(p.getY(i)*1e5)},${Math.round(p.getZ(i)*1e5)}`;keys.push(key);const v=shared.get(key)||new THREE.Vector3();v.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));shared.set(key,v);}
   shared.forEach(v=>v.normalize());for(let i=0;i<n.count;i++){const v=shared.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}
  }
  return new THREE.Mesh(geometry,material);
 }
 for(const side of [-1,1]){
  const half=new THREE.Group();group.add(half);halves.push({half,side});
  half.add(meshFromGrid(rings,steps,(i,j)=>{
   const v=point(side,i,j);
   const edge=Math.sin(j/steps*Math.PI)*Math.sin(i/rings*Math.PI);
   v.x+=side*noise(i,j)*.007*edge;v.z+=noise(j,i)*.006*edge;
   return v;
  },outer,true));
  half.add(meshFromGrid(rings,depthSteps,(i,j)=>{
   const front=point(side,i,0),back=point(side,i,steps),f=j/depthSteps;
   const z=front.z+(back.z-front.z)*f,y=front.y;
   const edge=Math.sin(f*Math.PI)*Math.sin(i/rings*Math.PI);
   // Conchoidal fracture ripples terminate at the matching outer shell.
   const ripple=Math.cos(Math.hypot(y-.38,z*1.3)*27)*.028;
   return new THREE.Vector3(split(y,z)+side*(.008+(ripple+noise(i,j)*.012)*edge),y,z);
  },fracture,true));
  for(let i=0;i<5;i++){
   const y=-1.1+i*.48,z=.5*radius(y/1.78),x=split(y,z);
   const points=[new THREE.Vector3(x,y,z),new THREE.Vector3(x+side*.2,y+.19,z-.04),new THREE.Vector3(x+side*.09,y-.16,z-.12),new THREE.Vector3(x-side*.06,y+.05,z-.17),new THREE.Vector3(x+side*.1,y+.03,z+.065)];
   const chip=new THREE.Mesh(new ConvexGeometry(points),i%2?fracture:outer);half.add(chip);
  }
 }
 const fissureLight=new THREE.PointLight('#e38a35',4,2.8);fissureLight.position.set(0,.15,-.25);group.add(fissureLight);
 group.rotation.set(.05,-.31,.08);
 return {textures:[surface],update(time,pointer){
  group.rotation.y=-.31+Math.sin(time*.16)*.13+pointer.x*.5;
  group.rotation.x=.05+pointer.y*.16;group.position.y=Math.sin(time*.35)*.035;
  for(const {half,side} of halves){half.position.x=side*(.16+Math.sin(time*.3)*.018);half.rotation.y=side*.09;half.rotation.z=side*-.035;}
 }};
}
export function createScene(host,{isCalm}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.7));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,60);camera.position.set(0,.1,8.8);camera.lookAt(0,0,0);
 const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const target=pmrem.fromScene(environment,.035);scene.environment=target.texture;environment.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight('#f2e7d9','#292333',1));
 const rim=new THREE.DirectionalLight('#ffbb6a',4);rim.position.set(4,3,-2);scene.add(rim);
 const key=new THREE.DirectionalLight('#f0f4ff',2.4);key.position.set(-4,4,4);scene.add(key);
 const warm=new THREE.PointLight('#ff9c39',9,9);warm.position.set(1,.4,-1);scene.add(warm);
 const group=new THREE.Group();scene.add(group);const invalidate=()=>{if(visible&&!disposed)render(0);};const materialScene=makeObsidian(group,invalidate);
 let visible=false,raf=0,last=0,time=0,lost=false,disposed=false;
 const pointer={x:0,y:0};
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=8.8*Math.max(1,.9/camera.aspect);camera.updateProjectionMatrix();render(0);}
 function render(delta){if(disposed||lost)return;time+=delta;materialScene.update(time,pointer);renderer.render(scene,camera);host.dataset.ready='true';}
 function frame(stamp){raf=0;if(!visible||isCalm()||lost||disposed)return;if(stamp-last>32){const delta=Math.min((stamp-last)/1000,.06);last=stamp;render(delta);}raf=requestAnimationFrame(frame);}
 function start(){if(visible&&!isCalm()&&!lost&&!raf&&!disposed){last=performance.now();raf=requestAnimationFrame(frame);}else if(visible)render(0);}
 const move=event=>{const r=host.getBoundingClientRect();pointer.x=(event.clientX-r.left)/r.width-.5;pointer.y=(event.clientY-r.top)/r.height-.5;if(isCalm())render(0);};
 const leave=()=>{pointer.x=pointer.y=0;if(isCalm())render(0);};
 const keydown=event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();pointer.x+=event.key==='ArrowLeft'?-.25:event.key==='ArrowRight'?.25:0;pointer.y+=event.key==='ArrowUp'?-.25:event.key==='ArrowDown'?.25:0;render(0);};
 host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',leave);host.addEventListener('keydown',keydown);
 const lose=event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;host.dataset.ready='false';renderer.domElement.style.visibility='hidden';};
 const restore=()=>{lost=false;renderer.domElement.style.visibility='';render(0);start();};
 renderer.domElement.addEventListener('webglcontextlost',lose);renderer.domElement.addEventListener('webglcontextrestored',restore);
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 return {setVisible(value){visible=value;if(!visible){cancelAnimationFrame(raf);raf=0;}else start();},reset(){cancelAnimationFrame(raf);raf=0;pointer.x=pointer.y=0;if(visible){render(0);start();}},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);host.removeEventListener('keydown',keydown);renderer.domElement.removeEventListener('webglcontextlost',lose);renderer.domElement.removeEventListener('webglcontextrestored',restore);const textures=new Set([target.texture,...(materialScene.textures||[])]);scene.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(!material)return;for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();});});textures.forEach(t=>t.dispose());target.dispose();renderer.dispose();renderer.domElement.remove();}};
}

