import type { JSX } from "react";

function GitHubIcon({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const TICKER_ITEMS = [
  "Self-hosted",
  "Chat · Issues · Git · Calendar",
  "SSOT by design",
  "AI-native from day 1",
  "Open Source · Apache 2.0",
  "On-prem ready",
  "Data sovereignty",
  "No vendor lock-in",
  "One graph. Everything connected.",
  "Your data, your keys",
];

export default function HomePage(): JSX.Element {
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div>
      {/* ── NAV ────────────────────────────────── */}
      <header className="nav">
        <div className="nav-i">
          <a href="/" className="brand">
            dash<span className="brand-way">-way</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#shell">Shell</a>
            <a href="https://github.com/team-ssot/dashway" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="#docs">Docs</a>
          </nav>

          <a
            className="nav-cta"
            href="https://github.com/team-ssot/dashway"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            Star on GitHub
          </a>
        </div>
      </header>

      <main>
        {/* ── HERO ───────────────────────────────── */}
        <section className="hero">
          <div className="c">
            <div className="hero-split">
              {/* Left: headline + CTA */}
              <div className="hero-l">
                <h1 className="u1">
                  Everything app<br />
                  <span className="g">for AI-native teams.</span>
                </h1>
                <p className="hero-sub u2">
                  Chat, Issues, Git, Calendar — one graph, not several separate tools.
                  Own your data, keep your SSOT structurally intact, and give
                  your AI agents the full context they actually need, from day&nbsp;one.
                </p>
                <div className="hero-actions u2">
                  <a
                    href="https://github.com/team-ssot/dashway"
                    className="btn btn-solid"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubIcon />
                    Star on GitHub
                  </a>
                  <a href="#shell" className="btn btn-ghost">
                    See the Shell →
                  </a>
                </div>
              </div>

              {/* Right: product window — 2-panel for hero clarity */}
              <div className="hero-r u3">
                <div
                  className="app-win"
                  role="img"
                  aria-label="dashway Shell — unified workspace"
                >
                  <div className="win-bar">
                    <div className="win-dots">
                      <span className="wd wd-r" />
                      <span className="wd wd-y" />
                      <span className="wd wd-g" />
                    </div>
                    <span className="win-title">dash-way Shell</span>
                    <div className="win-search">
                      <span>⌘</span>
                      <span>Search everything...</span>
                      <span className="win-kbd">⌘K</span>
                    </div>
                  </div>

                  {/* 2-panel: sidebar + content only */}
                  <div className="win-body" style={{ gridTemplateColumns: "44px 1fr" }}>
                    <div className="win-sidebar">
                      <div className="si on" title="Issues">◆</div>
                      <div className="si" title="Chat">💬</div>
                      <div className="si" title="Git">&lt;/&gt;</div>
                      <div className="si" title="Calendar">📅</div>
                      <div className="si-sep" />
                      <div className="si" title="AI Agent" style={{ color: "#c4b5fd" }}>✦</div>
                    </div>

                    <div className="win-list" style={{ borderRight: "none" }}>
                      <div className="win-pane-hd">
                        <span className="pane-title">Issues</span>
                        <span className="pane-count">#backend · 4 open</span>
                      </div>
                      <div className="win-items">
                        <div className="wi sel">
                          <span className="wi-dot wi-dot-b" />
                          <span className="wi-id">#384</span>
                          <span className="wi-name hi">feat: refresh token rotation</span>
                        </div>
                        <div className="wi">
                          <span className="wi-dot wi-dot-a" />
                          <span className="wi-id">#389</span>
                          <span className="wi-name">ACL update for graph queries</span>
                        </div>
                        <div className="wi">
                          <span className="wi-dot wi-dot-a" />
                          <span className="wi-id">#391</span>
                          <span className="wi-name">Rate limiting on Context API</span>
                        </div>
                        <div className="wi">
                          <span className="wi-dot wi-dot-g" />
                          <span className="wi-id">#376</span>
                          <span className="wi-name">Login flow redesign</span>
                        </div>
                        <div className="wi">
                          <span className="wi-dot" style={{ background: "var(--fg-4)" }} />
                          <span className="wi-id">#372</span>
                          <span className="wi-name">Dashboard performance audit</span>
                        </div>
                      </div>
                      <div className="win-graph">
                        ⬡ Graph: Thread #2910 → Issue #384 → PR #52
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticker */}
          <div className="ticker" aria-hidden>
            <div className="ticker-t">
              {ticker.map((item, i) => (
                <span key={i} className="ti">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <hr className="d" />

        {/* ── FEATURES ───────────────────────────── */}
        <section id="features" className="pad">
          <div className="c">
            <div className="sh u1">
              <p className="eyebrow">Why dashway</p>
              <h2>
                One graph.<br />
                <span className="g">Everything connected.</span>
              </h2>
              <p>
                Chat, Issues, Git, Calendar — linked from the moment they&apos;re
                created. No sync jobs. No copy-paste. One source of truth,
                with full data sovereignty baked into the architecture.
              </p>
            </div>

            <div className="feat-grid u2">
              {/* 01 — Data sovereignty (wide) */}
              <div className="feat-card" style={{ gridColumn: "span 2" }}>
                <div className="fc-num">01</div>
                <div className="fc-icon fi-i">🔒</div>
                <h3>Your data. Always, by design.</h3>
                <p>
                  dashway is architecturally single-tenant. Your data never
                  touches another team&apos;s instance, never gets co-mingled,
                  and is always fully portable. Sovereignty isn&apos;t a setting —
                  it&apos;s the only way it works.
                </p>
                <ul>
                  <li>On-prem, private cloud, or air-gapped deployment</li>
                  <li>Single-tenant by design — no shared infrastructure</li>
                  <li>Full database access and backup ownership</li>
                  <li>Export and migrate anytime, no friction</li>
                </ul>
                <div className="mini-code">
                  <span className="mc"># Deploy dashway on your infra</span><br />
                  <span className="mk">docker</span>
                  <span className="ms"> compose</span>
                  <span className="mv"> up -d</span>
                  <span className="ms"> dashway</span><br />
                  <span className="mc"># Your data, your keys — always ✓</span>
                </div>
              </div>

              {/* 02 — SSOT */}
              <div className="feat-card">
                <div className="fc-num">02</div>
                <div className="fc-icon fi-b">⬡</div>
                <h3>SSOT by design.</h3>
                <p>
                  Everything lives in one graph — threads, issues, commits,
                  events. No sync lag, no context drift. One truth,
                  always up to date.
                </p>
                <ul>
                  <li>Chat linked to Issues linked to PRs</li>
                  <li>Full provenance on every decision</li>
                  <li>No copy-paste between tools</li>
                </ul>
              </div>

              {/* 03 — Open Source */}
              <div className="feat-card">
                <div className="fc-num">03</div>
                <div className="fc-icon fi-g">⚡</div>
                <h3>Open source. Extend anything.</h3>
                <p>
                  Apache 2.0 licensed. Build custom modules, connect internal
                  tools, or fork the whole thing. No vendor permission needed.
                </p>
                <ul>
                  <li>Fully open codebase</li>
                  <li>Plugin architecture</li>
                  <li>Internal tool integration</li>
                </ul>
              </div>

              {/* 04 — AI-native (wide) */}
              <div className="feat-card" style={{ gridColumn: "span 2" }}>
                <div className="fc-num">04</div>
                <div className="fc-icon fi-v">✦</div>
                <h3>AI-native from day&nbsp;one.</h3>
                <p>
                  When your tools are fragmented, your AI works with fragments.
                  dashway puts Chat, Issues, Git, and Calendar in one graph —
                  so every query returns the full chain: Thread → Issue → PR →
                  Decision, from the moment it&apos;s created. No MCPs to stitch
                  together. No context gaps.
                </p>
                <ul>
                  <li>Full graph context for every AI query</li>
                  <li>Permissions respected on every traversal</li>
                  <li>MCP-compatible Context API built in</li>
                  <li>Works with Claude Code, Cursor, Copilot</li>
                </ul>
                <div className="mini-code">
                  <span className="mc"># Full context — because it&apos;s all in one place</span><br />
                  <span className="mk">agent</span>
                  <span className="ms">.query</span>
                  <span className="mv">(</span>
                  <span className="ms">&quot;#2910&quot;</span>
                  <span className="mv">)</span><br />
                  <span className="mg">→ thread + issue + pr + decision + author</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="d" />

        {/* ── SHELL ──────────────────────────────── */}
        <section id="shell" className="pad">
          <div className="c">
            <div className="sh-c u1">
              <p className="eyebrow">Shell · Unified Workspace</p>
              <h2>
                Every tool.<br />
                <span className="g">One window.</span>
              </h2>
              <p>
                One window. Every tool your team uses, connected through a single
                graph. Your AI agent already knows the context behind every thread,
                issue, commit, and decision — because they&apos;re all in the same place.
              </p>
            </div>

            <div className="hero-window-wrap u2" style={{ maxWidth: "100%", padding: "0" }}>
              <div
                className="app-win"
                role="img"
                aria-label="dashway Shell — full workspace"
                style={{ animation: "none" }}
              >
                <div className="win-bar">
                  <div className="win-dots">
                    <span className="wd wd-r" />
                    <span className="wd wd-y" />
                    <span className="wd wd-g" />
                  </div>
                  <span className="win-title">dash-way Shell — Issues / #backend</span>
                  <div className="win-search">
                    <span>⌘</span>
                    <span>Search everything...</span>
                    <span className="win-kbd">⌘K</span>
                  </div>
                </div>

                <div className="win-body" style={{ minHeight: "380px" }}>
                  <div className="win-sidebar">
                    <div className="si on" title="Issues">◆</div>
                    <div className="si" title="Chat">💬</div>
                    <div className="si" title="Git">&lt;/&gt;</div>
                    <div className="si" title="Calendar">📅</div>
                    <div className="si-sep" />
                    <div className="si" title="AI Agent" style={{ color: "#c4b5fd" }}>✦</div>
                  </div>

                  <div className="win-list">
                    <div className="win-pane-hd">
                      <span className="pane-title">Issues</span>
                      <span className="pane-count">#backend · 4 open</span>
                    </div>
                    <div className="win-items">
                      <div className="wi sel">
                        <span className="wi-dot wi-dot-b" />
                        <span className="wi-id">#384</span>
                        <span className="wi-name hi">feat: refresh token rotation</span>
                      </div>
                      <div className="wi">
                        <span className="wi-dot wi-dot-a" />
                        <span className="wi-id">#389</span>
                        <span className="wi-name">ACL update for graph queries</span>
                      </div>
                      <div className="wi">
                        <span className="wi-dot wi-dot-a" />
                        <span className="wi-id">#391</span>
                        <span className="wi-name">Rate limiting on Context API</span>
                      </div>
                      <div className="wi">
                        <span className="wi-dot wi-dot-g" />
                        <span className="wi-id">#376</span>
                        <span className="wi-name">Login flow redesign</span>
                      </div>
                    </div>
                    <div className="win-graph">
                      ⬡ Graph: Thread #2910 → Issue #384 → PR #52
                    </div>
                  </div>

                  <div className="win-term">
                    <div className="win-pane-hd">
                      <span className="pane-title" style={{ color: "#c4b5fd" }}>✦ AI Agent</span>
                      <span className="pane-count">grep-way · full context</span>
                    </div>
                    <div className="term-body">
                      <span className="tp">$ </span>
                      <span className="tt">grep-way &quot;why 7-day token expiry?&quot;</span>
                      <br /><br />
                      <span className="tm">Tracing from </span>
                      <span className="tt">Issue #384</span>
                      <span className="tm">...</span>
                      <br /><br />
                      <span className="tai">✦ Found in Thread #2910</span><br />
                      <span className="tav">  @sojin · Jan 14 · BE team</span><br />
                      <span className="tav">  &quot;7-day expiry, silent refresh —</span><br />
                      <span className="tav">   security first, UX transparent.&quot;</span>
                      <br /><br />
                      <span className="tl">→ Merged in PR #52 · Jan 18</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="d" />

        {/* ── DEMO ───────────────────────────────── */}
        <section id="demo" className="pad">
          <div className="c">
            {/* Text left, code right — consistent with hero split direction */}
            <div className="demo-grid u1">
              <div className="demo-exp">
                <p className="eyebrow">grep-way · built-in CLI</p>
                <h2>
                  Ask anything.<br />
                  <span className="g">Get the full story.</span>
                </h2>
                <p style={{ marginTop: ".9rem", fontSize: "clamp(1rem,1.8vw,1.05rem)", color: "var(--fg-2)", lineHeight: 1.65 }}>
                  grep-way is dashway&apos;s built-in CLI. Because everything lives
                  in one graph, every query returns the full chain — Thread,
                  Issue, PR, Decision — not a fragment from a disconnected tool.
                </p>
                <div className="exp-list" style={{ marginTop: "1.8rem" }}>
                  <div className="exp-item">
                    <div className="exp-chk">✓</div>
                    <div>
                      <strong>One graph, not five APIs</strong>
                      <p>Links are native — no syncing, no polling, no eventual consistency lag.</p>
                    </div>
                  </div>
                  <div className="exp-item">
                    <div className="exp-chk">✓</div>
                    <div>
                      <strong>Decisions are first-class citizens</strong>
                      <p>Every conclusion, merge, and closure is a graph node with full provenance.</p>
                    </div>
                  </div>
                  <div className="exp-item">
                    <div className="exp-chk">✓</div>
                    <div>
                      <strong>AI gets the whole context</strong>
                      <p>One system. Full history. Zero hallucination from missing context.</p>
                    </div>
                  </div>
                </div>
                <p className="exp-note">
                  With dashway, you don&apos;t ask &quot;where did we discuss this?&quot;
                  The answer is always: right here.
                </p>
              </div>

              <div className="code-win u2">
                <div className="code-bar">
                  <div style={{ display: "flex", gap: ".38rem" }}>
                    <span className="wd wd-r" />
                    <span className="wd wd-y" />
                    <span className="wd wd-g" />
                  </div>
                  <span className="code-bar-title">grep-way — terminal</span>
                </div>
                <div className="code-body">
                  <span className="cc"># &quot;Where was the auth token decision made?&quot;</span>
                  <br /><br />
                  <span className="cp">$ </span>
                  <span className="cmd">grep-way &quot;auth token expiry decision&quot;</span>
                  <br /><br />
                  <span className="ca">● </span>
                  <span className="ct">Thread #2910</span>
                  <span className="cm">  (BE · #backend)</span><br />
                  <span className="cm">  &quot;Auth token expiry — which strategy?&quot;</span><br />
                  <span className="cm">  @sojin · Jan 14 · 12 replies</span>
                  <span className="cbr" />
                  <span className="ca">  ↳ </span>
                  <span className="cl">Issue #384</span>
                  <span className="cm">  feat: implement refresh token rotation</span><br />
                  <span className="cs">    [In Progress] </span>
                  <span className="cm">assigned @jay</span>
                  <span className="cbr" />
                  <span className="ca">  ↳ </span>
                  <span className="cl">PR #52</span>
                  <span className="cm">  feat: refresh token rotation</span><br />
                  <span className="cl">    [Merged ✓] </span>
                  <span className="cm">by @sojin · Jan 18</span>
                  <span className="cbr" />
                  <span className="cai">✦ AI Summary</span><br />
                  <span className="cav">  7-day expiry + silent refresh agreed.</span><br />
                  <span className="cav">  Security first, UX transparent.</span>
                  <br /><br />
                  <span className="cm">─────────────────────────────────────</span><br />
                  <span className="cc"># Thread → Issue → PR · all in dashway</span><br />
                  <span className="cc"># no external API calls needed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="d" />

        {/* ── CTA ────────────────────────────────── */}
        <section className="pad">
          <div className="c">
            <div className="cta-wrap u1">
              <h2>
                Start on solid ground.<br />
                <span className="g">From day one.</span>
              </h2>
              <p>
                Most teams bolt on structure after the mess has already piled up —
                connecting tools with MCPs, syncing data between silos, hoping the
                AI figures it out. dashway starts with the graph. The connections,
                the provenance, the AI context are there from the first thread.
              </p>
              <div className="cta-btns">
                <a
                  href="https://github.com/team-ssot/dashway"
                  className="btn btn-solid"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon />
                  Star on GitHub
                </a>
                <a href="#docs" className="btn btn-ghost">
                  Read the docs →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer className="footer">
        <div className="footer-i">
          <a href="/" className="brand">
            dash<span className="brand-way">-way</span>
          </a>
          <nav className="footer-links" aria-label="Footer">
            <a href="https://github.com/team-ssot/dashway" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="#docs">Docs</a>
            <a href="#blog">Blog</a>
            <a href="#discord">Discord</a>
          </nav>
          <p className="footer-copy">© 2026 Team SSOT · Apache 2.0</p>
        </div>
      </footer>
    </div>
  );
}
