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
        <p>Click the button below to open HubSpot's Private Apps page.</p>
        <p>You'll need a HubSpot account with <b>Super Admin</b> access.</p>
      </>
    ),
    buttonLabel: 'Open HubSpot Settings',
    buttonUrl: 'https://app.hubspot.com/private-apps/',
  },
  {
    title: 'Create a Private App',
    instructions: (
      <>
        <p>Click <b>"Create a private app"</b>.</p>
        <p>Name it <b>"SimOffice"</b> and add a description like "AI agent CRM access".</p>
        <p>Go to the <b>"Scopes"</b> tab and enable these permissions:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li><b>crm.objects.contacts</b> — Read and Write</li>
          <li><b>crm.objects.deals</b> — Read and Write</li>
          <li><b>crm.objects.companies</b> — Read and Write</li>
        </ul>
        <p style={{ marginTop: 8 }}>Click <b>"Create app"</b> in the top right, then <b>"Continue creating"</b> to confirm.</p>
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
          This token starts with <code>pat-na1-</code> or similar.
        </p>
      </>
    ),
    hasInput: true,
    inputLabel: 'Access Token',
    inputPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
];

const PANDADOC_STEPS: WizardStep[] = [
  {
    title: 'Open PandaDoc Developer Dashboard',
    instructions: (
      <>
        <p>Click the button below to open PandaDoc's API settings.</p>
        <p>You'll need a PandaDoc account with admin access.</p>
      </>
    ),
    buttonLabel: 'Open PandaDoc Settings',
    buttonUrl: 'https://app.pandadoc.com/a/#/settings/integrations/api',
  },
  {
    title: 'Create an API Key',
    instructions: (
      <>
        <p>In the API section, click <b>"Create API Key"</b>.</p>
        <p>Give it a name like <b>"SimOffice"</b>.</p>
        <p>Your agents will be able to:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li>Create and send documents from templates</li>
          <li>Track document status and views</li>
          <li>Manage contacts and recipients</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Paste your API Key',
    instructions: (
      <>
        <p>Copy the API key and paste it below.</p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(191,219,254,0.5)' }}>
          You can revoke this key anytime from PandaDoc settings.
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
