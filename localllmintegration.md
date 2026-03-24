# Local LLM Integration — Build Plan

## Overview

Build a hardware diagnostic + Ollama setup wizard into SimOffice that detects the user's hardware, recommends the right model, installs Ollama if needed, pulls the model, configures thinking mode, and sets optimal performance settings — all without the user touching a terminal.

---

## Phase 1: Hardware Detection

- [ ] **1.1** Create `electron/services/hardware/detect.ts`
  - [ ] Detect total RAM via `os.totalmem()`
  - [ ] Detect CPU model via `os.cpus()` (extract Apple Silicon chip: M1/M2/M3/M4 + variant: base/Pro/Max/Ultra)
  - [ ] Detect CPU core count via `os.cpus().length`
  - [ ] Detect architecture via `os.arch()` (arm64 = Apple Silicon, x64 = Intel)
  - [ ] Detect OS version via `os.release()`
  - [ ] Detect available disk space via `child_process` → `df -h /`
  - [ ] Calculate available RAM (total minus ~3GB OS overhead)
  - [ ] Detect memory bandwidth from chip model (lookup table below)

### Memory Bandwidth Lookup Table

| Chip | Bandwidth (GB/s) | Notes |
|------|------------------|-------|
| M1 | 68 | Base |
| M1 Pro | 200 | |
| M1 Max | 400 | |
| M1 Ultra | 800 | |
| M2 | 100 | |
| M2 Pro | 200 | |
| M2 Max | 400 | |
| M2 Ultra | 800 | |
| M3 | 100 | |
| M3 Pro | 150 | |
| M3 Max (14-core GPU) | 300 | |
| M3 Max (16-core GPU) | 400 | |
| M3 Ultra | 800 | |
| M4 | 120 | |
| M4 Pro | 273 | |
| M4 Max | 546 | |
| Intel (any) | 25-50 | CPU-only inference, much slower |

**Key insight:** Memory bandwidth is the #1 factor for inference speed, not chip generation. An M1 Max (400 GB/s) is faster than an M4 Pro (273 GB/s).

---

## Phase 2: Model Recommendation Engine

- [ ] **2.1** Create `electron/services/hardware/model-recommender.ts`
  - [ ] Build model database with accurate specs (table below)
  - [ ] Recommendation algorithm: TWO tiers:
    - **Recommended tier:** models that fit in 75% of available RAM (comfortable, no slowdown)
    - **Advanced tier (collapsed):** models between 75-90% of RAM, shown with warning: "These brains are bigger than recommended for your computer. They'll work but may be slower, especially with other apps open."
    - Models above 90% RAM are hidden entirely
  - [ ] Return: recommended model, expected tok/s, expected TTFT, capability checklist, download size
  - [ ] Handle edge case: Intel Macs (CPU-only, recommend smallest models only)
  - [ ] Handle edge case: 8GB base M1/M2 (very limited, warn user)

### Model Database

#### VRAM Requirements (Q4_K_M quantization, 4K context)

| Model | Ollama Tag | Params | Download | Min RAM | Best For | Quality Tier |
|-------|-----------|--------|----------|---------|---------|-------------|
| Phi-4 Mini | `phi4-mini:latest` | 3.8B | 2.5 GB | 8 GB | Math, Reasoning | Basic |
| Gemma 3 | `gemma3:4b` | 4B | 3.3 GB | 8 GB | All-Rounder, Vision | Basic |
| Qwen 3.5 | `qwen3.5:4b` | 4B | 3.4 GB | 8 GB | All-Rounder, Vision | Basic |
| Llama 3.1 | `llama3.1:8b` | 8B | 4.9 GB | 16 GB | Assistant, Conversation | Good |
| Qwen 3 | `qwen3:8b` | 8B | 5.2 GB | 16 GB | Coding, Reasoning | Good |
| DeepSeek R1 | `deepseek-r1:8b` | 8B | 5.2 GB | 16 GB | Reasoning, Math | Good |
| Qwen 3.5 | `qwen3.5:9b` | 9B | 6.6 GB | 16 GB | All-Rounder, Vision, Coding | Good |
| GPT-OSS | `gpt-oss:20b` | 20B (MoE) | 14 GB | 24 GB | Reasoning, Assistant | Strong |
| Devstral | `devstral:24b` | 24B | 14 GB | 32 GB | Coding Agents | Strong |
| Mistral Small 3.1 | `mistral-small3.1:24b` | 24B | 15 GB | 32 GB | Vision, Tool Use, Data | Strong |
| Qwen 3.5 | `qwen3.5:27b` | 27B (dense) | 17 GB | 32 GB | Coding, Vision, All-Rounder | Very Strong |
| DeepSeek R1 | `deepseek-r1:32b` | 32B | 20 GB | 48 GB | Deep Reasoning, Math | Very Strong |
| Qwen 3.5 | `qwen3.5:35b` | 35B-A3B (MoE) | 24 GB | 48 GB | Fast All-Rounder, Vision | Very Strong |
| Qwen 3 | `qwen3:32b` | 32B | 20 GB | 48 GB | All-Rounder, Coding | Very Strong |
| Llama 3.3 | `llama3.3:70b` | 70B | 43 GB | 64 GB | Assistant, Coding, Writing | Excellent |
| GPT-OSS | `gpt-oss:120b` | 120B (MoE) | 65 GB | 96 GB | Best Reasoning | Excellent |
| Qwen 3.5 | `qwen3.5:122b` | 122B-A10B (MoE) | 81 GB | 128 GB | Maximum Quality | Excellent |

**IMPORTANT: There is NO Qwen 3.5 70B.** The Qwen 3.5 family is: 0.8B, 2B, 4B, 9B (dense), 27B (dense), 35B-A3B (MoE), 122B-A10B (MoE), 397B-A17B (cloud only).

**Note on MoE models (Qwen 3.5 35B-A3B, 122B-A10B):** These use Mixture of Experts with 256 experts (8 routed + 1 shared active per token). Only 3B params active in the 35B, 10B active in the 122B. They need the full VRAM to load all weights but generate tokens faster than dense models of the same total size. Architecture: Gated Delta Networks + sparse MoE, hybrid attention (GatedDeltaNet linear + full attention), 262K native context, multimodal (text + image).

#### Real-World Speed Benchmarks (tok/s, Q4_K_M, thinking OFF)

| Model | M1 (68) | M1 Pro (200) | M2 (100) | M3 (100) | M3 Pro (150) | M3 Max (400) | M4 (120) | M4 Pro (273) | M4 Max (546) |
|-------|---------|-------------|----------|----------|-------------|-------------|----------|-------------|-------------|
| 3-4B | 15-20 | 30-35 | 20-25 | 22-28 | 28-33 | 40-50 | 25-30 | 35-42 | 50-60 |
| 7-8B | 10-15 | 25-32 | 15-20 | 18-22 | 25-30 | 42-52 | 20-25 | 35-42 | 50-59 |
| 12-14B | — | 12-16 | — | 12-15 | 15-18 | 22-28 | 14-17 | 18-22 | 25-30 |
| 27-32B | — | — | — | — | — | 15-22 | — | 15-18 | 20-25 |
| 70B | — | — | — | — | — | ~10 | — | — | 10-12 |

*Numbers in parentheses = memory bandwidth in GB/s. Dash means model doesn't fit.*

#### Time to First Token (TTFT)

