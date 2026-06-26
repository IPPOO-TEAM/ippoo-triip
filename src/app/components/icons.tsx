// IPPOO Flat Icons — Modern flat filled design, 24px grid

interface IconProps {
  className?: string;
  size?: number;
}

// ── Service Icons ──

export function IconFretAerien({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 14l9-4 2-8 2 8 9 4-9 2-2 6-2-6-9-2z" fill="currentColor" opacity="0.85" />
      <circle cx="13" cy="14" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

export function IconCourse({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="17" r="3" fill="currentColor" />
      <circle cx="18" cy="17" r="3" fill="currentColor" />
      <circle cx="6" cy="17" r="1.2" fill="white" opacity="0.6" />
      <circle cx="18" cy="17" r="1.2" fill="white" opacity="0.6" />
      <path d="M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14l3-6h2l1 3h4l1 3" fill="currentColor" opacity="0.85" />
      <rect x="10" y="6" width="3" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function IconLivraison({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="13" height="12" rx="2" fill="currentColor" />
      <path d="M15 9h4l3 4v3h-7V9z" fill="currentColor" opacity="0.75" />
      <circle cx="7" cy="18" r="2.5" fill="currentColor" />
      <circle cx="7" cy="18" r="1" fill="white" opacity="0.6" />
      <circle cx="19" cy="18" r="2.5" fill="currentColor" />
      <circle cx="19" cy="18" r="1" fill="white" opacity="0.6" />
      <rect x="9.5" y="16" width="6" height="2" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function IconGroupOrder({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="7" r="3" fill="currentColor" />
      <rect x="4" y="13" width="10" height="7" rx="3.5" fill="currentColor" opacity="0.85" />
      <circle cx="17" cy="9" r="2.5" fill="currentColor" opacity="0.65" />
      <rect x="13" y="14" width="8" height="6" rx="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function IconCovoiturage({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="11" width="22" height="6" rx="3" fill="currentColor" />
      <path d="M4 11l2.5-5h11l2.5 5" fill="currentColor" opacity="0.7" />
      <rect x="5" y="7" width="3.5" height="3" rx="1" fill="white" opacity="0.25" />
      <rect x="10" y="7" width="3.5" height="3" rx="1" fill="white" opacity="0.25" />
      <circle cx="6" cy="18" r="2" fill="currentColor" />
      <circle cx="6" cy="18" r="0.8" fill="white" opacity="0.6" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <circle cx="18" cy="18" r="0.8" fill="white" opacity="0.6" />
      <circle cx="8" cy="4" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="4" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconGrosColis({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="10" width="22" height="7" rx="2" fill="currentColor" />
      <rect x="3" y="5" width="9" height="6" rx="2" fill="currentColor" opacity="0.6" />
      <path d="M7.5 5v6" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M3 8h9" stroke="white" strokeWidth="1" opacity="0.4" />
      <circle cx="5" cy="19" r="2" fill="currentColor" />
      <circle cx="5" cy="19" r="0.8" fill="white" opacity="0.6" />
      <circle cx="19" cy="19" r="2" fill="currentColor" />
      <circle cx="19" cy="19" r="0.8" fill="white" opacity="0.6" />
    </svg>
  );
}

export function IconWallet({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" />
      <rect x="14" y="9.5" width="8" height="5" rx="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="17.5" cy="12" r="1.5" fill="white" opacity="0.85" />
      <rect x="5" y="7.5" width="7" height="1.5" rx="0.75" fill="white" opacity="0.25" />
    </svg>
  );
}

export function IconHistorique({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M12 7v5.5l3.5 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 3L3 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M19 3l2 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function IconSupport({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="13" rx="3" fill="currentColor" />
      <path d="M8 20l4-4h-4z" fill="currentColor" opacity="0.75" />
      <circle cx="8" cy="10" r="1.2" fill="white" opacity="0.7" />
      <circle cx="12" cy="10" r="1.2" fill="white" opacity="0.7" />
      <circle cx="16" cy="10" r="1.2" fill="white" opacity="0.7" />
    </svg>
  );
}

// ── Vehicle Icons ──

export function IconMoto({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="5" cy="16" r="3.5" fill="currentColor" />
      <circle cx="5" cy="16" r="1.4" fill="white" opacity="0.5" />
      <circle cx="19" cy="16" r="3.5" fill="currentColor" />
      <circle cx="19" cy="16" r="1.4" fill="white" opacity="0.5" />
      <path d="M5 13l4-5h4l2 2h3l1 3" fill="currentColor" opacity="0.8" />
      <rect x="8" y="6" width="4" height="3" rx="1.5" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function IconTricycle({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="8" width="18" height="7" rx="2.5" fill="currentColor" />
      <circle cx="6" cy="18" r="2.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="white" opacity="0.5" />
      <circle cx="18" cy="18" r="2.5" fill="currentColor" />
      <circle cx="18" cy="18" r="1" fill="white" opacity="0.5" />
      <circle cx="12" cy="18" r="2.5" fill="currentColor" opacity="0.65" />
      <circle cx="12" cy="18" r="1" fill="white" opacity="0.4" />
      <rect x="8" y="5" width="8" height="4" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function IconVoiture({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="10" width="20" height="7" rx="2.5" fill="currentColor" />
      <path d="M5 10l2-5h10l2 5" fill="currentColor" opacity="0.65" />
      <rect x="6" y="6" width="4" height="3" rx="1" fill="white" opacity="0.2" />
      <rect x="12" y="6" width="4" height="3" rx="1" fill="white" opacity="0.2" />
      <circle cx="6.5" cy="17.5" r="2.5" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1" fill="white" opacity="0.5" />
      <circle cx="17.5" cy="17.5" r="2.5" fill="currentColor" />
      <circle cx="17.5" cy="17.5" r="1" fill="white" opacity="0.5" />
      <rect x="4" y="12" width="3" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="17" y="12" width="3" height="1.5" rx="0.75" fill="white" opacity="0.3" />
    </svg>
  );
}

export function IconMinibus({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="6" width="22" height="11" rx="3" fill="currentColor" />
      <rect x="3" y="8" width="4" height="4" rx="1" fill="white" opacity="0.25" />
      <rect x="8.5" y="8" width="4" height="4" rx="1" fill="white" opacity="0.25" />
      <rect x="14" y="8" width="4" height="4" rx="1" fill="white" opacity="0.25" />
      <circle cx="5.5" cy="18.5" r="2" fill="currentColor" />
      <circle cx="5.5" cy="18.5" r="0.8" fill="white" opacity="0.5" />
      <circle cx="18.5" cy="18.5" r="2" fill="currentColor" />
      <circle cx="18.5" cy="18.5" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}

// ── Decorative ──

/**
 * Ancien motif kente en damier — DÉSACTIVÉ.
 * Le damier rendait les fonds illisibles (« grille en carreau »). Conformément
 * à la charte (fonds unis + halos lumineux uniquement, pas de damier), ce
 * composant ne rend plus rien. Conservé pour compatibilité des imports
 * existants à travers la plateforme.
 */
export function AfricanPattern(_props: { opacity?: number; className?: string }) {
  return null;
}

// ── Badge ──

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "express" | "promo" | "new" | "success" | "warning" | "info" }) {
  const styles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    express: "bg-orange-100 text-orange-700",
    promo: "bg-yellow-100 text-yellow-800",
    new: "bg-violet-100 text-violet-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}