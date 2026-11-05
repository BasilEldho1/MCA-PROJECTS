import { Wall, Room, Door, WindowItem, Point2D, UnitType, BlueprintOverlay } from '../types/floorplan';
import { distance2D, calculatePolygonArea, snapToGrid, calculateOverlayBounds } from './geometry';
import { MultiRepresentationMaps } from './detection/preprocessingPipeline';

export interface BlueprintConversionOptions {
  sensitivity: number; // 0 to 100 (contrast/threshold sensitivity)
  wallThickness: number; // e.g. 0.5 to 1.0 ft or 0.15 to 0.3 m
  wallHeight: number; // e.g. 8.5 to 12 ft or 2.6 to 3.6 m
  snapOrthogonal: boolean;
  autoDetectRooms: boolean;
  autoDetectOpenings: boolean;
  projectBlueprintIn3D: boolean;
  plotWidth: number;
  plotLength: number;
  unit: UnitType;
}

export interface ConvertedFloorPlanResult {
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: WindowItem[];
  detectedRoomsCount: number;
  detectedWallsCount: number;
  estimatedLivingArea: number; // in sq ft or sq m
  multiRepresentationMaps?: MultiRepresentationMaps;
}

export interface PresetBlueprint {
  id: string;
  name: string;
  description: string;
  type: string;
  rooms: string;
  dimensions: string;
  svgDataUrl: string;
  recommendedWalls: { start: Point2D; end: Point2D; isExterior?: boolean }[];
  recommendedRooms: { name: string; type: string; polygon: Point2D[]; floorColor: string }[];
  recommendedDoors?: { wallIndex: number; positionRatio: number }[];
  recommendedWindows?: { wallIndex: number; positionRatio: number }[];
}

/**
 * Built-in high quality Architectural Blueprint Presets
 * Used for instant testing and reference demonstration
 */
