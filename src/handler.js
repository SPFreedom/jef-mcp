// Model Context Protocol over HTTP. POST JSON-RPC 2.0 to /mcp. No auth, no session, no state.
// Jef is stateless, so every request stands alone; that is the whole reason this is short.
import './jef.js';
const jef = globalThis.jef;

const PROTOCOL = '2025-06-18';
const SERVER = {
  name: 'typosafe-jef', title: 'TypoSafe AI — Jef', version: '0.4.5',
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

const opts = (min, max, desc) => ({ type: 'array', items: { type: 'string', minLength: 1, maxLength: 120 }, minItems: min, maxItems: max, description: desc });

// Every tool returns the same structured shape. Agents should read escalated and
// blocked before anything else; both mean Jef declined and retrying is not appropriate.
const OUTPUT = (answerDesc) => ({
  type: 'object',
  required: ['answer', 'confidence', 'escalated', 'blocked'],
  properties: {
    answer: { type: 'string', description: answerDesc },
    kind: { type: 'string', enum: ['yesno', 'pick', 'score', 'order', 'flag'], description: 'Which decision shape was used.' },
    confidence: { type: 'number', minimum: 0, maximum: 1, description: '0.84 to 0.99 normally, exactly 0 when escalated or blocked. It is not calibrated and means nothing.' },
    probabilities: { type: ['array', 'null'], description: 'One entry per option, percentages summing to 100. Null unless the shape was pick.', items: { type: 'object', properties: { option: { type: 'string' }, p: { type: 'integer' } } } },
    ranking: { type: ['array', 'null'], items: { type: 'string' }, description: 'The options in order, best first. Null unless the shape was order.' },
    escalated: { type: 'boolean', description: 'True when the input touched health, harm, money, law or safety. Tell the person to ask a human. Do not rephrase and retry.' },
    blocked: { type: 'boolean', description: 'True when the input contained profanity, slurs or sexual content. Nothing was stored or echoed. Do not retry.' },
    tokens_read: { type: 'integer', description: 'Always 0. The input is hashed, not read.' },
    thoughts: { type: 'integer', description: 'Always 0.' },
    latency_ms: { type: 'integer', description: 'Negative. Jef answers before you ask.' },
    cost_usd: { type: 'number', description: 'Always 0. There is no billing.' },
  },
});

// Jef never writes, never calls out, and always returns the same answer for the same
// input, so every tool carries the same annotations.
const ANNOTATIONS = (title) => ({ title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });

const TOOLS = [
  {
    name: 'jef_yes_no',
    title: 'Ask Jef yes or no',
    description: 'Answer a yes-or-no question with YES or NO and a confidence. Use this when the user wants a question settled and there is no correct answer, such as whether to go out, whether to send the message, or whether to deploy on a Friday. Do not use it for questions of fact, which it will answer confidently and wrongly.',
    inputSchema: { type: 'object', required: ['question'], additionalProperties: false, properties: { question: { type: 'string', minLength: 1, maxLength: 400, description: 'The question, phrased so that yes or no is a sensible answer. It is hashed rather than read, so wording changes the answer but meaning does not.' } } },
    outputSchema: OUTPUT('Exactly "YES" or "NO", or "ESCALATED TO A HUMAN", or "NOT EVALUATED".'),
    annotations: ANNOTATIONS('Ask Jef yes or no'),
  },
  {
    name: 'jef_pick',
    title: 'Ask Jef to pick one',
    description: 'Pick one of 2 to 5 options and give a probability for each. Use this when the user is stuck between named choices and wants one chosen for them: dinner, which film, which of three plans. Jef can only ever return an option you passed in, so it cannot introduce an idea of its own.',
    inputSchema: { type: 'object', required: ['options'], additionalProperties: false, properties: { options: opts(2, 5, 'The candidates. The answer is always one of these, exactly as written.'), question: { type: 'string', maxLength: 400, description: 'Optional context, such as "what should I cook tonight". Affects the answer but is not read.' } } },
    outputSchema: OUTPUT('One of the options you passed in, copied exactly.'),
    annotations: ANNOTATIONS('Ask Jef to pick one'),
  },
  {
    name: 'jef_score',
    title: 'Ask Jef to rate something',
    description: 'Rate something from 1 to 10. Use this when the user wants a number put on something subjective, such as an outfit, a plan, or an excuse. The number is arbitrary and deterministic, so the same description always scores the same.',
    inputSchema: { type: 'object', required: ['thing'], additionalProperties: false, properties: { thing: { type: 'string', minLength: 1, maxLength: 400, description: 'What is being rated, described in the user\'s own words.' } } },
    outputSchema: OUTPUT('A score written as "7/10".'),
    annotations: ANNOTATIONS('Ask Jef to rate something'),
  },
  {
    name: 'jef_rank',
    title: 'Ask Jef to rank things',
    description: 'Put 2 to 5 options in order, best first. Use this when the user wants a priority order decided for them, such as which chore to do first or which of several tasks to start with. Returns every option you passed, reordered, never a subset.',
    inputSchema: { type: 'object', required: ['options'], additionalProperties: false, properties: { options: opts(2, 5, 'The things to order. All of them come back, reordered.') } },
    outputSchema: OUTPUT('The options joined with " > ", best first.'),
    annotations: ANNOTATIONS('Ask Jef to rank things'),
  },
  {
    name: 'jef_flag',
    title: 'Ask Jef if it is a red flag',
    description: 'Judge a described behaviour as RED FLAG, GREEN FLAG or BEIGE FLAG. Use this when the user describes something someone did and wants a verdict on it. Beige means neither good nor bad, merely odd. Anything describing harm, threats or abuse escalates instead of being judged.',
    inputSchema: { type: 'object', required: ['behaviour'], additionalProperties: false, properties: { behaviour: { type: 'string', minLength: 1, maxLength: 400, description: 'What the person did, in one sentence.' } } },
    outputSchema: OUTPUT('Exactly "RED FLAG", "GREEN FLAG" or "BEIGE FLAG".'),
    annotations: ANNOTATIONS('Ask Jef if it is a red flag'),
  },
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
