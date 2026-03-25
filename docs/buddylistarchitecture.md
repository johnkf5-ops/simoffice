# Buddy List, Chat, Rooms & Team Mode Architecture

> Comprehensive reference for how the sidebar, chat system, group rooms, and team meetings work in SimOffice. Read this before touching any of these systems.

---

## Overview

The buddy list (BuddyPanel) is the shared left sidebar across all 7 Lobby pages. It provides navigation between rooms, agents, and conversations. The chat system supports two interaction patterns: **1:1 DM** with a single agent, and **Room mode** where multiple agents collaborate.

---

## Stores (State Management)

Three Zustand stores power everything. They are independent — rooms and chat don't directly sync.

### useRoomsStore (`src/stores/rooms.ts`)

**Persisted to localStorage** as `simoffice:rooms`.

| State | Type | Purpose |
|-------|------|---------|
| `rooms` | `RoomDefinition[]` | All rooms (id, name, icon, careerId, agentIds) |
| `activeRoomId` | `string \| null` | Currently viewed room (null = DM mode) |
| `targetAgentId` | `string \| null` | Which agent is @mentioned in room |
| `teamMode` | `boolean` | Team mode toggle (all agents respond vs single) |
| `teamMessages` | `TeamMessage[]` | Local message log for team mode conversations |
| `teamRoundInProgress` | `boolean` | True while sequencer is running |
| `currentRoundAgentIndex` | `number` | Which agent index is currently responding |
| `currentRoundAgentId` | `string \| null` | ID of agent currently responding |
| `meetingInProgress` | `MeetingRound \| null` | Legacy one-shot meeting |
| `meetings` | `MeetingRound[]` | Completed legacy meetings |

**Key actions:**
- `setActiveRoom(roomId)` — switches room, clears target, resets mode
- `setTeamMode(on)` — toggles team mode
- `addTeamMessage(msg)` — pushes a user or agent message to team feed
- `setTeamRoundStatus(inProgress, agentIndex, agentId)` — tracks typing state
- `createRoomFromCareer(career)` — creates room from career template
- `createCustomRoom(name, icon, agentIds)` — manual room creation
- `deleteRoom(roomId)` — removes room
- `updateRoomAgentIds(roomId, agentIds)` — updates room membership (used after template ID → real ID mapping)

### useAgentsStore (`src/stores/agents.ts`)

**Fetched from backend** via `GET /api/agents`.

| State | Type | Purpose |
|-------|------|---------|
| `agents` | `AgentSummary[]` | Agent list with id, name, mainSessionKey, modelDisplay |
| `defaultAgentId` | `string` | Default agent (falls back to first in list) |

**Key fields on AgentSummary:**
- `id` — unique agent ID (e.g., `"language-tutor"`)
- `name` — display name (e.g., `"Language Tutor"`)
- `mainSessionKey` — canonical session key (e.g., `"agent:language-tutor:main"`)
- `modelDisplay` — LLM model label

### useAgentCustomizationStore (`src/stores/agent-customization.ts`)

**Persisted to localStorage** as `simoffice:agent-customization`.

Frontend-only store for per-agent visual overrides (no backend needed).

| State | Type | Purpose |
|-------|------|---------|
| `customizations` | `Record<string, AgentCustomization>` | Keyed by agent ID |

**AgentCustomization fields:**
- `avatarUrl?` — data URL from uploaded image
- `color?` — hex color for the circle (default: `#7c3aed`)

**Actions:**
- `setCustomization(agentId, { avatarUrl?, color? })` — merge partial update

**Used by:** `AgentAvatar` component, `LobbyAssistants` edit form.

### useChatStore (`src/stores/chat.ts` + `src/stores/chat/`)

**NOT persisted** — fetched from Gateway on demand.

| State | Type | Purpose |
|-------|------|---------|
| `messages` | `RawMessage[]` | Messages for current session |
| `currentSessionKey` | `string` | Active session (e.g., `"agent:alice:main"`) |
| `currentAgentId` | `string` | Extracted from session key |
| `sessions` | `ChatSession[]` | All sessions from Gateway |
| `sessionLabels` | `Record<string, string>` | Custom display labels |
| `sending` | `boolean` | True during message send |
| `streamingText` | `string` | Live streaming response text |

