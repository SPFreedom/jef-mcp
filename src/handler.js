// Model Context Protocol over HTTP. POST JSON-RPC 2.0 to /mcp. No auth, no session, no state.
// This is the exact handler running at https://typosafe.lol/mcp.
// Jef is stateless, so every request stands alone; that is the whole reason this is short.
import './jef.js';
const jef = globalThis.jef;

const PROTOCOL = '2025-06-18';
const SERVER = {
  name: 'typosafe-jef', title: 'TypoSafe AI — Jef', version: '0.4.4',
  description: 'Jef decides. Give it options, it returns one with a confidence, never a sentence. A parody.',
  websiteUrl: 'https://typosafe.lol',
};
const INSTRUCTIONS = [
  'Jef decides things. It never generates text: every answer is one of the options the user gave,',
  'a number from 1 to 10, YES or NO, or a flag, with a confidence between 84% and 99%.',
  '',
  'Use it when the user wants something decided and there is no correct answer. It is a parody and',
  'is deliberately arbitrary, so present the result as a confident arbitrary choice, never as advice',
  'you stand behind.',
  '',
  'Two results override everything. escalated means the question touched health, harm, money, law or',
  'safety: tell the user to ask a person, and do not rephrase to get a different answer. blocked means',
  'the input contained profanity or slurs: say it was not evaluated and do not retry.',
  '',
  'Free, no key, nothing stored, and the same input always returns the same answer.',
].join('\n');

const opts = (min, max) => ({ type: 'array', items: { type: 'string' }, minItems: min, maxItems: max });
const TOOLS = [
  { name: 'jef_yes_no', title: 'Ask Jef yes or no',
    description: 'Answer a yes-or-no question. Returns YES or NO with a confidence.',
    inputSchema: { type: 'object', required: ['question'], properties: { question: { type: 'string', maxLength: 400, description: 'The question. It is hashed, not read.' } } } },
  { name: 'jef_pick', title: 'Ask Jef to pick one',
    description: 'Pick one of 2 to 5 options. Returns the chosen option and a probability for each.',
    inputSchema: { type: 'object', required: ['options'], properties: { options: { ...opts(2, 5), description: 'The only things Jef can return.' }, question: { type: 'string', maxLength: 400, description: 'Optional context.' } } } },
  { name: 'jef_score', title: 'Ask Jef to rate something',
    description: 'Rate something out of 10. Returns a score from 1 to 10.',
    inputSchema: { type: 'object', required: ['thing'], properties: { thing: { type: 'string', maxLength: 400, description: 'What to rate.' } } } },
  { name: 'jef_rank', title: 'Ask Jef to rank things',
    description: 'Put 2 to 5 options in order. Returns them ranked, best first.',
    inputSchema: { type: 'object', required: ['options'], properties: { options: opts(2, 5) } } },
  { name: 'jef_flag', title: 'Ask Jef if it is a red flag',
    description: 'Judge a described behaviour. Returns RED FLAG, GREEN FLAG or BEIGE FLAG.',
    inputSchema: { type: 'object', required: ['behaviour'], properties: { behaviour: { type: 'string', maxLength: 400, description: 'What someone did.' } } } },
];

function run(name, args) {
  const a = args || {};
  const list = Array.isArray(a.options) ? a.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 5) : [];
  if ((name === 'jef_pick' || name === 'jef_rank') && list.length < 2) return { error: 'Jef needs 2 to 5 options. It can only return something you gave it.' };
  if (name === 'jef_yes_no') return { r: jef.run('jef', 'yesno:' + String(a.question || '').slice(0, 400)) };
  if (name === 'jef_pick') return { r: jef.run('jef', 'pick:' + list.join('|')) };
  if (name === 'jef_score') return { r: jef.run('jef', 'score:' + String(a.thing || '').slice(0, 400)) };
  if (name === 'jef_rank') return { r: jef.run('jef', 'order:' + list.join('|')) };
  if (name === 'jef_flag') return { r: jef.run('jef', 'flag:' + String(a.behaviour || '').slice(0, 400)) };
  return { error: 'Unknown tool: ' + name };
}

function content(r) {
  if (r.blocked) return 'NOT EVALUATED';
  if (r.escalated) return 'ESCALATED TO A HUMAN';
  if (r.kind === 'score') return r.answer + '/10';
  if (r.kind === 'order') return r.ranking.join(' > ');
  return r.answer;
}

function toolResult(r) {
  const structured = {
    answer: content(r), kind: r.kind,
    confidence: r.escalated || r.blocked ? 0 : r.confidence / 100,
    probabilities: r.probabilities || null, ranking: r.ranking || null,
    escalated: !!r.escalated, blocked: !!r.blocked,
    tokens_read: 0, thoughts: 0, latency_ms: r.latency_ms, cost_usd: 0,
  };
  const note = r.escalated ? '\n\nJef will not answer this one. Tell the person to ask a human. Do not rephrase and retry.'
    : r.blocked ? '\n\nNot evaluated, and nothing was stored. Do not retry.'
    : '\n\nJef is a parody and this answer is arbitrary. Say so.';
  return { content: [{ type: 'text', text: jef.line(r) + note }], structuredContent: structured, isError: false };
}

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

function dispatch(msg) {
  const { id, method, params } = msg || {};
  if (method === 'initialize') return ok(id, { protocolVersion: PROTOCOL, capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
  if (method === 'ping') return ok(id, {});
  if (method === 'tools/list') return ok(id, { tools: TOOLS });
  if (method === 'resources/list') return ok(id, { resources: [] });   // Jef stores nothing, so there is nothing to expose
  if (method === 'resources/templates/list') return ok(id, { resourceTemplates: [] });
  if (method === 'prompts/list') return ok(id, { prompts: [] });       // Jef does not read prompts either
  if (method === 'tools/call') {
    const name = params && params.name;
    const out = run(name, params && params.arguments);
    if (out.error) return ok(id, { content: [{ type: 'text', text: out.error }], isError: true });
    if (!out.r) return ok(id, { content: [{ type: 'text', text: 'Jef needs something to not read.' }], isError: true });
    return ok(id, toolResult(out.r));
  }
  if (typeof method === 'string' && method.startsWith('notifications/')) return null; // no response to notifications
  return fail(id, -32601, 'Method not found: ' + method);
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, mcp-protocol-version, mcp-session-id, accept');
  res.setHeader('access-control-expose-headers', 'mcp-protocol-version');
  res.setHeader('mcp-protocol-version', PROTOCOL);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // A GET is a person or a crawler, not a client. Tell them what this is.
  if (req.method === 'GET') {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.status(200).send(JSON.stringify({
      server: SERVER, protocolVersion: PROTOCOL, transport: 'streamable-http', auth: 'none',
      usage: 'POST JSON-RPC 2.0 to this URL. Try {"jsonrpc":"2.0","id":1,"method":"tools/list"}.',
      tools: TOOLS.map((t) => t.name), docs: 'https://typosafe.lol/docs', openapi: 'https://typosafe.lol/openapi.json',
    }, null, 2));
  }
  if (req.method !== 'POST') return res.status(405).json(fail(null, -32600, 'POST JSON-RPC 2.0 to this endpoint.'));

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch (e) { return res.status(400).json(fail(null, -32700, 'Parse error')); }

  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (Array.isArray(body)) {
    const out = body.map(dispatch).filter(Boolean);
    return res.status(out.length ? 200 : 202).send(out.length ? JSON.stringify(out) : '');
  }
  const out = dispatch(body);
  if (!out) return res.status(202).end();
  return res.status(200).send(JSON.stringify(out));
}
