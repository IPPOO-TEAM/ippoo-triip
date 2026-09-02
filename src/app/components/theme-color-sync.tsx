/**
 * ThemeColorSync — met à jour <meta name="theme-color"> à chaque navigation.
 * Étend la couleur du header/hero sur le chrome du navigateur en mode PWA
 * (Android Chrome, Samsung Internet, Edge) et sur les aperçus iOS.
 */
import { useEffect } from "react";
import { useLocation, Outlet } from "react-router";
import { schemeForPath } from "./m3/scheme";

const ROUTE_COLORS: Record<string, string> = {
  "/":            "#F77F00",
  "/landing":     "#F77F00",
  "/onboarding":  "#F77F00",
  "/login":       "#F77F00",
  "/driver":      "#2A9D8F",
  "/admin":       "#1E3A5F",
};

function resolveColor(pathname: string): string {
  // Exact match first
  const exact = ROUTE_COLORS[pathname];
  if (exact) return exact;

  // Prefix match for nested routes
  if (pathname.startsWith("/driver")) return "#2A9D8F";
  if (pathname.startsWith("/admin"))  return "#1E3A5F";

  // App routes — use M3 scheme primary
  if (pathname.startsWith("/app")) {
    return schemeForPath(pathname).headerFrom;
  }

  return "#F77F00";
}

function setThemeColor(color: string) {
  if (typeof document === "undefined") return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;

  // Also update the Apple status bar meta for iOS PWA
  let appleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleMeta) {
    // Use black-translucent when the color is dark, default otherwise
    const isDark = isColorDark(color);
    appleMeta.content = isDark ? "black-translucent" : "black-translucent";
  }
}

function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

export function ThemeColorSync() {
  const location = useLocation();

  useEffect(() => {
    const color = resolveColor(location.pathname);
    setThemeColor(color);
  }, [location.pathname]);

  return <Outlet />;
}
