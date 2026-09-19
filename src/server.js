// Run the same handler as a plain Node HTTP server, so you can host it yourself.
//   node src/server.js            → http://localhost:8787/mcp
//   PORT=3000 node src/server.js
import http from 'node:http';
import handler from './handler.js';

const PORT = Number(process.env.PORT || 8787);

http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  if (url.pathname !== '/mcp' && url.pathname !== '/') { res.writeHead(404); return res.end('POST /mcp'); }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  req.body = raw;                                   // the handler parses strings itself
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (b) => { res.end(b); return res; };
  res.json = (o) => { res.end(JSON.stringify(o)); return res; };
  try { await handler(req, res); }
  catch (e) { res.writeHead(500); res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: String(e && e.message || e) } })); }
}).listen(PORT, () => console.log(`Jef MCP on http://localhost:${PORT}/mcp`));
