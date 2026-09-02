import { useState } from "react";
import { Ticket, Percent, Tag } from "lucide-react";
import { coupons, couponFilters, type CouponCategory } from "./coupons-data";
import { CouponTicket } from "./coupon-ticket";
import { toast } from "sonner";
import { M3Page, SectionHeader, M3Card, EmptyState } from "./m3";

export function CouponsPage() {
  const [active, setActive] = useState<CouponCategory>("all");
  const [promoCode, setPromoCode] = useState("");

  const filtered = active === "all" ? coupons : coupons.filter((c) => c.category === active);
  const activeCoupons = filtered.filter((c) => !c.used);
  const usedCoupons = filtered.filter((c) => c.used);

  const applyCode = () => {
    if (promoCode.trim()) {
      const found = coupons.find(c => c.code === promoCode.trim());
      if (found) toast.success("Code valide !", { description: found.title });
      else toast.error("Code invalide", { description: "Verifiez votre code promo" });
    } else {
      toast.error("Entrez un code promo");
    }
  };

  const Hero = (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
          <Tag className="h-4 w-4 text-[var(--m3-primary)]" />
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Entrer un code promo"
            className="flex-1 bg-transparent text-sm uppercase tracking-wide text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={applyCode}
          className="rounded-full bg-white px-5 text-sm font-semibold text-[var(--m3-primary)] shadow-sm transition active:scale-95"
        >
          Appliquer
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-xs text-[var(--m3-on-primary)] backdrop-blur-md">
          <Ticket className="h-3 w-3" /> {activeCoupons.length} actifs
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-xs text-[var(--m3-on-primary)] backdrop-blur-md">
          <Percent className="h-3 w-3" /> Jusqu'a 30%
        </div>
      </div>
    </div>
  );

  return (
    <M3Page
      title="Coupons & Promos"
      subtitle="Economisez sur vos courses et livraisons"
      icon={Ticket}
      hero={Hero}
    >
      <div className="mx-auto max-w-md">
        {/* Filtres */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {couponFilters.map((f) => {
            const on = active === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold transition"
                style={on
                  ? { background: "var(--m3-primary)", color: "var(--m3-on-primary)" }
                  : { background: "var(--m3-container)", color: "var(--m3-primary)" }}
              >
                <f.icon className="h-3.5 w-3.5" /> {f.label}
              </button>
            );
          })}
        </div>

        {/* Coupons list */}
        {activeCoupons.length > 0 && (
          <>
            <SectionHeader
              title="Disponibles"
              icon={Ticket}
              action={<span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>{activeCoupons.length} coupons</span>}
            />
            <div className="space-y-4">
              {activeCoupons.map((coupon, i) => (
                <M3Card key={coupon.id} delay={i * 0.05} className="!p-0 !border-0 !bg-transparent !shadow-none">
                  <CouponTicket coupon={coupon} />
                </M3Card>
              ))}
            </div>
          </>
        )}

        {usedCoupons.length > 0 && (
          <>
            <SectionHeader title="Utilises" action={<span className="text-xs text-slate-400">{usedCoupons.length}</span>} />
            <div className="space-y-4 opacity-50">
              {usedCoupons.map((coupon) => (
                <CouponTicket key={coupon.id} coupon={coupon} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <EmptyState
            icon={Ticket}
            title="Aucun coupon"
            description="Aucun coupon dans cette categorie pour le moment."
          />
        )}
      </div>
    </M3Page>
  );
}

export default CouponsPage;
