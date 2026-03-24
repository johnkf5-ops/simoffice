# SimOffice v1.0 — Integration Wizard Verification Checklist

All 29 integration wizards verified against actual platform documentation and fixed.

## Verification Status

| # | Integration | Wizard Accurate | Beginner-Friendly | Status |
|---|---|---|---|---|
| 1 | HubSpot | Fixed scopes (.read/.write), EU token support, Super Admin note | Yes | ✅ Verified & Fixed |
| 2 | PandaDoc | Fixed URL, Dev Center flow, Enterprise plan note, admin note | Yes | ✅ Verified & Fixed |
| 3 | Slack | Added chat:write.public, channel invite note, admin approval note | Yes | ✅ Verified & Fixed |
| 4 | Google Workspace | Fixed URL, added Workspace-only warning, project prerequisite, JSON download note | Yes | ✅ Verified & Fixed |
| 5 | Notion | Fixed "Connect to" → "Add connections", added explicit sharing note | Yes | ✅ Verified & Fixed |
| 6 | GitHub | Fixed URL, token prefix (github_pat_), added expiration/resource owner steps | Yes | ✅ Verified & Fixed |
| 7 | Jira | Added copy-once warning, 1yr expiry note, domain explanation | Yes | ✅ Verified & Fixed |
| 8 | Stripe | Added live/test mode warning, restricted keys location, copy-once note | Yes | ✅ Verified & Fixed |
| 9 | Zapier | Added paid plan requirement, fixed step order, added publish note | Yes | ✅ Verified & Fixed |
| 10 | Salesforce | Rewrote: Consumer Key/Secret instead of access token, callback URL, activation delay | Yes | ✅ Verified & Fixed |
| 11 | Mailchimp | Fixed URL (removed datacenter-specific us1), updated nav instructions | Yes | ✅ Verified & Fixed |
| 12 | SendGrid | Added 2FA requirement, copy-once warning | Yes | ✅ Verified & Fixed |
| 13 | Calendly | Removed incorrect JWT reference | Yes | ✅ Verified & Fixed |
| 14 | Intercom | Clarified developer workspace vs production | Yes | ✅ Verified & Fixed |
| 15 | GitLab | Added required expiration date, copy-once warning | Yes | ✅ Verified & Fixed |
| 16 | Linear | No changes needed — already accurate | Yes | ✅ Verified |
| 17 | Sentry | Added org slug explanation with example | Yes | ✅ Verified & Fixed |
| 18 | Datadog | Added regional site support, separate App Key URL | Yes | ✅ Verified & Fixed |
| 19 | Vercel | Added Full Account scope recommendation | Yes | ✅ Verified & Fixed |
| 20 | Airtable | Emphasized mandatory base selection step | Yes | ✅ Verified & Fixed |
| 21 | Monday.com | Fixed avatar location (bottom-left), token is revealed not created | Yes | ✅ Verified & Fixed |
| 22 | Asana | Fixed URL to /0/my-apps, corrected nav path | Yes | ✅ Verified & Fixed |
| 23 | Trello | Added Power-Up creation explanation | Yes | ✅ Verified & Fixed |
| 24 | Confluence | Added domain explanation, token expiry note | Yes | ✅ Verified & Fixed |
| 25 | QuickBooks | Rewrote: Client ID/Secret instead of access token, OAuth warning | Yes | ✅ Verified & Fixed |
| 26 | DocuSign | Rewrote: Integration Key + RSA key instead of access token, JWT auth | Yes | ✅ Verified & Fixed |
| 27 | Xero | Rewrote: Client ID/Secret instead of access token, 30min expiry warning | Yes | ✅ Verified & Fixed |
| 28 | Twilio | Fixed to collect Account SID in wizard, added Show button note | Yes | ✅ Verified & Fixed |
| 29 | Zendesk | Fixed login URL, added subdomain explanation | Yes | ✅ Verified & Fixed |

## Critical Issues Found & Fixed

### OAuth Platforms (tokens expire, need Client ID/Secret instead)
- **Salesforce** — Was asking for "access token" which doesn't exist after Connected App creation. Now asks for Consumer Key + Consumer Secret.
- **QuickBooks** — Access tokens expire in 1 hour. Now asks for Client ID + Client Secret for ongoing access.
- **DocuSign** — Access tokens expire in 1 hour. Now asks for Integration Key + RSA Private Key for JWT auth.
- **Xero** — Access tokens expire in 30 minutes. Now asks for Client ID + Client Secret.

### Wrong URLs Fixed
- **Google Workspace** — Was /apis/credentials (OAuth page), now /iam-admin/serviceaccounts (correct)
- **GitHub** — Was ?type=beta (old beta URL), now /personal-access-tokens (canonical)
- **Mailchimp** — Was us1.admin.mailchimp.com (only works for US1 datacenter), now mailchimp.com
- **Asana** — Was /0/developer-console (404), now /0/my-apps (correct)
- **DocuSign** — Was admindemo URL, now developers.docusign.com

### Wrong Steps Fixed
- **HubSpot** — Scope names were wrong (missing .read/.write suffix). Now lists all 6 individual scopes.
- **PandaDoc** — UI flow outdated. Now reflects Dev Center model.
- **Salesforce** — Step 3 was completely wrong (no access token after Connected App creation).
- **Zapier** — Step order was wrong (webhook URL comes during trigger setup, not after action).

### Missing Warnings Added
- **Google Workspace** — Service accounts only work with paid Google Workspace, NOT personal Gmail
- **Zapier** — Webhooks by Zapier requires a paid plan
- **SendGrid** — 2FA must be enabled first
- **PandaDoc** — Production keys may require Enterprise plan
- **HubSpot** — Must be Super Admin
- **Various** — Copy-once warnings for tokens that can't be viewed again (GitLab, Jira, SendGrid, Stripe)

## Files Modified
- `src/components/channels/ChannelSetupWizard.tsx` — All 29 wizard step definitions
- `src/types/channel.ts` — Config fields, URLs, and placeholders for 8 integrations
