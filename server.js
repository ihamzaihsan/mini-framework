const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  let file = req.url;
  
  // Handle static assets (CSS, JS)
  if (file.startsWith('/framework/') || file.endsWith('.css') || file.endsWith('.js')) {
    // Serve static files directly
    if (file.startsWith('/framework/')) {
      // Framework files
      file = file;
    } else if (file.endsWith('.css') || file.endsWith('.js')) {
      // TodoMVC assets
      file = '/todomvc' + file;
    }
    
    const filePath = path.join(__dirname, file);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        const ext = path.extname(file);
        const contentType = ext === '.js' ? 'application/javascript' : 
                           ext === '.css' ? 'text/css' : 'text/html';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  } else {
    // For all other routes, serve the index.html file (SPA routing)
    const indexPath = path.join(__dirname, 'todomvc/index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  }
}).listen(3000, () => console.log('Server running at http://localhost:3000'));
