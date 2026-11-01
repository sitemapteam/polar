const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// Only files explicitly used by the generated page are published. Never sync
// the repository root: restored inputs, screenshots and offline exports live there.
function createWebBuild(root) {
  const destination = path.join(root, 'dist');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.join(destination, 'assets'), { recursive: true });
  const written = new Set();
  function assetFile(name, global, entries) {
    const values = { $external: true, $gzip: [] };
    for (const [key, file] of entries) {
      const original = fs.readFileSync(path.join(root, file));
      const compressed = file.endsWith('.glb');
      const bytes = compressed ? zlib.gzipSync(original, { level: 6 }) : original;
      const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20);
      const relative = `assets/${path.basename(file, path.extname(file))}.${hash}${path.extname(file)}${compressed ? '.gz' : ''}`;
      fs.writeFileSync(path.join(destination, relative), bytes);
      values[key] = relative;
      if (compressed) values.$gzip.push(key);
    }
    fs.writeFileSync(path.join(destination, name), `window.${global}=${JSON.stringify(values)};`);
    written.add(name);
  }
  async function finish(html) {
    const optimized = new Map();
    for (const name of ["cliff-data.js", "alpine-rock-data.js"]) optimized.set(name, await require("./optimize-scenery.cjs").optimizeSceneryScript(fs.readFileSync(path.join(root, name))));
    fs.appendFileSync(path.join(destination, 'winter-assets.js'), '\nwindow.BIGBOY_STORY=' + fs.readFileSync(path.join(root, 'story-cues.json'), 'utf8') + ';');
    // This app uses classic scripts and embedded CSS; its other runtime inputs
    // are the explicit asset entries above or data/blob URLs inside these scripts.
    html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, name) => {
      if (!/^[\w.-]+\.js$/.test(name)) throw new Error('Unexpected runtime script: ' + name);
      const bytes = optimized.get(name) || fs.readFileSync(path.join(written.has(name) ? destination : root, name));
      const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20);
      const filename = `assets/${path.basename(name, '.js')}.${hash}.js`;
      fs.writeFileSync(path.join(destination, filename), bytes);
      if (written.has(name)) fs.unlinkSync(path.join(destination, name));
      return `<script src="${filename}"></script>`;
    });
    const cacheFile=path.join(root,'.assets/water-cache.json.gz'),metaFile=path.join(root,'.assets/water-cache.meta.json');
    if(fs.existsSync(cacheFile)&&fs.existsSync(metaFile)){
      const hash=crypto.createHash('sha256');
      for(const name of ['winter-landscape.js','river-runtime.js','geography-data.js','terrain-cache-data.js'])hash.update(fs.readFileSync(path.join(root,name)));
      if(JSON.parse(fs.readFileSync(metaFile)).sourceHash===hash.digest('hex')){
        const bytes=fs.readFileSync(cacheFile),name='assets/water-cache.'+crypto.createHash('sha256').update(bytes).digest('hex').slice(0,20)+'.json.gz';
        fs.writeFileSync(path.join(destination,name),bytes);
        html=html.replace('<script>',`<script>window.POLAR_WATER_CACHE=${JSON.stringify(name)};</script><script>`);
        console.log('Using prebuilt water geometry');
      }
    }
    fs.writeFileSync(path.join(destination, 'index.html'), html);
    for (const name of ['MODEL-CREDITS.txt', 'THREE-LICENSE.txt']) {
      fs.copyFileSync(path.join(root, name), path.join(destination, name));
    }
    // Keep the attribution records promised by the app's About dialog.
    fs.cpSync(path.join(root, 'reference-assets/licenses'), path.join(destination, 'reference-assets/licenses'), { recursive: true });
    const files = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const filename = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(filename);
        else files.push({ path: path.relative(destination, filename), bytes: fs.statSync(filename).size });
      }
    }
    walk(destination);
    // Keep the deployment audit outside the public directory.
    fs.writeFileSync(path.join(root, 'web-build-manifest.json'), JSON.stringify({ files, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) }, null, 2) + '\n');
    console.log(`Built web app: ${files.length} files, ${(files.reduce((sum, file) => sum + file.bytes, 0) / 1048576).toFixed(1)} MiB. Publish dist/ only.`);
  }
  return { assetFile, finish };
}

module.exports = { createWebBuild };
