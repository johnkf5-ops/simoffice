import type { HardwareInfo } from './detect';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QualityTier = 'Basic' | 'Good' | 'Strong' | 'Very Strong' | 'Excellent';

export type CapabilityTier =
  | 'Light Duty'
  | 'Solid Performer'
  | 'Strong Performer'
  | 'Heavy Hitter'
  | 'Cloud-Quality, On Your Machine';

export type BestForTag =
  | 'all-rounder'
  | 'coding'
  | 'reasoning'
  | 'math'
  | 'vision'
  | 'assistant'
  | 'conversation'
  | 'writing'
  | 'data';

export interface ModelEntry {
  ollamaTag: string;
  name: string;
  params: string;
  downloadGB: number;
  minRamGB: number;
  qualityTier: QualityTier;
  bestFor: BestForTag[];
  description: string;
  isMoE: boolean;
  hasVision: boolean;
  hasThinking: boolean;
  thinkingNote?: string;
}

export interface SpeedEstimate {
  tokensPerSecond: [number, number]; // [low, high] range
  humanSpeed: string;
  ttftCold: string;
  ttftWarm: string;
}

export interface ModelRecommendation {
  model: ModelEntry;
  speed: SpeedEstimate;
  capabilityTier: CapabilityTier;
  capabilityDescription: string;
  speedDescription: string;
  capabilities: { label: string; supported: boolean }[];
  recommendedNumCtx: number;
}

export interface RecommendationResult {
  recommended: ModelRecommendation | null;
  advancedModels: ModelRecommendation[];
  hardwareWarning: string | null;
}

// ---------------------------------------------------------------------------
// Model Database — curated from build plan + research
// ---------------------------------------------------------------------------

