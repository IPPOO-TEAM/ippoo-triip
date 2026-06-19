import {
  Bike, Package, Gift, Car, Users, Sparkles, Tag
} from "lucide-react";

export type CouponCategory = "all" | "courses" | "livraison" | "wallet" | "special";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountType: "percent" | "fixed";
  minAmount?: number;
  maxDiscount?: number;
  validUntil: string;
  category: CouponCategory;
  used: boolean;
  gradient: string;
  shadow: string;
  icon: any;
  isNew?: boolean;
  isHot?: boolean;
  usageLeft?: number;
}

export const coupons: Coupon[] = [
  {
    id: "1", code: "IPPOO20", title: "20% sur votre course",
    description: "Valable sur toutes les courses moto et voiture",
    discount: "20%", discountType: "percent", maxDiscount: 2000, minAmount: 500,
    validUntil: "30 Avr 2026", category: "courses", used: false,
    gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/25",
    icon: Bike, isNew: true,
  },
  {
    id: "2", code: "LIVRAISON0", title: "Livraison gratuite",
    description: "1ere livraison offerte pour les nouveaux clients",
    discount: "GRATUIT", discountType: "fixed",
    validUntil: "15 Avr 2026", category: "livraison", used: false,
    gradient: "from-orange-400 to-rose-500", shadow: "shadow-orange-500/25",
    icon: Package, isHot: true,
  },
  {
    id: "3", code: "CASH500", title: "+500 FCFA bonus",
    description: "Bonus sur votre prochaine recharge IPPOO Cash",
    discount: "500F", discountType: "fixed", minAmount: 2000,
    validUntil: "20 Avr 2026", category: "wallet", used: false,
    gradient: "from-emerald-500 to-green-600", shadow: "shadow-green-500/25",
    icon: Gift,
  },
  {
    id: "4", code: "COVOIT30", title: "30% covoiturage",
    description: "Reduction speciale weekend sur les covoiturages",
    discount: "30%", discountType: "percent", maxDiscount: 3000,
    validUntil: "12 Avr 2026", category: "courses", used: false,
    gradient: "from-cyan-500 to-teal-600", shadow: "shadow-cyan-500/25",
    icon: Car, isHot: true, usageLeft: 3,
  },
  {
    id: "5", code: "GROUPE15", title: "15% commandes groupees",
    description: "Commandez a plusieurs et economisez",
    discount: "15%", discountType: "percent",
    validUntil: "25 Avr 2026", category: "special", used: false,
    gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25",
    icon: Users,
  },
  {
    id: "6", code: "FIDELITE", title: "1000 FCFA offerts",
    description: "Merci pour votre fidelite ! 10 courses atteintes",
    discount: "1000F", discountType: "fixed",
    validUntil: "01 Mai 2026", category: "special", used: true,
    gradient: "from-amber-400 to-amber-600", shadow: "shadow-amber-500/25",
    icon: Sparkles,
  },
];

export const couponFilters: { id: CouponCategory; label: string; icon: any }[] = [
  { id: "all", label: "Tous", icon: Tag },
  { id: "courses", label: "Courses", icon: Bike },
  { id: "livraison", label: "Livraison", icon: Package },
  { id: "wallet", label: "Cash", icon: Gift },
  { id: "special", label: "Special", icon: Sparkles },
];

/** Active (non-used) coupons for display on home page */
export const activeCouponsForHome = coupons.filter((c) => !c.used);
