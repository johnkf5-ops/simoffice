/**
 * Business Integration Registry
 *
 * Maps integration IDs to their MCP server package details.
 * envMap keys MUST match CHANNEL_META[type].configFields[n].key from src/types/channel.ts
 * because that's what the UI sends as credential keys.
 *
 * Cross-reference: docs/build-plans/business-integrations-registry.md
 */

export interface IntegrationDef {
  id: string;
  name: string;
  mcpPackage: string;
  mcpVersion: string;
  mcpBin: string;      // Relative to package root, e.g., 'dist/index.js'
  mcpArgs: string[];    // Extra args after bin path. Usually [].
  envMap: Record<string, string>;  // { CHANNEL_META_field_key: 'ENV_VAR_NAME' } — required
  optionalEnvMap?: Record<string, string>; // Same shape, passed through if present, not validated
  requiredFields?: string[];       // Extra CHANNEL_META keys validated but not in envMap (special cases)
  beta?: boolean;
}

export const INTEGRATION_REGISTRY: Record<string, IntegrationDef> = {

  // ── 1. Stripe ───────────────────────────────────────────────────
  // CHANNEL_META key: secretKey → env: STRIPE_SECRET_KEY
  // Module: commonjs
  stripe_integration: {
    id: 'stripe_integration', name: 'Stripe',
    mcpPackage: '@stripe/mcp', mcpVersion: '0.3.3',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { secretKey: 'STRIPE_SECRET_KEY' },
  },

  // ── 2. GitHub ───────────────────────────────────────────────────
  // CHANNEL_META key: token → env: GITHUB_PERSONAL_ACCESS_TOKEN
  // owner field exists in CHANNEL_META but MCP doesn't need it — not in envMap
  // Module: ESM
  github: {
    id: 'github', name: 'GitHub',
    mcpPackage: '@modelcontextprotocol/server-github', mcpVersion: '2025.4.8',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { token: 'GITHUB_PERSONAL_ACCESS_TOKEN' },
  },

  // ── 3. GitLab ───────────────────────────────────────────────────
  // CHANNEL_META key: token → env: GITLAB_PERSONAL_ACCESS_TOKEN
  // baseUrl field exists in CHANNEL_META but is optional — not in envMap
  // Module: ESM
  gitlab: {
    id: 'gitlab', name: 'GitLab',
    mcpPackage: '@modelcontextprotocol/server-gitlab', mcpVersion: '2025.4.25',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { token: 'GITLAB_PERSONAL_ACCESS_TOKEN' },
  },

  // ── 4. Linear ───────────────────────────────────────────────────
  // CHANNEL_META key: apiKey → env: LINEAR_API_KEY
  // Module: ESM
  linear: {
    id: 'linear', name: 'Linear',
    mcpPackage: 'linear-mcp-server', mcpVersion: '0.1.0',
    mcpBin: 'build/index.js', mcpArgs: [],
    envMap: { apiKey: 'LINEAR_API_KEY' },
  },

  // ── 5. Sentry ───────────────────────────────────────────────────
  // CHANNEL_META key: authToken → env: SENTRY_ACCESS_TOKEN
  // org field exists in CHANNEL_META but is not an env var — not in envMap
  // Module: ESM
  sentry: {
    id: 'sentry', name: 'Sentry',
    mcpPackage: '@sentry/mcp-server', mcpVersion: '0.31.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { authToken: 'SENTRY_ACCESS_TOKEN' },
  },

  // ── 6. Airtable ─────────────────────────────────────────────────
  // CHANNEL_META key: token → env: AIRTABLE_API_KEY
  // Module: ESM
  airtable: {
    id: 'airtable', name: 'Airtable',
    mcpPackage: 'airtable-mcp-server', mcpVersion: '1.13.0',
    mcpBin: 'dist/main.js', mcpArgs: [],
    envMap: { token: 'AIRTABLE_API_KEY' },
  },

  // ── 7. Mailchimp ────────────────────────────────────────────────
  // CHANNEL_META key: apiKey → env: MAILCHIMP_API_KEY
  // Module: ESM
  mailchimp: {
    id: 'mailchimp', name: 'Mailchimp',
    mcpPackage: '@agentx-ai/mailchimp-mcp-server', mcpVersion: '1.1.1',
    mcpBin: 'build/index.js', mcpArgs: [],
    envMap: { apiKey: 'MAILCHIMP_API_KEY' },
  },

  // ── 8. SendGrid ─────────────────────────────────────────────────
  // CHANNEL_META keys: apiKey → SENDGRID_API_KEY, fromEmail → FROM_EMAIL
  // fromEmail field ADDED to CHANNEL_META (was missing)
  // Module: ESM
  sendgrid: {
    id: 'sendgrid', name: 'SendGrid',
    mcpPackage: 'sendgrid-api-mcp-server', mcpVersion: '1.0.4',
    mcpBin: 'build/index.js', mcpArgs: [],
    envMap: { apiKey: 'SENDGRID_API_KEY', fromEmail: 'FROM_EMAIL' },
  },

  // ── 9. Datadog ──────────────────────────────────────────────────
  // CHANNEL_META keys: apiKey → DATADOG_API_KEY, appKey → DATADOG_APP_KEY
  // site field exists in CHANNEL_META but is optional — not in envMap
  // Module: ESM
  datadog: {
    id: 'datadog', name: 'Datadog',
    mcpPackage: '@winor30/mcp-server-datadog', mcpVersion: '1.7.0',
    mcpBin: 'build/index.js', mcpArgs: [],
    envMap: { apiKey: 'DATADOG_API_KEY', appKey: 'DATADOG_APP_KEY' },
    optionalEnvMap: { site: 'DATADOG_SITE' },
  },

  // ── 10. Trello ──────────────────────────────────────────────────
  // CHANNEL_META keys: apiKey → TRELLO_API_KEY, token → TRELLO_TOKEN
  // Module: ESM
  trello: {
    id: 'trello', name: 'Trello',
    mcpPackage: 'mcp-server-trello', mcpVersion: '1.0.4',
    mcpBin: 'build/index.js', mcpArgs: [],
    envMap: { apiKey: 'TRELLO_API_KEY', token: 'TRELLO_TOKEN' },
  },

  // ── 11. Zendesk ─────────────────────────────────────────────────
  // CHANNEL_META keys: email → ZENDESK_EMAIL, apiToken → ZENDESK_TOKEN,
  //                    subdomain → ZENDESK_SUBDOMAIN
  // Module: ESM
  zendesk: {
    id: 'zendesk', name: 'Zendesk',
    mcpPackage: 'zd-mcp-server', mcpVersion: '0.5.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { email: 'ZENDESK_EMAIL', apiToken: 'ZENDESK_TOKEN', subdomain: 'ZENDESK_SUBDOMAIN' },
  },

  // ── 12. HubSpot ─────────────────────────────────────────────────
  // CHANNEL_META key: accessToken → env: PRIVATE_APP_ACCESS_TOKEN
  // Source checks PRIVATE_APP_ACCESS_TOKEN first, then HUBSPOT_ACCESS_TOKEN
  // Module: ESM
  hubspot: {
    id: 'hubspot', name: 'HubSpot',
    mcpPackage: '@hubspot/mcp-server', mcpVersion: '0.4.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { accessToken: 'PRIVATE_APP_ACCESS_TOKEN' },
    beta: true,
  },

  // ── 13. Notion ──────────────────────────────────────────────────
  // CHANNEL_META key: apiKey → env: NOTION_TOKEN
  // Module: ESM
  notion: {
    id: 'notion', name: 'Notion',
    mcpPackage: '@notionhq/notion-mcp-server', mcpVersion: '2.2.1',
    mcpBin: 'bin/cli.mjs', mcpArgs: [],
    envMap: { apiKey: 'NOTION_TOKEN' },
  },

  // ── 14. Jira ────────────────────────────────────────────────────
  // CHANNEL_META keys: domain → ATLASSIAN_SITE_NAME, email → ATLASSIAN_USER_EMAIL,
  //                    apiToken → ATLASSIAN_API_TOKEN
  // domain placeholder FIXED to show site name only (was full domain)
  // Module: commonjs
  jira: {
    id: 'jira', name: 'Jira',
    mcpPackage: '@aashari/mcp-server-atlassian-jira', mcpVersion: '3.3.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { domain: 'ATLASSIAN_SITE_NAME', email: 'ATLASSIAN_USER_EMAIL', apiToken: 'ATLASSIAN_API_TOKEN' },
  },

  // ── 15. Confluence ──────────────────────────────────────────────
  // Same Atlassian auth as Jira
  // Module: commonjs
  confluence: {
    id: 'confluence', name: 'Confluence',
    mcpPackage: '@aashari/mcp-server-atlassian-confluence', mcpVersion: '3.3.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { domain: 'ATLASSIAN_SITE_NAME', email: 'ATLASSIAN_USER_EMAIL', apiToken: 'ATLASSIAN_API_TOKEN' },
  },

  // ── 16. Monday.com ⚠️ SPECIAL ──────────────────────────────────
  // Token passed via CLI arg -t (primary) AND MONDAY_TOKEN env (fallback).
  // Special case in integration-config.ts pushes '-t' + token to args.
  // CHANNEL_META key: apiToken → env: MONDAY_TOKEN
  // Module: commonjs
  monday: {
    id: 'monday', name: 'Monday.com',
    mcpPackage: '@mondaydotcomorg/monday-api-mcp', mcpVersion: '2.0.8',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { apiToken: 'MONDAY_TOKEN' },
    requiredFields: ['apiToken'],  // Also used by -t CLI arg special case
  },

  // ── 17. Asana ───────────────────────────────────────────────────
  // CHANNEL_META key: token → env: ASANA_ACCESS_TOKEN
  // Module: ESM
  asana: {
    id: 'asana', name: 'Asana',
    mcpPackage: '@roychri/mcp-server-asana', mcpVersion: '1.7.0',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { token: 'ASANA_ACCESS_TOKEN' },
  },

  // ── 18. Xero ────────────────────────────────────────────────────
  // CHANNEL_META key: bearerToken → env: XERO_CLIENT_BEARER_TOKEN
  // CHANNEL_META CHANGED from clientId/clientSecret/tenantId to single bearerToken
  // Module: ESM
  xero: {
    id: 'xero', name: 'Xero',
    mcpPackage: '@xeroapi/xero-mcp-server', mcpVersion: '0.0.14',
    mcpBin: 'dist/index.js', mcpArgs: [],
    envMap: { bearerToken: 'XERO_CLIENT_BEARER_TOKEN' },
  },

  // ── 19. Calendly ────────────────────────────────────────────────
  // CHANNEL_META key: apiToken → env: CALENDLY_ACCESS_TOKEN
  // Module: ESM
  calendly: {
    id: 'calendly', name: 'Calendly',
    mcpPackage: 'calendly-mcp-server', mcpVersion: '1.0.0',
    mcpBin: 'bin/calendly-mcp-server.js', mcpArgs: [],
    envMap: { apiToken: 'CALENDLY_ACCESS_TOKEN' },
  },

  // ── 20. PandaDoc ⚠️ SPECIAL ────────────────────────────────────
  // Uses mcp-remote proxy to hosted MCP at developers.pandadoc.com/mcp.
  // API key passed via --header CLI arg, not env var.
  // Special case in integration-config.ts pushes URL + header to args.
  // CHANNEL_META key: apiKey — used by special case code, not envMap
  // Module: ESM
  pandadoc: {
    id: 'pandadoc', name: 'PandaDoc',
    mcpPackage: 'mcp-remote', mcpVersion: '0.1.38',
    mcpBin: 'dist/proxy.js', mcpArgs: [],
    envMap: {},
    requiredFields: ['apiKey'],  // Used by --header CLI arg special case
  },
};
