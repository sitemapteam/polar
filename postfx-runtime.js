// Render directly into the antialiased canvas. A full-frame FXAA pass softened
// the train and the HDR/bloom chain required multiple large intermediate targets.
// Native MSAA smooths geometry edges while preserving texture detail; Three.js
// applies the existing ACES exposure and sRGB output on this final framebuffer.
function resizeScene(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setSize(innerWidth,innerHeight);
}
function renderScene(){
  renderer.setRenderTarget(null);
  renderer.setScissorTest(false);
  renderer.setViewport(0,0,innerWidth,innerHeight);
  renderer.render(scene,camera);
}
window.__postFXState={
  antialiasing:'native canvas MSAA',
  antialiasingAvailable:renderer.getContext().getContextAttributes().antialias,
  fullFrameBlur:false,
  bloom:false,
  output:'ACES / sRGB',
  resolution:'device pixels, up to 2x; no timeline resolution drops'
};
