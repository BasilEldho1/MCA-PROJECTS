import {
  User,
  Professional,
  ChatRequest,
  Conversation,
  Message,
  Project,
  ProjectSnapshot,
  ChatPricingPlan,
  PaymentTransaction,
  PaidChatSession,
  DemoTestCard,
  DemoCardChargePayload,
  DemoCardChargeResponse
} from '../types/floorplan';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('3d_floorplan_token');
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('3d_floorplan_token', token);
  } else {
    localStorage.removeItem('3d_floorplan_token');
  }
};

export const ensureAuthToken = async (): Promise<string | null> => {
  let token = getAuthToken();
  if (token) return token;

  // Auto-authenticate with stored user or demo user
  const storedUserStr = localStorage.getItem('3d_floorplan_user');
  let email = 'alex@example.com';
  if (storedUserStr) {
    try {
      const parsed = JSON.parse(storedUserStr);
      if (parsed.email) email = parsed.email;
    } catch (e) {}
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setAuthToken(data.token);
        return data.token;
      }
    }
  } catch (e) {
    console.warn('[API] Automatic token acquisition failed:', e);
  }
  return null;
};

async function request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  let token = getAuthToken();
  if (!token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
    token = await ensureAuthToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, attempt one re-login and retry
  if (res.status === 401 && retryCount === 0 && !endpoint.startsWith('/auth/')) {
    setAuthToken(null);
    const refreshedToken = await ensureAuthToken();
    if (refreshedToken) {
      return request<T>(endpoint, options, 1);
    }
  }

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // AUTH
  async login(email: string, password?: string): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
  },

  async register(data: {
    name: string;
    username?: string;
    email: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    role?: 'user' | 'professional';
    specialization?: string;
    companyName?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    experience?: string;
    location?: string;
    portfolioWebsite?: string;
    description?: string;
    licenseDocumentBase64?: string;
    licenseDocumentName?: string;
    qualificationDocumentBase64?: string;
    qualificationDocumentName?: string;
  }): Promise<{ token: string; user: User; professional?: Professional }> {
    return request<{ token: string; user: User; professional?: Professional }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // VERIFICATION & COMPLIANCE
  async getVerificationStatus(): Promise<{
    professionalId: string;
    name: string;
    specialization: string;
    licenseNumber: string;
    companyName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    verification: {
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
      submittedAt?: string;
      reviewedAt?: string;
    };
    licenseDocument?: {
      originalName?: string;
      size?: number;
      mimeType?: string;
      uploadedAt?: string;
      hasDocument?: boolean;
    };
    qualificationDocument?: {
      originalName?: string;
      size?: number;
      mimeType?: string;
      uploadedAt?: string;
      hasDocument?: boolean;
    };
    history?: any[];
  }> {
    return request('/professionals/verification/status');
  },

  async resubmitVerification(data: {
    licenseNumber?: string;
    companyName?: string;
    specialization?: string;
    yearsOfExperience?: number;
    experience?: string;
    location?: string;
    portfolioWebsite?: string;
    description?: string;
    resubmissionNotes?: string;
    licenseDocumentBase64?: string;
    licenseDocumentName?: string;
    qualificationDocumentBase64?: string;
    qualificationDocumentName?: string;
  }): Promise<{ message: string; professional: Professional }> {
    return request('/professionals/verification/resubmit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async fetchDocumentBlob(proId: string, docType: 'license' | 'qualification' = 'license'): Promise<{ blob: Blob; filename: string }> {
    let token = getAuthToken();
    if (!token) token = await ensureAuthToken();

    const res = await fetch(`${API_BASE_URL}/professionals/${proId}/document/${docType}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      let err = 'Failed to load document';
      try {
        const json = await res.json();
        err = json.error || err;
      } catch (e) {}
      throw new Error(err);
    }

    const disposition = res.headers.get('content-disposition');
    let filename = `${docType}-document`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    return { blob, filename };
  },

  // ADMIN VERIFICATION MANAGEMENT
  async getAdminVerificationRequests(params?: {
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<{
    requests: Professional[];
    counts: { all: number; pending: number; approved: number; rejected: number };
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/professionals/verification-requests${qs}`);
  },

  async getAdminProfessionalDetails(id: string): Promise<{
    professional: Professional;
    user: User | null;
    history: any[];
  }> {
    return request(`/admin/professionals/${id}`);
  },

  async approveProfessional(id: string, notes?: string): Promise<{ message: string; professional: Professional }> {
    return request(`/admin/professionals/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },

  async rejectProfessional(id: string, reason: string, notes?: string): Promise<{ message: string; professional: Professional }> {
    return request(`/admin/professionals/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, notes }),
    });
  },

  async getProfessionalVerificationHistory(id: string): Promise<{ history: any[] }> {
    return request(`/admin/professionals/${id}/history`);
  },

  // NOTIFICATIONS
  async getNotifications(): Promise<{ notifications: any[] }> {
    return request('/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean; notification: any }> {
    return request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return request('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // PROFESSIONALS
  async getProfessionals(params?: { search?: string; specialization?: string; includeUnverified?: boolean; status?: string }): Promise<{ professionals: Professional[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.specialization && params.specialization !== 'all') query.append('specialization', params.specialization);
    if (params?.includeUnverified !== undefined) query.append('includeUnverified', String(params.includeUnverified));
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ professionals: Professional[] }>(`/professionals${qs}`);
  },

  async getProfessionalById(id: string): Promise<{ professional: Professional }> {
    return request<{ professional: Professional }>(`/professionals/${id}`);
  },

  async updateProfessionalProfile(profileData: Partial<Professional>): Promise<{ professional: Professional }> {
    return request<{ professional: Professional }>('/professionals/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // CHAT REQUESTS
  async sendChatRequest(data: {
    receiverId: string;
    message?: string;
    projectId?: string | null;
    projectSnapshot?: ProjectSnapshot | null;
  }): Promise<{ message: string; request: ChatRequest }> {
    return request<{ message: string; request: ChatRequest }>('/chat-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getChatRequests(): Promise<{ requests: ChatRequest[] }> {
    return request<{ requests: ChatRequest[] }>('/chat-requests');
  },

  async acceptChatRequest(requestId: string): Promise<{
    message: string;
    request: ChatRequest;
    conversationId: string;
    conversation: Conversation;
  }> {
    return request<{
      message: string;
      request: ChatRequest;
      conversationId: string;
      conversation: Conversation;
    }>(`/chat-requests/${requestId}/accept`, {
      method: 'PUT',
    });
  },

  async rejectChatRequest(requestId: string): Promise<{ message: string; request: ChatRequest }> {
    return request<{ message: string; request: ChatRequest }>(`/chat-requests/${requestId}/reject`, {
      method: 'PUT',
    });
  },

  // CONVERSATIONS
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return request<{ conversations: Conversation[] }>('/conversations');
  },

  async getConversationById(id: string): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>(`/conversations/${id}`);
  },

  async createConversation(receiverId: string, projectId?: string | null): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ receiverId, projectId }),
    });
  },

  async shareProjectInConversation(
    conversationId: string,
    project: Project,
    note?: string
  ): Promise<{ message: string; chatMessage: Message }> {
    return request<{ message: string; chatMessage: Message }>(`/conversations/${conversationId}/share-project`, {
      method: 'POST',
      body: JSON.stringify({ project, note }),
    });
  },

  // MESSAGES
  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return request<{ messages: Message[] }>(`/conversations/${conversationId}/messages`);
  },

  async sendMessage(
    conversationId: string,
    message: string,
    messageType: 'text' | 'project_share' = 'text',
    sharedProject?: ProjectSnapshot | null,
    receiverId?: string
  ): Promise<{ message: Message }> {
    return request<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, messageType, sharedProject, receiverId }),
    });
  },

  async markMessageRead(messageId: string): Promise<{ message: Message }> {
    return request<{ message: Message }>(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  },

  // PROJECTS
  async getProjects(): Promise<{ projects: Project[] }> {
    return request<{ projects: Project[] }>('/projects');
  },

  async getProject(projectId: string): Promise<{ project: Project }> {
    return request<{ project: Project }>(`/projects/${projectId}`);
  },

  async saveProject(project: Partial<Project>): Promise<{ project: Project; message: string }> {
    return request<{ project: Project; message: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async updateProject(projectId: string, project: Partial<Project>): Promise<{ project: Project; message: string }> {
    return request<{ project: Project; message: string }>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  async renameProject(projectId: string, name: string): Promise<{ project: Project; message: string }> {
    return request<{ project: Project; message: string }>(`/projects/${projectId}/rename`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async cloneProject(projectId: string, name?: string): Promise<{ project: Project; message: string }> {
    return request<{ project: Project; message: string }>(`/projects/${projectId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async shareProjectWithProfessional(
    projectId: string,
    payload: {
      professionalId: string;
      files?: any[];
      format?: string;
      message?: string;
      allowEdit?: boolean;
    }
  ): Promise<{ success: boolean; message: string; shareEntry?: any }> {
    return request(`/projects/${projectId}/share`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // PROFESSIONAL CHAT PRICING
  async getProPricing(proId: string): Promise<{ success: boolean; professionalId: string; professionalName: string; chatPricing: ChatPricingPlan[] }> {
    return request<{ success: boolean; professionalId: string; professionalName: string; chatPricing: ChatPricingPlan[] }>(`/professionals/${proId}/pricing`);
  },

  async updateProPricing(chatPricing: ChatPricingPlan[]): Promise<{ success: boolean; message: string; chatPricing: ChatPricingPlan[] }> {
    return request<{ success: boolean; message: string; chatPricing: ChatPricingPlan[] }>('/professionals/pricing', {
      method: 'PUT',
      body: JSON.stringify({ chatPricing }),
    });
  },

  // PAYMENTS & RAZORPAY
  async createPaymentOrder(professionalId: string, durationMinutes: number): Promise<{
    success: boolean;
    orderId: string;
    gatewayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    paymentRecordId: string;
    breakdown: {
      chatFee: number;
      serviceFee: number;
      total: number;
      durationMinutes: number;
      currency: string;
    };
    professional: {
      id: string;
      name: string;
      title: string;
      avatar: string;
    };
  }> {
    return request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ professionalId, durationMinutes }),
    });
  },

  async verifyPayment(payload: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    paymentId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    payment: PaymentTransaction;
    chatSession: PaidChatSession;
    conversationId: string;
  }> {
    return request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getDemoCards(): Promise<{ success: boolean; cards: DemoTestCard[] }> {
    return request<{ success: boolean; cards: DemoTestCard[] }>('/payments/demo-cards');
  },

  async chargeDemoCard(payload: DemoCardChargePayload): Promise<DemoCardChargeResponse> {
    return request<DemoCardChargeResponse>('/payments/demo-card-charge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getUserPayments(): Promise<{ success: boolean; payments: PaymentTransaction[] }> {
    return request<{ success: boolean; payments: PaymentTransaction[] }>('/payments/user');
  },

  async getProEarnings(): Promise<{
    success: boolean;
    metrics: {
      totalEarnings: number;
      totalPaidChats: number;
      completedChats: number;
      pendingEarnings: number;
    };
    transactions: PaymentTransaction[];
    pricing: ChatPricingPlan[];
  }> {
    return request('/payments/professional/earnings');
  },

  async getAdminPayments(status?: string): Promise<{
    success: boolean;
    summary: {
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      refundedPayments: number;
      totalRevenue: number;
      activeChatSessions: number;
    };
    payments: PaymentTransaction[];
  }> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/payments${q}`);
  },

  async refundPayment(paymentId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    payment: PaymentTransaction;
  }> {
    return request(`/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // CHAT SESSIONS & ACCESS
  async getConversationSession(conversationId: string): Promise<{
    success: boolean;
    isPaidSessionActive: boolean;
    session: PaidChatSession | null;
    remainingSeconds: number;
    isExpired: boolean;
  }> {
    return request(`/chat-sessions/conversation/${conversationId}`);
  },

  async endChatSession(sessionId: string): Promise<{
    success: boolean;
    message: string;
    session: PaidChatSession;
  }> {
    return request(`/chat-sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },

  // ADMIN USERS MANAGEMENT
  async getAdminUsers(params?: { search?: string; role?: string; sort?: string }): Promise<{
    success: boolean;
    users: any[];
    total: number;
    counts: { total: number; users: number; professionals: number; admins: number };
  }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.sort) q.append('sort', params.sort);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/admin/users${qs}`);
  },

  async createAdminUser(userData: any): Promise<{
    success: boolean;
    message: string;
    user: any;
    professional?: any;
  }> {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateAdminUser(id: string, userData: any): Promise<{
    success: boolean;
    message: string;
    user: any;
  }> {
    return request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteAdminUser(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // ADMIN PROFESSIONALS MANAGEMENT
  async getAdminProfessionals(params?: { search?: string; specialization?: string; status?: string }): Promise<{
    success: boolean;
    professionals: Professional[];
    total: number;
    counts: { total: number; verified: number; pending: number; rejected: number };
  }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.specialization) q.append('specialization', params.specialization);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/admin/professionals${qs}`);
  },

  async createAdminProfessional(proData: any): Promise<{
    success: boolean;
    message: string;
    professional: Professional;
  }> {
    return request('/admin/professionals', {
      method: 'POST',
      body: JSON.stringify(proData),
    });
  },

  async updateAdminProfessional(id: string, proData: any): Promise<{
    success: boolean;
    message: string;
    professional: Professional;
  }> {
    return request(`/admin/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proData),
    });
  },

  async setAdminProfessionalStatus(id: string, payload: { status: string; rejectionReason?: string; notes?: string }): Promise<{
    success: boolean;
    message: string;
    professional: Professional;
  }> {
    return request(`/admin/professionals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminProfessional(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return request(`/admin/professionals/${id}`, {
      method: 'DELETE',
    });
  },

  // ADMIN DATABASE MANAGEMENT
  async getDatabaseStats(): Promise<{
    success: boolean;
    stats: {
      connected: boolean;
      engine: string;
      databaseName: string;
      uri: string;
      collections: {
        users: number;
        professionals: number;
        projects: number;
        payments: number;
        conversations: number;
        messages: number;
        notifications: number;
        verificationHistory: number;
        chatSessions: number;
      };
      system: {
        nodeVersion: string;
        platform: string;
        uptimeSeconds: number;
        memoryUsageMB: number;
      };
    };
  }> {
    return request('/admin/database/stats');
  },

  async seedDatabase(): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> {
    return request('/admin/database/seed', {
      method: 'POST',
    });
  },

  async resetDatabase(): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> {
    return request('/admin/database/reset', {
      method: 'POST',
    });
  },

  async exportDatabase(): Promise<any> {
    return request('/admin/database/export');
  }
};
