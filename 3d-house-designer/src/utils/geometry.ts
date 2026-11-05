import { Point2D, Wall } from '../types/floorplan';

export const distance2D = (p1: Point2D, p2: Point2D): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const angle2D = (p1: Point2D, p2: Point2D): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

export const snapToGrid = (val: number, gridSize: number = 0.5): number => {
  return Math.round(val / gridSize) * gridSize;
};

export const snapPointToGrid = (p: Point2D, gridSize: number = 0.5): Point2D => {
  return {
    x: snapToGrid(p.x, gridSize),
    y: snapToGrid(p.y, gridSize)
  };
};

// Project point p onto line segment (a, b) and return position ratio (0 to 1)
export const projectPointOntoSegment = (p: Point2D, a: Point2D, b: Point2D): { ratio: number; point: Point2D; dist: number } => {
  const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
  if (l2 === 0) return { ratio: 0, point: a, dist: distance2D(p, a) };

  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projPoint = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y)
  };

  return {
    ratio: t,
    point: projPoint,
    dist: distance2D(p, projPoint)
  };
};

// Calculate polygon area using Shoelace formula
export const calculatePolygonArea = (polygon: Point2D[]): number => {
  if (!polygon || polygon.length < 3) return 0;
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
};

// Find closest wall to point
export const findClosestWall = (point: Point2D, walls: Wall[], maxDist = 3.0): { wall: Wall; ratio: number; point: Point2D } | null => {
  let closestWall: Wall | null = null;
  let minDist = maxDist;
  let bestRatio = 0.5;
  let bestPoint = point;

  for (const wall of walls) {
    const proj = projectPointOntoSegment(point, wall.start, wall.end);
    if (proj.dist < minDist) {
      minDist = proj.dist;
      closestWall = wall;
      bestRatio = proj.ratio;
      bestPoint = proj.point;
    }
  }

  if (!closestWall) return null;
  return { wall: closestWall, ratio: bestRatio, point: bestPoint };
};

// Generate polygon center point
export const getPolygonCenter = (polygon: Point2D[]): Point2D => {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  polygon.forEach(p => {
    sumX += p.x;
    sumY += p.y;
  });
  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length
  };
};

export interface OverlayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const calculateOverlayBounds = (
  imgWidth: number,
  imgHeight: number,
  plotWidth: number,
  plotLength: number
): OverlayBounds => {
  const imgAspect = (imgWidth || 1) / (imgHeight || 1);
  const plotAspect = (plotWidth || 40) / (plotLength || 30);

  let overlayW = plotWidth;
  let overlayH = plotLength;
  let offsetX = 0;
  let offsetY = 0;

  if (imgAspect > plotAspect) {
    overlayW = plotWidth;
    overlayH = plotWidth / imgAspect;
    offsetY = (plotLength - overlayH) / 2;
  } else {
    overlayH = plotLength;
    overlayW = plotLength * imgAspect;
    offsetX = (plotWidth - overlayW) / 2;
  }

  return {
    x: Math.round(offsetX * 100) / 100,
    y: Math.round(offsetY * 100) / 100,
    width: Math.round(overlayW * 100) / 100,
    height: Math.round(overlayH * 100) / 100
  };
};

