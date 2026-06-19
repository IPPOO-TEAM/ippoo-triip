import { useState } from "react";
import { Copy, Check, Clock, Zap } from "lucide-react";
import { AfricanPattern } from "./icons";
import type { Coupon } from "./coupons-data";

export function CouponTicket({ coupon, compact = false }: { coupon: Coupon; compact?: boolean }) {
  const Icon = coupon.icon;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative flex overflow-hidden rounded-2xl shadow-sm bg-white border border-slate-100 active:scale-[0.99] transition-transform ${compact ? "min-w-[310px] flex-shrink-0" : ""}`}>
      {/* Left discount section */}
      <div className={`relative w-[110px] flex-shrink-0 bg-gradient-to-br ${coupon.gradient} flex flex-col items-center justify-center p-4 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
        </div>
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-white text-xl tracking-tight" style={{ fontFamily: "'Space Grotesk', monospace" }}>{coupon.discount}</p>
          <p className="text-white/60 text-[9px] uppercase tracking-widest mt-0.5">
            {coupon.discountType === "percent" ? "reduction" : "bonus"}
          </p>
        </div>
      </div>

      {/* Perforation */}
      <div className="absolute left-[104px] top-0 bottom-0 flex flex-col justify-between z-20 pointer-events-none" style={{ width: 12 }}>
        <div className="w-6 h-6 rounded-full bg-white -mt-3 -ml-3" />
        <div className="flex-1 flex flex-col items-center justify-center gap-[6px] py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-[2px] h-[6px] bg-slate-200 rounded-full" />
          ))}
        </div>
        <div className="w-6 h-6 rounded-full bg-white -mb-3 -ml-3" />
      </div>

      {/* Right content */}
      <div className="flex-1 p-4 pl-5 flex flex-col justify-between min-h-[130px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-slate-800 truncate">{coupon.title}</p>
            {coupon.isNew && <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">NOUVEAU</span>}
            {coupon.isHot && <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">HOT</span>}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{coupon.description}</p>
          {coupon.minAmount && <p className="text-[10px] text-slate-300 mt-1">Min. {coupon.minAmount} FCFA</p>}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={coupon.used}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                copied ? "bg-emerald-50 text-emerald-600" : coupon.used ? "bg-slate-50 text-slate-300" : "bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95"
              }`}
            >
              {copied ? <><Check className="w-3 h-3" /> Copie !</> : <><Copy className="w-3 h-3" /> {coupon.code}</>}
            </button>
            {coupon.usageLeft && !coupon.used && (
              <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                <Zap className="w-3 h-3" /> {coupon.usageLeft}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-300">
            <Clock className="w-3 h-3" /> {coupon.validUntil}
          </div>
        </div>
      </div>

      {coupon.used && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-slate-600/80 text-white px-5 py-1.5 rounded-xl text-xs -rotate-12 shadow-lg tracking-widest uppercase">
            Utilise
          </div>
        </div>
      )}
    </div>
  );
}