/**
 * <BrandLogo/> - Logo officiel IPPOO TRIIP présenté dans une pastille blanche.
 *
 * Le fichier source est sur fond blanc : on l'encapsule donc dans un conteneur
 * blanc arrondi afin qu'il ressorte proprement, y compris au-dessus des fonds
 * colorés (header). Pensé compact pour le mobile afin de ne pas gêner les
 * autres éléments du header.
 */
import triipLogo from "../../imports/triip_fav-1.jpg";

export function BrandLogo({
  height = 24,
  className = "",
  plain = false,
}: {
  height?: number;
  className?: string;
  /** Affiche le logo seul (sans pastille blanche) - idéal sur un fond déjà blanc */
  plain?: boolean;
}) {
  if (plain) {
    return (
      <img
        src={triipLogo}
        alt="IPPOO TRIIP"
        style={{ height }}
        className={`w-auto object-contain ${className}`}
      />
    );
  }
  return (
    <div
      className={`inline-flex items-center justify-center bg-white rounded-xl px-2.5 py-1.5 ring-1 ring-black/5 ${className}`}
    >
      <img
        src={triipLogo}
        alt="IPPOO TRIIP"
        style={{ height }}
        className="w-auto object-contain"
      />
    </div>
  );
}
