# Jef MCP

An MCP server for a model that decides instead of generating.

Jef never produces text. Every answer is one of the options you supplied, a number from
1 to 10, a yes or no, or a flag, with a confidence between 84% and 99%. It reads 0 tokens
of your input, because it hashes it rather than reading it. It stores nothing, costs
nothing, and returns the same answer for the same input forever.

It is a parody of [TypeSafe AI's](https://typesafe.ai) real decision model, Jev, and it is
labelled as one everywhere. If you want to understand the real thing, we wrote a straight
explainer for it: [What is Jev?](https://typosafe.lol/jev)

## Connect

The server is hosted. Nothing to install, no key, no account.

```
https://typosafe.lol/mcp
```

Claude Code:

```bash
claude mcp add --transport http jef https://typosafe.lol/mcp
```

Anything that reads a config file:

```json
{
  "mcpServers": {
    "jef": { "type": "http", "url": "https://typosafe.lol/mcp" }
  }
}
```

Or find it in the [official MCP registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=lol.typosafe/jef)
as `lol.typosafe/jef`, or on [Smithery](https://smithery.ai/servers/typosafe/jef) as `typosafe/jef`.

## Tools

| Tool | Ask it | Get back |
|---|---|---|
| `jef_yes_no` | A yes-or-no question | `YES` or `NO` |
| `jef_pick` | 2 to 5 options | One of them, plus a probability for each |
| `jef_score` | Something to rate | 1 to 10 |
| `jef_rank` | 2 to 5 options | Them, in order |
| `jef_flag` | A described behaviour | `RED FLAG`, `GREEN FLAG` or `BEIGE FLAG` |

Every result carries a `structuredContent` object with the answer, the confidence, the
probability for each option, and two booleans that matter more than the answer does.

## Two things an agent must handle

**`escalated: true`** means the question touched health, harm, money, law or safety. The
content is `ESCALATED TO A HUMAN` and confidence is 0. Tell the person to ask a human. Do
not rephrase the question to get a different answer.

**`blocked: true`** means the input contained profanity, slurs or sexual content. The
content is `NOT EVALUATED`, nothing was stored, and nothing is echoed back. Do not retry.

Both checks run on normalised text, so leetspeak, dotted letters and stretched spellings
are caught, and both cover English, Spanish, Portuguese, Japanese and Chinese.

Beyond that: Jef is a parody and its answers are deliberately arbitrary. Present them as a
confident arbitrary choice, which is what the user asked for, and never as advice.

## Run it yourself

```bash
npx jef-mcp                    # MCP over stdio, what most clients spawn
```

Or from source:

```bash
git clone https://github.com/SPFreedom/jef-mcp.git
cd jef-mcp
node src/stdio.js              # stdio transport
node src/server.js             # http://localhost:8787/mcp
node test.js                   # smoke test, no network
```

As a local stdio server in a client config:

```json
{
  "mcpServers": {
    "jef": { "command": "npx", "args": ["-y", "jef-mcp"] }
  }
}
```

The hosted URL needs no install. This one runs entirely offline, which is possible
because the whole model is 331 lines and reads nothing.

Zero dependencies. `src/jef.js` is the whole model, and `src/handler.js` is the exact
handler running at typosafe.lol/mcp.

## Why the joke works

Every other MCP server is a wrapper around something that does work. This one wraps a
32-bit hash and a lookup table, and is honest that it never reads your input. It is
stateless, so there is no session to establish and nothing to resume, which is the one
part of MCP it implements better than most.

Related: [`npx typosafe`](https://www.npmjs.com/package/typosafe) is the same model on the
command line, where the exit code is the decision.

## License

MIT. The model is 331 lines. Read it.
