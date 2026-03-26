# Chat Store Rewrite Plan

> Replace the 2078-line ClawX monolith (`src/stores/chat.ts`) with a clean ~400-line store that eliminates the duplicate message bug.

## Root Cause

The current store has two competing systems that both add messages to the `messages[]` array:
1. **Streaming events** (`handleChatEvent` → final) adds the response immediately
2. **History polling** (`loadHistory`) replaces the array with Gateway history

These race each other, causing the same message to appear twice. This is OpenClaw Issue #5964, fixed in their codebase but never backported to ClawX.

## The Fix

**Messages ONLY come from `loadHistory()`.** Events never touch `messages[]`. Single source of truth, no race, no duplicates.

---

## Public API (Identical — No Component Changes)

### State Fields (must keep)

| Field | Type | Used By |
|-------|------|---------|
| `messages` | `RawMessage[]` | LobbyChat, OfficeAdapter |
| `sending` | `boolean` | LobbyChat, OfficeAdapter, gateway.ts |
| `currentSessionKey` | `string` | BuddyPanel, Sidebar, OfficeAdapter, gateway.ts |
| `currentAgentId` | `string` | LobbyChat, BuddyPanel, OfficeAdapter |
| `sessions` | `ChatSession[]` | BuddyPanel, Sidebar, gateway.ts |
| `sessionLabels` | `Record<string, string>` | BuddyPanel, Sidebar (BuddyPanel uses setState directly) |
| `sessionLastActivity` | `Record<string, number>` | Sidebar |
| `activeRunId` | `string \| null` | gateway.ts |
| `streamingText` | `string` | OfficeAdapter (typing animation) |
| `streamingMessage` | `unknown \| null` | OfficeAdapter |
| `error` | `string \| null` | Keep for safety |
| `loading` | `boolean` | Keep for safety |
| `pendingFinal` | `boolean` | gateway.ts sets this directly via setState |
| `lastUserMessageAt` | `number \| null` | gateway.ts sets this directly via setState |

### Actions (must keep)

| Action | Used By |
|--------|---------|
| `sendMessage(text, attachments?, targetAgentId?)` | LobbyChat |
| `abortRun()` | LobbyChat |
| `loadHistory(quiet?)` | Sidebar, gateway.ts |
| `loadSessions()` | Sidebar, gateway.ts |
| `switchSession(key)` | BuddyPanel, Sidebar |
| `newSession()` | BuddyPanel, Sidebar, LobbyAssistants |
| `deleteSession(key)` | BuddyPanel, Sidebar |
| `handleChatEvent(event)` | gateway.ts (MUST exist — gateway calls it) |
| `clearError()` | Keep for safety |

### Exported Types (must keep)

```typescript
export interface RawMessage { ... }
export interface ContentBlock { ... }
export interface AttachedFileMeta { ... }
export interface ChatSession { ... }
export interface ToolStatus { ... }
```

### Can Drop

- `toggleThinking()`, `refresh()`, `cleanupEmptySession()` — never called
- `showThinking`, `thinkingLevel` — never read
- `pendingToolImages` — internal streaming complexity
- The entire event dedup system (1500+ lines)
- The snapshot mechanism
- The error recovery timer system
- The image cache/enrichment system (use simpler approach)

---

## New Architecture

### Send Flow

```
User clicks Send
  │
  ├─ 1. Guard: if sending, return (prevent double-send)
  ├─ 2. Add optimistic user message to messages[]
  ├─ 3. Set sending = true
  ├─ 4. Call gateway.rpc('chat.send') or IPC 'chat:sendWithMedia'
  │     → Returns { runId }
  ├─ 5. Set activeRunId = runId
  ├─ 6. Start polling: call loadHistory(true) every 2 seconds
  │     → Each poll fetches chat.history from Gateway
  │     → Replaces messages[] with authoritative history
  │     → Check: if new assistant message exists after our send timestamp
  │       → Yes: set sending = false, stop polling
  │       → No: keep polling (up to 90s timeout)
  └─ 7. On timeout: set error, sending = false
```

### Event Flow (Simplified)

```
Gateway sends event via gateway.ts → handleChatEvent(event)
  │
  ├─ state === 'delta'
  │   └─ Update streamingText (for OfficeAdapter typing animation)
  │      DO NOT touch messages[]
  │
  ├─ state === 'final'
  │   └─ Clear streamingText, streamingMessage
  │      Trigger loadHistory(true) to get the final message
  │      DO NOT touch messages[]
  │
  ├─ state === 'error'
  │   └─ Set error message
  │      Set sending = false
  │
  └─ state === 'started'
      └─ Set sending = true if not already
         Set activeRunId
```

### History Flow

```
loadHistory(quiet?)
  │
  ├─ 1. Coalesce: if already loading for this session, await existing promise
  ├─ 2. Throttle: skip if loaded within last 800ms (quiet mode)
  ├─ 3. RPC: gateway.rpc('chat.history', { sessionKey, limit: 200 })
  ├─ 4. Filter: remove toolresult messages
  ├─ 5. Preserve optimistic user message if sending && not in history yet
  ├─ 6. Set messages = filteredHistory (REPLACE, not merge)
  ├─ 7. Update sessionLabels from first user message
  └─ 8. Update sessionLastActivity from last message timestamp
```