| Scenario | Cold Start (first load) | Warm (model in memory) |
|----------|------------------------|----------------------|
| 3-4B model | 3-5 seconds | <1 second |
| 7-8B model | 5-10 seconds | <1 second |
| 14B model | 8-15 seconds | 1-2 seconds |
| 32B model | 15-30 seconds | 1-3 seconds |
| 70B model | 30-60 seconds | 2-5 seconds |

---

## Phase 3: Capability Descriptions (Beginner-Friendly)

- [ ] **3.1** Create capability tier descriptions for the UI

### Tier: "Light Duty" (3-4B models, 8GB RAM)

**Description for user:**
> Your computer can run a small AI assistant. It's quick for simple tasks but won't handle complex work.

**Speed expectation:**
> Typing speed — like watching someone type a reply. First response takes a few seconds to start.

**Capabilities:**
- [x] Answer straightforward questions
- [x] Draft short emails and messages
- [x] Summarize a paragraph or two
- [x] Basic spelling and grammar help
- [ ] Writing blog posts or long documents
- [ ] Analyzing spreadsheets or data
- [ ] Writing or understanding code
- [ ] Complex reasoning or multi-step planning
- [ ] Handling nuanced customer conversations

### Tier: "Solid Performer" (7-9B models, 16GB RAM)

**Description for user:**
> Your computer can run a capable AI assistant. Good for everyday business tasks — writing, responding, organizing.

**Speed expectation:**
> Fast typing speed — responses flow smoothly. First response takes about a second.

**Capabilities:**
- [x] Answer questions with good accuracy
- [x] Write emails, messages, and short documents
- [x] Customer support with some context understanding
- [x] Social media posts and basic marketing copy
- [x] Summarize documents and extract key points
- [x] Simple code snippets and scripts
- [ ] Long-form writing (may lose coherence)
- [ ] Deep analysis or research tasks
- [ ] Complex multi-step business logic

### Tier: "Strong Performer" (12-14B models, 24GB RAM)

**Description for user:**
> Your computer can run a serious AI assistant. Handles most business tasks well — writing, analysis, planning.

**Speed expectation:**
> Conversational speed — like chatting with a coworker. Responses start within a second or two.

**Capabilities:**
- [x] Everything in Solid Performer, plus:
- [x] Longer documents and proposals
- [x] More nuanced customer interactions
- [x] Code generation and basic debugging
- [x] Data analysis and summarization
- [x] Content strategy and planning
- [ ] Novel-length writing consistency
- [ ] Expert-level reasoning

### Tier: "Heavy Hitter" (27-35B models, 36-48GB RAM)

**Description for user:**
> Your computer can run a powerful AI. Handles complex tasks — detailed writing, analysis, coding, strategy.

**Speed expectation:**
> Smooth and responsive. First response in 1-3 seconds, then flows steadily.

**Capabilities:**
- [x] Everything in Strong Performer, plus:
- [x] Long-form writing (blogs, reports, proposals)
- [x] Complex reasoning and analysis
- [x] Solid code generation and debugging
- [x] Multi-step planning and strategy
- [x] Detailed financial and business analysis
- [x] Nuanced creative writing

### Tier: "Cloud-Quality, On Your Machine" (70B+ dense or 122B MoE, 64-128GB RAM)

**Description for user:**
> Your computer can run an AI as powerful as what's behind ChatGPT Plus and Claude Pro — but it runs entirely on your machine. Your data never leaves your computer.

**Speed expectation:**
> A little slower than smaller models — like a thoughtful colleague who takes a beat before responding. But the quality is worth it.

**Capabilities:**
- [x] Everything. Full capability.
- [x] Rivals cloud AI quality (GPT-4, Claude Sonnet)
- [x] Professional-grade writing and editing
- [x] Advanced code generation and architecture
- [x] Deep research and multi-source analysis
- [x] Complex business strategy and planning
- [x] All your agents at maximum capability

---

## Key Architecture Decisions

### Decision 1: Ollama Process Ownership — Hybrid Approach

SimOffice uses a **hybrid model**: own the process when possible, gracefully connect when not.

**Scenario A — SimOffice starts Ollama (preferred):**
- Ollama not running → we spawn `ollama serve` as a child process
- We OWN the process: can set env vars (`OLLAMA_KEEP_ALIVE=-1`, `OLLAMA_FLASH_ATTENTION=1`, etc.)
- We manage lifecycle: start on app open, stop on app quit
- Store PID to track process

**Scenario B — User-managed Ollama (fallback):**
- Ollama already running (Ollama.app menu bar, manual start, etc.)
- We CANNOT set env vars — use per-request parameters instead:
  - `num_ctx` → pass in each `/api/chat` or `/api/generate` request body
  - `keep_alive` → pass in request body (overrides global)
  - `OLLAMA_FLASH_ATTENTION` and `OLLAMA_KV_CACHE_TYPE` → cannot override per-request, show note to user
- Detect ownership: track whether we spawned the process or connected to existing

**Implementation:**
- [ ] Add `ollamaOwned: boolean` flag to track who started Ollama
- [ ] If we own it: set env vars before spawn, full control
- [ ] If we don't: use per-request params where possible, show "for best performance, let SimOffice manage Ollama" note in settings

### Decision 2: One Canonical Flow, Multiple Entry Points

The `OllamaSetupWizard` component is reusable. It launches from:
- `LobbyAISetup.tsx` (line 635) — primary entry
- `Onboarding.tsx` (line 325) — first-time setup
- `Setup/index.tsx` — ClawX settings page (if user navigates there)
- `ProvidersSettings.tsx` — provider settings

**Implementation:**
- [ ] Build wizard as standalone component: `src/components/ollama/OllamaSetupWizard.tsx`
- [ ] Accept props: `onComplete(provider: ProviderAccount)`, `onCancel()`
- [ ] Each entry point renders `<OllamaSetupWizard />` when Ollama is selected
- [ ] Wizard handles ALL logic internally (detect → recommend → install → pull → configure)
- [ ] On complete, wizard calls back with configured provider — entry point saves it using its own save pattern

### Decision 3: Platform Scope

**v1 is macOS-only.** Windows/Linux support is future work.

- Hardware detection (Phase 1) targets Apple Silicon chips via `os.cpus()[0].model` parsing
- Ollama binary paths are macOS-specific (`/usr/local/bin/ollama`, `/Applications/Ollama.app/...`)
- Memory bandwidth table is Apple Silicon only
- Intel Macs get a degraded path (CPU-only, recommend smallest models)
- [ ] Add `if (process.platform !== 'darwin')` guard that shows "Local AI setup is coming soon for Windows/Linux" message
- [ ] Windows/Linux can still manually configure Ollama via the existing simple form (no wizard)

### Decision 4: Ollama Account Lifecycle

**One canonical Ollama account**, updated on re-run — NOT new accounts each time.

- The Ollama provider registry has `supportsMultipleAccounts: true`, but for local Ollama there should be ONE account
- [ ] On wizard completion: check for existing Ollama account → update it, don't create duplicate
- [ ] Use account ID format: `ollama-local` (fixed, not `ollama-{uuid}`)
- [ ] Re-running the wizard updates model, base URL, and settings on the same account

### Decision 5: "Use What's Already There" Behavior

The wizard must handle users who already have Ollama set up:

