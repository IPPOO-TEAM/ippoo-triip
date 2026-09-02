/**
 * Gestion fine du scroll pour les layouts IPPOO TRIIP.
 *
 * Le scroll n'est pas sur `window` mais sur un conteneur interne (le
 * `overflow-y-auto` de chaque layout). On reproduit donc le comportement
 * de `<ScrollRestoration/>` de React Router :
 *   - navigation avant (PUSH/REPLACE) → on remet le conteneur en haut,
 *   - retour navigateur (POP)          → on restaure la position sauvegardée.
 *
 * Les positions sont keyées par `location.key` et persistées en
 * sessionStorage pour survivre à un rechargement.
 */
import { useEffect, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router";

const STORAGE_KEY = "ippoo_triip_scroll_positions_v1";

function loadPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePositions(positions: Record<string, number>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* quota - ignoré */
  }
}

export function useScrollRestoration(ref: RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"

  // À chaque changement de route : enregistre la position de l'ancienne route
  // (cleanup) puis ajuste la position de la nouvelle route.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (navType === "POP") {
      // Retour navigateur - restaurer la position d'avant
      const positions = loadPositions();
      const saved = positions[location.key];
      el.scrollTo({ top: typeof saved === "number" ? saved : 0, left: 0, behavior: "auto" });
    } else {
      // Nouvelle navigation - repartir du haut
      el.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    // Sauvegarder la position avant de quitter cette route
    const key = location.key;
    const onScroll = () => {
      const positions = loadPositions();
      positions[key] = el.scrollTop;
      savePositions(positions);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      // Persiste une dernière fois la position au démontage
      const positions = loadPositions();
      positions[key] = el.scrollTop;
      savePositions(positions);
    };
  }, [location.key, navType, ref]);
}
