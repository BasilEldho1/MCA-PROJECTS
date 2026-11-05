import React, { useState } from 'react';
import {
  Box,
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Globe,
  MapPin,
  AtSign,
  AlertCircle,
  ChevronDown,
  Home,
  Layers,
  ShieldCheck,
  Star,
  BadgeCheck,
  CheckCircle,
  CheckCircle2,
  FileCheck2,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { LicenseUploadField, UploadedDocInfo } from './LicenseUploadField';

interface AuthPageProps {
  initialMode?: 'login' | 'register-user' | 'register-pro';
  initialRole?: 'user' | 'professional' | 'admin';
  onSuccess: (role: 'user' | 'professional' | 'admin') => void;
  onBackToHome: () => void;
}

// Unified, pixel-perfect Form Field Component
interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  rightElement?: React.ReactNode;
  hint?: string;
  accent?: 'emerald' | 'teal';
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon,
  placeholder = '',
  required = false,
  disabled = false,
  min,
  max,
  rightElement,
  hint,
  accent = 'teal'
}) => {
  const [focused, setFocused] = useState(false);
  const isTeal = accent === 'teal';

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-400 font-normal">{hint}</span>}
      </div>

      <div className="relative flex items-center w-full">
        {icon && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              focused
                ? isTeal ? 'text-teal-600' : 'text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full h-10 ${icon ? 'pl-10' : 'pl-3.5'} ${rightElement ? 'pr-10' : 'pr-3.5'} bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 ${
            focused
              ? isTeal
                ? 'border-teal-500 ring-2 ring-teal-500/15 bg-white shadow-xs'
                : 'border-emerald-500 ring-2 ring-emerald-500/15 bg-white shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        />
        {rightElement && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

// Unified Form Select Component
interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  options: { label: string; value: string }[];
  required?: boolean;
  hint?: string;
  accent?: 'emerald' | 'teal';
}

const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  value,
  onChange,
  icon,
  options,
  required = false,
  hint,
  accent = 'teal'
}) => {
  const [focused, setFocused] = useState(false);
  const isTeal = accent === 'teal';

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-400 font-normal">{hint}</span>}
      </div>

      <div className="relative flex items-center w-full">
        {icon && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              focused
                ? isTeal ? 'text-teal-600' : 'text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            {icon}
          </div>
        )}
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full h-10 ${icon ? 'pl-10' : 'pl-3.5'} pr-9 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all duration-200 appearance-none cursor-pointer ${
            focused
              ? isTeal
                ? 'border-teal-500 ring-2 ring-teal-500/15 bg-white shadow-xs'
                : 'border-emerald-500 ring-2 ring-emerald-500/15 bg-white shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
};

// Unified Form Textarea Component
interface FormTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  rows?: number;
  accent?: 'emerald' | 'teal';
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  hint,
  rows = 3,
  accent = 'teal'
}) => {
  const [focused, setFocused] = useState(false);
  const isTeal = accent === 'teal';

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-400 font-normal">{hint}</span>}
      </div>

      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all duration-200 resize-none leading-relaxed ${
          focused
            ? isTeal
              ? 'border-teal-500 ring-2 ring-teal-500/15 bg-white shadow-xs'
              : 'border-emerald-500 ring-2 ring-emerald-500/15 bg-white shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      />
    </div>
  );
};

