// Preserve every triangle and texture, but give the renderer bounded pieces so
// it can reject scenery outside each camera (including the shadow camera).
function partitionTerrain(source, cellSize) {
 const geometry=source.geometry,index=geometry.index,position=geometry.attributes.position;
 const cells=new Map();
 for(let i=0;i<index.count;i+=3){
  const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
  const x=(position.getX(a)+position.getX(b)+position.getX(c))/3,z=(position.getZ(a)+position.getZ(b)+position.getZ(c))/3;
  const key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
  let cell=cells.get(key);if(!cell){cell={indices:[],bounds:new T.Box3()};cells.set(key,cell);}
  cell.indices.push(a,b,c);
  for(const id of [a,b,c])cell.bounds.expandByPoint(spatialVertex.set(position.getX(id),position.getY(id),position.getZ(id)));
 }
 const group=new T.Group();group.name=source.name+' / spatial tiles';group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);source.parent.add(group);
 for(const cell of cells.values()){
  const g=new T.BufferGeometry();for(const [name,attribute]of Object.entries(geometry.attributes))g.setAttribute(name,attribute);
  g.setIndex(cell.indices);g.boundingBox=cell.bounds;g.boundingSphere=cell.bounds.getBoundingSphere(new T.Sphere());
  const tile=new T.Mesh(g,source.material);tile.castShadow=source.castShadow;tile.receiveShadow=source.receiveShadow;group.add(tile);
 }
 source.visible=false;return group;
}
const spatialVertex=new T.Vector3();
function partitionStaticInstances(source,cellSize=256){
 const cells=new Map(),matrix=new T.Matrix4(),color=new T.Color();
 for(let i=0;i<source.count;i++){
  source.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/cellSize)+','+Math.floor(matrix.elements[14]/cellSize);
  if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);
 }
 const group=new T.Group();group.name=source.name+' / spatial instances';group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);source.parent.add(group);
 for(const indices of cells.values()){
  const part=new T.InstancedMesh(source.geometry,source.material,indices.length);part.castShadow=source.castShadow;part.receiveShadow=source.receiveShadow;part.customDepthMaterial=source.customDepthMaterial;
  for(let i=0;i<indices.length;i++){source.getMatrixAt(indices[i],matrix);part.setMatrixAt(i,matrix);if(source.instanceColor){source.getColorAt(indices[i],color);part.setColorAt(i,color);}}
  part.computeBoundingSphere();part.boundingSphere.radius+=4;group.add(part);
 }
 source.removeFromParent();source.dispose();return group;
}
function updateSpatialInstances(source,cellSize=64){
 let state=source.userData.spatialDraws;
 if(!state){const group=new T.Group();group.name='Nearby scenery / spatial instances';source.parent.add(group);source.visible=false;state=source.userData.spatialDraws={group,parts:new Map()};}
 const cells=new Map(),matrix=new T.Matrix4(),color=new T.Color();
 for(let i=0;i<source.count;i++){source.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/cellSize)+','+Math.floor(matrix.elements[14]/cellSize);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);}
 for(const part of state.parts.values())part.visible=false;
 for(const [key,indices]of cells){
  let part=state.parts.get(key);
  if(!part||part.instanceMatrix.count<indices.length){
   if(part){part.removeFromParent();part.dispose();}
   part=new T.InstancedMesh(source.geometry,source.material,Math.max(16,indices.length));part.castShadow=source.castShadow;part.receiveShadow=source.receiveShadow;part.customDepthMaterial=source.customDepthMaterial;part.instanceMatrix.setUsage(T.DynamicDrawUsage);state.group.add(part);state.parts.set(key,part);
  }
  part.visible=true;part.count=indices.length;
  for(let i=0;i<indices.length;i++){source.getMatrixAt(indices[i],matrix);part.setMatrixAt(i,matrix);if(source.instanceColor){source.getColorAt(indices[i],color);part.setColorAt(i,color);}}
  part.instanceMatrix.needsUpdate=true;if(part.instanceColor)part.instanceColor.needsUpdate=true;part.computeBoundingSphere();part.boundingSphere.radius+=8;
 }
 // Bound memory as the train moves through the route.
 for(const [key,part]of state.parts)if(!part.visible){part.removeFromParent();part.dispose();state.parts.delete(key);}
}
