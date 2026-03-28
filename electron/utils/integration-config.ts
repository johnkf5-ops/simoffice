/**
 * Business Integration Config
 *
 * Reads/writes MCP config to openclaw.json for business integrations.
 * Uses the existing withConfigLock() mutex (config-mutex.ts).
 *
 * DO NOT touch MoonPay — this code only writes to mcpServers[def.id],
 * never mcpServers.moonpay.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { INTEGRATION_REGISTRY } from './integration-registry';
import { ensureMcpServerInstalled } from './mcp-installer';
import { withConfigLock } from './config-mutex';

const CONFIG_PATH = join(homedir(), '.openclaw', 'openclaw.json');

export async function configureIntegration(
  integrationId: string,
  credentials: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const def = INTEGRATION_REGISTRY[integrationId];
  if (!def) return { success: false, error: `Unknown integration: ${integrationId}` };

  // Validate required fields: envMap keys + any extra requiredFields (special cases)
  const fieldsToValidate = new Set([...Object.keys(def.envMap), ...(def.requiredFields || [])]);
  for (const fieldKey of fieldsToValidate) {
    if (!credentials[fieldKey]?.trim()) {
      return { success: false, error: `Missing required field: ${fieldKey}` };
    }
  }

  return withConfigLock(async () => {
    try {
      // 1. Install MCP package
      const mcpBinPath = await ensureMcpServerInstalled(def);

      // 2. Read config
      let config: Record<string, any> = {};
      if (existsSync(CONFIG_PATH)) config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

      // 3. Build env vars from credentials
      const env: Record<string, string> = { ELECTRON_RUN_AS_NODE: '1' };
      for (const [fieldKey, envVar] of Object.entries(def.envMap)) {
        env[envVar] = credentials[fieldKey].trim();
      }
      // Pass through optional env vars if the user provided them
      for (const [fieldKey, envVar] of Object.entries(def.optionalEnvMap || {})) {
        if (credentials[fieldKey]?.trim()) {
          env[envVar] = credentials[fieldKey].trim();
        }
      }
      // Merge static env vars (provider-specific settings like IMAP/SMTP hosts)
      if (def.staticEnv) {
        Object.assign(env, def.staticEnv);
      }

      // 4. Build MCP server entry
      //    Universal launcher: require() for CJS (+ call main() if guarded by
      //    `require.main === module`), fall back to import() for ESM packages.
      //    This handles all 20 integrations: 4 CJS + 16 ESM.
      const callMain = '(m)=>{if(typeof m.main==="function"){const r=m.main();if(r&&typeof r.catch==="function")r.catch(e=>{console.error(e);process.exit(1)})}}';
      const onErr = '(e)=>{console.error(e);process.exit(1)}';
      const launcher = [
        'delete process.versions.electron',
        'process.execArgv=[]',
        `const _c=${callMain}`,
        `try{_c(require(process.argv[1]))}catch(e){if(e.code==="ERR_REQUIRE_ESM")import(process.argv[1]).then(_c).catch(${onErr});else throw e}`,
      ].join(';');
      const mcpEntry: Record<string, any> = {
        command: process.execPath,
        args: ['-e', launcher, mcpBinPath, ...def.mcpArgs],
        env,
      };

      // Special case: Monday.com — token passed via CLI arg
      if (def.id === 'monday' && credentials.apiToken) {
        mcpEntry.args.push('-t', credentials.apiToken.trim());
      }

      // Special case: PandaDoc — remote proxy with header auth
      if (def.id === 'pandadoc' && credentials.apiKey) {
        mcpEntry.args.push(
          'https://developers.pandadoc.com/mcp',
          '--header',
          `Authorization:API-Key ${credentials.apiKey.trim()}`,
        );
      }

      // 5. Write to plugins.entries.acpx.config.mcpServers.{id}
      if (!config.plugins) config.plugins = {};
      if (!config.plugins.entries) config.plugins.entries = {};
      if (!config.plugins.entries.acpx) config.plugins.entries.acpx = {};
      config.plugins.entries.acpx.enabled = true;
      if (!config.plugins.entries.acpx.config) config.plugins.entries.acpx.config = {};
      if (!config.plugins.entries.acpx.config.mcpServers) config.plugins.entries.acpx.config.mcpServers = {};
      config.plugins.entries.acpx.config.mcpServers[def.id] = mcpEntry;

      // 6. Ensure acpx in plugins.allow (append only — never filter existing entries)
      const allow = Array.isArray(config.plugins.allow) ? config.plugins.allow : [];
      if (!allow.includes('acpx')) {
        config.plugins.allow = [...allow, 'acpx'];
      }

      // 7. Write back
      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

export function getIntegrationStatus(integrationId: string): { configured: boolean } {
  try {
    if (!existsSync(CONFIG_PATH)) return { configured: false };
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return { configured: !!config?.plugins?.entries?.acpx?.config?.mcpServers?.[integrationId] };
  } catch {
    return { configured: false };
  }
}

export async function removeIntegration(
  integrationId: string,
): Promise<{ success: boolean; error?: string }> {
  return withConfigLock(async () => {
    try {
      if (!existsSync(CONFIG_PATH)) return { success: true };
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      const servers = config?.plugins?.entries?.acpx?.config?.mcpServers;
      if (servers?.[integrationId]) {
        delete servers[integrationId];
        writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
