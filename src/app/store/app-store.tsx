/**
 * Store applicatif IPPOO - Context + useReducer + sélecteurs.
 * Remplace la prolifération de localStorage / useState dispersés.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { User, Wallet, Notification, Ride } from "../types/domain";
import { loadSession, logout as svcLogout } from "../services/auth";

export type Language = "fr" | "fon" | "yor" | "en";
export type Theme = "light" | "dark";

export type AppState = {
  user: User | null;
  wallet: Wallet | null;
  notifications: Notification[];
  activeRide: Ride | null;
  language: Language;
  theme: Theme;
  lowDataMode: boolean;
  online: boolean;
  hydrated: boolean;
};

const initial: AppState = {
  user: null,
  wallet: null,
  notifications: [],
  activeRide: null,
  language: (localStorage.getItem("ippoo_triip_lang") as Language) || "fr",
  theme: (localStorage.getItem("ippoo_triip_theme") as Theme) || "light",
  lowDataMode: localStorage.getItem("ippoo_triip_low_data") === "1",
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  hydrated: false,
};

type Action =
  | { type: "HYDRATE"; user: User | null }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_WALLET"; wallet: Wallet | null }
  | { type: "SET_NOTIFICATIONS"; notifications: Notification[] }
  | { type: "ADD_NOTIFICATION"; notification: Notification }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "SET_ACTIVE_RIDE"; ride: Ride | null }
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "SET_THEME"; theme: Theme }
  | { type: "SET_LOW_DATA"; on: boolean }
  | { type: "SET_ONLINE"; online: boolean };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "HYDRATE": return { ...s, user: a.user, hydrated: true };
    case "SET_USER": return { ...s, user: a.user };
    case "SET_WALLET": return { ...s, wallet: a.wallet };
    case "SET_NOTIFICATIONS": return { ...s, notifications: a.notifications };
    case "ADD_NOTIFICATION":
      return { ...s, notifications: [a.notification, ...s.notifications] };
    case "MARK_NOTIFICATION_READ":
      return {
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === a.id ? { ...n, read: true } : n,
        ),
      };
    case "SET_ACTIVE_RIDE": return { ...s, activeRide: a.ride };
    case "SET_LANGUAGE":
      localStorage.setItem("ippoo_triip_lang", a.language);
      return { ...s, language: a.language };
    case "SET_THEME":
      localStorage.setItem("ippoo_triip_theme", a.theme);
      document.documentElement.dataset.theme = a.theme;
      return { ...s, theme: a.theme };
    case "SET_LOW_DATA":
      localStorage.setItem("ippoo_triip_low_data", a.on ? "1" : "0");
      document.documentElement.dataset.lowData = a.on ? "1" : "0";
      return { ...s, lowDataMode: a.on };
    case "SET_ONLINE": return { ...s, online: a.online };
    default: return s;
  }
}

type Ctx = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  logout: () => Promise<void>;
};

// Singleton global : évite qu'un rechargement à chaud (HMR) ou une double
// évaluation du module ne crée deux contextes distincts, ce qui casserait
// l'appariement Provider/consumer (« useAppStore doit être utilisé dans
// <AppStoreProvider> » alors que le Provider est bien présent).
const globalScope = globalThis as unknown as {
  __ippooTriipAppCtx?: React.Context<Ctx | null>;
};
const AppCtx: React.Context<Ctx | null> =
  globalScope.__ippooTriipAppCtx ??
  (globalScope.__ippooTriipAppCtx = createContext<Ctx | null>(null));

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Hydratation initiale
  useEffect(() => {
    const session = loadSession();
    dispatch({ type: "HYDRATE", user: session?.user ?? null });
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.lowData = state.lowDataMode ? "1" : "0";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Statut réseau
  useEffect(() => {
    const on = () => dispatch({ type: "SET_ONLINE", online: true });
    const off = () => dispatch({ type: "SET_ONLINE", online: false });
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      logout: async () => {
        await svcLogout();
        dispatch({ type: "SET_USER", user: null });
      },
    }),
    [state],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useAppStore doit être utilisé dans <AppStoreProvider>");
  return ctx;
}

/* Sélecteurs pratiques */
export const useUser = () => useAppStore().state.user;
export const useWallet = () => useAppStore().state.wallet;
export const useLanguage = () => useAppStore().state.language;
export const useTheme = () => useAppStore().state.theme;
export const useOnline = () => useAppStore().state.online;
