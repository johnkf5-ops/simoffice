
<h1 align="center">SimOffice</h1>

<p align="center">
  <strong>Your AI Office — Run a team of AI agents from a 3D virtual desktop</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.4-orange" alt="Version" />
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
- **Messaging Integrations** — Connect Discord, Telegram, WhatsApp, and iMessage with step-by-step wizards
- **SOUL.md Personalities** — Each agent gets a unique personality file that shapes how they respond
- **Dark & Light Themes** — Full theme support with CSS variable-driven styling
- **Auto-Updates** — App updates automatically via GitHub Releases

## System Requirements

| | Minimum | Recommended |
|---|---|---|
| **macOS** | 12 Monterey | 14 Sonoma+ |
| **RAM** | 8 GB (cloud AI only) | 16 GB+ (local AI) |
| **Chip** | Intel or Apple Silicon | Apple Silicon (M1/M2/M3/M4) |
| **Disk** | 500 MB | 5 GB+ (with local AI models) |

## Download

Grab the latest DMG from [Releases](https://github.com/johnkf5-ops/simoffice/releases/latest):

- **Apple Silicon (M1/M2/M3/M4):** `SimOffice-*-mac-arm64.dmg`
- **Intel Mac:** `SimOffice-*-mac-x64.dmg`

Both builds are signed and notarized by Apple.

## Development

```bash
pnpm install
pnpm dev          # run in dev mode
pnpm test         # run tests
pnpm run package:mac  # build DMG
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## What's New in v2.0.4

- **MoonPay Trading Integration** — Full end-to-end crypto trading: auth, wallet creation, MCP config, exec tools, checkout popups. 4-step setup wizard, 19 MoonPay skills auto-installed.
- **Subscription System** — $29.99/mo Stripe subscription with 3-day free trial (no CC required). License key activation, billing portal, email recovery.
- **Auto-Updater Fix** — Fixed Squirrel.Mac hang with progress bar, ETA, and automatic DMG fallback.
- **Display Name** — Onboarding asks your name, AI agents address you personally. Editable in Settings.

<details>
<summary>Previous versions</summary>

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

## License

Copyright 2026 CrashOverride LLC. All rights reserved.

This software is proprietary. See [LICENSE](LICENSE) for details.
