/**
 * Automation inspiration cards.
 * Each card pre-fills the create form with a prompt start and default schedule.
 * Designed for non-technical users — relatable everyday use cases.
 */

export interface InspirationCard {
  id: string;
  title: string;
  description: string;
  promptStart: string;       // Pre-filled text, user completes it
  defaultSchedule: string;   // Cron expression
  icon: string;              // Emoji
}

export const INSPIRATION_CARDS: InspirationCard[] = [
  {
    id: 'price-alert',
    title: 'Price Alert',
    description: 'Get notified when a crypto or stock hits your target',
    promptStart: 'Watch the price of Bitcoin and alert me when it ',
    defaultSchedule: '*/15 * * * *',
    icon: '\u{1F4C8}',
  },
  {
    id: 'daily-digest',
    title: 'Daily Digest',
    description: 'A summary of the most important things each morning',
    promptStart: 'Summarize the most important things I should know today, including ',
    defaultSchedule: '0 8 * * *',
    icon: '\u{1F4CB}',
  },
  {
    id: 'email-summary',
    title: 'Email Summary',
    description: 'Highlights from your inbox so you never miss what matters',
    promptStart: 'Check my recent emails and highlight anything urgent or important, especially ',
    defaultSchedule: '0 9 * * *',
    icon: '\u{1F4E7}',
  },
  {
    id: 'reminder',
    title: 'Reminder',
    description: 'Set up a recurring reminder for anything',
    promptStart: 'Remind me to ',
    defaultSchedule: '0 9 * * *',
    icon: '\u{1F514}',
  },
  {
    id: 'news-brief',
    title: 'News Brief',
    description: 'Stay on top of topics you care about',
    promptStart: 'Give me a quick summary of today\'s top news about ',
    defaultSchedule: '0 8 * * *',
    icon: '\u{1F4F0}',
  },
  {
    id: 'health-checkin',
    title: 'Health Check-In',
    description: 'A gentle daily check-in to track how you\'re doing',
    promptStart: 'Ask me how I\'m feeling today and suggest ',
    defaultSchedule: '0 18 * * *',
    icon: '\u{1F49A}',
  },
  {
    id: 'weekly-review',
    title: 'Weekly Review',
    description: 'Look back at the week and plan ahead',
    promptStart: 'Summarize what happened this week and suggest priorities for next week, focusing on ',
    defaultSchedule: '0 9 * * 1',
    icon: '\u{1F4C5}',
  },
];
