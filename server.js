const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  let file = req.url;
  if (file === '/') file = '/todomvc/index.html';
  else if (!file.startsWith('/todomvc/') && !file.startsWith('/framework/')) {
    // If it's not already prefixed, assume it's from todomvc folder
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
}).listen(3000, () => console.log('Server running at http://localhost:3000'));
