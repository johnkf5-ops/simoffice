import { describe, expect, it } from 'vitest';

import {
  getRecommendation,
  getCompatibleModels,
  MODEL_DATABASE,
} from '@electron/services/hardware/model-recommender';
import type { HardwareInfo } from '@electron/services/hardware/detect';

function makeHardware(overrides: Partial<HardwareInfo> = {}): HardwareInfo {
  return {
    totalRamGB: 16,
    availableRamGB: 13,
    cpuModel: 'Apple M3',
    chip: { generation: 'M3', variant: 'base' },
    coreCount: 8,
    arch: 'arm64',
    osVersion: '25.2.0',
    memoryBandwidthGBs: 100,
    freeDiskGB: 200,
    isAppleSilicon: true,
    ...overrides,
  };
}

describe('getRecommendation', () => {
  it('returns null recommendation for 8GB M1 (below 16GB minimum)', () => {
    const hw = makeHardware({
      totalRamGB: 8,
      availableRamGB: 5,
      chip: { generation: 'M1', variant: 'base' },
      memoryBandwidthGBs: 68,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).toBeNull();
    expect(result.hardwareWarning).toContain('16GB');
  });

  it('recommends qwen3.5:9b for 16GB M3', () => {
    const hw = makeHardware({
      totalRamGB: 16,
      availableRamGB: 13,
      chip: { generation: 'M3', variant: 'base' },
      memoryBandwidthGBs: 100,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).not.toBeNull();
    // 75% of 13GB = 9.75GB. qwen3.5:9b is 6.6GB — fits comfortably
    expect(result.recommended!.model.ollamaTag).toBe('qwen3.5:9b');
  });

  it('recommends a large model for 64GB M4 Max', () => {
    const hw = makeHardware({
      totalRamGB: 64,
      availableRamGB: 61,
      chip: { generation: 'M4', variant: 'Max' },
      memoryBandwidthGBs: 546,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).not.toBeNull();
    // 75% of 61 = 45.75GB. llama3.3:70b is 43GB — fits!
    expect(result.recommended!.model.ollamaTag).toBe('llama3.3:70b');
    expect(result.hardwareWarning).toBeNull();
  });

  it('shows advanced models between 75-90% RAM', () => {
    const hw = makeHardware({
      totalRamGB: 32,
      availableRamGB: 29,
      chip: { generation: 'M3', variant: 'Pro' },
      memoryBandwidthGBs: 150,
    });
    const result = getRecommendation(hw);
    // 75% of 29 = 21.75, 90% of 29 = 26.1
    // Models between 21.75 and 26.1 GB should be in advanced
    expect(result.advancedModels.length).toBeGreaterThan(0);
    for (const am of result.advancedModels) {
      expect(am.model.downloadGB).toBeGreaterThan(21.75);
      expect(am.model.downloadGB).toBeLessThanOrEqual(26.1);
    }
  });

  it('hides models above 90% of available RAM', () => {
    const hw = makeHardware({
      totalRamGB: 16,
      availableRamGB: 13,
    });
    const result = getRecommendation(hw);
    // 90% of 13 = 11.7. No model above 11.7GB should appear
    const allShown = [
      ...(result.recommended ? [result.recommended] : []),
      ...result.advancedModels,
    ];
    for (const r of allShown) {
      expect(r.model.downloadGB).toBeLessThanOrEqual(11.7);
    }
  });

  it('returns null recommendation for Intel Mac', () => {
    const hw = makeHardware({
      totalRamGB: 32,
      availableRamGB: 29,
      cpuModel: 'Intel(R) Core(TM) i9-9880H',
      chip: null,
      arch: 'x64',
      memoryBandwidthGBs: 37,
      isAppleSilicon: false,
    });
    const result = getRecommendation(hw);
    expect(result.hardwareWarning).toContain('Intel');
    expect(result.recommended).toBeNull();
  });

  it('returns null recommendation when no models fit', () => {
    const hw = makeHardware({
      totalRamGB: 4,
      availableRamGB: 1,
      chip: { generation: 'M1', variant: 'base' },
      memoryBandwidthGBs: 68,
    });
    const result = getRecommendation(hw);
    // 75% of 1GB = 0.75GB — no model is that small
    expect(result.recommended).toBeNull();
  });

  it('includes speed estimates with human-readable labels', () => {
    const hw = makeHardware({
      totalRamGB: 32,
      availableRamGB: 29,
      chip: { generation: 'M4', variant: 'Pro' },
      memoryBandwidthGBs: 273,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).not.toBeNull();
    expect(result.recommended!.speed.humanSpeed).toBeTruthy();
    expect(result.recommended!.speed.ttftCold).toBeTruthy();
    expect(result.recommended!.speed.ttftWarm).toBeTruthy();
    expect(result.recommended!.speed.tokensPerSecond.length).toBe(2);
  });

  it('includes capability tier and checklist', () => {
    const hw = makeHardware({
      totalRamGB: 16,
      availableRamGB: 13,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).not.toBeNull();
    expect(result.recommended!.capabilityTier).toBeTruthy();
    expect(result.recommended!.capabilityDescription).toBeTruthy();
    expect(result.recommended!.capabilities.length).toBeGreaterThan(0);
  });

  it('recommends appropriate num_ctx based on headroom', () => {
    const hw = makeHardware({
      totalRamGB: 64,
      availableRamGB: 61,
      chip: { generation: 'M4', variant: 'Max' },
      memoryBandwidthGBs: 546,
    });
    const result = getRecommendation(hw);
    expect(result.recommended).not.toBeNull();
    // 61 - 43 (llama3.3:70b) = 18 GB headroom → should get 16384
    expect(result.recommended!.recommendedNumCtx).toBe(16384);
  });
});

describe('getCompatibleModels', () => {
  it('returns only models under 90% RAM', () => {
    const hw = makeHardware({
      totalRamGB: 32,
      availableRamGB: 29,
    });
    const models = getCompatibleModels(hw);
    const threshold = 29 * 0.90;
    for (const m of models) {
      expect(m.model.downloadGB).toBeLessThanOrEqual(threshold);
    }
  });

  it('returns more models for higher RAM', () => {
    const hw16 = makeHardware({ totalRamGB: 16, availableRamGB: 13 });
    const hw64 = makeHardware({ totalRamGB: 64, availableRamGB: 61 });
    const models16 = getCompatibleModels(hw16);
    const models64 = getCompatibleModels(hw64);
    expect(models64.length).toBeGreaterThan(models16.length);
  });
});

describe('MODEL_DATABASE', () => {
  it('has no Qwen 3.5 70B entry', () => {
    const has70b = MODEL_DATABASE.some(
      m => m.ollamaTag.startsWith('qwen3.5') && m.params.includes('70')
    );
    expect(has70b).toBe(false);
  });

  it('has entries sorted by minRamGB ascending', () => {
    for (let i = 1; i < MODEL_DATABASE.length; i++) {
      expect(MODEL_DATABASE[i].minRamGB).toBeGreaterThanOrEqual(MODEL_DATABASE[i - 1].minRamGB);
    }
  });

  it('every model has at least one bestFor tag', () => {
    for (const m of MODEL_DATABASE) {
      expect(m.bestFor.length).toBeGreaterThan(0);
    }
  });
});
