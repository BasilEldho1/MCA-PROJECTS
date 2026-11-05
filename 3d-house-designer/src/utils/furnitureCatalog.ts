import { FurnitureCatalogItem } from '../types/floorplan';

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  // BEDROOM
  {
    id: 'single_bed',
    name: 'Single Bed',
    category: 'bedroom',
    defaultWidth: 3.5,
    defaultLength: 6.5,
    defaultHeight: 2.8,
    iconName: 'Bed',
    defaultColor: '#4f46e5',
    description: 'Comfortable single twin bed with mattress and pillows.'
  },
  {
    id: 'double_bed',
    name: 'Double / Queen Bed',
    category: 'bedroom',
    defaultWidth: 5.5,
    defaultLength: 6.5,
    defaultHeight: 3.2,
    iconName: 'BedDouble',
    defaultColor: '#4338ca',
    description: 'Queen-sized double bed with padded headboard and bedding.'
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe Closet',
    category: 'bedroom',
    defaultWidth: 4.0,
    defaultLength: 2.0,
    defaultHeight: 7.0,
    iconName: 'Box',
    defaultColor: '#78350f',
    description: 'Tall 2-door wooden wardrobe closet.'
  },
  {
    id: 'bedside_table',
    name: 'Bedside Nightstand',
    category: 'bedroom',
    defaultWidth: 1.8,
    defaultLength: 1.5,
    defaultHeight: 2.0,
    iconName: 'Square',
    defaultColor: '#92400e',
    description: 'Bedside drawer unit for lamps and accessories.'
  },
  {
    id: 'dressing_table',
    name: 'Dressing Table & Mirror',
    category: 'bedroom',
    defaultWidth: 3.5,
    defaultLength: 1.8,
    defaultHeight: 4.5,
    iconName: 'Sparkles',
    defaultColor: '#b45309',
    description: 'Vanity dressing table with mirror glass.'
  },

  // LIVING ROOM
  {
    id: 'sofa_3seater',
    name: 'Modern 3-Seater Sofa',
    category: 'living',
    defaultWidth: 7.0,
    defaultLength: 3.0,
    defaultHeight: 2.8,
    iconName: 'Armchair',
    defaultColor: '#1e293b',
    description: 'Plush fabric 3-seater couch.'
  },
  {
    id: 'sofa_lshape',
    name: 'L-Shaped Sectional Sofa',
    category: 'living',
    defaultWidth: 8.5,
    defaultLength: 6.0,
    defaultHeight: 2.8,
    iconName: 'Sofa',
    defaultColor: '#334155',
    description: 'Spacious L-shaped corner sectional sofa.'
  },
  {
    id: 'armchair',
    name: 'Accent Armchair',
    category: 'living',
    defaultWidth: 3.0,
    defaultLength: 3.0,
    defaultHeight: 3.0,
    iconName: 'Armchair',
    defaultColor: '#0f766e',
    description: 'Ergonomic single lounge chair.'
  },
  {
    id: 'coffee_table',
    name: 'Coffee Table',
    category: 'living',
    defaultWidth: 4.0,
    defaultLength: 2.2,
    defaultHeight: 1.5,
    iconName: 'Table',
    defaultColor: '#a16207',
    description: 'Low wooden coffee table for living room center.'
  },
  {
    id: 'tv_stand',
    name: 'TV Media Console',
    category: 'living',
    defaultWidth: 5.5,
    defaultLength: 1.5,
    defaultHeight: 2.0,
    iconName: 'Tv',
    defaultColor: '#27272a',
    description: 'Widescreen TV stand with storage drawers.'
  },
  {
    id: 'bookshelf',
    name: 'Tall Bookshelf',
    category: 'living',
    defaultWidth: 3.5,
    defaultLength: 1.2,
    defaultHeight: 6.5,
    iconName: 'Library',
    defaultColor: '#7c2d12',
    description: 'Multi-tier wooden bookshelf.'
  },

  // DINING
  {
    id: 'dining_table_4',
    name: '4-Seater Dining Set',
    category: 'dining',
    defaultWidth: 4.5,
    defaultLength: 3.5,
    defaultHeight: 2.6,
    iconName: 'Utensils',
    defaultColor: '#854d0e',
    description: 'Dining table with 4 surrounding chairs.'
  },
  {
    id: 'dining_table_6',
    name: '6-Seater Executive Dining',
    category: 'dining',
    defaultWidth: 6.5,
    defaultLength: 4.0,
    defaultHeight: 2.6,
    iconName: 'UtensilsCrossed',
    defaultColor: '#713f12',
    description: 'Large wooden dining table with 6 cushioned chairs.'
  },

  // KITCHEN
  {
    id: 'kitchen_counter',
    name: 'Kitchen Counter Cabinet',
    category: 'kitchen',
    defaultWidth: 6.0,
    defaultLength: 2.0,
    defaultHeight: 3.0,
    iconName: 'ChefHat',
    defaultColor: '#e2e8f0',
    description: 'Countertop with storage cabinets underneath.'
  },
  {
    id: 'kitchen_sink',
    name: 'Kitchen Sink Unit',
    category: 'kitchen',
    defaultWidth: 3.5,
    defaultLength: 2.0,
    defaultHeight: 3.0,
    iconName: 'Droplets',
    defaultColor: '#94a3b8',
    description: 'Stainless steel double sink with faucet.'
  },
  {
    id: 'refrigerator',
    name: 'Double-Door Refrigerator',
    category: 'kitchen',
    defaultWidth: 3.0,
    defaultLength: 2.8,
    defaultHeight: 6.2,
    iconName: 'Refrigerator',
    defaultColor: '#cbd5e1',
    description: 'Modern stainless steel fridge and freezer.'
  },
  {
    id: 'stove_oven',
    name: 'Gas Stove & Oven',
    category: 'kitchen',
    defaultWidth: 2.8,
    defaultLength: 2.2,
    defaultHeight: 3.0,
    iconName: 'Flame',
    defaultColor: '#1e293b',
    description: '4-burner cooking range with built-in oven.'
  },

  // BATHROOM
  {
    id: 'toilet',
    name: 'Modern Toilet Commode',
    category: 'bathroom',
    defaultWidth: 1.6,
    defaultLength: 2.3,
    defaultHeight: 2.5,
    iconName: 'Bath',
    defaultColor: '#ffffff',
    description: 'Ceramic flush toilet.'
  },
  {
    id: 'wash_basin',
    name: 'Bathroom Vanity Sink',
    category: 'bathroom',
    defaultWidth: 2.8,
    defaultLength: 1.8,
    defaultHeight: 2.8,
    iconName: 'Pipette',
    defaultColor: '#f8fafc',
    description: 'Vanity table with porcelain wash basin and mirror.'
  },
  {
    id: 'shower_cabin',
    name: 'Glass Shower Cubicle',
    category: 'bathroom',
    defaultWidth: 3.5,
    defaultLength: 3.5,
    defaultHeight: 6.8,
    iconName: 'ShowerHead',
    defaultColor: '#38bdf8',
    description: 'Enclosed tempered glass shower enclosure.'
  },
  {
    id: 'bathtub',
    name: 'Freestanding Bathtub',
    category: 'bathroom',
    defaultWidth: 5.5,
    defaultLength: 2.8,
    defaultHeight: 2.0,
    iconName: 'Bath',
    defaultColor: '#f1f5f9',
    description: 'Oval acrylic soaking bathtub.'
  },

  // OFFICE & STUDY
  {
    id: 'study_desk',
    name: 'Executive Office Desk',
    category: 'office',
    defaultWidth: 4.5,
    defaultLength: 2.2,
    defaultHeight: 2.5,
    iconName: 'Laptop',
    defaultColor: '#92400e',
    description: 'Wooden study desk with laptop workspace.'
  },
  {
    id: 'office_chair',
    name: 'Ergonomic Mesh Chair',
    category: 'office',
    defaultWidth: 2.0,
    defaultLength: 2.0,
    defaultHeight: 3.5,
    iconName: 'UserCheck',
    defaultColor: '#0f172a',
    description: 'Swivel ergonomic chair with lumbar support.'
  },

  // STAIRS & ARCHITECTURE
  {
    id: 'straight_stairs',
    name: 'Straight Wooden Stairs',
    category: 'stairs',
    defaultWidth: 3.5,
    defaultLength: 8.0,
    defaultHeight: 9.0,
    iconName: 'Layers',
    defaultColor: '#78350f',
    description: 'Wooden staircase with side handrails.'
  },
  {
    id: 'spiral_stairs',
    name: 'Spiral Metal Stairs',
    category: 'stairs',
    defaultWidth: 5.0,
    defaultLength: 5.0,
    defaultHeight: 9.0,
    iconName: 'RotateCw',
    defaultColor: '#334155',
    description: 'Space-saving circular spiral staircase.'
  },

  // OUTDOOR & MISC
  {
    id: 'potted_plant',
    name: 'Indoor Monstera Plant',
    category: 'outdoor',
    defaultWidth: 2.0,
    defaultLength: 2.0,
    defaultHeight: 3.5,
    iconName: 'Flower2',
    defaultColor: '#16a34a',
    description: 'Decorative potted green indoor plant.'
  },
  {
    id: 'floor_lamp',
    name: 'Standing Floor Lamp',
    category: 'misc',
    defaultWidth: 1.5,
    defaultLength: 1.5,
    defaultHeight: 5.5,
    iconName: 'Lightbulb',
    defaultColor: '#fbbf24',
    description: 'Modern tripod standing lamp with shade.'
  }
];
