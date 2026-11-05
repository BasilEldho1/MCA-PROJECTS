import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserModel from '../models/User.js';
import ProfessionalModel from '../models/Professional.js';
import ChatRequestModel from '../models/ChatRequest.js';
import ConversationModel from '../models/Conversation.js';
import MessageModel from '../models/Message.js';
import ProjectModel from '../models/Project.js';
import VerificationHistoryModel from '../models/VerificationHistory.js';
import NotificationModel from '../models/Notification.js';
import PaymentModel from '../models/Payment.js';
import ChatSessionModel from '../models/ChatSession.js';
import { isDBConnected } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROFESSIONALS_FILE = path.join(DATA_DIR, 'professionals.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const CHAT_REQUESTS_FILE = path.join(DATA_DIR, 'chat_requests.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Ensure database directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[dataStore] Directory init warning:', e.message);
}

export const persistUsers = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(memoryStore.users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist users to file:', err.message);
  }
};

export const persistProfessionals = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROFESSIONALS_FILE, JSON.stringify(memoryStore.professionals, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist professionals to file:', err.message);
  }
};

export const persistConversations = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(memoryStore.conversations, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist conversations to file:', err.message);
  }
};

export const persistMessages = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(memoryStore.messages, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist messages to file:', err.message);
  }
};

export const persistChatRequests = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHAT_REQUESTS_FILE, JSON.stringify(memoryStore.chatRequests, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist chat requests to file:', err.message);
  }
};

export const persistProjects = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(memoryStore.projects, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dataStore] Could not persist projects to file:', err.message);
  }
};

const loadPersistedProjects = () => {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[dataStore] Could not read projects.json:', e.message);
  }
  return null;
};

const loadPersistedConversations = () => {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const content = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[dataStore] Could not read conversations.json:', e.message);
  }
  return null;
};

const loadPersistedMessages = () => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const content = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[dataStore] Could not read messages.json:', e.message);
  }
  return null;
};

const loadPersistedChatRequests = () => {
  try {
    if (fs.existsSync(CHAT_REQUESTS_FILE)) {
      const content = fs.readFileSync(CHAT_REQUESTS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[dataStore] Could not read chat_requests.json:', e.message);
  }
  return null;
};

const loadPersistedProfessionals = () => {
  try {
    if (fs.existsSync(PROFESSIONALS_FILE)) {
      const content = fs.readFileSync(PROFESSIONALS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn('[dataStore] Could not read professionals.json:', e.message);
  }
  return null;
};


const loadPersistedUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const list = JSON.parse(content);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn('[dataStore] Could not read users.json:', e.message);
  }
  return null;
};


// Pre-generated ObjectIds for seed data consistency
const ID_USER_ALEX = '65e011111111111111111101';
const ID_USER_ELENA = '65e011111111111111111102';
const ID_USER_MARCUS = '65e011111111111111111103';
const ID_USER_LIAM = '65e011111111111111111104';
const ID_USER_SOPHIA = '65e011111111111111111105';
const ID_USER_ADMIN = '65e011111111111111111100';

const ID_PRO_ELENA = '65e022222222222222222202';
const ID_PRO_MARCUS = '65e022222222222222222203';
const ID_PRO_LIAM = '65e022222222222222222204';
const ID_PRO_SOPHIA = '65e022222222222222222205';

// Default hashed password for demo users ("password123")
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 8);

// In-Memory Fallback Collections
export const memoryStore = {
  users: [
    {
      _id: ID_USER_ALEX,
      name: 'Alex Rivera',
      username: 'alex_rivera',
      email: 'alex@example.com',
      phone: '+1 (555) 123-4567',
      password: DEMO_PASSWORD_HASH,
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-05-15T00:00:00.000Z')
    },
    {
      _id: ID_USER_ELENA,
      name: 'Elena Rostova, AIA',
      username: 'elena_arch',
      email: 'elena.rostova@design.com',
      phone: '+1 (555) 234-5678',
      password: DEMO_PASSWORD_HASH,
      role: 'professional',
      specialization: 'Architect',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-01-10T00:00:00.000Z')
    },
    {
      _id: ID_USER_MARCUS,
      name: 'Marcus Vance',
      username: 'marcus_design',
      email: 'marcus.vance@studio.com',
      phone: '+1 (555) 345-6789',
      password: DEMO_PASSWORD_HASH,
      role: 'professional',
      specialization: 'Interior Designer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-02-14T00:00:00.000Z')
    },
    {
      _id: ID_USER_LIAM,
      name: 'Liam Walker',
      username: 'liam_builder',
      email: 'liam.walker@buildpro.com',
      phone: '+1 (555) 456-7890',
      password: DEMO_PASSWORD_HASH,
      role: 'professional',
      specialization: 'Builder',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-03-01T00:00:00.000Z')
    },
    {
      _id: ID_USER_SOPHIA,
      name: 'Sophia Taylor',
      username: 'sophia_landscapes',
      email: 'sophia.taylor@landscapes.com',
      phone: '+1 (555) 567-8901',
      password: DEMO_PASSWORD_HASH,
      role: 'professional',
      specialization: 'Landscape Designer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-04-12T00:00:00.000Z')
    },
    {
      _id: ID_USER_ADMIN,
      name: 'Architect Admin',
      username: 'super_admin',
      email: 'admin@floorplan3d.com',
      phone: '+1 (555) 999-0000',
      password: DEMO_PASSWORD_HASH,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    }
  ],

  professionals: [
    {
      _id: ID_PRO_ELENA,
      userId: ID_USER_ELENA,
      name: 'Elena Rostova, AIA',
      username: 'elena_arch',
      email: 'elena.rostova@design.com',
      phone: '+1 (555) 234-5678',
      specialization: 'Architect',
      companyName: 'Rostova Architectural Design',
      licenseNumber: 'AIA-CA-449102',
      experience: '12+ years',
      yearsOfExperience: 12,
      hourlyRate: '₹199 / 30m',
      rating: 4.9,
      reviewsCount: 38,
      availability: 'available',
      location: 'San Francisco, CA',
      description: 'Specializing in contemporary open-concept residential villas, sustainable passive solar homes, and structural CAD drafting.',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      verificationStatus: 'verified',
      verification: {
        status: 'APPROVED',
        rejectionReason: '',
        submittedAt: new Date('2026-01-10T00:00:00.000Z'),
        reviewedAt: new Date('2026-01-11T14:30:00.000Z'),
        reviewedBy: ID_USER_ADMIN
      },
      chatPricing: [
        { durationMinutes: 30, price: 199, label: '30 Minutes' },
        { durationMinutes: 60, price: 349, label: '60 Minutes' }
      ],
      skills: ['AutoCAD', '3D Floor Plans', 'Permit Drawings', 'Modern Residential'],
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      updatedAt: new Date('2026-01-11T14:30:00.000Z')
    },
    {
      _id: ID_PRO_MARCUS,
      userId: ID_USER_MARCUS,
      name: 'Marcus Vance',
      username: 'marcus_design',
      email: 'marcus.vance@studio.com',
      phone: '+1 (555) 345-6789',
      specialization: 'Interior Designer',
      companyName: 'Vance Design Lab',
      licenseNumber: 'ASID-NY-981102',
      experience: '8+ years',
      yearsOfExperience: 8,
      hourlyRate: '₹249 / 30m',
      rating: 4.8,
      reviewsCount: 29,
      availability: 'available',
      location: 'New York, NY',
      description: 'High-end interior architecture, lighting calculations, functional space planning, and premium material selection.',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      verificationStatus: 'verified',
      verification: {
        status: 'APPROVED',
        rejectionReason: '',
        submittedAt: new Date('2026-02-14T00:00:00.000Z'),
        reviewedAt: new Date('2026-02-15T11:00:00.000Z'),
        reviewedBy: ID_USER_ADMIN
      },
      chatPricing: [
        { durationMinutes: 30, price: 249, label: '30 Minutes' },
        { durationMinutes: 60, price: 449, label: '60 Minutes' }
      ],
      skills: ['Interior Architecture', 'Lighting Design', 'Furniture Layout', 'Renderings'],
      createdAt: new Date('2026-02-14T00:00:00.000Z'),
      updatedAt: new Date('2026-02-15T11:00:00.000Z')
    },
    {
      _id: ID_PRO_LIAM,
      userId: ID_USER_LIAM,
      name: 'Liam Walker',
      username: 'liam_builder',
      email: 'liam.walker@buildpro.com',
      phone: '+1 (555) 456-7890',
      specialization: 'Builder',
      companyName: 'BuildPro General Contracting',
      licenseNumber: 'GC-TX-882019',
      experience: '15+ years',
      yearsOfExperience: 15,
      hourlyRate: '₹299 / 30m',
      rating: 5.0,
      reviewsCount: 42,
      availability: 'available',
      location: 'Austin, TX',
      description: 'Turnkey residential home building, cost estimation, foundation engineering, and framing inspection.',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      verificationStatus: 'verified',
      verification: {
        status: 'APPROVED',
        rejectionReason: '',
        submittedAt: new Date('2026-03-01T00:00:00.000Z'),
        reviewedAt: new Date('2026-03-02T15:00:00.000Z'),
        reviewedBy: ID_USER_ADMIN
      },
      chatPricing: [
        { durationMinutes: 30, price: 199, label: '30 Minutes' },
        { durationMinutes: 60, price: 349, label: '60 Minutes' }
      ],
      skills: ['Structural Framing', 'Foundation Plans', 'Cost Estimation', 'Permits'],
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-02T15:00:00.000Z')
    },
    {
      _id: ID_PRO_SOPHIA,
      userId: ID_USER_SOPHIA,
      name: 'Sophia Taylor',
      username: 'sophia_landscapes',
      email: 'sophia.taylor@landscapes.com',
      phone: '+1 (555) 567-8901',
      specialization: 'Landscape Designer',
      companyName: 'Taylor Garden & Exterior Architecture',
      licenseNumber: 'PLA-WA-124982',
      experience: '7+ years',
      yearsOfExperience: 7,
      hourlyRate: '₹179 / 30m',
      rating: 4.7,
      reviewsCount: 19,
      availability: 'available',
      location: 'Seattle, WA',
      description: 'Outdoor architectural flow, deck design, courtyard layouts, xeriscaping, and patio integration.',
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      verificationStatus: 'verified',
      verification: {
        status: 'APPROVED',
        rejectionReason: '',
        submittedAt: new Date('2026-04-12T00:00:00.000Z'),
        reviewedAt: new Date('2026-04-13T10:00:00.000Z'),
        reviewedBy: ID_USER_ADMIN
      },
      chatPricing: [
        { durationMinutes: 30, price: 179, label: '30 Minutes' },
        { durationMinutes: 60, price: 299, label: '60 Minutes' }
      ],
      skills: ['Landscape Architecture', 'Outdoor Living', 'Hardscaping', 'Deck Drafting'],
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-13T10:00:00.000Z')
    }
  ],

  verificationHistory: [
    {
      _id: '65e044444444444444444401',
      professionalId: ID_PRO_ELENA,
      action: 'APPROVED',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      adminId: ID_USER_ADMIN,
      adminName: 'Architect Admin',
      reason: '',
      notes: 'Initial license verified with California Architects Board.',
      timestamp: new Date('2026-01-11T14:30:00.000Z')
    },
    {
      _id: '65e044444444444444444402',
      professionalId: ID_PRO_MARCUS,
      action: 'APPROVED',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      adminId: ID_USER_ADMIN,
      adminName: 'Architect Admin',
      reason: '',
      notes: 'Interior Designer credentials confirmed via NY State Board.',
      timestamp: new Date('2026-02-15T11:00:00.000Z')
    },
    {
      _id: '65e044444444444444444403',
      professionalId: ID_PRO_LIAM,
      action: 'APPROVED',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      adminId: ID_USER_ADMIN,
      adminName: 'Architect Admin',
      reason: '',
      notes: 'Texas General Contractor License valid and active.',
      timestamp: new Date('2026-03-02T15:00:00.000Z')
    },
    {
      _id: '65e044444444444444444404',
      professionalId: ID_PRO_SOPHIA,
      action: 'APPROVED',
      previousStatus: 'PENDING',
      newStatus: 'APPROVED',
      adminId: ID_USER_ADMIN,
      adminName: 'Architect Admin',
      reason: '',
      notes: 'WA Landscape Architect registration confirmed.',
      timestamp: new Date('2026-04-13T10:00:00.000Z')
    }
  ],

  notifications: [
    {
      _id: '65e055555555555555555501',
      recipientId: ID_USER_ELENA,
      recipientRole: 'professional',
      title: 'License Verification Approved',
      message: 'Congratulations! Your professional license has been verified. Your profile is now publicly accessible.',
      type: 'VERIFICATION_APPROVED',
      data: { professionalId: ID_PRO_ELENA },
      isRead: true,
      createdAt: new Date('2026-01-11T14:30:00.000Z')
    }
  ],

  payments: [
    {
      _id: '65e066666666666666666601',
      paymentId: 'TXN-2026-9001',
      gatewayOrderId: 'order_test_9001',
      gatewayPaymentId: 'pay_test_9001',
      gatewaySignature: 'sig_verified_mock_9001',
      userId: ID_USER_ALEX,
      professionalId: ID_PRO_ELENA,
      amount: 209,
      chatFee: 199,
      serviceFee: 10,
      currency: 'INR',
      status: 'SUCCESS',
      chatDuration: 30,
      completedAt: new Date('2026-05-16T14:30:00.000Z'),
      createdAt: new Date('2026-05-16T14:28:00.000Z')
    },
    {
      _id: '65e066666666666666666602',
      paymentId: 'TXN-2026-9002',
      gatewayOrderId: 'order_test_9002',
      gatewayPaymentId: 'pay_test_9002',
      gatewaySignature: 'sig_verified_mock_9002',
      userId: ID_USER_ALEX,
      professionalId: ID_PRO_MARCUS,
      amount: 359,
      chatFee: 349,
      serviceFee: 10,
      currency: 'INR',
      status: 'SUCCESS',
      chatDuration: 60,
      completedAt: new Date('2026-05-18T10:00:00.000Z'),
      createdAt: new Date('2026-05-18T09:58:00.000Z')
    }
  ],

  chatSessions: [],
  chatRequests: [],
  conversations: [],
  messages: [],
  projects: []
};

