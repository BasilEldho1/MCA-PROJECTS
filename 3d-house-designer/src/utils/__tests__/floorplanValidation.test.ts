/**
 * Unit tests for floorplanValidation utility
 * Run with: npx vitest run src/utils/__tests__/floorplanValidation.test.ts
 */

import { describe, it, expect } from 'vitest';
import { validateFloorPlan, autoFixValidationIssues } from '../floorplanValidation';
import { Wall, Door, WindowItem, Room } from '../../types/floorplan';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makeWall = (id: string, x1: number, y1: number, x2: number, y2: number): Wall => ({
  id,
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness: 0.5,
  height: 9,
  material: 'paint',
  color: '#0f172a'
});

const makeDoor = (id: string, wallId: string): Door => ({
  id,
  wallId,
  positionRatio: 0.5,
  width: 3,
  height: 7,
  doorType: 'single',
  color: '#b45309',
  material: 'wood'
});

const makeWindow = (id: string, wallId: string): WindowItem => ({
  id,
  wallId,
  positionRatio: 0.5,
  width: 3,
  height: 4,
  sillHeight: 2.5,
  windowType: 'standard',
  color: '#0284c7'
});

const makeRoom = (id: string, name: string, polygon: { x: number; y: number }[]): Room => ({
  id,
  name,
  type: 'Living Room',
  polygon,
  floorMaterial: 'tile',
  wallMaterial: 'paint',
  floorColor: '#cbd5e1',
  wallColor: '#f8fafc',
  area: 100
});

// ── Connected 4-wall square perimeter ─────────────────────────────────────────
const SQUARE_WALLS = [
  makeWall('w1', 0, 0, 10, 0),   // bottom
  makeWall('w2', 10, 0, 10, 10), // right
  makeWall('w3', 10, 10, 0, 10), // top
  makeWall('w4', 0, 10, 0, 0)    // left
];

