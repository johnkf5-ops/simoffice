/**
 * Career Templates — maps careers to recommended agent teams
 * Each career gets a curated team from the 174 available agents
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
    label: 'Real Estate',
    icon: '🏠',
    description: 'Listings, clients, contracts, market analysis',
    recommended: [
      'listing-optimizer', 'market-analyzer', 'open-house-coordinator',
      'lead-qualifier', 'rental-manager',
      'personal-crm', 'meeting-scheduler', 'invoice-tracker', 'copywriter',
      'social-media',
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    icon: '🛒',
    description: 'Products, orders, marketing, customer support',
    recommended: [
      'product-catalog', 'review-manager', 'cart-recovery', 'returns-handler',
      'pricing-optimizer', 'marketplace-sync',
      'social-media', 'email-campaign', 'seo-strategist', 'customer-support',
    ],
  },
  {
    id: 'agency',
    label: 'Agency / Freelancer',
    icon: '💼',
    description: 'Clients, projects, proposals, billing',
    recommended: [
      'proposal-writer', 'scope-tracker', 'client-reporter', 'time-tracker',
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
      'churn-predictor', 'feature-flagger', 'onboarding-optimizer',
      'trial-converter', 'usage-analyst', 'changelog-writer',
      'customer-support', 'sales-assistant', 'social-media', 'seo-strategist',
    ],
  },
  {
    id: 'content',
    label: 'Content Creator',
    icon: '📱',
    description: 'Videos, posts, sponsorships, audience growth',
    recommended: [
      'social-media', 'copywriter', 'podcast-producer', 'video-scriptwriter',
      'brand-designer', 'email-campaign', 'seo-strategist',
      'daily-planner', 'invoice-tracker', 'personal-crm',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    description: 'Patients, scheduling, records, compliance',
    recommended: [
      'patient-intake', 'symptom-checker', 'appointment-scheduler',
      'prescription-tracker', 'health-coach', 'mental-health-companion',
      'triage-assistant',
      'meeting-scheduler', 'daily-planner', 'invoice-tracker',
    ],
  },
  {
    id: 'education',
    label: 'Education / Coaching',
    icon: '📚',
    description: 'Students, curriculum, content, assessments',
    recommended: [
      'lesson-planner', 'quiz-generator', 'study-buddy', 'curriculum-mapper',
      'flashcard-maker', 'essay-reviewer', 'language-tutor', 'math-tutor',
    ],
  },
  {
    id: 'custom',
    label: 'Custom / Other',
    icon: '⚙️',
    description: 'Browse all 174 agents and pick your own team',
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
  'legal': 'Legal',
  'marketing': 'Marketing',
  'moltbook': 'General',
  'personal': 'Personal',
  'productivity': 'Productivity',
  'real-estate': 'Real Estate',
  'saas': 'SaaS',
  'security': 'Security',
  'supply-chain': 'Supply Chain',
  'voice': 'Voice',
};
