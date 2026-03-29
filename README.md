
<h1 align="center">SimOffice</h1>

<p align="center">
  <strong>Your AI Office — Run a team of AI agents from a 3D virtual desktop</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.2.0-orange" alt="Version" />
  <img src="https://img.shields.io/badge/platform-macOS-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/license-Proprietary-red" alt="License" />
</p>

<p align="center">
  <a href="https://github.com/johnkf5-ops/simoffice/releases/latest"><strong>Download Latest Release</strong></a>
</p>

---

## What is SimOffice?

**SimOffice** is a desktop app that lets non-technical people build and manage AI agent teams through a virtual 3D office. Pick a career, get a pre-built team of AI agents with unique personalities, and start chatting — no terminal required.

## Features

- **Free Local AI** — Run AI on your own Mac with Ollama. No account, no fees, fully private. Auto-installs and configures everything.
- **3D Virtual Office** — Watch your AI agents work in a retro-style 3D office powered by Three.js/WebGL
- **211+ Agent Templates** — Browse agents across 28+ categories: sales, marketing, finance, crypto trading, legal, healthcare, insurance, restaurant, real estate, therapy, and more
- **19 Career Templates** — Pick your career (Crypto Trader, Loan Officer, Therapist, Restaurant Owner, Contractor, etc.) and get a pre-built team instantly
- **Instant Streaming Chat** — Rewritten chat engine with instant streaming responses and zero duplicate messages
- **Team Chat Rooms** — Create rooms with multiple agents using Team mode (all agents respond) or @Mention mode (tag specific agents)
- **Agent Customization** — Rename agents, change their avatar and accent color to make your team your own
- **File Upload** — Send files directly in chat for agents to analyze and respond to
- **Crypto Trading with MoonPay** — Trade crypto, DCA, scan markets, and research tokens. Powered by MoonPay with in-app setup, no terminal required.
- **Multi-Provider AI** — Connect Claude, ChatGPT, Grok, Gemini, or run locally with Ollama
- **20 Business Integrations** — Stripe, GitHub, Jira, Notion, HubSpot, Sentry, Linear, and more. MCP-powered — agents get tools automatically after you connect.
- **Email Integration** — Connect Gmail, Outlook, Fastmail, or any IMAP/SMTP email. Agents can read, search, send, and manage your inbox.
- **Integrations Sidebar** — Connected tools appear in the chat sidebar with suggested prompts so you know what to ask.
- **Messaging Integrations** — Connect Discord, Telegram, WhatsApp, iMessage, Slack, Google Chat, and more with step-by-step wizards
- **Agent Memory** — Agents remember context across sessions. Local-only persistent memory powered by GigaBrain — no cloud, no vector DB.
- **SOUL.md Personalities** — Each agent gets a unique personality file that shapes how they respond
- **Dark & Light Themes** — Full theme support with CSS variable-driven styling
- **Auto-Updates** — App updates automatically via GitHub Releases

## System Requirements

| | Minimum | Recommended |
|---|---|---|
| **macOS** | 12 Monterey | 14 Sonoma+ |
| **RAM** | 8 GB (cloud AI only) | 16 GB+ (local AI) |
| **Chip** | Apple Silicon (M1+) | Apple Silicon (M2/M3/M4) |
| **Disk** | 500 MB | 5 GB+ (with local AI models) |

## Download

