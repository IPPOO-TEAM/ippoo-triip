/**
 * Material 3 Expressive — schémas de couleurs par page (app clients).
 * Chaque route a SA couleur dominante vive. <M3Page> pose ces valeurs sur
 * --m3-* pour que tous les composants s'y adaptent sans couleur en dur.
 */

export interface M3Scheme {
  /** Couleur d'accent principale de la page (vive) */
  primary: string;
  /** Texte/icône posé sur `primary` */
  onPrimary: string;
  /** Fond tonal doux dérivé de primary (cartes, puces) */
  container: string;
  /** Texte posé sur `container` */
  onContainer: string;
  /** Couleur secondaire de contraste (badges, CTA alternatif) */
  accent: string;
  /** Dégradé d'en-tête [from, to] */
  headerFrom: string;
  headerTo: string;
}

const S = (
  primary: string, container: string, onContainer: string,
  accent: string, headerFrom: string, headerTo: string,
  onPrimary = "#ffffff",
): M3Scheme => ({ primary, onPrimary, container, onContainer, accent, headerFrom, headerTo });

/* Palette vive et VARIÉE — une teinte distincte par page. */
export const M3_SCHEMES: Record<string, M3Scheme> = {
  home:            S("#4759e4", "#e7e9ff", "#111a56", "#f77f00", "#5b6cf0", "#3b1ec9"),
  "book-ride":     S("#1e6091", "#d9ecfb", "#0a2c46", "#f77f00", "#2b7fbf", "#124a72"),
  delivery:        S("#f77f00", "#ffe8cf", "#4d2600", "#1e6091", "#ff9e2c", "#e05e00"),
  "group-orders":  S("#8b5cf6", "#ece2ff", "#2b1065", "#f472b6", "#a07bff", "#6d28d9"),
  carpool:         S("#06b6d4", "#cdf3fb", "#053640", "#f77f00", "#22cce6", "#0891b2"),
  "heavy-transport": S("#e11d64", "#ffe0ea", "#4a0620", "#f59e0b", "#f5417f", "#be1250"),
  "air-freight":   S("#0284f0", "#d5ecff", "#062a4d", "#22d3ee", "#38a0ff", "#0369cf"),
  wallet:          S("#059669", "#c9f5e2", "#04301f", "#f59e0b", "#12b981", "#047a54"),
  history:         S("#0f766e", "#cbf1ec", "#032b28", "#f77f00", "#1c9d92", "#0b5a54"),
  notifications:   S("#d97706", "#ffeccb", "#3d2200", "#8b5cf6", "#f59e0b", "#b45309"),
  profile:         S("#c026d3", "#fbdcff", "#3f0842", "#06b6d4", "#db4ce0", "#a21caf"),
  support:         S("#0d9488", "#c6f2ec", "#022e2a", "#f77f00", "#17b1a3", "#0a726a"),
  coupons:         S("#e11d48", "#ffe0e6", "#450a17", "#f59e0b", "#f43f6a", "#be123c"),
  subscriptions:   S("#ea580c", "#ffe6d3", "#431a05", "#8b5cf6", "#fb7226", "#c2410c"),
  loa:             S("#dc2626", "#ffdedb", "#450a0a", "#f59e0b", "#f04343", "#b91c1c"),
  referral:        S("#ca8a04", "#fff0c2", "#3a2b00", "#059669", "#eab308", "#a16207"),
  rating:          S("#0891b2", "#cbeff7", "#04303b", "#f77f00", "#1eb0d1", "#0e7490"),
  mission:         S("#2563eb", "#dbe6ff", "#0a1f52", "#06b6d4", "#3b7bf6", "#1d4ed8"),
  tracking:        S("#16a34a", "#cff2d8", "#052e13", "#f77f00", "#28bd5c", "#15803d"),
  "promo":         S("#9333ea", "#f0dcff", "#2e0a52", "#f77f00", "#ab4ff0", "#7521c4"),
};

export const M3_DEFAULT = M3_SCHEMES.home;

/** Résout le schéma pour un pathname `/app/...`. */
export function schemeForPath(pathname: string): M3Scheme {
  // /app -> home ; /app/xxx -> xxx ; /app/promo/:id -> promo
  const seg = pathname.replace(/^\/app\/?/, "").split("/")[0] || "home";
  return M3_SCHEMES[seg] ?? M3_DEFAULT;
}
