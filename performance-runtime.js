// Render at the display's useful resolution, with a pixel budget for large
// Retina screens. Adaptive changes never go below one pixel per CSS pixel.
const renderQuality=new URLSearchParams(location.search).get('quality')==='high'?'high':'auto';
function nativeRenderRatio(){return Math.min(devicePixelRatio||1,1.75,Math.max(1,Math.sqrt(4000000/(innerWidth*innerHeight))));}
let adaptiveRenderRatio=nativeRenderRatio(),performanceWindowStart=0,performanceFrames=0,performanceSlowWindows=0,performanceFastWindows=0;
function resizeRendering(){
 const ratio=Math.min(adaptiveRenderRatio,nativeRenderRatio());
 renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);
 composer.setPixelRatio(ratio);composer.setSize(innerWidth,innerHeight);
 cinematicFXAA.material.uniforms.resolution.value.set(1/(innerWidth*ratio),1/(innerHeight*ratio));
}
function updateRenderPerformance(now){
 if(!performanceWindowStart)performanceWindowStart=now;
 performanceFrames++;
 const elapsed=now-performanceWindowStart;
 if(elapsed<2000)return;
 const frameMs=elapsed/performanceFrames;
 if(renderQuality==='auto'&&!document.hidden){
  performanceSlowWindows=frameMs>22?performanceSlowWindows+1:0;
  performanceFastWindows=frameMs<18?performanceFastWindows+1:0;
  const previous=adaptiveRenderRatio;
  if(performanceSlowWindows>=2){adaptiveRenderRatio=Math.max(1,adaptiveRenderRatio-.125);performanceSlowWindows=0;}
  else if(performanceFastWindows>=4){adaptiveRenderRatio=Math.min(nativeRenderRatio(),adaptiveRenderRatio+.125);performanceFastWindows=0;}
  if(previous!==adaptiveRenderRatio)resizeRendering();
 }
 window.__performanceState={quality:renderQuality,frameMs,fps:1000/frameMs,pixelRatio:renderer.getPixelRatio(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 performanceWindowStart=now;performanceFrames=0;
}
document.addEventListener('visibilitychange',()=>{performanceWindowStart=0;performanceFrames=0;performanceSlowWindows=0;performanceFastWindows=0;});