**Key actions:**
- `sendMessage(text, attachments?, targetAgentId?)` — sends message, switches session if needed
- `switchSession(key)` — switches to different agent session, loads history
- `newSession()` — creates new session for current agent
- `deleteSession(key)` — soft-deletes session
- `loadHistory()` — fetches messages from Gateway

---

## Components

### BuddyPanel (`src/components/common/BuddyPanel.tsx`)

**Shared sidebar on ALL Lobby pages.** 200px wide, dark gradient background.

**Sections (top to bottom):**
1. Header — "← Lobby" back link (hidden on main Lobby page)
2. "+ New Chat" button — clears room, creates new session, navigates to /chat
3. Rooms — list of rooms with agent count + delete (X) + double-click to rename
4. "+ Create Room" — modal to select 2+ agents for custom room
5. Online Agents — list of all agents with custom avatars, status dots, click for DM
6. Conversations — session list with agent display names + delete (X) + double-click to rename
7. Status Footer — online/offline + LLM provider label

**Props:**
- `hideBackButton` — hides back link on main Lobby (shows nothing instead)
- `currentPage` — used to compute `isOnChat` for navigation decisions

**Key handlers:**
- `handleAgentClick(agentId)` — finds agent's `mainSessionKey`, calls `switchSession()`, sets `activeRoom(null)`, navigates to /chat
- `handleRoomClick(roomId)` — calls `setActiveRoom(roomId)`, navigates to /chat
- **Double-click room** → inline rename (calls `renameRoom()`)
- **Double-click conversation** → inline rename (updates `sessionLabels`)

### AgentAvatar (`src/components/common/AgentAvatar.tsx`)

Reusable component rendering an agent's avatar. Uses `useAgentCustomizationStore` to check for custom image or color.

- If `avatarUrl` is set → renders `<img>` (circular, cropped)
- If `color` is set → renders colored circle with initial letter
- Default → purple gradient circle with initial letter

**Used everywhere:** BuddyPanel, LobbyChat (message bubbles, header, typing indicator), WhosHerePanel, AgentSelector, LobbyAssistants.

### LobbyAssistants — Agent Edit Form (`src/pages/LobbyAssistants.tsx`)

Each agent card has an **Edit** button that opens an inline form with:
- **Name** — text input, saves to backend via `updateAgent()`
- **Color** — 10-color swatch palette, saves to `agent-customization` store
- **Avatar** — file upload, stored as data URL in `agent-customization` store
- **Remove avatar** — clears the custom image

### LobbyChat (`src/pages/LobbyChat.tsx`)

**Main chat page.** Layout depends on mode:
- **DM mode** (no active room): 2 columns — BuddyPanel | ChatFeed
- **Room mode** (active room): 3 columns — BuddyPanel | ChatFeed | WhosHerePanel

**Key state:**
- `activeRoom` — computed reactively from `activeRoomId` + `rooms` (NOT from `getActiveRoom()` function — that caused a stale state bug)
- `isRoomMode` — `!!activeRoom`
- `teamMode` — from rooms store, toggles team vs @mention behavior

**Room auto-creation:** Removed. Users create rooms manually via "+ Create Room". Auto-creation from career templates was removed because it created unwanted rooms whenever agents matched template names.

### WhosHerePanel (`src/components/chat/WhosHerePanel.tsx`)

Right sidebar in room mode. Shows agents in the current room. Click an agent to target them for @mention. Gets `room` as a prop — filters `agents` by `room.agentIds`.

### AgentSelector (`src/components/chat/AgentSelector.tsx`)

Dropdown in message input bar (room mode only, hidden in team mode). Shows "@everyone" or selected agent. Click to open dropdown, pick agent to target.

---

## Data Flow: Key Operations

### 1. User Clicks Room in BuddyPanel

```
handleRoomClick(roomId)
  → setActiveRoom(roomId)          // rooms store: activeRoomId = roomId, targetAgentId = null
  → navigate('/chat')              // if not already on chat page
  → LobbyChat re-renders
  → activeRoom = rooms.find(r => r.id === activeRoomId)  // reactive lookup
  → isRoomMode = true
  → Renders 3-column layout with WhosHerePanel
```

### 2. User Sends Message in Team Mode

