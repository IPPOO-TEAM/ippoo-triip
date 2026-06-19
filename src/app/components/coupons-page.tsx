import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Ticket, Copy, Check, Clock, Zap,
  Percent, Tag
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { coupons, couponFilters, type CouponCategory } from "./coupons-data";
import { CouponTicket } from "./coupon-ticket";
import { toast } from "sonner";

export function CouponsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<CouponCategory>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const filtered = active === "all" ? coupons : coupons.filter((c) => c.category === active);
  const activeCoupons = filtered.filter((c) => !c.used);
  const usedCoupons = filtered.filter((c) => c.used);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative bg-[#F77F00] px-5 pt-14 pb-10 overflow-hidden rounded-b-[2rem]">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h2 className="text-white">Coupons & Promos</h2>
              <p className="text-orange-100 text-xs">Economisez sur vos courses et livraisons</p>
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <Ticket className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Promo code input */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-xl">
              <Tag className="w-4 h-4 text-orange-500" />
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Entrer un code promo"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-slate-400 uppercase tracking-wide"
              />
            </div>
            <button
              onClick={() => {
                if (promoCode.trim()) {
                  const found = coupons.find(c => c.code === promoCode.trim());
                  if (found) toast.success("Code valide !", { description: found.title });
                  else toast.error("Code invalide", { description: "Verifiez votre code promo" });
                } else {
                  toast.error("Entrez un code promo");
                }
              }}
              className="bg-white text-orange-500 px-5 rounded-2xl text-sm shadow-xl hover:bg-orange-50 transition active:scale-95"
            >
              Appliquer
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs border border-white/10">
              <Ticket className="w-3 h-3" /> {activeCoupons.length} actifs
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs border border-white/10">
              <Percent className="w-3 h-3" /> Jusqu'a 30%
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-1 border border-slate-100 overflow-x-auto scrollbar-hide">
          {couponFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all flex-1 justify-center ${
                active === f.id
                  ? "bg-gradient-to-r from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/25"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <f.icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons list */}
      <div className="px-5 mt-5">
        {activeCoupons.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800">Disponibles</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">{activeCoupons.length} coupons</span>
            </div>
            <div className="space-y-4">
              {activeCoupons.map((coupon) => (
                <CouponTicket key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </>
        )}

        {usedCoupons.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 mt-8">
              <h3 className="text-slate-400">Utilises</h3>
              <span className="text-xs text-slate-400">{usedCoupons.length}</span>
            </div>
            <div className="space-y-4 opacity-50">
              {usedCoupons.map((coupon) => (
                <CouponTicket key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-slate-400">Aucun coupon dans cette categorie</p>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}