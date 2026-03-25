/**
 * Career Templates — maps careers to recommended agent teams
 * Each career gets a curated team from the 204 available agents
 */

export interface CareerTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  recommended: string[]; // agent IDs from agents.json
}

export const CAREERS: CareerTemplate[] = [
  {
    id: 'musician',
    label: 'Musician / Artist',
    icon: '🎵',
    description: 'Manage bookings, fans, content, and finances',
    recommended: [
      'social-media', 'copywriter', 'podcast-producer', 'brand-designer',
      'invoice-tracker', 'meeting-scheduler', 'personal-crm', 'sales-assistant',
      'email-campaign', 'daily-planner',
    ],
  },
  {
    id: 'realtor',
    label: 'Real Estate Agent',
    icon: '🏠',
    description: 'Listings, clients, contracts, market analysis',
    recommended: [
      'listing-scout', 'market-analyzer', 'lead-qualifier', 'property-video',
      'personal-crm', 'meeting-scheduler', 'invoice-tracker', 'copywriter',
      'social-media', 'review-asker',
    ],
  },
  {
    id: 'loan-officer',
    label: 'Loan Officer',
    icon: '🏦',
    description: 'Rates, pipeline, docs, realtor partnerships',
    recommended: [
      'mortgage-rate-watcher', 'loan-pipeline', 'doc-chaser', 'realtor-partner',
      'rate-sheet', 'personal-crm', 'meeting-scheduler', 'email-campaign',
      'review-asker', 'referral-manager',
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance Agent',
    icon: '🛡️',
    description: 'Quotes, renewals, claims, client management',
    recommended: [
      'insurance-quote', 'policy-renewal', 'claims-intake', 'personal-crm',
      'meeting-scheduler', 'email-campaign', 'review-asker', 'referral-manager',
      'cold-outreach', 'appointment-booker',
    ],
  },
  {
    id: 'restaurant',
    label: 'Restaurant Owner',
    icon: '🍽️',
    description: 'Menu, reservations, costs, reviews, staff',
    recommended: [
      'menu-manager', 'reservation-agent', 'food-cost', 'review-asker',
      'social-media', 'local-seo', 'appointment-booker', 'invoice-manager',
      'email-campaign', 'customer-support',
    ],
  },
  {
    id: 'contractor',
    label: 'Contractor / Trades',
    icon: '🔨',
    description: 'Estimates, permits, scheduling, invoices',
    recommended: [
      'estimate-builder', 'permit-tracker', 'appointment-booker', 'invoice-manager',
      'review-asker', 'local-seo', 'referral-manager', 'personal-crm',
      'email-campaign', 'warranty-tracker',
    ],
  },
  {
    id: 'nonprofit',
    label: 'Nonprofit',
    icon: '💚',
    description: 'Grants, donors, campaigns, volunteers',
    recommended: [
      'grant-writer', 'donor-manager', 'email-campaign', 'newsletter',
      'social-media', 'social-proof', 'copywriter', 'report-generator',
      'meeting-scheduler', 'daily-planner',
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    icon: '🛒',
    description: 'Products, orders, marketing, customer support',
    recommended: [
      'abandoned-cart', 'inventory-tracker', 'pricing-optimizer', 'product-lister',
      'review-responder', 'customer-support', 'social-media', 'email-campaign',
      'seo-writer', 'dropshipping-researcher',
    ],
  },
  {
    id: 'agency',
    label: 'Agency / Freelancer',
    icon: '💼',
    description: 'Clients, projects, proposals, billing',
    recommended: [
      'proposal-writer', 'client-manager', 'time-tracker', 'estimate-builder',
      'personal-crm', 'invoice-tracker', 'meeting-scheduler',
      'copywriter', 'social-media', 'sales-assistant',
    ],
  },
  {
    id: 'saas',
    label: 'SaaS / Startup',
    icon: '🚀',
    description: 'Product, engineering, growth, support',
    recommended: [
      'churn-predictor', 'churn-prevention', 'onboarding-flow', 'usage-analytics',
      'changelog', 'feature-request', 'customer-support', 'sales-assistant',
      'social-media', 'reddit-growth',
    ],
  },
  {
    id: 'content',
    label: 'Content Creator',
    icon: '📱',
    description: 'Videos, posts, sponsorships, audience growth',
    recommended: [
      'social-media', 'copywriter', 'podcast-producer', 'video-scripter',
      'brand-designer', 'email-campaign', 'seo-writer', 'tiktok-repurposer',
      'daily-planner', 'invoice-tracker',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    description: 'Patients, scheduling, records, compliance',
    recommended: [
      'patient-intake', 'symptom-triage', 'clinical-notes', 'medication-checker',
      'appointment-booker', 'meal-planner', 'wellness-coach',
      'meeting-scheduler', 'daily-planner', 'invoice-tracker',
    ],
  },
  {
    id: 'education',
    label: 'Education / Coaching',
    icon: '📚',
    description: 'Students, curriculum, content, assessments',
    recommended: [
      'tutor', 'language-tutor', 'quiz-maker', 'study-planner',
      'curriculum-designer', 'essay-grader', 'flashcard-generator',
      'research-assistant',
    ],
  },
  {
    id: 'property-mgmt',
    label: 'Property Management',
    icon: '🏢',
    description: 'Tenants, rent, maintenance, leases',
    recommended: [
      'property-manager', 'rental-screener', 'appointment-booker', 'invoice-manager',
      'personal-crm', 'review-asker', 'local-seo', 'email-campaign',
      'meeting-scheduler', 'warranty-tracker',
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics / Fleet',
    icon: '🚛',
    description: 'Vehicles, routes, inventory, compliance',
    recommended: [
      'fleet-manager', 'route-optimizer', 'inventory-forecaster', 'vendor-evaluator',
      'warranty-tracker', 'permit-tracker', 'invoice-manager', 'report-generator',
      'daily-standup', 'meeting-scheduler',
    ],
  },
  {
    id: 'custom',
    label: 'Custom / Other',
    icon: '⚙️',
    description: 'Browse all 204 agents and pick your own team',
    recommended: [],
  },
];

// Human-readable category labels
export const CATEGORY_LABELS: Record<string, string> = {
  'automation': 'Automation',
  'business': 'Business',
  'compliance': 'Compliance',
  'creative': 'Creative',
  'customer-success': 'Customer Success',
  'data': 'Data & Analytics',
  'development': 'Development',
  'devops': 'DevOps',
  'ecommerce': 'E-Commerce',
  'education': 'Education',
  'finance': 'Finance',
  'freelance': 'Freelance',
  'healthcare': 'Healthcare',
  'hr': 'HR',
  'insurance': 'Insurance',
  'legal': 'Legal',
  'marketing': 'Marketing',
  'moltbook': 'General',
  'nonprofit': 'Nonprofit',
  'personal': 'Personal',
  'productivity': 'Productivity',
  'real-estate': 'Real Estate',
  'restaurant': 'Restaurant',
  'saas': 'SaaS',
  'security': 'Security',
  'supply-chain': 'Supply Chain',
  'voice': 'Voice',
};