export const MODEL_DATABASE: ModelEntry[] = [
  // --- 8GB RAM ---
  {
    ollamaTag: 'phi4-mini:latest',
    name: 'Phi-4 Mini',
    params: '3.8B',
    downloadGB: 2.5,
    minRamGB: 8,
    qualityTier: 'Basic',
    bestFor: ['math', 'reasoning'],
    description: 'Tiny but beats GPT-4o on math. Best for 8GB machines.',
    isMoE: false,
    hasVision: false,
    hasThinking: false,
  },
  {
    ollamaTag: 'gemma3:4b',
    name: 'Gemma 3',
    params: '4B',
    downloadGB: 3.3,
    minRamGB: 8,
    qualityTier: 'Basic',
    bestFor: ['all-rounder', 'vision'],
    description: 'See images, answer questions, handle basics. Google-made.',
    isMoE: false,
    hasVision: true,
    hasThinking: false,
  },
  {
    ollamaTag: 'qwen3.5:4b',
    name: 'Qwen 3.5',
    params: '4B',
    downloadGB: 3.4,
    minRamGB: 8,
    qualityTier: 'Basic',
    bestFor: ['all-rounder', 'vision'],
    description: 'Small but capable. Understands images. 256K context.',
    isMoE: false,
    hasVision: true,
    hasThinking: true,
    thinkingNote: 'API parameter only, /nothink does not work.',
  },

  // --- 16GB RAM ---
  {
    ollamaTag: 'llama3.1:8b',
    name: 'Llama 3.1',
    params: '8B',
    downloadGB: 4.9,
    minRamGB: 16,
    qualityTier: 'Good',
    bestFor: ['assistant', 'conversation'],
    description: 'Reliable, well-tested. Biggest community. Great for chat.',
    isMoE: false,
    hasVision: false,
    hasThinking: false,
  },
  {
    ollamaTag: 'qwen3:8b',
    name: 'Qwen 3',
    params: '8B',
    downloadGB: 5.2,
    minRamGB: 16,
    qualityTier: 'Good',
    bestFor: ['coding', 'reasoning'],
    description: 'Best coder under 16GB. Strong at writing code and scripts.',
    isMoE: false,
    hasVision: false,
    hasThinking: true,
    thinkingNote: 'Supports /nothink in-message to disable.',
  },
  {
    ollamaTag: 'deepseek-r1:8b',
    name: 'DeepSeek R1',
    params: '8B',
    downloadGB: 5.2,
    minRamGB: 16,
    qualityTier: 'Good',
    bestFor: ['reasoning', 'math'],
    description: 'Thinks step-by-step. Best for hard problems and math.',
    isMoE: false,
    hasVision: false,
    hasThinking: true,
    thinkingNote: 'Disabling thinking significantly degrades quality.',
  },
  {
    ollamaTag: 'qwen3.5:9b',
    name: 'Qwen 3.5',
    params: '9B',
    downloadGB: 6.6,
    minRamGB: 16,
    qualityTier: 'Good',
    bestFor: ['all-rounder', 'vision', 'coding'],
    description: 'The best small model. Does everything well. Sees images.',
    isMoE: false,
    hasVision: true,
    hasThinking: true,
    thinkingNote: 'API parameter only, /nothink does not work.',
  },

  // --- 24GB RAM ---
  {
    ollamaTag: 'gpt-oss:20b',
    name: 'GPT-OSS',
    params: '20B (MoE)',
    downloadGB: 14,
    minRamGB: 24,
    qualityTier: 'Strong',
    bestFor: ['reasoning', 'assistant'],
    description: "OpenAI's open model. Matches o3-mini reasoning quality.",
    isMoE: true,
    hasVision: false,
    hasThinking: false,
  },

  // --- 32GB RAM ---
  {
    ollamaTag: 'devstral:24b',
    name: 'Devstral',
    params: '24B',
    downloadGB: 14,
    minRamGB: 32,
    qualityTier: 'Strong',
    bestFor: ['coding'],
    description: 'Built specifically for coding agents. Best at multi-file edits.',
    isMoE: false,
    hasVision: false,
    hasThinking: false,
  },
  {
    ollamaTag: 'mistral-small3.1:24b',
    name: 'Mistral Small 3.1',
    params: '24B',
    downloadGB: 15,
    minRamGB: 32,
    qualityTier: 'Strong',
    bestFor: ['vision', 'assistant', 'data'],
    description: 'Sees images, calls tools, fast. Good for business agents.',
    isMoE: false,
    hasVision: true,
    hasThinking: false,
  },
  {
    ollamaTag: 'qwen3.5:27b',
    name: 'Qwen 3.5',
    params: '27B',
    downloadGB: 17,
    minRamGB: 32,
    qualityTier: 'Very Strong',
    bestFor: ['coding', 'vision', 'all-rounder'],
    description: 'Best coder under 32GB. SWE-bench 72.4%. Sees images.',
    isMoE: false,
    hasVision: true,
    hasThinking: true,
    thinkingNote: 'API parameter only, /nothink does not work.',
  },

  // --- 48GB RAM ---
  {
    ollamaTag: 'deepseek-r1:32b',
    name: 'DeepSeek R1',
    params: '32B',
    downloadGB: 20,
    minRamGB: 48,
    qualityTier: 'Very Strong',
    bestFor: ['reasoning', 'math', 'coding'],
    description: 'Deep chain-of-thought reasoning. The thinking champion.',
    isMoE: false,
    hasVision: false,
    hasThinking: true,
    thinkingNote: 'Disabling thinking significantly degrades quality.',
  },
  {
    ollamaTag: 'qwen3.5:35b',
    name: 'Qwen 3.5',
    params: '35B-A3B (MoE)',
    downloadGB: 24,
    minRamGB: 48,
    qualityTier: 'Very Strong',
    bestFor: ['all-rounder', 'vision'],
    description: 'Fast MoE model. Good at everything, especially quick tasks.',
    isMoE: true,
    hasVision: true,
    hasThinking: true,
    thinkingNote: 'API parameter only, /nothink does not work.',
  },
  {
    ollamaTag: 'qwen3:32b',
    name: 'Qwen 3',
    params: '32B',
    downloadGB: 20,
    minRamGB: 48,
    qualityTier: 'Very Strong',
    bestFor: ['all-rounder', 'coding'],
    description: 'Strong across the board. 40K context.',
    isMoE: false,
    hasVision: false,
    hasThinking: true,
    thinkingNote: 'Supports /nothink in-message to disable.',
  },

  // --- 64GB RAM ---
  {
    ollamaTag: 'llama3.3:70b',
    name: 'Llama 3.3',
    params: '70B',
    downloadGB: 43,
    minRamGB: 64,
    qualityTier: 'Excellent',
    bestFor: ['assistant', 'coding', 'writing'],
    description: 'Cloud-quality AI locally. Best large open model.',
    isMoE: false,
    hasVision: false,
    hasThinking: false,
  },

  // --- 96GB RAM ---
  {
    ollamaTag: 'gpt-oss:120b',
    name: 'GPT-OSS',
    params: '120B (MoE)',
    downloadGB: 65,
    minRamGB: 96,
    qualityTier: 'Excellent',
    bestFor: ['reasoning', 'assistant'],
    description: 'Surpasses o4-mini. Best reasoning model you can run locally.',
    isMoE: true,
    hasVision: false,
    hasThinking: false,
  },

  // --- 128GB RAM ---
  {
    ollamaTag: 'qwen3.5:122b',
    name: 'Qwen 3.5',
    params: '122B-A10B (MoE)',
    downloadGB: 81,
    minRamGB: 128,
    qualityTier: 'Excellent',
    bestFor: ['all-rounder', 'vision', 'coding'],
    description: 'Maximum quality. 122B params, multimodal, 256K context.',
    isMoE: true,
    hasVision: true,
    hasThinking: true,
    thinkingNote: 'API parameter only, /nothink does not work.',
  },
];