```
handleSend()
  → teamMode is ON + isRoomMode
  → addTeamMessage({ role: 'user', text, roomId, roundId })
  → setTeamRoundStatus(true, 0, firstAgentId)
  → runTeamRound(roomId, text, agentIds, onAgentResponse, onProgress)
      For each agent (sequential):
        → onProgress(i, agentId)              // UI shows "Agent X is thinking..."
        → Gateway RPC: chat.send (deliver: false)
        → Poll chat.history for response (2s interval, 90s timeout)
        → onAgentResponse(agentId, name, text) // adds TeamMessage to store
        → MessageBubble renders with agent avatar + name
      Done:
  → setTeamRoundStatus(false)
  → User can send next message (next round)
```

### 3. User Sends Message in @Mention Mode (in a Room)

```
handleSend()
  → teamMode is OFF + isRoomMode
  → Parse @mention from input (optional)
  → resolvedTarget = mentioned agent || targetAgentId || room.agentIds[0]
  → addTeamMessage({ role: 'user', text, roomId, roundId })  // SAME feed as team mode
  → runTeamRound(roomId, text, [resolvedTarget], ...)         // just 1 agent
      → Agent responds via Gateway RPC
      → addTeamMessage({ role: 'assistant', agentId, agentName, text })
  → MessageBubble renders in the SAME feed as team messages
```

**Critical:** @mention mode uses the SAME `teamMessages` feed as team mode. The user never sees a different screen. The only difference is how many agents respond (1 vs all).

### 4. User Clicks Agent for DM

```
handleAgentClick(agentId)
  → switchSession(agent.mainSessionKey)    // chat store
  → setActiveRoom(null)                     // rooms store: exits room mode
  → navigate('/chat')
  → LobbyChat renders 2-column DM layout
```

---

## Room Chat Modes

Rooms have TWO send modes, controlled by "Team" and "@Mention" buttons in the input bar. **Both modes write to the same `teamMessages` feed** — the user always sees one unified conversation.

| Aspect | Team Mode | @Mention Mode |
|--------|-----------|---------------|
| Button | "Team" (yellow when active) | "@Mention" (blue when active) |
| Who responds | ALL agents in room, sequentially | ONE agent you pick from dropdown |
| Feed | `teamMessages[]` | `teamMessages[]` (same!) |
| Context | Each agent sees prior agents' answers | Single agent gets your message directly |
| Use case | Group discussion, brainstorming | Follow-up with specific agent |

### Legacy Meetings

The old `runMeeting()` + `MeetingBlock` system still exists for backward compatibility. Legacy meetings render as collapsible cards if they exist in history. New rooms use `runTeamRound()` exclusively.

---

## Anti-Loop Safety

This is critical. Without these guardrails, agents will loop infinitely (experienced on Discord).

1. **Human-gated** — Agents NEVER fire unless the human sends a message. No agent can trigger another.
2. **Fixed turn order** — `room.agentIds` defines order. Each agent goes exactly once per round.
3. **Context injection, not conversation** — Prior responses are passed as `[TEAM MEETING]\nWhat your teammates said:` prompt blocks. Agents don't see each other's messages as conversation history they should reply to.
4. **deliver: false** — Gateway does NOT broadcast agent responses as chat events. The chat store's event handler never sees them.
5. **Abort check** — Between each agent, the sequencer checks `teamRoundInProgress`. User can stop mid-round.

---

## Room Creation

Rooms are created **manually only** via BuddyPanel:

User clicks "+ Create Room" → selects 2+ agents → `createCustomRoom(name, icon, agentIds)`.

Auto-creation from career templates was removed — it created unwanted rooms whenever agents matched template names. Rooms during onboarding are created by the onboarding flow explicitly.

---

## Session Key Format

```
agent:{agentId}:{sessionSuffix}

Examples:
  agent:language-tutor:main          (canonical/default session)
  agent:language-tutor:session-12345 (additional conversation)
```