Grab the latest DMG from [Releases](https://github.com/johnkf5-ops/simoffice/releases/latest):

- **macOS (Apple Silicon):** `SimOffice-*-mac-arm64.dmg`

Signed and notarized by Apple. Requires Apple Silicon (M1 or later).

## Development

```bash
pnpm install
NODE_OPTIONS="--max-old-space-size=8192" pnpm dev   # run in dev mode
pnpm test                                           # run tests
pnpm run package:mac                                # build DMG
```

> **Note:** The `NODE_OPTIONS` heap bump is required since OpenClaw 2026.3.24 due to the larger dependency graph.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## What's New in v2.2.0

- **Agent Memory (GigaBrain)** — Give agents persistent memory across sessions. Agents automatically recall relevant context before each turn. Enable with one toggle in Settings. Local-only storage, no cloud — powered by [GigaBrain](https://github.com/legendaryvibecoder/gigabrain).

<details>
<summary>Previous versions</summary>

### v2.1.2
- **Email Automations** — Schedule email tasks: inbox digest, urgent alerts, draft replies. Deliver automation results to your inbox. Multi-account picker when multiple email providers are connected.
- **Business Integration Automations** — 13 integration-specific templates (Stripe revenue, GitHub PRs, Jira sprint, Sentry errors, and more). Cards appear automatically when you connect the integration.
- **OpenClaw 2026.3.28** — Upgraded from 2026.3.24. Stability fixes for WhatsApp, Discord, Telegram, BlueBubbles. OAuth imports made resilient to future extension removals.

### v2.1.1
- **OpenClaw Controls** — New settings page at Settings → Advanced → OpenClaw Controls. Manage sessions (rename, model, thinking level, reset, delete), configure global reset policies and maintenance settings, or type plain-English commands with real-time preview.

### v2.1.0
- 20 Business Integrations — Stripe, GitHub, GitLab, Linear, Sentry, and 15 more. MCP-powered, agents get tools automatically.
- Email Integration — Gmail, Outlook, Fastmail, IMAP/SMTP. 47 email tools.
- Integrations Sidebar — Connected tools in chat with suggested prompts.

### v2.0.9
- Automations Redesign — Grandma-friendly creation flow. Inspiration cards, plain English schedules, channel delivery, notifications, activity feed.

### v2.0.8
- Reliable Auto-Updater — Replaced Squirrel.Mac with direct DMG download. Progress bar with ETA, SHA512 verification, drag-and-drop install.
- OpenClaw 2026.3.24 — OpenAI-compatible `/v1/models` and `/v1/embeddings` endpoints, Teams SDK migration.
- Analytics Redesign — Cleaner layout, compact KPI cards, theme-aware chart.

### v2.0.7
- Analytics Dashboard — Agent spending, token usage, model breakdown, and budget alerts.
- Connector System Fix — Fixed iMessage config, channel status events, channel ID parser.
- Slack Validation — Live credential validation via Slack API.

### v2.0.5
- MoonPay Trading Integration — Full end-to-end crypto trading: auth, wallet creation, MCP config, exec tools, checkout popups. 4-step setup wizard, 19 MoonPay skills auto-installed.
- Subscription System — $29.99/mo Stripe subscription with 3-day free trial (no CC required). License key activation, billing portal, email recovery.
- Auto-Updater Fix — Fixed Squirrel.Mac hang with progress bar, ETA, and automatic DMG fallback.
- Display Name — Onboarding asks your name, AI agents address you personally. Editable in Settings.

### v2.0.0
- Rewritten chat engine — instant streaming, zero duplicate messages
- Team chat rooms — Team mode and @Mention mode with anti-loop protection
- Agent customization — rename, change avatars and accent colors
- File upload in chat, dark & light themes, new home page

### v1.3.0
- MoonPay integration — Crypto Trader and Crypto Trading Team career templates
- 4 new crypto agents: MoonPay Trader, Crypto Researcher, DCA Agent, Market Scanner
- In-app MoonPay setup wizard — email + OTP, no terminal needed
- 211 agents across 28 categories, 19 career templates

### v1.2.0 – v1.2.3
- Local AI via Ollama — full setup wizard, auto-download, headless, 17 curated models
- Hardware detection + model recommendation engine
- Shared provider setup modal, gateway sync fixes
- 207 agents across 27 categories, 17 career templates

### v1.1.2
- 3D office with GPU acceleration
- 174 agent catalog with SOUL.md personalities
- Career-based team builder
- Messaging integrations (Discord, Telegram, WhatsApp, iMessage)

</details>

## Acknowledgments

SimOffice uses the following open source software:

- **[GigaBrain](https://github.com/legendaryvibecoder/gigabrain)** — Local-first memory layer for AI agents. MIT License.

## License

Copyright 2026 CrashOverride LLC. All rights reserved.

This software is proprietary. See [LICENSE](LICENSE) for details.