// ---------------------------------------------------------------------------
// Speed Estimation
// ---------------------------------------------------------------------------

type ParamBucket = '3-4B' | '7-9B' | '12-14B' | '20-27B' | '32-35B' | '70B' | '120B+';

function getParamBucket(model: ModelEntry): ParamBucket {
  const dl = model.downloadGB;
  if (dl <= 3.5) return '3-4B';
  if (dl <= 7) return '7-9B';
  if (dl <= 15) return '12-14B';
  if (dl <= 20) return '20-27B';
  if (dl <= 25) return '32-35B';
  if (dl <= 50) return '70B';
  return '120B+';
}

// Approximate tok/s ranges indexed by [bandwidth bracket][param bucket]
// Bandwidth brackets: <100, 100-199, 200-299, 300-399, 400-546
const SPEED_TABLE: Record<string, Record<ParamBucket, [number, number] | null>> = {
  'low': {       // <100 GB/s  (M1 base, M2 base, M3 base)
    '3-4B':   [15, 25],
    '7-9B':   [10, 20],
    '12-14B': null,
    '20-27B': null,
    '32-35B': null,
    '70B':    null,
    '120B+':  null,
  },
  'mid-low': {   // 100-199 GB/s  (M2/M3/M4 base, M3 Pro)
    '3-4B':   [22, 33],
    '7-9B':   [18, 25],
    '12-14B': [12, 17],
    '20-27B': null,
    '32-35B': null,
    '70B':    null,
    '120B+':  null,
  },
  'mid': {       // 200-299 GB/s  (M1/M2 Pro, M4 Pro)
    '3-4B':   [30, 42],
    '7-9B':   [25, 42],
    '12-14B': [15, 22],
    '20-27B': [12, 18],
    '32-35B': null,
    '70B':    null,
    '120B+':  null,
  },
  'mid-high': {  // 300-399 GB/s  (M3 Max 14-core, M1/M2 Max)
    '3-4B':   [40, 50],
    '7-9B':   [35, 50],
    '12-14B': [22, 28],
    '20-27B': [15, 22],
    '32-35B': [12, 18],
    '70B':    [8, 12],
    '120B+':  null,
  },
  'high': {      // 400-546 GB/s  (M3 Max 16-core, M4 Max, Ultras)
    '3-4B':   [45, 60],
    '7-9B':   [42, 59],
    '12-14B': [25, 30],
    '20-27B': [18, 25],
    '32-35B': [15, 22],
    '70B':    [10, 14],
    '120B+':  [5, 8],
  },
  'ultra': {     // 800 GB/s  (Ultras)
    '3-4B':   [55, 70],
    '7-9B':   [50, 65],
    '12-14B': [30, 40],
    '20-27B': [22, 30],
    '32-35B': [18, 25],
    '70B':    [12, 18],
    '120B+':  [8, 12],
  },
};

function getBandwidthBracket(bw: number): string {
  if (bw >= 800) return 'ultra';
  if (bw >= 400) return 'high';
  if (bw >= 300) return 'mid-high';
  if (bw >= 200) return 'mid';
  if (bw >= 100) return 'mid-low';
  return 'low';
}

function humanSpeedLabel(tps: [number, number]): string {
  const avg = (tps[0] + tps[1]) / 2;
  if (avg >= 40) return 'Very fast — like reading a quick text message';
  if (avg >= 25) return 'Fast typing speed — responses flow smoothly';
  if (avg >= 15) return 'Conversational speed — like chatting with a coworker';
  if (avg >= 8) return 'Thoughtful pace — takes a beat before responding, but worth the wait';
  return 'Slower — like a careful colleague composing a detailed reply';
}

