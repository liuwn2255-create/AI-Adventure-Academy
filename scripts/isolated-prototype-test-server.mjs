import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../prototype');
const port = Number(process.env.TEST_SERVER_PORT);
if (!Number.isInteger(port) || port < 1024 || port === 4175 || port === 4176) throw new Error('Set TEST_SERVER_PORT to a dedicated allowed test port.');
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.json', 'application/json; charset=utf-8'],
]);
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400).end('bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end('forbidden'); return; }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404).end('not found'); return; }
  response.writeHead(200, { 'Content-Type': mime.get(path.extname(target)) ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(target).pipe(response);
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`isolated prototype test server listening on 127.0.0.1:${port}\n`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
