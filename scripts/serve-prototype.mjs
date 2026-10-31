import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../prototype');
const host = '127.0.0.1';
const port = Number(process.env.PROTOTYPE_PORT ?? 4175);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8', '.glb': 'model/gltf-binary' };

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${host}:${port}`).pathname);
  if (pathname === '/favicon.ico') {
    res.writeHead(302, { Location: '/favicon.svg', 'Cache-Control': 'no-store' }).end();
    return;
  }
  const requested = pathname === '/' ? '/index.html' : pathname;
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(`${root}${path.sep}`) && target !== path.join(root, 'index.html')) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(target, (error, contents) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(contents);
  });
}).listen(port, host, () => console.log(`Prototype running at http://${host}:${port}`));