// Initialize persistent users into memoryStore
try {
  const persisted = loadPersistedUsers();
  if (persisted) {
    persisted.forEach(u => {
      const exists = memoryStore.users.some(item => item.email.toLowerCase() === u.email.toLowerCase());
      if (!exists) {
        memoryStore.users.push(u);
      }
    });
  } else {
    persistUsers();
  }
} catch (err) {
  console.warn('[dataStore] Init users failed:', err.message);
}

// Initialize persistent professionals into memoryStore
try {
  const persistedPros = loadPersistedProfessionals();
  if (persistedPros) {
    persistedPros.forEach(p => {
      const exists = memoryStore.professionals.some(item => String(item._id) === String(p._id) || (item.email && p.email && item.email.toLowerCase() === p.email.toLowerCase()));
      if (!exists) {
        memoryStore.professionals.push(p);
      }
    });
  }

  // Auto-sync any registered user with role === 'professional' (e.g. jes) into memoryStore.professionals
  memoryStore.users.forEach(u => {
    if (u.role === 'professional') {
      const exists = memoryStore.professionals.some(p => String(p.userId) === String(u._id) || (p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase()));
      if (!exists) {
        const newProProfile = {
          _id: new mongoose.Types.ObjectId().toString(),
          userId: u._id,
          name: u.name,
          username: u.username || u.email.split('@')[0],
          email: u.email,
          phone: u.phone || '',
          companyName: u.companyName || `${u.name} Design Studio`,
          licenseNumber: u.licenseNumber || 'LIC-2026-ACTIVE',
          specialization: u.specialization || 'Architect',
          experience: u.yearsOfExperience ? `${u.yearsOfExperience}+ years` : '5+ years',
          yearsOfExperience: u.yearsOfExperience || 5,
          location: u.location || 'Consultant',
          description: u.bio || 'Professional architectural consultations and 3D floor plan drafting.',
          profileImage: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
          availability: 'available',
          verificationStatus: 'verified', // Auto-approved so visible immediately
          verification: {
            status: 'APPROVED',
            rejectionReason: '',
            submittedAt: u.createdAt || new Date(),
            reviewedAt: new Date(),
            reviewedBy: ID_USER_ADMIN
          },
          rating: 5.0,
          reviewsCount: 1,
          hourlyRate: '₹199 / 30m',
          chatPricing: [
            { durationMinutes: 30, price: 199, label: '30 Minutes' },
            { durationMinutes: 60, price: 349, label: '60 Minutes' }
          ],
          skills: [u.specialization || 'Architect', '3D Floor Plans', 'Residential Design'],
          createdAt: u.createdAt || new Date(),
          updatedAt: new Date()
        };
        memoryStore.professionals.push(newProProfile);
      }
    }
  });

  persistProfessionals();

  // Initialize persistent conversations, messages, and chat requests
  const persistedConvs = loadPersistedConversations();
  if (persistedConvs && Array.isArray(persistedConvs)) {
    memoryStore.conversations = persistedConvs;
  }
  const persistedMsgs = loadPersistedMessages();
  if (persistedMsgs && Array.isArray(persistedMsgs)) {
    memoryStore.messages = persistedMsgs;
  }
  const persistedRequests = loadPersistedChatRequests();
  if (persistedRequests && Array.isArray(persistedRequests)) {
    memoryStore.chatRequests = persistedRequests;
  }
  const persistedProjects = loadPersistedProjects();
  if (persistedProjects && Array.isArray(persistedProjects)) {
    memoryStore.projects = persistedProjects;
  }
} catch (err) {
  console.warn('[dataStore] Init professionals/conversations failed:', err.message);
}


// Seed MongoDB if connected
export const seedDatabaseIfEmpty = async () => {
  if (!isDBConnected()) return;
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Seeding MongoDB with initial users, professionals, and payments...');
      await UserModel.insertMany(memoryStore.users);
      await ProfessionalModel.insertMany(memoryStore.professionals);
      await VerificationHistoryModel.insertMany(memoryStore.verificationHistory);
      await NotificationModel.insertMany(memoryStore.notifications);
      await PaymentModel.insertMany(memoryStore.payments);
      console.log('[Seed] MongoDB successfully seeded!');
    } else {
      // Upsert any missing users from persistent store into MongoDB
      for (const u of memoryStore.users) {
        await UserModel.updateOne(
          { email: u.email.toLowerCase() },
          { $setOnInsert: u },
          { upsert: true }
        );
      }
    }
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
};

