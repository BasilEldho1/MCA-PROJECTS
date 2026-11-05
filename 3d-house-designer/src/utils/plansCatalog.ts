import { Project, Wall, Room, Door, WindowItem } from '../types/floorplan';

// Helper to generate consistent walls for a box
const createBoxWalls = (
  prefix: string,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  material: any = 'paint',
  color: string = '#cbd5e1'
): Wall[] => [
  { id: `${prefix}_w1`, start: { x: minX, y: minY }, end: { x: maxX, y: minY }, thickness: 0.6, height: 9.5, material, color, isExterior: true },
  { id: `${prefix}_w2`, start: { x: maxX, y: minY }, end: { x: maxX, y: maxY }, thickness: 0.6, height: 9.5, material, color, isExterior: true },
  { id: `${prefix}_w3`, start: { x: maxX, y: maxY }, end: { x: minX, y: maxY }, thickness: 0.6, height: 9.5, material, color, isExterior: true },
  { id: `${prefix}_w4`, start: { x: minX, y: maxY }, end: { x: minX, y: minY }, thickness: 0.6, height: 9.5, material, color, isExterior: true }
];

export const DEFAULT_PLANS_CATALOG: Project[] = [
  // ── 1. MODERN LUXURY VILLA ──
  {
    id: 'plan_modern_villa_3d',
    name: 'Modern Luxury Villa with Pool Patio',
    houseType: 'Luxury Villa',
    plotWidth: 50,
    plotLength: 40,
    unit: 'feet',
    floorsCount: 2,
    floors: 2,
    buildingDetails: {
      targetSqFt: 2850,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      style: 'Modern Luxury',
      facing: 'East'
    },
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-03-01T15:30:00.000Z',
    walls: [
      ...createBoxWalls('villa_outer', 4, 4, 46, 36, 'concrete', '#e2e8f0'),
      { id: 'villa_p1', start: { x: 28, y: 4 }, end: { x: 28, y: 22 }, thickness: 0.5, height: 9.5, material: 'concrete', color: '#cbd5e1' },
      { id: 'villa_p2', start: { x: 4, y: 22 }, end: { x: 34, y: 22 }, thickness: 0.5, height: 9.5, material: 'concrete', color: '#cbd5e1' },
      { id: 'villa_p3', start: { x: 24, y: 22 }, end: { x: 24, y: 36 }, thickness: 0.5, height: 9.5, material: 'concrete', color: '#cbd5e1' },
      { id: 'villa_p4', start: { x: 34, y: 20 }, end: { x: 34, y: 36 }, thickness: 0.5, height: 9.5, material: 'concrete', color: '#cbd5e1' }
    ],
    rooms: [
      {
        id: 'villa_r1',
        name: 'Grand Living & Lounge',
        type: 'Living Room',
        polygon: [{ x: 4, y: 4 }, { x: 28, y: 4 }, { x: 28, y: 22 }, { x: 4, y: 22 }],
        floorMaterial: 'marble',
        wallMaterial: 'paint',
        floorColor: '#f1f5f9',
        wallColor: '#ffffff',
        area: 432
      },
      {
        id: 'villa_r2',
        name: 'Open Island Kitchen',
        type: 'Kitchen',
        polygon: [{ x: 28, y: 4 }, { x: 46, y: 4 }, { x: 46, y: 20 }, { x: 28, y: 20 }],
        floorMaterial: 'tile',
        wallMaterial: 'tile',
        floorColor: '#334155',
        wallColor: '#f8fafc',
        area: 288
      },
      {
        id: 'villa_r3',
        name: 'Master Suite Retreat',
        type: 'Bedroom',
        polygon: [{ x: 4, y: 22 }, { x: 24, y: 22 }, { x: 24, y: 36 }, { x: 4, y: 36 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#92400e',
        wallColor: '#fdf4ff',
        area: 280
      },
      {
        id: 'villa_r4',
        name: 'Luxury Ensuite Bath',
        type: 'Bathroom',
        polygon: [{ x: 24, y: 22 }, { x: 34, y: 22 }, { x: 34, y: 36 }, { x: 24, y: 36 }],
        floorMaterial: 'marble',
        wallMaterial: 'tile',
        floorColor: '#0f172a',
        wallColor: '#ffffff',
        area: 140
      },
      {
        id: 'villa_r5',
        name: 'Swimming Pool Deck',
        type: 'Patio',
        polygon: [{ x: 34, y: 20 }, { x: 46, y: 20 }, { x: 46, y: 36 }, { x: 34, y: 36 }],
        floorMaterial: 'tile',
        wallMaterial: 'concrete',
        floorColor: '#38bdf8',
        wallColor: '#0284c7',
        area: 192
      }
    ],
    doors: [
      { id: 'villa_d1', wallId: 'villa_outer_w1', positionRatio: 0.3, width: 4.5, height: 7.5, doorType: 'double', color: '#1e293b', material: 'wood' },
      { id: 'villa_d2', wallId: 'villa_p2', positionRatio: 0.2, width: 3, height: 7, doorType: 'single', color: '#334155', material: 'wood' }
    ],
    windows: [
      { id: 'villa_wn1', wallId: 'villa_outer_w2', positionRatio: 0.4, width: 8, height: 6, sillHeight: 2, windowType: 'picture', color: '#0284c7' },
      { id: 'villa_wn2', wallId: 'villa_outer_w4', positionRatio: 0.6, width: 6, height: 5, sillHeight: 2.5, windowType: 'sliding', color: '#0284c7' }
    ],
    furniture: []
  },

  // ── 2. TRADITIONAL KERALA NALUKETTU ──
  {
    id: 'plan_kerala_nalukettu_3d',
    name: 'Kerala Traditional Nalukettu House',
    houseType: 'Traditional Courtyard',
    plotWidth: 44,
    plotLength: 40,
    unit: 'feet',
    floorsCount: 1,
    floors: 1,
    buildingDetails: {
      targetSqFt: 2200,
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      style: 'Kerala Heritage Vernacular',
      facing: 'North'
    },
    thumbnail: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-14T09:00:00.000Z',
    updatedAt: '2026-03-02T11:00:00.000Z',
    walls: [
      ...createBoxWalls('kerala_outer', 4, 4, 40, 36, 'brick', '#b45309'),
      ...createBoxWalls('kerala_court', 16, 14, 28, 24, 'wood', '#d97706'),
      { id: 'kerala_w1', start: { x: 4, y: 12 }, end: { x: 40, y: 12 }, thickness: 0.5, height: 9, material: 'wood', color: '#92400e' },
      { id: 'kerala_w2', start: { x: 16, y: 12 }, end: { x: 16, y: 36 }, thickness: 0.5, height: 9, material: 'wood', color: '#92400e' },
      { id: 'kerala_w3', start: { x: 28, y: 12 }, end: { x: 28, y: 36 }, thickness: 0.5, height: 9, material: 'wood', color: '#92400e' }
    ],
    rooms: [
      {
        id: 'kerala_r1',
        name: 'Poomukham (Grand Verandah)',
        type: 'Porch',
        polygon: [{ x: 4, y: 4 }, { x: 40, y: 4 }, { x: 40, y: 12 }, { x: 4, y: 12 }],
        floorMaterial: 'tile',
        wallMaterial: 'wood',
        floorColor: '#b45309',
        wallColor: '#fef3c7',
        area: 288
      },
      {
        id: 'kerala_r2',
        name: 'Nadumuttam (Central Courtyard)',
        type: 'Courtyard',
        polygon: [{ x: 16, y: 14 }, { x: 28, y: 14 }, { x: 28, y: 24 }, { x: 16, y: 24 }],
        floorMaterial: 'concrete',
        wallMaterial: 'wood',
        floorColor: '#059669',
        wallColor: '#d97706',
        area: 120
      },
      {
        id: 'kerala_r3',
        name: 'East Heritage Living Hall',
        type: 'Living Room',
        polygon: [{ x: 4, y: 12 }, { x: 16, y: 12 }, { x: 16, y: 26 }, { x: 4, y: 26 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#78350f',
        wallColor: '#fffbeb',
        area: 168
      },
      {
        id: 'kerala_r4',
        name: 'Pooja & Meditation Room',
        type: 'Pooja Room',
        polygon: [{ x: 4, y: 26 }, { x: 16, y: 26 }, { x: 16, y: 36 }, { x: 4, y: 36 }],
        floorMaterial: 'marble',
        wallMaterial: 'wood',
        floorColor: '#f8fafc',
        wallColor: '#fbbf24',
        area: 120
      },
      {
        id: 'kerala_r5',
        name: 'Thekkini Master Chamber',
        type: 'Bedroom',
        polygon: [{ x: 28, y: 12 }, { x: 40, y: 12 }, { x: 40, y: 26 }, { x: 28, y: 26 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#92400e',
        wallColor: '#fff7ed',
        area: 168
      },
      {
        id: 'kerala_r6',
        name: 'Traditional Kitchen & Pantry',
        type: 'Kitchen',
        polygon: [{ x: 28, y: 26 }, { x: 40, y: 26 }, { x: 40, y: 36 }, { x: 28, y: 36 }],
        floorMaterial: 'tile',
        wallMaterial: 'tile',
        floorColor: '#78350f',
        wallColor: '#fffbeb',
        area: 120
      }
    ],
    doors: [
      { id: 'kerala_d1', wallId: 'kerala_w1', positionRatio: 0.5, width: 4, height: 7.2, doorType: 'double', color: '#78350f', material: 'wood' }
    ],
    windows: [
      { id: 'kerala_wn1', wallId: 'kerala_outer_w1', positionRatio: 0.25, width: 4, height: 4.5, sillHeight: 3, windowType: 'standard', color: '#78350f' },
      { id: 'kerala_wn2', wallId: 'kerala_outer_w1', positionRatio: 0.75, width: 4, height: 4.5, sillHeight: 3, windowType: 'standard', color: '#78350f' }
    ],
    furniture: []
  },

  // ── 3. CONTEMPORARY MULTI-LEVEL DUPLEX ──
  {
    id: 'plan_contemporary_duplex_3d',
    name: 'Contemporary Atrium Duplex House',
    houseType: 'Duplex Residence',
    plotWidth: 32,
    plotLength: 48,
    unit: 'feet',
    floorsCount: 2,
    floors: 2,
    buildingDetails: {
      targetSqFt: 3100,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      style: 'Contemporary Atrium',
      facing: 'South'
    },
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-18T14:20:00.000Z',
    updatedAt: '2026-03-03T16:00:00.000Z',
    walls: [
      ...createBoxWalls('duplex_outer', 3, 3, 29, 45, 'concrete', '#cbd5e1'),
      { id: 'duplex_w1', start: { x: 3, y: 18 }, end: { x: 29, y: 18 }, thickness: 0.5, height: 10, material: 'concrete', color: '#94a3b8' },
      { id: 'duplex_w2', start: { x: 16, y: 18 }, end: { x: 16, y: 45 }, thickness: 0.5, height: 10, material: 'concrete', color: '#94a3b8' },
      { id: 'duplex_w3', start: { x: 3, y: 32 }, end: { x: 16, y: 32 }, thickness: 0.5, height: 10, material: 'concrete', color: '#94a3b8' }
    ],
    rooms: [
      {
        id: 'duplex_r1',
        name: 'Double-Height Great Hall',
        type: 'Living Room',
        polygon: [{ x: 3, y: 3 }, { x: 29, y: 3 }, { x: 29, y: 18 }, { x: 3, y: 18 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#0f172a',
        wallColor: '#f1f5f9',
        area: 390
      },
      {
        id: 'duplex_r2',
        name: 'Chef Kitchen & Dining Bar',
        type: 'Kitchen',
        polygon: [{ x: 16, y: 18 }, { x: 29, y: 18 }, { x: 29, y: 32 }, { x: 16, y: 32 }],
        floorMaterial: 'marble',
        wallMaterial: 'tile',
        floorColor: '#e2e8f0',
        wallColor: '#ffffff',
        area: 182
      },
      {
        id: 'duplex_r3',
        name: 'Atrium & Floating Stairs',
        type: 'Foyer',
        polygon: [{ x: 3, y: 18 }, { x: 16, y: 18 }, { x: 16, y: 32 }, { x: 3, y: 32 }],
        floorMaterial: 'concrete',
        wallMaterial: 'paint',
        floorColor: '#64748b',
        wallColor: '#f8fafc',
        area: 182
      },
      {
        id: 'duplex_r4',
        name: 'Ground Floor Guest Suite',
        type: 'Bedroom',
        polygon: [{ x: 3, y: 32 }, { x: 16, y: 32 }, { x: 16, y: 45 }, { x: 3, y: 45 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#a16207',
        wallColor: '#ffffff',
        area: 169
      },
      {
        id: 'duplex_r5',
        name: 'Terrace Garden Balcony',
        type: 'Patio',
        polygon: [{ x: 16, y: 32 }, { x: 29, y: 32 }, { x: 29, y: 45 }, { x: 16, y: 45 }],
        floorMaterial: 'tile',
        wallMaterial: 'paint',
        floorColor: '#10b981',
        wallColor: '#ecfdf5',
        area: 169
      }
    ],
    doors: [
      { id: 'duplex_d1', wallId: 'duplex_outer_w1', positionRatio: 0.45, width: 4, height: 8, doorType: 'double', color: '#0f172a', material: 'wood' }
    ],
    windows: [
      { id: 'duplex_wn1', wallId: 'duplex_outer_w4', positionRatio: 0.15, width: 8, height: 7, sillHeight: 1.5, windowType: 'picture', color: '#0284c7' }
    ],
    furniture: []
  },

  // ── 4. SCANDINAVIAN MINIMALIST BUNGALOW ──
  {
    id: 'plan_scandinavian_bungalow_3d',
    name: 'Scandinavian Minimalist Bungalow',
    houseType: 'Single-Floor Bungalow',
    plotWidth: 42,
    plotLength: 32,
    unit: 'feet',
    floorsCount: 1,
    floors: 1,
    buildingDetails: {
      targetSqFt: 1580,
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      style: 'Nordic Minimalist',
      facing: 'West'
    },
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-22T11:15:00.000Z',
    updatedAt: '2026-03-02T18:00:00.000Z',
    walls: [
      ...createBoxWalls('scandi_outer', 4, 4, 38, 28, 'wood', '#f1f5f9'),
      { id: 'scandi_w1', start: { x: 22, y: 4 }, end: { x: 22, y: 28 }, thickness: 0.5, height: 9, material: 'wood', color: '#e2e8f0' },
      { id: 'scandi_w2', start: { x: 4, y: 16 }, end: { x: 22, y: 16 }, thickness: 0.5, height: 9, material: 'wood', color: '#e2e8f0' },
      { id: 'scandi_w3', start: { x: 22, y: 18 }, end: { x: 38, y: 18 }, thickness: 0.5, height: 9, material: 'wood', color: '#e2e8f0' }
    ],
    rooms: [
      {
        id: 'scandi_r1',
        name: 'Nordic Great Room & Fireplace',
        type: 'Living Room',
        polygon: [{ x: 4, y: 4 }, { x: 22, y: 4 }, { x: 22, y: 16 }, { x: 4, y: 16 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#fde68a',
        wallColor: '#ffffff',
        area: 216
      },
      {
        id: 'scandi_r2',
        name: 'Minimalist Dining & Kitchen',
        type: 'Kitchen',
        polygon: [{ x: 4, y: 16 }, { x: 22, y: 16 }, { x: 22, y: 28 }, { x: 4, y: 28 }],
        floorMaterial: 'concrete',
        wallMaterial: 'paint',
        floorColor: '#e2e8f0',
        wallColor: '#f8fafc',
        area: 216
      },
      {
        id: 'scandi_r3',
        name: 'Primary Glass-View Bedroom',
        type: 'Bedroom',
        polygon: [{ x: 22, y: 4 }, { x: 38, y: 4 }, { x: 38, y: 18 }, { x: 22, y: 18 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#fef08a',
        wallColor: '#fdf4ff',
        area: 224
      },
      {
        id: 'scandi_r4',
        name: 'Nordic Sauna & Bath Spa',
        type: 'Bathroom',
        polygon: [{ x: 22, y: 18 }, { x: 38, y: 18 }, { x: 38, y: 28 }, { x: 22, y: 28 }],
        floorMaterial: 'tile',
        wallMaterial: 'wood',
        floorColor: '#b45309',
        wallColor: '#fef3c7',
        area: 160
      }
    ],
    doors: [
      { id: 'scandi_d1', wallId: 'scandi_outer_w4', positionRatio: 0.3, width: 3.5, height: 7, doorType: 'single', color: '#1e293b', material: 'wood' }
    ],
    windows: [
      { id: 'scandi_wn1', wallId: 'scandi_outer_w1', positionRatio: 0.5, width: 12, height: 6.5, sillHeight: 1.5, windowType: 'picture', color: '#0284c7' }
    ],
    furniture: []
  },

  // ── 5. SMART COMPACT MICRO-HOME ──
  {
    id: 'plan_compact_micro_home_3d',
    name: 'Smart Compact Eco Micro-Home',
    houseType: 'Compact Micro-Home',
    plotWidth: 24,
    plotLength: 28,
    unit: 'feet',
    floorsCount: 1,
    floors: 1,
    buildingDetails: {
      targetSqFt: 820,
      bedrooms: 1,
      bathrooms: 1,
      floors: 1,
      style: 'Eco Space-Saving Studio',
      facing: 'North'
    },
    thumbnail: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-25T16:45:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    walls: [
      ...createBoxWalls('compact_outer', 3, 3, 21, 25, 'wood', '#94a3b8'),
      { id: 'compact_w1', start: { x: 3, y: 14 }, end: { x: 21, y: 14 }, thickness: 0.4, height: 8.5, material: 'wood', color: '#cbd5e1' },
      { id: 'compact_w2', start: { x: 12, y: 14 }, end: { x: 12, y: 25 }, thickness: 0.4, height: 8.5, material: 'wood', color: '#cbd5e1' }
    ],
    rooms: [
      {
        id: 'compact_r1',
        name: 'Convertible Studio Lounge',
        type: 'Living Room',
        polygon: [{ x: 3, y: 3 }, { x: 21, y: 3 }, { x: 21, y: 14 }, { x: 3, y: 14 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#d97706',
        wallColor: '#ffffff',
        area: 198
      },
      {
        id: 'compact_r2',
        name: 'Modular Efficiency Kitchen',
        type: 'Kitchen',
        polygon: [{ x: 3, y: 14 }, { x: 12, y: 14 }, { x: 12, y: 25 }, { x: 3, y: 25 }],
        floorMaterial: 'tile',
        wallMaterial: 'tile',
        floorColor: '#475569',
        wallColor: '#f1f5f9',
        area: 99
      },
      {
        id: 'compact_r3',
        name: 'Alcove Bed & Smart Bath',
        type: 'Bedroom',
        polygon: [{ x: 12, y: 14 }, { x: 21, y: 14 }, { x: 21, y: 25 }, { x: 12, y: 25 }],
        floorMaterial: 'carpet',
        wallMaterial: 'paint',
        floorColor: '#94a3b8',
        wallColor: '#f8fafc',
        area: 99
      }
    ],
    doors: [
      { id: 'compact_d1', wallId: 'compact_outer_w3', positionRatio: 0.5, width: 3, height: 6.8, doorType: 'single', color: '#0f172a', material: 'wood' }
    ],
    windows: [
      { id: 'compact_wn1', wallId: 'compact_outer_w1', positionRatio: 0.5, width: 6, height: 4, sillHeight: 3, windowType: 'sliding', color: '#0284c7' }
    ],
    furniture: []
  },

  // ── 6. MODERN COUNTRY FARMHOUSE ──
  {
    id: 'plan_country_farmhouse_3d',
    name: 'Modern Country Farmhouse with Wraparound Porch',
    houseType: 'Country Farmhouse',
    plotWidth: 52,
    plotLength: 42,
    unit: 'feet',
    floorsCount: 2,
    floors: 2,
    buildingDetails: {
      targetSqFt: 3400,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      style: 'American Modern Farmhouse',
      facing: 'East'
    },
    thumbnail: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-02-28T13:10:00.000Z',
    updatedAt: '2026-03-03T10:15:00.000Z',
    walls: [
      ...createBoxWalls('farm_outer', 4, 4, 48, 38, 'wood', '#f8fafc'),
      { id: 'farm_w1', start: { x: 4, y: 10 }, end: { x: 48, y: 10 }, thickness: 0.5, height: 9.5, material: 'wood', color: '#cbd5e1' },
      { id: 'farm_w2', start: { x: 26, y: 10 }, end: { x: 26, y: 38 }, thickness: 0.5, height: 9.5, material: 'wood', color: '#cbd5e1' },
      { id: 'farm_w3', start: { x: 4, y: 26 }, end: { x: 26, y: 26 }, thickness: 0.5, height: 9.5, material: 'wood', color: '#cbd5e1' }
    ],
    rooms: [
      {
        id: 'farm_r1',
        name: 'Wraparound Front Porch',
        type: 'Porch',
        polygon: [{ x: 4, y: 4 }, { x: 48, y: 4 }, { x: 48, y: 10 }, { x: 4, y: 10 }],
        floorMaterial: 'wood',
        wallMaterial: 'wood',
        floorColor: '#78350f',
        wallColor: '#ffffff',
        area: 264
      },
      {
        id: 'farm_r2',
        name: 'Gabled Great Room & Hearth',
        type: 'Living Room',
        polygon: [{ x: 4, y: 10 }, { x: 26, y: 10 }, { x: 26, y: 26 }, { x: 4, y: 26 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#92400e',
        wallColor: '#f8fafc',
        area: 352
      },
      {
        id: 'farm_r3',
        name: 'Country Kitchen & Pantry',
        type: 'Kitchen',
        polygon: [{ x: 26, y: 10 }, { x: 48, y: 10 }, { x: 48, y: 26 }, { x: 26, y: 26 }],
        floorMaterial: 'tile',
        wallMaterial: 'brick',
        floorColor: '#b45309',
        wallColor: '#ffffff',
        area: 352
      },
      {
        id: 'farm_r4',
        name: 'First Floor Master Suite',
        type: 'Bedroom',
        polygon: [{ x: 4, y: 26 }, { x: 26, y: 26 }, { x: 26, y: 38 }, { x: 4, y: 38 }],
        floorMaterial: 'carpet',
        wallMaterial: 'paint',
        floorColor: '#cbd5e1',
        wallColor: '#ffffff',
        area: 264
      },
      {
        id: 'farm_r5',
        name: 'Screened Sunroom Patio',
        type: 'Patio',
        polygon: [{ x: 26, y: 26 }, { x: 48, y: 26 }, { x: 48, y: 38 }, { x: 26, y: 38 }],
        floorMaterial: 'concrete',
        wallMaterial: 'wood',
        floorColor: '#64748b',
        wallColor: '#f1f5f9',
        area: 264
      }
    ],
    doors: [
      { id: 'farm_d1', wallId: 'farm_w1', positionRatio: 0.35, width: 4.5, height: 7.5, doorType: 'double', color: '#1e293b', material: 'wood' }
    ],
    windows: [
      { id: 'farm_wn1', wallId: 'farm_outer_w4', positionRatio: 0.5, width: 6, height: 5, sillHeight: 2.5, windowType: 'standard', color: '#1e293b' }
    ],
    furniture: []
  },

  // ── 7. MEDITERRANEAN COASTAL VILLA ──
  {
    id: 'plan_mediterranean_estate_3d',
    name: 'Mediterranean Coastal Villa with Solarium',
    houseType: 'Mediterranean Villa',
    plotWidth: 48,
    plotLength: 38,
    unit: 'feet',
    floorsCount: 2,
    floors: 2,
    buildingDetails: {
      targetSqFt: 2650,
      bedrooms: 3,
      bathrooms: 3,
      floors: 2,
      style: 'Spanish Revival & Coastal Terracotta',
      facing: 'West'
    },
    thumbnail: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-03T14:40:00.000Z',
    walls: [
      ...createBoxWalls('med_outer', 4, 4, 44, 34, 'brick', '#fbbf24'),
      { id: 'med_w1', start: { x: 22, y: 4 }, end: { x: 22, y: 34 }, thickness: 0.6, height: 10, material: 'brick', color: '#d97706' },
      { id: 'med_w2', start: { x: 4, y: 18 }, end: { x: 22, y: 18 }, thickness: 0.5, height: 10, material: 'brick', color: '#d97706' },
      { id: 'med_w3', start: { x: 22, y: 20 }, end: { x: 44, y: 20 }, thickness: 0.5, height: 10, material: 'brick', color: '#d97706' }
    ],
    rooms: [
      {
        id: 'med_r1',
        name: 'Arched Loggia Entry',
        type: 'Porch',
        polygon: [{ x: 4, y: 4 }, { x: 22, y: 4 }, { x: 22, y: 18 }, { x: 4, y: 18 }],
        floorMaterial: 'tile',
        wallMaterial: 'brick',
        floorColor: '#ea580c',
        wallColor: '#fef3c7',
        area: 252
      },
      {
        id: 'med_r2',
        name: 'Sunlit Coastal Living Hall',
        type: 'Living Room',
        polygon: [{ x: 22, y: 4 }, { x: 44, y: 4 }, { x: 44, y: 20 }, { x: 22, y: 20 }],
        floorMaterial: 'marble',
        wallMaterial: 'paint',
        floorColor: '#f8fafc',
        wallColor: '#ffffff',
        area: 352
      },
      {
        id: 'med_r3',
        name: 'Terracotta Spanish Kitchen',
        type: 'Kitchen',
        polygon: [{ x: 4, y: 18 }, { x: 22, y: 18 }, { x: 22, y: 34 }, { x: 4, y: 34 }],
        floorMaterial: 'tile',
        wallMaterial: 'tile',
        floorColor: '#c2410c',
        wallColor: '#fff7ed',
        area: 288
      },
      {
        id: 'med_r4',
        name: 'Master Sea-Breeze Bedroom',
        type: 'Bedroom',
        polygon: [{ x: 22, y: 20 }, { x: 44, y: 20 }, { x: 44, y: 34 }, { x: 22, y: 34 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#d97706',
        wallColor: '#fdf4ff',
        area: 308
      }
    ],
    doors: [
      { id: 'med_d1', wallId: 'med_outer_w4', positionRatio: 0.3, width: 4, height: 8, doorType: 'arch', color: '#78350f', material: 'wood' }
    ],
    windows: [
      { id: 'med_wn1', wallId: 'med_outer_w2', positionRatio: 0.6, width: 8, height: 6, sillHeight: 2, windowType: 'bay', color: '#c2410c' }
    ],
    furniture: []
  },

  // ── 8. URBAN INDUSTRIAL LOFT & PENTHOUSE ──
  {
    id: 'plan_industrial_loft_3d',
    name: 'Urban Industrial Loft & Penthouse Suite',
    houseType: 'Industrial Loft',
    plotWidth: 36,
    plotLength: 46,
    unit: 'feet',
    floorsCount: 2,
    floors: 2,
    buildingDetails: {
      targetSqFt: 2450,
      bedrooms: 2,
      bathrooms: 2,
      floors: 2,
      style: 'Industrial Exposed Concrete & Steel',
      facing: 'North'
    },
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80',
    createdAt: '2026-03-02T12:00:00.000Z',
    updatedAt: '2026-03-03T17:00:00.000Z',
    walls: [
      ...createBoxWalls('loft_outer', 3, 3, 33, 43, 'concrete', '#475569'),
      { id: 'loft_w1', start: { x: 3, y: 24 }, end: { x: 33, y: 24 }, thickness: 0.5, height: 11, material: 'concrete', color: '#334155' },
      { id: 'loft_w2', start: { x: 18, y: 24 }, end: { x: 18, y: 43 }, thickness: 0.5, height: 11, material: 'concrete', color: '#334155' }
    ],
    rooms: [
      {
        id: 'loft_r1',
        name: 'Open Industrial Great Hall',
        type: 'Living Room',
        polygon: [{ x: 3, y: 3 }, { x: 33, y: 3 }, { x: 33, y: 24 }, { x: 3, y: 24 }],
        floorMaterial: 'concrete',
        wallMaterial: 'brick',
        floorColor: '#334155',
        wallColor: '#64748b',
        area: 630
      },
      {
        id: 'loft_r2',
        name: 'Commercial Island Kitchen',
        type: 'Kitchen',
        polygon: [{ x: 3, y: 24 }, { x: 18, y: 24 }, { x: 18, y: 43 }, { x: 3, y: 43 }],
        floorMaterial: 'tile',
        wallMaterial: 'concrete',
        floorColor: '#0f172a',
        wallColor: '#1e293b',
        area: 285
      },
      {
        id: 'loft_r3',
        name: 'Mezzanine Penthouse Suite',
        type: 'Bedroom',
        polygon: [{ x: 18, y: 24 }, { x: 33, y: 24 }, { x: 33, y: 43 }, { x: 18, y: 43 }],
        floorMaterial: 'wood',
        wallMaterial: 'paint',
        floorColor: '#1e293b',
        wallColor: '#f1f5f9',
        area: 285
      }
    ],
    doors: [
      { id: 'loft_d1', wallId: 'loft_outer_w1', positionRatio: 0.5, width: 4.5, height: 8, doorType: 'sliding', color: '#0f172a', material: 'wood' }
    ],
    windows: [
      { id: 'loft_wn1', wallId: 'loft_outer_w4', positionRatio: 0.35, width: 14, height: 8, sillHeight: 1, windowType: 'picture', color: '#0f172a' }
    ],
    furniture: []
  }
];
