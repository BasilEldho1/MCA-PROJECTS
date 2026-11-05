import React, { useState, useEffect } from 'react';
import { DemoCardPaymentForm } from './DemoCardPaymentForm';
import { OtpChallengeModal } from './OtpChallengeModal';
import { PaymentReceiptCard } from './PaymentReceiptCard';
import {
  DemoTestCard,
  DemoCardChargePayload,
  DemoCardChargeResponse,
  PaymentTransaction
} from '../../types/floorplan';
import { api } from '../../services/api';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  RefreshCw,
  Terminal,
  Receipt,
  ArrowRight,
  Sliders,
  DollarSign,
  Lock,
  History,
  Shield,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DemoPaymentSandboxViewProps {
  onBackToDashboard?: () => void;
}

export const DemoPaymentSandboxView: React.FC<DemoPaymentSandboxViewProps> = ({
  onBackToDashboard
}) => {
  const [amount, setAmount] = useState<number>(299);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { time: new Date().toLocaleTimeString(), message: 'Payment Sandbox initialized and ready.', type: 'info' },
    { time: new Date().toLocaleTimeString(), message: 'Gateway connected: Demo Card Engine (v2.4).', type: 'info' }
  ]);
  const [userTransactions, setUserTransactions] = useState<PaymentTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);

  // 3DS Challenge
  const [otpChallenge, setOtpChallenge] = useState<{
    isOpen: boolean;
    amount: number;
    currency: string;
    cardBrand: string;
    cardLast4: string;
    maskedPhone: string;
    pendingPayload: DemoCardChargePayload | null;
  }>({
    isOpen: false,
    amount: 299,
    currency: 'INR',
    cardBrand: 'VISA',
    cardLast4: '4242',
    maskedPhone: '+91 ******8821',
    pendingPayload: null
  });
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 40)
    ]);
  };

  const fetchHistory = async () => {
    setLoadingTransactions(true);
    try {
      const res = await api.getUserPayments();
      if (res.payments) {
        setUserTransactions(res.payments);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePaymentSuccess = (res: DemoCardChargeResponse) => {
    addLog(`Transaction APPROVED! ID: ${res.receipt?.transactionId || res.payment?.paymentId}`, 'success');
    addLog(`Card: ${res.receipt?.cardBrand || 'CARD'} •••• ${res.receipt?.cardLast4 || '4242'} | Auth: ${res.receipt?.authCode}`, 'success');
    setRecentReceipt(res.receipt);
    try {
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.3 } });
    } catch {}
    fetchHistory();
  };

  const handleRequestOtp = (challengeData: {
    amount: number;
    currency: string;
    cardBrand: string;
    cardLast4: string;
    maskedPhone: string;
    pendingPayload: DemoCardChargePayload;
  }) => {
    addLog(`Issuing bank triggered 3D-Secure 2.0 OTP challenge for ${challengeData.cardBrand} •••• ${challengeData.cardLast4}`, 'warn');
    setOtpChallenge({
      isOpen: true,
      amount: challengeData.amount,
      currency: challengeData.currency,
      cardBrand: challengeData.cardBrand,
      cardLast4: challengeData.cardLast4,
      maskedPhone: challengeData.maskedPhone,
      pendingPayload: challengeData.pendingPayload
    });
    setOtpError('');
  };

  const handleVerifyOtp = async (otpCode: string) => {
    if (!otpChallenge.pendingPayload) return;
    setOtpLoading(true);
    setOtpError('');
    addLog(`Verifying 3D-Secure OTP: ${otpCode}...`, 'info');

    try {
      const payload: DemoCardChargePayload = {
        ...otpChallenge.pendingPayload,
        otp: otpCode
      };

      const res = await api.chargeDemoCard(payload);
      if (res.success) {
        setOtpChallenge(prev => ({ ...prev, isOpen: false }));
        handlePaymentSuccess(res);
      } else {
        setOtpError(res.message || res.error || 'Invalid OTP code.');
        addLog(`3D-Secure verification failed: ${res.message || res.error}`, 'error');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed.');
      addLog(`3D-Secure exception: ${err.message}`, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Demo Card Payment Sandbox
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Live Gateway Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive credit & debit card authorization test center with 3D Secure simulation
              </p>
            </div>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payment Form & Config */}
        <div className="lg:col-span-7 space-y-5">
          {/* Amount & Currency Config Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                <span>Test Transaction Amount</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    currency === 'INR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    currency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="grid grid-cols-4 gap-2">
              {[99, 299, 499, 1499].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    amount === val
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {currency === 'INR' ? '₹' : '$'}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Main Payment Form Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
            <DemoCardPaymentForm
              amount={amount}
              currency={currency}
              durationMinutes={30}
              onSuccess={handlePaymentSuccess}
              onRequestOtp={handleRequestOtp}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        </div>

        {/* Right Column: Digital Receipt, Live Logs & History */}
        <div className="lg:col-span-5 space-y-5">
          {/* Latest Receipt Card */}
          {recentReceipt && (
            <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-5 space-y-3 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Transaction Successful</span>
                </span>
                <button
                  type="button"
                  onClick={() => setRecentReceipt(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <PaymentReceiptCard receipt={recentReceipt} />
            </div>
          )}

          {/* Live Gateway Terminal Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Gateway Audit Log
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE (14ms)</span>
              </span>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 h-52 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-800/80">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.type === 'error'
                        ? 'text-rose-400 font-bold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Database Payments List */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={15} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Recent Payment Records
                </span>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                disabled={loadingTransactions}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw size={13} className={loadingTransactions ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {userTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No transactions recorded yet.</p>
              ) : (
                userTransactions.slice(0, 6).map(p => (
                  <div
                    key={p.paymentId || p._id}
                    className="p-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-200">
                          {p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4 || '4242'}` : p.paymentId}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString()} at{' '}
                        {new Date(p.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{p.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Secure Modal */}
      <OtpChallengeModal
        isOpen={otpChallenge.isOpen}
        amount={otpChallenge.amount}
        currency={otpChallenge.currency}
        cardBrand={otpChallenge.cardBrand}
        cardLast4={otpChallenge.cardLast4}
        maskedPhone={otpChallenge.maskedPhone}
        onVerify={handleVerifyOtp}
        onCancel={() => setOtpChallenge(prev => ({ ...prev, isOpen: false }))}
        isLoading={otpLoading}
        errorMessage={otpError}
      />
    </div>
  );
};