### Session Flow

```
switchSession(key)
  ├─ Set currentSessionKey = key
  ├─ Set currentAgentId = extracted from key
  ├─ Clear messages, streamingText, streamingMessage, error
  └─ Call loadHistory()

newSession()
  ├─ Generate key: agent:{agentId}:session-{timestamp}
  ├─ Add to sessions[]
  └─ switchSession(newKey)

deleteSession(key)
  ├─ RPC: gateway.rpc('sessions.delete', { sessionKey })
  ├─ Remove from sessions[]
  ├─ Remove from sessionLabels, sessionLastActivity
  └─ If current session deleted, switch to first available
```

---

## File Changes

### Rewrite: `src/stores/chat.ts`
- ~400 lines (down from 2078)
- Same export name: `useChatStore`
- Same exported types
- New implementation

### Keep: `src/stores/chat/helpers.ts`
- Has `getAgentIdFromSessionKey()` imported by BuddyPanel and Sidebar
- Has utility functions used by message-utils.ts
- NO changes needed

### Keep: `src/stores/chat/cron-session-utils.ts`
- Has `isCronSessionKey()` and `buildCronSessionHistoryPath()`
- Imported by the monolith
- NO changes — import in new store

### No changes to:
- `src/stores/gateway.ts` — still calls `handleChatEvent()`
- `src/pages/LobbyChat.tsx` — same API
- `src/components/common/BuddyPanel.tsx` — same API + setState
- `src/components/layout/Sidebar.tsx` — same API
- `src/components/lobby/OfficeAdapter.tsx` — same API
- `src/pages/LobbyAssistants.tsx` — same API
- `src/lib/message-utils.ts` — type imports only
- `src/lib/meeting-sequencer.ts` — type imports only

### Delete (after rewrite works):
- `src/stores/chat/runtime-send-actions.ts`
- `src/stores/chat/runtime-event-handlers.ts`
- `src/stores/chat/runtime-event-actions.ts`
- `src/stores/chat/runtime-ui-actions.ts`
- `src/stores/chat/session-actions.ts`
- `src/stores/chat/session-history-actions.ts`
- `src/stores/chat/history-actions.ts`
- `src/stores/chat/internal.ts`
- `src/stores/chat/store-api.ts`
- `src/stores/chat/types.ts`

(Keep `helpers.ts` and `cron-session-utils.ts`)

---

## Things to Handle Carefully

### 1. File Attachments (`sendWithMedia`)
- Uses IPC channel `chat:sendWithMedia` instead of Gateway RPC
- Must detect when attachments are present and use the right path
- Image previews: cache stagedPath → preview mapping for display

### 2. Session Label Auto-Generation
- First user message text becomes session label
- BuddyPanel reads `sessionLabels[key]`
- Generate on send, not on history load

### 3. Gateway.ts Phase Events
- `gateway.ts` lines 134-182: On agent "completed/done" phase, it directly calls `useChatStore.setState()` to update `sending`, `activeRunId`, etc.
- New store must handle this gracefully — the fields must exist

### 4. OfficeAdapter Animation
- Reads `sending`, `currentAgentId`, `messages`, `streamingMessage`
- `streamingMessage` drives the "agent is working" animation
- Keep `streamingMessage` updating from delta events

### 5. BuddyPanel Direct setState
- Lines 299, 301: `useChatStore.setState((st) => ({ sessionLabels: {...} }))`
- Zustand supports this natively — just make sure `sessionLabels` is in the state

### 6. Optimistic User Message
- Must show user's message immediately (before Gateway confirms)
- `loadHistory` must preserve it if Gateway hasn't processed it yet
- Match by timestamp: if sending && no user message within 5s of lastUserMessageAt in history, keep the optimistic one

### 7. Extract Text Helper
- `message-utils.ts` has `extractText(msg)` that handles string content and ContentBlock arrays
- Keep using this for text extraction

---

## Testing Checklist

After rewrite:
- [ ] Send message in DM → one response, no duplicate
- [ ] Send message with file attachment → file sent, response received
- [ ] Switch sessions → history loads correctly
- [ ] Create new session → appears in sidebar
- [ ] Delete session → removed from sidebar
- [ ] Rename conversation (double-click in BuddyPanel) → label persists
- [ ] Team mode still works (uses rooms store, not chat store)
- [ ] @Mention mode still works
- [ ] Trading Desk still works (bypasses chat store)
- [ ] Office 3D animations still respond to chat activity
- [ ] Abort run → stops response
- [ ] Session labels show agent name, not raw key
- [ ] Multiple rapid sends → only one response per send
- [ ] Reload app → history loads from Gateway
- [ ] Navigate away and back → messages persist

---

## Rollback Plan

If the rewrite breaks something critical:
1. The old `chat.ts` is in git history
2. `git checkout HEAD~1 -- src/stores/chat.ts` restores it instantly
3. No other files are changed, so rollback is one file