The `mainSessionKey` on each `AgentSummary` is the canonical session. New conversations get timestamp-based suffixes.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/components/common/BuddyPanel.tsx` | Shared sidebar (rooms, agents, conversations, delete buttons) |
| `src/pages/LobbyChat.tsx` | Chat page (message rendering, send handlers, team mode) |
| `src/stores/rooms.ts` | Room definitions, team mode state, team messages |
| `src/stores/agents.ts` | Agent list from backend |
| `src/stores/chat/runtime-send-actions.ts` | Message send logic, session switching |
| `src/stores/chat/session-actions.ts` | Session management (load, switch, delete) |
| `src/stores/chat/helpers.ts` | Shared helpers (getAgentIdFromSessionKey, etc.) |
| `src/stores/chat/internal.ts` | Initial chat state |
| `src/stores/chat/types.ts` | Type definitions, DEFAULT_SESSION_KEY constants |
| `src/lib/meeting-sequencer.ts` | runTeamRound() + runMeeting() — Gateway RPC sequencer |
| `src/components/chat/WhosHerePanel.tsx` | Right panel showing room agents |
| `src/components/chat/AgentSelector.tsx` | @mention dropdown in input bar |
| `src/components/common/AgentAvatar.tsx` | Reusable avatar (custom image/color/initial) |
| `src/stores/agent-customization.ts` | Per-agent avatar + color overrides (localStorage) |
| `electron/utils/agent-config.ts` | Backend agent CRUD, session key building |

---

## Common Bugs & How They Were Fixed

### 1. WHO'S HERE shows wrong agents for room
**Cause:** `activeRoom` was computed from `getActiveRoom()` which wasn't reactive to store changes.
**Fix:** Compute `activeRoom` from `activeRoomId` + `rooms` subscriptions directly.

### 2. All rooms show same agents
**Cause:** Room `agentIds` were template IDs (e.g., "language-tutor") not actual agent IDs. Patches weren't persisted.
**Fix:** Added `updateRoomAgentIds()` store action that properly persists.

### 3. Room auto-creation infinite loop / unwanted rooms
**Cause:** `rooms` was in the useEffect dependency array. Also, auto-creation matched agents to career templates and created rooms the user didn't ask for.
**Fix:** Removed auto-creation entirely. Users create rooms manually via "+ Create Room".

### 4. Default "Main Agent" created automatically
**Cause:** Backend `normalizeAgentsConfig()` created an implicit main agent when config was empty.
**Fix:** Removed implicit creation. Users choose agents during onboarding.

### 5. Conversation labels show raw session keys
**Cause:** Label fallback was `s.displayName || 'Conversation'`, not agent name.
**Fix:** Extract agent ID from session key, look up agent name from store.

### 6. Empty agentId breaks session keys
**Cause:** Changing `defaultAgentId` from `'main'` to `''` caused `agent::main` session keys.
**Fix:** `normalizeAgentId()` falls back to first available agent from store.

### 7. Team meeting prompts visible in DM view
**Cause:** `runTeamRound()` sends `[TEAM MEETING]` prefixed prompts to each agent's Gateway session. When user opens that agent's DM, those prompts appear as user messages.
**Fix:** `dedupeMessages()` filters out any user message starting with `[TEAM MEETING]`.

### 8. @Mention mode showed different screen than Team mode
**Cause:** Switching from Team to @Mention toggled `showTeamFeed`, which fell back to showing the chat store's DM history instead of the room's team messages.
**Fix:** Room mode ALWAYS shows `teamMessages` feed. @Mention mode now also writes to `teamMessages` — it sends to 1 agent via `runTeamRound([targetId])` instead of all agents. Same feed, same view, just fewer respondents.

### 9. Duplicate assistant messages on first send
**Cause:** Streaming response + history poll both add the same message. Text-based dedup was removed (needed for room mode), so duplicates appeared.
**Fix:** Re-added dedup for **consecutive** identical assistant messages only. Different agents giving the same answer in a room won't be affected.

### 10. Only 1 of N agents responded in team mode
**Cause:** The prompt told agents to respond with "pass" if the topic wasn't relevant. Some agents did.
**Fix:** Removed "pass" instruction. All agents respond. Timeout shows "(no response — timed out)".

---

## Architecture Rules

1. **Rooms are frontend-only.** No backend concept of rooms. Don't touch Gateway or backend for room features.
2. **Each agent has its own Gateway session.** There is no shared "room session." Room is just a UI grouping.
3. **ALL room messages go through `teamMessages` in the rooms store.** Both Team and @Mention modes write to the same feed. The chat store's `messages` are ONLY for DM mode (no active room).
4. **Room mode bypasses the chat store.** Uses direct Gateway RPC via `runTeamRound()`. Never call `sendMessage()` from the chat store when in a room.
5. **Never auto-create rooms.** Users create rooms manually. Auto-creation caused unwanted rooms and infinite loops.
6. **Always compute `activeRoom` reactively** from `activeRoomId` + `rooms` subscriptions. Never use `getActiveRoom()` — it's not reactive.
7. **Filter `[TEAM MEETING]` prompts from DM view.** The sequencer injects these into agent sessions. They should never be visible to the user.
8. **Agent IDs in rooms must be actual IDs** from the agents store, not template IDs from career templates.
9. **All colors must use CSS variables** (`hsl(var(--foreground))`, `hsl(var(--card))`, etc.) — never hardcode `white`, `#fff`, or `rgba(255,255,255,...)`. The app supports light/dark mode via `.dark` class on `<html>`.
10. **Default theme is `light`.** Persisted in settings store. User can switch in Settings page. Splash screen loads `splash-loading-light.png` or `splash-loading-dark.png` based on theme.

