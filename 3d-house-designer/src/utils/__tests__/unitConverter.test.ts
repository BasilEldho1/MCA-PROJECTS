/**
 * Unit tests for unitConverter utility
 * Run with: npx vitest run src/utils/__tests__/unitConverter.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  FEET_TO_METERS,
  METERS_TO_FEET,
  convertLength,
  formatLength,
  formatArea
} from '../unitConverter';

describe('unitConverter', () => {
  // ── Constants ──────────────────────────────────────────────────────────────
  describe('constants', () => {
    it('FEET_TO_METERS should be approximately 0.3048', () => {
      expect(FEET_TO_METERS).toBeCloseTo(0.3048, 6);
    });

    it('METERS_TO_FEET should be the inverse of FEET_TO_METERS', () => {
      expect(METERS_TO_FEET).toBeCloseTo(1 / 0.3048, 6);
    });

    it('round-trip feet→meters→feet should return original value', () => {
      const original = 10;
      const inMeters = original * FEET_TO_METERS;
      const backToFeet = inMeters * METERS_TO_FEET;
      expect(backToFeet).toBeCloseTo(original, 8);
    });
  });

  // ── convertLength ──────────────────────────────────────────────────────────
  describe('convertLength', () => {
    it('same unit returns identity', () => {
      expect(convertLength(10, 'feet', 'feet')).toBe(10);
      expect(convertLength(5, 'meters', 'meters')).toBe(5);
    });

    it('feet → meters: 1 ft ≈ 0.3048 m', () => {
      expect(convertLength(1, 'feet', 'meters')).toBeCloseTo(0.3048, 4);
    });

    it('feet → meters: 10 ft ≈ 3.048 m', () => {
      expect(convertLength(10, 'feet', 'meters')).toBeCloseTo(3.048, 4);
    });

    it('meters → feet: 1 m ≈ 3.2808 ft', () => {
      expect(convertLength(1, 'meters', 'feet')).toBeCloseTo(3.2808, 3);
    });

    it('meters → feet: 3.048 m ≈ 10 ft', () => {
      expect(convertLength(3.048, 'meters', 'feet')).toBeCloseTo(10, 4);
    });

    it('zero value returns zero regardless of unit', () => {
      expect(convertLength(0, 'feet', 'meters')).toBe(0);
      expect(convertLength(0, 'meters', 'feet')).toBe(0);
    });
  });

  // ── formatLength ──────────────────────────────────────────────────────────
  describe('formatLength', () => {
    it('formats feet with "ft" suffix', () => {
      expect(formatLength(12.5, 'feet')).toBe('12.5 ft');
    });

    it('formats meters with "m" suffix', () => {
      expect(formatLength(3.8, 'meters')).toBe('3.8 m');
    });

    it('respects custom precision', () => {
      expect(formatLength(3.14159, 'feet', 2)).toBe('3.14 ft');
      expect(formatLength(3.14159, 'meters', 3)).toBe('3.142 m');
    });

    it('default precision is 1', () => {
      expect(formatLength(3.14159, 'feet')).toBe('3.1 ft');
    });

    it('zero value is formatted correctly', () => {
      expect(formatLength(0, 'feet')).toBe('0.0 ft');
      expect(formatLength(0, 'meters')).toBe('0.0 m');
    });
  });

  // ── formatArea ────────────────────────────────────────────────────────────
  describe('formatArea', () => {
    it('formats feet area as "sq ft"', () => {
      expect(formatArea(100, 'feet')).toBe('100.0 sq ft');
    });

    it('converts area to m² when unit is meters', () => {
      // 100 sq ft × 0.092903 ≈ 9.29 m²
      const result = formatArea(100, 'meters');
      expect(result).toContain('m²');
      const numericPart = parseFloat(result);
      expect(numericPart).toBeCloseTo(9.29, 1);
    });

    it('respects custom precision for feet', () => {
      expect(formatArea(100.567, 'feet', 2)).toBe('100.57 sq ft');
    });

    it('zero area returns zero with correct suffix', () => {
      expect(formatArea(0, 'feet')).toBe('0.0 sq ft');
    });
  });
});
