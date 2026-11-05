import { Project, User } from '../types/floorplan';
import { DEFAULT_PLANS_CATALOG } from './plansCatalog';

const STORAGE_KEYS = {
  PROJECTS: '3d_floorplan_projects',
  CURRENT_USER: '3d_floorplan_user',
  USERS: '3d_floorplan_users_db'
};

// Default initial projects with diverse architectural types
export const INITIAL_DEMO_PROJECTS: Project[] = DEFAULT_PLANS_CATALOG;

export const DEFAULT_ADMIN: User = {
  id: 'usr_admin',
  name: 'Architect Admin',
  email: 'admin@floorplan3d.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export const DEFAULT_USER: User = {
  id: '65e011111111111111111101',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'user',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  createdAt: '2026-05-15T00:00:00.000Z'
};

export const DEFAULT_ARCHITECT: User = {
  id: '65e011111111111111111102',
  name: 'Arjun Thomas',
  email: 'arjun@floorplan3d.com',
  role: 'professional',
  specialization: 'Architect',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  createdAt: '2026-01-10T00:00:00.000Z'
};

export const DEFAULT_DESIGNER: User = {
  id: '65e011111111111111111103',
  name: 'Marcus Vance',
  email: 'marcus.vance@studio.com',
  role: 'professional',
  specialization: 'Interior Designer',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  createdAt: '2026-02-14T00:00:00.000Z'
};

// Storage Helpers with robust quota-exceeded and exception safety
export const getStoredProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!data) {
      return DEFAULT_PLANS_CATALOG;
    }
    const parsed: Project[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PLANS_CATALOG;
    }
    return parsed;
  } catch (e) {
    console.warn('Could not read projects from localStorage, falling back to default catalog:', e);
    return DEFAULT_PLANS_CATALOG;
  }
};

export const saveProjectsToStorage = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.warn('localStorage quota exceeded when saving projects, attempting fallback cleanup:', err);
    try {
      // If saving full projects exceeded quota, sanitize to keep essential structure
      // e.g. remove large base64 thumbnails or blueprint data
      const lightweight = projects.map(p => ({
        ...p,
        blueprintOverlay: p.blueprintOverlay ? {
          ...p.blueprintOverlay,
          imageUrl: p.blueprintOverlay.imageUrl?.startsWith('data:') ? '' : p.blueprintOverlay.imageUrl
        } : undefined
      }));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(lightweight));
    } catch (fallbackErr) {
      console.warn('Fallback save also exceeded quota; project will persist in memory for this session:', fallbackErr);
      try {
        // Clean out excessive space so app stays responsive
        localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      } catch (cleanErr) {
        // ignore
      }
    }
  }
};

export const getStoredUser = (): User | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const saveUserToStorage = (user: User | null): void => {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Failed to save user to localStorage:', e);
  }
};

