import React from 'react';
import {
  Box,
  Compass,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onStartDesigning: () => void;
  onExploreDemo: () => void;
  onOpenLogin: (role?: 'user' | 'professional') => void;
  onOpenRegister?: (role?: 'user' | 'professional') => void;
  onOpenProfessionals: () => void;
  onOpenFloorPlanner: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDesigning,
  onExploreDemo,
  onOpenLogin,
  onOpenRegister,
  onOpenProfessionals,
  onOpenFloorPlanner
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-6 lg:px-12 h-18 flex items-center justify-between shadow-xs">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/20 border border-emerald-300">
            <Box size={22} />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>3D House Designer</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                STUDIO
              </span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 block tracking-wider uppercase font-semibold">
              Architectural CAD Platform
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-emerald-700 font-bold transition hover:text-emerald-600 cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={onOpenFloorPlanner}
            className="hover:text-emerald-700 transition cursor-pointer"
          >
            Floor Planner
          </button>
          <button
            onClick={onOpenProfessionals}
            className="hover:text-emerald-700 transition cursor-pointer"
          >
            Find Professionals
          </button>
          <button
            onClick={() => onOpenLogin('user')}
            className="text-slate-700 hover:text-emerald-700 transition cursor-pointer font-bold px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-slate-50/80"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenRegister ? onOpenRegister('user') : onOpenLogin('user')}
            className="text-emerald-700 hover:text-white hover:bg-emerald-600 transition cursor-pointer font-bold px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50"
          >
            Register
          </button>
        </nav>

        {/* Header CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartDesigning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Start Designing</span>
          </button>
        </div>
      </header>

      {/* Hero Section with Interactive Blueprint Illustration */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:py-24 border-b border-emerald-100/80 bg-gradient-to-b from-emerald-50/40 via-white to-white">
        {/* Architectural Subtle Grid */}
        <div className="absolute inset-0 bg-blueprint-grid opacity-60 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Professional 2D Blueprint & 3D WebGL Studio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Design Your <br />
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Dream Home in 3D
              </span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl font-normal">
              An intuitive architectural workstation built for homeowners, civil engineers, and architects.
              Draft high-precision 2D floor plans with automatic dimensioning and extrude into photorealistic 3D house walkthroughs in real-time.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartDesigning}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/25 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Compass size={18} />
                <span>Create Floor Plan</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onExploreDemo}
                className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-emerald-50/60 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 hover:border-emerald-300 transition shadow-sm cursor-pointer"
              >
                <Eye size={18} className="text-emerald-600" />
                <span>Explore Demo Plans</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Floor Plan & 3D Demonstration Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-white border border-emerald-100 p-4 sm:p-6 shadow-2xl overflow-hidden">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono font-bold text-slate-600">
                    MODERN_VILLA_PLAN.cad • 2,450 sq.ft
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    2D BLUEPRINT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                    3D WEBGL
                  </span>
                </div>
              </div>

              {/* Architectural CAD Blueprint SVG Visualizer */}
              <div className="relative h-72 sm:h-80 bg-slate-50/80 rounded-2xl border border-slate-200/80 overflow-hidden flex items-center justify-center p-4">
                {/* SVG Blueprint Wireframe */}
                <svg
                  viewBox="0 0 400 280"
                  className="w-full h-full stroke-emerald-600 fill-emerald-50/40 select-none"
                >
                  {/* Outer Plot Perimeter */}
                  <rect
                    x="20"
                    y="20"
                    width="360"
                    height="240"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text x="30" y="16" fill="#047857" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    PLOT BOUNDARY: 40ft × 60ft (2,400 sq.ft)
                  </text>

                  {/* Main House Exterior Walls */}
                  <rect x="40" y="40" width="320" height="200" fill="#ffffff" stroke="#047857" strokeWidth="4" />

                  {/* Living Room Zone */}
                  <rect x="40" y="40" width="180" height="120" fill="rgba(16, 185, 129, 0.08)" stroke="#059669" strokeWidth="2" />
                  <text x="70" y="100" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    LIVING ROOM
                  </text>
                  <text x="70" y="116" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="600">
                    18.0ft × 12.0ft (216 sq.ft)
                  </text>

                  {/* Dining Room */}
                  <rect x="40" y="160" width="180" height="80" fill="rgba(16, 185, 129, 0.05)" stroke="#059669" strokeWidth="2" />
                  <text x="70" y="205" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    DINING & KITCHEN
                  </text>
                  <text x="70" y="221" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="600">
                    18.0ft × 8.0ft
                  </text>

                  {/* Master Bedroom */}
                  <rect x="220" y="40" width="140" height="110" fill="rgba(16, 185, 129, 0.08)" stroke="#059669" strokeWidth="2" />
                  <text x="235" y="90" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    MASTER BED
                  </text>
                  <text x="235" y="106" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="600">
                    14.0ft × 11.0ft
                  </text>

                  {/* Bathroom */}
                  <rect x="220" y="150" width="140" height="90" fill="rgba(16, 185, 129, 0.05)" stroke="#059669" strokeWidth="2" />
                  <text x="245" y="195" fill="#0f172a" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                    ATTACHED BATH
                  </text>
                  <text x="245" y="211" fill="#059669" fontSize="9" fontFamily="monospace">
                    14.0ft × 9.0ft
                  </text>

                  {/* Door Swing Arc */}
                  <path d="M 130 40 A 24 24 0 0 1 154 64" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="130" y1="40" x2="154" y2="40" stroke="#d97706" strokeWidth="3" />

                  {/* Dimension Annotations */}
                  <line x1="40" y1="250" x2="360" y2="250" stroke="#047857" strokeWidth="1" />
                  <text x="180" y="262" fill="#047857" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    ← 32.0 ft →
                  </text>
                </svg>

                {/* Floating Dimension Tag */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur border border-emerald-200 rounded-xl p-2.5 shadow-md text-[11px] font-mono text-slate-800 space-y-0.5">
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Auto-Dimensioned</span>
                  </div>
                  <div className="text-slate-500">Wall Height: 10.0 ft</div>
                </div>

                {/* Floating Switch to 3D Button */}
                <div className="absolute bottom-6 left-6">
                  <button
                    onClick={onExploreDemo}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Box size={14} />
                    <span>Preview in 3D WebGL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: 4 Distinct Pillars */}
      <section id="features" className="py-20 lg:py-24 bg-white border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Full Spectrum Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Built for Speed, Accuracy, and Visualization
            </h2>
            <p className="text-sm text-slate-600">
              Every tool engineered to streamline the drafting workflow from rough concept sketches to structural consultations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                <Compass size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">2D Floor Plan Editor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Draw solid exterior and interior walls with snap-to-grid accuracy, automatic dimensions, and instant room area calculations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-105 transition">
                <Box size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">3D Real-Time WebGL</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extrude your 2D blueprints instantly into a 3D house model. Explore with 360° orbit, bird's-eye top view, and first-person walkthrough.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Professional Directory</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with verified architects, interior designers, civil engineers, and builders to review layouts and structural calculations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-105 transition">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Export & Blueprint Sharing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export high-resolution blueprint PNG images, PDF specification reports, and standard JSON project files for contractors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Portals Section: Homeowners vs Professionals */}
      <section id="about" className="py-20 lg:py-24 bg-emerald-50/30 border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 border border-emerald-200 px-3 py-1 rounded-full">
              Two Dedicated Portals
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Designed for Both Clients and Professionals
            </h2>
            <p className="text-sm text-slate-600">
              Choose your role to access tailored tools, design libraries, and specialized collaboration spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User / Client Card */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-3xl p-8 space-y-6 shadow-xl transition">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                  FOR HOMEOWNERS & CLIENTS
                </span>
                <span className="text-3xl">🏠</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">User Access</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Design your ideal dream house floor plan, view in realistic 3D, and share blueprints directly with licensed architects for professional consultation.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Interactive 2D floor plan drag-and-drop drafting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>3D house walkthrough and daylight simulation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Direct consultation with verified architectural specialists</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenLogin('user')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                Access as User / Client
              </button>
            </div>

            {/* Professional Card */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-3xl p-8 space-y-6 shadow-xl transition">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold font-mono">
                  FOR LICENSED PROFESSIONALS
                </span>
                <span className="text-3xl">👨‍💼</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Professional Access</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  List your credentials, showcase past engineering projects, review client blueprints, and offer verified architectural consultations.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600 shrink-0" />
                  <span>Public verified professional portfolio profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600 shrink-0" />
                  <span>In-app blueprint review studio with live annotations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600 shrink-0" />
                  <span>Dedicated consultation workspace with client inquiries</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenLogin('professional')}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition cursor-pointer"
              >
                Access as Professional
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-10 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-md">
              <Box size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">3D House Designer Studio</span>
              <span className="text-[10px] text-slate-400">Architectural CAD Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-700 transition cursor-pointer">
              Home
            </button>
            <button onClick={onOpenFloorPlanner} className="hover:text-emerald-700 transition cursor-pointer">
              Floor Planner
            </button>
            <button onClick={onOpenProfessionals} className="hover:text-emerald-700 transition cursor-pointer">
              Find Professionals
            </button>
            <button onClick={() => onOpenLogin('user')} className="hover:text-emerald-700 transition cursor-pointer">
              Sign In
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            © 2026 3D House Designer Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