- [ ] Ollama already installed → skip install step, show "Ollama is already installed"
- [ ] Recommended model already pulled → skip download, show "Already downloaded" badge
- [ ] Different model already pulled → show it as an option with "Already on your computer" badge, still recommend the optimal one
- [ ] Existing Ollama account already configured → wizard shows "Update" instead of "Set Up", pre-fills current model
- [ ] Wizard is fully idempotent — running it twice doesn't break anything

### Decision 6: Persistence — Where Local AI Settings Live

Current `ProviderAccount` shape (providers.ts line 100) stores: baseUrl, model, authMode, metadata. It does NOT have fields for num_ctx, thinking, keepalive, etc.

- [ ] **Provider-level settings** (stored in `ProviderAccount.metadata`): selected model, base URL
- [ ] **App-level settings** (stored in settings store under `ollamaConfig`): num_ctx, keepalive, flash_attention, kv_cache_type, warmup-on-boot, process ownership
- [ ] **Session-level settings** (already exists): thinkingLevel in chat store
- [ ] Do NOT add new fields to ProviderAccount shape — use `metadata` bag or settings store

### Decision 7: Dynamic Discovery vs Curated Catalog

**Curated in-app catalog** is the primary source. `/api/tags` only shows already-installed models.

- [ ] Ship a static model database in the app (the table from Phase 2)
- [ ] Filter to models that fit the user's hardware
- [ ] After Ollama is running, query `/api/tags` to mark which models are already installed (show "Downloaded" badge)
- [ ] Do NOT rely on online catalog sync — app must work offline

---

## Phase 4: Ollama Installation & Health Check

- [ ] **4.1** Create `electron/services/ollama/health.ts`
  - [ ] Check if Ollama binary exists at these locations (in order):
    - `/usr/local/bin/ollama` (symlink created on first Ollama.app launch)
    - `/Applications/Ollama.app/Contents/Resources/ollama` (app bundle)
    - Run `which ollama` as fallback
  - [ ] Check if Ollama service is running: GET `http://localhost:11434/` (returns "Ollama is running")
  - [ ] If running, fetch installed models via GET `/api/tags`
  - [ ] Return status: `not-installed` | `installed-not-running` | `running`
  - [ ] Return installed models list if running

- [ ] **4.2** Create `electron/services/ollama/install.ts`
  - [ ] macOS: Download from `https://ollama.com/download/Ollama-darwin.zip`
  - [ ] Or open `https://ollama.com/download` in browser and guide user through manual install
  - [ ] Detect when installation completes: poll for binary at `/usr/local/bin/ollama` or `/Applications/Ollama.app`
  - [ ] Start Ollama service: spawn `ollama serve` as a detached subprocess
    - Binary path: `/usr/local/bin/ollama` or `/Applications/Ollama.app/Contents/Resources/ollama`
    - It listens on `http://localhost:11434` by default
    - Alternative: launch `/Applications/Ollama.app` via `open -a Ollama` (starts with menu bar icon)
  - [ ] Poll GET `http://localhost:11434/` until it responds (service ready)
  - [ ] Note: OpenClaw SDK does NOT install Ollama — it only configures an existing installation

- [ ] **4.3** Create `electron/services/ollama/models.ts`
  - [ ] List installed models: GET `/api/tags`
  - [ ] Pull model with progress: POST `/api/pull` (streaming NDJSON)
  - [ ] Delete model: DELETE `/api/delete`
  - [ ] Get model info: POST `/api/show`
  - [ ] Query context window per model
  - [ ] Track download progress (per-layer, percentage)
  - [ ] Reference: OpenClaw SDK's `pullOllamaModelCore()` at `node_modules/openclaw/dist/plugin-sdk/vllm-setup-CM7v1xIf.js:322-397`

---

## Phase 5: Thinking Mode Management

- [ ] **5.1** Handle thinking mode per model

### Critical: Thinking Mode is the #1 Performance Killer

Models with thinking enabled by default generate 500-8,000+ invisible reasoning tokens BEFORE producing visible output. At 20 tok/s, 1,000 thinking tokens = 50 seconds of apparent delay.

**This is very likely the cause of the user's 20-second waits on a 128GB Mac.**

### Models with thinking enabled by default:
- Qwen 3 (all sizes) — supports `/nothink` in-message
- Qwen 3.5 (all sizes) — does NOT support `/nothink`, API-only disable
- DeepSeek R1 (all sizes) — thinking is core to the model

### How to disable thinking:

| Method | Endpoint | Works for | Implementation |
|--------|----------|----------|---------------|
| `"think": false` | `/api/chat` (native) | Qwen 3, Qwen 3.5, DeepSeek R1 | Add to request body |
| `"reasoning_effort": "low"` | `/v1/chat/completions` (OpenAI-compat) | Qwen 3, Qwen 3.5 | Add to request body. Values: `high`, `medium`, `low` |
| Omit thinking params entirely | `/v1/chat/completions` | All models | Thinking is opt-in, omitting = no thinking |
| In-message `/nothink` | Any | Qwen 3 only | Prepend to user message. Does NOT work for Qwen 3.5 |
| `--think=false` CLI flag | CLI only | All thinking models | Not useful for API integration |
| Modelfile `PARAMETER think false` | N/A | NOT SUPPORTED YET | Ollama issue #10961, pending |

**CRITICAL:** The `/v1/chat/completions` endpoint (which OpenClaw uses) does NOT accept `"think": false`. It will throw a Go unmarshal error. Use `"reasoning_effort"` instead, or omit the parameter entirely to get non-thinking behavior. If explicit disable is needed, use the native `/api/chat` endpoint with `"think": false`.

- [ ] **5.2** Determine which endpoint OpenClaw gateway uses for Ollama inference
  - [ ] If `/v1/chat/completions` (OpenAI-compat): thinking is off by default (opt-in via `reasoning_effort`), so no action needed for default fast mode. To enable thinking: add `"reasoning_effort": "high"`.
  - [ ] If `/api/chat` (native): thinking is ON by default for Qwen 3/3.5 and DeepSeek R1. Must pass `"think": false"` to disable.
  - [ ] The gateway config sets baseUrl to `http://localhost:11434/v1` which suggests OpenAI-compat endpoint. Verify this.
  - [ ] If thinking is on by default through the gateway, we MUST intercept and add `"think": false` or the user experience will be terrible (20+ second delays).

- [ ] **5.3** Integrate with EXISTING thinking toggle — DO NOT create a new one
  - [ ] The chat store already has `thinkingLevel: string | null` (src/stores/chat.ts line 101) and `showThinking: boolean` (line 100)
  - [ ] Also referenced in OfficeScreen.tsx (line 3153) and session actions
  - [ ] Wire Ollama thinking control into this existing state:
    - When `thinkingLevel` is null/off → pass `"think": false` (native) or omit `reasoning_effort` (OpenAI-compat)
    - When `thinkingLevel` is set → pass `"think": true` (native) or `"reasoning_effort": thinkingLevel` (OpenAI-compat)
  - [ ] Default for Ollama local models: thinking OFF (fast responses)
  - [ ] For DeepSeek R1: show note that disabling thinking degrades quality significantly
  - [ ] For Qwen 3.5: API parameter only, `/nothink` does not work

- [ ] **5.3** Beginner-friendly explanation in UI:
  > **Thinking Mode** — When enabled, your AI thinks through the problem step-by-step before answering. This gives better answers for complex questions but takes longer. We keep this off by default for faster responses.

