/**
 * Material 3 Expressive — primitives partagées de l'app clients.
 * Aucune couleur en dur : tout dérive du schéma de page (--m3-*) posé par
 * <M3Page>. Icônes lucide épurées uniquement (jamais d'emoji ni d'icône 3D).
 */
import { type ReactNode, type CSSProperties, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { schemeForPath, type M3Scheme } from "./scheme";

/* Petite fabrique de style typée pour les variables CSS custom */
type Vars = CSSProperties & Record<`--${string}`, string>;

export function useScheme(): M3Scheme {
  const { pathname } = useLocation();
  return schemeForPath(pathname);
}

/* ------------------------------------------------------------------
   M3Page — coquille de page : pose le schéma, en-tête coloré expressif,
   entrée animée, safe-areas. Toutes les pages clients passent par ici.
------------------------------------------------------------------- */
export function M3Page({
  title, subtitle, icon: Icon, children, back = true, trailing, dense = false,
  hero,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  /** Affiche le bouton retour (par défaut oui, sauf accueil). */
  back?: boolean;
  /** Élément à droite de l'en-tête (bouton, avatar…). */
  trailing?: ReactNode;
  dense?: boolean;
  /** Contenu additionnel dans l'en-tête coloré (search, stats…). */
  hero?: ReactNode;
}) {
  const scheme = useScheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const vars: Vars = {
    "--m3-primary": scheme.primary,
    "--m3-on-primary": scheme.onPrimary,
    "--m3-container": scheme.container,
    "--m3-on-container": scheme.onContainer,
    "--m3-accent": scheme.accent,
  };

  return (
    <div style={vars} className="min-h-full overflow-x-hidden bg-[var(--m3-surface,#fbfbff)]">
      {/* En-tête coloré arrondi façon M3 Expressive */}
      <div
        className="relative overflow-hidden rounded-b-[28px] px-5 pt-[max(2.75rem,env(safe-area-inset-top))]"
        style={{
          paddingBottom: hero ? "1.25rem" : dense ? "1.1rem" : "1.6rem",
          background: `linear-gradient(140deg, ${scheme.headerFrom}, ${scheme.headerTo})`,
        }}
      >
        {/* Blobs décoratifs subtils */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-20"
          style={{ background: scheme.onPrimary }} />
        <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full opacity-10"
          style={{ background: scheme.onPrimary }} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {back && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Retour"
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 text-[var(--m3-on-primary)] backdrop-blur-md transition active:scale-90"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-[var(--m3-on-primary)]" strokeWidth={2} />}
                <motion.h1
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32 }}
                  className="truncate text-[var(--m3-on-primary)]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  {title}
                </motion.h1>
              </div>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-[var(--m3-on-primary)]/75">{subtitle}</p>
              )}
            </div>
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>

        {hero && <div className="relative mt-4">{hero}</div>}
      </div>

      {/* Contenu — entrée expressive */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.38, 1.21, 0.22, 1] }}
        className="px-4 pb-8 pt-4"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   SectionHeader — titre de section avec pastille colorée.
------------------------------------------------------------------- */
export function SectionHeader({
  title, icon: Icon, action,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between first:mt-0">
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-xl"
            style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        )}
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontWeight: 700, color: "#1a1a2e" }}>
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------
   M3Card — carte surface M3 avec relief doux et appui tactile.
------------------------------------------------------------------- */
export function M3Card({
  children, onClick, className = "", tonal = false, style, delay = 0,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Fond tonal coloré (container) au lieu de blanc. */
  tonal?: boolean;
  style?: CSSProperties;
  delay?: number;
}) {
  const Comp: any = onClick ? motion.button : motion.div;
  return (
    <Comp
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.2, 0, 0, 1] }}
      className={[
        "w-full rounded-3xl border p-4 text-left transition",
        onClick ? "active:scale-[0.98]" : "",
        tonal ? "border-transparent" : "border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]",
        className,
      ].join(" ")}
      style={{ ...(tonal ? { background: "var(--m3-container)", color: "var(--m3-on-container)" } : {}), ...style }}
    >
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------
   M3Button — bouton plein / tonal / texte, couleur de page.
------------------------------------------------------------------- */
export function M3Button({
  children, onClick, variant = "filled", icon: Icon, disabled, full = true, type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "filled" | "tonal" | "text" | "outlined";
  icon?: LucideIcon;
  disabled?: boolean;
  full?: boolean;
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold transition active:scale-[0.97] disabled:opacity-45";
  const styles: Record<string, CSSProperties> = {
    filled: { background: "var(--m3-primary)", color: "var(--m3-on-primary)", boxShadow: "0 8px 22px -8px var(--m3-primary)" },
    tonal: { background: "var(--m3-container)", color: "var(--m3-on-container)" },
    text: { color: "var(--m3-primary)" },
    outlined: { border: "1.5px solid var(--m3-outline,#d5d8ea)", color: "var(--m3-primary)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${full ? "w-full" : ""}`} style={styles[variant]}>
      {Icon && <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------
   EmptyState — état vide propre. Chaque user démarre vide et remplit.
------------------------------------------------------------------- */
export function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.38, 1.21, 0.22, 1] }}
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      <span
        className="mb-4 grid h-20 w-20 place-items-center rounded-[28px]"
        style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}
      >
        <Icon className="h-9 w-9" strokeWidth={1.8} />
      </span>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{title}</p>
      {description && <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5 w-full max-w-[16rem]">{action}</div>}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   StatTile — petite tuile de stat (couleur de page).
------------------------------------------------------------------- */
export function StatTile({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.05)] border border-black/[0.05]">
      <div className="flex items-center gap-1.5 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-[19px] font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
    </div>
  );
}

/* Verrou du fond de page en couleur douce M3 pendant le montage. */
export function useSurfaceLock() {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--m3-surface,#fbfbff)";
    return () => { document.body.style.background = prev; };
  }, []);
}
