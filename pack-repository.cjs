// Lossless, reproducible repository packaging. Original inputs remain untouched.
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const root=__dirname,build=fs.readFileSync(path.join(root,'build.cjs'),'utf8'),scene=fs.readFileSync(path.join(root,'scene.html'),'utf8');
const source=new Set(['scene.html','build.cjs','restore-assets.cjs','pack-repository.cjs','serve.cjs','package.json','README.md','MODEL-CREDITS.txt','THREE-LICENSE.txt','story-cues.json']);
for(const m of build.matchAll(/\['[A-Z_]+','([^']+\.js)'\]/g))source.add(m[1]);
for(const m of scene.matchAll(/<script src="([^"]+)"/g))if(!['polar-assets.js','winter-assets.js'].includes(m[1]))source.add(m[1]);
const binaries=new Set();for(const m of build.matchAll(/\['[^']+','([^']+\.(?:glb|jpg|mp3|wav))'/g))binaries.add(m[1]);
for(const file of [...source])if(fs.statSync(path.join(root,file)).size>400000){source.delete(file);binaries.add(file);}
const manifest={version:1,compression:'gzip',partBytes:512*1024,files:[]};fs.mkdirSync(path.join(root,'.assets'),{recursive:true});
for(const file of [...binaries].sort()){const data=fs.readFileSync(path.join(root,file)),sha256=crypto.createHash('sha256').update(data).digest('hex'),gz=zlib.gzipSync(data,{level:9}),parts=[];for(let i=0;i<gz.length;i+=manifest.partBytes){const part='.assets/'+sha256+'-'+String(i/manifest.partBytes).padStart(4,'0')+'.gzpart';fs.writeFileSync(path.join(root,part),gz.subarray(i,i+manifest.partBytes));parts.push(part);}manifest.files.push({path:file,bytes:data.length,sha256,parts});}
fs.writeFileSync(path.join(root,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');source.add('asset-manifest.json');
for(const file of fs.readdirSync(path.join(root,'reference-assets/licenses')))if(/\.(json|txt)$/.test(file))source.add('reference-assets/licenses/'+file);
fs.writeFileSync(path.join(root,'.gitignore'),['# Restored runtime inputs',...manifest.files.map(f=>'/'+f.path),'# Generated editions and bundles','/Big Boy*.html','/polar-assets.js','/winter-assets.js','/model-data.js','/*.tmp','/node_modules/','/.DS_Store',''].join('\n'));source.add('.gitignore');
const files=[...source,...manifest.files.flatMap(f=>f.parts)].sort();fs.writeFileSync('/private/tmp/polar-upload-list.json',JSON.stringify(files));console.log(JSON.stringify({sourceFiles:source.size,assets:manifest.files.length,chunks:manifest.files.reduce((n,f)=>n+f.parts.length,0),uploadMiB:files.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0)/1048576}));
