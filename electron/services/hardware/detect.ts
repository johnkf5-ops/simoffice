import os from 'node:os';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HardwareInfo {
  totalRamGB: number;
  availableRamGB: number;
  cpuModel: string;
  chip: AppleSiliconChip | null;
  coreCount: number;
  arch: 'arm64' | 'x64' | string;
  osVersion: string;
  memoryBandwidthGBs: number;
  freeDiskGB: number;
  isAppleSilicon: boolean;
}

export interface AppleSiliconChip {
  generation: 'M1' | 'M2' | 'M3' | 'M4';
  variant: 'base' | 'Pro' | 'Max' | 'Ultra';
  gpuCores?: number;
}

// ---------------------------------------------------------------------------
// Memory Bandwidth Lookup (GB/s) — from build plan
// The #1 factor for inference speed on Apple Silicon.
// ---------------------------------------------------------------------------

const BANDWIDTH_TABLE: Record<string, number> = {
  'M1':                68,
  'M1 Pro':           200,
  'M1 Max':           400,
  'M1 Ultra':         800,
  'M2':               100,
  'M2 Pro':           200,
  'M2 Max':           400,
  'M2 Ultra':         800,
  'M3':               100,
  'M3 Pro':           150,
  'M3 Max':           400,   // 16-core GPU default; 14-core is 300
  'M3 Ultra':         800,
  'M4':               120,
  'M4 Pro':           273,
  'M4 Max':           546,
};

// ---------------------------------------------------------------------------
// Chip Parsing
// ---------------------------------------------------------------------------

/**
 * Parse Apple Silicon chip info from a CPU model string.
 * Examples:
 *   "Apple M3 Max"       → { generation: "M3", variant: "Max" }
 *   "Apple M1"           → { generation: "M1", variant: "base" }
 *   "Apple M4 Pro"       → { generation: "M4", variant: "Pro" }
 *   "Intel(R) Core i7"   → null
 */
export function parseAppleSiliconChip(cpuModel: string): AppleSiliconChip | null {
  const match = cpuModel.match(/Apple\s+(M[1-9]\d*)\s*(Pro|Max|Ultra)?/i);
  if (!match) return null;

  const generation = match[1].toUpperCase() as AppleSiliconChip['generation'];
  const variantRaw = match[2];
  const variant = variantRaw
    ? (variantRaw.charAt(0).toUpperCase() + variantRaw.slice(1).toLowerCase()) as AppleSiliconChip['variant']
    : 'base';

  return { generation, variant };
}

/**
 * Get memory bandwidth in GB/s for a given chip.
 * Returns a conservative estimate for Intel Macs (37 GB/s midpoint).
 */
export function getMemoryBandwidth(chip: AppleSiliconChip | null): number {
  if (!chip) return 37; // Intel midpoint (25-50 range)

  const key = chip.variant === 'base'
    ? chip.generation
    : `${chip.generation} ${chip.variant}`;

  return BANDWIDTH_TABLE[key] ?? 37;
}

// ---------------------------------------------------------------------------
// Disk Space
// ---------------------------------------------------------------------------

function getFreeDiskGB(): number {
  try {
    const output = execSync('df -g /', { encoding: 'utf-8', timeout: 5000 });
    const lines = output.trim().split('\n');
    if (lines.length < 2) return 0;
    // df -g output: Filesystem 1G-blocks Used Available Capacity ...
    const parts = lines[1].split(/\s+/);
    const available = parseInt(parts[3], 10);
    return isNaN(available) ? 0 : available;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Main Detection
// ---------------------------------------------------------------------------

const OS_OVERHEAD_GB = 3;

export function detectHardware(): HardwareInfo {
  const totalRamBytes = os.totalmem();
  const totalRamGB = Math.round(totalRamBytes / (1024 ** 3));
  const availableRamGB = Math.max(0, totalRamGB - OS_OVERHEAD_GB);

  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model ?? 'Unknown';
  const coreCount = cpus.length;
  const arch = os.arch();
  const osVersion = os.release();
  const isAppleSilicon = arch === 'arm64' && cpuModel.includes('Apple');

  const chip = parseAppleSiliconChip(cpuModel);
  const memoryBandwidthGBs = getMemoryBandwidth(chip);
  const freeDiskGB = getFreeDiskGB();

  return {
    totalRamGB,
    availableRamGB,
    cpuModel,
    chip,
    coreCount,
    arch,
    osVersion,
    memoryBandwidthGBs,
    freeDiskGB,
    isAppleSilicon,
  };
}