---

## Phase 6: Optimal Configuration

- [ ] **6.1** Auto-configure Ollama environment for best performance

### Settings to apply:

| Setting | Value | Default | Why |
|---------|-------|---------|-----|
| `OLLAMA_KEEP_ALIVE` | `-1` (never unload) | `5m` | Prevents 15-60 second cold starts between conversations. Any negative number = never unload. `0` = unload immediately. |
| `OLLAMA_FLASH_ATTENTION` | `1` | `0` (false) | Reduces VRAM usage as context grows. Boolean: `1` or `0`. |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | `0` (= 3 per GPU, or 3 for CPU) | Prevents memory pressure from multiple models. Default `0` is interpreted as 3. |
| `num_ctx` | `4096` | `2048` | Sweet spot for chat. Default 2048 is too small, 32K+ kills performance. Set per-request or via Modelfile. |
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | `f16` | Halves KV cache memory with minimal quality loss. Accepts: `f16`, `q8_0`, `q4_0` only. Global setting (all models). |

- [ ] **6.2** Context window recommendations by RAM:

| Available RAM (after model) | Recommended num_ctx |
|----------------------------|-------------------|
| < 2 GB headroom | 2048 (default) |
| 2-4 GB headroom | 4096 |
| 4-8 GB headroom | 8192 |
| 8+ GB headroom | 16384 |

- [ ] **6.3** Model preloading
  - [ ] On app startup (if Ollama provider is configured), send empty request to `/api/chat` to warm model into memory
  - [ ] This eliminates cold-start TTFT on first real user message

---

## Phase 7: IPC Handlers

- [ ] **7.1** Add new IPC handlers in `electron/main/ipc-handlers.ts`:

```
ollama:detect-hardware    → returns { ram, chip, bandwidth, arch, cores, availableRam }
ollama:check-status       → returns 'not-installed' | 'installed-not-running' | 'running'
ollama:get-recommendation → returns { model, tier, speed, capabilities, downloadSize }
ollama:install             → opens installer / guides user
ollama:start              → starts Ollama service
ollama:list-models        → returns installed models from /api/tags
ollama:pull-model         → pulls model with progress events (streaming)
ollama:delete-model       → deletes a model
ollama:configure          → sets optimal env vars and num_ctx
ollama:preload-model      → warms model into memory
```

- [ ] **7.2** Add progress streaming for model pulls
  - [ ] Backend: use `webContents.send('ollama:pull-progress', { model, percent, status })` for real-time progress
  - [ ] Add `'ollama:pull-progress'` to `HOST_EVENT_TO_IPC_CHANNEL` mapping in `src/lib/host-events.ts`
  - [ ] Frontend: use `subscribeHostEvent('ollama:pull-progress', callback)` — NOT raw `ipcRenderer.on`
  - [ ] Show download speed and ETA in UI

---

## Phase 8: UI — Setup Wizard

- [ ] **8.1** Modify `src/pages/LobbyAISetup.tsx`
  - [ ] When user selects Ollama provider, launch the setup wizard instead of just showing a form
  - [ ] Wizard flow (see below)

- [ ] **8.2** Create `src/components/ollama/OllamaSetupWizard.tsx`

### Wizard Flow:

```
Step 1: "Checking your computer..."
  → Auto-detect hardware
  → Show: "You have a Mac with [chip] and [RAM] GB of memory"
  → Animate hardware detection (feels premium)

Step 2: "Here's what we recommend"
  → Show tier name + description
  → Show recommended model with download size
  → Show capability checklist (checkboxes)
  → Show speed expectation in plain language
  → Option to pick a different model (advanced, collapsed by default)

Step 3: "Setting up Ollama"
  → Check if Ollama is installed
  → If not: "We need to install Ollama first" + one-click install button
  → If installed but not running: auto-start it
  → If running: skip to step 4

Step 4: "Downloading your AI"
  → Pull recommended model with progress bar
  → Show download speed and ETA
  → "This downloads [X] GB. You can keep using your computer while it downloads."
  → On complete: auto-configure optimal settings

Step 5: "You're all set!"
  → Auto-configure as default provider
  → "Your AI team is ready. [Model name] is running on your computer."
  → "Your data never leaves this machine."
  → Button: "Go to your office"
```

- [ ] **8.3** Create `src/components/ollama/OllamaModelPicker.tsx`
  - [ ] Advanced model picker (collapsed by default in wizard)
  - [ ] Shows all compatible models for their hardware
  - [ ] Each model shows: name, size, download size, speed estimate, capability tier
  - [ ] Warns if model exceeds 75% of RAM

- [ ] **8.4** Create `src/components/ollama/OllamaStatus.tsx`
  - [ ] Small status indicator for the AI Setup page
  - [ ] Shows: model name, status (running/stopped), memory usage
  - [ ] Quick actions: restart, change model, thinking toggle

---

## Phase 9: Update Model Dropdown

### IMPORTANT: UX Intent

The model research data (tags, categories, descriptions) is **user-facing, not internal**. It must be displayed in the wizard and model picker so beginners can understand what they're choosing WITHOUT knowing anything about AI, parameters, or benchmarks.

**Rules for display:**
- Never show parameter counts (no "8B", "32B") — users don't know what this means
- Never show benchmark names (no "SWE-bench", "HumanEval", "MMLU")
- Use plain language: "Good at writing code" not "HumanEval 76.0%"
- Show "best for" tags as colored pills (like app store categories)
- Show the one-line description in plain English
- Show download size and estimated time ("Downloads 6.6 GB — about 5 minutes on fast wifi")
- Show speed expectation in human terms ("Responds like a fast typist" not "35 tok/s")
- The wizard auto-picks the best model — advanced picker is collapsed by default
- Group models by "what do you want your AI to do?" not by size or architecture
- **Only show models that fit the user's hardware.** The wizard detects RAM and filters out anything that would bottleneck their system (models must fit within 75% of total RAM). Users never see models they can't run well. No "your computer can't handle this" warnings — those models simply don't appear.
- The auto-picked recommendation is the best model their hardware can run comfortably
- **Show a memory warning in plain language:** Something like "Running a local AI brain uses a lot of your computer's memory. If you have other apps open (browsers, Photoshop, etc.), your AI and those apps may slow down. For the best experience, close heavy apps while your AI team is working."
- **Never say "LLM" anywhere in the UI.** Call it a "brain" or "AI brain" — e.g., "Pick your AI brain", "Downloading your brain", "Your brain is ready." Users don't know what LLM means and shouldn't have to.

