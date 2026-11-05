import { Project, Wall, Room, Door, WindowItem, UnitType } from '../types/floorplan';

interface GeneratePlanParams {
  name: string;
  houseType: string;
  plotWidth: number;
  plotLength: number;
  unit: UnitType;
  floorsCount: number;
  targetSqFt: number;
  bedrooms: number;
  bathrooms: number;
}

// Select matching archetype photo
const getArchetypeThumbnail = (houseType: string): string => {
  const t = houseType.toLowerCase();
  if (t.includes('kerala') || t.includes('traditional') || t.includes('nalukettu')) {
    return 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('duplex')) {
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('bungalow') || t.includes('scandinavian')) {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('compact') || t.includes('micro') || t.includes('tiny')) {
    return 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('farmhouse') || t.includes('country')) {
    return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('mediterranean') || t.includes('spanish')) {
    return 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=700&q=80';
  }
  if (t.includes('loft') || t.includes('industrial')) {
    return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80';
  }
  // Default Luxury Villa
  return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80';
};

export const generateConfiguredProject = (params: GeneratePlanParams): Project => {
  const {
    name,
    houseType,
    plotWidth,
    plotLength,
    unit,
    floorsCount,
    targetSqFt,
    bedrooms,
    bathrooms
  } = params;

  const id = `proj_${Date.now()}`;
  const now = new Date().toISOString();

  // Exact building footprint matching plot dimensions
  const x1 = 0;
  const y1 = 0;
  const x2 = plotWidth;
  const y2 = plotLength;
  const bWidth = plotWidth;
  const bLength = plotLength;

  const walls: Wall[] = [];
  const rooms: Room[] = [];
  const doors: Door[] = [];
  const windows: WindowItem[] = [];

  // Helper to add a wall
  let wallIdx = 1;
  const addWall = (sx: number, sy: number, ex: number, ey: number, isExt = false, mat: any = 'paint', col = '#cbd5e1') => {
    const wid = `${id}_w${wallIdx++}`;
    walls.push({
      id: wid,
      start: { x: Math.round(sx * 10) / 10, y: Math.round(sy * 10) / 10 },
      end: { x: Math.round(ex * 10) / 10, y: Math.round(ey * 10) / 10 },
      thickness: isExt ? 0.75 : 0.5,
      height: 9.5,
      material: mat,
      color: col,
      isExterior: isExt
    });
    return wid;
  };

  // Perimeter Exterior Walls
  const wTop = addWall(x1, y1, x2, y1, true, 'brick', '#94a3b8');
  const wRight = addWall(x2, y1, x2, y2, true, 'brick', '#94a3b8');
  const wBottom = addWall(x2, y2, x1, y2, true, 'brick', '#94a3b8');
  const wLeft = addWall(x1, y2, x1, y1, true, 'brick', '#94a3b8');

  // Entrance door on front wall
  doors.push({
    id: `${id}_d_front`,
    wallId: wTop,
    positionRatio: 0.5,
    width: 4.5,
    height: 7.5,
    doorType: 'double',
    color: '#0f172a',
    material: 'wood'
  });

  // Windows along exterior
  windows.push(
    { id: `${id}_wn1`, wallId: wTop, positionRatio: 0.2, width: 5, height: 4.5, sillHeight: 2.5, windowType: 'standard', color: '#0284c7' },
    { id: `${id}_wn2`, wallId: wTop, positionRatio: 0.8, width: 5, height: 4.5, sillHeight: 2.5, windowType: 'standard', color: '#0284c7' },
    { id: `${id}_wn3`, wallId: wRight, positionRatio: 0.35, width: 6, height: 5, sillHeight: 2.5, windowType: 'sliding', color: '#0284c7' },
    { id: `${id}_wn4`, wallId: wLeft, positionRatio: 0.35, width: 6, height: 5, sillHeight: 2.5, windowType: 'sliding', color: '#0284c7' }
  );

  const t = houseType.toLowerCase();
  const isKerala = t.includes('kerala') || t.includes('traditional') || t.includes('nalukettu');

  let roomIdx = 1;
  const createRoom = (rName: string, rType: string, rx1: number, ry1: number, rx2: number, ry2: number, fMat: any = 'wood', fCol = '#f1f5f9') => {
    const area = Math.round((rx2 - rx1) * (ry2 - ry1));
    rooms.push({
      id: `${id}_r${roomIdx++}`,
      name: rName,
      type: rType,
      polygon: [
        { x: rx1, y: ry1 },
        { x: rx2, y: ry1 },
        { x: rx2, y: ry2 },
        { x: rx1, y: ry2 }
      ],
      floorMaterial: fMat,
      wallMaterial: 'paint',
      floorColor: fCol,
      wallColor: '#ffffff',
      area
    });
  };

  if (isKerala) {
    // ── KERALA TRADITIONAL NALUKETTU SPECIFICATION ──
    const frontVerandahDepth = Math.round(bLength * 0.18);
    const midY1 = y1 + frontVerandahDepth;
    const midY2 = Math.round(y1 + bLength * 0.62);

    // 1. Poomukham Verandah
    createRoom('Poomukham (Grand Verandah)', 'Porch', x1, y1, x2, midY1, 'tile', '#b45309');
    const wFrontMid = addWall(x1, midY1, x2, midY1, false, 'wood', '#92400e');
    doors.push({
      id: `${id}_d_verandah`,
      wallId: wFrontMid,
      positionRatio: 0.5,
      width: 4.0,
      height: 7.5,
      doorType: 'double',
      color: '#451a03',
      material: 'wood'
    });

    // Central Heritage Zone (Living, Courtyard, Kitchen)
    const cx1 = Math.round(x1 + bWidth * 0.35);
    const cx2 = Math.round(x1 + bWidth * 0.65);

    // Living Hall
    createRoom('East Living & Heritage Hall', 'Living Room', x1, midY1, cx1, midY2, 'wood', '#78350f');

    // Central Courtyard
    createRoom('Nadumuttam (Courtyard)', 'Courtyard', cx1, midY1, cx2, midY2, 'concrete', '#059669');
    addWall(cx1, midY1, cx1, midY2, false, 'wood', '#92400e');
    addWall(cx2, midY1, cx2, midY2, false, 'wood', '#92400e');
    addWall(cx1, midY2, cx2, midY2, false, 'wood', '#92400e');

    // Traditional Kitchen & Dining
    createRoom('Traditional Kitchen (Adukkala)', 'Kitchen', cx2, midY1, x2, midY2, 'tile', '#b45309');

    // Rear Section: Divided into Master Suite and Family Chamber
    const rearSplitX = Math.round(x1 + bWidth * 0.5);
    createRoom('Master Heritage Chamber Suite', 'Bedroom', x1, midY2, rearSplitX, y2, 'wood', '#92400e');
    createRoom('Family Suite & Guest Chamber', 'Bedroom', rearSplitX, midY2, x2, y2, 'wood', '#92400e');
    addWall(x1, midY2, cx1, midY2, false, 'paint', '#cbd5e1');
    addWall(cx2, midY2, x2, midY2, false, 'paint', '#cbd5e1');
    addWall(rearSplitX, midY2, rearSplitX, y2, false, 'paint', '#cbd5e1');

  } else {
    // ── VILLA / DUPLEX / CONTEMPORARY / BUNGALOW / COMPACT SPECIFICATION ──
    const splitY = Math.round(y1 + bLength * 0.48);
    const splitX = Math.round(x1 + bWidth * 0.55);

    // Front Living Hall
    createRoom('Grand Living & Lounge', 'Living Room', x1, y1, splitX, splitY, 'marble', '#f8fafc');
    addWall(splitX, y1, splitX, splitY, false, 'paint', '#cbd5e1');
    const midWall = addWall(x1, splitY, x2, splitY, false, 'paint', '#cbd5e1');

    // Internal door from living to rear
    doors.push({
      id: `${id}_d_mid`,
      wallId: midWall,
      positionRatio: 0.3,
      width: 3.2,
      height: 7.0,
      doorType: 'single',
      color: '#451a03',
      material: 'wood'
    });

    // Kitchen & Dining
    createRoom('Kitchen & Dining Area', 'Kitchen', splitX, y1, x2, splitY, 'tile', '#334155');

    // Rear Section: Master Suite and Guest Bedroom Suite
    createRoom('Master Bedroom Suite', 'Bedroom', x1, splitY, splitX, y2, 'wood', '#92400e');
    createRoom('Guest Bedroom & Study Suite', 'Bedroom', splitX, splitY, x2, y2, 'wood', '#92400e');
    addWall(splitX, splitY, splitX, y2, false, 'paint', '#cbd5e1');
  }

  return {
    id,
    name,
    houseType,
    plotWidth,
    plotLength,
    unit,
    floorsCount,
    floors: floorsCount,
    buildingDetails: {
      targetSqFt: targetSqFt || plotWidth * plotLength,
      bedrooms,
      bathrooms,
      floors: floorsCount,
      style: isKerala ? 'Kerala Heritage Vernacular' : houseType,
      facing: 'East'
    },
    thumbnail: getArchetypeThumbnail(houseType),
    createdAt: now,
    updatedAt: now,
    walls,
    rooms,
    doors,
    windows,
    furniture: []
  };
};
