#!/usr/bin/env node
// MCP over stdio: newline-delimited JSON-RPC on stdin and stdout.
// This is what local clients spawn, and what directory crawlers introspect.
//   npx @typosafe/jef-mcp
import { dispatch } from './handler.js';

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); }
    catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); continue; }
    try {
      const out = Array.isArray(msg) ? msg.map(dispatch).filter(Boolean) : dispatch(msg);
      if (out && (!Array.isArray(out) || out.length)) process.stdout.write(JSON.stringify(out) + '\n');
    } catch (e) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg && msg.id || null, error: { code: -32603, message: String(e && e.message || e) } }) + '\n');
    }
  }
});
process.stdin.on('end', () => process.exit(0));
