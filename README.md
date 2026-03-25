
<h1 align="center">SimOffice</h1>

<p align="center">
  <strong>Your AI Office — Run a team of AI agents from a 3D virtual desktop</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-orange" alt="Version" />
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
- **211 Agent Templates** — Browse agents across 28 categories: sales, marketing, finance, crypto trading, legal, healthcare, insurance, restaurant, real estate, therapy, and more
- **19 Career Templates** — Pick your career (Crypto Trader, Loan Officer, Therapist, Restaurant Owner, Contractor, etc.) and get a pre-built team instantly
- **Crypto Trading with MoonPay** — Trade crypto, DCA, scan markets, and research tokens. Powered by MoonPay with in-app setup, no terminal required.
- **Multi-Provider AI** — Connect Claude, ChatGPT, Grok, Gemini, or run locally with Ollama
- **Chat with Agents** — Talk to your team through an inline buddy-list chat
- **Messaging Integrations** — Connect Discord, Telegram, WhatsApp, and iMessage with step-by-step wizards
- **SOUL.md Personalities** — Each agent gets a unique personality file that shapes how they respond
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

## Changelog

### v1.3.0
- **MoonPay integration** — Crypto Trader and Crypto Trading Team career templates, powered by MoonPay
- 4 new crypto agents: MoonPay Trader, Crypto Researcher, DCA Agent, Market Scanner
- New Crypto Trading category with 7 agents
- In-app MoonPay setup wizard — email + OTP, no terminal needed
- MoonPay partner branding on career cards
- Partners section in Connections page
- 211 agents across 28 categories (was 207 across 27)
- 19 career templates (was 17)
- Dynamic agent count in catalog (was hardcoded)

### v1.2.3
- 207 agents across 27 categories (was 174 across 24)
- 17 career templates (was 9) — new: Loan Officer, Insurance Agent, Restaurant Owner, Contractor, Therapist, Nonprofit, Property Management, Logistics
- New categories: Insurance, Restaurant, Nonprofit, Therapy
- New agents: mortgage rate watcher, loan pipeline, doc chaser, claims intake, menu manager, reservation agent, food cost tracker, therapy notes, superbill generator, client check-in, grant writer, donor manager, and more
- All agent SOUL.md files trimmed 50% — faster loading, same quality
- Fixed all broken career template references

### v1.2.2
- Fixed update flow — Settings now shows Download/Install buttons (was broken since v1.0)
- Auto-update toggle in Settings — automatically download and install updates

### v1.2.1
- Shared provider setup modal — consistent wizard across Brain page and Onboarding
- Gateway sync fixes, provider validation improvements
- Removed low-quality 8GB models, 16 GB minimum for local AI
- Intel Macs get "use cloud" messaging instead of broken local AI

### v1.2.0
- Local AI via Ollama — full setup wizard, auto-download, headless, 17 curated models
- Hardware detection + model recommendation engine
- Onboarding redesign with FREE local AI hero card
- Brain page redesign — local AI hero at top, cloud grid below
- Toolbar/sidebar show active LLM (Local vs API indicator)
- 46 unit tests for hardware detection, model recommender, Ollama services

### v1.1.2
- 3D office with GPU acceleration
- 174 agent catalog with SOUL.md personalities
- Career-based team builder
- Messaging integrations (Discord, Telegram, WhatsApp, iMessage)

## License

Copyright 2026 CrashOverride LLC. All rights reserved.

This software is proprietary. See [LICENSE](LICENSE) for details.
