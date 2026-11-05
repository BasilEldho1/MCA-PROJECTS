/**
 * Unit tests for geometry utilities
 * Run with: npx vitest run src/utils/__tests__/geometry.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  distance2D,
  angle2D,
  snapToGrid,
  snapPointToGrid,
  projectPointOntoSegment,
  calculatePolygonArea,
  findClosestWall,
  getPolygonCenter,
  calculateOverlayBounds
} from '../geometry';
import { Wall } from '../../types/floorplan';

// Helper to build a minimal Wall fixture
const makeWall = (id: string, x1: number, y1: number, x2: number, y2: number): Wall => ({
  id,
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness: 0.5,
  height: 9,
  material: 'paint',
  color: '#000000'
});

describe('geometry utilities', () => {
  // ── distance2D ─────────────────────────────────────────────────────────────
  describe('distance2D', () => {
    it('distance between identical points is zero', () => {
      expect(distance2D({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(0);
    });

    it('distance on horizontal axis is correct', () => {
      expect(distance2D({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(5);
    });

    it('distance on vertical axis is correct', () => {
      expect(distance2D({ x: 0, y: 0 }, { x: 0, y: 7 })).toBe(7);
    });

    it('3-4-5 right triangle', () => {
      expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('is symmetric (order does not matter)', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(distance2D(a, b)).toBeCloseTo(distance2D(b, a), 10);
    });
  });

  // ── angle2D ────────────────────────────────────────────────────────────────
  describe('angle2D', () => {
    it('horizontal right → angle is 0', () => {
      expect(angle2D({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0, 10);
    });

    it('straight up → angle is π/2', () => {
      expect(angle2D({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2, 10);
    });

    it('horizontal left → angle is π', () => {
      expect(Math.abs(angle2D({ x: 0, y: 0 }, { x: -1, y: 0 }))).toBeCloseTo(Math.PI, 10);
    });
  });

  // ── snapToGrid ─────────────────────────────────────────────────────────────
  describe('snapToGrid', () => {
    it('snaps 0.6 to 0.5 with default grid', () => {
      expect(snapToGrid(0.6, 0.5)).toBe(0.5);
    });

    it('snaps 0.8 to 1.0 with 0.5 grid', () => {
      expect(snapToGrid(0.8, 0.5)).toBe(1.0);
    });

    it('already on grid returns unchanged', () => {
      expect(snapToGrid(2.5, 0.5)).toBe(2.5);
    });

    it('snaps to whole numbers with grid size 1', () => {
      expect(snapToGrid(3.4, 1)).toBe(3);
      expect(snapToGrid(3.6, 1)).toBe(4);
    });
  });

  // ── snapPointToGrid ────────────────────────────────────────────────────────
  describe('snapPointToGrid', () => {
    it('snaps both x and y components', () => {
      const result = snapPointToGrid({ x: 1.3, y: 2.7 }, 0.5);
      expect(result.x).toBeCloseTo(1.5, 5);
      expect(result.y).toBeCloseTo(2.5, 5);
    });
  });

  // ── calculatePolygonArea ───────────────────────────────────────────────────
  describe('calculatePolygonArea', () => {
    it('returns 0 for fewer than 3 points', () => {
      expect(calculatePolygonArea([])).toBe(0);
      expect(calculatePolygonArea([{ x: 0, y: 0 }])).toBe(0);
      expect(calculatePolygonArea([{ x: 0, y: 0 }, { x: 1, y: 0 }])).toBe(0);
    });

    it('area of 10×10 square is 100', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      expect(calculatePolygonArea(square)).toBeCloseTo(100, 5);
    });

    it('area of right triangle (3, 4) is 6', () => {
      const tri = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 }];
      expect(calculatePolygonArea(tri)).toBeCloseTo(6, 5);
    });

    it('area is unsigned (same for clockwise and counter-clockwise)', () => {
      const ccw = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }];
      const cw  = [{ x: 0, y: 0 }, { x: 0, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 0 }];
      expect(calculatePolygonArea(ccw)).toBeCloseTo(calculatePolygonArea(cw), 5);
    });
  });

  // ── getPolygonCenter ───────────────────────────────────────────────────────
  describe('getPolygonCenter', () => {
    it('returns (0,0) for empty polygon', () => {
      expect(getPolygonCenter([])).toEqual({ x: 0, y: 0 });
    });

    it('center of a square at origin', () => {
      const sq = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
      const c = getPolygonCenter(sq);
      expect(c.x).toBeCloseTo(2, 5);
      expect(c.y).toBeCloseTo(2, 5);
    });
  });

  // ── findClosestWall ────────────────────────────────────────────────────────
  describe('findClosestWall', () => {
    it('returns null when no walls are present', () => {
      expect(findClosestWall({ x: 0, y: 0 }, [], 10)).toBeNull();
    });

    it('returns null when point is beyond maxDist', () => {
      const wall = makeWall('w1', 0, 0, 10, 0);
      expect(findClosestWall({ x: 5, y: 50 }, [wall], 3)).toBeNull();
    });

    it('finds the closest wall when multiple walls exist', () => {
      const near  = makeWall('near',  0, 0, 10, 0);  // y = 0
      const far   = makeWall('far',   0, 20, 10, 20); // y = 20
      const result = findClosestWall({ x: 5, y: 1 }, [near, far], 5);
      expect(result).not.toBeNull();
      expect(result!.wall.id).toBe('near');
    });
  });

  // ── projectPointOntoSegment ────────────────────────────────────────────────
  describe('projectPointOntoSegment', () => {
    it('projects midpoint correctly', () => {
      const res = projectPointOntoSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expect(res.ratio).toBeCloseTo(0.5, 5);
      expect(res.point.x).toBeCloseTo(5, 5);
      expect(res.point.y).toBeCloseTo(0, 5);
      expect(res.dist).toBeCloseTo(3, 5);
    });

    it('clamps ratio to [0, 1] for points beyond segment ends', () => {
      const res = projectPointOntoSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expect(res.ratio).toBe(1);
    });
  });

  // ── calculateOverlayBounds ────────────────────────────────────────────────
  describe('calculateOverlayBounds', () => {
    it('for a square image on a square plot, fills the plot exactly', () => {
      const result = calculateOverlayBounds(100, 100, 40, 40);
      expect(result.width).toBeCloseTo(40, 2);
      expect(result.height).toBeCloseTo(40, 2);
      expect(result.x).toBeCloseTo(0, 2);
      expect(result.y).toBeCloseTo(0, 2);
    });

    it('wide image on a tall plot is letterboxed vertically', () => {
      // 200 × 100 image (2:1) on 40 × 60 plot (2:3) → width-constrained
      const result = calculateOverlayBounds(200, 100, 40, 60);
      expect(result.width).toBeCloseTo(40, 2);
      expect(result.height).toBeCloseTo(20, 2);
      // Vertical offset should center it
      expect(result.y).toBeCloseTo((60 - 20) / 2, 2);
    });

    it('tall image on a wide plot is pillarboxed horizontally', () => {
      const result = calculateOverlayBounds(100, 200, 60, 40);
      expect(result.height).toBeCloseTo(40, 2);
      expect(result.width).toBeCloseTo(20, 2);
      expect(result.x).toBeCloseTo((60 - 20) / 2, 2);
    });
  });
});