- [ ] **9.1** Update `src/lib/provider-models.ts`
  - [ ] Replace hardcoded Ollama model list with dynamic discovery
  - [ ] Fall back to curated list if Ollama not reachable
  - [ ] Add Qwen 3.5 models (9B, 27B, 35B, 122B) to curated fallback list (NO 70B — it doesn't exist)
  - [ ] Group models by tier in dropdown

### Updated curated model list:

```typescript
ollama: [
  // --- 8GB RAM ---
  { id: 'phi4-mini:latest', name: 'Phi-4 Mini (3.8B) — Math & Reasoning' },
  { id: 'gemma3:4b', name: 'Gemma 3 (4B) — All-Rounder + Vision' },
  { id: 'qwen3.5:4b', name: 'Qwen 3.5 (4B) — All-Rounder + Vision' },
  // --- 16GB RAM ---
  { id: 'qwen3.5:9b', name: 'Qwen 3.5 (9B) — Best All-Rounder + Vision' },
  { id: 'qwen3:8b', name: 'Qwen 3 (8B) — Best Coder Under 16GB' },
  { id: 'deepseek-r1:8b', name: 'DeepSeek R1 (8B) — Reasoning & Math' },
  { id: 'llama3.1:8b', name: 'Llama 3.1 (8B) — Reliable Assistant' },
  // --- 24GB+ RAM ---
  { id: 'gpt-oss:20b', name: 'GPT-OSS (20B MoE) — OpenAI Reasoning' },
  // --- 32GB RAM ---
  { id: 'qwen3.5:27b', name: 'Qwen 3.5 (27B) — Best Coder + Vision' },
  { id: 'devstral:24b', name: 'Devstral (24B) — Coding Agent Specialist' },
  { id: 'mistral-small3.1:24b', name: 'Mistral Small 3.1 (24B) — Vision + Tool Use' },
  { id: 'deepseek-r1:32b', name: 'DeepSeek R1 (32B) — Deep Reasoning' },
  // --- 48GB+ RAM ---
  { id: 'qwen3.5:35b', name: 'Qwen 3.5 (35B MoE) — Fast All-Rounder' },
  { id: 'qwen3:32b', name: 'Qwen 3 (32B) — Strong All-Rounder' },
  // --- 64GB+ RAM ---
  { id: 'llama3.3:70b', name: 'Llama 3.3 (70B) — Cloud Quality Assistant' },
  { id: 'gpt-oss:120b', name: 'GPT-OSS (120B MoE) — Best Reasoning' },
  // --- 128GB+ RAM ---
  { id: 'qwen3.5:122b', name: 'Qwen 3.5 (122B MoE) — Maximum Quality' },
]
```

**Note:** Field is `name` not `label` — matches existing `PROVIDER_MODELS` interface. No Qwen 3.5 70B exists.

### Per-Model "Best For" Tags (visible to user in wizard)

Each model gets beginner-friendly category tags shown in the UI:

| Ollama Tag | Best For Tags | One-Line Description |
|-----------|---------------|---------------------|
| `phi4-mini:latest` | `math` `reasoning` | Tiny but beats GPT-4o on math. Best for 8GB machines. |
| `gemma3:4b` | `all-rounder` `vision` | See images, answer questions, handle basics. Google-made. |
| `qwen3.5:4b` | `all-rounder` `vision` | Small but capable. Understands images. 256K context. |
| `qwen3.5:9b` | `all-rounder` `vision` `coding` | The best small model. Does everything well. Sees images. |
| `qwen3:8b` | `coding` `reasoning` | Best coder under 16GB. Strong at writing code and scripts. |
| `deepseek-r1:8b` | `reasoning` `math` | Thinks step-by-step. Best for hard problems and math. |
| `llama3.1:8b` | `assistant` `conversation` | Reliable, well-tested. Biggest community. Great for chat. |
| `gpt-oss:20b` | `reasoning` `assistant` | OpenAI's open model. Matches o3-mini reasoning quality. |
| `qwen3.5:27b` | `coding` `vision` `all-rounder` | Best coder under 32GB. SWE-bench 72.4%. Sees images. |
| `devstral:24b` | `coding` | Built specifically for coding agents. Best at multi-file edits. |
| `mistral-small3.1:24b` | `vision` `assistant` `data` | Sees images, calls tools, fast. Good for business agents. |
| `deepseek-r1:32b` | `reasoning` `math` `coding` | Deep chain-of-thought reasoning. The thinking champion. |
| `qwen3.5:35b` | `all-rounder` `vision` | Fast MoE model. Good at everything, especially quick tasks. |
| `qwen3:32b` | `all-rounder` `coding` | Strong across the board. 40K context. |
| `llama3.3:70b` | `assistant` `coding` `writing` | Cloud-quality AI locally. Best large open model. |
| `gpt-oss:120b` | `reasoning` `assistant` | Surpasses o4-mini. Best reasoning model you can run locally. |
| `qwen3.5:122b` | `all-rounder` `vision` `coding` | Maximum quality. 122B params, multimodal, 256K context. |

### Category Definitions (shown to user)

| Category | What it means (beginner-friendly) |
|----------|----------------------------------|
| `all-rounder` | Good at everything — writing, answering questions, helping with tasks |
| `coding` | Writes, explains, and fixes code. Helps with programming projects |
| `reasoning` | Thinks through hard problems step-by-step. Good at logic and analysis |
| `math` | Solves math problems, from basic arithmetic to advanced equations |
| `vision` | Can look at images and screenshots — describe, analyze, extract text |
| `assistant` | Great at natural conversation, following instructions, being helpful |
| `conversation` | Feels natural to chat with. Good at back-and-forth dialogue |
| `writing` | Strong at long-form writing — emails, reports, blog posts, proposals |
| `data` | Good at understanding tables, structured data, and business analysis |

### Models NOT in our list (and why)

| Model | Why excluded |
|-------|-------------|
| `kimi-k2`, `kimi-k2.5` | **Cloud-only on Ollama** — cannot download and run locally |
| `deepseek-v3` | 404 GB download — impractical for any consumer hardware |
| `mistral:7b` | Superseded by Mistral Small 3.1 |
| `codellama` | Outdated — use `qwen3-coder` or `devstral` instead |
| `mixtral` | Superseded by `gpt-oss:20b` |
| `starcoder2` | Superseded by `qwen3-coder` and `devstral` |

**Full model research with benchmarks:** See `OLLAMA_MODEL_RESEARCH.md` in project root.

---

## Phase 10: Provider Validation Fix

- [ ] **10.1** Update `electron/services/providers/provider-validation.ts`
  - [ ] For Ollama: actually ping `http://localhost:11434/` instead of returning `{ valid: true }`
  - [ ] Return helpful error: "Ollama isn't running" vs "Ollama isn't installed" vs "Can't reach Ollama at [url]"
  - [ ] **Do NOT check if model is pulled here** — the validation contract (`provider:validateKey`) doesn't carry a model ID (see ipc-handlers.ts line 1952). Model availability is checked in the wizard during the pull step, not during validation.

---

## Phase 11: Performance Optimizations

- [ ] **11.1** Model preloading on app startup
  - [ ] If Ollama is the default provider, send warmup request on boot
  - [ ] Eliminates 5-60 second cold start on first message

- [ ] **11.2** Keep-alive management
  - [ ] Set `OLLAMA_KEEP_ALIVE=-1` during app runtime
  - [ ] Optionally restore on app quit

- [ ] **11.3** Flash attention
  - [ ] Enable `OLLAMA_FLASH_ATTENTION=1` for reduced VRAM

---

## Phase 12: Disk Space & Download Recovery

- [ ] **12.1** Disk space checks
  - [ ] Before pull: check free space on the volume where Ollama stores models (`~/.ollama/models`)
  - [ ] Require: download size + 2GB headroom (temp files during extraction)
  - [ ] If insufficient: show "You need X GB free to download this brain. You have Y GB free."
  - [ ] Suggest cleanup: list installed Ollama models with sizes, offer to delete unused ones

- [ ] **12.2** Cancel/resume/recovery for model pulls
  - [ ] Ollama's `/api/pull` supports resumable downloads natively (resumes partial layers)
  - [ ] On app quit during pull: pull stops, partial download remains on disk
  - [ ] On app reopen: detect incomplete pull (model not in `/api/tags`), offer to resume
  - [ ] On network interruption: show "Download paused — check your internet connection", auto-retry when network returns
  - [ ] Wizard state machine: `idle → detecting → recommending → installing → pulling → configuring → done`
  - [ ] Persist wizard state to settings store so reopening the app resumes where you left off

---

## Phase 13: Tests

- [ ] **13.1** Unit tests for hardware detection
  - [ ] Mock `os.cpus()`, `os.totalmem()` for various chip/RAM combos
  - [ ] Verify bandwidth lookup returns correct values
  - [ ] Verify chip parsing: "Apple M3 Max" → { generation: "M3", variant: "Max" }

- [ ] **13.2** Unit tests for model recommender
  - [ ] Given 8GB M1 → recommends phi4-mini or gemma3:4b
  - [ ] Given 16GB M3 → recommends qwen3.5:9b
  - [ ] Given 64GB M4 Max → recommends llama3.3:70b
  - [ ] Verify 75% RAM threshold is applied
  - [ ] Verify advanced tier (75-90%) includes correct models
  - [ ] Verify models above 90% are hidden

- [ ] **13.3** Integration tests for Ollama HTTP endpoints (mocked)
  - [ ] Mock `/api/tags` response → verify model list parsing
  - [ ] Mock `/api/pull` streaming response → verify progress tracking
  - [ ] Mock `/api/show` response → verify model info extraction
  - [ ] Mock health check → verify status detection

- [ ] **13.4** Wizard state machine tests
  - [ ] Verify state transitions: idle → detecting → recommending → etc.
  - [ ] Verify cancel at each step returns to clean state
  - [ ] Verify re-run with existing setup shows "Update" flow

---

## Phase 14: Localization & Copy

- [ ] **14.1** All new user-facing copy must be added to locale files
  - [ ] Check existing i18n pattern in the codebase (if any — Lobby pages may not use i18n)
  - [ ] Wizard strings: step titles, descriptions, capability names, warnings
  - [ ] Avoid hardcoded numbers in UI copy (e.g., don't say "174 agents" — use a variable or omit)

- [ ] **14.2** Update README if needed
  - [ ] Mention local AI / Ollama integration as a feature
  - [ ] No need for detailed docs — the wizard IS the documentation

---

## Phase 15: Ollama Version Compatibility

- [ ] **15.1** Detect Ollama version via `GET /api/version` (returns `{"version": "0.17.2"}`)
- [ ] **15.2** Define minimum supported version — likely `0.12.0+` (partial GPU offload fix, thinking mode support)
- [ ] **15.3** If version is below minimum: show "Your Ollama is outdated. Please update at ollama.com/download for the best experience." with a button to open the download page
- [ ] **15.4** Feature detection fallback — if version check fails, try features and handle errors gracefully:
  - `"think": false` not supported → catch error, omit param
  - Flash attention not supported → ignore, doesn't break anything
  - `/api/version` endpoint doesn't exist (very old) → assume outdated, prompt update

---

## Phase 16: Security & Privacy Boundaries

This is critical — SimOffice sells on "your data never leaves your computer."

- [ ] **16.1** Document and enforce what stays local:
  - All AI prompts and responses: **local only** (Ollama runs on localhost)
  - Model weights: **stored locally** at `~/.ollama/models`
  - Chat history: **local only** (existing behavior)
  - Hardware detection data: **never sent anywhere**

- [ ] **16.2** Document what external URLs are accessed:
  - `https://ollama.com/download` — opened in browser for manual install (user-initiated)
  - `https://ollama.com/download/Ollama-darwin.zip` — direct download if auto-install (user-initiated)
  - `http://localhost:11434/*` — all Ollama API calls are localhost only
  - Model pulls (`/api/pull`) trigger Ollama to download from `registry.ollama.ai` — this is Ollama's behavior, not ours, but we should mention it

- [ ] **16.3** Show privacy note in wizard:
  > "Everything runs on your computer. Your conversations, your data, and your AI brain never leave this machine. The only download is the AI brain itself from Ollama's servers — after that, everything is offline."

- [ ] **16.4** No telemetry for wizard steps in v1 — keep it simple, add later if needed

---

## Phase 17: Cleanup & Rollback

- [ ] **17.1** Define partial-failure states and recovery:

| Failure Point | State Left Behind | Recovery |
|--------------|-------------------|----------|
| Ollama install fails | Nothing installed | Wizard shows "Install failed" with retry button and manual install link |
| Ollama starts then crashes | Binary exists, no process | Wizard detects "installed but not running", offers restart |
| Model pull interrupted (network) | Partial download on disk | Ollama resumes natively — wizard shows "Resume download" |
| Model pull interrupted (app quit) | Partial download on disk | On reopen, wizard detects incomplete pull, offers resume |
| Model pull completes but config fails | Model downloaded, no provider saved | Wizard retries config step only (model is already there) |
| Provider saved but model not pulled | Account exists, no model | Wizard detects model missing, offers to pull |

- [ ] **17.2** Wizard tracks its own state in settings store:
  ```
  ollamaSetup: {
    status: 'idle' | 'installing' | 'pulling' | 'configuring' | 'done' | 'error',
    lastModel: 'qwen3.5:9b',
    lastError: 'Network interrupted during pull',
    pullProgress: 0.45,  // resume point
  }
  ```
- [ ] **17.3** On wizard reopen after failure: jump to the failed step, not the beginning
- [ ] **17.4** No automatic rollback of successful steps — if Ollama is installed, keep it. If model is pulled, keep it. Only retry the failed step.

---

## Known Issues & Gotchas

### Must handle:
- [ ] **No Qwen 3.5 70B exists** — don't reference it anywhere. Jump from 35B to 122B. For 64GB users, recommend Llama 3.3 70B instead.
- [ ] Qwen 3.5 GGUF models may have compatibility issues with Ollama (separate mmproj vision files)
- [ ] Qwen 3.5 default 32K context can silently exhaust VRAM on 24GB systems → force `num_ctx` to 4096-8192
- [ ] DeepSeek R1 without thinking = significantly degraded quality (warn users)
- [ ] Gemma 3 12B needs more VRAM than Qwen 3 14B despite fewer params (architecture difference)
- [ ] Intel Macs: CPU-only inference, 2-3x slower, recommend 3-4B models only
- [ ] Model cold start after keepalive timeout (5 min default) causes confusion ("it was fast a minute ago, now it's slow")
- [ ] Multiple concurrent model loads can crash on 8-16GB systems
- [ ] Context window too large + large model = OOM with no clear error message
- [ ] Ollama in Docker on macOS has NO GPU access — must run natively

### MLX consideration (future):
- MLX (Apple's native ML framework) is 30-100% faster than Ollama's llama.cpp backend on Apple Silicon
- Especially for MoE models (Qwen 3.5 35B-A3B: ~2x faster on MLX)
- Prompt processing: 3-5x faster on MLX
- Consider MLX backend support in future (via LM Studio or mlx_lm)

---

## References

### GitHub Repos
- [llmfit](https://github.com/AlexsJones/llmfit) — 19k stars, Rust, hardware detection + model scoring
- [llm-checker](https://github.com/Pavelevich/llm-checker) — 1.6k stars, JS/Node, MCP integration, could embed
- [ollama-fit](https://github.com/MadhuNimmo/ollama-fit) — Python, Apple Silicon memory handling reference
- [ollama-gpu-calculator](https://github.com/aleibovici/ollama-gpu-calculator) — React, simple VRAM calculator
- [whichllm](https://github.com/Andyyyy64/whichllm) — Python, auto-download and launch

### OpenClaw SDK Functions (already in our node_modules)
- `promptAndConfigureOllama()` — interactive setup wizard
- `configureOllamaNonInteractive()` — auto-discovery
- `ensureOllamaModelPulled()` — pull models if not installed
- `pullOllamaModelCore()` — streaming model download with progress
- `fetchOllamaModels()` — list available models
- `enrichOllamaModelsWithContext()` — query context windows
- `resolveOllamaApiBase()` — URL normalization
- Location: `node_modules/openclaw/dist/plugin-sdk/vllm-setup-CM7v1xIf.js`

### Ollama API Endpoints
- `GET /api/tags` — list installed models
- `POST /api/pull` — download model (streaming NDJSON)
- `POST /api/show` — model info + context window
- `DELETE /api/delete` — remove model
- `POST /api/chat` — chat completion (native)
- `POST /v1/chat/completions` — OpenAI-compatible chat
- `GET /` — health check (returns "Ollama is running")

### Ollama GitHub Issues
- [#10961](https://github.com/ollama/ollama/issues/10961) — Disable thinking via Modelfile (not yet supported)
- [#11467](https://github.com/ollama/ollama/issues/11467) — Hardware requirement filters (open)
- [#14617](https://github.com/ollama/ollama/issues/14617) — Qwen 3.5 thinking disable
- [#14579](https://github.com/ollama/ollama/issues/14579) — Qwen 3.5 slower than llama.cpp
- [#14662](https://github.com/ollama/ollama/issues/14662) — Qwen 3.5 35B slow response
- [#12037](https://github.com/ollama/ollama/issues/12037) — Excessive TTFT with partial GPU offload
- [#13372](https://github.com/ollama/ollama/issues/13372) — Qwen3:32b slowdown in 0.12.4

### Benchmarks & Guides
- [MLJourney: Mac M1-M4 LLM Real Tests](https://mljourney.com/mac-m1-vs-m2-vs-m3-vs-m4-for-running-llms-real-tests/)
- [LocalLLM.in: Ollama VRAM Requirements](https://localllm.in/blog/ollama-vram-requirements-for-local-llms)
- [SitePoint: Local LLMs on Apple Silicon 2026](https://www.sitepoint.com/local-llms-apple-silicon-mac-2026/)
- [Ollama Docs: Thinking Mode](https://docs.ollama.com/capabilities/thinking)
- [Ollama Docs: Context Length](https://docs.ollama.com/context-length)
- [Ollama Docs: FAQ](https://docs.ollama.com/faq)

---

## Implementation Order

**Session 1 — Backend foundation (no UI):**
1. Phase 1 — Hardware detection (`electron/services/hardware/detect.ts`)
2. Phase 2 — Model recommendation engine (`electron/services/hardware/model-recommender.ts`)
3. Phase 4 — Ollama health check + install detection (`electron/services/ollama/health.ts`, `install.ts`, `models.ts`)
4. Phase 13.1-13.3 — Unit tests for above

**Session 2 — Wiring + config:**
5. Phase 5 — Thinking mode (wire into existing `thinkingLevel` in chat store)
6. Phase 6 — Auto-configuration (`electron/services/ollama/config.ts`)
7. Phase 7 — IPC handlers + host event mapping
8. Phase 10 — Fix provider validation for Ollama
9. Phase 12 — Disk space checks + download recovery
10. Phase 15 — Ollama version detection

**Session 3 — The wizard UI:**
10. Phase 8 — OllamaSetupWizard component (the big one)
11. Phase 3 — Capability tier descriptions (content for the wizard)
12. Wire wizard into all 4 entry points (LobbyAISetup, Onboarding, Setup, ProvidersSettings)

**Session 4 — Polish:**
13. Phase 9 — Update model dropdown with curated list
14. Phase 11 — Performance optimizations (preloading, keepalive)
15. Phase 14 — Localization + copy review
16. Phase 16 — Security/privacy notes in UI
17. Phase 17 — Cleanup/rollback state machine
18. Phase 13.4 — Wizard state machine tests

**Key files to read first in each session:**
- Always start by reading `localllmintegration.md` (this file) for full context
- Read `OLLAMA_MODEL_RESEARCH.md` for model data
- Read Appendix A for code patterns and integration points

---

## APPENDIX A: Existing Codebase Patterns (for context recovery)

This section captures the exact code patterns, file paths, and integration points so future sessions can pick up without re-reading the entire codebase.

### A.1 File Map — What to Create vs Modify

**New files to create:**
```
electron/services/hardware/detect.ts          — Hardware detection (RAM, chip, bandwidth)
electron/services/hardware/model-recommender.ts — Model recommendation engine
electron/services/ollama/health.ts            — Ollama install/running checks
electron/services/ollama/install.ts           — Ollama installation helper
electron/services/ollama/models.ts            — Model pull/list/delete via Ollama API
electron/services/ollama/config.ts            — Optimal settings (keepalive, flash attn, etc.)
src/components/ollama/OllamaSetupWizard.tsx   — The main wizard component
src/components/ollama/OllamaModelPicker.tsx   — Advanced model selection
src/components/ollama/OllamaStatus.tsx        — Status indicator for AI Setup page
```

**Existing files to modify:**
```
electron/main/ipc-handlers.ts (2562 lines)
  → Add new ollama:* handlers inside registerProviderHandlers() around line 1985

electron/preload/index.ts (265 lines)
  → Add new channels to validChannels array

electron/services/providers/provider-validation.ts (388 lines)
  → Line 110-111: Change 'ollama' case from 'none' to actual health check

src/pages/LobbyAISetup.tsx (670 lines)
  → Line 635-641: Replace simple Ollama message with wizard launch
  → Line 107: authMode 'local' for Ollama (keep this)

src/lib/provider-models.ts (64 lines)
  → Lines 56-63: Expand Ollama model list with tiers

src/types/electron.d.ts (28 lines)
  → May need new type exports for hardware/ollama data
```

### A.2 IPC Handler Pattern

All IPC handlers live in `electron/main/ipc-handlers.ts`. Pattern:

```typescript
// Inside registerProviderHandlers() function (starts ~line 1697)
ipcMain.handle('channel:name', async (_, arg1: Type1, arg2: Type2) => {
  try {
    // do work
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: String(error) };
  }
});
```

Channels must also be added to `validChannels` array in `electron/preload/index.ts` (line ~14-147).

### A.3 Renderer API Call Patterns

The codebase has **two established patterns** for renderer → main communication. Use both as appropriate:

```typescript
// Pattern 1: hostApiFetch — PREFERRED for CRUD / persistence operations
// File: src/lib/host-api.ts (line 140)
import { hostApiFetch } from '@/lib/host-api';
const data = await hostApiFetch('/api/provider-accounts', { method: 'POST', body: JSON.stringify(payload) });

// Pattern 2: invokeIpc — used for validation, one-off operations
// File: src/lib/api-client.ts (line 1039)
import { invokeIpc } from '@/lib/api-client';
const result = await invokeIpc('provider:validateKey', providerId, apiKey, options);
```

**LobbyAISetup.tsx uses BOTH:** `invokeIpc` for validation (line 82), `hostApiFetch` for saving accounts (lines 116, 121).

For **streaming/progress events** (like model downloads), use the existing event bus abstraction:

```typescript
// Renderer side — use subscribeHostEvent (NOT raw ipcRenderer.on)
// File: src/lib/host-events.ts (line 35)
import { subscribeHostEvent } from '@/lib/host-events';
const unsub = subscribeHostEvent('ollama:pull-progress', (data) => {
  setProgress(data.percent);
});
// cleanup: unsub()
```

The event bus (`host-events.ts`) maps event names to IPC channels via `HOST_EVENT_TO_IPC_CHANNEL` (lines 5-18) and has SSE fallback. We'll need to add our `ollama:*` events to this mapping.

From main process, events are sent via:
```typescript
mainWindow.webContents.send('ollama:pull-progress', { model, percent, status });
```

### A.4 Provider Save Flow (Current Ollama Path)

When user saves an Ollama provider in LobbyAISetup.tsx:

1. Build `ProviderAccount` with `authMode: 'local'`, `vendorId: 'ollama'`
2. API key stored as `'ollama-local'` placeholder (from `resolveProviderApiKeyForSave()`)
3. POST to `/api/provider-accounts` via `hostApiFetch()`
4. Set as default via PUT `/api/provider-accounts/default`
5. Provider synced to OpenClaw gateway via `provider-runtime-sync.ts`

**We keep this flow intact** — the wizard just adds steps BEFORE saving (detect → recommend → install → pull → configure → THEN save provider).

### A.5 Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      value: '',
      setValue: (v) => set({ value: v }),
    }),
    { name: 'store-key' }
  )
);
```

Settings store persists under key `'clawx-settings'` and syncs from/to `/api/settings`.

### A.6 Component Styling Pattern

**The codebase has TWO styling approaches.** This is an existing inconsistency, not something we introduced:

**Path A — Inline styles (Lobby* pages, our SimOffice UI):**
```typescript
// LobbyAISetup.tsx, LobbySettings.tsx, Lobby.tsx, etc. — 660+ inline style uses
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 0', borderBottom: '1px solid hsl(var(--border))'
};
// Cards use hsl(var(--card)), hsl(var(--border)), hsl(var(--foreground)), hsl(var(--muted-foreground))
// Gradients: linear-gradient(135deg, #3b82f6, #2563eb) for primary actions
// Font: Space Grotesk for headings, Manrope (inherited) for body
```

**Path B — Tailwind + shadcn/ui (Setup/, ProvidersSettings, original ClawX pages):**
```typescript
// Setup/index.tsx, ProvidersSettings.tsx — 1,814+ className uses
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
<Button className={cn("flex gap-4 items-center")} />
```

Tailwind is fully configured (`tailwind.config.js`, `postcss.config.js`). shadcn/ui components exist at `src/components/ui/` (Button, Input, Label, Card, etc.).

**For the Ollama wizard:** Follow Path A (inline styles) to match the other Lobby* / SimOffice pages. The wizard hooks into LobbyAISetup which is inline-styled. Don't mix patterns within the same page flow.

### A.7 Current Ollama UI in LobbyAISetup

Currently when user selects Ollama, they see (line 635-641):
```tsx
<div style={{ padding: '12px 16px', borderRadius: 10, background: 'hsl(var(--muted))', marginBottom: 12 }}>
  <div style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>
    Make sure Ollama is running on your computer. No secret code needed.
  </div>
</div>
```

**This is where we hook in the wizard.** Replace this simple message with a button that launches `OllamaSetupWizard`.

### A.8 Ollama Provider Registry Entry

From `electron/shared/providers/registry.ts` (lines 225-239):
```typescript
{
  id: 'ollama',
  name: 'Ollama',
  icon: '🦙',
  placeholder: 'Not required',
  requiresApiKey: false,
  defaultBaseUrl: 'http://localhost:11434/v1',
  showBaseUrl: true,
  showModelId: true,
  modelIdPlaceholder: 'qwen3:latest',
  category: 'local',
  supportedAuthModes: ['local'],
  defaultAuthMode: 'local',
  supportsMultipleAccounts: true,
}
```

### A.9 OpenClaw SDK Key Functions

Location: `node_modules/openclaw/dist/plugin-sdk/vllm-setup-CM7v1xIf.js`

**We may NOT be able to call these directly** from our Electron main process — they're designed for OpenClaw's CLI wizard flow with a `WizardPrompter` interface. Instead, we should:
- Use them as **reference implementations**
- Call the Ollama API directly from our own code (simpler, no SDK dependency)
- The key API calls are straightforward HTTP requests

**Ollama native API (no SDK needed):**
```typescript
// Health check
const res = await fetch('http://localhost:11434/');
// returns "Ollama is running" if alive

// List models
const res = await fetch('http://localhost:11434/api/tags');
const { models } = await res.json();
// models: [{ name: 'qwen3:latest', size: 5000000000, ... }]

// Pull model (streaming)
const res = await fetch('http://localhost:11434/api/pull', {
  method: 'POST',
  body: JSON.stringify({ model: 'qwen3:8b' }),
});
// Read NDJSON stream for progress

// Get model info
const res = await fetch('http://localhost:11434/api/show', {
  method: 'POST',
  body: JSON.stringify({ model: 'qwen3:8b' }),
});

// Chat — NATIVE endpoint (with thinking disabled)
const res = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen3:8b',
    messages: [{ role: 'user', content: 'Hello' }],
    think: false,  // Works on native endpoint only
    stream: false,
  }),
});

// Chat — OpenAI-compatible endpoint (thinking disabled by omitting reasoning_effort)
// WARNING: "think": false does NOT work here — causes Go unmarshal error
const res2 = await fetch('http://localhost:11434/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen3:8b',
    messages: [{ role: 'user', content: 'Hello' }],
    // Do NOT pass "think" param here. Omitting = no thinking.
    // To enable thinking: "reasoning_effort": "high" | "medium" | "low"
  }),
});
```

### A.10 Hardware Detection — Verified

`os.cpus()[0].model` on macOS returns the exact chip name from `sysctl machdep.cpu.brand_string`:
- `"Apple M1"` — base chip
- `"Apple M1 Pro"` — Pro variant
- `"Apple M3 Max"` — Max variant
- `"Apple M4"` — base M4

**Parsing pattern:**
```typescript
const cpuModel = os.cpus()[0].model; // "Apple M3 Max"
const parts = cpuModel.split(' ');   // ["Apple", "M3", "Max"]
const generation = parts[1];          // "M3"
const variant = parts[2] || 'base';   // "Max" or "base"
const chipKey = variant === 'base' ? generation : `${generation} ${variant}`;
// chipKey = "M3 Max" → lookup bandwidth from table
```

### A.11 Constants

```typescript
const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_API_URL = 'http://localhost:11434/v1';  // OpenAI-compatible
const OLLAMA_PLACEHOLDER_API_KEY = 'ollama-local';
const OLLAMA_DEFAULT_CONTEXT = 4096;  // Our recommended default (Ollama default is 2048)
```
