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
  const packedScripts = new Set(['forest-data.js', 'cliff-data.js', 'alpine-rock-data.js', 'crowd-data.js', 'house-scan-data.js', 'terrain-cache-data.js']);
  const packingReport = [];
  function writeBinary(bytes, extension) {
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20);
    const relative = `assets/scene-${hash}.${extension}`;
    fs.writeFileSync(path.join(destination, relative), bytes);
    return '/' + relative;
  }
  function packScript(name, bytes) {
    const source = bytes.toString('utf8');
    const assignment = /^window\.([A-Z_]+)\s*=/.exec(source);
    if (!assignment) throw new Error('Unexpected scene data format: ' + name);
    const data = JSON.parse(source.slice(assignment[0].length).trim().replace(/;$/, ''));
    const chunks = [], references = [];
    let offset = 0;
    function extract(value) {
      if (typeof value === 'string') {
        const uri = /^data:([^;,]+);base64,([\s\S]+)$/.exec(value);
        if (uri) {
          const extension = ({'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp'})[uri[1]] || 'bin';
          return writeBinary(Buffer.from(uri[2], 'base64'), extension);
        }
        if (value.length > 256 && /^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
          const raw = Buffer.from(value, 'base64');
          const padding = (4 - offset % 4) % 4;
          if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
          const reference = {$packed: '', offset, bytes: raw.length};
          references.push(reference);
          chunks.push(raw);
          offset += raw.length;
          return reference;
        }
        return value;
      }
      if (Array.isArray(value)) return value.map(extract);
      if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) value[key] = extract(value[key]);
      }
      return value;
    }
    extract(data);
    if (chunks.length) {
      const url = writeBinary(zlib.gzipSync(Buffer.concat(chunks), {level: 6}), 'bin.gz');
      for (const reference of references) reference.$packed = url;
    }
    const result = Buffer.from(`window.${assignment[1]}=${JSON.stringify(data)};`);
    packingReport.push({file: name, originalScriptBytes: bytes.length, manifestBytes: result.length, packedArrays: references.length});
    return result;
  }
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
    fs.appendFileSync(path.join(destination, 'winter-assets.js'), '\nwindow.BIGBOY_STORY=' + fs.readFileSync(path.join(root, 'story-cues.json'), 'utf8') + ';');
    // Publish only referenced classic scripts and the binary assets extracted
    // from the six scene manifests; keep the original offline inputs untouched.
    html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, name) => {
      if (!/^[\w.-]+\.js$/.test(name)) throw new Error('Unexpected runtime script: ' + name);
      let bytes = fs.readFileSync(path.join(written.has(name) ? destination : root, name));
      if (packedScripts.has(name)) bytes = packScript(name, bytes);
      const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20);
      const filename = `assets/${path.basename(name, '.js')}.${hash}.js`;
      fs.writeFileSync(path.join(destination, filename), bytes);
      if (written.has(name)) fs.unlinkSync(path.join(destination, name));
      return `<script src="${filename}"></script>`;
    });
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
    fs.writeFileSync(path.join(root, 'web-build-manifest.json'), JSON.stringify({ files, packingReport, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) }, null, 2) + '\n');
    console.log(`Built web app: ${files.length} files, ${(files.reduce((sum, file) => sum + file.bytes, 0) / 1048576).toFixed(1)} MiB. Publish dist/ only.`);
  }
  return { assetFile, finish };
}

module.exports = { createWebBuild };
