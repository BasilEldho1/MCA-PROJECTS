import React, { useState, useEffect } from 'react';
import {
  Professional,
  ChatPricingPlan,
  PaidChatSession,
  PaymentTransaction,
  DemoCardChargePayload,
  DemoCardChargeResponse
} from '../../types/floorplan';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DemoCardPaymentForm } from './DemoCardPaymentForm';
import { OtpChallengeModal } from './OtpChallengeModal';
import { PaymentReceiptCard } from './PaymentReceiptCard';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Zap,
  Check,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  professional: Professional | null;
  onClose: () => void;
  onPaymentSuccess: (session: PaidChatSession, conversationId: string) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  professional,
  onClose,
  onPaymentSuccess
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'card' | 'quick-sandbox' | 'razorpay'>('card');
  const [pricingPlans, setPricingPlans] = useState<ChatPricingPlan[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'checkout' | 'success' | 'failed'>('checkout');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successData, setSuccessData] = useState<{
    payment?: PaymentTransaction;
    session?: PaidChatSession;
    conversationId?: string;
    receipt?: any;
  } | null>(null);

  // 3D Secure Challenge State
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
    amount: 209,
    currency: 'INR',
    cardBrand: 'VISA',
    cardLast4: '4242',
    maskedPhone: '+91 ******8821',
    pendingPayload: null
  });
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');

  // Load latest pricing when modal opens
  useEffect(() => {
    if (!isOpen || !professional) return;

    setStep('checkout');
    setErrorMessage('');
    setSuccessData(null);
    setOtpChallenge({
      isOpen: false,
      amount: 209,
      currency: 'INR',
      cardBrand: 'VISA',
      cardLast4: '4242',
      maskedPhone: '+91 ******8821',
      pendingPayload: null
    });

    const fetchPricing = async () => {
      setLoadingPricing(true);
      try {
        const proId = professional.id || (professional as any)._id;
        const res = await api.getProPricing(proId);
        if (res.chatPricing && res.chatPricing.length > 0) {
          setPricingPlans(res.chatPricing);
          setSelectedDuration(res.chatPricing[0].durationMinutes);
        } else {
          const defaults: ChatPricingPlan[] = [
            { durationMinutes: 30, price: 199, label: '30 Minutes' },
            { durationMinutes: 60, price: 349, label: '60 Minutes' }
          ];
          setPricingPlans(defaults);
          setSelectedDuration(30);
        }
      } catch (err) {
        console.warn('Could not fetch professional pricing, using defaults:', err);
        const defaults: ChatPricingPlan[] = [
          { durationMinutes: 30, price: 199, label: '30 Minutes' },
          { durationMinutes: 60, price: 349, label: '60 Minutes' }
        ];
        setPricingPlans(defaults);
        setSelectedDuration(30);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [isOpen, professional]);

  if (!isOpen || !professional) return null;

  const currentPlan = pricingPlans.find(p => p.durationMinutes === selectedDuration) || {
    durationMinutes: selectedDuration,
    price: selectedDuration === 60 ? 349 : 199
  };

  const chatFee = currentPlan.price;
  const serviceFee = 10;
  const totalAmount = chatFee + serviceFee;

  // Handle Demo Card Success
  const handleDemoCardSuccess = (res: DemoCardChargeResponse) => {
    if (res.alreadyActive) {
      setSuccessData({
        session: res.session,
        conversationId: res.conversationId
      });
      setStep('success');
      return;
    }

    setSuccessData({
      payment: res.payment,
      session: res.session || res.chatSession,
      conversationId: res.conversationId,
      receipt: res.receipt
    });
    setStep('success');
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 } });
    } catch {}
  };

  // Handle Request 3D Secure Challenge
  const handleRequestOtp = (challengeData: {
    amount: number;
    currency: string;
    cardBrand: string;
    cardLast4: string;
    maskedPhone: string;
    pendingPayload: DemoCardChargePayload;
  }) => {
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

  // Submit OTP to complete 3D Secure flow
  const handleVerifyOtp = async (otpCode: string) => {
    if (!otpChallenge.pendingPayload) return;
    setOtpLoading(true);
    setOtpError('');

    try {
      const payload: DemoCardChargePayload = {
        ...otpChallenge.pendingPayload,
        otp: otpCode
      };

      const res = await api.chargeDemoCard(payload);
      if (res.success) {
        setOtpChallenge(prev => ({ ...prev, isOpen: false }));
        handleDemoCardSuccess(res);
      } else {
        setOtpError(res.message || res.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Dynamically load Razorpay SDK
  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch Live or Sandbox Razorpay Popup
  const handlePayWithRazorpay = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      const proId = professional.id || (professional as any)._id;
      const orderData = await api.createPaymentOrder(proId, selectedDuration);

      if ((orderData as any).alreadyActive) {
        setSuccessData({
          session: (orderData as any).session,
          conversationId: (orderData as any).conversationId
        });
        setStep('success');
        setProcessing(false);
        return;
      }

      const isLoaded = await loadRazorpaySDK();

      if (!isLoaded || !(window as any).Razorpay) {
        await handleTestPaymentSimulation(orderData.gatewayOrderId, orderData.paymentRecordId);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency || 'INR',
        name: '3D Floor Plan Designer',
        description: `${selectedDuration} Min Consultation with ${professional.name}`,
        order_id: orderData.gatewayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.verifyPayment({
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
              paymentId: orderData.paymentRecordId
            });

            if (verifyRes.success) {
              setSuccessData({
                payment: verifyRes.payment,
                session: verifyRes.chatSession,
                conversationId: verifyRes.conversationId
              });
              setStep('success');
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification failed.');
              setStep('failed');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Failed to verify payment with server.');
            setStep('failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || 'Homeowner',
          email: user?.email || 'user@example.com',
          contact: user?.phone || '9999999999'
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: any) {
        setErrorMessage(resp.error?.description || 'Gateway transaction failed.');
        setStep('failed');
        setProcessing(false);
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Failed to initiate checkout order.');
      setStep('failed');
      setProcessing(false);
    }
  };

  // Instant Sandbox Simulator (1-click test)
  const handleTestPaymentSimulation = async (orderIdOverride?: string, paymentRecordIdOverride?: string) => {
    setProcessing(true);
    setErrorMessage('');

    try {
      const proId = professional.id || (professional as any)._id;
      let orderId = orderIdOverride;
      let paymentRecordId = paymentRecordIdOverride;

      if (!orderId) {
        const orderData = await api.createPaymentOrder(proId, selectedDuration);
        if ((orderData as any).alreadyActive) {
          setSuccessData({
            session: (orderData as any).session,
            conversationId: (orderData as any).conversationId
          });
          setStep('success');
          setProcessing(false);
          return;
        }
        orderId = orderData.gatewayOrderId;
        paymentRecordId = orderData.paymentRecordId;
      }

      const mockPaymentId = `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mockSignature = `sim_sig_${Date.now()}`;

      const verifyRes = await api.verifyPayment({
        gatewayOrderId: orderId!,
        gatewayPaymentId: mockPaymentId,
        gatewaySignature: mockSignature,
        paymentId: paymentRecordId
      });

      if (verifyRes.success) {
        setSuccessData({
          payment: verifyRes.payment,
          session: verifyRes.chatSession,
          conversationId: verifyRes.conversationId
        });
        setStep('success');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 } });
      } else {
        setErrorMessage(verifyRes.message || 'Simulation verification failed.');
        setStep('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sandbox payment simulation failed.');
      setStep('failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
        <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Book Paid Chat Consultation</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                    Demo Card System
                  </span>
                </h2>
                <p className="text-slate-500 text-[11px]">
                  Direct 1-on-1 consultation with verified professional
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {step === 'checkout' && (
              <>
                {/* Professional Summary Card */}
                <div className="p-3.5 bg-slate-50 border border-emerald-100/80 rounded-2xl flex items-center gap-3.5">
                  <img
                    src={professional.profileImage}
                    alt={professional.name}
                    className="w-13 h-13 rounded-2xl object-cover border border-emerald-300 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-slate-900 text-sm truncate">{professional.name}</h3>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">
                        <ShieldCheck size={11} />
                        <span>Verified</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 truncate">
                      {professional.specialization}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {professional.experience} Experience • Rating {professional.rating.toFixed(1)} ★
                    </p>
                  </div>
                </div>

                {/* Consultation Duration Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-600" />
                      <span>Select Chat Duration</span>
                    </span>
                    {loadingPricing && <span className="text-[10px] text-slate-400">Loading plans...</span>}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {pricingPlans.map(plan => {
                      const isSelected = selectedDuration === plan.durationMinutes;
                      return (
                        <button
                          key={plan.durationMinutes}
                          type="button"
                          onClick={() => setSelectedDuration(plan.durationMinutes)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-xs">
                              {plan.label || `${plan.durationMinutes} Minutes`}
                            </span>
                            {isSelected && <Check size={14} className="text-emerald-600" />}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              ₹{plan.price}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">INR</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown Bill */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Professional Consultation Fee ({selectedDuration} mins)</span>
                    <span className="font-mono font-bold text-slate-900">₹{chatFee}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Platform Secure Processing Fee</span>
                    <span className="font-mono font-bold text-slate-900">₹{serviceFee}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-700 text-base font-mono">₹{totalAmount}</span>
                  </div>
                </div>

                {/* Payment Method Switcher Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('card')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'card'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Demo Card Payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('quick-sandbox')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'quick-sandbox'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Zap size={14} className="text-amber-500" />
                      <span>1-Click Sandbox</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('razorpay')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'razorpay'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Globe size={14} />
                      <span>Razorpay</span>
                    </button>
                  </div>

                  {/* TAB 1: DEMO CARD PAYMENT */}
                  {activeTab === 'card' && (
                    <div className="pt-1">
                      <DemoCardPaymentForm
                        amount={totalAmount}
                        currency="INR"
                        professionalId={professional.id || (professional as any)._id}
                        durationMinutes={selectedDuration}
                        onSuccess={handleDemoCardSuccess}
                        onRequestOtp={handleRequestOtp}
                        isProcessing={processing}
                        setIsProcessing={setProcessing}
                      />
                    </div>
                  )}

                  {/* TAB 2: QUICK 1-CLICK SANDBOX */}
                  {activeTab === 'quick-sandbox' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                      <div className="p-2.5 bg-amber-100 text-amber-700 w-11 h-11 rounded-2xl flex items-center justify-center mx-auto">
                        <Zap size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900">Instant Sandbox Simulator</h4>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Instantly verifies and activates the paid consultation session without filling card details.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestPaymentSimulation()}
                        disabled={processing}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" />
                            <span>Simulating Verification...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} className="text-amber-400" />
                            <span>Instant Approve & Start Consultation (₹{totalAmount})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* TAB 3: RAZORPAY GATEWAY */}
                  {activeTab === 'razorpay' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 w-11 h-11 rounded-2xl flex items-center justify-center mx-auto">
                        <CreditCard size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900">Razorpay Gateway Test Mode</h4>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Opens the standard external Razorpay checkout dialog (requires active internet connection).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePayWithRazorpay}
                        disabled={processing}
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" />
                            <span>Connecting Razorpay...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={14} />
                            <span>Launch Razorpay Popup (₹{totalAmount})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: SUCCESS VIEW */}
            {step === 'success' && successData && (
              <div className="py-4 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm animate-bounce">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Payment Verified Successfully!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your paid consultation session with <span className="font-bold text-slate-800">{professional.name}</span> is now active.
                  </p>
                </div>

                {/* Digital Receipt Card */}
                {successData.receipt ? (
                  <PaymentReceiptCard
                    receipt={successData.receipt}
                    professionalName={professional.name}
                    durationMinutes={selectedDuration}
                  />
                ) : (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left space-y-2 text-xs text-emerald-950">
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Duration:</span>
                      <span className="font-bold">{successData.session?.durationMinutes || selectedDuration} Minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Session Status:</span>
                      <span className="font-mono font-bold text-emerald-600">ACTIVE ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Total Paid:</span>
                      <span className="font-mono font-bold">₹{totalAmount}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (successData.session && successData.conversationId) {
                      onPaymentSuccess(successData.session, successData.conversationId);
                    }
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>Open Paid Chat Window</span>
                </button>
              </div>
            )}

            {/* STEP 3: FAILED VIEW */}
            {step === 'failed' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-300 shadow-sm">
                  <AlertCircle size={36} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Payment Failed</h3>
                  <p className="text-xs text-rose-600 max-w-sm mx-auto">
                    {errorMessage || 'The gateway transaction was not completed or signature could not be verified.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={13} />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D Secure Bank Challenge Modal */}
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
    </>
  );
};
