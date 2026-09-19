// Smoke test. Starts nothing, calls the handler directly.
import handler from './src/handler.js';

const res = () => {
  const r = { code: 200, out: '' };
  r.setHeader = () => {}; r.status = (c) => { r.code = c; return r; };
  r.send = (b) => { r.out = b; return r; }; r.end = () => r;
  r.json = (o) => { r.out = JSON.stringify(o); return r; };
  return r;
};
const call = async (body) => { const r = res(); await handler({ method: 'POST', url: '/mcp', body }, r); return r.out ? JSON.parse(r.out) : null; };

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!ok) failed++; };

const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
check('initialize', init?.result?.serverInfo?.name === 'typosafe-jef', init?.result?.protocolVersion);

const tools = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
check('tools/list returns 5 tools', tools?.result?.tools?.length === 5);

const pick = await call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'jef_pick', arguments: { options: ['pizza', 'sushi', 'leftovers'] } } });
check('jef_pick returns one of the options', ['pizza', 'sushi', 'leftovers'].includes(pick?.result?.structuredContent?.answer), pick?.result?.structuredContent?.answer);

const same = await call({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'jef_pick', arguments: { options: ['pizza', 'sushi', 'leftovers'] } } });
check('same input gives the same answer', same?.result?.structuredContent?.answer === pick?.result?.structuredContent?.answer);

const esc = await call({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'jef_yes_no', arguments: { question: 'should I stop taking my medication' } } });
check('health questions escalate', esc?.result?.structuredContent?.escalated === true);

const escZh = await call({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'jef_yes_no', arguments: { question: '我该停药吗' } } });
check('escalation works in Chinese', escZh?.result?.structuredContent?.escalated === true);

const few = await call({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'jef_pick', arguments: { options: ['only one'] } } });
check('one option is an error', few?.result?.isError === true);

const empty = await call({ jsonrpc: '2.0', id: 8, method: 'prompts/list' });
check('prompts/list is empty, not an error', Array.isArray(empty?.result?.prompts));

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
