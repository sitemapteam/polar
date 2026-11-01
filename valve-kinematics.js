(function(root){
'use strict';
const hypot=Math.hypot;
function circles(a,ra,b,rb){const dx=b[0]-a[0],dy=b[1]-a[1],d=hypot(dx,dy),u=(ra*ra-rb*rb+d*d)/(2*d),h=Math.sqrt(Math.max(0,ra*ra-u*u)),x=a[0]+u*dx/d,y=a[1]+u*dy/d;const p=[x-h*dy/d,y+h*dx/d],q=[x+h*dy/d,y-h*dx/d];return p[1]<q[1]?p:q;}
function solve(theta,engine='front',side=1){
 const phase=theta+(engine==='front'?Math.atan2(-.281,-.283):Math.atan2(.281,.283))+(side<0?Math.PI/2:0),r=hypot(.283,.281),cy=1.0505;
 const wheel=[0,cy],crank=[r*Math.cos(phase),cy+r*Math.sin(phase)],crosshead=[crank[0]+Math.sqrt(3.45**2-(1.007-crank[1])**2),1.007];
 const eccentric=[.21*Math.cos(phase+Math.PI/2),cy+.21*Math.sin(phase+Math.PI/2)],fulcrum=[1.45,1.8],tail=circles(eccentric,1.55,fulcrum,.55),expansionAngle=Math.atan2(tail[1]-fulcrum[1],tail[0]-fulcrum[0])+Math.PI/2,dieLocal=[Math.sqrt(1.8**2-.22**2)-1.8,-.22],die=[fulcrum[0]+dieLocal[0]*Math.cos(expansionAngle)-dieLocal[1]*Math.sin(expansionAngle),fulcrum[1]+dieLocal[0]*Math.sin(expansionAngle)+dieLocal[1]*Math.cos(expansionAngle)],union=[crosshead[0],.712];
 const L=1.06,short=.18,uy=union[1],vy=1.618,ul=.52,rl=1.80;
 function at(beta){const c=Math.cos(beta),s=Math.sin(beta),dy=vy-L*s-uy,disc=ul*ul-dy*dy;if(disc<0)return null;const vx=union[0]+L*c+Math.sqrt(disc),valve=[vx,vy],bottom=[vx-L*c,vy-L*s],radius=[vx+short*c,vy+short*s];return {beta,valve,bottom,radius,error:hypot(radius[0]-die[0],radius[1]-die[1])-rl};}
 let best=null,prev=null;for(let i=0;i<=96;i++){const q=at(.35+i*2.45/96);if(!q){prev=null;continue}if(!best||Math.abs(q.error)<Math.abs(best.error))best=q;if(prev&&prev.error*q.error<=0){let lo=prev.beta,hi=q.beta,lv=prev;for(let k=0;k<28;k++){const mid=at((lo+hi)/2);if(lv.error*mid.error<=0)hi=mid.beta;else{lo=mid.beta;lv=mid}}best=at((lo+hi)/2);break}prev=q}
 const liftPoint=die.map((x,i)=>x+(best.radius[i]-x)*.18),reversePivot=[.95,2.20],reverseEnd=circles(reversePivot,.5,liftPoint,.65);
 const result={liftPoint,reversePivot,reverseEnd,wheel,crank,crosshead,eccentric,fulcrum,tail,die,dieLocal,expansionAngle,union,valve:best.valve,combinationBottom:best.bottom,radiusEnd:best.radius,phase,closureError:Math.abs(best.error)};
 return result;
}
root.BigBoyValveGear={solve,cylinders:{front:{entry:9.132,face:10.402,rodLength:2.92,origin:3.435},rear:{entry:-.543,face:.723,rodLength:1.97,origin:-5.3}},pistonY:1.007,pistonZ:1.272};if(typeof module!=='undefined')module.exports=root.BigBoyValveGear;
})(typeof window==='undefined'?globalThis:window);
