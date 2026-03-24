/**
 * ChannelSetupWizard — Step-by-step guided setup for messaging channels
 * No screenshots, no docs links. Just clear copy with bold button names.
 */
import { useState } from 'react';
import type { ChannelType } from '@/types/channel';

interface WizardStep {
  title: string;
  instructions: React.ReactNode;
  hasInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  hasSecondInput?: boolean;
  secondInputLabel?: string;
  secondInputPlaceholder?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  isInviteStep?: boolean;
}

const DISCORD_STEPS: WizardStep[] = [
  {
    title: 'Open the Discord Developer Portal',
    instructions: (
      <>
        <p>Click the button below to open the Discord Developer Portal in your browser.</p>
        <p>If you don't have a Discord account, you'll need to create one first.</p>
      </>
    ),
    buttonLabel: 'Open Developer Portal',
    buttonUrl: 'https://discord.com/developers/applications',
  },
  {
    title: 'Create a New Application',
    instructions: (
      <>
        <p>Click the <b>"New Application"</b> button in the top right corner.</p>
        <p>Give your bot a name — this can be anything, like <b>"My AI Assistant"</b>.</p>
        <p>Check the box to agree to the Terms of Service, then click <b>"Create"</b>.</p>
      </>
    ),
  },
  {
    title: 'Get your Bot Token',
    instructions: (
      <>
        <p>In the left sidebar, click <b>"Bot"</b>.</p>
        <p>Click <b>"Reset Token"</b> (or <b>"Add Bot"</b> if you see that instead).</p>
        <p>Click <b>"Yes, do it!"</b> when it asks to confirm.</p>
        <p>You'll see a token appear — click <b>"Copy"</b> to copy it.</p>
        <p style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ <b>Important:</b> Never share this token with anyone. It's like a password for your bot.
        </p>
      </>
    ),
  },
  {
    title: 'Paste your Bot Token & Application ID',
    instructions: (
      <>
        <p>Paste the <b>token</b> you just copied.</p>
        <p style={{ marginTop: 8 }}>Then go back to the <b>"General Information"</b> tab in the sidebar and copy your <b>Application ID</b> — it's the long number at the top of the page.</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Bot Token',
    inputPlaceholder: 'Paste your Discord bot token here...',
    hasSecondInput: true,
    secondInputLabel: 'Application ID',
    secondInputPlaceholder: 'Paste your Application ID here...',
  },
  {
    title: 'Add the Bot to your Server',
    instructions: (
      <>
        <p>Click the button below — it will open Discord and ask you which server to add the bot to.</p>
        <p>Pick your server, click <b>"Authorize"</b>, and you're done!</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          We've already set up the right permissions for you — your bot will be able to read and send messages.
        </p>
      </>
    ),
    isInviteStep: true,
  },
];

const TELEGRAM_STEPS: WizardStep[] = [
  {
    title: 'Open BotFather in Telegram',
    instructions: (
      <>
        <p>Open Telegram on your phone or desktop.</p>
        <p>Search for <b>@BotFather</b> — it's Telegram's official bot for creating bots.</p>
        <p>Tap on it to open a chat.</p>
      </>
    ),
    buttonLabel: 'Open BotFather',
    buttonUrl: 'https://t.me/BotFather',
  },
  {
    title: 'Create your Bot',
    instructions: (
      <>
        <p>Send the message <b>/newbot</b> to BotFather.</p>
        <p>It will ask you for a <b>name</b> — type anything you want, like <b>"My AI Assistant"</b>.</p>
        <p>Then it asks for a <b>username</b> — this must end in "bot", like <b>"myai_assistant_bot"</b>.</p>
        <p>BotFather will reply with your <b>bot token</b> — it looks like:</p>
        <p style={{ fontFamily: 'monospace', fontSize: 13, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, margin: '8px 0' }}>
          110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
        </p>
        <p>Copy this token.</p>
      </>
    ),
  },
  {
    title: 'Paste your Bot Token',
    instructions: (
      <>
        <p>Paste the token BotFather gave you.</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Bot Token',
    inputPlaceholder: 'Paste your Telegram bot token here...',
  },
];

const WHATSAPP_STEPS: WizardStep[] = [
  {
    title: 'Open WhatsApp on your Phone',
    instructions: (
      <>
        <p>Open <b>WhatsApp</b> on your phone.</p>
        <p><b>iPhone:</b> Tap <b>Settings</b> (bottom right) → <b>Linked Devices</b></p>
        <p><b>Android:</b> Tap the <b>three dots ⋮</b> (top right) → <b>Linked Devices</b></p>
        <p>Then tap <b>"Link a Device"</b>.</p>
      </>
    ),
  },
  {
    title: 'Scan the QR Code',
    instructions: (
      <>
        <p>Point your phone's camera at the QR code below.</p>
        <p>WhatsApp will automatically detect it and connect.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          No phone number sharing required. This uses WhatsApp's Linked Devices feature.
        </p>
      </>
    ),
  },
];

const SIGNAL_STEPS: WizardStep[] = [
  {
    title: 'Set up Signal',
    instructions: (
      <>
        <p>Signal requires a linked device connection.</p>
        <p>Open <b>Signal</b> on your phone.</p>
        <p>Go to <b>Settings</b> → <b>Linked Devices</b> → <b>"Link New Device"</b>.</p>
        <p>Scan the QR code that will appear in the next step.</p>
      </>
    ),
  },
];

const IMESSAGE_STEPS: WizardStep[] = [
  {
    title: 'Requirements',
    instructions: (
      <>
        <p>iMessage only works on a <b>Mac</b> — this is an Apple limitation.</p>
        <p>You'll need:</p>
        <ul style={{ margin: '8px 0', paddingLeft: 20, lineHeight: 2 }}>
          <li>A Mac that stays on and connected to the internet</li>
          <li>An Apple ID signed into <b>Messages</b></li>
          <li><b>BlueBubbles</b> — a free app that bridges iMessage</li>
        </ul>
        <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          SimOffice connects to iMessage through BlueBubbles, which runs on your Mac and forwards messages.
        </p>
      </>
    ),
  },
  {
    title: 'Install BlueBubbles',
    instructions: (
      <>
        <p>Download and install <b>BlueBubbles Server</b> on your Mac.</p>
        <p>It's free and open-source.</p>
      </>
    ),
    buttonLabel: 'Download BlueBubbles',
    buttonUrl: 'https://bluebubbles.app/downloads/',
  },
  {
    title: 'Set up BlueBubbles',
    instructions: (
      <>
        <p>Open BlueBubbles and follow its setup wizard:</p>
        <ol style={{ margin: '8px 0', paddingLeft: 20, lineHeight: 2 }}>
          <li>Sign in with a Google account (used for push notifications)</li>
          <li>Grant <b>Full Disk Access</b> when prompted — this lets it read your Messages</li>
          <li>Set a <b>server password</b> — you'll need this in the next step</li>
        </ol>
        <p>Once setup is done, BlueBubbles will show a <b>server URL</b> and your <b>password</b>.</p>
      </>
    ),
  },
  {
    title: 'Connect to SimOffice',
    instructions: (
      <>
        <p>Enter your BlueBubbles <b>server URL</b> and <b>password</b> below.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          You can find these in the BlueBubbles app under <b>Server Info</b>.
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Server URL',
    inputPlaceholder: 'https://your-bluebubbles-url.ngrok.io',
    hasSecondInput: true,
    secondInputLabel: 'Password',
    secondInputPlaceholder: 'Your BlueBubbles server password',
  },
];

const GENERIC_STEPS: WizardStep[] = [
  {
    title: 'Set up this Channel',
    instructions: (
      <>
        <p>Follow the configuration form below to connect this channel.</p>
        <p>You'll need the API credentials or bot token from your messaging platform.</p>
      </>
    ),
  },
];

const HUBSPOT_STEPS: WizardStep[] = [
  {
    title: 'Open HubSpot Private Apps',
    instructions: (
      <>
        <p>Log into HubSpot, click the Settings gear icon, then go to <b>Integrations</b> → <b>Private Apps</b> in the left sidebar.</p>
      </>
    ),
    buttonLabel: 'Open HubSpot Settings',
    buttonUrl: 'https://app.hubspot.com/settings',
  },
  {
    title: 'Create a Private App',
    instructions: (
      <>
        <p>Click <b>"Create a private app"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and add a description like "AI agent CRM access".</p>
        <p>Go to the <b>"Scopes"</b> tab and enable these permissions:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><input type="checkbox" disabled /> <b>crm.objects.contacts.read</b></li>
          <li><input type="checkbox" disabled /> <b>crm.objects.contacts.write</b></li>
          <li><input type="checkbox" disabled /> <b>crm.objects.deals.read</b></li>
          <li><input type="checkbox" disabled /> <b>crm.objects.deals.write</b></li>
          <li><input type="checkbox" disabled /> <b>crm.objects.companies.read</b></li>
          <li><input type="checkbox" disabled /> <b>crm.objects.companies.write</b></li>
        </ul>
        <p style={{ marginTop: 8 }}>Click <b>"Create app"</b> in the top right, then <b>"Continue creating"</b> to confirm.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ You must be a <b>Super Admin</b> to create private apps.
        </p>
      </>
    ),
  },
  {
    title: 'Copy your Access Token',
    instructions: (
      <>
        <p>After creating the app, you'll see your <b>access token</b>.</p>
        <p>Click <b>"Show token"</b> then copy it and paste it below.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>
          Token starts with <code>pat-na1-</code> (US) or <code>pat-eu1-</code> (EU).
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Access Token',
    inputPlaceholder: 'pat-na1-... or pat-eu1-...',
  },
];

const GOOGLE_WORKSPACE_STEPS: WizardStep[] = [
  {
    title: 'Open Google Cloud Console',
    instructions: (
      <>
        <p>Click below to open Google Cloud Console. You'll need a Google Cloud project — create one if you don't have one.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ <b>Important:</b> Service accounts only work with Google Workspace (paid) accounts, not personal @gmail.com accounts.
        </p>
      </>
    ),
    buttonLabel: 'Open Google Cloud',
    buttonUrl: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
  },
  {
    title: 'Create a Service Account',
    instructions: (
      <>
        <p>Click <b>"Create Service Account"</b>, name it <b>SimOffice</b>.</p>
        <p>After creation, click the service account, go to the <b>Keys</b> tab, click <b>Add Key</b> → <b>Create new key</b> → <b>JSON</b>. A file will download automatically.</p>
        <p style={{ marginTop: 8 }}>Then separately, go to <b>APIs & Services</b> → <b>Library</b> and search for and enable:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><b>Gmail API</b></li>
          <li><b>Google Calendar API</b></li>
          <li><b>Google Drive API</b></li>
        </ul>
      </>
    ),
  },
  {
    title: 'Paste your Service Account Key',
    instructions: (
      <>
        <p>Open the downloaded JSON key file in a text editor, select all, and paste the contents below.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>
          Then share your calendar and drive folders with the service account email address (found in the JSON file as <code>client_email</code>).
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Service Account JSON',
    inputPlaceholder: '{"type": "service_account", ...}',
  },
];

const NOTION_STEPS: WizardStep[] = [
  {
    title: 'Create a Notion Integration',
    instructions: (
      <>
        <p>Click below to open Notion's integrations page.</p>
        <p>You'll need admin access to your Notion workspace.</p>
      </>
    ),
    buttonLabel: 'Open Notion Integrations',
    buttonUrl: 'https://www.notion.so/my-integrations',
  },
  {
    title: 'Set Up the Integration',
    instructions: (
      <>
        <p>Click <b>"New integration"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and select your workspace.</p>
        <p>Leave the default capabilities (Read, Update, Insert content).</p>
        <p style={{ marginTop: 8 }}><b>Important:</b> After creating, go to any Notion page or database you want agents to access, click <b>"..."</b> → <b>"Add connections"</b> → <b>"SimOffice"</b>.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ You must share each page/database individually — the integration cannot see anything until you explicitly connect it.
        </p>
      </>
    ),
  },
  {
    title: 'Copy your Integration Token',
    instructions: (
      <>
        <p>Copy the <b>"Internal Integration Secret"</b> from the integration page.</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Integration Token',
    inputPlaceholder: 'ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
];

const GITHUB_STEPS: WizardStep[] = [
  {
    title: 'Open GitHub Token Settings',
    instructions: (
      <>
        <p>Click below to create a fine-grained personal access token.</p>
      </>
    ),
    buttonLabel: 'Open GitHub Settings',
    buttonUrl: 'https://github.com/settings/personal-access-tokens',
  },
  {
    title: 'Create a Token',
    instructions: (
      <>
        <p>Click <b>"Generate new token"</b>.</p>
        <p>Name it <b>"SimOffice"</b>.</p>
        <p>Set an expiration date (recommend maximum — 1 year).</p>
        <p>Select a <b>Resource owner</b> (your account or org).</p>
        <p>Select your repos, then under <b>"Permissions"</b>, enable:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><b>Issues</b> — Read and Write</li>
          <li><b>Pull requests</b> — Read and Write</li>
          <li><b>Contents</b> — Read</li>
        </ul>
        <p style={{ marginTop: 8 }}>Click <b>"Generate token"</b>.</p>
      </>
    ),
  },
  {
    title: 'Paste your Token',
    instructions: (
      <>
        <p>Copy the token and paste below. Fine-grained tokens start with <code>github_pat_</code> (not <code>ghp_</code>).</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Personal Access Token',
    inputPlaceholder: 'github_pat_xxxxxxxxxxxx...',
  },
];

const JIRA_STEPS: WizardStep[] = [
  {
    title: 'Create an Atlassian API Token',
    instructions: (
      <>
        <p>Click below to open your Atlassian account security settings.</p>
      </>
    ),
    buttonLabel: 'Open Atlassian Settings',
    buttonUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
  },
  {
    title: 'Generate the Token',
    instructions: (
      <>
        <p>Click <b>"Create API token"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and click <b>"Create"</b>.</p>
        <p>Copy the token immediately — you cannot view it again after closing.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>
          Tokens expire after 1 year.
        </p>
      </>
    ),
  },
  {
    title: 'Enter your Jira Details',
    instructions: (
      <>
        <p>Paste your API token below. You'll also need your Atlassian email and Jira domain in the next screen.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ Your Jira domain is the URL you use to access Jira, like <code>yourcompany.atlassian.net</code>
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'API Token',
    inputPlaceholder: 'Paste your Atlassian API token...',
  },
];

const STRIPE_STEPS: WizardStep[] = [
  {
    title: 'Open Stripe API Keys',
    instructions: (
      <>
        <p>Click below to open your Stripe dashboard.</p>
        <p>We recommend creating a <b>restricted key</b> with read-only access for safety.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ Make sure you are in <b>Live mode</b> (not Test mode) — check the toggle at the top of the dashboard.
        </p>
      </>
    ),
    buttonLabel: 'Open Stripe Dashboard',
    buttonUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    title: 'Create a Restricted Key',
    instructions: (
      <>
        <p>Scroll down past the Standard keys section to find <b>Restricted keys</b>.</p>
        <p>Click <b>"Create restricted key"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and enable <b>Read</b> for:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><b>Charges</b></li>
          <li><b>Customers</b></li>
          <li><b>Subscriptions</b></li>
          <li><b>Invoices</b></li>
        </ul>
        <p style={{ marginTop: 8 }}>Click <b>"Create key"</b>. The key is only shown once after creation — copy it immediately.</p>
      </>
    ),
  },
  {
    title: 'Paste your Restricted Key',
    instructions: (
      <>
        <p>Copy the restricted key (starts with <code>rk_live_</code>) and paste below.</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Restricted Key',
    inputPlaceholder: 'rk_live_your_restricted_key_here',
  },
];

const SALESFORCE_STEPS: WizardStep[] = [
  { title: 'Open Salesforce Setup', instructions: (<><p>Click below to open Salesforce's Connected App setup.</p><p>You need <b>System Administrator</b> access.</p></>), buttonLabel: 'Open Salesforce Setup', buttonUrl: 'https://login.salesforce.com/' },
  { title: 'Create a Connected App', instructions: (<><p>Go to <b>Setup</b> → <b>App Manager</b> → <b>"New Connected App"</b>.</p><p>Enable <b>OAuth Settings</b> and select scopes: <b>api</b>, <b>refresh_token</b>.</p><p>Set the Callback URL to <code>https://login.salesforce.com/services/oauth2/success</code> for testing.</p><p>Save — then copy the <b>Consumer Key</b> and <b>Consumer Secret</b>.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ New Connected Apps can take 2-10 minutes to activate after creation.</p></>)},
  { title: 'Paste your Consumer Key', instructions: (<><p>Copy the Consumer Key from your Connected App. SimOffice will use this to connect to Salesforce.</p><p>Your instance URL is the URL in your browser when logged into Salesforce (e.g. <code>https://yourcompany.my.salesforce.com</code>).</p></>), hasInput: true, inputLabel: 'Consumer Key', inputPlaceholder: 'Paste your Salesforce Consumer Key...' },
];

const MAILCHIMP_STEPS: WizardStep[] = [
  { title: 'Open Mailchimp API Settings', instructions: (<><p>Log into Mailchimp, then navigate to your <b>Profile icon</b> → <b>Account & Billing</b> → <b>Extras</b> → <b>API keys</b>.</p></>), buttonLabel: 'Open Mailchimp', buttonUrl: 'https://mailchimp.com' },
  { title: 'Create an API Key', instructions: (<><p>Click <b>"Create A Key"</b>.</p><p>The key suffix (e.g. <code>-us21</code>) indicates your data center — this is important for API calls.</p></>) },
  { title: 'Paste your API Key', instructions: (<><p>Copy the full API key including the data center suffix.</p></>), hasInput: true, inputLabel: 'API Key', inputPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usXX' },
];

const SENDGRID_STEPS: WizardStep[] = [
  { title: 'Open SendGrid API Keys', instructions: (<><p>Click below to open SendGrid's API key settings.</p></>), buttonLabel: 'Open SendGrid', buttonUrl: 'https://app.sendgrid.com/settings/api_keys' },
  { title: 'Create an API Key', instructions: (<><p>Click <b>"Create API Key"</b>.</p><p>Name it <b>"SimOffice"</b> and choose <b>Full Access</b> or <b>Restricted Access</b> with Mail Send permissions.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ Two-Factor Authentication must be enabled on your account before you can create API keys.</p></>) },
  { title: 'Paste your API Key', instructions: (<><p>Copy the key (starts with <code>SG.</code>). The key is only shown once — copy it immediately.</p></>), hasInput: true, inputLabel: 'API Key', inputPlaceholder: 'SG.xxxxxxxxxxxxxxxxxxxx...' },
];

const CALENDLY_STEPS: WizardStep[] = [
  { title: 'Open Calendly Integrations', instructions: (<><p>Click below to open Calendly's API settings.</p></>), buttonLabel: 'Open Calendly', buttonUrl: 'https://calendly.com/integrations/api_webhooks' },
  { title: 'Generate a Personal Access Token', instructions: (<><p>Click <b>"Get a token now"</b> under Personal Access Tokens.</p><p>Name it <b>"SimOffice"</b> and create.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy your personal access token and paste it below.</p></>), hasInput: true, inputLabel: 'Personal Access Token', inputPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...' },
];

const INTERCOM_STEPS: WizardStep[] = [
  { title: 'Open Intercom Developer Hub', instructions: (<><p>Click below to open Intercom's developer settings.</p></>), buttonLabel: 'Open Intercom', buttonUrl: 'https://app.intercom.com/a/developer-signup' },
  { title: 'Create or Select an App', instructions: (<><p>Create a new app or select an existing one.</p><p>Go to <b>Authentication</b> and find your <b>Access Token</b>.</p></>) },
  { title: 'Paste your Access Token', instructions: (<><p>Copy the access token and paste below.</p></>), hasInput: true, inputLabel: 'Access Token', inputPlaceholder: 'dG9rOxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
];

const GITLAB_STEPS: WizardStep[] = [
  { title: 'Open GitLab Access Tokens', instructions: (<><p>Click below to create a personal access token on GitLab.</p></>), buttonLabel: 'Open GitLab Settings', buttonUrl: 'https://gitlab.com/-/user_settings/personal_access_tokens' },
  { title: 'Create a Token', instructions: (<><p>Click <b>"Add new token"</b>.</p><p>Name it <b>"SimOffice"</b>. Set an expiration date (required, max 1 year). Select scopes:</p><ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}><li><b>api</b> — Full API access</li><li><b>read_repository</b></li><li><b>write_repository</b></li></ul></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy the token (starts with <code>glpat-</code>) and paste below. Copy immediately — you won't be able to see it again.</p></>), hasInput: true, inputLabel: 'Personal Access Token', inputPlaceholder: 'glpat-xxxxxxxxxxxxxxxxxxxx' },
];

const LINEAR_STEPS: WizardStep[] = [
  { title: 'Open Linear API Settings', instructions: (<><p>Click below to open Linear's API settings.</p></>), buttonLabel: 'Open Linear Settings', buttonUrl: 'https://linear.app/settings/api' },
  { title: 'Create a Personal API Key', instructions: (<><p>Click <b>"Create key"</b> under Personal API Keys.</p><p>Name it <b>"SimOffice"</b>.</p></>) },
  { title: 'Paste your API Key', instructions: (<><p>Copy the key (starts with <code>lin_api_</code>) and paste below.</p></>), hasInput: true, inputLabel: 'API Key', inputPlaceholder: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
];

const SENTRY_STEPS: WizardStep[] = [
  { title: 'Open Sentry Auth Tokens', instructions: (<><p>Click below to open Sentry's auth token settings.</p></>), buttonLabel: 'Open Sentry Settings', buttonUrl: 'https://sentry.io/settings/auth-tokens/' },
  { title: 'Create an Auth Token', instructions: (<><p>Click <b>"Create New Token"</b>.</p><p>Select scopes: <b>project:read</b>, <b>event:read</b>, <b>org:read</b>.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy the auth token and paste below. You'll also need your org slug in the config screen.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>Your org slug is the subdomain in your Sentry URL (e.g. <code>my-company</code> from <code>my-company.sentry.io</code>).</p></>), hasInput: true, inputLabel: 'Auth Token', inputPlaceholder: 'sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
];

const DATADOG_STEPS: WizardStep[] = [
  { title: 'Open Datadog API Keys', instructions: (<><p>Click below to open Datadog's key management.</p><p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>If your Datadog is on a different region (EU, US3, US5, AP1), use your region's domain instead.</p></>), buttonLabel: 'Open Datadog', buttonUrl: 'https://app.datadoghq.com/organization-settings/api-keys' },
  { title: 'Create API + Application Keys', instructions: (<><p>Create a new <b>API Key</b> under Organization Settings → API Keys.</p><p>Application Keys are under a separate tab at <b>Organization Settings</b> → <b>Application Keys</b>.</p><p>You need both for full API access.</p></>) },
  { title: 'Paste your API Key', instructions: (<><p>Paste your API key below. You'll enter the Application Key in the config screen.</p></>), hasInput: true, inputLabel: 'API Key', inputPlaceholder: 'Paste your Datadog API key...' },
];

const VERCEL_STEPS: WizardStep[] = [
  { title: 'Open Vercel Tokens', instructions: (<><p>Click below to open your Vercel account tokens.</p></>), buttonLabel: 'Open Vercel Settings', buttonUrl: 'https://vercel.com/account/tokens' },
  { title: 'Create a Token', instructions: (<><p>Click <b>"Create"</b>.</p><p>Name it <b>"SimOffice"</b>, set scope to your account or team, and choose an expiration.</p><p>Select <b>"Full Account"</b> scope for SimOffice access.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy the token and paste below.</p></>), hasInput: true, inputLabel: 'API Token', inputPlaceholder: 'Paste your Vercel token...' },
];

const AIRTABLE_STEPS: WizardStep[] = [
  { title: 'Open Airtable Token Creator', instructions: (<><p>Click below to create a personal access token.</p></>), buttonLabel: 'Open Airtable', buttonUrl: 'https://airtable.com/create/tokens' },
  { title: 'Create a Token', instructions: (<><p>Click <b>"Create new token"</b>.</p><p>Name it <b>"SimOffice"</b> and add scopes:</p><ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}><li><b>data.records:read</b></li><li><b>data.records:write</b></li><li><b>schema.bases:read</b></li></ul><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ <b>Important:</b> You MUST click <b>"+ Add a base"</b> and select which bases SimOffice can access, or the token won't work.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy the token (starts with <code>pat.</code>) and paste below.</p></>), hasInput: true, inputLabel: 'Personal Access Token', inputPlaceholder: 'pat.xxxxxxxxxxxxxxx...' },
];

const MONDAY_STEPS: WizardStep[] = [
  { title: 'Open Monday.com Developer Settings', instructions: (<><p>Click below to access your Monday.com API token.</p></>), buttonLabel: 'Open Monday.com', buttonUrl: 'https://monday.com' },
  { title: 'Find your API Token', instructions: (<><p>Click <b>your profile picture</b> (bottom-left of sidebar) → <b>"Developers"</b>.</p><p>Click <b>"My Access Tokens"</b> tab.</p><p>Click <b>Show</b> to reveal your existing API token, then copy it.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Paste your Monday.com API token below.</p></>), hasInput: true, inputLabel: 'API Token', inputPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...' },
];

const ASANA_STEPS: WizardStep[] = [
  { title: 'Open Asana Developer Settings', instructions: (<><p>Click below to create an Asana personal access token.</p></>), buttonLabel: 'Open Asana Settings', buttonUrl: 'https://app.asana.com/0/my-apps' },
  { title: 'Create a Token', instructions: (<><p>Go to <b>My Settings</b> → <b>Apps</b> → <b>Manage Developer Apps</b>.</p><p>Click <b>"+ Create new token"</b>, name it <b>"SimOffice"</b>.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Copy the personal access token and paste below.</p></>), hasInput: true, inputLabel: 'Personal Access Token', inputPlaceholder: 'Paste your Asana PAT...' },
];

const TRELLO_STEPS: WizardStep[] = [
  { title: 'Open Trello Power-Up Admin', instructions: (<><p>Click below to create a Trello Power-Up for API access.</p></>), buttonLabel: 'Open Trello Admin', buttonUrl: 'https://trello.com/power-ups/admin' },
  { title: 'Create a Power-Up and Get Keys', instructions: (<><p>You'll need to create a Power-Up first (just a container for API access — use any name and a placeholder URL). Then go to the <b>API Key</b> tab.</p><p>Copy the <b>API Key</b>.</p><p>Click the <b>token link</b> next to it to authorize and get a token.</p></>) },
  { title: 'Paste your API Key', instructions: (<><p>Paste your API key below. You'll enter the token in the config screen.</p></>), hasInput: true, inputLabel: 'API Key', inputPlaceholder: 'Your Trello API key...' },
];

const CONFLUENCE_STEPS: WizardStep[] = [
  { title: 'Create an Atlassian API Token', instructions: (<><p>Click below to create an API token (same as Jira).</p></>), buttonLabel: 'Open Atlassian Settings', buttonUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
  { title: 'Generate the Token', instructions: (<><p>Click <b>"Create API token"</b>.</p><p>Name it <b>"SimOffice Confluence"</b>.</p><p>Copy the token — you won't see it again.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Paste the API token below. You'll also need your email and Confluence domain in the config screen.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>Your domain is the subdomain from your Atlassian URL, e.g. <code>yourcompany</code> from <code>yourcompany.atlassian.net</code>. Tokens now expire after 1 year.</p></>), hasInput: true, inputLabel: 'API Token', inputPlaceholder: 'Paste your Atlassian API token...' },
];

const QUICKBOOKS_STEPS: WizardStep[] = [
  { title: 'Open Intuit Developer Portal', instructions: (<><p>Click below to open the QuickBooks developer portal.</p></>), buttonLabel: 'Open Intuit Developer', buttonUrl: 'https://developer.intuit.com/app/developer/dashboard' },
  { title: 'Create an App and Get Credentials', instructions: (<><p>Create an app, then go to <b>Keys & Credentials</b> to find your <b>Client ID</b> and <b>Client Secret</b>.</p><p>Use the OAuth 2.0 Playground (built into the developer portal) to generate an access token.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ <b>Important:</b> Access tokens expire in 1 hour. SimOffice will need your Client ID and Secret for ongoing access.</p></>) },
  { title: 'Paste your Client ID', instructions: (<><p>Paste your Client ID below.</p></>), hasInput: true, inputLabel: 'Client ID', inputPlaceholder: 'Paste your QuickBooks Client ID...' },
];

const DOCUSIGN_STEPS: WizardStep[] = [
  { title: 'Open DocuSign Developer', instructions: (<><p>Click below to open DocuSign's developer portal.</p><p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>Create a free developer account if you don't have one.</p></>), buttonLabel: 'Open DocuSign', buttonUrl: 'https://developers.docusign.com/' },
  { title: 'Create an App', instructions: (<><p>Log into the demo environment. Go to <b>Apps and Keys</b>, click <b>Add App and Integration Key</b>. Name it <b>SimOffice</b>.</p><p>Choose <b>JWT auth</b> and generate an RSA key pair. Copy your <b>Integration Key (Client ID)</b>.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ Access tokens expire in 1 hour — SimOffice uses your Integration Key for ongoing access.</p></>) },
  { title: 'Paste your Integration Key', instructions: (<><p>Paste your Integration Key below.</p></>), hasInput: true, inputLabel: 'Integration Key', inputPlaceholder: 'Paste your DocuSign Integration Key...' },
];

const XERO_STEPS: WizardStep[] = [
  { title: 'Open Xero Developer Portal', instructions: (<><p>Click below to open Xero's developer portal.</p></>), buttonLabel: 'Open Xero Developer', buttonUrl: 'https://developer.xero.com/app/manage' },
  { title: 'Create an App', instructions: (<><p>Create a new app (type: <b>Web app</b>). You'll get a <b>Client ID</b> and <b>Client Secret</b>.</p><p>To find your Tenant ID, use the Xero developer tools or make an API call to <code>/connections</code> after authorizing.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>⚠️ Access tokens expire in 30 minutes — SimOffice needs your Client ID and Secret for ongoing access.</p></>) },
  { title: 'Paste your Client ID', instructions: (<><p>Paste your Client ID below.</p></>), hasInput: true, inputLabel: 'Client ID', inputPlaceholder: 'Paste your Xero Client ID...' },
];

const TWILIO_STEPS: WizardStep[] = [
  { title: 'Open Twilio Console', instructions: (<><p>Click below to open your Twilio dashboard.</p></>), buttonLabel: 'Open Twilio Console', buttonUrl: 'https://console.twilio.com/' },
  { title: 'Copy your Credentials', instructions: (<><p>On the main dashboard, you'll see your <b>Account SID</b> and <b>Auth Token</b>.</p><p>Click <b>Show</b> to reveal the Auth Token, then copy both.</p></>) },
  { title: 'Paste your Account SID', instructions: (<><p>Paste your Account SID below. You'll enter the Auth Token in the config screen.</p></>), hasInput: true, inputLabel: 'Account SID', inputPlaceholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
];

const ZENDESK_STEPS: WizardStep[] = [
  { title: 'Open Zendesk API Settings', instructions: (<><p>Log into your Zendesk account (e.g. <code>yourcompany.zendesk.com</code>), then go to <b>Admin Center</b>.</p></>), buttonLabel: 'Open Zendesk Admin', buttonUrl: 'https://www.zendesk.com/login/' },
  { title: 'Create an API Token', instructions: (<><p>Enable <b>Token access</b> if not already on.</p><p>Click <b>"Add API token"</b>.</p><p>Copy the token — you won't see it again.</p></>) },
  { title: 'Paste your Token', instructions: (<><p>Paste the API token below. You'll need your email and subdomain in the config screen.</p><p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>Your subdomain is the part before .zendesk.com (e.g. <code>acme</code> from <code>acme.zendesk.com</code>).</p></>), hasInput: true, inputLabel: 'API Token', inputPlaceholder: 'Paste your Zendesk API token...' },
];

const ZAPIER_STEPS: WizardStep[] = [
  {
    title: 'Create a Zap with Webhooks',
    instructions: (
      <>
        <p>Click below to open Zapier.</p>
        <p>Create a new Zap and choose <b>"Webhooks by Zapier"</b> as the trigger.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ Webhooks by Zapier requires a <b>paid Zapier plan</b>.
        </p>
      </>
    ),
    buttonLabel: 'Open Zapier',
    buttonUrl: 'https://zapier.com/app/zaps',
  },
  {
    title: 'Set Up the Webhook',
    instructions: (
      <>
        <p>Choose <b>"Catch Hook"</b> as the trigger event. Zapier will give you a unique webhook URL at this step — copy it now.</p>
        <p>Then configure your action (what happens when data arrives).</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ The Zap must be published/turned on for the webhook to work.
        </p>
      </>
    ),
  },
  {
    title: 'Paste the Webhook URL',
    instructions: (
      <>
        <p>Copy the webhook URL from Zapier and paste it below.</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Webhook URL',
    inputPlaceholder: 'https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/',
  },
];

const SLACK_STEPS: WizardStep[] = [
  {
    title: 'Create a Slack App',
    instructions: (
      <>
        <p>Click below to open the Slack API dashboard.</p>
        <p>Click <b>"Create New App"</b> → <b>"From scratch"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and pick your workspace.</p>
      </>
    ),
    buttonLabel: 'Open Slack API',
    buttonUrl: 'https://api.slack.com/apps',
  },
  {
    title: 'Add Bot Permissions',
    instructions: (
      <>
        <p>In your app settings, go to <b>"OAuth & Permissions"</b> in the sidebar.</p>
        <p>Scroll to <b>"Bot Token Scopes"</b> and add:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><b>chat:write</b> — Send messages</li>
          <li><b>chat:write.public</b> — Send messages to channels without joining</li>
          <li><b>channels:read</b> — See channel list</li>
          <li><b>channels:history</b> — Read messages</li>
          <li><b>users:read</b> — See user info</li>
        </ul>
        <p style={{ marginTop: 8 }}>Then click <b>"Install to Workspace"</b> at the top and authorize.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ After installing, the bot must be invited to each channel it needs to read. Workspace admin approval may be required.
        </p>
      </>
    ),
  },
  {
    title: 'Copy your Bot Token',
    instructions: (
      <>
        <p>After installing, go back to <b>"OAuth & Permissions"</b>.</p>
        <p>Copy the <b>"Bot User OAuth Token"</b> (starts with <code>xoxb-</code>).</p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Bot Token',
    inputPlaceholder: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxx',
  },
];

const PANDADOC_STEPS: WizardStep[] = [
  {
    title: 'Open PandaDoc Developer Dashboard',
    instructions: (
      <>
        <p>Log into PandaDoc, go to <b>Settings</b> → <b>API and Integrations</b> → <b>API</b>. If you see Dev Center, go there instead.</p>
      </>
    ),
    buttonLabel: 'Open PandaDoc Settings',
    buttonUrl: 'https://app.pandadoc.com',
  },
  {
    title: 'Create an API Key',
    instructions: (
      <>
        <p>If prompted, click <b>Enable API</b> first. Then create an application and generate an API key.</p>
        <p>Note: Production API keys may require an Enterprise plan. Sandbox keys work for testing.</p>
      </>
    ),
  },
  {
    title: 'Paste your API Key',
    instructions: (
      <>
        <p>Copy the API key and paste it below.</p>
        <p style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12 }}>
          ⚠️ You must be an account owner or admin to create API keys.
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'API Key',
    inputPlaceholder: 'Paste your PandaDoc API key...',
  },
];

const WIZARD_STEPS: Partial<Record<ChannelType, WizardStep[]>> = {
  discord: DISCORD_STEPS,
  telegram: TELEGRAM_STEPS,
  whatsapp: WHATSAPP_STEPS,
  signal: SIGNAL_STEPS,
  imessage: IMESSAGE_STEPS,
  hubspot: HUBSPOT_STEPS,
  pandadoc: PANDADOC_STEPS,
  slack: SLACK_STEPS,
  google_workspace: GOOGLE_WORKSPACE_STEPS,
  notion: NOTION_STEPS,
  github: GITHUB_STEPS,
  jira: JIRA_STEPS,
  stripe_integration: STRIPE_STEPS,
  zapier: ZAPIER_STEPS,
  salesforce: SALESFORCE_STEPS,
  mailchimp: MAILCHIMP_STEPS,
  sendgrid: SENDGRID_STEPS,
  calendly: CALENDLY_STEPS,
  intercom: INTERCOM_STEPS,
  gitlab: GITLAB_STEPS,
  linear: LINEAR_STEPS,
  sentry: SENTRY_STEPS,
  datadog: DATADOG_STEPS,
  vercel: VERCEL_STEPS,
  airtable: AIRTABLE_STEPS,
  monday: MONDAY_STEPS,
  asana: ASANA_STEPS,
  trello: TRELLO_STEPS,
  confluence: CONFLUENCE_STEPS,
  quickbooks: QUICKBOOKS_STEPS,
  docusign: DOCUSIGN_STEPS,
  xero: XERO_STEPS,
  twilio: TWILIO_STEPS,
  zendesk: ZENDESK_STEPS,
};

interface ChannelSetupWizardProps {
  channelType: ChannelType;
  onTokenSubmit?: (token: string) => void;
  onComplete?: () => void;
  onBack?: () => void;
}

export function ChannelSetupWizard({ channelType, onTokenSubmit, onComplete, onBack }: ChannelSetupWizardProps) {
  const steps = WIZARD_STEPS[channelType] || GENERIC_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const channelName = channelType.charAt(0).toUpperCase() + channelType.slice(1);

  // Discord permissions: Send Messages, Read Message History, Manage Messages,
  // View Channels, Embed Links, Attach Files, Add Reactions, Use Slash Commands
  const DISCORD_PERMISSIONS = '274877975552';
  const discordInviteUrl = secondInputValue
    ? `https://discord.com/api/oauth2/authorize?client_id=${secondInputValue.trim()}&permissions=${DISCORD_PERMISSIONS}&scope=bot%20applications.commands`
    : '';

  const handleNext = () => {
    if (step.hasInput && inputValue.trim() && onTokenSubmit) {
      onTokenSubmit(inputValue.trim());
    }
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const canProceed = step.hasInput
    ? inputValue.trim().length > 0 && (!step.hasSecondInput || secondInputValue.trim().length > 0)
    : true;

  const handleBack = () => {
    if (currentStep === 0) {
      onBack?.();
    } else {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Connect {channelName} · Step {currentStep + 1} of {steps.length}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--foreground))', fontFamily: 'Space Grotesk, sans-serif' }}>
          {step.title}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        fontSize: 14, lineHeight: 1.7, color: 'hsl(var(--foreground))',
        marginBottom: 20,
      }}>
        {step.instructions}
      </div>

      {/* External link button */}
      {step.buttonUrl && (
        <button
          onClick={() => window.electron.openExternal(step.buttonUrl!)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
            fontSize: 14, fontWeight: 700, marginBottom: 20,
          }}
        >
          {step.buttonLabel} ↗
        </button>
      )}

      {/* Token input */}
      {step.hasInput && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
            {step.inputLabel || 'Token'}
          </label>
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={step.inputPlaceholder || 'Paste here...'}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
              fontFamily: 'monospace',
            }}
          />
        </div>
      )}

      {/* Second input (Application ID for Discord) */}
      {step.hasSecondInput && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
            {step.secondInputLabel || 'ID'}
          </label>
          <input
            type="text"
            value={secondInputValue}
            onChange={(e) => setSecondInputValue(e.target.value)}
            placeholder={step.secondInputPlaceholder || 'Paste here...'}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))', fontSize: 14, outline: 'none',
              fontFamily: 'monospace',
            }}
          />
        </div>
      )}

      {/* Discord invite button */}
      {step.isInviteStep && discordInviteUrl && (
        <button
          onClick={() => window.electron.openExternal(discordInviteUrl)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#5865F2', color: 'white',
            fontSize: 15, fontWeight: 700, marginBottom: 20,
          }}
        >
          🤖 Add Bot to Your Server
        </button>
      )}

      {step.isInviteStep && !discordInviteUrl && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'hsl(var(--muted))', marginBottom: 20, fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
          Go back and paste your Application ID first — we need it to generate the invite link.
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handleBack}
          style={{
            padding: '10px 20px', borderRadius: 10,
            border: '1px solid hsl(var(--border))', background: 'transparent',
            color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
          ← {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>

        <button onClick={handleNext}
          disabled={!canProceed}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: !canProceed ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
            color: !canProceed ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
            fontSize: 13, fontWeight: 700, cursor: !canProceed ? 'default' : 'pointer',
          }}>
          {isLast ? 'Done ✓' : 'Next →'}
        </button>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === currentStep ? 20 : 8, height: 8, borderRadius: 4,
            background: i === currentStep ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}

/** Check if a channel type has a setup wizard */
export function hasSetupWizard(channelType: ChannelType): boolean {
  return channelType in WIZARD_STEPS;
}