export const PRESET_BLUEPRINTS: PresetBlueprint[] = [
  {
    id: 'modern-2bhk',
    name: 'Modern 2BHK City Apartment',
    description: 'Master suite with private bath, guest bedroom, open-concept living & dining, and kitchen.',
    type: 'Apartment',
    rooms: '2 Bed • 2 Bath • Living • Kitchen',
    dimensions: '36 ft × 30 ft',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
      <rect width="600" height="500" fill="%230f172a"/>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="%231e293b" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="600" height="500" fill="url(%23grid)"/>
      <rect x="50" y="50" width="500" height="400" fill="%231e293b" fill-opacity="0.3" stroke="%2306b6d4" stroke-width="4"/>
      <!-- Main Interior Walls -->
      <line x1="280" y1="50" x2="280" y2="450" stroke="%2306b6d4" stroke-width="4"/>
      <line x1="50" y1="260" x2="280" y2="260" stroke="%2306b6d4" stroke-width="4"/>
      <line x1="280" y1="220" x2="550" y2="220" stroke="%2306b6d4" stroke-width="4"/>
      <line x1="420" y1="50" x2="420" y2="220" stroke="%2306b6d4" stroke-width="4"/>
      <!-- Room Labels -->
      <text x="165" y="160" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">LIVING &amp; DINING</text>
      <text x="165" y="180" fill="%2394a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">16&apos; × 14&apos;</text>
      <text x="165" y="360" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">KITCHEN</text>
      <text x="165" y="380" fill="%2394a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">15&apos; × 12&apos;</text>
      <text x="350" y="140" fill="%2338bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">BATHROOM</text>
      <text x="485" y="140" fill="%2338bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">GUEST BED</text>
      <text x="415" y="340" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">MASTER BEDROOM</text>
      <text x="415" y="360" fill="%2394a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">18&apos; × 15&apos;</text>
    </svg>`,
    recommendedWalls: [
      // Outer perimeter
      { start: { x: 3, y: 3 }, end: { x: 33, y: 3 }, isExterior: true },
      { start: { x: 33, y: 3 }, end: { x: 33, y: 27 }, isExterior: true },
      { start: { x: 33, y: 27 }, end: { x: 3, y: 27 }, isExterior: true },
      { start: { x: 3, y: 27 }, end: { x: 3, y: 3 }, isExterior: true },
      // Dividers
      { start: { x: 17, y: 3 }, end: { x: 17, y: 27 }, isExterior: false },
      { start: { x: 3, y: 15 }, end: { x: 17, y: 15 }, isExterior: false },
      { start: { x: 17, y: 13 }, end: { x: 33, y: 13 }, isExterior: false },
      { start: { x: 25, y: 3 }, end: { x: 25, y: 13 }, isExterior: false }
    ],
    recommendedRooms: [
      {
        name: 'Living & Dining Room',
        type: 'Living Room',
        polygon: [
          { x: 3, y: 3 },
          { x: 17, y: 3 },
          { x: 17, y: 15 },
          { x: 3, y: 15 }
        ],
        floorColor: '#a16207'
      },
      {
        name: 'Chef Kitchen',
        type: 'Kitchen',
        polygon: [
          { x: 3, y: 15 },
          { x: 17, y: 15 },
          { x: 17, y: 27 },
          { x: 3, y: 27 }
        ],
        floorColor: '#475569'
      },
      {
        name: 'Master Bedroom',
        type: 'Bedroom',
        polygon: [
          { x: 17, y: 13 },
          { x: 33, y: 13 },
          { x: 33, y: 27 },
          { x: 17, y: 27 }
        ],
        floorColor: '#92400e'
      },
      {
        name: 'Full Bathroom',
        type: 'Bathroom',
        polygon: [
          { x: 17, y: 3 },
          { x: 25, y: 3 },
          { x: 25, y: 13 },
          { x: 17, y: 13 }
        ],
        floorColor: '#64748b'
      },
      {
        name: 'Guest Bedroom / Office',
        type: 'Bedroom',
        polygon: [
          { x: 25, y: 3 },
          { x: 33, y: 3 },
          { x: 33, y: 13 },
          { x: 25, y: 13 }
        ],
        floorColor: '#78350f'
      }
    ],
    recommendedDoors: [
      { wallIndex: 4, positionRatio: 0.25 },
      { wallIndex: 5, positionRatio: 0.5 },
      { wallIndex: 6, positionRatio: 0.35 }
    ],
    recommendedWindows: [
      { wallIndex: 0, positionRatio: 0.25 },
      { wallIndex: 0, positionRatio: 0.8 },
      { wallIndex: 1, positionRatio: 0.6 },
      { wallIndex: 2, positionRatio: 0.3 }
    ]
  },
  {
    id: 'luxury-villa',
    name: 'Luxury 3-Bedroom Villa Plan',
    description: 'Sprawling single-story villa with great room, master suite, children bedrooms, and terrace patio.',
    type: 'Villa',
    rooms: '3 Bed • 3 Bath • Great Room • Dining',
    dimensions: '42 ft × 34 ft',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
      <rect width="600" height="500" fill="%230f172a"/>
      <rect x="40" y="40" width="520" height="420" fill="%231e293b" fill-opacity="0.3" stroke="%2338bdf8" stroke-width="4"/>
      <line x1="220" y1="40" x2="220" y2="460" stroke="%2338bdf8" stroke-width="4"/>
      <line x1="40" y1="250" x2="220" y2="250" stroke="%2338bdf8" stroke-width="4"/>
      <line x1="220" y1="310" x2="560" y2="310" stroke="%2338bdf8" stroke-width="4"/>
      <line x1="390" y1="40" x2="390" y2="310" stroke="%2338bdf8" stroke-width="4"/>
      <text x="130" y="150" fill="%2338bdf8" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">MASTER SUITE</text>
      <text x="130" y="360" fill="%2338bdf8" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">SUITE BATH</text>
      <text x="305" y="180" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">GREAT ROOM</text>
      <text x="475" y="180" fill="%2338bdf8" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">BEDROOM 2</text>
      <text x="390" y="390" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">GOURMET KITCHEN &amp; DINING</text>
    </svg>`,
    recommendedWalls: [
      { start: { x: 3, y: 3 }, end: { x: 39, y: 3 }, isExterior: true },
      { start: { x: 39, y: 3 }, end: { x: 39, y: 31 }, isExterior: true },
      { start: { x: 39, y: 31 }, end: { x: 3, y: 31 }, isExterior: true },
      { start: { x: 3, y: 31 }, end: { x: 3, y: 3 }, isExterior: true },
      { start: { x: 15, y: 3 }, end: { x: 15, y: 31 }, isExterior: false },
      { start: { x: 3, y: 17 }, end: { x: 15, y: 17 }, isExterior: false },
      { start: { x: 15, y: 21 }, end: { x: 39, y: 21 }, isExterior: false },
      { start: { x: 27, y: 3 }, end: { x: 27, y: 21 }, isExterior: false }
    ],
    recommendedRooms: [
      {
        name: 'Master Suite Retreat',
        type: 'Bedroom',
        polygon: [
          { x: 3, y: 3 },
          { x: 15, y: 3 },
          { x: 15, y: 17 },
          { x: 3, y: 17 }
        ],
        floorColor: '#92400e'
      },
      {
        name: 'Master Spa Bathroom',
        type: 'Bathroom',
        polygon: [
          { x: 3, y: 17 },
          { x: 15, y: 17 },
          { x: 15, y: 31 },
          { x: 3, y: 31 }
        ],
        floorColor: '#0f766e'
      },
      {
        name: 'Grand Living Room',
        type: 'Living Room',
        polygon: [
          { x: 15, y: 3 },
          { x: 27, y: 3 },
          { x: 27, y: 21 },
          { x: 15, y: 21 }
        ],
        floorColor: '#a16207'
      },
      {
        name: 'Bedroom 2',
        type: 'Bedroom',
        polygon: [
          { x: 27, y: 3 },
          { x: 39, y: 3 },
          { x: 39, y: 21 },
          { x: 27, y: 21 }
        ],
        floorColor: '#78350f'
      },
      {
        name: 'Kitchen & Dining Salon',
        type: 'Kitchen',
        polygon: [
          { x: 15, y: 21 },
          { x: 39, y: 21 },
          { x: 39, y: 31 },
          { x: 15, y: 31 }
        ],
        floorColor: '#334155'
      }
    ],
    recommendedDoors: [
      { wallIndex: 4, positionRatio: 0.3 },
      { wallIndex: 5, positionRatio: 0.5 },
      { wallIndex: 6, positionRatio: 0.4 }
    ],
    recommendedWindows: [
      { wallIndex: 0, positionRatio: 0.5 },
      { wallIndex: 1, positionRatio: 0.4 },
      { wallIndex: 2, positionRatio: 0.6 }
    ]
  },
  {
    id: 'studio-loft',
    name: 'Open Concept Studio Loft',
    description: 'Contemporary high-ceiling urban loft with integrated sleeping zone, galley kitchen, and modern bath.',
    type: 'Studio',
    rooms: 'Open Studio • Bath • Kitchenette',
    dimensions: '28 ft × 24 ft',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
      <rect width="600" height="500" fill="%230f172a"/>
      <rect x="60" y="60" width="480" height="380" fill="%231e293b" fill-opacity="0.3" stroke="%23a855f7" stroke-width="4"/>
      <line x1="380" y1="60" x2="380" y2="230" stroke="%23a855f7" stroke-width="4"/>
      <line x1="380" y1="230" x2="540" y2="230" stroke="%23a855f7" stroke-width="4"/>
      <text x="220" y="240" fill="%23c084fc" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">OPEN STUDIO &amp; SLEEPING LOUNGE</text>
      <text x="460" y="150" fill="%23c084fc" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">BATH</text>
      <text x="460" y="340" fill="%23c084fc" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">KITCHENETTE</text>
    </svg>`,
    recommendedWalls: [
      { start: { x: 3, y: 3 }, end: { x: 25, y: 3 }, isExterior: true },
      { start: { x: 25, y: 3 }, end: { x: 25, y: 21 }, isExterior: true },
      { start: { x: 25, y: 21 }, end: { x: 3, y: 21 }, isExterior: true },
      { start: { x: 3, y: 21 }, end: { x: 3, y: 3 }, isExterior: true },
      { start: { x: 17, y: 3 }, end: { x: 17, y: 11 }, isExterior: false },
      { start: { x: 17, y: 11 }, end: { x: 25, y: 11 }, isExterior: false }
    ],
    recommendedRooms: [
      {
        name: 'Main Studio & Lounge',
        type: 'Living Room',
        polygon: [
          { x: 3, y: 3 },
          { x: 17, y: 3 },
          { x: 17, y: 11 },
          { x: 25, y: 11 },
          { x: 25, y: 21 },
          { x: 3, y: 21 }
        ],
        floorColor: '#b45309'
      },
      {
        name: 'Designer Bathroom',
        type: 'Bathroom',
        polygon: [
          { x: 17, y: 3 },
          { x: 25, y: 3 },
          { x: 25, y: 11 },
          { x: 17, y: 11 }
        ],
        floorColor: '#475569'
      }
    ],
    recommendedDoors: [
      { wallIndex: 4, positionRatio: 0.5 },
      { wallIndex: 3, positionRatio: 0.8 }
    ],
    recommendedWindows: [
      { wallIndex: 0, positionRatio: 0.5 },
      { wallIndex: 2, positionRatio: 0.5 }
    ]
  }
];

import { processMultiRepresentationPipeline } from './detection/preprocessingPipeline';
import { detectStructuralWalls } from './detection/wallDetector';
import { detectOpeningsAndSymbols } from './detection/openingDetector';
import { detectClosedRooms } from './detection/roomDetector';

/**
 * Core 2D Blueprint Analysis & Vector Extrusion Engine
 */
export async function convertBlueprintToFloorPlan(
  imageSource: HTMLImageElement | string,
  options: BlueprintConversionOptions
): Promise<ConvertedFloorPlanResult> {
  // Check if image is one of the built-in presets by matching svgDataUrl or preset ID
  if (typeof imageSource === 'string') {
    const matchedPreset = PRESET_BLUEPRINTS.find(p => p.id === imageSource || p.svgDataUrl === imageSource);
    if (matchedPreset) {
      return buildFloorPlanFromPreset(matchedPreset, options);
    }
  }

  // 1. Run Multi-Representation Preprocessing Pipeline
  const maps = await processMultiRepresentationPipeline(imageSource);

  // 2. Detect Parallel Line Wall Candidates & Reconstruct Wall Graph
  const wallsExtracted = detectStructuralWalls(maps, {
    plotWidth: options.plotWidth,
    plotLength: options.plotLength,
    unit: options.unit,
    wallThickness: options.wallThickness,
    sensitivity: options.sensitivity
  });

  const now = Date.now();
  const walls: Wall[] = wallsExtracted.map((w, idx) => ({
    id: w.id || `wall_${now}_${idx + 1}`,
    start: w.start,
    end: w.end,
    thickness: w.thickness || options.wallThickness,
    height: options.wallHeight,
    material: w.isExterior ? 'brick' : 'concrete',
    color: w.isExterior ? '#cbd5e1' : '#e2e8f0',
    isExterior: w.isExterior,
    confidenceScore: Math.round((w.confidence || 0.95) * 100)
  }));

  // 3. Detect Openings (Doors & Windows)
  let doors: Door[] = [];
  let windows: WindowItem[] = [];
  if (options.autoDetectOpenings) {
    const openings = detectOpeningsAndSymbols(maps, walls);
    doors = openings.doors;
    windows = openings.windows;
  }

  // 4. Detect Closed Room Polygons & Classify
  let rooms: Room[] = [];
  if (options.autoDetectRooms) {
    rooms = detectClosedRooms(maps, walls);
  }

  const estimatedLivingArea = rooms.reduce((acc, r) => acc + r.area, 0);

  return {
    walls,
    rooms,
    doors,
    windows,
    detectedWallsCount: walls.length,
    detectedRoomsCount: rooms.length,
    estimatedLivingArea: Math.round(estimatedLivingArea),
    multiRepresentationMaps: maps
  };
}

async function buildFloorPlanFromPreset(
  preset: PresetBlueprint,
  options: BlueprintConversionOptions
): Promise<ConvertedFloorPlanResult> {
  const now = Date.now();
  const walls: Wall[] = [];

  const refW = 36;
  const refL = 30;

  const bounds = calculateOverlayBounds(refW, refL, options.plotWidth, options.plotLength);

  const scalePoint = (p: Point2D): Point2D => ({
    x: snapToGrid(bounds.x + (p.x / refW) * bounds.width, 0.5),
    y: snapToGrid(bounds.y + (p.y / refL) * bounds.height, 0.5)
  });

  preset.recommendedWalls.forEach((w, idx) => {
    walls.push({
      id: `w_preset_${now}_${idx + 1}`,
      start: scalePoint(w.start),
      end: scalePoint(w.end),
      thickness: w.isExterior ? options.wallThickness * 1.2 : options.wallThickness,
      height: options.wallHeight,
      material: w.isExterior ? 'brick' : 'concrete',
      color: w.isExterior ? '#cbd5e1' : '#e2e8f0',
      isExterior: w.isExterior,
      confidenceScore: 98
    });
  });

  const rooms: Room[] = [];
  if (options.autoDetectRooms) {
    preset.recommendedRooms.forEach((r, idx) => {
      const scaledPoly = r.polygon.map(scalePoint);
      rooms.push({
        id: `r_preset_${now}_${idx + 1}`,
        name: r.name,
        type: r.type,
        polygon: scaledPoly,
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: r.floorColor,
        wallColor: '#f8fafc',
        area: calculatePolygonArea(scaledPoly)
      });
    });
  }

  const doors: Door[] = [];
  const windows: WindowItem[] = [];

  if (options.autoDetectOpenings) {
    if (preset.recommendedDoors) {
      preset.recommendedDoors.forEach((d, idx) => {
        if (walls[d.wallIndex]) {
          doors.push({
            id: `door_preset_${now}_${idx + 1}`,
            wallId: walls[d.wallIndex].id,
            positionRatio: d.positionRatio,
            width: 3.0,
            height: 7.0,
            doorType: 'single',
            color: '#78350f',
            material: 'wood',
            confidenceScore: 95
          });
        }
      });
    }

    if (preset.recommendedWindows) {
      preset.recommendedWindows.forEach((w, idx) => {
        if (walls[w.wallIndex]) {
          windows.push({
            id: `win_preset_${now}_${idx + 1}`,
            wallId: walls[w.wallIndex].id,
            positionRatio: w.positionRatio,
            width: 4.5,
            height: 4.0,
            sillHeight: 2.8,
            windowType: 'standard',
            color: '#38bdf8',
            confidenceScore: 95
          });
        }
      });
    }
  }

  const estimatedLivingArea = rooms.reduce((acc, r) => acc + r.area, 0);

  let maps: any = undefined;
  try {
    maps = await processMultiRepresentationPipeline(preset.svgDataUrl);
  } catch (e) {
    console.warn('Could not generate maps for preset blueprint:', e);
  }

  return {
    walls,
    rooms,
    doors,
    windows,
    detectedWallsCount: walls.length,
    detectedRoomsCount: rooms.length,
    estimatedLivingArea: Math.round(estimatedLivingArea),
    multiRepresentationMaps: maps
  };
}

function clusterLines(
  lines: any[],
  direction: 'horizontal' | 'vertical',
  clusterTolerance: number
) {
  if (lines.length === 0) return [];

  const sorted = [...lines].sort((a, b) => {
    const coordA = direction === 'horizontal' ? a.y : a.x;
    const coordB = direction === 'horizontal' ? b.y : b.x;
    return coordA - coordB;
  });

  const clusters: { coord: number; x1: number; x2: number; y1: number; y2: number }[] = [];
  let curCluster: any[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const curCoord = direction === 'horizontal' ? sorted[i].y : sorted[i].x;
    const prevCoord = direction === 'horizontal' ? sorted[i - 1].y : sorted[i - 1].x;

    if (curCoord - prevCoord <= clusterTolerance) {
      curCluster.push(sorted[i]);
    } else {
      clusters.push(mergeCluster(curCluster, direction));
      curCluster = [sorted[i]];
    }
  }

  if (curCluster.length > 0) {
    clusters.push(mergeCluster(curCluster, direction));
  }

  return clusters;
}

function mergeCluster(cluster: any[], direction: 'horizontal' | 'vertical') {
  let sumCoord = 0;
  let minSpan = 99999;
  let maxSpan = -99999;

  cluster.forEach(item => {
    if (direction === 'horizontal') {
      sumCoord += item.y;
      minSpan = Math.min(minSpan, item.x1);
      maxSpan = Math.max(maxSpan, item.x2);
    } else {
      sumCoord += item.x;
      minSpan = Math.min(minSpan, item.y1);
      maxSpan = Math.max(maxSpan, item.y2);
    }
  });

  const avgCoord = Math.round(sumCoord / cluster.length);
  return {
    coord: avgCoord,
    x1: direction === 'horizontal' ? minSpan : avgCoord,
    x2: direction === 'horizontal' ? maxSpan : avgCoord,
    y1: direction === 'vertical' ? minSpan : avgCoord,
    y2: direction === 'vertical' ? maxSpan : avgCoord
  };
}

function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = url;
  });
}
