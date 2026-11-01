// A fixed local-light budget prevents shader recompilation every time a coach
// interior or village lamp enters view. Original lights retain their animation;
// their nearest useful contributions are copied to stable renderer lights.
const sourcePointLights=[];
scene.traverse(light=>{if(light.isPointLight){sourcePointLights.push({light,position:new T.Vector3()});light.layers.set(31);}});
const renderPointLights=Array.from({length:4},()=>{const light=new T.PointLight(0xffffff,0,1,2);scene.add(light);return light;});
function updateLocalLighting(){
 const candidates=[];
 for(const entry of sourcePointLights){
  const light=entry.light;if(light.intensity<=0)continue;
  let visible=true;for(let parent=light;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}
  if(!visible)continue;
  light.getWorldPosition(entry.position);const distance=entry.position.distanceTo(camera.position);
  if(light.distance&&distance>light.distance+300)continue;
  entry.distance=distance;candidates.push(entry);
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 for(let i=0;i<renderPointLights.length;i++){
  const target=renderPointLights[i],entry=candidates[i];
  if(!entry){target.intensity=0;continue;}
  target.position.copy(entry.position);target.color.copy(entry.light.color);target.intensity=entry.light.intensity;target.distance=entry.light.distance;target.decay=entry.light.decay;
 }
}
