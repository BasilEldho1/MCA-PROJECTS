export type UnitType = 'feet' | 'meters';

export interface Point2D {
  x: number;
  y: number;
}

export type MaterialType = 'paint' | 'brick' | 'concrete' | 'wood' | 'tile' | 'marble' | 'carpet';

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // in current unit (e.g., 0.5 ft or 0.15 m)
  height: number;    // e.g., 9 ft or 2.7 m
  material: MaterialType;
  color: string;
  isExterior?: boolean;
  confidenceScore?: number; // 0 to 100 percentage confidence from detection
}

export type DoorType = 'single' | 'double' | 'sliding' | 'arch';

export interface Door {
  id: string;
  wallId: string;
  positionRatio: number; // 0 to 1 along wall
  width: number;
  height: number;
  doorType: DoorType;
  color: string;
  material: string;
  swingDirection?: 'left' | 'right' | 'inward' | 'outward';
  confidenceScore?: number;
}

export type WindowType = 'standard' | 'sliding' | 'picture' | 'bay';

export interface WindowItem {
  id: string;
  wallId: string;
  positionRatio: number; // 0 to 1 along wall
  width: number;
  height: number;
  sillHeight: number;
  windowType: WindowType;
  color: string;
  confidenceScore?: number;
}

export interface Room {
  id: string;
  name: string;
  type: string; // 'Living Room' | 'Bedroom' | 'Kitchen' | 'Bathroom' | etc.
  polygon: Point2D[];
  floorMaterial: MaterialType;
  wallMaterial: MaterialType;
  floorColor: string;
  wallColor: string;
  area: number; // in sq ft or sq m
  confidenceScore?: number;
}

export type FurnitureCategory =
  | 'bedroom'
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'stairs'
  | 'outdoor'
  | 'misc';

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  defaultWidth: number;
  defaultLength: number;
  defaultHeight: number;
  iconName: string;
  defaultColor: string;
  description?: string;
  recommendedRoomTypes?: string[];
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  name: string;
  category: FurnitureCategory;
  x: number;
  y: number;
  z: number; // Elevation off floor
  width: number;
  length: number;
  height: number;
  rotation: number; // angle in degrees 0-360
  color: string;
  material?: string;
  roomId?: string;
}

export type CameraMode = 'perspective' | 'top' | 'orbit360' | 'firstPerson' | 'front' | 'side' | 'isometric';
export type ToolMode =
  | 'select'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'stairs'
  | 'furniture'
  | 'measurement'
  | 'scale'
  | 'delete';

export interface BlueprintOverlay {
  imageUrl: string;
  originalFileName?: string;
  originalFileSize?: string;
  originalFileType?: string;
  opacity: number; // 0.1 to 1.0
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  scalePixelsPerUnit?: number;
}

export interface FloorData {
  floorId: string;
  name: string;
  elevation: number; // Height offset from ground level
  wallHeight: number;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: WindowItem[];
  furniture: FurnitureItem[];
  blueprintOverlay?: BlueprintOverlay | null;
}

export type WorkflowStep = 'upload' | 'analyze' | 'edit2d' | 'generate3d' | 'interior';

export type ProcessingStage =
  | 'IDLE'
  | 'UPLOAD'
  | 'VALIDATING FILE'
  | 'PREPROCESSING'
  | 'DETECTING STRUCTURE'
  | 'DETECTING ROOMS'
  | 'DETECTING DOORS & WINDOWS'
  | 'CALCULATING SCALE'
  | 'CREATING EDITABLE 2D MODEL'
  | 'USER REVIEW'
  | 'GENERATING 3D MODEL'
  | '3D MODEL READY'
  | 'ERROR';

export interface ValidationIssue {
  id: string;
  type: 'open_wall' | 'overlapping_wall' | 'unattached_opening' | 'unbounded_room' | 'invalid_dimension';
  severity: 'warning' | 'error';
  message: string;
  objectId?: string;
  objectType?: 'wall' | 'door' | 'window' | 'room';
  canAutoFix: boolean;
}

export interface BuildingDetails {
  targetSqFt?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  style?: string;
  facing?: string;
}

