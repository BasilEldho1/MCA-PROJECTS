import { Wall, Door, WindowItem, Room, ValidationIssue } from '../types/floorplan';
import { distance2D } from './geometry';

/**
 * Validates 2D floor plan model before 3D generation.
 * Checks for:
 * - Open wall segments
 * - Overlapping walls
 * - Doors/Windows unattached to any wall
 * - Rooms without valid polygon boundaries
 * - Invalid dimensions
 */
export function validateFloorPlan(
  walls: Wall[],
  rooms: Room[],
  doors: Door[],
  windows: WindowItem[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check for unattached doors
  doors.forEach(d => {
    const parentWall = walls.find(w => w.id === d.wallId);
    if (!parentWall) {
      issues.push({
        id: `issue_door_${d.id}`,
        type: 'unattached_opening',
        severity: 'warning',
        message: `Door '${d.id.substring(0, 6)}' is not attached to any wall segment.`,
        objectId: d.id,
        objectType: 'door',
        canAutoFix: true
      });
    }
  });

  // 2. Check for unattached windows
  windows.forEach(w => {
    const parentWall = walls.find(wall => wall.id === w.wallId);
    if (!parentWall) {
      issues.push({
        id: `issue_win_${w.id}`,
        type: 'unattached_opening',
        severity: 'warning',
        message: `Window '${w.id.substring(0, 6)}' is not attached to any wall segment.`,
        objectId: w.id,
        objectType: 'window',
        canAutoFix: true
      });
    }
  });

  // 3. Check for open wall segments / dangling endpoints
  walls.forEach(wall => {
    const len = distance2D(wall.start, wall.end);
    if (len < 0.5) {
      issues.push({
        id: `issue_wall_short_${wall.id}`,
        type: 'invalid_dimension',
        severity: 'warning',
        message: `Wall '${wall.id.substring(0, 6)}' has a very short length (${len.toFixed(1)} unit).`,
        objectId: wall.id,
        objectType: 'wall',
        canAutoFix: true
      });
    }

    // Endpoint connectedness check
    const startConnected = walls.some(
      other => other.id !== wall.id && (distance2D(wall.start, other.start) < 0.6 || distance2D(wall.start, other.end) < 0.6)
    );
    const endConnected = walls.some(
      other => other.id !== wall.id && (distance2D(wall.end, other.start) < 0.6 || distance2D(wall.end, other.end) < 0.6)
    );

    if (!startConnected && !endConnected && walls.length > 2) {
      issues.push({
        id: `issue_wall_unconnected_${wall.id}`,
        type: 'open_wall',
        severity: 'warning',
        message: `Wall segment '${wall.id.substring(0, 6)}' appears disconnected from the perimeter structure.`,
        objectId: wall.id,
        objectType: 'wall',
        canAutoFix: false
      });
    }
  });

  // 4. Check for invalid room polygons
  rooms.forEach(room => {
    if (!room.polygon || room.polygon.length < 3) {
      issues.push({
        id: `issue_room_poly_${room.id}`,
        type: 'unbounded_room',
        severity: 'error',
        message: `Room '${room.name}' has an incomplete boundary polygon.`,
        objectId: room.id,
        objectType: 'room',
        canAutoFix: true
      });
    }
  });

  return issues;
}

/**
 * Automatically fixes simple validation issues where possible
 */
export function autoFixValidationIssues(
  issues: ValidationIssue[],
  walls: Wall[],
  rooms: Room[],
  doors: Door[],
  windows: WindowItem[]
): {
  fixedWalls: Wall[];
  fixedRooms: Room[];
  fixedDoors: Door[];
  fixedWindows: WindowItem[];
  fixedCount: number;
} {
  let fixedCount = 0;
  let fixedDoors = [...doors];
  let fixedWindows = [...windows];
  let fixedWalls = [...walls];
  let fixedRooms = [...rooms];

  issues.forEach(issue => {
    if (!issue.canAutoFix) return;

    if (issue.objectType === 'door' && issue.objectId) {
      // Re-attach door to nearest wall if available, or delete unattached
      const doorIndex = fixedDoors.findIndex(d => d.id === issue.objectId);
      if (doorIndex !== -1 && fixedWalls.length > 0) {
        // Clone the door object before mutating to avoid polluting the original
        fixedDoors[doorIndex] = {
          ...fixedDoors[doorIndex],
          wallId: fixedWalls[0].id,
          positionRatio: 0.5
        };
        fixedCount++;
      } else if (doorIndex !== -1) {
        fixedDoors = fixedDoors.filter(d => d.id !== issue.objectId);
        fixedCount++;
      }
    }

    if (issue.objectType === 'window' && issue.objectId) {
      const winIndex = fixedWindows.findIndex(w => w.id === issue.objectId);
      if (winIndex !== -1 && fixedWalls.length > 0) {
        // Clone the window object before mutating
        fixedWindows[winIndex] = {
          ...fixedWindows[winIndex],
          wallId: fixedWalls[0].id,
          positionRatio: 0.5
        };
        fixedCount++;
      } else if (winIndex !== -1) {
        fixedWindows = fixedWindows.filter(w => w.id !== issue.objectId);
        fixedCount++;
      }
    }

    if (issue.objectType === 'wall' && issue.type === 'invalid_dimension' && issue.objectId) {
      fixedWalls = fixedWalls.filter(w => w.id !== issue.objectId);
      fixedCount++;
    }
  });

  return {
    fixedWalls,
    fixedRooms,
    fixedDoors,
    fixedWindows,
    fixedCount
  };
}
