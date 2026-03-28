/**
 * MCP Server Package Installer
 *
 * Installs MCP npm packages to ~/.openclaw/mcp-servers/{id}/.
 * Uses npm (NOT pnpm) — pnpm causes ERR_MODULE_NOT_FOUND (see bundle-moonpay.mjs:33).
 */
import { execFile } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { IntegrationDef } from './integration-registry';
import { prependPathEntry } from './env-path';

const MCP_SERVERS_DIR = join(homedir(), '.openclaw', 'mcp-servers');

/**
 * Build an env with PATH that includes common npm locations.
 * On macOS, apps launched from Dock inherit a minimal PATH that
 * typically doesn't include /usr/local/bin, Homebrew, or nvm paths.
 */
function buildEnvWithNpmPath(): Record<string, string | undefined> {
  let env: Record<string, string | undefined> = { ...process.env };
  const home = homedir();
  const extraPaths = [
    '/usr/local/bin',                          // macOS default npm location
    '/opt/homebrew/bin',                        // Apple Silicon Homebrew
    join(home, '.nvm/versions/node', 'current', 'bin'),  // nvm (if symlinked)
    join(home, '.volta/bin'),                   // Volta
    join(home, '.fnm/current/bin'),             // fnm
    join(home, '.local/share/fnm/aliases/default/bin'),   // fnm alt
  ];
  for (const p of extraPaths) {
    env = prependPathEntry(env, p).env;
  }
  return env;
}

export async function ensureMcpServerInstalled(def: IntegrationDef): Promise<string> {
  const serverDir = join(MCP_SERVERS_DIR, def.id);
  const markerFile = join(serverDir, '.installed-version');

  // Already installed at correct version?
  if (existsSync(markerFile)) {
    const installed = readFileSync(markerFile, 'utf-8').trim();
    if (installed === def.mcpVersion) {
      return join(serverDir, 'node_modules', def.mcpPackage, def.mcpBin);
    }
  }

  // Install
  mkdirSync(serverDir, { recursive: true });
  writeFileSync(
    join(serverDir, 'package.json'),
    JSON.stringify({
      name: `mcp-${def.id}`,
      private: true,
      dependencies: { [def.mcpPackage]: def.mcpVersion },
    }),
    'utf-8',
  );

  await new Promise<void>((resolve, reject) => {
    execFile('npm', ['install', '--legacy-peer-deps', '--no-fund', '--no-audit'], {
      cwd: serverDir,
      timeout: 120_000,
      env: buildEnvWithNpmPath(),
    }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(`npm install failed for ${def.mcpPackage}: ${stderr || error.message}`));
        return;
      }
      writeFileSync(markerFile, def.mcpVersion, 'utf-8');
      resolve();
    });
  });

  return join(serverDir, 'node_modules', def.mcpPackage, def.mcpBin);
}
