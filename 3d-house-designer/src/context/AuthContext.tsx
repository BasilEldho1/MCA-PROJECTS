import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/floorplan';
import {
  getStoredUser,
  saveUserToStorage,
  DEFAULT_ADMIN,
  DEFAULT_USER,
  DEFAULT_ARCHITECT,
  DEFAULT_DESIGNER
} from '../utils/storage';
import { api, setAuthToken, ensureAuthToken } from '../services/api';
import { disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProfessional: boolean;
  login: (email: string, pass?: string) => Promise<boolean>;
  register: (
    nameOrData:
      | string
      | {
          name: string;
          email: string;
          password?: string;
          role?: 'user' | 'professional';
          phone?: string;
          specialization?: string;
          experience?: string;
          description?: string;
          [key: string]: any;
        },
    email?: string,
    pass?: string,
    role?: 'user' | 'professional',
    specialization?: string,
    experience?: string,
    description?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;
  switchRole: (role: UserRole) => void;
  loginAsDemo: (type: 'user' | 'architect' | 'designer' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    saveUserToStorage(user);
  }, [user]);

  // Sync with server token automatically on launch
  useEffect(() => {
    const initAuth = async () => {
      try {
        await ensureAuthToken();
        const res = await api.getMe();
        if (res?.user) {
          setUser(res.user);
        }
      } catch (e) {
        // Fallback to local user
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass?: string): Promise<boolean> => {
    if (!email?.trim() || !pass) {
      throw new Error('Please enter both your email address and password.');
    }

    try {
      const res = await api.login(email.trim(), pass);
      if (res?.token && res?.user) {
        setAuthToken(res.token);
        setUser(res.user);
        return true;
      }
      throw new Error('Login failed. Please verify your credentials.');
    } catch (err: any) {
      const isNetworkError =
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('Network request failed');

      // Offline demo fallback only on network unreachable
      if (isNetworkError) {
        if (email.toLowerCase().includes('admin')) {
          setUser(DEFAULT_ADMIN);
          return true;
        } else if (email.toLowerCase().includes('elena') || email.toLowerCase().includes('architect')) {
          setUser(DEFAULT_ARCHITECT);
          return true;
        } else if (email.toLowerCase().includes('marcus') || email.toLowerCase().includes('designer')) {
          setUser(DEFAULT_DESIGNER);
          return true;
        } else if (email.toLowerCase().includes('alex')) {
          setUser(DEFAULT_USER);
          return true;
        }
      }
      // Propagate backend error (401 invalid password, 400 bad email, etc.)
      throw err;
    }
  };

  const register = async (
    nameOrData:
      | string
      | {
          name: string;
          email: string;
          password?: string;
          confirmPassword?: string;
          role?: 'user' | 'professional';
          phone?: string;
          specialization?: string;
          experience?: string;
          description?: string;
          [key: string]: any;
        },
    email?: string,
    pass?: string,
    role: 'user' | 'professional' = 'user',
    specialization?: string,
    experience?: string,
    description?: string
  ): Promise<boolean> => {
    let payload: any;

    if (typeof nameOrData === 'object') {
      payload = { ...nameOrData };
    } else {
      payload = {
        name: nameOrData,
        email: email || '',
        password: pass,
        role: role || 'user',
        specialization,
        experience,
        description
      };
    }

    try {
      const res = await api.register(payload);
      if (res?.user || res?.token) {
        // Account created in database! Do not auto-login: user must log in as Step 2
        return true;
      }
      throw new Error('Registration failed.');
    } catch (err: any) {
      // Re-throw server error (409 email already in use, 400 validation error, etc.)
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    disconnectSocket();
    setUser(null);
  };

  const updateProfile = async (updated: Partial<User>) => {
    if (!user) return;
    try {
      await api.updateProfile(updated);
    } catch (e) {
      // offline fallback
    }
    setUser({ ...user, ...updated });
  };

  const switchRole = async (role: UserRole) => {
    if (role === 'admin') {
      await loginAsDemo('admin');
    } else if (role === 'professional') {
      await loginAsDemo('architect');
    } else {
      await loginAsDemo('user');
    }
  };

  const loginAsDemo = async (type: 'user' | 'architect' | 'designer' | 'admin') => {
    let email = 'alex@example.com';
    if (type === 'architect') email = 'elena.rostova@design.com';
    if (type === 'designer') email = 'marcus.vance@studio.com';
    if (type === 'admin') email = 'admin@floorplan3d.com';

    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isProfessional: user?.role === 'professional',
        login,
        register,
        logout,
        updateProfile,
        switchRole,
        loginAsDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
