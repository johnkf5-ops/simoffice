/**
 * IntegrationsPanel — Right sidebar in chat showing connected business integrations.
 * Each integration expands to show suggested prompts that pre-fill the chat input.
 */
import { useEffect, useState } from 'react';
import { CHANNEL_ICONS, CHANNEL_NAMES, type ChannelType } from '@/types/channel';
import { invokeIpc } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

interface IntegrationsPanelProps {
  onSelectPrompt: (text: string) => void;
}

const INTEGRATION_PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  stripe_integration: [
    { label: 'List customers', prompt: 'List my Stripe customers' },
    { label: 'Recent invoices', prompt: 'Show my recent Stripe invoices' },
    { label: 'Active subscriptions', prompt: 'List my active Stripe subscriptions' },
    { label: 'Check balance', prompt: 'What is my Stripe account balance?' },
  ],
  github: [
    { label: 'My open PRs', prompt: 'List my open pull requests on GitHub' },
    { label: 'My issues', prompt: 'Show GitHub issues assigned to me' },
    { label: 'Search repos', prompt: 'Search my GitHub repositories' },
  ],
  gitlab: [
    { label: 'Search projects', prompt: 'Search my GitLab projects' },
    { label: 'Create issue', prompt: 'Help me create a new GitLab issue' },
  ],
  linear: [
    { label: 'My issues', prompt: 'Show my assigned Linear issues' },
    { label: 'Search issues', prompt: 'Search Linear issues' },
    { label: 'Create issue', prompt: 'Help me create a new Linear issue' },
  ],
  sentry: [
    { label: 'Unresolved issues', prompt: 'Show unresolved Sentry issues' },
    { label: 'Search errors', prompt: 'Search Sentry for recent errors' },
    { label: 'My projects', prompt: 'List my Sentry projects' },
  ],
  airtable: [
    { label: 'List bases', prompt: 'List my Airtable bases' },
    { label: 'Search records', prompt: 'Search records in my Airtable base' },
  ],
  mailchimp: [
    { label: 'Campaigns', prompt: 'Show my recent Mailchimp campaigns' },
    { label: 'Campaign stats', prompt: 'Show stats for my latest Mailchimp campaign' },
    { label: 'Audience', prompt: 'How many subscribers are in my Mailchimp audience?' },
  ],
  sendgrid: [
    { label: 'Email stats', prompt: 'Show my SendGrid email statistics for this week' },
    { label: 'Templates', prompt: 'List my SendGrid email templates' },
    { label: 'Send email', prompt: 'Help me send an email via SendGrid' },
  ],
  datadog: [
    { label: 'Monitor status', prompt: 'Show my Datadog monitors that are alerting' },
    { label: 'Recent logs', prompt: 'Search my recent Datadog logs' },
    { label: 'Dashboards', prompt: 'List my Datadog dashboards' },
  ],
  trello: [
    { label: 'My cards', prompt: 'Show Trello cards assigned to me' },
    { label: 'Board lists', prompt: 'Show all lists on my active Trello board' },
    { label: 'Add card', prompt: 'Help me add a new card to my Trello board' },
  ],
  zendesk: [
    { label: 'Search tickets', prompt: 'Search my open Zendesk tickets' },
    { label: 'Recent tickets', prompt: 'Show my most recent Zendesk tickets' },
    { label: 'Create ticket', prompt: 'Help me create a new Zendesk ticket' },
  ],
  hubspot: [
    { label: 'Contacts', prompt: 'List my recent HubSpot contacts' },
    { label: 'Search CRM', prompt: 'Search my HubSpot CRM' },
    { label: 'Open deals', prompt: 'Show my open HubSpot deals' },
  ],
  notion: [
    { label: 'Search pages', prompt: 'Search my Notion workspace' },
    { label: 'Recent pages', prompt: 'Show my recently edited Notion pages' },
    { label: 'Create page', prompt: 'Help me create a new Notion page' },
  ],
  jira: [
    { label: 'My tickets', prompt: 'Show Jira tickets assigned to me' },
    { label: 'Sprint board', prompt: 'What is in the current Jira sprint?' },
    { label: 'Create ticket', prompt: 'Help me create a new Jira ticket' },
  ],
  confluence: [
    { label: 'Search docs', prompt: 'Search Confluence for documentation' },
    { label: 'Recent pages', prompt: 'Show recently updated Confluence pages' },
  ],
  monday: [
    { label: 'My items', prompt: 'Show items assigned to me on Monday.com' },
    { label: 'Board status', prompt: 'Give me a status update from my Monday.com board' },
  ],
  asana: [
    { label: 'My tasks', prompt: 'Show my Asana tasks due this week' },
    { label: 'Search tasks', prompt: 'Search my Asana tasks' },
    { label: 'Create task', prompt: 'Help me create a new Asana task' },
  ],
  xero: [
    { label: 'Invoices', prompt: 'Show my recent Xero invoices' },
    { label: 'P&L report', prompt: 'Show my Xero profit and loss report' },
    { label: 'Contacts', prompt: 'List my Xero contacts' },
  ],
  calendly: [
    { label: 'Upcoming events', prompt: 'Show my upcoming Calendly events' },
    { label: 'Event details', prompt: 'Show details for my next Calendly event' },
  ],
  pandadoc: [
    { label: 'Find documents', prompt: 'Search my PandaDoc documents' },
    { label: 'Templates', prompt: 'List my PandaDoc templates' },
    { label: 'Create document', prompt: 'Help me create a new PandaDoc document from a template' },
  ],
};