const TTFT_COLD: Record<ParamBucket, string> = {
  '3-4B':  '3-5 seconds',
  '7-9B':  '5-10 seconds',
  '12-14B': '8-15 seconds',
  '20-27B': '10-20 seconds',
  '32-35B': '15-30 seconds',
  '70B':   '30-60 seconds',
  '120B+': '45-90 seconds',
};

const TTFT_WARM: Record<ParamBucket, string> = {
  '3-4B':  'Under 1 second',
  '7-9B':  'Under 1 second',
  '12-14B': '1-2 seconds',
  '20-27B': '1-2 seconds',
  '32-35B': '1-3 seconds',
  '70B':   '2-5 seconds',
  '120B+': '3-8 seconds',
};

function estimateSpeed(model: ModelEntry, bandwidthGBs: number): SpeedEstimate {
  const bucket = getParamBucket(model);
  const bracket = getBandwidthBracket(bandwidthGBs);
  const tps = SPEED_TABLE[bracket]?.[bucket] ?? [3, 8];

  return {
    tokensPerSecond: tps,
    humanSpeed: humanSpeedLabel(tps),
    ttftCold: TTFT_COLD[bucket],
    ttftWarm: TTFT_WARM[bucket],
  };
}

// ---------------------------------------------------------------------------
// Capability Tiers
// ---------------------------------------------------------------------------

interface TierInfo {
  tier: CapabilityTier;
  description: string;
  speedDescription: string;
  capabilities: { label: string; supported: boolean }[];
}

