# SimOffice Security Audit

**Last updated:** 2026-03-27 (v2.0.8)
**Scope:** Electron configuration, dependency vulnerabilities, credential storage, hardcoded secrets

---

## Executive Summary

A full security sweep was performed on the SimOffice codebase. Two critical Electron misconfigurations were found and one was fixed (the other is a required dependency). No hardcoded secrets were found. Dependency CVEs exist in transitive dependencies of upstream packages (openclaw, @moonpay/cli). Credential storage architecture is sound.

---

## Findings

### Electron Configuration

| # | Severity | Issue | Location | Status |
|---|----------|-------|----------|--------|
| 1 | CRITICAL | `sandbox: false` on BrowserWindow | `electron/main/index.ts:165` | **Cannot fix** — required by MoonPay CLI `execFile()`. Mitigated by strict preload + contextIsolation. |
| 2 | CRITICAL | CSP `frame-ancestors` set to `*` | `electron/main/index.ts:288` | **Fixed** — tightened to `'self'` |
| 3 | HIGH | `webviewTag: true` enabled (unused) | `electron/main/index.ts:166` | **Fixed** — removed (zero `<webview>` usage in codebase) |
| 4 | MEDIUM | `shell:openPath` accepts any path from renderer | `electron/main/ipc-handlers.ts:2013` | Open |
| 5 | MEDIUM | `file:stage` copies any file without path/size validation | `electron/main/ipc-handlers.ts:2369` | Open |
| 6 | MEDIUM | File protocol handler doesn't prevent `../` traversal | `electron/main/index.ts:498` | Open |
| 7 | MEDIUM | Windows code-signing verification disabled | `electron-builder.yml:105` | Open — needs code-signing certificate |
| 8 | LOW | `app:getPath` returns any system path to renderer | `electron/main/ipc-handlers.ts:2156` | Open |

### Fixes Applied

**1. Removed `webviewTag: true`**

The `<webview>` tag was enabled to embed the OpenClaw Control UI but was replaced with an `<iframe>` on the same day (Feb 6, 2026). Zero `<webview>` elements exist in the codebase. The setting was dead code that unnecessarily expanded the attack surface.

**2. Tightened CSP `frame-ancestors` from `'self' *` to `'self'`**

The OpenClaw gateway at `127.0.0.1:18789` sets `frame-ancestors 'none'` by default. SimOffice overrides this so the Control UI can load in an iframe for chat. The wildcard `*` allowed any origin to frame the gateway — tightened to `'self'` so only the Electron app window can embed it.

### Why `sandbox: false` Cannot Be Changed

The main process spawns the MoonPay CLI binary via `execFile()` in `electron/main/ipc-handlers.ts`. Enabling the Electron sandbox restricts this capability. The risk is mitigated by:

- `contextIsolation: true` — renderer and preload are fully separated
- `nodeIntegration: false` — renderer cannot access Node.js APIs
- Strict IPC allowlist in preload — only whitelisted channels are exposed via contextBridge
- No raw `fs`, `child_process`, or other dangerous APIs are exposed to the renderer

To fully enable sandbox in the future, MoonPay CLI execution would need to be moved to Electron's `utilityProcess.fork()`.

---

## Hardcoded Secrets Scan

**Result: CLEAN**

- No hardcoded API keys, tokens, or passwords in source code
- `.env` files properly gitignored (`.env`, `.env.local`, `.env.*.local`)
- Certificate files excluded (`.p12`, `.pem`, `.key`)
- `.env.example` contains only placeholder values
- Test files use obvious fake data (`sk-test`, `clawx-test-token`)
- Stripe key patterns found are placeholder UI text only (`rk_live_your_restricted_key_here`)

### Credential Storage Architecture

- Credentials stored via electron-store in `providerSecrets` (not in source code)
- Gateway tokens generated per-install using `randomBytes(16).toString('hex')`
- Credential masking in logs via `maskSecret()` — format: `[first4]***[last4]`
- OAuth flows use standard code exchange with PKCE (Gemini, OpenAI)

### Improvement Opportunity

electron-store does not appear to use `encryptionKey`. Credentials are stored as plaintext JSON on disk at `~/Library/Application Support/simoffice/`. Adding encryption would protect credentials if the user's filesystem is compromised.

---

## Dependency Vulnerabilities

**66 total: 2 critical, 44 high, 18 moderate, 2 low**

Almost all are in transitive dependencies of upstream packages — not in SimOffice code directly. These require upstream updates to fix.

### Critical

| Package | CVE | Via | Issue |
|---------|-----|-----|-------|
| `simple-git` | GHSA-r275-fr43-pm7q | openclaw > node-llama-cpp | RCE via protocol.allow bypass |
| `basic-ftp` | GHSA-5rq4-664w-9x2c | openclaw > proxy-agent | Path traversal in downloadToDir() |

### High (Notable)

| Package | CVE | Via | Issue |
|---------|-----|-----|-------|
| `tar` | GHSA-34x7-hfp2-rc4v | openclaw | Arbitrary file overwrite via hardlink traversal |
| `axios` | GHSA-43fc-jf86-j433 | @moonpay/cli | DoS via prototype pollution |
| `bigint-buffer` | GHSA-3gc7-fjrx-p6mg | @moonpay/cli > @solana | Buffer overflow (no patch available) |
| `glob` | GHSA-5j98-mcp5-4vw2 | openclaw > google-auth-library | Command injection via -c flag |

### Action Required

These cannot be fixed by SimOffice directly. Monitor for updates to:
- `openclaw` (majority of CVEs)
- `openclaw` (basic-ftp)
- `@moonpay/cli` (axios, bigint-buffer)

Run `pnpm audit` periodically to check for upstream fixes.

---

## Open Items (Future Work)

1. **Path validation on IPC handlers** — `shell:openPath` and `file:stage` should validate paths against an allowlist of safe directories
2. **File staging limits** — Add file size limits and MIME type validation to `file:stage`
3. **File protocol traversal protection** — Normalize paths with `path.resolve()` and validate they're within expected directories
4. **electron-store encryption** — Add `encryptionKey` to credential stores
5. **Windows code-signing** — Obtain certificate and enable `verifyUpdateCodeSignature`
6. **Sandbox migration** — Move MoonPay CLI to `utilityProcess.fork()` to enable full sandbox
