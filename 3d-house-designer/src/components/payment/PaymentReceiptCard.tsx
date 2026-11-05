import React from 'react';
import { ShieldCheck, CheckCircle2, Download, Printer, Copy, Check, Sparkles } from 'lucide-react';

interface PaymentReceiptProps {
  receipt: {
    receiptNumber: string;
    transactionId: string;
    gatewayPaymentId?: string;
    authCode?: string;
    amount: number;
    currency: string;
    cardBrand?: string;
    cardLast4?: string;
    cardholderName?: string;
    timestamp: string;
    paymentStatus?: string;
    method?: string;
  };
  professionalName?: string;
  durationMinutes?: number;
  onPrint?: () => void;
}

export const PaymentReceiptCard: React.FC<PaymentReceiptProps> = ({
  receipt,
  professionalName,
  durationMinutes = 30,
  onPrint
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-3 font-sans relative overflow-hidden">
      {/* Watermark badge */}
      <div className="absolute -right-4 -bottom-4 text-slate-200/40 font-black text-6xl select-none pointer-events-none uppercase tracking-tighter">
        PAID
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-[11px] block">Official Digital Receipt</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(receipt.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-full border border-emerald-300">
          APPROVED ✓
        </span>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 block text-[10px]">Transaction ID</span>
          <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
            <span className="truncate">{receipt.transactionId}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Copy Transaction ID"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">Auth Code</span>
          <span className="font-mono font-bold text-slate-800">{receipt.authCode || 'AUTH-942811'}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">Payment Method</span>
          <span className="font-bold text-slate-800 uppercase">
            {receipt.cardBrand || 'VISA'} •••• {receipt.cardLast4 || '4242'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">Cardholder</span>
          <span className="font-bold text-slate-800 uppercase truncate block">
            {receipt.cardholderName || 'AUTHORIZED CLIENT'}
          </span>
        </div>

        {professionalName && (
          <div className="col-span-2 pt-1 border-t border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Consultation Session</span>
            <span className="font-bold text-slate-800">
              {durationMinutes} Min Session with {professionalName}
            </span>
          </div>
        )}
      </div>

      {/* Total Amount Pill */}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
        <span className="font-bold text-slate-600 text-xs">Total Amount Paid:</span>
        <span className="font-black text-emerald-700 text-sm">
          {receipt.currency === 'INR' ? '₹' : '$'}{receipt.amount}.00
        </span>
      </div>

      {/* Print / Save button */}
      <div className="pt-1 flex items-center justify-end gap-2 text-[10px]">
        <button
          type="button"
          onClick={handleNativePrint}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
        >
          <Printer size={11} />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  );
};
