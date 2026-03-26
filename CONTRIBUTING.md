# Contributing to SimOffice

Thanks for your interest in contributing to SimOffice! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (package manager)
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
src/
  components/    # React components
  pages/         # Route pages
  stores/        # Zustand state stores
  services/      # Backend service integrations
  utils/         # Shared utilities
resources/       # App icons and static assets
```

## Development Guidelines

- **All colors use CSS variables.** Never hardcode colors — light and dark themes are both supported.
- **State management uses Zustand.** Each store is a single file in `src/stores/`.
- **Chat store is a monolith** — `src/stores/chat.ts` is the single source of truth for all chat logic.
- **Rooms are frontend-only.** Room messages live in the rooms store, not the chat store.

## Submitting Changes

1. Fork the repo and create a feature branch from `main`
2. Make your changes
3. Run `pnpm test` to verify nothing is broken
4. Open a pull request using the [PR template](.github/pull_request_template.md)

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
