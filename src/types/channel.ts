/**
 * Channel Type Definitions
 * Types for messaging channels (WhatsApp, Telegram, etc.)
 */

/**
 * Supported channel types
 */
export type ChannelType =
  | 'whatsapp'
  | 'dingtalk'
  | 'telegram'
  | 'discord'
  | 'signal'
  | 'feishu'
  | 'wecom'
  | 'imessage'
  | 'matrix'
  | 'line'
  | 'msteams'
  | 'googlechat'
  | 'mattermost'
  | 'qqbot'
  | 'hubspot'
  | 'pandadoc'
  | 'slack'
  | 'google_workspace'
  | 'notion'
  | 'github'
  | 'jira'
  | 'stripe_integration'
  | 'zapier'
  | 'salesforce'
  | 'mailchimp'
  | 'sendgrid'
  | 'calendly'
  | 'intercom'
  | 'gitlab'
  | 'linear'
  | 'sentry'
  | 'datadog'
  | 'vercel'
  | 'airtable'
  | 'monday'
  | 'asana'
  | 'trello'
  | 'confluence'
  | 'quickbooks'
  | 'docusign'
  | 'xero'
  | 'twilio'
  | 'zendesk';

/**
 * Channel connection status
 */
export type ChannelStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Channel connection type
 */
export type ChannelConnectionType = 'token' | 'qr' | 'oauth' | 'webhook';

/**
 * Channel data structure
 */
export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  status: ChannelStatus;
  accountId?: string;
  lastActivity?: string;
  error?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Channel configuration field definition
 */
export interface ChannelConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  envVar?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

/**
 * Channel metadata with configuration info
 */
export interface ChannelMeta {
  id: ChannelType;
  name: string;
  icon: string;
  description: string;
  connectionType: ChannelConnectionType;
  docsUrl: string;
  configFields: ChannelConfigField[];
  instructions: string[];
  isPlugin?: boolean;
}

/**
 * Channel icons mapping
 */
export const CHANNEL_ICONS: Record<ChannelType, string> = {
  whatsapp: '📱',
  dingtalk: '💬',
  telegram: '✈️',
  discord: '🎮',
  signal: '🔒',
  feishu: '🐦',
  wecom: '💼',
  imessage: '💬',
  matrix: '🔗',
  line: '🟢',
  msteams: '👔',
  googlechat: '💭',
  mattermost: '💠',
  qqbot: '🐧',
  hubspot: '🟠',
  pandadoc: '🐼',
  slack: '💬',
  google_workspace: '📧',
  notion: '📝',
  github: '🐙',
  jira: '📋',
  stripe_integration: '💳',
  zapier: '⚡',
  salesforce: '☁️',
  mailchimp: '🐵',
  sendgrid: '📨',
  calendly: '📅',
  intercom: '💬',
  gitlab: '🦊',
  linear: '🔷',
  sentry: '🛡️',
  datadog: '🐕',
  vercel: '▲',
  airtable: '📊',
  monday: '🟣',
  asana: '🔺',
  trello: '📌',
  confluence: '📘',
  quickbooks: '💰',
  docusign: '✍️',
  xero: '📗',
  twilio: '📞',
  zendesk: '🎧',
};

/**
 * Channel display names
 */
export const CHANNEL_NAMES: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  dingtalk: 'DingTalk',
  telegram: 'Telegram',
  discord: 'Discord',
  signal: 'Signal',
  feishu: 'Feishu / Lark',
  wecom: 'WeCom',
  imessage: 'iMessage',
  matrix: 'Matrix',
  line: 'LINE',
  msteams: 'Microsoft Teams',
  googlechat: 'Google Chat',
  mattermost: 'Mattermost',
  qqbot: 'QQ Bot',
  hubspot: 'HubSpot',
  pandadoc: 'PandaDoc',
  slack: 'Slack',
  google_workspace: 'Google Workspace',
  notion: 'Notion',
  github: 'GitHub',
  jira: 'Jira',
  stripe_integration: 'Stripe',
  zapier: 'Zapier',
  salesforce: 'Salesforce',
  mailchimp: 'Mailchimp',
  sendgrid: 'SendGrid',
  calendly: 'Calendly',
  intercom: 'Intercom',
  gitlab: 'GitLab',
  linear: 'Linear',
  sentry: 'Sentry',
  datadog: 'Datadog',
  vercel: 'Vercel',
  airtable: 'Airtable',
  monday: 'Monday.com',
  asana: 'Asana',
  trello: 'Trello',
  confluence: 'Confluence',
  quickbooks: 'QuickBooks',
  docusign: 'DocuSign',
  xero: 'Xero',
  twilio: 'Twilio',
  zendesk: 'Zendesk',
};

