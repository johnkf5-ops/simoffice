#!/usr/bin/env zx
/**
 * bundle-moonpay.mjs
 *
 * Installs @moonpay/cli into a staging directory using npm (not pnpm).
 * npm's flat deduplication handles version conflicts in @moonpay/cli's deep
 * crypto dep tree (@noble/hashes, @scure/bip32, viem, etc.) correctly.
 * pnpm's virtual store + manual BFS flat copy causes ERR_MODULE_NOT_FOUND
 * when two packages need different versions of the same dep.
 *
 * Output: build/moonpay-cli/node_modules/ (npm-resolved, flat, symlink-free)
 * Used by: after-pack.cjs (copied to resources/moonpay-cli/node_modules/)
 * Pointed to by: getMoonPayBin() in ipc-handlers.ts (production path)
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STAGING = join(ROOT, 'build', 'moonpay-cli');

console.log('📦 Bundling @moonpay/cli via npm...');

// Read the exact installed version from pnpm's node_modules
const installedPkg = JSON.parse(
  (await fs.readFile(join(ROOT, 'node_modules/@moonpay/cli/package.json'), 'utf8'))
);
const version = installedPkg.version;
console.log(`   version: ${version}`);

// Clean and recreate staging dir
if (existsSync(STAGING)) rmSync(STAGING, { recursive: true, force: true });
mkdirSync(STAGING, { recursive: true });

// Write minimal package.json
writeFileSync(join(STAGING, 'package.json'), JSON.stringify({
  name: 'moonpay-cli-bundle',
  version: '1.0.0',
  private: true,
  dependencies: { '@moonpay/cli': version },
}, null, 2));

// npm install — flat dedup resolves version conflicts correctly
console.log('   Running npm install (this handles version conflicts)...');
execSync('npm install --legacy-peer-deps --no-fund --no-audit --prefer-offline', {
  cwd: STAGING,
  stdio: 'inherit',
});

// Remove all .bin/ directories — npm creates symlinks in .bin/ that point
// outside the bundle, causing macOS codesign to reject them.
const { readdirSync, rmSync: rmSyncNode, statSync } = await import('fs');
function removeBinDirs(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.bin') {
        rmSyncNode(full, { recursive: true, force: true });
      } else {
        removeBinDirs(full);
      }
    }
  }
}
const nmDir = join(STAGING, 'node_modules');
removeBinDirs(nmDir);
console.log('   Removed .bin/ symlink directories.');

console.log(`✅ @moonpay/cli bundle ready: ${STAGING}/node_modules`);
