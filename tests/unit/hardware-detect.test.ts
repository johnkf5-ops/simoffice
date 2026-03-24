import { describe, expect, it } from 'vitest';

import {
  parseAppleSiliconChip,
  getMemoryBandwidth,
} from '@electron/services/hardware/detect';

describe('parseAppleSiliconChip', () => {
  it('parses M1 base', () => {
    expect(parseAppleSiliconChip('Apple M1')).toEqual({
      generation: 'M1',
      variant: 'base',
    });
  });

  it('parses M3 Max', () => {
    expect(parseAppleSiliconChip('Apple M3 Max')).toEqual({
      generation: 'M3',
      variant: 'Max',
    });
  });

  it('parses M4 Pro', () => {
    expect(parseAppleSiliconChip('Apple M4 Pro')).toEqual({
      generation: 'M4',
      variant: 'Pro',
    });
  });

  it('parses M2 Ultra', () => {
    expect(parseAppleSiliconChip('Apple M2 Ultra')).toEqual({
      generation: 'M2',
      variant: 'Ultra',
    });
  });

  it('parses M1 with extra whitespace', () => {
    expect(parseAppleSiliconChip('Apple  M1  Pro')).toEqual({
      generation: 'M1',
      variant: 'Pro',
    });
  });

  it('is case-insensitive for variant', () => {
    expect(parseAppleSiliconChip('Apple M3 max')).toEqual({
      generation: 'M3',
      variant: 'Max',
    });
  });

  it('returns null for Intel CPU', () => {
    expect(parseAppleSiliconChip('Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz')).toBeNull();
  });

  it('returns null for unknown string', () => {
    expect(parseAppleSiliconChip('Unknown')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseAppleSiliconChip('')).toBeNull();
  });
});

describe('getMemoryBandwidth', () => {
  it('returns 68 for M1 base', () => {
    expect(getMemoryBandwidth({ generation: 'M1', variant: 'base' })).toBe(68);
  });

  it('returns 400 for M1 Max', () => {
    expect(getMemoryBandwidth({ generation: 'M1', variant: 'Max' })).toBe(400);
  });

  it('returns 800 for M2 Ultra', () => {
    expect(getMemoryBandwidth({ generation: 'M2', variant: 'Ultra' })).toBe(800);
  });

  it('returns 150 for M3 Pro', () => {
    expect(getMemoryBandwidth({ generation: 'M3', variant: 'Pro' })).toBe(150);
  });

  it('returns 273 for M4 Pro', () => {
    expect(getMemoryBandwidth({ generation: 'M4', variant: 'Pro' })).toBe(273);
  });

  it('returns 546 for M4 Max', () => {
    expect(getMemoryBandwidth({ generation: 'M4', variant: 'Max' })).toBe(546);
  });

  it('returns 37 (Intel midpoint) for null chip', () => {
    expect(getMemoryBandwidth(null)).toBe(37);
  });

  it('returns 37 for unknown chip generation', () => {
    // Future M5 not in table yet
    expect(getMemoryBandwidth({ generation: 'M5' as any, variant: 'base' })).toBe(37);
  });
});
