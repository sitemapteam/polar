// HDR keeps bright windows and lamps distinct from diffuse snow; bloom is deliberately restrained.
const hdrTarget=new T.WebGLRenderTarget(innerWidth*renderer.getPixelRatio(),innerHeight*renderer.getPixelRatio(),{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter});hdrTarget.samples=0;
const composer=new window.BigBoyPostFX.EffectComposer(renderer,hdrTarget);composer.setSize(innerWidth,innerHeight);composer.addPass(new window.BigBoyPostFX.RenderPass(scene,camera));const cinematicBloom=new window.BigBoyPostFX.UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.20,.48,1.10);composer.addPass(cinematicBloom);composer.addPass(new window.BigBoyPostFX.OutputPass());const cinematicFXAA=new window.BigBoyPostFX.ShaderPass(window.BigBoyPostFX.FXAAShader);cinematicFXAA.material.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));composer.addPass(cinematicFXAA);window.__postFXState={hdr:true,multisampling:hdrTarget.samples,bloomStrength:.20,bloomThreshold:1.10,output:'ACES / sRGB'};

window.__bigboyDebug.composer=composer;

// Count the complete frame rather than just the final fullscreen pass.
renderer.info.autoReset=false;
