const http = require('http'), fs = require('fs'), path = require('path');
const web = process.argv.includes('--web');
const root = web ? path.join(__dirname, 'dist') : __dirname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.glb': 'model/gltf-binary' };
http.createServer((req, res) => {
  let relative;
  try { relative = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400).end(); return; }
  const target = path.resolve(root, '.' + (relative === '/' ? (web ? '/index.html' : '/Big Boy 4014.html') : relative));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404).end('Build the app before opening the journey.'); return; }
    const headers = { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': web && relative.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0, end = stat.size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
      } else start = stat.size;
      if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`; headers['Content-Length'] = end - start + 1;
    }
    res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(target, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log('Open http://127.0.0.1:' + port));