export interface Project {
  id: string;
  name: string;
  houseType: string; // 'Single Family', 'Villa', 'Duplex', 'Studio', 'Apartment'
  plotWidth: number;
  plotLength: number;
  unit: UnitType;
  floorsCount: number;
  buildingDetails?: BuildingDetails;
  floors?: number;
  activeFloorIndex?: number;
  floorsData?: FloorData[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: WindowItem[];
  furniture: FurnitureItem[];
  isPublic?: boolean;
  userId?: string;
  blueprintOverlay?: BlueprintOverlay | null;
  workflowStep?: WorkflowStep;
  originalFilePreserved?: {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null;
}

export type UserRole = 'user' | 'professional' | 'admin';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentMetadata {
  filename?: string;
  originalName?: string;
  path?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  hasDocument?: boolean;
}

export interface VerificationInfo {
  status: VerificationStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface VerificationHistoryItem {
  _id: string;
  professionalId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED';
  previousStatus: string;
  newStatus: string;
  adminId?: string;
  adminName?: string;
  reason?: string;
  notes?: string;
  timestamp: string;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  profession?: string;
  location?: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  verificationStatus?: string;
  verification?: VerificationInfo;
  createdAt?: string;
}

export type SpecializationType =
  | 'Architect'
  | 'Interior Designer'
  | 'Builder'
  | 'Structural Engineer'
  | 'Civil Engineer'
  | 'Landscape Designer';

export interface Professional {
  _id: string;
  id?: string;
  userId: string | User;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  companyName?: string;
  licenseNumber?: string;
  registrationCouncil?: string;
  qualification?: string;
  specialization: SpecializationType;
  experience: string;
  yearsOfExperience?: number;
  description: string;
  profileImage: string;
  avatar?: string;
  title?: string;
  portfolioWebsite?: string;
  availability: 'available' | 'busy' | 'offline';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  verification?: VerificationInfo;
  licenseDocument?: DocumentMetadata | null;
  qualificationDocument?: DocumentMetadata | null;
  rating: number;
  reviewsCount: number;
  hourlyRate: string;
  chatPricing?: ChatPricingPlan[];
  location?: string;
  skills?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatPricingPlan {
  durationMinutes: number;
  price: number;
  label?: string;
  isActive?: boolean;
}

export interface PaymentTransaction {
  _id: string;
  id?: string;
  paymentId: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  userId: string | User;
  professionalId: string | Professional | User;
  chatSessionId?: string | PaidChatSession;
  amount: number;
  chatFee: number;
  serviceFee: number;
  currency: string;
  status: 'CREATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  chatDuration: number;
  paymentMethod?: 'CARD' | 'RAZORPAY' | 'UPI' | 'WALLET' | 'SIMULATION';
  cardBrand?: string;
  cardLast4?: string;
  cardholderName?: string;
  authCode?: string;
  receipt?: string;
  refundDetails?: {
    refundId?: string;
    reason?: string;
    refundedAt?: string;
    amount?: number;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DemoTestCard {
  id: string;
  label: string;
  number: string;
  exp: string;
  cvv: string;
  holder: string;
  brand: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover';
  scenario: string;
  badge: string;
}

export interface DemoCardChargePayload {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  professionalId?: string;
  durationMinutes?: number;
  amount?: number;
  otp?: string;
  require3DS?: boolean;
}

export interface DemoCardChargeResponse {
  success?: boolean;
  requires3DS?: boolean;
  challengeId?: string;
  cardBrand?: string;
  cardLast4?: string;
  maskedPhone?: string;
  message?: string;
  error?: string;
  code?: string;
  payment?: PaymentTransaction;
  session?: PaidChatSession;
  chatSession?: PaidChatSession;
  conversationId?: string;
  alreadyActive?: boolean;
  receipt?: {
    receiptNumber: string;
    transactionId: string;
    gatewayPaymentId: string;
    authCode: string;
    amount: number;
    currency: string;
    cardBrand: string;
    cardLast4: string;
    cardholderName: string;
    timestamp: string;
    paymentStatus: string;
    method: string;
  };
}

export interface PaidChatSession {
  _id: string;
  id?: string;
  userId: string | User;
  professionalId: string | Professional | User;
  paymentId: string;
  conversationId: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  sessionStatus: 'ACTIVE' | 'EXPIRED' | 'ENDED_BY_USER' | 'ENDED_BY_PRO';
  endedBy?: 'USER' | 'PROFESSIONAL' | 'SYSTEM';
  endedAt?: string;
  createdAt?: string;
  remainingSeconds?: number;
}

export type ChatRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface ProjectSnapshot {
  id: string;
  name: string;
  houseType: string;
  plotWidth: number;
  plotLength: number;
  unit: UnitType;
  floorsCount?: number;
  thumbnail?: string;
  roomsCount?: number;
  walls?: Wall[];
  rooms?: Room[];
  doors?: Door[];
  windows?: WindowItem[];
  furniture?: FurnitureItem[];
  format?: string;
  permission?: 'view' | 'edit';
  sharedFiles?: Array<{
    name: string;
    type: string;
    dataUrl: string;
    size?: number;
  }>;
}

export interface ChatRequest {
  _id: string;
  id?: string;
  senderId: string | User;
  receiverId: string | User;
  status: ChatRequestStatus;
  message: string;
  projectId?: string | null;
  projectSnapshot?: ProjectSnapshot | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  participants: (string | User)[];
  projectId?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageType = 'text' | 'project_share' | 'ai_blueprint_scan';

export interface AIScanMessageAttachment {
  imageUrl: string;
  fileName: string;
  fileSizeFormatted?: string;
  confidenceScore: number;
  extractedWallsCount: number;
  extractedRoomsCount: number;
  extractedDoorsCount: number;
  extractedWindowsCount: number;
  estimatedLivingArea: number;
  aiInsights: string[];
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: WindowItem[];
  furniture?: FurnitureItem[];
}

export interface Message {
  _id: string;
  id?: string;
  conversationId: string;
  senderId: string | User;
  receiverId?: string | User;
  message?: string;
  content?: string;
  messageType?: MessageType;
  sharedProject?: ProjectSnapshot | null;
  projectSnapshot?: ProjectSnapshot | null;
  aiScanResult?: AIScanMessageAttachment | null;
  readStatus?: boolean;
  createdAt: string;
}

