// Light only: original locomotive geometry and articulation remain intact.
const northernHeadlight=new T.SpotLight('#ffdfb1',180,105,.29,.78,1.3);northernHeadlight.position.set(12.0,3.15,0);northernHeadlight.target.position.set(80,.25,0);northernHeadlight.castShadow=false;train.add(northernHeadlight,northernHeadlight.target);