const EMAIL_PROMPTS: { label: string; prompt: string }[] = [
  { label: 'Unread emails', prompt: 'Show my unread emails' },
  { label: 'Search inbox', prompt: 'Search my emails for...' },
  { label: 'Send email', prompt: 'Help me compose and send an email' },
  { label: 'Email stats', prompt: 'Show my email analytics — volume and top senders' },
];
INTEGRATION_PROMPTS.email_gmail = EMAIL_PROMPTS;
INTEGRATION_PROMPTS.email_outlook = EMAIL_PROMPTS;
INTEGRATION_PROMPTS.email_fastmail = EMAIL_PROMPTS;
INTEGRATION_PROMPTS.email_other = EMAIL_PROMPTS;

export function IntegrationsPanel({ onSelectPrompt }: IntegrationsPanelProps) {
  const navigate = useNavigate();
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    invokeIpc<Record<string, { configured: boolean }>>('integration:status-all')
      .then((statuses) => {
        setConnectedIds(Object.entries(statuses).filter(([, s]) => s.configured).map(([id]) => id));
      })
      .catch(() => {});
  }, []);

  if (connectedIds.length === 0) return null;

  return (
    <div style={{
      width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          Tools
        </div>
        <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
          {connectedIds.length} connected
        </div>
      </div>

      {/* Integration list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {connectedIds.map((id) => {
          const type = id as ChannelType;
          const icon = CHANNEL_ICONS[type] || '\uD83D\uDD27';
          const name = CHANNEL_NAMES[type] || id;
          const prompts = INTEGRATION_PROMPTS[id] || [];
          const isExpanded = expandedId === id;

          return (
            <div key={id} style={{ marginBottom: 2 }}>
              {/* Integration row */}
              <div
                onClick={() => {
                  if (prompts.length === 0) {
                    onSelectPrompt(`What can you do with ${name}?`);
                  } else {
                    setExpandedId(isExpanded ? null : id);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                  background: isExpanded ? 'hsl(var(--accent))' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {name}
                </span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#34d399', flexShrink: 0,
                }} />
              </div>

              {/* Expanded prompts */}
              {isExpanded && prompts.length > 0 && (
                <div style={{ padding: '4px 0 4px 12px' }}>
                  {prompts.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onSelectPrompt(p.prompt)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '5px 10px', marginBottom: 3, borderRadius: 8,
                        border: 'none', background: 'transparent',
                        color: 'hsl(var(--muted-foreground))', fontSize: 11,
                        cursor: 'pointer', transition: 'all 0.15s',
                        lineHeight: 1.3,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--accent))';
                        e.currentTarget.style.color = 'hsl(var(--foreground))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid hsl(var(--border))',
        textAlign: 'center',
      }}>
        <button
          onClick={() => navigate('/connections')}
          style={{
            background: 'none', border: 'none', fontSize: 10,
            color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          Manage connections
        </button>
      </div>
    </div>
  );
}