function getTierInfo(model: ModelEntry): TierInfo {
  const dl = model.downloadGB;

  if (dl <= 3.5) {
    return {
      tier: 'Light Duty',
      description: 'Your computer can run a small AI assistant. It\'s quick for simple tasks but won\'t handle complex work.',
      speedDescription: 'Typing speed — like watching someone type a reply. First response takes a few seconds to start.',
      capabilities: [
        { label: 'Answer straightforward questions', supported: true },
        { label: 'Draft short emails and messages', supported: true },
        { label: 'Summarize a paragraph or two', supported: true },
        { label: 'Basic spelling and grammar help', supported: true },
        { label: 'Writing blog posts or long documents', supported: false },
        { label: 'Analyzing spreadsheets or data', supported: false },
        { label: 'Writing or understanding code', supported: false },
        { label: 'Complex reasoning or multi-step planning', supported: false },
      ],
    };
  }

  if (dl <= 7) {
    return {
      tier: 'Solid Performer',
      description: 'Your computer can run a capable AI assistant. Good for everyday business tasks — writing, responding, organizing.',
      speedDescription: 'Fast typing speed — responses flow smoothly. First response takes about a second.',
      capabilities: [
        { label: 'Answer questions with good accuracy', supported: true },
        { label: 'Write emails, messages, and short documents', supported: true },
        { label: 'Customer support with context understanding', supported: true },
        { label: 'Social media posts and basic marketing copy', supported: true },
        { label: 'Summarize documents and extract key points', supported: true },
        { label: 'Simple code snippets and scripts', supported: true },
        { label: 'Long-form writing (may lose coherence)', supported: false },
        { label: 'Deep analysis or research tasks', supported: false },
        { label: 'Complex multi-step business logic', supported: false },
      ],
    };
  }

  if (dl <= 17) {
    return {
      tier: 'Strong Performer',
      description: 'Your computer can run a serious AI assistant. Handles most business tasks well — writing, analysis, planning.',
      speedDescription: 'Conversational speed — like chatting with a coworker. Responses start within a second or two.',
      capabilities: [
        { label: 'Everything a Solid Performer can do, plus:', supported: true },
        { label: 'Longer documents and proposals', supported: true },
        { label: 'More nuanced customer interactions', supported: true },
        { label: 'Code generation and basic debugging', supported: true },
        { label: 'Data analysis and summarization', supported: true },
        { label: 'Content strategy and planning', supported: true },
        { label: 'Novel-length writing consistency', supported: false },
        { label: 'Expert-level reasoning', supported: false },
      ],
    };
  }

  if (dl <= 43) {
    return {
      tier: 'Heavy Hitter',
      description: 'Your computer can run a powerful AI. Handles complex tasks — detailed writing, analysis, coding, strategy.',
      speedDescription: 'Smooth and responsive. First response in 1-3 seconds, then flows steadily.',
      capabilities: [
        { label: 'Everything a Strong Performer can do, plus:', supported: true },
        { label: 'Long-form writing (blogs, reports, proposals)', supported: true },
        { label: 'Complex reasoning and analysis', supported: true },
        { label: 'Solid code generation and debugging', supported: true },
        { label: 'Multi-step planning and strategy', supported: true },
        { label: 'Detailed financial and business analysis', supported: true },
        { label: 'Nuanced creative writing', supported: true },
      ],
    };
  }

  return {
    tier: 'Cloud-Quality, On Your Machine',
    description: 'Your computer can run an AI as powerful as what\'s behind ChatGPT Plus and Claude Pro — but it runs entirely on your machine. Your data never leaves your computer.',
    speedDescription: 'A little slower than smaller models — like a thoughtful colleague who takes a beat before responding. But the quality is worth it.',
    capabilities: [
      { label: 'Everything. Full capability.', supported: true },
      { label: 'Rivals cloud AI quality (GPT-4, Claude Sonnet)', supported: true },
      { label: 'Professional-grade writing and editing', supported: true },
      { label: 'Advanced code generation and architecture', supported: true },
      { label: 'Deep research and multi-source analysis', supported: true },
      { label: 'Complex business strategy and planning', supported: true },
      { label: 'All your agents at maximum capability', supported: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// Context Window Recommendation
// ---------------------------------------------------------------------------

function recommendNumCtx(hardware: HardwareInfo, model: ModelEntry): number {
  const headroom = hardware.availableRamGB - model.downloadGB;
  if (headroom >= 8) return 16384;
  if (headroom >= 4) return 8192;
  if (headroom >= 2) return 4096;
  return 2048;
}

// ---------------------------------------------------------------------------
// Recommendation Engine
// ---------------------------------------------------------------------------

function buildRecommendation(model: ModelEntry, hardware: HardwareInfo): ModelRecommendation {
  const speed = estimateSpeed(model, hardware.memoryBandwidthGBs);
  const tierInfo = getTierInfo(model);

  return {
    model,
    speed,
    capabilityTier: tierInfo.tier,
    capabilityDescription: tierInfo.description,
    speedDescription: tierInfo.speedDescription,
    capabilities: tierInfo.capabilities,
    recommendedNumCtx: recommendNumCtx(hardware, model),
  };
}

/**
 * Given detected hardware, recommend the best model and list alternatives.
 *
 * - **Recommended tier:** models fitting in 75% of available RAM
 * - **Advanced tier:** models between 75-90% of RAM (collapsed, with warning)
 * - Models above 90% are hidden entirely
 */
export function getRecommendation(hardware: HardwareInfo): RecommendationResult {
  const ram = hardware.availableRamGB;
  const threshold75 = ram * 0.75;
  const threshold90 = ram * 0.90;

  // Intel Mac edge case
  if (!hardware.isAppleSilicon) {
    const intelModels = MODEL_DATABASE.filter(m => m.minRamGB <= 8 && m.downloadGB <= threshold75);
    const best = intelModels[intelModels.length - 1] ?? null;
    return {
      recommended: best ? buildRecommendation(best, hardware) : null,
      advancedModels: [],
      hardwareWarning: 'Your Mac uses an Intel processor. Local AI will run on CPU only, which is significantly slower than Apple Silicon. We recommend small models for the best experience.',
    };
  }

  // 8GB base chip warning
  let hardwareWarning: string | null = null;
  if (hardware.totalRamGB <= 8) {
    hardwareWarning = 'Your computer has 8GB of memory, so we can only run small AI brains. They\'re great for quick tasks but won\'t handle complex work. For a more powerful AI, a Mac with 16GB or more is recommended.';
  }

  // Filter models into tiers
  const recommended: ModelEntry[] = [];
  const advanced: ModelEntry[] = [];

  for (const model of MODEL_DATABASE) {
    if (model.downloadGB <= threshold75) {
      recommended.push(model);
    } else if (model.downloadGB <= threshold90) {
      advanced.push(model);
    }
    // Above 90% → hidden
  }

  // Pick the best recommended model (last = largest that fits comfortably)
  const bestModel = recommended[recommended.length - 1] ?? null;

  return {
    recommended: bestModel ? buildRecommendation(bestModel, hardware) : null,
    advancedModels: advanced.map(m => buildRecommendation(m, hardware)),
    hardwareWarning,
  };
}

/**
 * Get all models that could run on this hardware (for the advanced picker).
 */
export function getCompatibleModels(hardware: HardwareInfo): ModelRecommendation[] {
  const threshold90 = hardware.availableRamGB * 0.90;
  return MODEL_DATABASE
    .filter(m => m.downloadGB <= threshold90)
    .map(m => buildRecommendation(m, hardware));
}
