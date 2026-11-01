const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const T=require('./three.min.js');
function spatial(){const c=vm.createContext({T});vm.runInContext(fs.readFileSync('spatial-runtime.js','utf8'),c);return c;}
test('terrain partitions preserve all triangles, attributes, transforms and bounds',()=>{
 const c=spatial(),scene=new T.Scene(),g=new T.PlaneGeometry(100,100,8,8).rotateX(-Math.PI/2),m=new T.Mesh(g,new T.MeshBasicMaterial());m.position.set(4,7,9);scene.add(m);
 const tiles=c.partitionTerrain(m,25),indices=[];
 assert.deepEqual(tiles.position.toArray(),m.position.toArray());assert.equal(m.visible,false);
 for(const tile of tiles.children){assert.equal(tile.geometry.attributes.position,g.attributes.position);for(const i of tile.geometry.index.array){indices.push(i);assert.ok(tile.geometry.boundingBox.containsPoint(new T.Vector3().fromBufferAttribute(g.attributes.position,i)));}}
 assert.deepEqual(indices.sort((a,b)=>a-b),Array.from(g.index.array).sort((a,b)=>a-b));
});
test('static batching retains instance matrices and colors',()=>{
 const c=spatial(),scene=new T.Scene(),source=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),3);scene.add(source);
 for(let i=0;i<3;i++){source.setMatrixAt(i,new T.Matrix4().makeTranslation(i*300,2,3));source.setColorAt(i,new T.Color(i/3,.2,.4));}
 const group=c.partitionStaticInstances(source,256);assert.equal(group.children.length,3);assert.equal(source.parent,null);
 const positions=[];for(const p of group.children){const m=new T.Matrix4();p.getMatrixAt(0,m);positions.push(m.elements[12]);assert.ok(p.boundingSphere.radius>0);}assert.deepEqual(positions.sort((a,b)=>a-b),[0,300,600]);
});
test('audio lookahead schedules evenly, skips stalled intervals, and respects pause',()=>{
 const events=[],joints=[],a={ready:true,storyStarted:true,ctx:{state:'running'},storyEpoch:100,effectsScheduledUntil:0,joints:0};
 const c=vm.createContext({running:true,audio:a,now:0,storyTime:()=>c.now,storyDuration:500,polarAxles:[{kind:'driving',radius:1}],TAU:Math.PI*2,journeyPosition:t=>240+t*20,journeyMotion:()=>({speed:20}),exhaustBeat:(time)=>events.push(time),steamBurst:(time)=>joints.push(time),setInterval:()=>{}});
 const source=fs.readFileSync('story-audio.js','utf8');vm.runInContext(source.slice(source.indexOf('function scheduleTrainAudio()')),c);
 c.scheduleTrainAudio();assert.equal(events.length,3);assert.ok(Math.abs(events[1]-events[0]-Math.PI/40)<1e-9);
 c.now=.05;c.scheduleTrainAudio();assert.equal(events.length,3);c.now=2;c.scheduleTrainAudio();assert.ok(events.slice(3).every(t=>t>=102.01));
 c.running=false;const count=events.length;c.now=3;c.scheduleTrainAudio();assert.equal(events.length,count);
 a.effectsScheduledUntil=50;c.now=50;c.running=true;c.scheduleTrainAudio();assert.ok(events.at(-1)>150);
});
test('forest batching preserves every tree, atlas tile and color',()=>{
 const c=spatial(),scene=new T.Scene(),sources=[];
 for(let variant=0;variant<12;variant++){
  const geometry=new T.PlaneGeometry(1.65,1.16),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(variant%4+uv.getX(i))/4,(Math.floor(variant/4)+uv.getY(i))/4);
  const source=new T.InstancedMesh(geometry,new T.MeshBasicMaterial(),2);
  for(let i=0;i<2;i++){source.setMatrixAt(i,new T.Matrix4().makeTranslation(i*600,variant,3));source.setColorAt(i,new T.Color(variant/12,.2,.4));}
  scene.add(source);sources.push(source);
 }
 const group=c.partitionForestAtlas(sources),seen=[];
 for(const mesh of group.children){const offsets=mesh.geometry.attributes.forestAtlasTile;
  for(let i=0;i<mesh.count;i++){const matrix=new T.Matrix4(),color=new T.Color();mesh.getMatrixAt(i,matrix);mesh.getColorAt(i,color);const variant=matrix.elements[13];assert.equal(offsets.getX(i),variant%4);assert.equal(offsets.getY(i),Math.floor(variant/4));assert.ok(Math.abs(color.r-variant/12)<1e-6);seen.push(variant);}
 }
 assert.equal(seen.length,24);for(let i=0;i<12;i++)assert.equal(seen.filter(x=>x===i).length,2);
});