// Testimonial data
const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Interior Designer', text: 'Finally a floor plan tool that actually feels professional. The 3D export is stunning.', avatar: '👩‍💼', stars: 5 },
  { name: 'Rajesh Kumar', role: 'Homeowner', text: 'Designed my dream home in a weekend. Showed the 3D model to my builder and he was amazed.', avatar: '🏠', stars: 5 },
  { name: 'Emma Clarke', role: 'Architect', text: 'My clients love the interactive walk-through. The collaboration tools save me hours every week.', avatar: '👩‍🔬', stars: 5 },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'user',
  onSuccess,
  onBackToHome
}) => {
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(
    initialMode === 'register-user' || initialMode === 'register-pro'
  );
  const [selectedRole, setSelectedRole] = useState<'user' | 'professional' | 'admin'>(
    initialMode === 'register-pro' ? 'professional' : initialRole
  );

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Professional Verification fields
  const [specialization, setSpecialization] = useState('Architect');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<string>('5');
  const [location, setLocation] = useState('');
  const [portfolioWebsite, setPortfolioWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [licenseDoc, setLicenseDoc] = useState<UploadedDocInfo | null>(null);
  const [qualDoc] = useState<UploadedDocInfo | null>(null);
  const [licenseDocError, setLicenseDocError] = useState<string | null>(null);
  const [showProSuccessModal, setShowProSuccessModal] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = email.trim();
    if (!cleanIdentifier || !password.trim()) {
      setErrorMsg('Please enter both your email address/username and password.');
      return;
    }
    const isEmail = EMAIL_REGEX.test(cleanIdentifier);
    const isUsername = /^[a-zA-Z0-9_.-]+$/.test(cleanIdentifier);
    if (!isEmail && !isUsername) {
      setErrorMsg('Please enter a valid email address or username.');
      return;
    }
    if (password.length < 5) {
      setErrorMsg('Password must be at least 5 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.3 } });
      setSuccessMsg('🎉 Logged in successfully! Entering studio...');
      setTimeout(() => {
        let finalRole: 'user' | 'professional' | 'admin' = selectedRole;
        try {
          const stored = localStorage.getItem('3d_floorplan_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.role) finalRole = parsed.role;
          }
        } catch (e) {}
        onSuccess(finalRole);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLicenseDocError(null);

    // Common validations
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMsg('Full Name must be at least 2 characters long.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    // Professional specific validations
    if (selectedRole === 'professional') {
      if (!username.trim()) {
        setErrorMsg('Professional Username is required.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Official Phone Number is required for verification.');
        return;
      }
      if (!licenseNumber.trim()) {
        setErrorMsg('License / Certification Number is required.');
        return;
      }
      if (!licenseDoc || !licenseDoc.base64Data) {
        setLicenseDocError('Please upload your official license or certification document.');
        setErrorMsg('Please upload your license document before submitting.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const registeredEmail = email.trim().toLowerCase();
      await register({
        name: name.trim(),
        username: username.trim() || email.split('@')[0],
        email: registeredEmail,
        phone: phone.trim(),
        password,
        confirmPassword,
        role: selectedRole === 'professional' ? 'professional' : 'user',
        specialization: selectedRole === 'professional' ? specialization : undefined,
        companyName: selectedRole === 'professional' ? companyName.trim() : undefined,
        licenseNumber: selectedRole === 'professional' ? licenseNumber.trim() : undefined,
        yearsOfExperience: selectedRole === 'professional' ? Number(yearsOfExperience) || 0 : undefined,
        experience: selectedRole === 'professional' ? `${yearsOfExperience || 1}+ Years` : undefined,
        location: location.trim(),
        portfolioWebsite: portfolioWebsite.trim(),
        description: bio.trim(),
        licenseDocumentBase64: licenseDoc?.base64Data,
        licenseDocumentName: licenseDoc?.name,
        qualificationDocumentBase64: qualDoc?.base64Data,
        qualificationDocumentName: qualDoc?.name
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });

      if (selectedRole === 'professional') {
        setShowProSuccessModal(true);
      } else {
        // Step 1: Register complete! Switch to Step 2: Login
        setIsRegister(false);
        setEmail(registeredEmail);
        setPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        setSuccessMsg('🎉 Account registered! Please sign in with your password to continue.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isProRegistration = isRegister && selectedRole === 'professional';

  return (
    <div className="min-h-screen flex font-sans selection:bg-teal-500 selection:text-white bg-slate-50">

      {/* ── LEFT PANEL: Brand / Illustration ── */}
      <div
        className={`hidden lg:flex flex-col relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white overflow-hidden transition-all duration-300 ${
          isProRegistration ? 'w-[38%] xl:w-[42%]' : 'w-[50%]'
        }`}
      >
        {/* Animated grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-8 lg:p-10 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Box size={20} className="text-white" />
            </div>
            <div>
              <span className="font-black text-base text-white block leading-tight">3D House Designer</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                {isProRegistration ? 'Professional Accreditation Portal' : 'Architectural Studio'}
              </span>
            </div>
          </div>

          {/* Central hero */}
          <div className="flex flex-col justify-center space-y-6 py-6 my-auto">
            {/* 3D House Blueprint SVG illustration */}
            <div className="relative mx-auto w-full max-w-sm">
              <svg viewBox="0 0 380 260" className="w-full drop-shadow-2xl">
                <rect x="20" y="20" width="340" height="220" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="8 4" rx="4" opacity="0.5" />
                {[60,100,140,180,220,260,300].map(x => (
                  <line key={x} x1={x} y1="20" x2={x} y2="240" stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
                ))}
                {[60,100,140,180,220].map(y => (
                  <line key={y} x1="20" y1={y} x2="360" y2={y} stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
                ))}
                <rect x="40" y="40" width="180" height="130" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="2" rx="2" />
                <line x1="130" y1="40" x2="130" y2="170" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                <line x1="40" y1="110" x2="130" y2="110" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                <line x1="130" y1="105" x2="220" y2="105" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                <rect x="220" y="60" width="120" height="120" fill="#10b981" fillOpacity="0.05" stroke="#10b981" strokeWidth="2" rx="2" />
                <line x1="220" y1="110" x2="340" y2="110" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                <text x="75" y="82" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">LIVING</text>
                <text x="75" y="142" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BEDROOM</text>
                <text x="175" y="80" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">KITCHEN</text>
                <text x="175" y="138" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BATH</text>
                <text x="280" y="86" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MASTER</text>
                <text x="280" y="97" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BED</text>
                <text x="280" y="142" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">STUDY</text>
                <text x="190" y="195" fill="#6ee7b7" fontSize="8" fontFamily="monospace" textAnchor="middle">40 ft × 28 ft</text>
                <path d="M 130 110 Q 148 110 148 92" fill="none" stroke="#34d399" strokeWidth="1.2" opacity="0.7" />
                <path d="M 40 90 Q 54 90 54 76" fill="none" stroke="#34d399" strokeWidth="1.2" opacity="0.7" />
                {[[40,40],[220,40],[40,170],[220,170]].map(([x,y], i) => (
                  <circle key={i} cx={x} cy={y} r="3" fill="#10b981" opacity="0.8" />
                ))}
                <text x="200" y="215" fill="#6ee7b7" fontSize="7" fontFamily="monospace" opacity="0.7">TOTAL AREA: 1,250 SQ.FT</text>
              </svg>

              <div className="absolute -top-3 -right-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg rotate-3 border border-emerald-400/40">
                2D → 3D CAD ENGINE
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-tight">
                {isProRegistration ? (
                  <>
                    Join the Verified<br />
                    <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
                      Architect & Expert Network
                    </span>
                  </>
                ) : (
                  <>
                    Design Your<br />
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                      Dream Home
                    </span>
                  </>
                )}
              </h1>
              <p className="text-xs xl:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                {isProRegistration
                  ? 'Connect with clients seeking certified architects, engineers, and interior designers with paid consultation tools.'
                  : 'Create professional 2D floor plans and instantly convert them into stunning interactive 3D models.'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto w-full">
              {[
                { icon: Home, value: '10K+', label: 'Floor Plans' },
                { icon: Layers, value: 'WebGL', label: 'Real-time 3D' },
                { icon: ShieldCheck, value: '500+', label: 'Verified Pros' }
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur">
                    <Icon size={16} className="text-emerald-400 mx-auto mb-1" />
                    <div className="text-base font-black text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-400">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonial card */}
          <div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: TESTIMONIALS[activeTestimonial].stars }).map((_, i) => (
                  <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed mb-3">
                "{TESTIMONIALS[activeTestimonial].text}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TESTIMONIALS[activeTestimonial].avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{TESTIMONIALS[activeTestimonial].name}</div>
                    <div className="text-[10px] text-emerald-400">{TESTIMONIALS[activeTestimonial].role}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`w-1.5 h-1.5 rounded-full transition ${i === activeTestimonial ? 'bg-emerald-400' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form Container ── */}
      <div className="flex-1 bg-white flex flex-col justify-start items-center px-4 sm:px-8 lg:px-12 py-8 overflow-y-auto">
        <div
          className={`w-full transition-all duration-300 space-y-6 ${
            isProRegistration ? 'max-w-2xl' : 'max-w-[440px]'
          }`}
        >

          {/* Top navigation row: Back Button & Step Indicator */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>

            {/* Step indicator */}
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 text-[11px]">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${isRegister ? 'bg-white shadow-xs font-bold text-teal-700' : 'text-slate-500 font-medium'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isRegister ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                <span>Register</span>
              </div>
              <span className="text-slate-300 font-bold">→</span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${!isRegister ? 'bg-white shadow-xs font-bold text-teal-700' : 'text-slate-500 font-medium'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${!isRegister ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                <span>Login</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 lg:hidden mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
                <Box size={16} className="text-white" />
              </div>
              <span className="font-black text-sm text-slate-900">3D House Designer</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {isRegister ? (
                selectedRole === 'professional' ? (
                  <>
                    <span>Professional Registration</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      <BadgeCheck size={13} className="text-teal-600" /> Verified Pro
                    </span>
                  </>
                ) : (
                  'Create User Account'
                )
              ) : (
                'Sign In to Studio'
              )}
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              {isRegister
                ? selectedRole === 'professional'
                  ? 'Complete your accreditation and license details to consult on architectural floor plans.'
                  : 'Sign up to design, customize, and export 2D and 3D architectural house models.'
                : 'Enter your credentials to access your saved floor plans and workspace.'}
            </p>
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              {isRegister ? 'Choose Account Type' : 'Select Account Type'}
            </label>
            <div className={`grid ${isRegister ? 'grid-cols-2' : 'grid-cols-3'} gap-2.5`}>
              <button
                type="button"
                onClick={() => { setSelectedRole('user'); setErrorMsg(''); setLicenseDocError(null); }}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'user'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">🏠</span>
                  {selectedRole === 'user' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={10} className="text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Standard User</div>
                  <div className="text-[10px] text-slate-500 truncate">Homeowner & Client</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRole('professional'); setErrorMsg(''); setLicenseDocError(null); }}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'professional'
                    ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">👨‍💼</span>
                  {selectedRole === 'professional' && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                      <CheckCircle2 size={10} className="text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Professional</div>
                  <div className="text-[10px] text-slate-500 truncate">Architect & Designer</div>
                </div>
              </button>

              {!isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setErrorMsg('');
                    setEmail('admin@floorplan3d.com');
                    setPassword('password123');
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'admin'
                      ? 'border-purple-500 bg-purple-50/70 shadow-sm ring-1 ring-purple-500/30'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">🛡️</span>
                    {selectedRole === 'admin' && (
                      <span className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Administrator</div>
                    <div className="text-[10px] text-slate-500 truncate">Database & Console</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Social login buttons (Login only) */}
          {!isRegister && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </button>
            </div>
          )}

          {!isRegister && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {/* Error / Success Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              LOGIN FORM
             ══════════════════════════════════════════════ */}
          {!isRegister ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <FormField
                id="email"
                type="text"
                label={selectedRole === 'professional' ? 'Professional Email or Username' : 'Email Address or Username'}
                value={email}
                onChange={setEmail}
                icon={<Mail size={15} />}
                placeholder="e.g. name@domain.com or admin"
                required
                accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
              />

              <FormField
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={setPassword}
                icon={<Lock size={15} />}
                placeholder="••••••••"
                required
                accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 accent-teal-600 rounded cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setErrorMsg('Demo mode: default password is "password123".')}
                  className="text-teal-700 hover:text-teal-800 font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in to {selectedRole === 'professional' ? 'Pro Workspace' : 'Studio'} <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          ) : (
            /* ══════════════════════════════════════════════
                REGISTRATION FORM
               ══════════════════════════════════════════════ */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">

              {/* Professional Verification Notice Banner */}
              {selectedRole === 'professional' && (
                <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl text-teal-900 text-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs block">Official Accreditation & Compliance Required</span>
                    <span className="text-teal-800 text-[11px] leading-relaxed block">
                      To ensure building code integrity and client safety, all professional accounts undergo license credential checks before accepting public client requests and paid consultations.
                    </span>
                  </div>
                </div>
              )}

              {/* ── SECTION 1: ACCOUNT & CONTACT INFO ── */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                  <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                    <User size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {selectedRole === 'professional' ? 'Personal & Account Credentials' : 'Account Details'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="name"
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    icon={<User size={15} />}
                    placeholder="e.g. Sarah Jenkins"
                    required
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                  />

                  <FormField
                    id="username"
                    label={selectedRole === 'professional' ? 'Professional Username' : 'Username'}
                    value={username}
                    onChange={setUsername}
                    icon={<AtSign size={15} />}
                    placeholder="e.g. s_jenkins_design"
                    required={selectedRole === 'professional'}
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                    hint={selectedRole === 'professional' ? 'Public handle' : 'Optional'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="reg-email"
                    type="email"
                    label={selectedRole === 'professional' ? 'Professional / Business Email' : 'Email Address'}
                    value={email}
                    onChange={setEmail}
                    icon={<Mail size={15} />}
                    placeholder="name@studio.com"
                    required
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                  />

                  <FormField
                    id="phone"
                    type="tel"
                    label={selectedRole === 'professional' ? 'Phone Number' : 'Phone Number'}
                    value={phone}
                    onChange={setPhone}
                    icon={<Phone size={15} />}
                    placeholder="+1 (555) 019-2834"
                    required={selectedRole === 'professional'}
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                    hint={selectedRole === 'professional' ? 'For verification' : 'Optional'}
                  />
                </div>
              </div>

              {/* ── SECTION 2: PROFESSIONAL ACCREDITATION & PRACTICE (Pro Only) ── */}
              {selectedRole === 'professional' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                    <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Briefcase size={12} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Professional Practice & Licensing
                    </h3>
                  </div>

                  {/* Row 1: Specialization & Company / Firm Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                      id="specialization"
                      label="Primary Specialization"
                      value={specialization}
                      onChange={setSpecialization}
                      icon={<Briefcase size={15} />}
                      required
                      options={[
                        { label: 'Architect', value: 'Architect' },
                        { label: 'Interior Designer', value: 'Interior Designer' },
                        { label: 'Builder & General Contractor', value: 'Builder' },
                        { label: 'Structural Engineer', value: 'Structural Engineer' },
                        { label: 'Landscape Designer', value: 'Landscape Designer' },
                        { label: 'CAD Floor Plan Specialist', value: 'CAD Floor Plan Specialist' }
                      ]}
                      accent="teal"
                    />

                    <FormField
                      id="companyName"
                      label="Company / Firm Name"
                      value={companyName}
                      onChange={setCompanyName}
                      icon={<Building2 size={15} />}
                      placeholder="e.g. Apex Architecture Studio"
                      accent="teal"
                      hint="Or Independent Practice"
                    />
                  </div>

                  {/* Row 2: License Number & Years of Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="licenseNumber"
                      label="License / Certification Number"
                      value={licenseNumber}
                      onChange={setLicenseNumber}
                      icon={<FileCheck2 size={15} />}
                      placeholder="e.g. AIA-782914-TX"
                      required
                      accent="teal"
                      hint="Required for badge"
                    />

                    <FormField
                      id="yearsOfExperience"
                      type="number"
                      label="Years of Experience"
                      value={yearsOfExperience}
                      onChange={setYearsOfExperience}
                      icon={<Clock size={15} />}
                      placeholder="e.g. 8"
                      min={0}
                      max={60}
                      accent="teal"
                      hint="In professional field"
                    />
                  </div>

                  {/* Row 3: Location & Portfolio URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="location"
                      label="Location (City, State / Country)"
                      value={location}
                      onChange={setLocation}
                      icon={<MapPin size={15} />}
                      placeholder="e.g. Austin, TX, USA"
                      accent="teal"
                    />

                    <FormField
                      id="portfolioWebsite"
                      type="url"
                      label="Portfolio / Website URL"
                      value={portfolioWebsite}
                      onChange={setPortfolioWebsite}
                      icon={<Globe size={15} />}
                      placeholder="https://yourportfolio.design"
                      accent="teal"
                      hint="Optional"
                    />
                  </div>

                  {/* Row 4: Bio / Practice Summary */}
                  <FormTextarea
                    id="bio"
                    label="Professional Bio / Practice Summary"
                    value={bio}
                    onChange={setBio}
                    rows={3}
                    placeholder="Briefly describe your architectural style, design philosophy, certifications, and notable floor plan projects..."
                    hint="Max 300 characters"
                    accent="teal"
                  />

                  {/* Row 5: License Document Upload */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 mb-2.5">
                      <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                        <FileCheck2 size={12} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Official Verification Document
                      </h3>
                    </div>

                    <LicenseUploadField
                      label="Upload Official License / Registration Certificate"
                      description="Upload a high-resolution scan or digital certificate (PDF, JPG, JPEG, PNG, max 10MB) to verify your credentials."
                      required={true}
                      docInfo={licenseDoc}
                      onChange={setLicenseDoc}
                      error={licenseDocError || undefined}
                    />
                  </div>
                </div>
              )}

              {/* ── SECTION 3: SECURITY CREDENTIALS ── */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                  <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Lock size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Security Credentials
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    label="Account Password"
                    value={password}
                    onChange={setPassword}
                    icon={<Lock size={15} />}
                    placeholder="At least 6 characters"
                    required
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />

                  <FormField
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    icon={<Lock size={15} />}
                    placeholder="Re-enter password"
                    required
                    accent={selectedRole === 'professional' ? 'teal' : 'emerald'}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            password.length >= i * 3
                              ? password.length >= 10
                                ? 'bg-teal-500'
                                : password.length >= 7
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Password strength:</span>
                      <span className={password.length >= 10 ? 'text-teal-600 font-bold' : password.length >= 7 ? 'text-amber-600 font-bold' : 'text-rose-500'}>
                        {password.length < 4 ? 'Too short' : password.length < 7 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong & Secure ✓'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting Registration...</>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'professional'
                        ? 'Complete Professional Registration'
                        : 'Create User Account'}
                    </span>
                    <Sparkles size={15} className="text-amber-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle login / register */}
          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Register now
                </button>
              </p>
            )}
          </div>

          {/* Guest explore option */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => onSuccess('user')}
              className="text-xs text-slate-400 hover:text-teal-700 font-medium transition cursor-pointer inline-flex items-center gap-1 hover:underline"
            >
              <span>Explore studio as Guest</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Professional Registration Success Modal ── */}
      {showProSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-100 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Registration Submitted!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Welcome to 3D House Floor Plan Designer! Your professional credentials and license document have been submitted to our administration team for compliance verification.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Clock className="w-4 h-4" />
                <span>Verification Status: PENDING REVIEW</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-normal">
                Your profile is in review. You can log in and explore your workspace anytime. Once approved, your profile will be publicly listed for client floor plan consultations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowProSuccessModal(false);
                setIsRegister(false);
                setEmail(email.trim().toLowerCase());
                setPassword('');
                setConfirmPassword('');
                setErrorMsg('');
                setSuccessMsg('🎉 Professional account registered! Please sign in to enter your dashboard.');
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Proceed to Sign In (Step 2)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
