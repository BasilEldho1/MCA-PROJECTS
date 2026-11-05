import React from 'react';
import { Compass, ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';

interface NotFoundViewProps {
  type?: '404' | '403';
  message?: string;
  onGoHome: () => void;
  onGoDashboard?: () => void;
  onOpenLogin?: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  type = '404',
  message,
  onGoHome,
  onGoDashboard,
  onOpenLogin
}) => {
  const is403 = type === '403';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
          {is403 ? <ShieldAlert size={32} /> : <Compass size={32} />}
        </div>

        {/* Badge & Title */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            {is403 ? '403 • Access Restricted' : '404 • Page Not Found'}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {is403 ? 'Administrator Authorization Required' : 'Blueprint Not Found'}
          </h1>
          <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto">
            {message ||
              (is403
                ? 'This section is strictly restricted to system administrators. Please sign in with an authorized administrator account to access this console.'
                : 'The page or architectural route you requested does not exist or has been relocated.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onGoDashboard && (
            <button
              onClick={onGoDashboard}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={15} />
              <span>Back to Dashboard</span>
            </button>
          )}

          {is403 && onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={15} className="text-emerald-600" />
              <span>Sign In as Admin</span>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Home Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
