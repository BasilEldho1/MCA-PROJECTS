import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { PaymentTransaction } from '../../types/floorplan';
import { api } from '../../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  Save, 
  Layers, 
  CheckCircle2, 
  Camera,
  ArrowLeft,
  LogOut,
  CreditCard,
  Clock,
  MessageSquare,
  Box,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Link2,
  Sparkles,
  Check
} from 'lucide-react';

interface UserProfileViewProps {
  onBackToDashboard: () => void;
  onOpenChat?: () => void;
}

const AVATAR_PRESETS = [
  { label: 'Elena (Architect)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
  { label: 'Alex (Designer)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { label: 'Marcus (Interior)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { label: 'Liam (Builder)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
  { label: 'Sophia (Landscape)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
  { label: 'Admin (Director)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { label: 'CAD Modeler', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
  { label: 'Civil Engineer', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80' }
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onBackToDashboard, onOpenChat }) => {
  const { user, isProfessional, updateProfile, logout } = useAuth();
  const { projects } = useProject();

  const [fullName, setFullName] = useState(user?.name || 'Alex Rivera');
  const [email, setEmail] = useState(user?.email || 'alex.rivera@cadstudio.io');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 342-8901');
  const [profession, setProfession] = useState(user?.profession || (isProfessional ? 'Architectural Designer' : 'Homeowner'));
  const [location, setLocation] = useState(user?.location || 'San Francisco, CA');
  const [bio, setBio] = useState(
    user?.bio || 'Passionate about structural aesthetics, contemporary green homes, and high-efficiency floor plan drafting.'
  );
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if user changes
  React.useEffect(() => {
    if (user?.avatar) setAvatar(user.avatar);
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    if (user?.location) setLocation(user.location);
    if (user?.bio) setBio(user.bio);
  }, [user]);

  // User Consultation Payments
  const [userPayments, setUserPayments] = useState<PaymentTransaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  React.useEffect(() => {
    const fetchPayments = async () => {
      setLoadingPayments(true);
      try {
        const res = await api.getUserPayments();
        setUserPayments(res.payments || []);
      } catch (err) {
        console.warn('Could not load user payments:', err);
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      updateProfile({ avatar: dataUrl });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setIsAvatarModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setAvatar(url);
    updateProfile({ avatar: url });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setIsAvatarModalOpen(false);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setAvatar(customUrlInput.trim());
    updateProfile({ avatar: customUrlInput.trim() });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setCustomUrlInput('');
    setIsAvatarModalOpen(false);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    updateProfile({ avatar: '' });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setIsAvatarModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: fullName,
      phone,
      profession,
      location,
      bio,
      avatar
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalAreaDesigned = projects.reduce((acc, p) => acc + (p.plotWidth * p.plotLength), 0);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 text-slate-800 p-6 lg:p-10 selection:bg-emerald-500 selection:text-white relative">
      {/* Hidden File Input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="text-emerald-600" size={24} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">CAD Profile & Credentials</h1>
            </div>
            <p className="text-sm text-slate-500">
              Manage your engineering credentials, personal details, and active architectural workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            {user && (
              <button
                onClick={() => {
                  logout();
                  onBackToDashboard();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Sign Out of Session"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Layers size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{projects.length}</div>
              <div className="text-xs text-slate-500">Floor Plans Created</div>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Box size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalAreaDesigned.toLocaleString()} <span className="text-xs text-slate-400 font-normal">sq.ft</span></div>
              <div className="text-xs text-slate-500">Total Area Drafted</div>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-700">Verified {isProfessional ? 'Professional' : 'Client'}</div>
              <div className="text-xs text-slate-500">Standard License</div>
            </div>
          </div>
        </div>

        {/* Profile Card & Form */}
        <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-xs">
          {/* Avatar Bar */}
          <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-100 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover shadow-md shadow-emerald-600/20 border-2 border-white ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-600/20 border-2 border-white">
                  {fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
              <button 
                type="button" 
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md hover:scale-105 transition cursor-pointer border-2 border-white flex items-center justify-center"
                title="Update Profile Photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="text-center sm:text-left space-y-1 flex-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                <span>{fullName}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] rounded-md font-mono font-bold">
                  {isProfessional ? 'ARCHITECT PRO' : 'HOMEOWNER USER'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-2">
                <span>{email}</span>
                <span>•</span>
                <span>{location}</span>
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Camera size={12} />
                  <span>Update Profile Photo</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Form Fields */}
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Role / Profession</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={profession}
                    onChange={e => setProfession(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Professional Bio & Philosophy</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition resize-none font-medium"
                />
              </div>
            </div>

            {/* Submit & Status */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {savedSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={16} />
                  <span>Profile updated successfully!</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Last synchronized: Just now
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* CONSULTATION PAYMENT HISTORY */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <span>Consultation Payment History</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past Razorpay transactions for verified architectural and engineering consultations
              </p>
            </div>
            <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl w-fit">
              {userPayments.length} Total Consultations
            </span>
          </div>

          {loadingPayments ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading transaction history...</div>
          ) : userPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CreditCard size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No consultation payments yet.</p>
              <p className="text-[11px] text-slate-400">
                When you hire an architect from the directory, your Razorpay receipts and consultation records will show here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Professional</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Total Paid</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Consultation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userPayments.map(p => {
                    const proName =
                      typeof p.professionalId === 'object'
                        ? (p.professionalId as any).name
                        : 'Architect Consultant';
                    const proSpec =
                      typeof p.professionalId === 'object'
                        ? (p.professionalId as any).specialization
                        : 'Architect';

                    return (
                      <tr key={p._id || p.paymentId} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block text-xs">{proName}</span>
                          <span className="text-[10px] text-emerald-700">{proSpec}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {p.chatDuration} Mins
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                          ₹{p.amount}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status === 'REFUNDED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {p.status === 'SUCCESS' ? 'PAID ✓' : p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {onOpenChat && (
                            <button
                              type="button"
                              onClick={onOpenChat}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <MessageSquare size={12} />
                              <span>Open Chat</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AVATAR SELECTION / UPLOAD MODAL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Update Profile Photo</h3>
                  <p className="text-[11px] text-slate-500">Upload a custom image, choose a design preset, or paste a URL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Preview */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-center gap-4 bg-slate-50/50">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white">
                    {fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800">Photo Preview</div>
                <div className="text-[11px] text-slate-500">Displayed across 3D studio, consult chat & comments</div>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <Trash2 size={12} />
                    <span>Reset to default initials</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-100 px-5 pt-3 gap-2 bg-white">
              <button
                type="button"
                onClick={() => setAvatarTab('upload')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  avatarTab === 'upload'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={14} />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('presets')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  avatarTab === 'presets'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={14} />
                <span>Curated Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('url')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  avatarTab === 'url'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 size={14} />
                <span>Web Image URL</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 max-h-[320px] overflow-y-auto">
              {avatarTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 mx-auto flex items-center justify-center shadow-xs border border-emerald-200 group-hover:scale-105 transition">
                      <Upload size={20} />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Click to browse image from your device
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP, or SVG (Up to 5MB)
                    </p>
                  </div>
                </div>
              )}

              {avatarTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Select a professional architect, engineer, or design studio avatar:
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(p.url)}
                        className={`group relative rounded-2xl overflow-hidden border-2 transition cursor-pointer text-left ${
                          avatar === p.url ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <img src={p.url} alt={p.label} className="w-full aspect-square object-cover" />
                        <div className="p-1 text-[9px] font-bold text-slate-700 truncate text-center bg-white">
                          {p.label.split(' ')[0]}
                        </div>
                        {avatar === p.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatarTab === 'url' && (
                <form onSubmit={handleApplyUrl} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Direct Image Link</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="url"
                        placeholder="https://example.com/my-photo.jpg"
                        value={customUrlInput}
                        onChange={e => setCustomUrlInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!customUrlInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Apply Photo URL
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Updates sync in real-time</span>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

