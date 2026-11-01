// Multisampling smooths geometry edges without the full-screen FXAA blur.
// Keep the render resolution stable during playback; quality never oscillates.
const renderQuality=new URLSearchParams(location.search).get('quality')==='high'?'high':'sharp';
function nativeRenderRatio(){return renderQuality==='high'?Math.min(1.75,Math.max(devicePixelRatio,1.5)):Math.min(devicePixelRatio||1,1.5);}
let performanceWindowStart=0,performanceFrames=0;
function resizeRendering(){
 const ratio=nativeRenderRatio();
 renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);
 composer.setPixelRatio(ratio);composer.setSize(innerWidth,innerHeight);
 cinematicFXAA.material.uniforms.resolution.value.set(1/(innerWidth*ratio),1/(innerHeight*ratio));
}
function updateRenderPerformance(now){
 if(!performanceWindowStart)performanceWindowStart=now;
 performanceFrames++;
 const elapsed=now-performanceWindowStart;if(elapsed<2000)return;
 const frameMs=elapsed/performanceFrames;
 window.__performanceState={quality:renderQuality,frameMs,fps:1000/frameMs,pixelRatio:renderer.getPixelRatio(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 performanceWindowStart=now;performanceFrames=0;
}
document.addEventListener('visibilitychange',()=>{performanceWindowStart=0;performanceFrames=0;});
resizeRendering();
