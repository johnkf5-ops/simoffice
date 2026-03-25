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
3. Rooms — list of rooms with agent count + delete (X) button
4. "+ Create Room" — modal to select 2+ agents for custom room
5. Online Agents — list of all agents with status dots, click for DM
6. Conversations — session list with agent display names + delete (X) button
7. Status Footer — online/offline + LLM provider label

**Props:**
- `hideBackButton` — hides back link on main Lobby (shows nothing instead)
- `currentPage` — used to compute `isOnChat` for navigation decisions

**Key handlers:**
- `handleAgentClick(agentId)` — finds agent's `mainSessionKey`, calls `switchSession()`, sets `activeRoom(null)`, navigates to /chat
- `handleRoomClick(roomId)` — calls `setActiveRoom(roomId)`, navigates to /chat

### LobbyChat (`src/pages/LobbyChat.tsx`)

**Main chat page.** Layout depends on mode:
- **DM mode** (no active room): 2 columns — BuddyPanel | ChatFeed
- **Room mode** (active room): 3 columns — BuddyPanel | ChatFeed | WhosHerePanel

**Key state:**
- `activeRoom` — computed reactively from `activeRoomId` + `rooms` (NOT from `getActiveRoom()` function — that caused a stale state bug)
- `isRoomMode` — `!!activeRoom`
- `teamMode` — from rooms store, toggles team vs @mention behavior

**Room auto-creation:** A `useEffect` on `[agents]` creates rooms from career templates when agents match. Uses `getState()` inside the effect to avoid infinite loops (rooms is NOT in the dependency array).

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

### 3. User Sends Message in @mention Mode

```
handleSend()
  → teamMode is OFF
  → Parse @mention from input (optional)
  → resolvedTarget = mentioned agent || targetAgentId || room.agentIds[0]
  → sendMessage(text, undefined, resolvedTarget)
      → Chat store switches to agent's session
      → Gateway RPC: chat.send
      → Streaming events → messages update
      → MessageBubble renders
```

### 4. User Clicks Agent for DM

```
handleAgentClick(agentId)
  → switchSession(agent.mainSessionKey)    // chat store
  → setActiveRoom(null)                     // rooms store: exits room mode
  → navigate('/chat')
  → LobbyChat renders 2-column DM layout
```

---

## Team Mode vs Legacy Meetings

| Aspect | Team Mode (current) | Legacy Meeting |
|--------|-------------------|----------------|
| Trigger | 👥 toggle button | Was one-shot meeting button |
| Flow | Multi-round, human-gated | Single question, one round |
| Display | Normal MessageBubbles | Collapsed MeetingBlock card |
| Storage | `teamMessages[]` in rooms store | `meetings[]` in rooms store |
| Function | `runTeamRound()` | `runMeeting()` |
| Both in | `src/lib/meeting-sequencer.ts` | Same file |

Legacy meetings still render in the feed if they exist in history.

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

Rooms are created two ways:

### 1. Auto-creation from Career Templates (on LobbyChat mount)

```
useEffect on [agents]:
  For each CareerTemplate with 2+ recommended agents:
    Skip if room for this careerId already exists
    Match template agent IDs to actual agents by normalized name
    If 2+ agents match:
      createRoomFromCareer(career)
      updateRoomAgentIds(room.id, actualAgentIds)  // template IDs → real IDs

  Fallback: if 2+ agents but no rooms, create #general room
```

**Important:** This effect reads `rooms` via `getState()` inside the effect, NOT as a dependency. Adding `rooms` to deps caused an infinite loop (creating a room changed rooms, re-triggered effect).

### 2. Manual Creation via BuddyPanel

User clicks "+ Create Room" → selects 2+ agents → `createCustomRoom(name, icon, agentIds)`.

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
| `electron/utils/agent-config.ts` | Backend agent CRUD, session key building |

---

## Common Bugs & How They Were Fixed

### 1. WHO'S HERE shows wrong agents for room
**Cause:** `activeRoom` was computed from `getActiveRoom()` which wasn't reactive to store changes.
**Fix:** Compute `activeRoom` from `activeRoomId` + `rooms` subscriptions directly.

### 2. All rooms show same agents
**Cause:** Room `agentIds` were template IDs (e.g., "language-tutor") not actual agent IDs. Patches weren't persisted.
**Fix:** Added `updateRoomAgentIds()` store action that properly persists.

### 3. Room auto-creation infinite loop
**Cause:** `rooms` was in the useEffect dependency array. Creating a room changed rooms, re-triggered effect.
**Fix:** Read rooms via `getState()` inside effect. Only depend on `[agents]`.

### 4. Default "Main Agent" created automatically
**Cause:** Backend `normalizeAgentsConfig()` created an implicit main agent when config was empty.
**Fix:** Removed implicit creation. Users choose agents during onboarding.

### 5. Conversation labels show raw session keys
**Cause:** Label fallback was `s.displayName || 'Conversation'`, not agent name.
**Fix:** Extract agent ID from session key, look up agent name from store.

### 6. Empty agentId breaks session keys
**Cause:** Changing `defaultAgentId` from `'main'` to `''` caused `agent::main` session keys.
**Fix:** `normalizeAgentId()` falls back to first available agent from store.

---

## Architecture Rules

1. **Rooms are frontend-only.** No backend concept of rooms. Don't touch Gateway or backend for room features.
2. **Each agent has its own Gateway session.** There is no shared "room session." Room is just a UI grouping.
3. **Team mode bypasses the chat store.** Uses direct Gateway RPC via `runTeamRound()`. Team messages live in rooms store.
4. **Never put `rooms` in a useEffect dependency array** if the effect creates rooms. Use `getState()` inside.
5. **Always compute `activeRoom` reactively** from `activeRoomId` + `rooms` subscriptions. Never use `getActiveRoom()` — it's not reactive.
6. **Agent IDs in rooms must be actual IDs** from the agents store, not template IDs from career templates. Always map template → actual after room creation.
