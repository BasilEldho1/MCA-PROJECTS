import React, { useState, useEffect } from 'react';
import { InteractiveCardPreview, detectCardBrand, CardBrand } from './InteractiveCardPreview';
import { DemoTestCard, DemoCardChargePayload, DemoCardChargeResponse } from '../../types/floorplan';
import { api } from '../../services/api';
import {
  CreditCard,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

interface DemoCardPaymentFormProps {
  amount: number;
  currency?: string;
  professionalId?: string;
  durationMinutes?: number;
  onSuccess: (res: DemoCardChargeResponse) => void;
  onRequestOtp: (challengeData: {
    amount: number;
    currency: string;
    cardBrand: string;
    cardLast4: string;
    maskedPhone: string;
    pendingPayload: DemoCardChargePayload;
  }) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const DemoCardPaymentForm: React.FC<DemoCardPaymentFormProps> = ({
  amount,
  currency = 'INR',
  professionalId,
  durationMinutes = 30,
  onSuccess,
  onRequestOtp,
  isProcessing,
  setIsProcessing
}) => {
  const [testCards, setTestCards] = useState<DemoTestCard[]>([]);
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardholderName, setCardholderName] = useState<string>('ALEX MORGAN');
  const [expiryMonth, setExpiryMonth] = useState<string>('12');
  const [expiryYear, setExpiryYear] = useState<string>('28');
  const [cvv, setCvv] = useState<string>('123');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [enable3DS, setEnable3DS] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('instant_visa');

  // Load test cards catalog from server
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.getDemoCards();
        if (res.cards && res.cards.length > 0) {
          setTestCards(res.cards);
        }
      } catch (err) {
        // Fallback default test presets
        setTestCards([
          {
            id: 'instant_visa',
            label: 'Visa (Instant Approval)',
            number: '4242 4242 4242 4242',
            exp: '12/28',
            cvv: '123',
            holder: 'ALEX MORGAN',
            brand: 'visa',
            scenario: 'Instant authorization',
            badge: 'SUCCESS'
          },
          {
            id: 'mastercard_3ds',
            label: 'Mastercard (3DS OTP)',
            number: '5555 5555 5555 4444',
            exp: '08/29',
            cvv: '456',
            holder: 'SOPHIA CHEN',
            brand: 'mastercard',
            scenario: 'Requires 3D Secure OTP',
            badge: '3DS OTP'
          },
          {
            id: 'rupay_debit',
            label: 'RuPay Debit (India)',
            number: '6072 1234 5678 9010',
            exp: '11/27',
            cvv: '789',
            holder: 'PRIYA SHARMA',
            brand: 'rupay',
            scenario: 'Zero surcharge card',
            badge: 'DOMESTIC'
          },
          {
            id: 'amex_gold',
            label: 'Amex Gold',
            number: '3782 822468 00005',
            exp: '05/30',
            cvv: '1234',
            holder: 'MARCUS VANCE',
            brand: 'amex',
            scenario: '15-digit card',
            badge: 'PREMIUM'
          },
          {
            id: 'decline_funds',
            label: 'Declined (Funds)',
            number: '4000 0000 0000 0002',
            exp: '06/28',
            cvv: '999',
            holder: 'TEST USER',
            brand: 'visa',
            scenario: 'Simulates insufficient funds',
            badge: 'DECLINE'
          }
        ]);
      }
    };

    fetchCatalog();
  }, []);

  const handleSelectPreset = (card: DemoTestCard) => {
    setSelectedPresetId(card.id);
    setCardNumber(card.number);
    setCardholderName(card.holder);
    const [m, y] = card.exp.split('/');
    setExpiryMonth(m || '12');
    setExpiryYear(y || '28');
    setCvv(card.cvv);
    setIsFlipped(false);
    setErrorMessage('');
    if (card.id === 'mastercard_3ds') {
      setEnable3DS(true);
    } else {
      setEnable3DS(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    // Group in 4s
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
    setSelectedPresetId('');
    setErrorMessage('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) {
      const m = clean.slice(0, 2);
      const y = clean.slice(2);
      setExpiryMonth(m);
      setExpiryYear(y);
    } else {
      setExpiryMonth(clean);
      setExpiryYear('');
    }
    setErrorMessage('');
  };

  const detectedBrand = detectCardBrand(cardNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      setErrorMessage('Please enter a valid card number (at least 13 digits).');
      return;
    }
    if (!cardholderName.trim()) {
      setErrorMessage('Please enter the name on the card.');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      setErrorMessage('Please enter card expiration date (MM/YY).');
      return;
    }
    if (cvv.length < 3) {
      setErrorMessage('Please enter a valid 3 or 4-digit CVV.');
      return;
    }

    const payload: DemoCardChargePayload = {
      cardNumber: cleanCard,
      cardholderName: cardholderName.trim(),
      expiryMonth,
      expiryYear,
      cvv,
      professionalId,
      durationMinutes,
      amount,
      require3DS: enable3DS
    };

    setIsProcessing(true);

    try {
      const res = await api.chargeDemoCard(payload);

      // Issuing bank triggered 3D-Secure challenge
      if (res.requires3DS) {
        setIsProcessing(false);
        onRequestOtp({
          amount,
          currency,
          cardBrand: res.cardBrand || detectedBrand.toUpperCase(),
          cardLast4: res.cardLast4 || cleanCard.slice(-4),
          maskedPhone: res.maskedPhone || '+91 ******8821',
          pendingPayload: payload
        });
        return;
      }

      if (res.success) {
        onSuccess(res);
      } else {
        setErrorMessage(res.message || res.error || 'Card transaction was not approved.');
      }
    } catch (err: any) {
      console.error('Card charge error:', err);
      setErrorMessage(err.message || 'Payment processing failed. Please try a different test card.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick Test Cards Presets Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
            <Zap size={13} className="text-amber-500 fill-amber-500" />
            <span>Select Demo Card Preset</span>
          </label>
          <span className="text-[10px] text-slate-400">1-Click Auto Fill</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {testCards.map(card => {
            const isSelected = selectedPresetId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelectPreset(card)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{card.label}</span>
                {card.badge === 'SUCCESS' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {card.badge === '3DS OTP' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
                {card.badge === 'DECLINE' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Realistic Interactive Card Preview */}
      <InteractiveCardPreview
        cardNumber={cardNumber}
        cardholderName={cardholderName}
        expiryMonth={expiryMonth}
        expiryYear={expiryYear}
        cvv={cvv}
        isFlipped={isFlipped}
        onFlipToggle={() => setIsFlipped(!isFlipped)}
        brand={detectedBrand}
      />

      {/* Card Details Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Card Number Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Card Number</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {detectedBrand.toUpperCase()} Network
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={handleCardNumberChange}
              onFocus={() => setIsFlipped(false)}
              disabled={isProcessing}
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition shadow-xs"
            />
            <CreditCard size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <div className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 text-slate-700">
              {detectedBrand}
            </div>
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="JOHN DOE"
            value={cardholderName}
            onChange={e => {
              setCardholderName(e.target.value.toUpperCase());
              setSelectedPresetId('');
              setErrorMessage('');
            }}
            onFocus={() => setIsFlipped(false)}
            disabled={isProcessing}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none uppercase transition shadow-xs tracking-wider"
          />
        </div>

        {/* Expiry Date & CVV */}
        <div className="grid grid-cols-2 gap-3">
          {/* Expiry */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Expires (MM/YY)
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiryMonth || expiryYear ? `${expiryMonth}${expiryYear ? '/' + expiryYear : ''}` : ''}
              onChange={handleExpiryChange}
              onFocus={() => setIsFlipped(false)}
              maxLength={5}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition shadow-xs text-center"
            />
          </div>

          {/* CVV */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Security (CVV)</span>
              <span className="text-[10px] text-slate-400 font-normal">3-4 digits</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="123"
              value={cvv}
              onChange={e => {
                setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                setSelectedPresetId('');
                setErrorMessage('');
              }}
              onFocus={() => setIsFlipped(true)}
              maxLength={4}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition shadow-xs text-center tracking-widest"
            />
          </div>
        </div>

        {/* 3D-Secure Simulation Checkbox */}
        <label className="flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-200/60 rounded-xl text-xs text-indigo-950 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enable3DS}
            onChange={e => setEnable3DS(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div className="flex-1">
            <span className="font-bold block">Simulate 3D-Secure Bank OTP Challenge</span>
            <span className="text-[10px] text-indigo-700/80">
              Opens bank verification modal (Demo OTP: 123456)
            </span>
          </div>
          <Shield size={16} className="text-indigo-600" />
        </label>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Transaction Not Approved</p>
              <p className="text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Authorizing Demo Card ({currency === 'INR' ? '₹' : '$'}{amount})...</span>
            </>
          ) : (
            <>
              <Lock size={15} />
              <span>Pay {currency === 'INR' ? '₹' : '$'}{amount} with Demo Card</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>

        {/* Security Footnote */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock size={11} className="text-emerald-600" />
          <span>Demo Card Sandbox • AES-256 Mock Encrypted • No Real Money Deducted</span>
        </div>
      </form>
    </div>
  );
};
