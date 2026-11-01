const assert=require('node:assert/strict');
(async()=>{
 const {default:puppeteer}=await import('puppeteer-core');
 const executablePath=process.env.CHROME_BIN||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/google-chrome');
 const browser=await puppeteer.launch({headless:true,executablePath,protocolTimeout:240000,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
  await page.setViewport({width:2048,height:1117,deviceScaleFactor:2});
  await page.goto(process.env.POLAR_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:240000});
  if(await page.$('#loadJourney'))await page.click('#loadJourney');
  await page.waitForFunction(()=>window.__trainState?.frame>3&&document.querySelector('#loading').style.display==='none',{timeout:240000});
  await page.evaluate(()=>window.__bigboyDebug.previewTime(13));
  await new Promise(r=>setTimeout(r,3000));
  // Sample the sky/mountains where the Retina HDR regression drew black rectangles.
  const pixels=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
   // Paused scenes now stop drawing; sample immediately after an explicit frame.
   window.__bigboyDebug.composer.render(0);
   const renderer=window.__bigboyDebug.renderer,gl=renderer.getContext(),samples=[];
   for(const x of [.65,.75,.85,.95])for(const y of [.75,.8,.85]){const p=new Uint8Array(4);gl.readPixels(Math.floor(gl.drawingBufferWidth*x),Math.floor(gl.drawingBufferHeight*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);samples.push(Array.from(p));}
   resolve(samples);
  })));
  assert.ok(pixels.filter(p=>Math.max(...p.slice(0,3))>25).length>=11,'Landscape is obscured by black rectangles: '+JSON.stringify(pixels));
  if(process.env.POLAR_SCREENSHOT)await page.screenshot({path:process.env.POLAR_SCREENSHOT});
  await page.click('#play');await page.waitForFunction(()=>window.__trainState?.running&&window.__audioState?.context==='running',{timeout:90000});
  await page.click('[data-view="cab"]');await page.waitForFunction(()=>window.__cameraComposition?.cab,{timeout:30000});
  await page.click('#play');await page.waitForFunction(()=>!window.__trainState.running&&window.__audioState.context==='suspended',{timeout:30000});
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  await page.click('[data-view="cinematic"]');await page.click('#play');await page.evaluate(()=>window.__bigboyDebug.seekStory(125));
  await page.waitForFunction(()=>window.__trainState.simTime>126&&window.__audioState.context==='running',{timeout:30000});
  assert.deepEqual(errors,[]);console.log('Retina landscape, resize, audio, cab, pause/resume and seeking passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
