// Native decoding avoids constructing a JavaScript number for every asset byte.
function decodeBase64Bytes(encoded){if(encoded instanceof Uint8Array)return encoded;if(Uint8Array.fromBase64)return Uint8Array.fromBase64(encoded);const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
// Web manifests contain byte ranges into one compressed binary pack per scene
// component. The offline edition keeps its original base64 representation.
async function hydratePackedArrays(root){
 const packs=new Map();
 async function visit(value){
  if(!value||typeof value!=='object'||ArrayBuffer.isView(value))return value;
  if(value.$packed){
   if(!packs.has(value.$packed))packs.set(value.$packed,(async()=>{
    const response=await fetch(value.$packed);
    if(!response.ok)throw Error('Could not load scene data ('+response.status+')');
    return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   })());
   const buffer=await packs.get(value.$packed);
   if(value.offset<0||value.bytes<0||value.offset+value.bytes>buffer.byteLength)throw Error('Invalid scene data range');
   return new Uint8Array(buffer,value.offset,value.bytes);
  }
  for(const key of Object.keys(value))value[key]=await visit(value[key]);
  return value;
 }
 return visit(root);
}
async function inflateAsset(encoded){const bytes=decodeBase64Bytes(encoded);return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());}
async function readPackedAsset(store,key,release=false){
 let bytes;
 if(store.$external){const response=await fetch(store[key]);if(!response.ok)throw Error('Could not load '+key+' ('+response.status+')');bytes=new Uint8Array(await (store.$gzip?.includes(key)?new Response(response.body.pipeThrough(new DecompressionStream('gzip'))):response).arrayBuffer());}
 else bytes=store.$gzip?.includes(key)?await inflateAsset(store[key]):decodeBase64Bytes(store[key]);
 if(release)delete store[key];return bytes;
}
function releaseGLTFSource(asset){asset.scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});asset.scene.clear();asset.parser=null;}
window.__startupStages=[];
async function bootYield(label){if(label)$('loading').querySelector('p').textContent=label;window.__startupStages.push({label,time:performance.now()});if(window.scheduler?.yield)await window.scheduler.yield();else await new Promise(resolve=>setTimeout(resolve,0));}
async function readTerrainCache(){const cache=window.NORTHBOUND_TERRAIN_CACHE;if(!cache||cache.sourceHash!==terrainBuildKey||new URLSearchParams(location.search).has('bakeTerrain'))return null;await bootYield('OPENING THE NORTHERN LANDSCAPE');await hydratePackedArrays(cache);const result={};for(const name of ['land','farLand']){const geometry=new T.BufferGeometry();for(const [key,entry]of Object.entries(cache.meshes[name])){const raw=await inflateAsset(entry.data),Type=entry.type==='Float32Array'?Float32Array:Uint32Array,attribute=new T.BufferAttribute(new Type(raw.buffer),entry.itemSize);if(key==='index')geometry.setIndex(attribute);else geometry.setAttribute(key,attribute);}result[name]=mesh(geometry,snowMat,scene);result[name].castShadow=false;result[name].name=name==='land'?'Continuous adaptive valley terrain':'Distant continuous terrain';result[name].userData.continuousSnowRock=true;await bootYield('OPENING THE NORTHERN LANDSCAPE');}const keysRaw=await inflateAsset(cache.fine.keys),heightsRaw=await inflateAsset(cache.fine.heights),keys=new Uint32Array(keysRaw.buffer),heights=new Float32Array(heightsRaw.buffer);for(let i=0;i<keys.length;i++)fineTerrainCells.set(keys[i],heights.subarray(i*81,(i+1)*81));window.__terrainCacheState={loaded:true,cells:keys.length,exactCachedMesh:true};window.NORTHBOUND_TERRAIN_CACHE=null;return result;}
