// Eight seated children adapted from the existing CC0 Innerscene / MakeHuman meshes.
// These are separate passengers; the outdoor story actors keep their existing poses.
const coachChildren=[],childCar=passengerCars.find(car=>car.kind==='coach');
const childDesigns=[
 {name:'Arthur',kind:0,height:1.24,width:.94,head:1.07,skin:'#e8bb9e',hair:'#533823',cloth:'#91aabd',trim:'#e2d5b9',pattern:1,row:12,side:-1},
 {name:'Rose',kind:1,height:1.15,width:.91,head:1.11,skin:'#b87c58',hair:'#33251e',cloth:'#c4a2a0',trim:'#f2e3ca',pattern:2,row:12,side:1},
 {name:'Edward',kind:0,height:1.33,width:1.02,head:1.02,skin:'#c99470',hair:'#382a20',cloth:'#c6bd9f',trim:'#736955',pattern:2,row:10,side:-1},
 {name:'Clara',kind:1,height:1.28,width:.95,head:1.05,skin:'#e7c1a6',hair:'#8a4f2b',cloth:'#9eada0',trim:'#e7dfc5',pattern:0,row:10,side:1},
 {name:'Henry',kind:0,height:1.10,width:.93,head:1.13,skin:'#a97450',hair:'#28221d',cloth:'#9a6669',trim:'#e8d8bf',pattern:1,row:7,side:-1},
 {name:'Alice',kind:1,height:1.22,width:.97,head:1.08,skin:'#efcdb2',hair:'#ad874e',cloth:'#a5a1b7',trim:'#ece1ca',pattern:1,row:7,side:1},
 {name:'James',kind:0,height:1.29,width:1.04,head:1.04,skin:'#d8a17e',hair:'#a4793b',cloth:'#839a9c',trim:'#e3dcc5',pattern:0,row:4,side:-1},
 {name:'Florence',kind:1,height:1.17,width:.92,head:1.10,skin:'#c18b69',hair:'#4d3025',cloth:'#c2b39a',trim:'#8c7664',pattern:2,row:4,side:1}
];
function seatedChildPoint(x,y,z,design){
 const originalY=y,hip=.73,knee=.36;
 // Bring the lowered arms forward onto the lap, with a continuous shoulder blend.
 const arm=T.MathUtils.smoothstep(Math.abs(x),.14,.22)*(1-T.MathUtils.smoothstep(y,1.08,1.19))*T.MathUtils.smoothstep(y,.65,.76);
 x=T.MathUtils.lerp(x,Math.sign(x)*.145,arm*.75);
 z=T.MathUtils.lerp(z,.19+(1.08-y)*.35,arm);
 y=T.MathUtils.lerp(y,.80+(y-.80)*.55,arm);
 // Thighs rest horizontally on the cushion; the lower legs hang below the knees.
 if(y<hip+.08){const kneeBlend=T.MathUtils.smoothstep(y,knee-.055,knee+.055),bend=(1-T.MathUtils.smoothstep(y,hip-.025,hip+.08))*(1-arm),thighY=hip+z,thighZ=hip-y,shinY=hip-(knee-y),shinZ=hip-knee+z;y=T.MathUtils.lerp(y,T.MathUtils.lerp(shinY,thighY,kneeBlend),bend);z=T.MathUtils.lerp(z,T.MathUtils.lerp(shinZ,thighZ,kneeBlend),bend);}
 const head=T.MathUtils.smoothstep(originalY,1.10,1.23),scale=design.height/1.4;
 x*=design.width*(1+head*(design.head-1));
 z*=1+head*(design.head-1);
 y+=(originalY-1.14)*head*(design.head-1)*.5;
 return v(x*scale,(y-hip)*scale,z*scale);
}
function childPajamaMaterial(part,design){
 const cloth=/original top|original bottom|satin|tailored|trousers/i.test(part.name),body=/body\.body$/.test(part.name),hair=/short01|ponytail01|eyebrow/.test(part.name),slipper=/shoes/.test(part.name);
 const material=new T.MeshStandardMaterial({color:cloth?design.cloth:hair?design.hair:slipper?design.trim:design.skin,map:cloth||slipper?null:celebrationTextures[part.map]||null,normalMap:cloth||slipper?null:celebrationTextures[part.normalMap]||null,normalScale:new T.Vector2(.3,.3),roughness:cloth||slipper?.97:.82,side:T.DoubleSide,alphaTest:/eyelash|eyebrow/.test(part.name)?.3:0});
 if(!cloth&&!body)return material;
 material.onBeforeCompile=shader=>{
  shader.uniforms.pajamaCloth={value:new T.Color(design.cloth)};shader.uniforms.pajamaTrim={value:new T.Color(design.trim)};shader.uniforms.pajamaPattern={value:design.pattern};
  shader.vertexShader='attribute vec3 pajamaPosition; varying vec3 childClothPoint;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nchildClothPoint=pajamaPosition;');
  shader.fragmentShader='varying vec3 childClothPoint; uniform vec3 pajamaCloth; uniform vec3 pajamaTrim; uniform float pajamaPattern;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec3 cp=childClothPoint;
float stripe=1.-smoothstep(.07,.13,abs(fract(cp.x*38.+cp.z*12.)-.5));
float crossStripe=1.-smoothstep(.055,.11,abs(fract(cp.y*33.)-.5));
float pattern=pajamaPattern<.5?0.:pajamaPattern<1.5?stripe*.40:max(stripe,crossStripe)*.30;
vec3 flannel=mix(pajamaCloth,pajamaTrim,pattern);
float weave=sin(cp.x*1700.)*sin(cp.y*1700.)*.018;
${cloth?'float clothMask=1.;':'float clothMask=smoothstep(.085,.135,abs(cp.x))*smoothstep(.69,.76,cp.y)*(1.-smoothstep(1.16,1.22,cp.y));'}
diffuseColor.rgb=mix(diffuseColor.rgb,flannel*(1.+weave),clothMask);`);
 };
 material.customProgramCacheKey=()=> 'seated-child-flannel-'+(cloth?'cloth':'sleeve');
 return material;
}
for(const design of childDesigns){
 const root=new T.Group();root.name=design.name+' — seated child in flannel pajamas';childCar.inside.add(root);
 for(const part of celebrationData.characters[design.kind].poses[0]){
  const raw=part.lods[0],positions=crowdDecode(raw.position,Float32Array).slice(),original=positions.slice(),geometry=new T.BufferGeometry();
  for(let i=0;i<positions.length;i+=3){const q=seatedChildPoint(original[i],original[i+1],original[i+2],design);q.toArray(positions,i);}
  geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('pajamaPosition',new T.BufferAttribute(original,3));geometry.setAttribute('uv',new T.BufferAttribute(crowdDecode(raw.uv,Float32Array),2));geometry.setIndex(new T.BufferAttribute(crowdDecode(raw.indices,Uint32Array),1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const object=mesh(geometry,childPajamaMaterial(part,design),root);object.name=part.name+' / seated pajama adaptation';object.castShadow=false;
 }
 // Loose fabric sleeves add volume beyond the recolored anatomical arms.
 for(const side of [-1,1]){const points=[[side*.17,1.12,.01],[side*.25,.94,.025],[side*.25,.78,.055]].map(p=>seatedChildPoint(...p,design)),sleeve=new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.043*(design.height/1.4),10,false);mesh(sleeve,mat(design.cloth,0,.98),root);const cuff=mesh(new T.TorusGeometry(.043*(design.height/1.4),.007,5,12),mat(design.trim,0,.98),root);cuff.position.copy(points[2]);cuff.quaternion.setFromUnitVectors(v(0,0,1),points[2].clone().sub(points[1]).normalize());}
 // Flat collars, piping and small pearl buttons distinguish period sleepwear from day clothes.
 const scale=design.height/1.4,trim=mat(design.trim,0,.96),fabric=mat(design.cloth,0,.97);
 for(const side of [-1,1]){const collar=box(root,.085*scale,.025*scale,.12*scale,side*.054*scale,.37*scale,.060*scale,trim);collar.rotation.z=side*.25;}
 box(root,.016*scale,.28*scale,.012*scale,0,.24*scale,.106*scale,trim);
 for(let button=0;button<4;button++)ball(root,.011*scale,0,(.13+button*.07)*scale,.118*scale,trim);
 box(root,.075*scale,.075*scale,.014*scale,-.075*scale,.28*scale,.108*scale,fabric);
 box(root,.077*scale,.010*scale,.016*scale,-.075*scale,.32*scale,.117*scale,trim);
 if(design.kind===1){for(const side of [-1,1]){const tie=ball(root,.022*scale,side*.06*scale,.46*scale,-.09*scale,trim);tie.scale.set(1.4,.65,.65);}}
 // Calibrated to the detailed source cushions (0.749 m native pitch), facing +X.
 const seatX={12:4.824,10:3.060,7:.416,4:-3.109};root.position.set(seatX[design.row],2.27,design.side*.76);root.rotation.y=Math.PI/2;
 root.userData.passenger={...design,seated:true};coachChildren.push({root,design});
}
window.__coachChildren=coachChildren.map(({root,design})=>({...design,seated:true,seat:root.position.toArray()}));
window.__polarInteriorState.children=coachChildren.length;window.__polarInteriorState.camera='Carriage-relative, level with coach, eased forward dolly, no lateral oscillation';
