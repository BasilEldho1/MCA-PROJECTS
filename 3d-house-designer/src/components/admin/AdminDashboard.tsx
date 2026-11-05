import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentTransaction, Professional } from '../../types/floorplan';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  Clock,
  Trash2,
  X,
  Search,
  CheckCircle2,
  CreditCard,
  Filter,
  Check,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Award,
  AlertTriangle,
  Database,
  Server,
  RefreshCw,
  Plus,
  Shield,
  Phone,
  Mail,
  MapPin,
  LogOut,
  TrendingUp,
  Star,
  Edit3,
  UserPlus,
  HardDrive,
  Layers,
  Activity,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen?: boolean;
  isFullPage?: boolean;
  onClose?: () => void;
  onOpenProject?: (projectId: string) => void;
  onSignOut?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true,
  isFullPage = false,
  onClose,
  onOpenProject,
  onSignOut
}) => {
  const { projects, deleteProject } = useProject();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'professionals' | 'users' | 'database' | 'payments' | 'projects'>('professionals');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------
  // 1. PROFESSIONALS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [proCounts, setProCounts] = useState<{ total: number; verified: number; pending: number; rejected: number }>({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });
  const [proFilterStatus, setProFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [proFilterSpec, setProFilterSpec] = useState<string>('all');
  const [loadingPros, setLoadingPros] = useState(false);
  const [rejectModalPro, setRejectModalPro] = useState<Professional | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('License credential could not be verified with council records.');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  // Add / Edit Professional Modal State
  const [isAddProModalOpen, setIsAddProModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [proFormData, setProFormData] = useState({
    name: '',
    email: '',
    specialization: 'Architect',
    companyName: '',
    licenseNumber: '',
    phone: '',
    hourlyRate: '$95/hr',
    rating: '4.9',
    location: '',
    experience: '5+ years',
    description: '',
    status: 'APPROVED'
  });

  // -------------------------------------------------------------
  // 2. USER ACCOUNTS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userCounts, setUserCounts] = useState<{ total: number; users: number; professionals: number; admins: number }>({
    total: 0,
    users: 0,
    professionals: 0,
    admins: 0
  });
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'user' | 'professional' | 'admin'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add / Edit User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'user',
    phone: '',
    specialization: '',
    companyName: '',
    location: ''
  });

  // -------------------------------------------------------------
  // 3. DATABASE CONSOLE & METRICS STATE
  // -------------------------------------------------------------
  const [dbStats, setDbStats] = useState<any>(null);
  const [loadingDbStats, setLoadingDbStats] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);
  const [dbActionMessage, setDbActionMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 4. PAYMENTS STATE
  // -------------------------------------------------------------
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    refundedPayments: number;
    totalRevenue: number;
    activeChatSessions: number;
  } | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'REFUNDED'>('ALL');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [refundPromptPayment, setRefundPromptPayment] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Client requested cancellation');
  const [isRefunding, setIsRefunding] = useState(false);

  // -------------------------------------------------------------
  // DATA FETCHING HANDLERS
  // -------------------------------------------------------------
  const fetchProfessionals = async () => {
    setLoadingPros(true);
    try {
      const res = await api.getAdminProfessionals({
        status: proFilterStatus === 'ALL' ? undefined : proFilterStatus,
        specialization: proFilterSpec === 'all' ? undefined : proFilterSpec,
        search: searchQuery
      });
      setProfessionals(res.professionals || []);
      if (res.counts) setProCounts(res.counts);
    } catch (err) {
      console.warn('Could not fetch admin professionals:', err);
    } finally {
      setLoadingPros(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getAdminUsers({
        role: userFilterRole === 'all' ? undefined : userFilterRole,
        search: searchQuery
      });
      setUsersList(res.users || []);
      if (res.counts) setUserCounts(res.counts);
    } catch (err) {
      console.warn('Could not fetch admin users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDbStats = async () => {
    setLoadingDbStats(true);
    try {
      const res = await api.getDatabaseStats();
      if (res.stats) setDbStats(res.stats);
    } catch (err) {
      console.warn('Could not fetch database stats:', err);
    } finally {
      setLoadingDbStats(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const filterParam = paymentFilter === 'ALL' ? undefined : paymentFilter;
      const res = await api.getAdminPayments(filterParam);
      setPayments(res.payments || []);
      setPaymentSummary(res.summary || null);
    } catch (err) {
      console.warn('Could not fetch admin payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'professionals' || activeTab === 'stats') {
        fetchProfessionals();
      }
      if (activeTab === 'users' || activeTab === 'stats') {
        fetchUsers();
      }
      if (activeTab === 'database' || activeTab === 'stats') {
        fetchDbStats();
      }
      if (activeTab === 'payments' || activeTab === 'stats') {
        fetchPayments();
      }
    }
  }, [isOpen, activeTab, proFilterStatus, proFilterSpec, userFilterRole, paymentFilter]);

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (activeTab === 'professionals') fetchProfessionals();
      if (activeTab === 'users') fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // -------------------------------------------------------------
  // PROFESSIONAL ACTIONS
  // -------------------------------------------------------------
  const handleApprovePro = async (proId: string) => {
    if (!window.confirm('Approve this professional? Their status will be Verified and consultations enabled.')) return;
    setIsApproving(proId);
    try {
      await api.setAdminProfessionalStatus(proId, { status: 'APPROVED' });
      await fetchProfessionals();
      await fetchDbStats();
      alert('Professional approved and verified successfully!');
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectPro = async () => {
    if (!rejectModalPro) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setIsRejecting(true);
    try {
      const proId = (rejectModalPro as any)._id || rejectModalPro.id;
      await api.setAdminProfessionalStatus(proId, {
        status: 'REJECTED',
        rejectionReason: rejectionReasonInput
      });
      setRejectModalPro(null);
      await fetchProfessionals();
      await fetchDbStats();
      alert('Professional application rejected.');
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeletePro = async (proId: string, proName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete professional "${proName}" from the database?`)) return;
    try {
      await api.deleteAdminProfessional(proId);
      await fetchProfessionals();
      await fetchDbStats();
      alert('Professional deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    }
  };

  const handleSaveProForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPro) {
        const proId = (editingPro as any)._id || editingPro.id;
        await api.updateAdminProfessional(proId, {
          ...proFormData,
          rating: Number(proFormData.rating) || 5.0
        });
        alert('Professional profile updated successfully.');
      } else {
        await api.createAdminProfessional({
          ...proFormData,
          rating: Number(proFormData.rating) || 5.0
        });
        alert('New professional added to database successfully.');
      }
      setIsAddProModalOpen(false);
      setEditingPro(null);
      await fetchProfessionals();
      await fetchDbStats();
    } catch (err: any) {
      alert(err.message || 'Failed to save professional.');
    }
  };

  const handleOpenEditPro = (pro: Professional) => {
    setEditingPro(pro);
    setProFormData({
      name: pro.name || '',
      email: pro.email || '',
      specialization: pro.specialization || 'Architect',
      companyName: pro.companyName || '',
      licenseNumber: pro.licenseNumber || '',
      phone: pro.phone || '',
      hourlyRate: pro.hourlyRate || '$95/hr',
      rating: String(pro.rating || '4.9'),
      location: pro.location || '',
      experience: pro.experience || '5+ years',
      description: pro.description || '',
      status: pro.verification?.status || (pro.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING')
    });
    setIsAddProModalOpen(true);
  };

  const handleOpenAddPro = () => {
    setEditingPro(null);
    setProFormData({
      name: '',
      email: '',
      specialization: 'Architect',
      companyName: '',
      licenseNumber: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
      phone: '',
      hourlyRate: '$95/hr',
      rating: '4.9',
      location: '',
      experience: '5+ years',
      description: '',
      status: 'APPROVED'
    });
    setIsAddProModalOpen(true);
  };

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}" and all associated data from the database?`)) return;
    try {
      await api.deleteAdminUser(userId);
      await fetchUsers();
      await fetchProfessionals();
      await fetchDbStats();
      alert('User deleted from database.');
    } catch (err: any) {
      alert(err.message || 'Delete user failed.');
    }
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const uId = editingUser._id || editingUser.id;
        await api.updateAdminUser(uId, userFormData);
        alert('User updated successfully.');
      } else {
        await api.createAdminUser(userFormData);
        alert('New user created successfully.');
      }
      setIsAddUserModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      await fetchProfessionals();
      await fetchDbStats();
    } catch (err: any) {
      alert(err.message || 'Failed to save user.');
    }
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'user',
      phone: u.phone || '',
      specialization: u.specialization || '',
      companyName: u.companyName || '',
      location: u.location || ''
    });
    setIsAddUserModalOpen(true);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'user',
      phone: '',
      specialization: '',
      companyName: '',
      location: ''
    });
    setIsAddUserModalOpen(true);
  };

  // -------------------------------------------------------------
  // DATABASE ACTIONS
  // -------------------------------------------------------------
  const handleSeedDatabase = async () => {
    if (!window.confirm('Populate database with realistic demo architects, interior designers, clients, and sample 3D floor plans?')) return;
    setIsSeedingDb(true);
    setDbActionMessage('Seeding database entities...');
    try {
      const res = await api.seedDatabase();
      setDbActionMessage(res.message);
      await fetchDbStats();
      await fetchProfessionals();
      await fetchUsers();
      alert(res.message || 'Database seeded successfully!');
    } catch (err: any) {
      alert(err.message || 'Database seed failed.');
    } finally {
      setIsSeedingDb(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: This will reset all database collections to default factory seed records. Proceed?')) return;
    setIsResettingDb(true);
    setDbActionMessage('Resetting collections and restoring seed data...');
    try {
      const res = await api.resetDatabase();
      setDbActionMessage(res.message);
      await fetchDbStats();
      await fetchProfessionals();
      await fetchUsers();
      alert(res.message || 'Database reset successfully!');
    } catch (err: any) {
      alert(err.message || 'Database reset failed.');
    } finally {
      setIsResettingDb(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const data = await api.exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3d-house-designer-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export database backup.');
    }
  };

  const handleDownloadDoc = async (proId: string, docType: 'license' | 'qualification' = 'license') => {
    try {
      const { blob, filename } = await api.fetchDocumentBlob(proId, docType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${docType}-document.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download document');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundPromptPayment) return;
    setIsRefunding(true);
    try {
      await api.refundPayment(refundPromptPayment.paymentId, refundReason);
      setRefundPromptPayment(null);
      await fetchPayments();
      alert('Payment refund processed successfully.');
    } catch (err: any) {
      alert(err.message || 'Refund processing failed.');
    } finally {
      setIsRefunding(false);
    }
  };

  if (!isFullPage && !isOpen) return null;

  const content = (
    <div className={`bg-white ${isFullPage ? 'h-full w-full' : 'border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[94vh] shadow-2xl'} flex flex-col overflow-hidden text-xs text-slate-700`}>
      
      {/* HEADER BAR */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">System Administrator Console</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                Live MongoDB
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">Manage Registered Professionals, Users & Database Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Signed in as:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
              {user?.email || 'admin@floorplan3d.com'}
            </span>
          </div>

          {isFullPage ? (
            <button
              onClick={() => {
                if (onSignOut) onSignOut();
                else logout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
              title="Sign out of Administrator Console"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

        {/* TAB NAVIGATION */}
        <div className="px-6 pt-2 border-b border-slate-100 flex items-center justify-between bg-white overflow-x-auto gap-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('professionals')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'professionals'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={15} />
              <span>Professionals ({proCounts.total})</span>
              {proCounts.pending > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black border border-amber-200">
                  {proCounts.pending} Pending
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users size={15} />
              <span>Users Database ({userCounts.total})</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database size={15} />
              <span>Database Console</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard size={15} />
              <span>Paid Consultations ({payments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'projects'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderKanban size={15} />
              <span>All Projects ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 font-bold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={15} />
              <span>Overview & Analytics</span>
            </button>
          </div>

          <div className="pb-2 hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Admin:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {user?.email || 'admin@floorplan3d.com'}
            </span>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin bg-slate-50/50">

          {/* ======================================================== */}
          {/* TAB 1: PROFESSIONALS MANAGEMENT                          */}
          {/* ======================================================== */}
          {activeTab === 'professionals' && (
            <div className="space-y-4">
              {/* Top Action & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, license, company..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={proFilterStatus}
                    onChange={e => setProFilterStatus(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status ({proCounts.total})</option>
                    <option value="APPROVED">Verified ({proCounts.verified})</option>
                    <option value="PENDING">Pending Review ({proCounts.pending})</option>
                    <option value="REJECTED">Rejected ({proCounts.rejected})</option>
                  </select>

                  <select
                    value={proFilterSpec}
                    onChange={e => setProFilterSpec(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Disciplines</option>
                    <option value="Architect">Architect</option>
                    <option value="Interior Designer">Interior Designer</option>
                    <option value="Builder">Builder</option>
                    <option value="Structural Engineer">Structural Engineer</option>
                    <option value="Landscape Designer">Landscape Designer</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchProfessionals}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                    title="Refresh List"
                  >
                    <RefreshCw size={14} className={loadingPros ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={handleOpenAddPro}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Professional</span>
                  </button>
                </div>
              </div>

              {/* Professionals Grid / List */}
              {loadingPros ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-emerald-600" />
                  <span>Loading registered professionals...</span>
                </div>
              ) : professionals.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <p className="font-semibold text-slate-600 mb-2">No professionals found matching criteria</p>
                  <p className="text-xs text-slate-400 mb-4">Try clearing filters or add a new professional profile.</p>
                  <button
                    onClick={handleOpenAddPro}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Create Professional Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {professionals.map(pro => {
                    const st = pro.verification?.status || (pro.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING');
                    const isApproved = st === 'APPROVED';
                    const isPending = st === 'PENDING';
                    const isRejected = st === 'REJECTED';
                    const proId = (pro as any)._id || pro.id;

                    return (
                      <div
                        key={proId}
                        className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Profile Info */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          <img
                            src={pro.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pro.name)}`}
                            alt={pro.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-slate-900">{pro.name}</h3>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px] border border-slate-200">
                                {pro.specialization}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {isApproved && <CheckCircle2 size={10} />}
                                {isPending && <Clock size={10} />}
                                {isRejected && <X size={10} />}
                                {st}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] mt-1">
                              <span className="flex items-center gap-1">
                                <Mail size={12} className="text-slate-400" />
                                {pro.email || 'No email'}
                              </span>
                              {pro.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} className="text-slate-400" />
                                  {pro.phone}
                                </span>
                              )}
                              <span className="font-semibold text-slate-700">
                                License: <span className="font-mono">{pro.licenseNumber || 'N/A'}</span>
                              </span>
                              {pro.companyName && <span>🏢 {pro.companyName}</span>}
                              {pro.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400" />
                                  {pro.location}
                                </span>
                              )}
                              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {pro.rating || '5.0'}
                              </span>
                              <span className="text-emerald-700 font-bold">{pro.hourlyRate || '$95/hr'}</span>
                            </div>

                            {/* Documents indicator */}
                            <div className="flex items-center gap-2 mt-2">
                              {pro.licenseDocument && (
                                <button
                                  onClick={() => handleDownloadDoc(proId, 'license')}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold transition cursor-pointer"
                                >
                                  <FileText size={10} />
                                  <span>License PDF</span>
                                  <Download size={10} />
                                </button>
                              )}
                              {pro.qualificationDocument && (
                                <button
                                  onClick={() => handleDownloadDoc(proId, 'qualification')}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-semibold transition cursor-pointer"
                                >
                                  <Award size={10} />
                                  <span>Degree PDF</span>
                                  <Download size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Management Buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprovePro(proId)}
                                disabled={isApproving === proId}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={13} className={isApproving === proId ? 'animate-spin' : ''} />
                                <span>Verify & Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalPro(pro);
                                  setRejectionReasonInput('License verification document incomplete or invalid.');
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => {
                                setRejectModalPro(pro);
                                setRejectionReasonInput('Revoking verification status due to administrative review.');
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                              title="Revoke / Suspend"
                            >
                              Revoke
                            </button>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprovePro(proId)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditPro(pro)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="Edit Professional Details"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeletePro(proId, pro.name)}
                            className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Professional Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: USER ACCOUNTS DATABASE                           */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter and Top Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={userFilterRole}
                    onChange={e => setUserFilterRole(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Roles ({userCounts.total})</option>
                    <option value="user">Clients & Users ({userCounts.users})</option>
                    <option value="professional">Professionals ({userCounts.professionals})</option>
                    <option value="admin">Administrators ({userCounts.admins})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchUsers}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                    title="Refresh Users"
                  >
                    <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={handleOpenAddUser}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Create User Account</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email & Phone</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Joined Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          <RefreshCw size={16} className="animate-spin inline mr-2 text-emerald-600" />
                          Loading users from database...
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      usersList.map(u => {
                        const uId = u._id || u.id;
                        const isAdminUser = u.role === 'admin';
                        const isProUser = u.role === 'professional';

                        return (
                          <tr key={uId} className="hover:bg-slate-50/70 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full border border-slate-200 object-cover bg-slate-50 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                                  <div className="text-[10px] text-slate-400">@{u.username || 'user'}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-mono text-slate-700 text-xs">{u.email}</div>
                              {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  isAdminUser
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : isProUser
                                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit3 size={14} />
                                </button>
                                {!isAdminUser && (
                                  <button
                                    onClick={() => handleDeleteUser(uId, u.name)}
                                    className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DATABASE CONSOLE & CONTROL                        */}
          {/* ======================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Database Health Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Database size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black">MongoDB Database Engine</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                          ACTIVE & CONNECTED
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {dbStats?.uri || 'mongodb://127.0.0.1:27017/3d-floorplan-designer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchDbStats}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={12} className={loadingDbStats ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={handleExportDatabase}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Export JSON Dump</span>
                    </button>
                  </div>
                </div>

                {/* Database Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Database Name</div>
                    <div className="font-bold text-white text-sm font-mono mt-0.5">{dbStats?.databaseName || '3d-floorplan-designer'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Engine Type</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">MongoDB In-Memory</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Server Uptime</div>
                    <div className="font-bold text-white text-sm font-mono mt-0.5">
                      {dbStats?.system?.uptimeSeconds ? `${Math.floor(dbStats.system.uptimeSeconds / 60)} mins` : 'Online'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Memory Heap</div>
                    <div className="font-bold text-white text-sm font-mono mt-0.5">
                      {dbStats?.system?.memoryUsageMB ? `${dbStats.system.memoryUsageMB} MB` : 'Optimal'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Collections Cards Grid */}
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <HardDrive size={16} className="text-emerald-600" />
                  <span>Database Collections & Document Counts</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {[
                    { name: 'Users', count: dbStats?.collections?.users ?? userCounts.total, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                    { name: 'Professionals', count: dbStats?.collections?.professionals ?? proCounts.total, icon: Award, color: 'text-teal-600 bg-teal-50 border-teal-200' },
                    { name: 'Projects (2D/3D)', count: dbStats?.collections?.projects ?? projects.length, icon: FolderKanban, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                    { name: 'Payments', count: dbStats?.collections?.payments ?? payments.length, icon: CreditCard, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                    { name: 'Conversations', count: dbStats?.collections?.conversations ?? 2, icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                    { name: 'Chat Messages', count: dbStats?.collections?.messages ?? 12, icon: Activity, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                    { name: 'Audit History', count: dbStats?.collections?.verificationHistory ?? 4, icon: Shield, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
                    { name: 'Active Sessions', count: dbStats?.collections?.chatSessions ?? 1, icon: Clock, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
                  ].map((col, idx) => {
                    const Icon = col.icon;
                    return (
                      <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                          <div className="text-slate-500 text-[11px] font-medium">{col.name}</div>
                          <div className="text-xl font-black text-slate-900 mt-1">{col.count}</div>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${col.color}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Database Operations & Management Tools */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Database Operations & Synchronization</h4>
                    <p className="text-slate-500 text-[11px]">Seed initial records or reset database into standard test environment</p>
                  </div>
                  {dbActionMessage && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-semibold">
                      {dbActionMessage}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seed Box */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                        <Sparkles size={16} className="text-emerald-600" />
                        <span>Seed Realistic Demo Records</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed mb-4">
                        Populates verified Architects (Elena Rostova), Interior Designers (Marcus Vance), Builders (Liam Walker), Landscape Designers (Sophia Taylor), demo clients, sample payments, and ready-to-test CAD floor plans.
                      </p>
                    </div>
                    <button
                      onClick={handleSeedDatabase}
                      disabled={isSeedingDb}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={13} className={isSeedingDb ? 'animate-spin' : ''} />
                      <span>{isSeedingDb ? 'Seeding Database...' : 'Run Seed Database'}</span>
                    </button>
                  </div>

                  {/* Reset Box */}
                  <div className="p-4 bg-rose-50/40 border border-rose-200/80 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-rose-800 font-bold mb-1">
                        <RotateCcw size={16} className="text-rose-600" />
                        <span>Reset Database to Clean State</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed mb-4">
                        Wipes all temporary chats, uploaded documents, or invalid test entries, re-initializing clean database schemas with default system admin and baseline sample entities.
                      </p>
                    </div>
                    <button
                      onClick={handleResetDatabase}
                      disabled={isResettingDb}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={13} className={isResettingDb ? 'animate-spin' : ''} />
                      <span>{isResettingDb ? 'Resetting Database...' : 'Reset Database to Factory'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: PAID CONSULTATIONS & RAZORPAY                    */}
          {/* ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              {paymentSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px]">Total Revenue</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">₹{paymentSummary.totalRevenue}</div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px]">Successful Payments</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{paymentSummary.successfulPayments}</div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px]">Active Paid Chats</span>
                    <div className="text-xl font-black text-blue-600 mt-1">{paymentSummary.activeChatSessions}</div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px]">Refunded Payments</span>
                    <div className="text-xl font-black text-rose-600 mt-1">{paymentSummary.refundedPayments}</div>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Transaction ID</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Duration</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 font-mono text-slate-900 font-bold text-xs">{p.paymentId}</td>
                          <td className="p-3.5 font-bold text-emerald-700">₹{p.amount}</td>
                          <td className="p-3.5 text-slate-600">{p.chatDuration} Mins</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                p.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'REFUNDED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 text-right">
                            {p.status === 'SUCCESS' && (
                              <button
                                onClick={() => setRefundPromptPayment(p)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ALL FLOOR PLAN PROJECTS                          */}
          {/* ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Project Name</th>
                      <th className="p-3.5">Style / Type</th>
                      <th className="p-3.5">Plot Size</th>
                      <th className="p-3.5">Rooms</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900 text-xs">{p.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            {p.houseType}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {p.plotWidth} × {p.plotLength} {p.unit}
                        </td>
                        <td className="p-3.5 text-slate-600">{p.rooms.length} Rooms</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                onOpenProject?.(p.id);
                                onClose?.();
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Open in Studio
                            </button>
                            <button
                              onClick={() => deleteProject(p.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: OVERVIEW & SYSTEM STATS                           */}
          {/* ======================================================== */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-[11px] font-semibold">Registered Users</span>
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{userCounts.total}</span>
                  <div className="text-[10px] text-slate-400 mt-1">{userCounts.professionals} Verified Pros</div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-[11px] font-semibold">CAD Projects</span>
                    <FolderKanban size={18} className="text-emerald-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{projects.length}</span>
                  <div className="text-[10px] text-slate-400 mt-1">2D / 3D Layouts</div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-[11px] font-semibold">Consultation Revenue</span>
                    <CreditCard size={18} className="text-purple-600" />
                  </div>
                  <span className="text-2xl font-black text-emerald-700">₹{paymentSummary?.totalRevenue || 568}</span>
                  <div className="text-[10px] text-slate-400 mt-1">{paymentSummary?.successfulPayments || 2} Paid Sessions</div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-[11px] font-semibold">Database Engine</span>
                    <Database size={18} className="text-teal-600" />
                  </div>
                  <span className="text-base font-black text-slate-900">MongoDB Online</span>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">Health: 100% Operational</div>
                </div>
              </div>

              {/* Quick Launch Shortcuts */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-black text-slate-900 text-sm mb-3">Quick Administrative Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('professionals')}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                      <Award size={14} className="text-teal-600" />
                      Review License Approvals
                    </div>
                    <div className="text-[11px] text-slate-500">{proCounts.pending} applications awaiting verification</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                      <UserPlus size={14} className="text-blue-600" />
                      Manage User Accounts
                    </div>
                    <div className="text-[11px] text-slate-500">Add, edit, or adjust permissions</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('database')}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                      <Database size={14} className="text-emerald-600" />
                      Inspect Database & Seeds
                    </div>
                    <div className="text-[11px] text-slate-500">Backup, seed, or restore records</div>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* MODAL 1: ADD / EDIT PROFESSIONAL                         */}
        {/* ======================================================== */}
        {isAddProModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <Award size={18} className="text-teal-600" />
                  <span>{editingPro ? 'Edit Professional Profile' : 'Add Professional to Database'}</span>
                </div>
                <button onClick={() => setIsAddProModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProForm} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={proFormData.name}
                    onChange={e => setProFormData({ ...proFormData, name: e.target.value })}
                    placeholder="e.g. Elena Rostova, AIA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={proFormData.email}
                      onChange={e => setProFormData({ ...proFormData, email: e.target.value })}
                      placeholder="pro@example.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={proFormData.phone}
                      onChange={e => setProFormData({ ...proFormData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specialization</label>
                    <select
                      value={proFormData.specialization}
                      onChange={e => setProFormData({ ...proFormData, specialization: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="Architect">Architect</option>
                      <option value="Interior Designer">Interior Designer</option>
                      <option value="Builder">Builder</option>
                      <option value="Structural Engineer">Structural Engineer</option>
                      <option value="Landscape Designer">Landscape Designer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">License / Reg #</label>
                    <input
                      type="text"
                      value={proFormData.licenseNumber}
                      onChange={e => setProFormData({ ...proFormData, licenseNumber: e.target.value })}
                      placeholder="ARC-CA-2023-8841"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hourly Rate</label>
                    <input
                      type="text"
                      value={proFormData.hourlyRate}
                      onChange={e => setProFormData({ ...proFormData, hourlyRate: e.target.value })}
                      placeholder="$95/hr"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={proFormData.rating}
                      onChange={e => setProFormData({ ...proFormData, rating: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={proFormData.status}
                      onChange={e => setProFormData({ ...proFormData, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="APPROVED">Verified</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Studio Name</label>
                  <input
                    type="text"
                    value={proFormData.companyName}
                    onChange={e => setProFormData({ ...proFormData, companyName: e.target.value })}
                    placeholder="e.g. Rostova Modern Architecture"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={proFormData.location}
                    onChange={e => setProFormData({ ...proFormData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save Professional
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: ADD / EDIT USER                                 */}
        {/* ======================================================== */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                  <UserPlus size={18} className="text-emerald-600" />
                  <span>{editingUser ? 'Edit User Account' : 'Create User Account'}</span>
                </div>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveUserForm} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={userFormData.password}
                      onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                      placeholder="password123"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                    <select
                      value={userFormData.role}
                      onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="user">User / Client</option>
                      <option value="professional">Professional</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={userFormData.phone}
                      onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: REJECTION REASON PROMPT                         */}
        {/* ======================================================== */}
        {rejectModalPro && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <AlertTriangle size={18} />
                  <span>Reject Professional Verification</span>
                </div>
                <button onClick={() => setRejectModalPro(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <div className="font-bold">Applicant: {rejectModalPro.name}</div>
                <p className="text-[11px] mt-0.5">
                  The applicant will receive this reason and can re-submit credentials.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. License credential could not be verified with council records..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalPro(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectPro}
                  disabled={isRejecting || !rejectionReasonInput.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <X size={13} className={isRejecting ? 'animate-spin' : ''} />
                  <span>{isRejecting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 4: REFUND CONFIRMATION                             */}
        {/* ======================================================== */}
        {refundPromptPayment && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <RotateCcw size={18} />
                  <span>Process Payment Refund</span>
                </div>
                <button onClick={() => setRefundPromptPayment(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                <div className="font-bold">Refund Amount: ₹{refundPromptPayment.amount}</div>
                <p className="text-[11px] mt-0.5">
                  Refunding will reverse the transaction and conclude any active consultation session.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Reason for Refund
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Client requested cancellation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundPromptPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessRefund}
                  disabled={isRefunding || !refundReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw size={13} className={isRefunding ? 'animate-spin' : ''} />
                  <span>{isRefunding ? 'Refunding...' : 'Confirm Refund'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );

  if (isFullPage) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden text-xs text-slate-700 select-none">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      {content}
    </div>
  );
};
