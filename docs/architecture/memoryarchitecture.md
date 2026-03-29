# Agent Memory Architecture

> **Version:** 2.2.0 | **Date:** 2026-03-29 | **Status:** Shipped in v2.2.0
> Memory plugin: `@legendaryvibecoder/gigabrain` v0.6.1 (MIT)

SimOffice gives every agent persistent, cross-session memory via the GigaBrain memory plugin. When enabled, agents automatically recall relevant context before each turn and capture new memories from conversation. Memory is local-only, per-agent, and opt-in — disabled by default.

---

## Table of Contents

- [What This Is](#what-this-is)
- [High-Level Architecture](#high-level-architecture)
- [The Four Layers](#the-four-layers)
- [Storage Layout](#storage-layout)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Config Schema](#config-schema)
- [Capture Semantics](#capture-semantics)
- [Workspace File Reading API](#workspace-file-reading-api)
- [Security Constraints](#security-constraints)
- [Known Issues & Edge Cases](#known-issues--edge-cases)
- [Locked Decisions (Do Not Change)](#locked-decisions-do-not-change)
- [Follow-Up Items](#follow-up-items)
- [File Reference](#file-reference)

---

## What This Is

An integration of the GigaBrain memory plugin into SimOffice's OpenClaw plugin system. GigaBrain is a local-first memory layer for AI agents — it stores memories in SQLite + FTS5 and plain Markdown files, with no Docker, no vector DB, and no cloud services.

When a user enables memory in Settings, every agent in the office gains:

1. **Recall** — Before each conversation turn, relevant memories are injected into the agent's system context automatically.
2. **Capture** — After each turn, the agent's output is scanned for `<memory_note>` tags and captured to the memory store.

The user sees a single toggle. Behind it: plugin bundling, installation, config management, gateway reload, and two read-only API endpoints for a future memory browser UI.

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Renderer Process (React)                                     │
│                                                               │
│  ┌─────────────────────┐                                      │
│  │  LobbySettings.tsx  │                                      │
│  │  "Agent Memory"     │                                      │
│  │  section — Toggle   │                                      │
│  └──────────┬──────────┘                                      │
│             │ ipcRenderer.invoke('memory:enable')              │
│             │ ipcRenderer.invoke('memory:disable')             │
│             │ ipcRenderer.invoke('memory:status')              │
└─────────────┼─────────────────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────────────────────┐
│  Electron Main Process                                        │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐    │
│  │  ipc-handlers.ts     │    │  memory-config.ts         │    │
│  │  memory:enable       │───▶│  enableMemory()           │    │
│  │  memory:disable      │    │  disableMemory()          │    │
│  │  memory:status       │    │  isMemoryEnabled()        │    │
│  └──────────┬───────────┘    │                           │    │
│             │                │  withConfigLock() guards   │    │
│             │                │  all writes to:            │    │
│             │                │  ~/.openclaw/openclaw.json │    │
│             │                └──────────────────────────┘    │
│             │                                                 │
│             │  gatewayManager.debouncedReload()                │
│             ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  plugin-install.ts                                    │    │
│  │  ensureGigaBrainPluginInstalled()                     │    │
│  │  → copies to ~/.openclaw/extensions/gigabrain/        │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────────────────────┐
│  OpenClaw Gateway (child process, port 18789)                 │
│                                                               │
│  Loads GigaBrain from ~/.openclaw/extensions/gigabrain/       │
│                                                               │
│  ┌──────────────────┐    ┌──────────────────────────────┐    │
│  │  before_agent_    │    │  agent_end hook               │    │
│  │  start hook       │    │  Scans output for             │    │
│  │  Queries SQLite   │    │  <memory_note> tags           │    │
│  │  + MEMORY.md      │    │  Writes to memory stores      │    │
│  │  Injects context  │    │  Deduplicates across agents   │    │
│  └──────────────────┘    └──────────────────────────────┘    │
│                                                               │
│  Storage per agent:                                           │
│  ~/.openclaw/workspace-{agentId}/                             │
│    ├── memory/registry.sqlite    (FTS5 search index)          │
│    ├── MEMORY.md                 (durable memories)            │
│    └── memory/YYYY-MM-DD.md      (daily session notes)        │
└───────────────────────────────────────────────────────────────┘
```

---

## The Four Layers

### Layer 1: UI (Renderer)

The memory toggle lives in `LobbySettings.tsx` as its own section ("Agent Memory") between the Engine and Updates sections. It is a top-level section, not buried inside Advanced.

**State:**
- `memoryEnabled` — boolean, loaded from `memory:status` IPC on mount via `useEffect`
- `handleMemoryToggle(on)` — calls `memory:enable` or `memory:disable` IPC, reverts state on failure

**UX details:**
- Enabling shows a `window.confirm()` dialog warning about token cost increase
- Toggle is optimistic: sets state immediately, rolls back if IPC returns `{ success: false }`
- The handler checks `result?.success` explicitly — IPC returns `{ success: false }` instead of throwing

### Layer 2: IPC Bridge (Preload + Main)

Three IPC channels whitelisted in `preload/index.ts`, handled inside `registerIpcHandlers()` in `ipc-handlers.ts` (which has `gatewayManager` available as a closure parameter). All handlers use dynamic `await import()` for the config and install modules, matching the pattern used by other integration handlers.

| Channel | Return (success) | Return (failure) | What it does |
|---------|-----------------|-------------------|-------------|
| `memory:status` | `{ enabled: true }` | `{ enabled: false }` | Reads config, checks `plugins.slots.memory === 'gigabrain'` |
| `memory:enable` | `{ success: true }` | `{ success: false, error }` | Installs plugin → writes config → reloads gateway |
| `memory:disable` | `{ success: true }` | `{ success: false, error }` | Removes config → reloads gateway |

**Enable flow in detail:**

```
ipcMain.handle('memory:enable')
  └─ ensureGigaBrainPluginInstalled() — guard against install race
  └─ enableMemory()
     └─ withConfigLock()
        └─ Read openclaw.json
        └─ Set plugins.slots.memory = "gigabrain"
        └─ Set plugins.entries.gigabrain = { config: {} }
        └─ Add "gigabrain" to plugins.allow
        └─ Write openclaw.json
  └─ gatewayManager.debouncedReload()
     └─ Gateway picks up new plugin config
     └─ GigaBrain register() bootstraps DB, stores, indexes
```

**Disable flow:** Removes `plugins.slots.memory` and `"gigabrain"` from `plugins.allow`, but **keeps** `plugins.entries.gigabrain` so user config survives re-enable. Then calls `debouncedReload()`.

**Gateway reload:** `debouncedReload()` (manager.ts line 558) sends SIGUSR1 for in-process reload. It auto-falls back to `debouncedRestart()` if the gateway's reload policy is `off` or `restart` — no separate fallback logic needed in memory handlers.

### Layer 3: Config Management (memory-config.ts)

`electron/utils/memory-config.ts` manages the GigaBrain plugin slot in `~/.openclaw/openclaw.json`. Three exported functions:

| Function | What it does |
|----------|-------------|
| `isMemoryEnabled()` | Reads config, checks `plugins.slots.memory === 'gigabrain'` |
| `enableMemory()` | Sets slot, creates entry with `{}` config, adds to allow list |
| `disableMemory()` | Removes slot + allow entry, keeps `entries.gigabrain` |

All writes are wrapped in `withConfigLock()` (imported from `config-mutex.ts`) to prevent concurrent write corruption. The lock is reentrant-safe via `AsyncLocalStorage`.

**Why `{}` config?** GigaBrain handles ALL defaults internally via `normalizeConfig()` in `lib/core/config.js`. Passing `{}` lets GigaBrain use its `DEFAULT_CONFIG` (config.js lines 96–340). Hardcoding defaults here would diverge across version upgrades.

**Safe from sanitizer:** `sanitizeOpenClawConfig()` (called during pre-launch sync in `config-sync.ts`) does NOT touch `plugins.entries` or `plugins.allow` — verified safe. It won't strip GigaBrain's config.

### Layer 4: Plugin Bundling & Installation (plugin-install.ts + after-pack.cjs)

GigaBrain follows the exact same bundling pattern as channel plugins (DingTalk, WeCom, QQBot, Feishu):

**Build time** (`scripts/after-pack.cjs`):
- `BUNDLED_PLUGINS` array includes `{ npmName: '@legendaryvibecoder/gigabrain', pluginId: 'gigabrain' }`
- `bundlePlugin()` copies from node_modules to `resources/openclaw-plugins/gigabrain/`
- Collects transitive deps via pnpm virtual store BFS, flattens into `gigabrain/node_modules/`
- Skips peer deps (openclaw is optional peer)
- Cleanup strips `.d.ts`, `README.md`, `CHANGELOG.md` but preserves `.ts` files (GigaBrain ships raw TypeScript)

**Dev time** (`scripts/bundle-openclaw-plugins.mjs`):
- `PLUGINS` array includes GigaBrain
- Creates `build/openclaw-plugins/gigabrain/` during dev builds

**Runtime** (`electron/utils/plugin-install.ts`):
- `ensureGigaBrainPluginInstalled()` calls `ensurePluginInstalled('gigabrain', ...)`
- Added to `ALL_BUNDLED_PLUGINS` for fire-and-forget startup install
- Added to `PLUGIN_NPM_NAMES` for dev-mode fallback (copy from node_modules without running the dev bundler)
- Version-aware: upgrades if bundled version differs from installed

**MoonPay conflict guard** (`ipc-handlers.ts`):
- `'gigabrain'` added to `KNOWN_BUNDLED_PLUGINS` set at line 2195
- Without this, the `moonpay:configure-mcp` handler strips GigaBrain from `plugins.allow`

---

## Storage Layout

All memory storage is local, per-agent, under `~/.openclaw/`:

```
~/.openclaw/
  ├── openclaw.json                              ← Plugin config (slots, entries, allow)
  ├── extensions/gigabrain/                      ← Installed plugin files
  │     ├── index.ts                             ← Plugin entry point (raw TypeScript)
  │     ├── openclaw.plugin.json                 ← Plugin manifest
  │     ├── package.json
  │     ├── lib/core/config.js                   ← Default config + normalizeConfig()
  │     ├── lib/core/capture-service.js            ← Memory capture logic
  │     └── node_modules/                        ← Flattened transitive deps
  │
  ├── workspace-{agentId}/                       ← Per-agent workspace
  │     ├── MEMORY.md                            ← Human-readable durable memories
  │     ├── memory/
  │     │     ├── registry.sqlite                ← SQLite + FTS5 search index
  │     │     ├── 2026-03-29.md                  ← Daily session notes
  │     │     └── ...
  │     ├── SOUL.md                              ← (existing — not memory-related)
  │     └── ...
  │
  └── workspace/                                 ← Main agent workspace (agentId === 'main')
        ├── MEMORY.md
        ├── memory/
        │     ├── registry.sqlite
        │     └── ...
        └── ...
```

**Key paths** (from GigaBrain `config.js` line 1020):
- `registryPath` → `{memoryRoot}/registry.sqlite`
- `native.memoryMdPath` → `{workspace}/MEMORY.md` (config.js line 290)
- `native.dailyNotesGlob` → `{workspace}/memory/*.md` (config.js line 291)

---

## Plugin Lifecycle

### Registration (Gateway Load)

When the Gateway loads GigaBrain, `register()` (index.ts lines 400–445) runs automatically:

1. Resolves paths via `normalizeConfig()` (config.js line 1015)
2. Creates DB directory (`fs.mkdirSync`, line 422)
3. Bootstraps all 5 stores: projection, event, native, person, world model (`withDb()` at lines 425–426)
4. Syncs native markdown files into the DB (`syncNativeMemory`, line 428)
5. Promotes native chunks to durable registry (`promoteNativeChunks`, line 433)
6. Rebuilds entity mention index (`rebuildEntityMentions`, line 439)
7. Rebuilds world model if enabled (`rebuildWorldModel`, line 441)

No separate setup wizard is needed. The standalone setup wizard (`setup-first-run.js`) is for Codex CLI / Claude Desktop installations. In the OpenClaw plugin context, `register()` replaces it entirely.

### Hooks

GigaBrain registers as an OpenClaw memory slot plugin (`kind: "memory"`) and hooks into two lifecycle events:

| Hook | GigaBrain Source | What it does |
|------|-----------------|-------------|
| `before_agent_start` | index.ts line 489 | Queries SQLite FTS5 + reads MEMORY.md, injects relevant context into system prompt |
| `agent_end` | index.ts line 557 | Scans output for `<memory_note>` tags, deduplicates, writes to all memory stores |

### Runtime Environment

- GigaBrain runs in **OpenClaw's Node.js runtime** (not Electron's main process)
- Requires Node >= 22 (uses `node:sqlite` built-in)
- OpenClaw >= 2026.2.15 bundles Node 22+ — confirmed compatible
- Electron never loads GigaBrain directly; it only copies the plugin files to disk

### LLM Configuration

Default is `llm.provider: "none"` (config.js line 251). In this mode:
- Recall uses deterministic FTS5 full-text search only — no LLM-powered semantic search
- `llm.review.enabled` defaults to `false` (line 260) — no LLM-powered deduplication review
- No external LLM needed for base functionality

**FTS5 recall limitation:** Pure keyword matching can miss semantically relevant memories. For example, a stored memory "user prefers dark theme" won't match a later query about "color scheme." GigaBrain supports `llm.provider` settings (config.js lines 248–260) that could enable LLM-powered semantic recall, but this would route through the user's API key and increase costs. FTS5-only is the right default — an LLM-powered recall tier is a future config option, not a SimOffice code change.

### Memory Isolation

Each agent has its own DB file — no two agents share a `registry.sqlite`. The deduplication in `agent_end` is within a single agent's store, not cross-agent.

This means if a user tells one agent "I'm John, I work at Acme Corp," other agents won't know. Shared memory would require either a shared DB path or a sync layer — neither exists in GigaBrain today. This would be a GigaBrain feature request upstream, not something SimOffice can solve at the integration layer.

### SQLite Concurrency

GigaBrain uses `node:sqlite` (`DatabaseSync`) with these settings (sqlite.js lines 32–35):

- **Journal mode:** Default (DELETE) — WAL mode is **not** enabled
- **Busy timeout:** 5000ms, configurable via `GB_SQLITE_BUSY_TIMEOUT_MS` env var (range: 0–600,000ms)
- **Application-level locking:** None — relies entirely on SQLite's built-in file locking
- **Transactions:** Used in critical batch paths (`materializeProjectionFromMemories` in projection-store.js, `appendEvents` in event-store.js)

**Why this is safe in SimOffice:** Each agent has its own `registry.sqlite` file (no cross-agent sharing). OpenClaw serializes turns within a single agent (one session at a time), so `before_agent_start` and `agent_end` hooks don't race against each other for the same DB. The 5-second busy timeout is a safety net for edge cases, not a primary concurrency mechanism.

### Upgrade & Schema Migration

GigaBrain uses **schema evolution without explicit migration tracking** — no version table, no migration runner. Instead:

1. **All tables use `CREATE TABLE IF NOT EXISTS`** — existing databases survive upgrades, tables are never dropped
2. **New columns added via `ALTER TABLE ADD COLUMN`** — an `ensureColumn()` helper (projection-store.js line 46) checks if a column exists before adding it. Called on every startup for evolving tables (`memory_current`, `memory_native_chunks`, `memory_entity_mentions`)
3. **Existing rows preserved** — new columns get `NULL` or `DEFAULT` values
4. **World model rebuilt if empty** — projection tables are re-materialized from events on startup if they're empty (index.ts lines 440–443)
5. **Legacy migration available** — `scripts/migrate-v3.js` handles v2→v3 config + DB migration with automatic backups, but this is for standalone installs (Codex CLI), not the plugin context

**What happens on GigaBrain version bump:** The DB file (`registry.sqlite`) lives in the workspace, not the plugin directory, so `plugin-install.ts` never touches it during upgrades. On first startup after upgrade, `register()` runs the `ensure*Store` functions which add any new columns/tables idempotently. Data is preserved. The risk is a future breaking schema change that GigaBrain's evolution pattern can't handle (e.g., dropping a table or changing a column type) — but as of v0.6.1, no such change has occurred and the pattern is designed to be additive-only.

---

## Config Schema

When memory is enabled, `~/.openclaw/openclaw.json` contains:

```json
{
  "plugins": {
    "slots": {
      "memory": "gigabrain"
    },
    "entries": {
      "gigabrain": {
        "config": {}
      }
    },
    "allow": ["acpx", "gigabrain"]
  }
}
```

When memory is disabled:

```json
{
  "plugins": {
    "slots": {},
    "entries": {
      "gigabrain": {
        "config": {}
      }
    },
    "allow": ["acpx"]
  }
}
```

Note: `entries.gigabrain` is preserved on disable so the user doesn't lose settings on re-enable.

---

## Capture Semantics

GigaBrain's default capture mode (`capture.requireMemoryNote: true`, config.js line 131) requires the LLM to emit explicit `<memory_note>` tags in its response. Without prompt instructions, the `agent_end` hook finds zero notes and effectively no-ops.

**Three capture paths that work without prompt changes:**

| Path | How it works | Source |
|------|-------------|--------|
| "Remember this" intent | User says "remember this: I prefer dark mode" — GigaBrain detects the phrase | capture-service.js line 122 |
| OpenClaw memory flush | Before context compaction, OpenClaw injects a system prompt asking for `<memory_note>` tags | Built into OpenClaw memory slot contract |
| Manual `<memory_note>` | User explicitly wraps text in tags | Passthrough |

**Full conversational capture** (agents proactively save useful facts) requires each agent's AGENTS.md to include instructions about `<memory_note>` tags. This is a prompt engineering task done incrementally per agent — **out of scope for the initial integration**.

**Rollout path:** Pick an agent, add `<memory_note>` instructions to its AGENTS.md, test capture, repeat. Can be done as a batch task or incrementally. The important thing is recall works day one — capture is additive and improves per agent as prompts are updated.

---

## Workspace File Reading API

Two read-only HTTP endpoints on the Host API (port 3210) provide backend support for a future memory browser UI. The renderer component is **not in scope** — only the endpoints are included.

Both endpoints live in `electron/api/routes/agents.ts`, inside `handleAgentRoutes()`.

### GET /api/agents/{id}/workspace/{filename}

Read a single `.md` file from an agent's workspace.

**Allowed files:**
- `MEMORY.md` — The agent's durable memories
- `memory/{filename}.md` — Daily session notes (e.g., `memory/2026-03-29.md`)

**Responses:**

| Status | Body |
|--------|------|
| 200 | `{ success: true, content: "...", path: "MEMORY.md" }` |
| 400 | `{ success: false, error: "Invalid file path" }` |
| 403 | `{ success: false, error: "Path not allowed" }` |
| 404 | `{ success: false, error: "File not found" }` |
| 500 | `{ success: false, error: "..." }` |

### GET /api/agents/{id}/workspace-list/memory

List daily note files in the agent's `memory/` subdirectory.

**Response:** `{ success: true, files: ["2026-03-29.md", "2026-03-28.md", ...] }`

Files are filtered to `.md` only, sorted reverse-chronologically.

**Workspace resolution:**
- `agentId === 'main'` → `~/.openclaw/workspace/`
- All others → `~/.openclaw/workspace-{agentId}/`

---

## Security Constraints

1. **Workspace endpoint restricts file access** — Only `MEMORY.md` and `memory/*.md` are exposed. Bootstrap/prompt files (SOUL.md, AGENTS.md, TOOLS.md, USER.md, IDENTITY.md) are never readable via this API.
2. **Path traversal blocked** — `..` in the requested path triggers an immediate 400. `realpath()` + `startsWith(workspaceDir)` prevents symlink escapes.
3. **Depth limit** — Daily notes require exactly `parts.length === 4` (agent ID + "workspace" + "memory" + filename), blocking deeper path injection.
4. **Config lock serialization** — All `openclaw.json` writes go through `withConfigLock()` to prevent concurrent write corruption from rapid toggle clicks or parallel config saves.
5. **Install-before-config guard** — `memory:enable` calls `ensureGigaBrainPluginInstalled()` synchronously before writing config, preventing a config that references a plugin that doesn't exist on disk yet.

---

## Known Issues & Edge Cases

1. **First enable creates DB on first turn, not on toggle** — When memory is enabled for the first time, `memory/registry.sqlite` doesn't exist yet. GigaBrain creates it automatically on the first `before_agent_start` hook. No migration needed.

2. **Recall works immediately; capture improves over time** — Without agent prompt updates, only "remember this" intent detection and OpenClaw's pre-compaction memory flush trigger capture. Full conversational capture requires per-agent AGENTS.md changes.

3. **Install race condition** — The fire-and-forget startup installer (`ensureAllBundledPluginsInstalled`) runs asynchronously at app launch. If the user opens Settings and toggles memory ON before it completes, the plugin files may not exist yet. Fix: `memory:enable` calls `ensureGigaBrainPluginInstalled()` before writing config. This is idempotent.

4. **MoonPay config handler strips unknown plugins** — The `moonpay:configure-mcp` handler at `ipc-handlers.ts` line 2195 filters `plugins.allow` against `KNOWN_BUNDLED_PLUGINS`. GigaBrain is in this set. If you add a new plugin, add it to this set too.

5. **GigaBrain ships raw TypeScript** — The plugin entry point is `index.ts`, not compiled JS. OpenClaw handles TypeScript compilation at load time. The after-pack cleanup strips `.d.ts` but preserves `.ts` files. Do NOT pre-compile it.

6. **Node >= 22 requirement** — GigaBrain uses `node:sqlite` (built-in). It runs in OpenClaw's Node.js runtime, not Electron's main process. OpenClaw >= 2026.2.15 bundles Node 22+.

---

## Locked Decisions (Do Not Change)

1. **Memory is opt-in, disabled by default.** Users must explicitly enable it in Settings. Do not auto-enable on upgrade.

2. **GigaBrain config is `{}`.** Do not hardcode GigaBrain defaults in `memory-config.ts`. GigaBrain's `normalizeConfig()` handles all defaults internally and they change across versions.

3. **`entries.gigabrain` is preserved on disable.** This prevents the user from losing custom config when they toggle memory off and on. Only the slot and allow entry are removed.

4. **Workspace endpoint only exposes memory files.** Do not add SOUL.md, AGENTS.md, or any bootstrap file to the allowed paths. Those files contain prompt instructions and should not be readable via the API.

5. **GigaBrain's `openclaw` peer dependency is optional.** It works without openclaw installed as a Node package. Do not add openclaw as a production dependency because of GigaBrain.

6. **The MIT LICENSE file must be included in the bundle.** GigaBrain is MIT licensed. The after-pack cleanup preserves LICENSE files by default (not in `REMOVE_FILE_NAMES`).

7. **Use `gatewayManager.debouncedReload()` directly.** `scheduleGatewayReload` is a local function in `agents.ts`, not available in `ipc-handlers.ts`. The `gatewayManager` is accessed from the `registerIpcHandlers` closure parameter.

---

## Follow-Up Items

These are not bugs or gaps in the current implementation. They are natural next steps that were intentionally deferred.

1. **Memory browser UI** — The two read-only endpoints (`GET /api/agents/{id}/workspace/...` and `GET /api/agents/{id}/workspace-list/memory`) are shipped. The renderer component is not. A view/edit/delete UI is important for user trust in an opt-in feature — users should be able to see what agents remember and correct or remove entries. This is purely a frontend task; the backend and security constraints are already in place.

2. **Capture prompt rollout** — Update per-agent AGENTS.md files with `<memory_note>` instructions so agents proactively capture useful facts from conversation. See [Capture Semantics](#capture-semantics) for the rollout path.

3. **LLM-powered recall tier** — FTS5 keyword matching is the default. GigaBrain supports configuring `llm.provider` for semantic recall and `llm.review.enabled` for dedup review. This would be a config change in `plugins.entries.gigabrain.config`, not a code change. Worth evaluating if users report recall misses.

4. **Cross-agent shared memory** — Not supported by GigaBrain today. Each agent has isolated storage. A shared "office knowledge base" that all agents can query would be a GigaBrain upstream feature request.

---

## File Reference

| File | Purpose |
|------|---------|
| `electron/utils/memory-config.ts` | **Config management.** `isMemoryEnabled()`, `enableMemory()`, `disableMemory()`. Reads/writes `~/.openclaw/openclaw.json` under `withConfigLock`. |
| `electron/utils/plugin-install.ts` | **Plugin installation.** `ensureGigaBrainPluginInstalled()` + `ALL_BUNDLED_PLUGINS` entry + `PLUGIN_NPM_NAMES` mapping. |
| `electron/main/ipc-handlers.ts` | **IPC handlers.** `memory:status`, `memory:enable`, `memory:disable` handlers + `KNOWN_BUNDLED_PLUGINS` set. |
| `electron/preload/index.ts` | **IPC whitelist.** Three `memory:*` channels in `validChannels`. |
| `electron/api/routes/agents.ts` | **Workspace API.** GET endpoints for reading MEMORY.md, daily notes, and listing memory files. |
| `src/pages/LobbySettings.tsx` | **Settings UI.** "Agent Memory" section with enable toggle, confirm dialog, and optimistic state. |
| `scripts/after-pack.cjs` | **Build bundling.** GigaBrain in `BUNDLED_PLUGINS` array — copies plugin + deps to packaged app resources. |
| `scripts/bundle-openclaw-plugins.mjs` | **Dev bundling.** GigaBrain in `PLUGINS` array — creates `build/openclaw-plugins/gigabrain/` for dev mode. |
| `package.json` | **Dependency.** `@legendaryvibecoder/gigabrain: ^0.6.1` in devDependencies. |
| `electron/utils/config-mutex.ts` | **Config lock.** `withConfigLock()` used by memory-config.ts. Not modified — reference only. |
| `docs/build-plans/gigabrain-memory-integration.md` | **Build plan.** The verified implementation plan this architecture was built from. |
