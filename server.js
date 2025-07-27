import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

// Serve only public application assets; never expose arbitrary repository files.
const assets = new Map([
  ['/app.js', ['todomvc/app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['todomvc/style.css', 'text/css; charset=utf-8']],
  ...['core', 'events', 'store', 'vdom'].map(name =>
    ['/framework/' + name + '.js', ['framework/' + name + '.js', 'text/javascript; charset=utf-8']]
  )
]);
const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  const send = (status, type, body) => {
    res.writeHead(status, { 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    send(405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    send(400, 'text/plain; charset=utf-8', 'Invalid URL');
    return;
  }
  const asset = assets.get(pathname);
  if (!asset && (pathname.startsWith('/framework/') || path.posix.extname(pathname) || pathname.includes('..'))) {
    send(404, 'text/plain; charset=utf-8', 'Not found');
    return;
  }
  const [file, type] = asset || ['todomvc/index.html', 'text/html; charset=utf-8'];
  fs.readFile(path.join(directory, file), (error, content) => {
    if (error) {
      console.error('Unable to read public asset:', file, error.code);
      send(500, 'text/plain; charset=utf-8', 'Unable to load the application');
      return;
    }
    send(200, type, content);
  });
});
server.on('error', error => {
  console.error('Server failed to start:', error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log('Mini Framework: JavaScript UI Framework — http://' + host + ':' + port));