describe('validateFloorPlan', () => {
  it('returns no issues for a clean 4-wall square with no openings', () => {
    const issues = validateFloorPlan(SQUARE_WALLS, [], [], []);
    expect(issues).toHaveLength(0);
  });

  it('returns no issues when a door is correctly attached to a wall', () => {
    const door = makeDoor('d1', 'w1');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [door], []);
    expect(issues.filter(i => i.type === 'unattached_opening')).toHaveLength(0);
  });

  it('flags a door whose wallId does not match any existing wall', () => {
    const orphanDoor = makeDoor('d_orphan', 'nonexistent_wall_id');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [orphanDoor], []);
    const doorIssues = issues.filter(i => i.objectId === 'd_orphan');
    expect(doorIssues.length).toBeGreaterThan(0);
    expect(doorIssues[0].type).toBe('unattached_opening');
    expect(doorIssues[0].severity).toBe('warning');
  });

  it('flags a window whose wallId does not match any existing wall', () => {
    const orphanWin = makeWindow('win_orphan', 'nonexistent');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [], [orphanWin]);
    const winIssues = issues.filter(i => i.objectId === 'win_orphan');
    expect(winIssues.length).toBeGreaterThan(0);
    expect(winIssues[0].type).toBe('unattached_opening');
  });

  it('flags a room with fewer than 3 polygon points as unbounded', () => {
    const badRoom = makeRoom('r1', 'Kitchen', [{ x: 0, y: 0 }, { x: 5, y: 0 }]);
    const issues = validateFloorPlan(SQUARE_WALLS, [badRoom], [], []);
    const roomIssues = issues.filter(i => i.objectId === 'r1');
    expect(roomIssues.length).toBeGreaterThan(0);
    expect(roomIssues[0].type).toBe('unbounded_room');
    expect(roomIssues[0].severity).toBe('error');
  });

  it('does not flag a room with a valid 4-point polygon', () => {
    const validRoom = makeRoom('r2', 'Bedroom', [
      { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }
    ]);
    const issues = validateFloorPlan(SQUARE_WALLS, [validRoom], [], []);
    const roomIssues = issues.filter(i => i.objectId === 'r2');
    expect(roomIssues).toHaveLength(0);
  });

  it('flags a very short wall as invalid dimension', () => {
    const tinyWall = makeWall('short', 0, 0, 0.1, 0); // length < 0.5
    const issues = validateFloorPlan([tinyWall], [], [], []);
    const shortWallIssues = issues.filter(i => i.objectId === 'short' && i.type === 'invalid_dimension');
    expect(shortWallIssues.length).toBeGreaterThan(0);
  });

  it('all issues have canAutoFix flag set to true or false (boolean)', () => {
    const orphanDoor = makeDoor('d2', 'nonexistent');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [orphanDoor], []);
    issues.forEach(issue => {
      expect(typeof issue.canAutoFix).toBe('boolean');
    });
  });

  it('all issue ids are unique strings', () => {
    const orphanDoor = makeDoor('d3', 'nonexistent');
    const orphanWin = makeWindow('w3_orphan', 'nonexistent');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [orphanDoor], [orphanWin]);
    const ids = issues.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('autoFixValidationIssues', () => {
  it('fixes an orphan door by attaching to first available wall', () => {
    const orphanDoor = makeDoor('d_fix', 'bad_wall_id');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [orphanDoor], []);
    const result = autoFixValidationIssues(issues, SQUARE_WALLS, [], [orphanDoor], []);
    expect(result.fixedCount).toBeGreaterThan(0);
    const fixedDoor = result.fixedDoors.find(d => d.id === 'd_fix');
    expect(fixedDoor).toBeDefined();
    // Should be re-attached to a real wall
    const realWallIds = SQUARE_WALLS.map(w => w.id);
    expect(realWallIds).toContain(fixedDoor!.wallId);
  });

  it('fixes an orphan window by attaching to first available wall', () => {
    const orphanWin = makeWindow('win_fix', 'bad_wall_id');
    const issues = validateFloorPlan(SQUARE_WALLS, [], [], [orphanWin]);
    const result = autoFixValidationIssues(issues, SQUARE_WALLS, [], [], [orphanWin]);
    expect(result.fixedCount).toBeGreaterThan(0);
    const fixedWin = result.fixedWindows.find(w => w.id === 'win_fix');
    expect(fixedWin).toBeDefined();
    const realWallIds = SQUARE_WALLS.map(w => w.id);
    expect(realWallIds).toContain(fixedWin!.wallId);
  });

  it('removes a very short wall that cannot be fixed otherwise', () => {
    const tinyWall = makeWall('tiny_fix', 0, 0, 0.1, 0);
    const allWalls = [...SQUARE_WALLS, tinyWall];
    const issues = validateFloorPlan(allWalls, [], [], []);
    const result = autoFixValidationIssues(issues, allWalls, [], [], []);
    const remainingTiny = result.fixedWalls.find(w => w.id === 'tiny_fix');
    expect(remainingTiny).toBeUndefined();
    expect(result.fixedCount).toBeGreaterThan(0);
  });

  it('returns fixedCount of 0 when there are no fixable issues', () => {
    const result = autoFixValidationIssues([], SQUARE_WALLS, [], [], []);
    expect(result.fixedCount).toBe(0);
    expect(result.fixedWalls).toHaveLength(SQUARE_WALLS.length);
  });

  it('does not mutate the original arrays', () => {
    const orphanDoor = makeDoor('d_mut', 'bad_id');
    const originalDoors = [orphanDoor];
    const issues = validateFloorPlan(SQUARE_WALLS, [], originalDoors, []);
    autoFixValidationIssues(issues, SQUARE_WALLS, [], originalDoors, []);
    // Original still has 'bad_id'
    expect(originalDoors[0].wallId).toBe('bad_id');
  });
});
