# Contributing to SimOffice

Thanks for your interest in contributing to SimOffice! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** 22.14+
- **pnpm** 10+
- **macOS** 12+ (Electron desktop app)

### Setup

```bash
git clone https://github.com/johnkf5-ops/simoffice.git
cd simoffice
pnpm install
pnpm dev
```

## Project Structure

```
electron/
  main/            # Electron main process (app lifecycle, IPC handlers, updater)
  utils/           # Main process utilities (auth, paths, config, OAuth)
  gateway/         # OpenClaw gateway manager and config sync
  api/             # Host API server (REST routes for renderer)
  services/        # Provider services (runtime sync, provider management)
  preload/         # Preload scripts (IPC bridge to renderer)
src/
  components/      # React components (UI, settings, channels, providers)
  pages/           # Route pages (Lobby, Chat, Connections, Analytics, etc.)
  stores/          # Zustand state stores
  lib/             # Shared libraries (API client, gateway client, providers)
  features/        # Feature modules (office, agents)
  i18n/            # Internationalization (en, ja, zh)
scripts/           # Build scripts (bundle-openclaw, bundle-plugins, etc.)
resources/         # App icons, platform binaries, CLI scripts
```

## Development Guidelines

- **All colors use CSS variables.** Never hardcode colors — light and dark themes are both supported.
- **State management uses Zustand.** Each store is a single file in `src/stores/`.
- **Chat store is a monolith** — `src/stores/chat.ts` is the single source of truth for all chat logic.
- **Rooms are frontend-only.** Room messages live in the rooms store, not the chat store.
- **OpenClaw is bundled** — the gateway runs as a child process managed by `electron/gateway/manager.ts`.
- **Native deps must be explicit** — pnpm hoisting means transitive runtime deps need to be in `package.json`.

## Submitting Changes

1. Fork the repo and create a feature branch from `main`
2. Make your changes
3. Run `pnpm test` and `pnpm typecheck` to verify nothing is broken
4. Open a pull request with a clear description of the change

## Reporting Bugs

Open a [GitHub Issue](https://github.com/johnkf5-ops/simoffice/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- macOS version and chip (Intel/Apple Silicon)
- SimOffice version (Settings page)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## License

By contributing, you agree that your contributions will be licensed under the same proprietary license as the project.
