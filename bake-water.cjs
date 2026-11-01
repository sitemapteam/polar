const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const puppeteer=require('puppeteer-core');
(async()=>{
 const executablePath=process.env.CHROME_BIN||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/google-chrome');
 const browser=await puppeteer.launch({headless:true,executablePath,protocolTimeout:240000});
 try{
  const page=await browser.newPage();await page.setViewport({width:960,height:600});
  await page.goto(process.env.POLAR_BAKE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:240000});
  await page.waitForFunction(()=>window.__bigboyDebug?.scene?.getObjectByName('Continuous fjord and river surface'),{timeout:240000});
  const data=await page.evaluate(()=>{
   const geometry=window.__bigboyDebug.scene.getObjectByName('Continuous fjord and river surface').geometry,attributes={};
   for(const [name,attribute]of Object.entries(geometry.attributes)){
    const bytes=new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength);
    let encoded;if(bytes.toBase64)encoded=bytes.toBase64();else{let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));encoded=btoa(text);}
    attributes[name]={itemSize:attribute.itemSize,data:encoded};
   }
   return {attributes,topology:window.__waterTopology};
  });
  const hash=crypto.createHash('sha256');for(const name of ['winter-landscape.js','river-runtime.js','geography-data.js','terrain-cache-data.js'])hash.update(fs.readFileSync(path.join(__dirname,name)));
  const bytes=zlib.gzipSync(Buffer.from(JSON.stringify(data)),{level:9});
  fs.writeFileSync(path.join(__dirname,'.assets/water-cache.json.gz'),bytes);
  fs.writeFileSync(path.join(__dirname,'.assets/water-cache.meta.json'),JSON.stringify({sourceHash:hash.digest('hex'),triangles:data.topology.triangles,bytes:bytes.length},null,2)+'\n');
  console.log(`Baked exact water geometry: ${(bytes.length/1048576).toFixed(2)} MiB`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
