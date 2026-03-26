/**
 * Automation template definitions.
 * Each template pre-fills the create form with a name, prompt, and schedule.
 * Only includes templates that work with what agents can actually do —
 * summarize their own context, report status, and review available work.
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  schedule: string;       // cron expression
  icon: string;           // emoji
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'morning-briefing',
    name: 'Morning Briefing',
    description: 'Summarize priorities, blockers, and what changed overnight.',
    prompt: 'Create a concise morning briefing. Summarize current priorities, blocked work, recent notable changes, and the next recommended actions.',
    schedule: '0 9 * * *',
    icon: '🌅',
  },
  {
    id: 'end-of-day-report',
    name: 'End-of-Day Report',
    description: 'Summarize what happened today and what needs follow-up.',
    prompt: 'Write an end-of-day report. Summarize completed work, open items, any issues encountered, and what needs attention tomorrow.',
    schedule: '0 17 * * 1-5',
    icon: '🌙',
  },
  {
    id: 'weekly-progress',
    name: 'Weekly Progress Report',
    description: 'Every Monday — roll up wins, unfinished work, and next steps.',
    prompt: 'Write a weekly progress report. Include completed work, unfinished work, risks, and the most important next steps for the coming week.',
    schedule: '0 8 * * 1',
    icon: '📊',
  },
  {
    id: 'health-check',
    name: 'Health Check',
    description: 'Report status, errors, blocked tasks, and whether a human needs to step in.',
    prompt: 'Run a health check. Summarize your current status, errors, blocked tasks, pending approvals, and whether a human needs to step in.',
    schedule: '0 * * * *',
    icon: '🩺',
  },
  {
    id: 'code-review-digest',
    name: 'Nightly Code Review',
    description: 'Review the day and summarize risky changes or regressions.',
    prompt: 'Review the latest work available to you and produce a digest of risky changes, unresolved questions, and follow-up recommendations for the team.',
    schedule: '0 0 * * *',
    icon: '🔍',
  },
  {
    id: 'continuous-monitor',
    name: 'Continuous Monitor',
    description: 'Watch for drift, silent failures, or anything unusual.',
    prompt: 'Monitor your current context and report only if you detect unusual behavior, blocked progress, repeated failures, or opportunities that need attention.',
    schedule: '*/15 * * * *',
    icon: '📡',
  },
];