// Unified Data Access Layer
export const db = {
  // USER OPERATIONS
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    if (isDBConnected()) {
      return await UserModel.findOne({ email: cleanEmail });
    }
    return memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findUserByUsername(username) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    if (isDBConnected()) {
      return await UserModel.findOne({ username: clean });
    }
    return memoryStore.users.find(u => (u.username || '').toLowerCase() === clean) || null;
  },

  async findUserById(id) {
    if (!id) return null;
    if (isDBConnected()) {
      return await UserModel.findById(id);
    }
    return memoryStore.users.find(u => String(u._id) === String(id) || String(u.id) === String(id)) || null;
  },

  async createUser({
    name,
    username = '',
    email,
    phone = '',
    password,
    role = 'user',
    avatar = '',
    specialization = '',
    companyName = '',
    licenseNumber = '',
    yearsOfExperience = 0,
    location = '',
    bio = ''
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const finalEmail = email.trim().toLowerCase();
    const finalUsername = (username || email.split('@')[0]).trim().toLowerCase();
    const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;

    let userDoc = null;
    if (isDBConnected()) {
      try {
        userDoc = await UserModel.create({
          name: name.trim(),
          username: finalUsername,
          email: finalEmail,
          phone: phone.trim(),
          password: hashedPassword,
          role,
          avatar: finalAvatar,
          specialization: specialization || '',
          companyName: companyName || '',
          licenseNumber: licenseNumber || '',
          yearsOfExperience: Number(yearsOfExperience) || 0,
          location: location || '',
          bio: bio || '',
          lastLogin: new Date()
        });
      } catch (err) {
        console.warn('[dataStore] UserModel.create error, using local fallback:', err.message);
      }
    }

    const newUser = userDoc ? userDoc.toObject() : {
      _id: new mongoose.Types.ObjectId().toString(),
      name: name.trim(),
      username: finalUsername,
      email: finalEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role,
      avatar: finalAvatar,
      specialization: specialization || '',
      companyName: companyName || '',
      licenseNumber: licenseNumber || '',
      yearsOfExperience: Number(yearsOfExperience) || 0,
      location: location || '',
      bio: bio || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    const idx = memoryStore.users.findIndex(u => u.email.toLowerCase() === finalEmail);
    if (idx !== -1) {
      memoryStore.users[idx] = newUser;
    } else {
      memoryStore.users.push(newUser);
    }
    persistUsers();

    return userDoc || newUser;
  },

  async updateUser(id, updates) {
    let updated = null;
    if (isDBConnected()) {
      try {
        updated = await UserModel.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {
        console.warn('[dataStore] Mongoose updateUser error:', e.message);
      }
    }
    const idx = memoryStore.users.findIndex(u => String(u._id) === String(id) || String(u.id) === String(id));
    if (idx !== -1) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates, updatedAt: new Date() };
      persistUsers();
      return updated || memoryStore.users[idx];
    }
    return updated;
  },


  // PROFESSIONAL OPERATIONS
  async getProfessionals({ search = '', specialization = '', status, includeUnverified = true } = {}) {
    if (isDBConnected()) {
      const query = {};
      if (specialization && specialization !== 'all') {
        query.specialization = specialization;
      }
      if (status && status !== 'ALL') {
        query.$or = [{ 'verification.status': status }, { verificationStatus: status === 'APPROVED' ? 'verified' : (status === 'PENDING' ? 'pending' : 'unverified') }];
      } else if (!includeUnverified && status === 'APPROVED') {
        query.$or = [{ 'verification.status': 'APPROVED' }, { verificationStatus: 'verified' }];
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        const searchConditions = [
          { name: searchRegex },
          { description: searchRegex },
          { skills: { $in: [new RegExp(search, 'i')] } },
          { companyName: searchRegex },
          { licenseNumber: searchRegex }
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: searchConditions }];
          delete query.$or;
        } else {
          query.$or = searchConditions;
        }
      }
      return await ProfessionalModel.find(query).sort({ rating: -1, createdAt: -1 });
    }

    return memoryStore.professionals.filter(p => {
      const pStatus = p.verification?.status || (p.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING');
      const matchStatus = includeUnverified || status === 'ALL' || !status
        ? true
        : pStatus === status;

      const matchSpec = !specialization || specialization === 'all' || p.specialization?.toLowerCase() === specialization.toLowerCase();
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        p.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        p.licenseNumber?.toLowerCase().includes(search.toLowerCase()) ||
        (p.skills && p.skills.some(s => s.toLowerCase().includes(search.toLowerCase())));

      return matchStatus && matchSpec && matchSearch;
    });
  },

  async getProfessionalById(id) {
    if (isDBConnected()) {
      return await ProfessionalModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { userId: mongoose.isValidObjectId(id) ? id : null }]
      });
    }
    return (
      memoryStore.professionals.find(p => String(p._id) === String(id) || String(p.userId) === String(id)) || null
    );
  },

  async createProfessionalProfile(proData) {
    const defaultVerification = {
      status: 'PENDING',
      rejectionReason: '',
      submittedAt: new Date()
    };

    const finalData = {
      rating: 5.0,
      reviewsCount: 0,
      hourlyRate: '₹199 / 30m',
      availability: 'available',
      verificationStatus: 'pending',
      chatPricing: [
        { durationMinutes: 30, price: 199, label: '30 Minutes' },
        { durationMinutes: 60, price: 349, label: '60 Minutes' }
      ],
      skills: [proData.specialization || 'Architect', '3D Floor Plans'],
      ...proData,
      verification: {
        ...defaultVerification,
        ...(proData.verification || {})
      }
    };

    if (isDBConnected()) {
      const created = await ProfessionalModel.create(finalData);
      // Create initial history entry
      await VerificationHistoryModel.create({
        professionalId: created._id,
        action: 'SUBMITTED',
        previousStatus: 'NONE',
        newStatus: 'PENDING',
        notes: 'Initial professional registration submission.',
        timestamp: new Date()
      });
      return created;
    }

    const newPro = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...finalData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.professionals.push(newPro);
    persistProfessionals();

    memoryStore.verificationHistory.push({
      _id: new mongoose.Types.ObjectId().toString(),
      professionalId: newPro._id,
      action: 'SUBMITTED',
      previousStatus: 'NONE',
      newStatus: 'PENDING',
      notes: 'Initial professional registration submission.',
      timestamp: new Date()
    });

    return newPro;
  },

  async updateProfessionalProfile(userId, updates) {
    if (isDBConnected()) {
      return await ProfessionalModel.findOneAndUpdate({ userId }, updates, { new: true, upsert: true });
    }
    let pro = memoryStore.professionals.find(p => String(p.userId) === String(userId));
    if (pro) {
      Object.assign(pro, updates, { updatedAt: new Date() });
      persistProfessionals();
      return pro;
    }
    const user = memoryStore.users.find(u => String(u._id) === String(userId));
    const newPro = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: user?.name || 'Professional',
      email: user?.email || '',
      specialization: updates.specialization || 'Architect',
      experience: updates.experience || '3+ years',
      description: updates.description || '',
      profileImage: user?.avatar || '',
      availability: updates.availability || 'available',
      verificationStatus: 'verified',
      verification: {
        status: 'APPROVED',
        submittedAt: new Date(),
        reviewedAt: new Date()
      },
      rating: 5.0,
      reviewsCount: 1,
      hourlyRate: updates.hourlyRate || '₹199 / 30m',
      ...updates,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.professionals.push(newPro);
    persistProfessionals();
    return newPro;
  },


  async getVerificationRequests({ status = 'ALL', search = '', sort = 'newest' } = {}) {
    let allPros = [];
    if (isDBConnected()) {
      allPros = await ProfessionalModel.find({}).sort({ createdAt: -1 });
    } else {
      allPros = [...memoryStore.professionals];
    }

    // Compute status counts across all professionals
    const counts = {
      all: allPros.length,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    allPros.forEach(p => {
      const st = (p.verification?.status || (p.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING')).toUpperCase();
      if (st === 'APPROVED') counts.approved++;
      else if (st === 'REJECTED') counts.rejected++;
      else counts.pending++;
    });

    // Filter by tab
    let filtered = allPros.filter(p => {
      const st = (p.verification?.status || (p.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING')).toUpperCase();
      if (status !== 'ALL' && st !== status.toUpperCase()) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const match =
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.companyName?.toLowerCase().includes(q) ||
          p.licenseNumber?.toLowerCase().includes(q) ||
          p.specialization?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'oldest') {
        const tA = new Date(a.verification?.submittedAt || a.createdAt).getTime();
        const tB = new Date(b.verification?.submittedAt || b.createdAt).getTime();
        return tA - tB;
      }
      if (sort === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sort === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      // default: newest
      const tA = new Date(a.verification?.submittedAt || a.createdAt).getTime();
      const tB = new Date(b.verification?.submittedAt || b.createdAt).getTime();
      return tB - tA;
    });

    return { requests: filtered, counts };
  },

  async approveProfessional(proId, adminId, adminName = 'System Admin', notes = '') {
    const now = new Date();
    let updatedPro = null;
    let prevStatus = 'PENDING';

    if (isDBConnected()) {
      const existing = await ProfessionalModel.findById(proId);
      if (!existing) throw new Error('Professional not found');
      prevStatus = existing.verification?.status || 'PENDING';

      existing.verification = {
        ...(existing.verification || {}),
        status: 'APPROVED',
        rejectionReason: '',
        reviewedAt: now,
        reviewedBy: adminId
      };
      existing.verificationStatus = 'verified';
      updatedPro = await existing.save();

      await VerificationHistoryModel.create({
        professionalId: proId,
        action: 'APPROVED',
        previousStatus: prevStatus,
        newStatus: 'APPROVED',
        adminId,
        adminName,
        notes: notes || 'Professional verification approved by administrator.',
        timestamp: now
      });

      await NotificationModel.create({
        recipientId: existing.userId,
        recipientRole: 'professional',
        title: 'License Verification Approved',
        message: 'Congratulations! Your professional license has been verified. Your profile is now publicly listed and active for client consultations.',
        type: 'VERIFICATION_APPROVED',
        data: { professionalId: proId }
      });
    } else {
      const pro = memoryStore.professionals.find(p => String(p._id) === String(proId) || String(p.userId) === String(proId));
      if (!pro) throw new Error('Professional not found');
      prevStatus = pro.verification?.status || 'PENDING';

      pro.verification = {
        ...(pro.verification || {}),
        status: 'APPROVED',
        rejectionReason: '',
        reviewedAt: now,
        reviewedBy: adminId
      };
      pro.verificationStatus = 'verified';
      pro.updatedAt = now;
      updatedPro = pro;

      memoryStore.verificationHistory.push({
        _id: new mongoose.Types.ObjectId().toString(),
        professionalId: pro._id,
        action: 'APPROVED',
        previousStatus: prevStatus,
        newStatus: 'APPROVED',
        adminId,
        adminName,
        notes: notes || 'Professional verification approved by administrator.',
        timestamp: now
      });

      memoryStore.notifications.push({
        _id: new mongoose.Types.ObjectId().toString(),
        recipientId: pro.userId,
        recipientRole: 'professional',
        title: 'License Verification Approved',
        message: 'Congratulations! Your professional license has been verified. Your profile is now publicly listed and active for client consultations.',
        type: 'VERIFICATION_APPROVED',
        data: { professionalId: pro._id },
        isRead: false,
        createdAt: now
      });
    }

    return updatedPro;
  },

  async rejectProfessional(proId, adminId, adminName = 'System Admin', reason, notes = '') {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required.');
    }
    const now = new Date();
    let updatedPro = null;
    let prevStatus = 'PENDING';

    if (isDBConnected()) {
      const existing = await ProfessionalModel.findById(proId);
      if (!existing) throw new Error('Professional not found');
      prevStatus = existing.verification?.status || 'PENDING';

      existing.verification = {
        ...(existing.verification || {}),
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewedAt: now,
        reviewedBy: adminId
      };
      existing.verificationStatus = 'unverified';
      updatedPro = await existing.save();

      await VerificationHistoryModel.create({
        professionalId: proId,
        action: 'REJECTED',
        previousStatus: prevStatus,
        newStatus: 'REJECTED',
        adminId,
        adminName,
        reason: reason.trim(),
        notes: notes || 'Professional verification rejected with feedback.',
        timestamp: now
      });

      await NotificationModel.create({
        recipientId: existing.userId,
        recipientRole: 'professional',
        title: 'License Verification Requires Revision',
        message: `Your professional verification was rejected. Reason: ${reason.trim()}. Please update your information or upload clear documents and resubmit.`,
        type: 'VERIFICATION_REJECTED',
        data: { professionalId: proId, rejectionReason: reason.trim() }
      });
    } else {
      const pro = memoryStore.professionals.find(p => String(p._id) === String(proId) || String(p.userId) === String(proId));
      if (!pro) throw new Error('Professional not found');
      prevStatus = pro.verification?.status || 'PENDING';

      pro.verification = {
        ...(pro.verification || {}),
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewedAt: now,
        reviewedBy: adminId
      };
      pro.verificationStatus = 'unverified';
      pro.updatedAt = now;
      updatedPro = pro;

      memoryStore.verificationHistory.push({
        _id: new mongoose.Types.ObjectId().toString(),
        professionalId: pro._id,
        action: 'REJECTED',
        previousStatus: prevStatus,
        newStatus: 'REJECTED',
        adminId,
        adminName,
        reason: reason.trim(),
        notes: notes || 'Professional verification rejected with feedback.',
        timestamp: now
      });

      memoryStore.notifications.push({
        _id: new mongoose.Types.ObjectId().toString(),
        recipientId: pro.userId,
        recipientRole: 'professional',
        title: 'License Verification Requires Revision',
        message: `Your professional verification was rejected. Reason: ${reason.trim()}. Please update your information or upload clear documents and resubmit.`,
        type: 'VERIFICATION_REJECTED',
        data: { professionalId: pro._id, rejectionReason: reason.trim() },
        isRead: false,
        createdAt: now
      });
    }

    return updatedPro;
  },

  async resubmitProfessionalVerification(proId, updates = {}) {
    const now = new Date();
    let updatedPro = null;

    if (isDBConnected()) {
      const existing = await ProfessionalModel.findById(proId);
      if (!existing) throw new Error('Professional not found');

      // Update fields
      Object.keys(updates).forEach(key => {
        if (key !== 'verification' && key !== '_id' && key !== 'userId') {
          existing[key] = updates[key];
        }
      });

      existing.verification = {
        ...(existing.verification || {}),
        status: 'PENDING',
        rejectionReason: '',
        submittedAt: now
      };
      existing.verificationStatus = 'pending';
      updatedPro = await existing.save();

      await VerificationHistoryModel.create({
        professionalId: proId,
        action: 'RESUBMITTED',
        previousStatus: 'REJECTED',
        newStatus: 'PENDING',
        notes: updates.resubmissionNotes || 'Professional resubmitted updated documents/information for review.',
        timestamp: now
      });

      // Notify admin(s)
      await NotificationModel.create({
        recipientId: ID_USER_ADMIN,
        recipientRole: 'admin',
        title: 'Verification Request Resubmitted',
        message: `Professional ${existing.name} has resubmitted their credentials for license verification.`,
        type: 'VERIFICATION_RESUBMITTED',
        data: { professionalId: proId }
      });
    } else {
      const pro = memoryStore.professionals.find(p => String(p._id) === String(proId) || String(p.userId) === String(proId));
      if (!pro) throw new Error('Professional not found');

      Object.keys(updates).forEach(key => {
        if (key !== 'verification' && key !== '_id' && key !== 'userId') {
          pro[key] = updates[key];
        }
      });

      pro.verification = {
        ...(pro.verification || {}),
        status: 'PENDING',
        rejectionReason: '',
        submittedAt: now
      };
      pro.verificationStatus = 'pending';
      pro.updatedAt = now;
      updatedPro = pro;

      memoryStore.verificationHistory.push({
        _id: new mongoose.Types.ObjectId().toString(),
        professionalId: pro._id,
        action: 'RESUBMITTED',
        previousStatus: 'REJECTED',
        newStatus: 'PENDING',
        notes: updates.resubmissionNotes || 'Professional resubmitted updated documents/information for review.',
        timestamp: now
      });

      memoryStore.notifications.push({
        _id: new mongoose.Types.ObjectId().toString(),
        recipientId: ID_USER_ADMIN,
        recipientRole: 'admin',
        title: 'Verification Request Resubmitted',
        message: `Professional ${pro.name} has resubmitted their credentials for license verification.`,
        type: 'VERIFICATION_RESUBMITTED',
        data: { professionalId: pro._id },
        isRead: false,
        createdAt: now
      });
    }

    return updatedPro;
  },

  async getVerificationHistory(proId) {
    if (isDBConnected()) {
      return await VerificationHistoryModel.find({ professionalId: proId }).sort({ timestamp: -1, createdAt: -1 });
    }
    return memoryStore.verificationHistory
      .filter(h => String(h.professionalId) === String(proId))
      .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  },

  // NOTIFICATION OPERATIONS
  async createNotification({ recipientId, recipientRole = 'user', title, message, type = 'GENERAL', data = {} }) {
    const notif = {
      recipientId,
      recipientRole,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date()
    };

    if (isDBConnected()) {
      return await NotificationModel.create(notif);
    }

    const newNotif = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...notif,
      updatedAt: new Date()
    };
    memoryStore.notifications.push(newNotif);
    return newNotif;
  },

  async getNotificationsForUser(userId, role = 'user') {
    if (isDBConnected()) {
      const query = role === 'admin'
        ? { $or: [{ recipientRole: 'admin' }, { recipientId: userId }] }
        : { recipientId: userId };
      return await NotificationModel.find(query).sort({ createdAt: -1 });
    }

    return memoryStore.notifications
      .filter(n => {
        if (role === 'admin') {
          return n.recipientRole === 'admin' || String(n.recipientId) === String(userId);
        }
        return String(n.recipientId) === String(userId);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markNotificationAsRead(id) {
    const now = new Date();
    if (isDBConnected()) {
      return await NotificationModel.findByIdAndUpdate(id, { isRead: true, readAt: now }, { new: true });
    }
    const n = memoryStore.notifications.find(item => String(item._id) === String(id));
    if (n) {
      n.isRead = true;
      n.readAt = now;
      return n;
    }
    return null;
  },

  async markAllNotificationsAsRead(userId, role = 'user') {
    const now = new Date();
    if (isDBConnected()) {
      const query = role === 'admin'
        ? { $or: [{ recipientRole: 'admin' }, { recipientId: userId }] }
        : { recipientId: userId };
      return await NotificationModel.updateMany(query, { isRead: true, readAt: now });
    }
    memoryStore.notifications.forEach(n => {
      if (role === 'admin' && (n.recipientRole === 'admin' || String(n.recipientId) === String(userId))) {
        n.isRead = true;
        n.readAt = now;
      } else if (String(n.recipientId) === String(userId)) {
        n.isRead = true;
        n.readAt = now;
      }
    });
    return true;
  },

  // PROJECT OPERATIONS
  async getProjectsForUser(userId) {
    if (isDBConnected()) {
      return await ProjectModel.find({
        $or: [
          { userId },
          { 'sharedWith.professionalId': userId },
          { isPublic: true }
        ]
      }).sort({ updatedAt: -1 });
    }
    return memoryStore.projects
      .filter(p => String(p.userId) === String(userId) || (p.sharedWith && p.sharedWith.some(s => String(s.professionalId) === String(userId))) || p.isPublic)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },

  async getProjectById(idOrProjectId) {
    if (!idOrProjectId) return null;
    if (isDBConnected()) {
      let p = await ProjectModel.findOne({ projectId: idOrProjectId });
      if (!p && mongoose.Types.ObjectId.isValid(idOrProjectId)) {
        p = await ProjectModel.findById(idOrProjectId);
      }
      return p;
    }
    return (
      memoryStore.projects.find(
        p => String(p.projectId) === String(idOrProjectId) || String(p._id) === String(idOrProjectId) || String(p.id) === String(idOrProjectId)
      ) || null
    );
  },

  async saveProject(projectData, userId) {
    if (!projectData || !projectData.name) {
      throw new Error('Project name and data are required');
    }

    const projectId = projectData.projectId || projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();

    const normalizedData = {
      projectId,
      userId,
      name: projectData.name.trim(),
      houseType: projectData.houseType || 'Modern House',
      plotWidth: Number(projectData.plotWidth) || 40,
      plotLength: Number(projectData.plotLength) || 30,
      unit: projectData.unit === 'meters' ? 'meters' : 'feet',
      floorsCount: Number(projectData.floorsCount) || 1,
      thumbnail: projectData.thumbnail || '',
      walls: Array.isArray(projectData.walls) ? projectData.walls : [],
      rooms: Array.isArray(projectData.rooms) ? projectData.rooms : [],
      doors: Array.isArray(projectData.doors) ? projectData.doors : [],
      windows: Array.isArray(projectData.windows) ? projectData.windows : [],
      furniture: Array.isArray(projectData.furniture) ? projectData.furniture : [],
      floorsData: Array.isArray(projectData.floorsData) ? projectData.floorsData : [],
      blueprintOverlay: projectData.blueprintOverlay || null,
      buildingDetails: projectData.buildingDetails || {},
      conversionData: projectData.conversionData || {},
      cameraSettings: projectData.cameraSettings || {},
      gridSettings: projectData.gridSettings || {},
      sharedWith: Array.isArray(projectData.sharedWith) ? projectData.sharedWith : [],
      isPublic: Boolean(projectData.isPublic),
      updatedAt: now
    };

    let saved = null;
    if (isDBConnected()) {
      try {
        saved = await ProjectModel.findOneAndUpdate(
          { projectId },
          { $set: normalizedData, $setOnInsert: { createdAt: projectData.createdAt ? new Date(projectData.createdAt) : now } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('[dataStore] Mongo saveProject warning:', err.message);
      }
    }

    const existingIdx = memoryStore.projects.findIndex(
      p => String(p.projectId) === String(projectId) || (projectData.id && String(p.id) === String(projectData.id))
    );

    const memoryItem = {
      _id: saved?._id ? String(saved._id) : (existingIdx !== -1 ? memoryStore.projects[existingIdx]._id : new mongoose.Types.ObjectId().toString()),
      id: projectId,
      createdAt: existingIdx !== -1 && memoryStore.projects[existingIdx].createdAt ? memoryStore.projects[existingIdx].createdAt : (projectData.createdAt || now.toISOString()),
      ...normalizedData
    };

    if (existingIdx !== -1) {
      memoryStore.projects[existingIdx] = { ...memoryStore.projects[existingIdx], ...memoryItem };
    } else {
      memoryStore.projects.unshift(memoryItem);
    }
    persistProjects();

    return saved || memoryItem;
  },

  async renameProject(idOrProjectId, newName, userId) {
    if (!newName || !newName.trim()) throw new Error('New project name is required');
    const project = await this.getProjectById(idOrProjectId);
    if (!project) throw new Error('Project not found');

    if (isDBConnected()) {
      return await ProjectModel.findOneAndUpdate(
        { $or: [{ projectId: idOrProjectId }, { _id: idOrProjectId }] },
        { name: newName.trim(), updatedAt: new Date() },
        { new: true }
      );
    }

    project.name = newName.trim();
    project.updatedAt = new Date().toISOString();
    persistProjects();
    return project;
  },

  async cloneProject(idOrProjectId, newName, userId) {
    const original = await this.getProjectById(idOrProjectId);
    if (!original) throw new Error('Source project not found');

    const cloneData = {
      ...JSON.parse(JSON.stringify(original)),
      projectId: `proj_${Date.now()}_copy`,
      name: (newName && newName.trim()) || `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete cloneData._id;

    return await this.saveProject(cloneData, userId);
  },

  async deleteProject(idOrProjectId, userId) {
    if (isDBConnected()) {
      await ProjectModel.findOneAndDelete({
        $or: [{ projectId: idOrProjectId }, { _id: idOrProjectId }]
      });
    }
    const idx = memoryStore.projects.findIndex(
      p => String(p.projectId) === String(idOrProjectId) || String(p._id) === String(idOrProjectId) || String(p.id) === String(idOrProjectId)
    );
    if (idx !== -1) {
      memoryStore.projects.splice(idx, 1);
      persistProjects();
    }
    return { success: true, message: 'Project deleted successfully' };
  },

  async shareProjectWithProfessional(idOrProjectId, userId, { professionalId, files = [], format = 'pdf', message = '', allowEdit = false }) {
    if (!professionalId) throw new Error('Target professional ID is required');

    // Verify professional exists and is verified
    const pro = await this.getProfessionalById(professionalId);
    if (!pro) throw new Error('Professional not found');

    const isVerified = (pro.verification?.status === 'APPROVED') || (pro.verificationStatus === 'verified');
    if (!isVerified) {
      throw new Error('Only approved and verified professionals can receive project shares.');
    }

    const project = await this.getProjectById(idOrProjectId);
    if (!project) throw new Error('Project not found');

    const shareEntry = {
      professionalId: pro.userId || pro._id,
      permission: allowEdit ? 'edit' : 'view',
      sharedAt: new Date(),
      format,
      files,
      message: message.trim()
    };

    if (isDBConnected()) {
      await ProjectModel.findOneAndUpdate(
        { $or: [{ projectId: idOrProjectId }, { _id: idOrProjectId }] },
        { $push: { sharedWith: shareEntry }, updatedAt: new Date() }
      );
    }

    if (project.sharedWith) {
      project.sharedWith.push(shareEntry);
    } else {
      project.sharedWith = [shareEntry];
    }
    project.updatedAt = new Date().toISOString();
    persistProjects();

    // Create a real-time Notification for the professional
    const targetUserId = pro.userId ? String(pro.userId) : String(pro._id);
    const userSender = await this.findUserById(userId);
    const senderName = userSender?.name || 'A Client';

    const notif = await this.createNotification({
      recipientId: targetUserId,
      recipientRole: 'professional',
      title: 'New Floor Plan Project Shared',
      message: `${senderName} shared "${project.name}" (${format.toUpperCase()}) for your review${message ? `: "${message}"` : '.'}`,
      type: 'PROJECT_SHARED',
      data: {
        projectId: project.projectId || project.id,
        projectName: project.name,
        format,
        filesCount: files.length,
        allowEdit,
        senderId: userId
      }
    });

    // Also auto-create or add a chat request entry so the professional sees it in their Requests / Inbox
    try {
      const existingReq = await this.findExistingPendingRequest(userId, targetUserId);
      if (!existingReq) {
        await this.createChatRequest({
          senderId: userId,
          receiverId: targetUserId,
          message: message || `I've shared my floor plan project "${project.name}" (${format.toUpperCase()}) with you for professional consultation.`,
          projectId: project.projectId || project.id,
          projectSnapshot: {
            id: project.projectId || project.id,
            name: project.name,
            houseType: project.houseType,
            plotWidth: project.plotWidth,
            plotLength: project.plotLength,
            unit: project.unit,
            thumbnail: project.thumbnail || (files[0]?.dataUrl) || '',
            roomsCount: project.rooms?.length || 0,
            sharedFiles: files,
            format,
            allowEdit
          }
        });
      }
    } catch (e) {
      console.warn('[shareProject] Chat request auto-attach skipped:', e.message);
    }

    return { success: true, message: `Project successfully shared with ${pro.name}`, shareEntry, notification: notif };
  },

  // CHAT REQUEST OPERATIONS
  async findChatRequestsForUser(userId) {
    const matchedIds = [String(userId)];
    const pro = await this.getProfessionalById(userId);
    if (pro) {
      if (pro._id && !matchedIds.includes(String(pro._id))) matchedIds.push(String(pro._id));
      if (pro.userId && !matchedIds.includes(String(pro.userId))) matchedIds.push(String(pro.userId));
    }

    if (isDBConnected()) {
      return await ChatRequestModel.find({
        $or: [{ senderId: { $in: matchedIds } }, { receiverId: { $in: matchedIds } }]
      })
        .populate('senderId', 'name email avatar role')
        .populate('receiverId', 'name email avatar role specialization')
        .sort({ createdAt: -1 });
    }

    return memoryStore.chatRequests
      .filter(r => matchedIds.includes(String(r.senderId)) || matchedIds.includes(String(r.receiverId)))
      .map(r => {
        const sender = memoryStore.users.find(u => String(u._id) === String(r.senderId));
        const receiver = memoryStore.users.find(u => String(u._id) === String(r.receiverId));
        return {
          ...r,
          senderId: sender || { _id: r.senderId, name: 'User', role: 'user' },
          receiverId: receiver || { _id: r.receiverId, name: 'Professional', role: 'professional' }
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findExistingPendingRequest(senderId, receiverId) {
    if (isDBConnected()) {
      return await ChatRequestModel.findOne({
        senderId,
        receiverId,
        status: 'pending'
      });
    }
    return (
      memoryStore.chatRequests.find(
        r => String(r.senderId) === String(senderId) && String(r.receiverId) === String(receiverId) && r.status === 'pending'
      ) || null
    );
  },

  async createChatRequest({ senderId, receiverId, message, projectId = null, projectSnapshot = null }) {
    if (isDBConnected()) {
      return await ChatRequestModel.create({
        senderId,
        receiverId,
        message,
        projectId,
        projectSnapshot,
        status: 'pending'
      });
    }

    const newRequest = {
      _id: new mongoose.Types.ObjectId().toString(),
      senderId,
      receiverId,
      message,
      projectId,
      projectSnapshot,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.chatRequests.push(newRequest);
    return newRequest;
  },

  async updateChatRequestStatus(requestId, status) {
    if (isDBConnected()) {
      return await ChatRequestModel.findByIdAndUpdate(requestId, { status }, { new: true });
    }
    const req = memoryStore.chatRequests.find(r => String(r._id) === String(requestId));
    if (req) {
      req.status = status;
      req.updatedAt = new Date();
      return req;
    }
    return null;
  },

  // ==========================================
  // CANONICAL ID & PROFILE RESOLUTION
  // ==========================================
  resolveCanonicalUserId(idOrProId) {
    if (!idOrProId) return null;
    const str = String(typeof idOrProId === 'object' ? (idOrProId._id || idOrProId.id || idOrProId.userId) : idOrProId).trim();
    if (!str) return null;

    // 1. Direct user match in memoryStore
    const user = memoryStore.users.find(u => String(u._id) === str || String(u.id) === str);
    if (user) {
      return String(user._id || user.id);
    }

    // 2. Professional match in memoryStore (resolving to their user._id)
    const pro = memoryStore.professionals.find(p => String(p._id) === str || String(p.id) === str || String(p.userId) === str);
    if (pro) {
      const proUser = typeof pro.userId === 'object' ? pro.userId : memoryStore.users.find(u => String(u._id) === String(pro.userId));
      if (proUser) return String(proUser._id || proUser.id);
      return String(pro.userId || pro._id);
    }

    return str;
  },

  getUserOrProProfile(idOrProId) {
    if (!idOrProId) return null;
    const rawId = typeof idOrProId === 'object' ? (idOrProId._id || idOrProId.id) : idOrProId;
    const canonicalId = this.resolveCanonicalUserId(rawId);

    const user = memoryStore.users.find(u => String(u._id) === String(canonicalId) || String(u.id) === String(canonicalId));
    const pro = memoryStore.professionals.find(p =>
      String(p.userId) === String(canonicalId) ||
      String(p._id) === String(rawId) ||
      String(p.id) === String(rawId)
    );

    if (user) {
      return {
        _id: String(user._id || user.id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || pro?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
        role: user.role,
        specialization: pro?.specialization || user.specialization,
        companyName: pro?.companyName || user.companyName,
        professionalId: pro ? String(pro._id || pro.id) : undefined
      };
    }

    if (pro) {
      return {
        _id: String(pro.userId || pro._id),
        name: pro.name,
        email: pro.email,
        avatar: pro.profileImage || pro.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pro.name)}`,
        role: 'professional',
        specialization: pro.specialization,
        companyName: pro.companyName,
        professionalId: String(pro._id || pro.id)
      };
    }

    return {
      _id: String(canonicalId),
      name: 'User',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(canonicalId))}`,
      role: 'user'
    };
  },

  // CONVERSATION OPERATIONS
  async findConversationsForUser(userId) {
    const canonicalUid = this.resolveCanonicalUserId(userId);
    if (!canonicalUid) return [];

    const pro = await this.getProfessionalById(canonicalUid);
    const matchedIds = [String(canonicalUid)];
    if (pro?._id && !matchedIds.includes(String(pro._id))) matchedIds.push(String(pro._id));
    if (pro?.userId && !matchedIds.includes(String(pro.userId))) matchedIds.push(String(pro.userId));

    if (isDBConnected()) {
      return await ConversationModel.find({ participants: { $in: matchedIds } })
        .populate('participants', 'name email avatar role specialization')
        .sort({ lastMessageAt: -1 });
    }

    return memoryStore.conversations
      .filter(c => {
        const pIds = c.participants.map(p => this.resolveCanonicalUserId(typeof p === 'object' ? (p._id || p.id) : p));
        return pIds.includes(canonicalUid) || c.participants.some(p => matchedIds.includes(String(typeof p === 'object' ? (p._id || p.id) : p)));
      })
      .map(c => {
        const fullParticipants = c.participants.map(pId => this.getUserOrProProfile(pId));
        return { ...c, participants: fullParticipants };
      })
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  },

  async findConversationById(id) {
    if (!id) return null;
    if (isDBConnected()) {
      return await ConversationModel.findById(id).populate('participants', 'name email avatar role specialization');
    }
    const conv = memoryStore.conversations.find(c => String(c._id) === String(id));
    if (!conv) return null;
    const fullParticipants = conv.participants.map(pId => this.getUserOrProProfile(pId));
    return { ...conv, participants: fullParticipants };
  },

  async findConversationBetween(user1Id, user2Id) {
    if (!user1Id || !user2Id) return null;
    const c1 = this.resolveCanonicalUserId(user1Id);
    const c2 = this.resolveCanonicalUserId(user2Id);
    if (!c1 || !c2 || c1 === c2) return null;

    const pro1 = await this.getProfessionalById(c1);
    const pro2 = await this.getProfessionalById(c2);

    const ids1 = [c1, String(user1Id)];
    if (pro1?._id) ids1.push(String(pro1._id));
    if (pro1?.userId) ids1.push(String(pro1.userId));

    const ids2 = [c2, String(user2Id)];
    if (pro2?._id) ids2.push(String(pro2._id));
    if (pro2?.userId) ids2.push(String(pro2.userId));

    if (isDBConnected()) {
      return await ConversationModel.findOne({
        $and: [
          { participants: { $in: ids1 } },
          { participants: { $in: ids2 } }
        ]
      }).populate('participants', 'name email avatar role specialization');
    }

    const found = memoryStore.conversations.find(c => {
      const pIds = c.participants.map(p => String(typeof p === 'object' ? (p._id || p.id) : p));
      const has1 = pIds.some(id => ids1.includes(id));
      const has2 = pIds.some(id => ids2.includes(id));
      return has1 && has2;
    });

    if (!found) return null;
    return this.findConversationById(found._id);
  },

  async createConversation({ participants, projectId = null, lastMessage = '' }) {
    if (!Array.isArray(participants) || participants.length < 2) {
      throw new Error('A conversation must have at least two participants.');
    }

    // Resolve every participant to their canonical User ID
    const canonicalParticipants = Array.from(
      new Set(
        participants.map(p => this.resolveCanonicalUserId(typeof p === 'object' ? (p._id || p.id) : p)).filter(Boolean)
      )
    );

    if (canonicalParticipants.length < 2) {
      throw new Error('A conversation must be between two distinct participants.');
    }

    const [u1, u2] = canonicalParticipants;
    const existing = await this.findConversationBetween(u1, u2);
    if (existing) {
      return existing;
    }

    if (isDBConnected()) {
      const created = await ConversationModel.create({
        participants: canonicalParticipants,
        projectId,
        lastMessage,
        lastMessageAt: new Date()
      });
      return await ConversationModel.findById(created._id).populate('participants', 'name email avatar role specialization');
    }

    const newConv = {
      _id: new mongoose.Types.ObjectId().toString(),
      participants: canonicalParticipants,
      projectId,
      lastMessage,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.conversations.push(newConv);
    persistConversations();

    return this.findConversationById(newConv._id);
  },

  async updateConversationLastMessage(convId, lastMessage) {
    const now = new Date();
    if (isDBConnected()) {
      return await ConversationModel.findByIdAndUpdate(convId, { lastMessage, lastMessageAt: now }, { new: true });
    }
    const conv = memoryStore.conversations.find(c => String(c._id) === String(convId));
    if (conv) {
      conv.lastMessage = lastMessage;
      conv.lastMessageAt = now;
      persistConversations();
      return conv;
    }
    return null;
  },

  // MESSAGE OPERATIONS
  async getMessages(conversationId) {
    if (isDBConnected()) {
      return await MessageModel.find({ conversationId })
        .populate('senderId', 'name avatar role')
        .sort({ createdAt: 1 });
    }

    return memoryStore.messages
      .filter(m => String(m.conversationId) === String(conversationId))
      .map(m => {
        const senderProfile = this.getUserOrProProfile(m.senderId);
        return {
          ...m,
          senderId: {
            _id: senderProfile._id,
            name: senderProfile.name,
            avatar: senderProfile.avatar,
            role: senderProfile.role
          }
        };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async createMessage({ conversationId, senderId, receiverId, message, messageType = 'text', sharedProject = null }) {
    const canonicalSender = this.resolveCanonicalUserId(senderId);
    let canonicalReceiver = this.resolveCanonicalUserId(receiverId);

    const conv = await this.findConversationById(conversationId);
    if (!conv) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // If receiverId was not provided or matches sender, pick the other participant
    if (!canonicalReceiver || canonicalReceiver === canonicalSender) {
      const otherPart = conv.participants.find(p => {
        const pid = this.resolveCanonicalUserId(typeof p === 'object' ? (p._id || p.id) : p);
        return pid !== canonicalSender;
      });
      canonicalReceiver = otherPart ? this.resolveCanonicalUserId(typeof otherPart === 'object' ? (otherPart._id || otherPart.id) : otherPart) : null;
    }

    if (!canonicalReceiver) {
      throw new Error('Unable to determine message recipient.');
    }

    if (canonicalSender === canonicalReceiver) {
      throw new Error('Cannot send a message to yourself.');
    }

    if (isDBConnected()) {
      const newMsg = await MessageModel.create({
        conversationId,
        senderId: canonicalSender,
        receiverId: canonicalReceiver,
        message,
        messageType,
        sharedProject,
        readStatus: false
      });
      return await MessageModel.findById(newMsg._id).populate('senderId', 'name avatar role');
    }

    const newMsg = {
      _id: new mongoose.Types.ObjectId().toString(),
      conversationId,
      senderId: canonicalSender,
      receiverId: canonicalReceiver,
      message,
      messageType,
      sharedProject,
      readStatus: false,
      createdAt: new Date()
    };
    memoryStore.messages.push(newMsg);
    persistMessages();

    const senderProfile = this.getUserOrProProfile(canonicalSender);
    return {
      ...newMsg,
      senderId: {
        _id: senderProfile._id,
        name: senderProfile.name,
        avatar: senderProfile.avatar,
        role: senderProfile.role
      }
    };
  },

  async markMessageAsRead(messageId) {
    if (isDBConnected()) {
      return await MessageModel.findByIdAndUpdate(messageId, { readStatus: true }, { new: true });
    }
    const msg = memoryStore.messages.find(m => String(m._id) === String(messageId));
    if (msg) {
      msg.readStatus = true;
      return msg;
    }
    return null;
  },

  async markAllMessagesInConversationAsRead(conversationId, currentUserId) {
    if (isDBConnected()) {
      return await MessageModel.updateMany(
        { conversationId, receiverId: currentUserId, readStatus: false },
        { readStatus: true }
      );
    }
    memoryStore.messages.forEach(m => {
      if (String(m.conversationId) === String(conversationId) && String(m.receiverId) === String(currentUserId)) {
        m.readStatus = true;
      }
    });
  },

  // PROJECT OPERATIONS
  async getProjectById(projectId) {
    if (isDBConnected()) {
      return await ProjectModel.findOne({ projectId });
    }
    return memoryStore.projects.find(p => p.projectId === projectId || p.id === projectId) || null;
  },

  async saveProject(projectData, userId) {
    if (isDBConnected()) {
      return await ProjectModel.findOneAndUpdate(
        { projectId: projectData.id || projectData.projectId },
        { ...projectData, userId, projectId: projectData.id || projectData.projectId },
        { upsert: true, new: true }
      );
    }
    const id = projectData.id || projectData.projectId;
    const existingIdx = memoryStore.projects.findIndex(p => p.projectId === id || p.id === id);
    const saved = { ...projectData, userId, projectId: id, updatedAt: new Date() };
    if (existingIdx !== -1) {
      memoryStore.projects[existingIdx] = saved;
    } else {
      memoryStore.projects.push(saved);
    }
    return saved;
  },

  // PAYMENT OPERATIONS
  async createPayment({
    paymentId,
    gatewayOrderId = '',
    gatewayPaymentId = '',
    gatewaySignature = '',
    userId,
    professionalId,
    chatSessionId = null,
    amount,
    chatFee,
    serviceFee = 10,
    currency = 'INR',
    status = 'CREATED',
    chatDuration = 30,
    paymentMethod = 'CARD',
    cardBrand = '',
    cardLast4 = '',
    cardholderName = '',
    authCode = ''
  }) {
    const paymentData = {
      paymentId: paymentId || `TXN-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      userId,
      professionalId,
      chatSessionId,
      amount: Number(amount),
      chatFee: Number(chatFee),
      serviceFee: Number(serviceFee),
      currency,
      status,
      chatDuration: Number(chatDuration),
      paymentMethod,
      cardBrand,
      cardLast4,
      cardholderName,
      authCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDBConnected()) {
      return await PaymentModel.create(paymentData);
    }

    const newPayment = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...paymentData
    };
    memoryStore.payments.push(newPayment);
    return newPayment;
  },

  async getPaymentById(id) {
    if (isDBConnected()) {
      return await PaymentModel.findOne({
        $or: [{ paymentId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }]
      })
        .populate('userId', 'name email phone avatar')
        .populate('professionalId', 'name specialization profileImage hourlyRate licenseNumber companyName');
    }
    const p = memoryStore.payments.find(item => item.paymentId === id || String(item._id) === String(id));
    if (!p) return null;
    const u = memoryStore.users.find(item => String(item._id) === String(p.userId));
    const pr = memoryStore.professionals.find(item => String(item._id) === String(p.professionalId));
    return {
      ...p,
      userId: u ? { _id: u._id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar } : { _id: p.userId, name: 'User' },
      professionalId: pr ? { _id: pr._id, name: pr.name, specialization: pr.specialization, profileImage: pr.profileImage, licenseNumber: pr.licenseNumber, companyName: pr.companyName } : { _id: p.professionalId, name: 'Professional' }
    };
  },

  async getPaymentByGatewayOrderId(orderId) {
    if (!orderId) return null;
    if (isDBConnected()) {
      return await PaymentModel.findOne({ gatewayOrderId: orderId });
    }
    return memoryStore.payments.find(p => p.gatewayOrderId === orderId) || null;
  },

  async updatePaymentStatus(paymentId, status, details = {}) {
    const now = new Date();
    const updates = {
      status,
      updatedAt: now,
      ...details
    };
    if (status === 'SUCCESS' && !updates.completedAt) {
      updates.completedAt = now;
    }

    if (isDBConnected()) {
      return await PaymentModel.findOneAndUpdate(
        { $or: [{ paymentId }, { _id: mongoose.isValidObjectId(paymentId) ? paymentId : null }, { gatewayOrderId: paymentId }] },
        updates,
        { new: true }
      );
    }

    const p = memoryStore.payments.find(
      item => item.paymentId === paymentId || String(item._id) === String(paymentId) || item.gatewayOrderId === paymentId
    );
    if (p) {
      Object.assign(p, updates);
      return p;
    }
    return null;
  },

  async getPaymentsForUser(userId) {
    if (isDBConnected()) {
      return await PaymentModel.find({ userId })
        .populate('professionalId', 'name specialization profileImage location companyName')
        .populate('chatSessionId')
        .sort({ createdAt: -1 });
    }

    return memoryStore.payments
      .filter(p => String(p.userId) === String(userId))
      .map(p => {
        const pr = memoryStore.professionals.find(item => String(item._id) === String(p.professionalId));
        const cs = memoryStore.chatSessions.find(item => String(item._id) === String(p.chatSessionId));
        return {
          ...p,
          professionalId: pr ? { _id: pr._id, name: pr.name, specialization: pr.specialization, profileImage: pr.profileImage, location: pr.location, companyName: pr.companyName } : { _id: p.professionalId, name: 'Professional' },
          chatSessionId: cs || null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getPaymentsForProfessional(proId) {
    if (isDBConnected()) {
      return await PaymentModel.find({ professionalId: proId })
        .populate('userId', 'name email phone avatar')
        .populate('chatSessionId')
        .sort({ createdAt: -1 });
    }

    return memoryStore.payments
      .filter(p => String(p.professionalId) === String(proId))
      .map(p => {
        const u = memoryStore.users.find(item => String(item._id) === String(p.userId));
        const cs = memoryStore.chatSessions.find(item => String(item._id) === String(p.chatSessionId));
        return {
          ...p,
          userId: u ? { _id: u._id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar } : { _id: p.userId, name: 'User' },
          chatSessionId: cs || null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getAllPayments({ status = 'ALL', search = '', limit = 100, offset = 0 } = {}) {
    let payments = [];
    if (isDBConnected()) {
      const query = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }
      payments = await PaymentModel.find(query)
        .populate('userId', 'name email avatar phone')
        .populate('professionalId', 'name specialization profileImage companyName')
        .populate('chatSessionId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
    } else {
      payments = memoryStore.payments
        .filter(p => (status === 'ALL' || !status ? true : p.status === status))
        .map(p => {
          const u = memoryStore.users.find(item => String(item._id) === String(p.userId));
          const pr = memoryStore.professionals.find(item => String(item._id) === String(p.professionalId));
          const cs = memoryStore.chatSessions.find(item => String(item._id) === String(p.chatSessionId));
          return {
            ...p,
            userId: u ? { _id: u._id, name: u.name, email: u.email, avatar: u.avatar, phone: u.phone } : { _id: p.userId, name: 'User' },
            professionalId: pr ? { _id: pr._id, name: pr.name, specialization: pr.specialization, profileImage: pr.profileImage, companyName: pr.companyName } : { _id: p.professionalId, name: 'Professional' },
            chatSessionId: cs || null
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(p => {
        const uName = typeof p.userId === 'object' ? p.userId?.name?.toLowerCase() : '';
        const prName = typeof p.professionalId === 'object' ? p.professionalId?.name?.toLowerCase() : '';
        const pid = p.paymentId?.toLowerCase() || '';
        const gpid = p.gatewayPaymentId?.toLowerCase() || '';
        return uName.includes(q) || prName.includes(q) || pid.includes(q) || gpid.includes(q);
      });
    }

    return payments;
  },

  async getProfessionalEarnings(proId) {
    const payments = await this.getPaymentsForProfessional(proId);
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let successfulCount = 0;
    let completedCount = 0;

    payments.forEach(p => {
      if (p.status === 'SUCCESS') {
        successfulCount++;
        totalEarnings += p.chatFee || (p.amount - (p.serviceFee || 0));
        if (p.chatSessionId?.sessionStatus === 'COMPLETED' || p.chatSessionId?.sessionStatus === 'EXPIRED') {
          completedCount++;
        }
      } else if (p.status === 'PENDING' || p.status === 'CREATED') {
        pendingEarnings += p.chatFee || (p.amount - (p.serviceFee || 0));
      }
    });

    return {
      totalChats: payments.length,
      completedChats: completedCount,
      successfulPayments: successfulCount,
      totalEarnings,
      pendingEarnings,
      recentTransactions: payments.slice(0, 10)
    };
  },

  async getAdminPaymentSummary() {
    let allPayments = [];
    if (isDBConnected()) {
      allPayments = await PaymentModel.find({});
    } else {
      allPayments = [...memoryStore.payments];
    }

    let successful = 0;
    let failed = 0;
    let pending = 0;
    let refunded = 0;
    let totalRevenue = 0;

    allPayments.forEach(p => {
      if (p.status === 'SUCCESS') {
        successful++;
        totalRevenue += p.amount || 0;
      } else if (p.status === 'FAILED') {
        failed++;
      } else if (p.status === 'REFUNDED') {
        refunded++;
      } else {
        pending++;
      }
    });

    // Active paid chats
    const now = new Date();
    let activeChats = 0;
    if (isDBConnected()) {
      activeChats = await ChatSessionModel.countDocuments({
        sessionStatus: 'ACTIVE',
        endTime: { $gt: now }
      });
    } else {
      activeChats = memoryStore.chatSessions.filter(
        s => s.sessionStatus === 'ACTIVE' && new Date(s.endTime) > now
      ).length;
    }

    return {
      totalPayments: allPayments.length,
      successful,
      successfulPayments: successful,
      failed,
      failedPayments: failed,
      pending,
      refunded,
      refundedPayments: refunded,
      chatRevenue: totalRevenue,
      totalRevenue,
      activeChats,
      activeChatSessions: activeChats
    };
  },

  async processAdminRefund(paymentId, reason = 'Administrative cancellation and refund') {
    const now = new Date();
    const refundId = `RFND-${Date.now()}-${Math.round(Math.random() * 1e4)}`;

    const p = await this.getPaymentById(paymentId);
    if (!p) throw new Error('Payment transaction not found.');
    if (p.status === 'REFUNDED') throw new Error('Payment has already been refunded.');

    const refundDetails = {
      refundId,
      amount: p.amount,
      reason,
      refundedAt: now
    };

    const updatedPayment = await this.updatePaymentStatus(p.paymentId || p._id, 'REFUNDED', { refundDetails });

    // Cancel active chat session if linked
    if (p.chatSessionId) {
      const sessId = typeof p.chatSessionId === 'object' ? p.chatSessionId._id : p.chatSessionId;
      await this.endChatSession(sessId, 'admin-refund');
    }

    // Notifications
    const uId = typeof p.userId === 'object' ? p.userId._id : p.userId;
    const prId = typeof p.professionalId === 'object' ? p.professionalId._id : p.professionalId;

    await this.createNotification({
      recipientId: uId,
      recipientRole: 'user',
      title: 'Payment Refunded',
      message: `Your payment of ₹${p.amount} for chat consultation (ID: ${p.paymentId}) has been refunded. Reason: ${reason}`,
      type: 'GENERAL',
      data: { paymentId: p.paymentId, refundId }
    });

    return updatedPayment;
  },

  // CHAT SESSION OPERATIONS
  async createChatSession({
    userId,
    professionalId,
    paymentId,
    conversationId,
    durationMinutes = 30,
    startTime = new Date(),
    endTime = null,
    sessionStatus = 'ACTIVE'
  }) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMinutes * 60 * 1000);

    const sessionData = {
      userId,
      professionalId,
      paymentId,
      conversationId,
      durationMinutes: Number(durationMinutes),
      startTime: start,
      endTime: end,
      sessionStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let session = null;
    if (isDBConnected()) {
      session = await ChatSessionModel.create(sessionData);
      await PaymentModel.findByIdAndUpdate(paymentId, { chatSessionId: session._id });
    } else {
      session = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...sessionData
      };
      memoryStore.chatSessions.push(session);
      const pay = memoryStore.payments.find(item => String(item._id) === String(paymentId) || item.paymentId === paymentId);
      if (pay) pay.chatSessionId = session._id;
    }

    return session;
  },

  async getActiveChatSession(userId, professionalId) {
    const now = new Date();
    if (isDBConnected()) {
      return await ChatSessionModel.findOne({
        userId,
        professionalId,
        sessionStatus: 'ACTIVE',
        endTime: { $gt: now }
      })
        .populate('paymentId')
        .populate('conversationId');
    }

    return (
      memoryStore.chatSessions.find(
        s =>
          String(s.userId) === String(userId) &&
          String(s.professionalId) === String(professionalId) &&
          s.sessionStatus === 'ACTIVE' &&
          new Date(s.endTime) > now
      ) || null
    );
  },

  async getChatSessionForConversation(conversationId) {
    const now = new Date();
    if (isDBConnected()) {
      return await ChatSessionModel.findOne({ conversationId })
        .populate('paymentId')
        .sort({ createdAt: -1 });
    }

    const sessions = memoryStore.chatSessions
      .filter(s => String(s.conversationId) === String(conversationId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sessions[0] || null;
  },

  async getChatSessionById(sessionId) {
    if (isDBConnected()) {
      return await ChatSessionModel.findById(sessionId)
        .populate('paymentId')
        .populate('userId', 'name email avatar')
        .populate('professionalId', 'name specialization profileImage');
    }
    return memoryStore.chatSessions.find(s => String(s._id) === String(sessionId)) || null;
  },

  async endChatSession(sessionId, endedBy = 'user') {
    const now = new Date();
    if (isDBConnected()) {
      return await ChatSessionModel.findByIdAndUpdate(
        sessionId,
        { sessionStatus: 'COMPLETED', endedBy, endedAt: now },
        { new: true }
      );
    }
    const s = memoryStore.chatSessions.find(item => String(item._id) === String(sessionId));
    if (s) {
      s.sessionStatus = 'COMPLETED';
      s.endedBy = endedBy;
      s.endedAt = now;
      s.updatedAt = now;
      return s;
    }
    return null;
  },

  async updateExpiredSessions() {
    const now = new Date();
    if (isDBConnected()) {
      return await ChatSessionModel.updateMany(
        { sessionStatus: 'ACTIVE', endTime: { $lte: now } },
        { sessionStatus: 'EXPIRED', endedBy: 'timeout', endedAt: now }
      );
    }
    memoryStore.chatSessions.forEach(s => {
      if (s.sessionStatus === 'ACTIVE' && new Date(s.endTime) <= now) {
        s.sessionStatus = 'EXPIRED';
        s.endedBy = 'timeout';
        s.endedAt = now;
      }
    });
    return true;
  },

  // PROFESSIONAL CHAT PRICING
  async updateProfessionalChatPricing(proId, chatPricing) {
    if (!Array.isArray(chatPricing) || chatPricing.length === 0) {
      throw new Error('Chat pricing plans must be a non-empty array.');
    }

    // Validate pricing values
    const cleanedPricing = chatPricing.map(tier => ({
      durationMinutes: Math.max(5, Number(tier.durationMinutes) || 30),
      price: Math.max(0, Number(tier.price) || 199),
      label: tier.label || `${tier.durationMinutes} Minutes`
    }));

    if (isDBConnected()) {
      return await ProfessionalModel.findByIdAndUpdate(
        proId,
        { chatPricing: cleanedPricing },
        { new: true }
      );
    }

    const pro = memoryStore.professionals.find(p => String(p._id) === String(proId) || String(p.userId) === String(proId));
    if (!pro) throw new Error('Professional not found.');
    pro.chatPricing = cleanedPricing;
    pro.updatedAt = new Date();
    return pro;
  },

  // ADMIN USER MANAGEMENT
  async getAllUsers({ search = '', role = '', sort = 'newest' } = {}) {
    let users = [];
    if (isDBConnected()) {
      const query = {};
      if (role && role !== 'all') {
        query.role = role;
      }
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [{ name: regex }, { email: regex }, { username: regex }, { phone: regex }];
      }
      const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
      users = await UserModel.find(query).sort(sortOrder).lean();
    } else {
      users = memoryStore.users.filter(u => {
        const matchRole = !role || role === 'all' || u.role === role;
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q));
        return matchRole && matchSearch;
      });
      if (sort === 'oldest') {
        users.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    const sanitized = users.map(u => {
      const obj = { ...u };
      delete obj.password;
      return obj;
    });

    let allUsers = isDBConnected() ? await UserModel.find({}).lean() : memoryStore.users;
    const counts = {
      total: allUsers.length,
      users: allUsers.filter(u => u.role === 'user').length,
      professionals: allUsers.filter(u => u.role === 'professional').length,
      admins: allUsers.filter(u => u.role === 'admin').length
    };

    return { users: sanitized, total: sanitized.length, counts };
  },

  async deleteUser(userId) {
    if (isDBConnected()) {
      await UserModel.findByIdAndDelete(userId);
      await ProfessionalModel.deleteMany({ userId });
      await ProjectModel.deleteMany({ userId });
    }
    const idx = memoryStore.users.findIndex(u => String(u._id) === String(userId));
    if (idx !== -1) {
      memoryStore.users.splice(idx, 1);
      persistUsers();
    }
    const pIdx = memoryStore.professionals.findIndex(p => String(p.userId) === String(userId) || String(p._id) === String(userId));
    if (pIdx !== -1) {
      memoryStore.professionals.splice(pIdx, 1);
    }
    return { success: true };
  },

  // ADMIN PROFESSIONAL MANAGEMENT
  async deleteProfessional(proId) {
    let deleted = null;
    if (isDBConnected()) {
      deleted = await ProfessionalModel.findByIdAndDelete(proId);
    }
    const idx = memoryStore.professionals.findIndex(p => String(p._id) === String(proId));
    if (idx !== -1) {
      deleted = memoryStore.professionals.splice(idx, 1)[0];
    }
    return deleted || { success: true };
  },

  async updateProfessional(proId, updates) {
    if (isDBConnected()) {
      return await ProfessionalModel.findByIdAndUpdate(proId, updates, { new: true });
    }
    const pro = memoryStore.professionals.find(p => String(p._id) === String(proId) || String(p.userId) === String(proId));
    if (pro) {
      Object.assign(pro, updates, { updatedAt: new Date() });
      return pro;
    }
    return null;
  },

  // DATABASE METRICS & CONTROL
  async getDatabaseStats() {
    const isConn = isDBConnected();
    const stats = {
      connected: isConn,
      engine: 'MongoDB (MongoMemoryServer / Local Engine)',
      databaseName: '3d-floorplan-designer',
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3d-floorplan-designer',
      collections: {
        users: isConn ? await UserModel.countDocuments() : memoryStore.users.length,
        professionals: isConn ? await ProfessionalModel.countDocuments() : memoryStore.professionals.length,
        projects: isConn ? await ProjectModel.countDocuments() : memoryStore.projects.length,
        payments: isConn ? await PaymentModel.countDocuments() : memoryStore.payments.length,
        conversations: isConn ? await ConversationModel.countDocuments() : memoryStore.conversations.length,
        messages: isConn ? await MessageModel.countDocuments() : memoryStore.messages.length,
        notifications: isConn ? await NotificationModel.countDocuments() : memoryStore.notifications.length,
        verificationHistory: isConn ? await VerificationHistoryModel.countDocuments() : memoryStore.verificationHistory.length,
        chatSessions: isConn ? await ChatSessionModel.countDocuments() : memoryStore.chatSessions.length
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    };
    return stats;
  },

  async seedFullDatabase() {
    if (isDBConnected()) {
      for (const u of memoryStore.users) {
        await UserModel.updateOne({ email: u.email.toLowerCase() }, { $set: u }, { upsert: true });
      }
      for (const p of memoryStore.professionals) {
        await ProfessionalModel.updateOne({ _id: p._id }, { $set: p }, { upsert: true });
      }
      for (const pay of memoryStore.payments) {
        await PaymentModel.updateOne({ paymentId: pay.paymentId }, { $set: pay }, { upsert: true });
      }
    }
    persistUsers();
    return { success: true, message: 'Database successfully seeded with realistic sample records.' };
  },

  async resetDatabase() {
    if (isDBConnected()) {
      await UserModel.deleteMany({});
      await ProfessionalModel.deleteMany({});
      await ProjectModel.deleteMany({});
      await PaymentModel.deleteMany({});
      await ConversationModel.deleteMany({});
      await MessageModel.deleteMany({});
      await NotificationModel.deleteMany({});
      await VerificationHistoryModel.deleteMany({});
      await ChatSessionModel.deleteMany({});
    }
    await seedDatabaseIfEmpty();
    return { success: true, message: 'Database reset and restored to baseline seed state.' };
  },

  async exportDatabase() {
    let data = {};
    if (isDBConnected()) {
      data = {
        users: await UserModel.find({}).lean(),
        professionals: await ProfessionalModel.find({}).lean(),
        projects: await ProjectModel.find({}).lean(),
        payments: await PaymentModel.find({}).lean(),
        conversations: await ConversationModel.find({}).lean(),
        messages: await MessageModel.find({}).lean(),
        notifications: await NotificationModel.find({}).lean(),
        chatSessions: await ChatSessionModel.find({}).lean(),
        verificationHistory: await VerificationHistoryModel.find({}).lean(),
        exportedAt: new Date().toISOString()
      };
    } else {
      data = { ...memoryStore, exportedAt: new Date().toISOString() };
    }
    return data;
  }
};