---

## Theming

### How It Works
- CSS variables in `src/styles/globals.css`: `:root` = light mode, `.dark` = dark mode
- `App.tsx` adds `.dark` or `.light` class to `<html>` based on `useSettingsStore.theme`
- Settings store persists theme to localStorage (`clawx-settings`)
- Default: `'light'`

### Key Variables
| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--background` | `#f0f0f5` | `#121318` | Page backgrounds |
| `--card` | `#ffffff` | `#1c1d25` | Cards, panels, toolbar, buddy list |
| `--foreground` | `#222230` | `#e0e4ed` | Primary text |
| `--muted-foreground` | medium gray | `#737580` | Secondary/subdued text |
| `--border` | `#d4d4de` | `#292940` | Borders, dividers |
| `--primary` | `#7c3aed` | `#7c3aed` | Purple accent (same both modes) |

### Rules
- **Never hardcode colors** in components. Use `hsl(var(--foreground))`, `hsl(var(--card))`, etc.
- Toolbar uses `hsl(var(--card))` for background — adapts automatically
- BuddyPanel uses `hsl(var(--card))` for background — adapts automatically
- Splash screen: `isDark ? 'url(/splash-loading-dark.png)' : 'url(/splash-loading-light.png)'`
- Toolbar icons use CSS `filter: brightness()` — works in both modes

### Files
| File | What |
|------|------|
| `src/styles/globals.css` | CSS variables for both themes |
| `src/App.tsx` | Applies `.dark`/`.light` class based on settings |
| `src/stores/settings.ts` | `theme` field, default `'light'`, persisted |
| `public/splash-loading-light.png` | Light mode splash |
| `public/splash-loading-dark.png` | Dark mode splash |
| `public/moonpay-logo.png` | MoonPay logo (black text, light mode) |
| `public/moonpay-logo-white.png` | MoonPay logo (white text, dark mode) |

---

## Trading Desk (`/trading`)

Separate page — NOT part of the chat system. A MoonPay-branded chat where the user talks naturally and the LLM uses MoonPay CLI to execute trades.

**Key points:**
- **No SimOffice agents** — zero trade liability. MoonPay handles execution.
- Sends to `agent:moonpay-trader:main` session via Gateway RPC
- Polls `chat.history` for responses (same pattern as meeting sequencer)
- Suggestion chips pre-fill common prompts for non-technical users
- Right sidebar: capabilities, 13 supported chains, disclaimer
- Theme-aware MoonPay logos (`moonpay-logo.png` / `moonpay-logo-white.png`)

**File:** `src/pages/TradingPage.tsx`

---

## Lobby / Home Page (`/`)

3D office hero section (60vh) with scrollable content below:

1. **Hero** — `OfficeAdapter` rendering the retro 3D office with agents at desks
2. **Agent count** — "X agents online · Your office is running"
3. **Quick Actions** — 4 cards: Trading Desk, Chat, Manage Team, Connect Apps
4. **What's New** — Featured card (MoonPay Trading) + 2-column grid of v2.0 and v1.2 features

**File:** `src/pages/Lobby.tsx`
