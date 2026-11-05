import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, AlertCircle, Clock, RefreshCw, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OtpChallengeModalProps {
  isOpen: boolean;
  amount: number;
  currency?: string;
  cardBrand?: string;
  cardLast4?: string;
  maskedPhone?: string;
  onVerify: (otp: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  errorMessage?: string;
}

export const OtpChallengeModal: React.FC<OtpChallengeModalProps> = ({
  isOpen,
  amount,
  currency = 'INR',
  cardBrand = 'VISA',
  cardLast4 = '4242',
  maskedPhone = '+91 ******8821',
  onVerify,
  onCancel,
  isLoading,
  errorMessage
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [resendNotice, setResendNotice] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeLeft(120);
      setResendNotice('');
      return;
    }

    // Auto-focus first digit
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const next = [...digits];
    // If multiple characters pasted (e.g. 123456)
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) next[i] = c;
      });
      setDigits(next);
      inputRefs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }

    next[index] = clean[clean.length - 1];
    setDigits(next);

    // Auto-advance
    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    setDigits(['1', '2', '3', '4', '5', '6']);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) return;
    onVerify(otp);
  };

  const handleResend = () => {
    setTimeLeft(120);
    setResendNotice('New demo OTP dispatched to ' + maskedPhone + ' (Code: 123456)');
    setTimeout(() => setResendNotice(''), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isComplete = digits.every(d => d.length === 1);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Issuing Bank Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase">
                  {cardBrand} 3D-Secure 2.0
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  SANDBOX
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Issuing Bank Verified Identity Check</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transaction Metadata */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Merchant:</span>
              <span className="font-bold text-slate-800">3D Floor Plan Designer Pro</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Card:</span>
              <span className="font-mono font-bold text-slate-800">{cardBrand} •••• {cardLast4}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Transaction Amount:</span>
              <span className="font-black text-emerald-700 text-sm font-mono">
                {currency === 'INR' ? '₹' : '$'}{amount}
              </span>
            </div>
          </div>

          {/* SMS Notification Banner */}
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Enter One-Time Password (OTP)</h4>
            <p className="text-xs text-slate-500">
              A 6-digit authentication code has been simulated and sent to{' '}
              <span className="font-bold text-slate-800 font-mono">{maskedPhone}</span>
            </p>
          </div>

          {/* 6-Digit OTP Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                disabled={isLoading}
                className="w-10 sm:w-12 h-12 text-center text-lg font-black font-mono bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none transition shadow-inner"
              />
            ))}
          </div>

          {/* Demo 1-Click Autofill Helper */}
          <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/70 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-medium">
              <span className="text-[11px]">Demo OTP: <strong className="font-mono text-indigo-700 font-bold">123456</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-100/50 px-2.5 py-1 rounded-lg border border-indigo-200 transition cursor-pointer"
            >
              Auto-Fill Demo Code
            </button>
          </div>

          {/* Timer and Resend */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              <span>Expires in:</span>
              <span className={`font-mono font-bold ${timeLeft < 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 90 || isLoading}
              className="text-indigo-600 hover:text-indigo-800 font-bold disabled:text-slate-400 transition cursor-pointer text-xs"
            >
              Resend Code
            </button>
          </div>

          {resendNotice && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-center font-medium animate-in fade-in">
              {resendNotice}
            </p>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={!isComplete || isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Authorizing with Issuing Bank...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Authenticate & Authorize</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