/**
 * Channel metadata with configuration information
 */
export const CHANNEL_META: Record<ChannelType, ChannelMeta> = {
  qqbot: {
    id: 'qqbot',
    name: 'QQ Bot',
    icon: '🐧',
    description: 'channels:meta.qqbot.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.qqbot.docsUrl',
    configFields: [
      {
        key: 'appId',
        label: 'channels:meta.qqbot.fields.appId.label',
        type: 'text',
        placeholder: 'channels:meta.qqbot.fields.appId.placeholder',
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'channels:meta.qqbot.fields.clientSecret.label',
        type: 'password',
        placeholder: 'channels:meta.qqbot.fields.clientSecret.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.qqbot.instructions.0',
      'channels:meta.qqbot.instructions.1',
      'channels:meta.qqbot.instructions.2',
    ],
    isPlugin: true,
  },
  dingtalk: {
    id: 'dingtalk',
    name: 'DingTalk',
    icon: '💬',
    description: 'channels:meta.dingtalk.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.dingtalk.docsUrl',
    configFields: [
      {
        key: 'clientId',
        label: 'channels:meta.dingtalk.fields.clientId.label',
        type: 'text',
        placeholder: 'channels:meta.dingtalk.fields.clientId.placeholder',
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'channels:meta.dingtalk.fields.clientSecret.label',
        type: 'password',
        placeholder: 'channels:meta.dingtalk.fields.clientSecret.placeholder',
        required: true,
      },
      {
        key: 'robotCode',
        label: 'channels:meta.dingtalk.fields.robotCode.label',
        type: 'text',
        placeholder: 'channels:meta.dingtalk.fields.robotCode.placeholder',
        required: false,
      },
      {
        key: 'corpId',
        label: 'channels:meta.dingtalk.fields.corpId.label',
        type: 'text',
        placeholder: 'channels:meta.dingtalk.fields.corpId.placeholder',
        required: false,
      },
      {
        key: 'agentId',
        label: 'channels:meta.dingtalk.fields.agentId.label',
        type: 'text',
        placeholder: 'channels:meta.dingtalk.fields.agentId.placeholder',
        required: false,
      },
    ],
    instructions: [
      'channels:meta.dingtalk.instructions.0',
      'channels:meta.dingtalk.instructions.1',
      'channels:meta.dingtalk.instructions.2',
      'channels:meta.dingtalk.instructions.3',
    ],
    isPlugin: true,
  },
  wecom: {
    id: 'wecom',
    name: 'WeCom',
    icon: '💼',
    description: 'channels:meta.wecom.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.wecom.docsUrl',
    configFields: [
      {
        key: 'botId',
        label: 'channels:meta.wecom.fields.botId.label',
        type: 'text',
        placeholder: 'channels:meta.wecom.fields.botId.placeholder',
        required: true,
      },
      {
        key: 'secret',
        label: 'channels:meta.wecom.fields.secret.label',
        type: 'password',
        placeholder: 'channels:meta.wecom.fields.secret.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.wecom.instructions.0',
      'channels:meta.wecom.instructions.1',
      'channels:meta.wecom.instructions.2',
    ],
    isPlugin: true,
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    description: 'channels:meta.telegram.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.telegram.docsUrl',
    configFields: [
      {
        key: 'botToken',
        label: 'channels:meta.telegram.fields.botToken.label',
        type: 'password',
        placeholder: 'channels:meta.telegram.fields.botToken.placeholder',
        required: true,
        envVar: 'TELEGRAM_BOT_TOKEN',
      },
      {
        key: 'allowedUsers',
        label: 'channels:meta.telegram.fields.allowedUsers.label',
        type: 'text',
        placeholder: 'channels:meta.telegram.fields.allowedUsers.placeholder',
        description: 'channels:meta.telegram.fields.allowedUsers.description',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.telegram.instructions.0',
      'channels:meta.telegram.instructions.1',
      'channels:meta.telegram.instructions.2',
      'channels:meta.telegram.instructions.3',
      'channels:meta.telegram.instructions.4',
    ],
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'channels:meta.discord.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.discord.docsUrl',
    configFields: [
      {
        key: 'token',
        label: 'channels:meta.discord.fields.token.label',
        type: 'password',
        placeholder: 'channels:meta.discord.fields.token.placeholder',
        required: true,
        envVar: 'DISCORD_BOT_TOKEN',
      },
      {
        key: 'guildId',
        label: 'channels:meta.discord.fields.guildId.label',
        type: 'text',
        placeholder: 'channels:meta.discord.fields.guildId.placeholder',
        required: true,
        description: 'channels:meta.discord.fields.guildId.description',
      },
      {
        key: 'channelId',
        label: 'channels:meta.discord.fields.channelId.label',
        type: 'text',
        placeholder: 'channels:meta.discord.fields.channelId.placeholder',
        required: false,
        description: 'channels:meta.discord.fields.channelId.description',
      },
    ],
    instructions: [
      'channels:meta.discord.instructions.0',
      'channels:meta.discord.instructions.1',
      'channels:meta.discord.instructions.2',
      'channels:meta.discord.instructions.3',
      'channels:meta.discord.instructions.4',
      'channels:meta.discord.instructions.5',
    ],
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    description: 'channels:meta.whatsapp.description',
    connectionType: 'qr',
    docsUrl: 'channels:meta.whatsapp.docsUrl',
    configFields: [],
    instructions: [
      'channels:meta.whatsapp.instructions.0',
      'channels:meta.whatsapp.instructions.1',
      'channels:meta.whatsapp.instructions.2',
      'channels:meta.whatsapp.instructions.3',
    ],
  },
  signal: {
    id: 'signal',
    name: 'Signal',
    icon: '🔒',
    description: 'channels:meta.signal.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.signal.docsUrl',
    configFields: [
      {
        key: 'phoneNumber',
        label: 'channels:meta.signal.fields.phoneNumber.label',
        type: 'text',
        placeholder: 'channels:meta.signal.fields.phoneNumber.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.signal.instructions.0',
      'channels:meta.signal.instructions.1',
      'channels:meta.signal.instructions.2',
    ],
  },
  feishu: {
    id: 'feishu',
    name: 'Feishu / Lark',
    icon: '🐦',
    description: 'channels:meta.feishu.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.feishu.docsUrl',
    configFields: [
      {
        key: 'appId',
        label: 'channels:meta.feishu.fields.appId.label',
        type: 'text',
        placeholder: 'channels:meta.feishu.fields.appId.placeholder',
        required: true,
        envVar: 'FEISHU_APP_ID',
      },
      {
        key: 'appSecret',
        label: 'channels:meta.feishu.fields.appSecret.label',
        type: 'password',
        placeholder: 'channels:meta.feishu.fields.appSecret.placeholder',
        required: true,
        envVar: 'FEISHU_APP_SECRET',
      },
    ],
    instructions: [
      'channels:meta.feishu.instructions.0',
      'channels:meta.feishu.instructions.1',
      'channels:meta.feishu.instructions.2',
      'channels:meta.feishu.instructions.3',
    ],
    isPlugin: true,
  },
  imessage: {
    id: 'imessage',
    name: 'iMessage',
    icon: '💬',
    description: 'channels:meta.imessage.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.imessage.docsUrl',
    configFields: [
      {
        key: 'serverUrl',
        label: 'channels:meta.imessage.fields.serverUrl.label',
        type: 'text',
        placeholder: 'channels:meta.imessage.fields.serverUrl.placeholder',
        required: true,
      },
      {
        key: 'password',
        label: 'channels:meta.imessage.fields.password.label',
        type: 'password',
        placeholder: 'channels:meta.imessage.fields.password.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.imessage.instructions.0',
      'channels:meta.imessage.instructions.1',
      'channels:meta.imessage.instructions.2',
    ],
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    icon: '🔗',
    description: 'channels:meta.matrix.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.matrix.docsUrl',
    configFields: [
      {
        key: 'homeserver',
        label: 'channels:meta.matrix.fields.homeserver.label',
        type: 'text',
        placeholder: 'channels:meta.matrix.fields.homeserver.placeholder',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'channels:meta.matrix.fields.accessToken.label',
        type: 'password',
        placeholder: 'channels:meta.matrix.fields.accessToken.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.matrix.instructions.0',
      'channels:meta.matrix.instructions.1',
      'channels:meta.matrix.instructions.2',
    ],
    isPlugin: true,
  },
  line: {
    id: 'line',
    name: 'LINE',
    icon: '🟢',
    description: 'channels:meta.line.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.line.docsUrl',
    configFields: [
      {
        key: 'channelAccessToken',
        label: 'channels:meta.line.fields.channelAccessToken.label',
        type: 'password',
        placeholder: 'channels:meta.line.fields.channelAccessToken.placeholder',
        required: true,
        envVar: 'LINE_CHANNEL_ACCESS_TOKEN',
      },
      {
        key: 'channelSecret',
        label: 'channels:meta.line.fields.channelSecret.label',
        type: 'password',
        placeholder: 'channels:meta.line.fields.channelSecret.placeholder',
        required: true,
        envVar: 'LINE_CHANNEL_SECRET',
      },
    ],
    instructions: [
      'channels:meta.line.instructions.0',
      'channels:meta.line.instructions.1',
      'channels:meta.line.instructions.2',
    ],
    isPlugin: true,
  },
  msteams: {
    id: 'msteams',
    name: 'Microsoft Teams',
    icon: '👔',
    description: 'channels:meta.msteams.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.msteams.docsUrl',
    configFields: [
      {
        key: 'appId',
        label: 'channels:meta.msteams.fields.appId.label',
        type: 'text',
        placeholder: 'channels:meta.msteams.fields.appId.placeholder',
        required: true,
        envVar: 'MSTEAMS_APP_ID',
      },
      {
        key: 'appPassword',
        label: 'channels:meta.msteams.fields.appPassword.label',
        type: 'password',
        placeholder: 'channels:meta.msteams.fields.appPassword.placeholder',
        required: true,
        envVar: 'MSTEAMS_APP_PASSWORD',
      },
    ],
    instructions: [
      'channels:meta.msteams.instructions.0',
      'channels:meta.msteams.instructions.1',
      'channels:meta.msteams.instructions.2',
      'channels:meta.msteams.instructions.3',
    ],
    isPlugin: true,
  },
  googlechat: {
    id: 'googlechat',
    name: 'Google Chat',
    icon: '💭',
    description: 'channels:meta.googlechat.description',
    connectionType: 'webhook',
    docsUrl: 'channels:meta.googlechat.docsUrl',
    configFields: [
      {
        key: 'serviceAccountKey',
        label: 'channels:meta.googlechat.fields.serviceAccountKey.label',
        type: 'text',
        placeholder: 'channels:meta.googlechat.fields.serviceAccountKey.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.googlechat.instructions.0',
      'channels:meta.googlechat.instructions.1',
      'channels:meta.googlechat.instructions.2',
      'channels:meta.googlechat.instructions.3',
    ],
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🟠',
    description: 'Connect your HubSpot CRM',
    connectionType: 'token',
    docsUrl: 'https://developers.hubspot.com/docs/api/private-apps',
    configFields: [
      {
        key: 'accessToken',
        label: 'Private App Access Token',
        type: 'password',
        placeholder: 'pat-na1-... or pat-eu1-...',
        required: true,
        envVar: 'HUBSPOT_ACCESS_TOKEN',
      },
    ],
    instructions: [
      'Go to HubSpot → Settings → Integrations → Private Apps',
      'Click "Create a private app" and name it SimOffice',
      'Under Scopes, enable: crm.objects.contacts, crm.objects.deals, crm.objects.companies',
      'Click "Create app" and copy your access token',
    ],
  },
  google_workspace: {
    id: 'google_workspace',
    name: 'Google Workspace',
    icon: '📧',
    description: 'Connect Gmail, Calendar, and Drive',
    connectionType: 'token',
    docsUrl: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
    configFields: [
      {
        key: 'serviceAccountKey',
        label: 'Service Account JSON Key',
        type: 'password',
        placeholder: 'Paste the contents of your service account JSON...',
        required: true,
        envVar: 'GOOGLE_SERVICE_ACCOUNT_KEY',
      },
    ],
    instructions: [
      'Go to Google Cloud Console → APIs & Services → Credentials',
      'Create a Service Account, then create a JSON key for it',
      'Enable Gmail API, Calendar API, and Drive API',
      'Share your calendar/drive with the service account email',
    ],
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Connect Notion for pages, databases, and project boards',
    connectionType: 'token',
    docsUrl: 'https://www.notion.so/my-integrations',
    configFields: [
      {
        key: 'apiKey',
        label: 'Internal Integration Token',
        type: 'password',
        placeholder: 'ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        envVar: 'NOTION_API_KEY',
      },
    ],
    instructions: [
      'Go to notion.so/my-integrations and click "New integration"',
      'Name it "SimOffice" and select your workspace',
      'Copy the Internal Integration Token',
      'Share the Notion pages/databases you want agents to access with the integration',
    ],
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Connect GitHub for repos, PRs, issues, and deploys',
    connectionType: 'token',
    docsUrl: 'https://github.com/settings/personal-access-tokens',
    configFields: [
      {
        key: 'token',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'github_pat_xxxxxxxxxxxx...',
        required: true,
        envVar: 'GITHUB_TOKEN',
      },
      {
        key: 'owner',
        label: 'Owner / Organization',
        type: 'text',
        placeholder: 'e.g. your-username or your-org',
        required: false,
        description: 'Default repo owner for agent operations',
      },
    ],
    instructions: [
      'Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens',
      'Click "Generate new token"',
      'Give it repo, issues, and pull request permissions',
      'Copy the token (starts with ghp_)',
    ],
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    icon: '📋',
    description: 'Connect Jira for tickets, sprints, and project tracking',
    connectionType: 'token',
    docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    configFields: [
      {
        key: 'email',
        label: 'Atlassian Email',
        type: 'text',
        placeholder: 'you@company.com',
        required: true,
      },
      {
        key: 'apiToken',
        label: 'API Token',
        type: 'password',
        placeholder: 'Paste your Atlassian API token...',
        required: true,
        envVar: 'JIRA_API_TOKEN',
      },
      {
        key: 'domain',
        label: 'Jira Domain',
        type: 'text',
        placeholder: 'your-company.atlassian.net',
        required: true,
      },
    ],
    instructions: [
      'Go to id.atlassian.com → Security → Create and manage API tokens',
      'Click "Create API token" and name it "SimOffice"',
      'Copy the token and enter it with your email and Jira domain below',
    ],
  },
  stripe_integration: {
    id: 'stripe_integration',
    name: 'Stripe',
    icon: '💳',
    description: 'Connect Stripe for revenue tracking, invoices, and subscriptions',
    connectionType: 'token',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    configFields: [
      {
        key: 'secretKey',
        label: 'Secret Key (Restricted)',
        type: 'password',
        placeholder: 'rk_live_your_restricted_key_here',
        required: true,
        envVar: 'STRIPE_SECRET_KEY',
        description: 'Use a restricted key with read-only access for safety',
      },
    ],
    instructions: [
      'Go to Stripe Dashboard → Developers → API Keys',
      'Create a Restricted Key with read-only permissions',
      'Enable: Charges (Read), Customers (Read), Subscriptions (Read), Invoices (Read)',
      'Copy the restricted key (starts with rk_live_)',
    ],
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    description: 'Connect Salesforce CRM for leads, opportunities, and accounts',
    connectionType: 'token',
    docsUrl: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create_api_integration.htm',
    configFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://yourcompany.my.salesforce.com', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text' as const, placeholder: 'Paste your Salesforce Consumer Key...', required: true, envVar: 'SALESFORCE_CONSUMER_KEY' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password' as const, placeholder: 'Paste your Salesforce Consumer Secret...', required: true, envVar: 'SALESFORCE_CONSUMER_SECRET' },
    ],
    instructions: ['Go to Salesforce Setup → Apps → App Manager → New Connected App', 'Enable OAuth and select scopes: api, refresh_token', 'Generate an access token or use the OAuth flow', 'Copy your instance URL and access token'],
  },
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: '🐵',
    description: 'Connect Mailchimp for email campaigns and audience management',
    connectionType: 'token',
    docsUrl: 'https://mailchimp.com',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usXX', required: true, envVar: 'MAILCHIMP_API_KEY' },
    ],
    instructions: ['Go to Mailchimp → Account → Extras → API Keys', 'Click "Create A Key"', 'Copy the key — the suffix (e.g. -us21) indicates your data center'],
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: '📨',
    description: 'Connect SendGrid for transactional email and templates',
    connectionType: 'token',
    docsUrl: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'SENDGRID_API_KEY' },
    ],
    instructions: ['Go to SendGrid → Settings → API Keys', 'Click "Create API Key" with Full Access or Restricted Access', 'Copy the key — you won\'t see it again'],
  },
  calendly: {
    id: 'calendly',
    name: 'Calendly',
    icon: '📅',
    description: 'Connect Calendly for scheduling, events, and availability',
    connectionType: 'token',
    docsUrl: 'https://developer.calendly.com/api-docs',
    configFields: [
      { key: 'apiToken', label: 'Personal Access Token', type: 'password', placeholder: 'eyJhbGciOiJIUzI1NiJ9...', required: true, envVar: 'CALENDLY_API_TOKEN' },
    ],
    instructions: ['Go to Calendly → Integrations → API & Webhooks', 'Click "Get a token now" under Personal Access Tokens', 'Copy the token'],
  },
  intercom: {
    id: 'intercom',
    name: 'Intercom',
    icon: '💬',
    description: 'Connect Intercom for customer conversations and support',
    connectionType: 'token',
    docsUrl: 'https://developers.intercom.com/docs/build-an-integration/learn-more/authentication',
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'dG9rOxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'INTERCOM_ACCESS_TOKEN' },
    ],
    instructions: ['Go to Intercom → Settings → Integrations → Developer Hub', 'Create a new app or use an existing one', 'Go to Authentication and copy the Access Token'],
  },
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    description: 'Connect GitLab for repos, merge requests, and CI/CD pipelines',
    connectionType: 'token',
    docsUrl: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
    configFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'glpat-xxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'GITLAB_TOKEN' },
      { key: 'baseUrl', label: 'GitLab URL', type: 'text', placeholder: 'https://gitlab.com (or your self-hosted URL)', required: false, description: 'Leave blank for gitlab.com' },
    ],
    instructions: ['Go to GitLab → Preferences → Access Tokens', 'Click "Add new token"', 'Name it "SimOffice", select scopes: api, read_repository, write_repository', 'Copy the token (starts with glpat-)'],
  },
  linear: {
    id: 'linear',
    name: 'Linear',
    icon: '🔷',
    description: 'Connect Linear for issue tracking, projects, and cycles',
    connectionType: 'token',
    docsUrl: 'https://linear.app/docs/graphql/working-with-the-graphql-api',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'LINEAR_API_KEY' },
    ],
    instructions: ['Go to Linear → Settings → API → Personal API Keys', 'Click "Create key"', 'Name it "SimOffice" and copy the key'],
  },
  sentry: {
    id: 'sentry',
    name: 'Sentry',
    icon: '🛡️',
    description: 'Connect Sentry for error tracking, alerts, and release management',
    connectionType: 'token',
    docsUrl: 'https://docs.sentry.io/api/auth/',
    configFields: [
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'SENTRY_AUTH_TOKEN' },
      { key: 'org', label: 'Organization Slug', type: 'text', placeholder: 'your-org-slug', required: true },
    ],
    instructions: ['Go to Sentry → Settings → Auth Tokens', 'Click "Create New Token"', 'Select scopes: project:read, event:read, org:read', 'Copy the token and enter your org slug'],
  },
  datadog: {
    id: 'datadog',
    name: 'Datadog',
    icon: '🐕',
    description: 'Connect Datadog for metrics, monitors, and dashboards',
    connectionType: 'token',
    docsUrl: 'https://docs.datadoghq.com/account_management/api-app-keys/',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Paste your Datadog API key...', required: true, envVar: 'DATADOG_API_KEY' },
      { key: 'appKey', label: 'Application Key', type: 'password', placeholder: 'Paste your Datadog app key...', required: true, envVar: 'DATADOG_APP_KEY' },
      { key: 'site', label: 'Datadog Site', type: 'text', placeholder: 'datadoghq.com', required: false, description: 'e.g. datadoghq.eu for EU' },
    ],
    instructions: ['Go to Datadog → Organization Settings → API Keys → New Key', 'Then go to Application Keys → New Key', 'Copy both keys'],
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    description: 'Connect Vercel for deployment status, domains, and projects',
    connectionType: 'token',
    docsUrl: 'https://vercel.com/account/tokens',
    configFields: [
      { key: 'token', label: 'API Token', type: 'password', placeholder: 'Paste your Vercel token...', required: true, envVar: 'VERCEL_TOKEN' },
    ],
    instructions: ['Go to Vercel → Settings → Tokens', 'Click "Create" and name it "SimOffice"', 'Set scope to your account or team', 'Copy the token'],
  },
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    icon: '📊',
    description: 'Connect Airtable for bases, tables, and records',
    connectionType: 'token',
    docsUrl: 'https://airtable.com/create/tokens',
    configFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'pat.xxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true, envVar: 'AIRTABLE_TOKEN' },
    ],
    instructions: ['Go to airtable.com/create/tokens', 'Click "Create new token"', 'Name it "SimOffice", add scopes: data.records:read, data.records:write, schema.bases:read', 'Select which bases to grant access to, then create'],
  },
  monday: {
    id: 'monday',
    name: 'Monday.com',
    icon: '🟣',
    description: 'Connect Monday.com for boards, items, and project management',
    connectionType: 'token',
    docsUrl: 'https://developer.monday.com/api-reference/docs/authentication',
    configFields: [
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'eyJhbGciOiJIUzI1NiJ9...', required: true, envVar: 'MONDAY_API_TOKEN' },
    ],
    instructions: ['Go to Monday.com → Avatar → Developers', 'Click "My Access Tokens"', 'Copy your personal API token'],
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    icon: '🔺',
    description: 'Connect Asana for tasks, projects, and workspaces',
    connectionType: 'token',
    docsUrl: 'https://developers.asana.com/docs/personal-access-token',
    configFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'Paste your Asana PAT...', required: true, envVar: 'ASANA_TOKEN' },
    ],
    instructions: ['Go to Asana → My Settings → Apps → Developer Apps', 'Click "Create new token"', 'Name it "SimOffice" and create', 'Copy the token'],
  },
  trello: {
    id: 'trello',
    name: 'Trello',
    icon: '📌',
    description: 'Connect Trello for boards, cards, and lists',
    connectionType: 'token',
    docsUrl: 'https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Your Trello API key...', required: true },
      { key: 'token', label: 'Token', type: 'password', placeholder: 'Your Trello token...', required: true, envVar: 'TRELLO_TOKEN' },
    ],
    instructions: ['Go to trello.com/power-ups/admin and create a new Power-Up', 'Copy the API Key', 'Click the token link to authorize and copy the token'],
  },
  confluence: {
    id: 'confluence',
    name: 'Confluence',
    icon: '📘',
    description: 'Connect Confluence for pages, spaces, and team documentation',
    connectionType: 'token',
    docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    configFields: [
      { key: 'email', label: 'Atlassian Email', type: 'text', placeholder: 'you@company.com', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Paste your Atlassian API token...', required: true, envVar: 'CONFLUENCE_API_TOKEN' },
      { key: 'domain', label: 'Confluence Domain', type: 'text', placeholder: 'your-company.atlassian.net', required: true },
    ],
    instructions: ['Go to id.atlassian.com → Security → Create and manage API tokens', 'Click "Create API token" and name it "SimOffice"', 'Enter your email and Confluence domain below'],
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: '💰',
    description: 'Connect QuickBooks for invoices, expenses, and financial reports',
    connectionType: 'token',
    docsUrl: 'https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text' as const, placeholder: 'Paste your QuickBooks Client ID...', required: true, envVar: 'QUICKBOOKS_CLIENT_ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' as const, placeholder: 'Paste your QuickBooks Client Secret...', required: true, envVar: 'QUICKBOOKS_CLIENT_SECRET' },
      { key: 'realmId', label: 'Company ID (Realm ID)', type: 'text', placeholder: 'Your QuickBooks company ID...', required: true },
    ],
    instructions: ['Go to developer.intuit.com and create an app', 'Set up OAuth 2.0 and generate tokens', 'Copy your access token and company/realm ID'],
  },
  docusign: {
    id: 'docusign',
    name: 'DocuSign',
    icon: '✍️',
    description: 'Connect DocuSign for envelopes, signatures, and document templates',
    connectionType: 'token',
    docsUrl: 'https://developers.docusign.com/platform/auth/',
    configFields: [
      { key: 'integrationKey', label: 'Integration Key', type: 'text' as const, placeholder: 'Paste your DocuSign Integration Key...', required: true, envVar: 'DOCUSIGN_INTEGRATION_KEY' },
      { key: 'rsaPrivateKey', label: 'RSA Private Key', type: 'password' as const, placeholder: 'Paste your RSA private key...', required: true, envVar: 'DOCUSIGN_RSA_PRIVATE_KEY' },
      { key: 'accountId', label: 'Account ID', type: 'text', placeholder: 'Your DocuSign account ID...', required: true },
    ],
    instructions: ['Go to DocuSign Developer → Apps and Keys', 'Create an app and generate an access token', 'Copy the token and your Account ID'],
  },
  xero: {
    id: 'xero',
    name: 'Xero',
    icon: '📗',
    description: 'Connect Xero for invoices, contacts, and bank transactions',
    connectionType: 'token',
    docsUrl: 'https://developer.xero.com/documentation/getting-started-guide/',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text' as const, placeholder: 'Paste your Xero Client ID...', required: true, envVar: 'XERO_CLIENT_ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' as const, placeholder: 'Paste your Xero Client Secret...', required: true, envVar: 'XERO_CLIENT_SECRET' },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Your Xero tenant/org ID...', required: true },
    ],
    instructions: ['Go to developer.xero.com and create an app', 'Set up OAuth 2.0 and generate tokens', 'Copy your access token and tenant ID'],
  },
  twilio: {
    id: 'twilio',
    name: 'Twilio',
    icon: '📞',
    description: 'Connect Twilio for SMS, voice calls, and phone numbers',
    connectionType: 'token',
    docsUrl: 'https://www.twilio.com/docs/iam/api-keys',
    configFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Paste your Twilio auth token...', required: true, envVar: 'TWILIO_AUTH_TOKEN' },
      { key: 'phoneNumber', label: 'Twilio Phone Number', type: 'text', placeholder: '+1234567890', required: false, description: 'Default number for outbound SMS/calls' },
    ],
    instructions: ['Go to Twilio Console → Dashboard', 'Copy your Account SID and Auth Token from the main page', 'Optionally enter a Twilio phone number for outbound messages'],
  },
  zendesk: {
    id: 'zendesk',
    name: 'Zendesk',
    icon: '🎧',
    description: 'Connect Zendesk for support tickets, users, and organizations',
    connectionType: 'token',
    docsUrl: 'https://developer.zendesk.com/api-reference/introduction/security-and-auth/',
    configFields: [
      { key: 'email', label: 'Agent Email', type: 'text', placeholder: 'you@company.com', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Paste your Zendesk API token...', required: true, envVar: 'ZENDESK_API_TOKEN' },
      { key: 'subdomain', label: 'Zendesk Subdomain', type: 'text', placeholder: 'your-company', required: true, description: 'The part before .zendesk.com' },
    ],
    instructions: ['Go to Zendesk Admin → Apps and integrations → APIs → Zendesk API', 'Click "Add API token"', 'Copy the token and enter your email and subdomain'],
  },
  zapier: {
    id: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect 6,000+ apps through Zapier webhooks',
    connectionType: 'webhook',
    docsUrl: 'https://zapier.com/app/zaps',
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Zapier Webhook URL',
        type: 'text',
        placeholder: 'https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/',
        required: true,
        envVar: 'ZAPIER_WEBHOOK_URL',
      },
    ],
    instructions: [
      'Create a new Zap in Zapier',
      'Choose "Webhooks by Zapier" as the trigger → "Catch Hook"',
      'Copy the webhook URL Zapier gives you',
      'Set up your action (Google Sheets, email, CRM, etc.)',
    ],
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Connect Slack so agents can post and respond in channels',
    connectionType: 'token',
    docsUrl: 'https://api.slack.com/apps',
    configFields: [
      {
        key: 'botToken',
        label: 'Bot User OAuth Token',
        type: 'password',
        placeholder: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        envVar: 'SLACK_BOT_TOKEN',
      },
      {
        key: 'appToken',
        label: 'App-Level Token (Socket Mode)',
        type: 'password',
        placeholder: 'xapp-1-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxx',
        required: true,
        envVar: 'SLACK_APP_TOKEN',
        description: 'Required for Socket Mode — generate under Basic Information → App-Level Tokens',
      },
    ],
    instructions: [
      'Go to api.slack.com/apps and create a new app',
      'Under OAuth & Permissions, add bot scopes: chat:write, channels:read, channels:history',
      'Install the app to your workspace and copy the Bot User OAuth Token',
    ],
  },
  pandadoc: {
    id: 'pandadoc',
    name: 'PandaDoc',
    icon: '🐼',
    description: 'Connect PandaDoc for proposals and contracts',
    connectionType: 'token',
    docsUrl: 'https://developers.pandadoc.com/reference/api-key-authentication',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Paste your PandaDoc API key...',
        required: true,
        envVar: 'PANDADOC_API_KEY',
      },
    ],
    instructions: [
      'Go to PandaDoc → Settings → API → Developer Dashboard',
      'Click "Create API Key"',
      'Copy the key and paste it below',
    ],
  },
  mattermost: {
    id: 'mattermost',
    name: 'Mattermost',
    icon: '💠',
    description: 'channels:meta.mattermost.description',
    connectionType: 'token',
    docsUrl: 'channels:meta.mattermost.docsUrl',
    configFields: [
      {
        key: 'serverUrl',
        label: 'channels:meta.mattermost.fields.serverUrl.label',
        type: 'text',
        placeholder: 'channels:meta.mattermost.fields.serverUrl.placeholder',
        required: true,
      },
      {
        key: 'botToken',
        label: 'channels:meta.mattermost.fields.botToken.label',
        type: 'password',
        placeholder: 'channels:meta.mattermost.fields.botToken.placeholder',
        required: true,
      },
    ],
    instructions: [
      'channels:meta.mattermost.instructions.0',
      'channels:meta.mattermost.instructions.1',
      'channels:meta.mattermost.instructions.2',
    ],
    isPlugin: true,
  },
};

/**
 * Get primary supported channels (non-plugin, commonly used)
 */
export function getPrimaryChannels(): ChannelType[] {
  return ['telegram', 'discord', 'whatsapp', 'dingtalk', 'feishu', 'wecom', 'qqbot'];
}

/**
 * Get all available channels including plugins
 */
export function getAllChannels(): ChannelType[] {
  return Object.keys(CHANNEL_META) as ChannelType[];
}
