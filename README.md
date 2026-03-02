# dash-way

**Everything app for AI-native teams.**

Chat, Issues, Git, Calendar — one graph, not several separate tools.
Own your data, keep your SSOT structurally intact, and give your AI agents
the full context they actually need, from day one.

---

## Why dashway

### One graph. Everything connected.

Chat, Issues, Git, Calendar — linked from the moment they're created.
No sync jobs. No copy-paste. One source of truth, with full data sovereignty
baked into the architecture.

When your tools are fragmented, your AI works with fragments. dashway puts
everything in one graph — so every query returns the full chain:
Thread → Issue → PR → Decision, from the moment it's created.
No MCPs to stitch together. No context gaps.

### Your data. Always, by design.

dashway is architecturally single-tenant. Your data never touches another
team's instance, never gets co-mingled, and is always fully portable.
Sovereignty isn't a setting — it's the only way it works.

- On-prem, private cloud, or air-gapped deployment
- Single-tenant by design — no shared infrastructure
- Full database access and backup ownership
- Export and migrate anytime, no friction

### SSOT by design.

Everything lives in one graph — threads, issues, commits, events.
No sync lag, no context drift. One truth, always up to date.

- Chat linked to Issues linked to PRs
- Full provenance on every decision
- No copy-paste between tools

### Open source. Extend anything.

Apache 2.0 licensed. Build custom modules, connect internal tools,
or fork the whole thing. No vendor permission needed.

### AI-native from day one.

Because everything is in one system, your AI agents get the full picture —
not fragments from separate APIs. Full graph context, permissions respected
on every traversal, MCP-compatible Context API built in.

Works with Claude Code, Cursor, Copilot, and any MCP-compatible agent.

---

## grep-way

dashway's built-in CLI. Because everything lives in one graph, every query
returns the full chain — Thread, Issue, PR, Decision — not a fragment from
a disconnected tool.

```sh
$ grep-way "auth token expiry decision"

● Thread #2910  (BE · #backend)
  "Auth token expiry — which strategy?"
  @sojin · Jan 14 · 12 replies

  ↳ Issue #384  feat: implement refresh token rotation
    [In Progress] assigned @jay

  ↳ PR #52  feat: refresh token rotation
    [Merged ✓] by @sojin · Jan 18

✦ AI Summary
  7-day expiry + silent refresh agreed.
  Security first, UX transparent.
```

---

## Structure

```
dashway/
└── apps/
    └── landing/    # Next.js public landing page
```

## Commands

```sh
# from apps/landing
npm run dev      # development server
npm run build    # production build
npm run start    # start production server
npm run lint     # lint
```

---

## License

Apache 2.0 — © 2026 Team SSOT
