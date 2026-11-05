import React from 'react';
import { CreditCard, Wifi, Shield, Sparkles, RefreshCw } from 'lucide-react';

export type CardBrand = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover' | 'generic';

interface InteractiveCardPreviewProps {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isFlipped: boolean;
  onFlipToggle?: () => void;
  brand?: CardBrand;
}

export const detectCardBrand = (digits: string): CardBrand => {
  const clean = digits.replace(/\s+/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(60|65|81|82|508)/.test(clean)) return 'rupay';
  if (/^(6011|65)/.test(clean)) return 'discover';
  return 'generic';
};

export const InteractiveCardPreview: React.FC<InteractiveCardPreviewProps> = ({
  cardNumber,
  cardholderName,
  expiryMonth,
  expiryYear,
  cvv,
  isFlipped,
  onFlipToggle,
  brand
}) => {
  const detectedBrand = brand || detectCardBrand(cardNumber);

  // Format card number with spaces for display
  const cleanNumber = cardNumber.replace(/\s+/g, '').padEnd(16, '•');
  const formattedDisplayNumber = cleanNumber
    .slice(0, 16)
    .match(/.{1,4}/g)
    ?.join(' ') || '•••• •••• •••• ••••';

  const displayName = cardholderName.trim() ? cardholderName.toUpperCase() : 'YOUR NAME HERE';
  const displayExpiry = `${expiryMonth.padStart(2, '•')}/${expiryYear ? expiryYear.slice(-2).padStart(2, '•') : '••'}`;
  const displayCvv = cvv ? cvv.padEnd(3, '•') : '•••';

  // Card theme gradients based on brand
  const getCardTheme = () => {
    switch (detectedBrand) {
      case 'mastercard':
        return 'from-slate-950 via-red-950 to-orange-950 border-orange-500/30';
      case 'rupay':
        return 'from-slate-950 via-teal-950 to-emerald-950 border-emerald-500/30';
      case 'amex':
        return 'from-slate-900 via-sky-950 to-blue-900 border-sky-400/30';
      case 'discover':
        return 'from-slate-950 via-amber-950 to-orange-900 border-amber-400/30';
      case 'visa':
      default:
        return 'from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/30';
    }
  };

  const renderBrandLogo = () => {
    switch (detectedBrand) {
      case 'mastercard':
        return (
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-red-500/90 shadow-sm" />
            <div className="w-6 h-6 rounded-full bg-amber-400/90 -ml-2.5 mix-blend-screen shadow-sm" />
          </div>
        );
      case 'rupay':
        return (
          <div className="flex items-center gap-1 font-black italic tracking-tighter text-sm">
            <span className="text-orange-500">Ru</span>
            <span className="text-emerald-400">Pay</span>
            <span className="text-[9px] not-italic px-1 py-0.2 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30 font-sans uppercase">
              India
            </span>
          </div>
        );
      case 'amex':
        return (
          <div className="px-2 py-0.5 bg-blue-600 rounded text-[11px] font-black tracking-widest text-white uppercase shadow-sm">
            AMEX
          </div>
        );
      case 'discover':
        return (
          <div className="font-black italic text-xs tracking-wider text-orange-400 flex items-center">
            DISC<span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block mx-0.5" />VER
          </div>
        );
      case 'visa':
      default:
        return (
          <div className="font-black italic tracking-widest text-lg bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
            VISA
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none perspective-[1000px]">
      <div
        className={`relative w-full max-w-sm h-48 sm:h-52 rounded-2xl p-5 text-white shadow-2xl transition-all duration-700 transform-style-3d border overflow-hidden cursor-pointer group bg-gradient-to-br ${getCardTheme()} ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={onFlipToggle}
        title="Click to flip card"
      >
        {/* Holographic light reflection sheen */}
        <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none group-hover:translate-x-12 transition-transform duration-1000" />
        
        {/* Background micro-pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        {/* ================= FRONT SIDE ================= */}
        <div
          className={`absolute inset-0 p-5 flex flex-col justify-between backface-hidden ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top Bar: Bank title & Network Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span className="text-[10px] tracking-widest font-black uppercase text-slate-300/80">
                Platinum Designer Card
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Demo Sandbox</span>
              {renderBrandLogo()}
            </div>
          </div>

          {/* Middle: EMV Chip & Contactless Wave */}
          <div className="flex items-center justify-between my-auto">
            {/* Realistic Golden Smart Chip */}
            <div className="relative w-11 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 border border-amber-200/50 shadow-md flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100 via-transparent to-transparent" />
              {/* Circuit lines */}
              <div className="w-full h-px bg-amber-800/40" />
              <div className="absolute inset-x-2 top-2 bottom-2 border border-amber-800/30 rounded-xs" />
              <div className="absolute left-1/2 inset-y-1 w-px bg-amber-800/40 -translate-x-1/2" />
            </div>

            {/* Contactless symbol */}
            <div className="flex items-center gap-1 text-slate-400/80">
              <Wifi size={18} className="rotate-90 text-slate-300" />
            </div>
          </div>

          {/* Card Number */}
          <div className="space-y-1">
            <div className="font-mono text-base sm:text-lg tracking-[0.2em] font-bold text-slate-100 drop-shadow-sm truncate">
              {formattedDisplayNumber}
            </div>
          </div>

          {/* Bottom Row: Cardholder Name & Expiry */}
          <div className="flex items-end justify-between pt-1 border-t border-white/10">
            <div className="max-w-[65%] min-w-0">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                Cardholder Name
              </span>
              <span className="text-xs font-bold text-slate-200 tracking-wider truncate block">
                {displayName}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">
                Valid Thru
              </span>
              <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                {displayExpiry}
              </span>
            </div>
          </div>
        </div>

        {/* ================= BACK SIDE ================= */}
        <div
          className={`absolute inset-0 p-5 flex flex-col justify-between backface-hidden rotate-y-180 ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Magnetic Stripe */}
          <div className="-mx-5 -mt-5 h-11 bg-slate-900 border-b border-slate-800 relative shadow-inner">
            <div className="w-full h-2 bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-2 opacity-50" />
          </div>

          {/* Signature Strip & CVV Box */}
          <div className="space-y-1 my-auto">
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-1">
              <span>Authorized Signature</span>
              <span>Security Code (CVV)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Signature panel */}
              <div className="flex-1 h-8 bg-slate-100 rounded-sm px-3 flex items-center font-serif italic text-slate-700 text-xs shadow-inner overflow-hidden select-none">
                <span className="opacity-75">{displayName}</span>
              </div>
              {/* CVV Box */}
              <div className="w-14 h-8 bg-white rounded-sm flex items-center justify-center font-mono font-bold text-slate-900 text-sm shadow-inner border border-slate-300">
                {displayCvv}
              </div>
            </div>
          </div>

          {/* Disclaimer & Hologram */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[8px] text-slate-400 leading-tight">
            <div className="max-w-[70%]">
              <p>Demo payment simulation environment. No real funds are transferred or deducted.</p>
              <p className="text-slate-500 font-mono mt-0.5">24/7 Sandbox Support: 1800-DEMO-PAY</p>
            </div>
            <div className="p-1.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-teal-400 rounded-full shadow-inner opacity-80 flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Flip Hint Button */}
      <button
        type="button"
        onClick={onFlipToggle}
        className="mt-2.5 text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-full hover:bg-slate-100"
      >
        <RefreshCw size={12} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
        <span>{isFlipped ? 'Flip to Front (Card Details)' : 'Flip to Back (CVV & Signature)'}</span>
      </button>
    </div>
  );
};
