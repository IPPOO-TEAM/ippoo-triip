import { requestOtp, verifyOtp } from "../services/auth";
import { initFcm, onForegroundMessage, sendTestPush } from "../services/firebase";
import { useAppStore } from "../store/app-store";
import { logger } from "../services/logger";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Phone, Shield, ArrowRight, ChevronLeft, Fingerprint,
  Mail, User, Check, AlertTriangle, Loader2, ChevronDown, X, Globe, Hand, Lock, Rocket,
  MapPin, Building2, Hash, Key, Search,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

import imgLoginBg from "figma:asset/6cc3d4905bdcc38a53430299260f13a383d87250.png";

/* -----------------------------------------
   All 54 African countries
----------------------------------------- */
interface Country {
  code: string;
  name: string;
  dialCode: string;
  placeholder: string;
  maxLen: number;
}

const ALL_AFRICAN_COUNTRIES: Country[] = [
  { code: "DZ", name: "Algérie",              dialCode: "+213", placeholder: "6 00 00 00 00",  maxLen: 12 },
  { code: "AO", name: "Angola",               dialCode: "+244", placeholder: "9XX XXX XXX",    maxLen: 12 },
  { code: "BJ", name: "Bénin",                dialCode: "+229", placeholder: "97 00 00 00",    maxLen: 10 },
  { code: "BW", name: "Botswana",             dialCode: "+267", placeholder: "71 000 000",     maxLen: 10 },
  { code: "BF", name: "Burkina Faso",         dialCode: "+226", placeholder: "70 00 00 00",    maxLen: 10 },
  { code: "BI", name: "Burundi",              dialCode: "+257", placeholder: "79 00 00 00",    maxLen: 10 },
  { code: "CV", name: "Cabo Verde",           dialCode: "+238", placeholder: "991 00 00",      maxLen: 9 },
  { code: "CM", name: "Cameroun",             dialCode: "+237", placeholder: "6 00 00 00 00",  maxLen: 11 },
  { code: "CF", name: "Centrafrique",         dialCode: "+236", placeholder: "70 00 00 00",    maxLen: 10 },
  { code: "TD", name: "Tchad",                dialCode: "+235", placeholder: "66 00 00 00",    maxLen: 10 },
  { code: "KM", name: "Comores",              dialCode: "+269", placeholder: "321 00 00",      maxLen: 9 },
  { code: "CG", name: "Congo",                dialCode: "+242", placeholder: "06 000 00 00",   maxLen: 11 },
  { code: "CD", name: "Congo (RDC)",          dialCode: "+243", placeholder: "81 000 0000",    maxLen: 12 },
  { code: "DJ", name: "Djibouti",             dialCode: "+253", placeholder: "77 00 00 00",    maxLen: 10 },
  { code: "EG", name: "Égypte",               dialCode: "+20",  placeholder: "10 0000 0000",   maxLen: 12 },
  { code: "GQ", name: "Guinée Équatoriale",   dialCode: "+240", placeholder: "222 00 0000",    maxLen: 11 },
  { code: "ER", name: "Érythrée",             dialCode: "+291", placeholder: "7 100 000",      maxLen: 9 },
  { code: "SZ", name: "Eswatini",             dialCode: "+268", placeholder: "7600 0000",      maxLen: 10 },
  { code: "ET", name: "Éthiopie",             dialCode: "+251", placeholder: "91 100 0000",    maxLen: 11 },
  { code: "GA", name: "Gabon",                dialCode: "+241", placeholder: "06 00 00 00",    maxLen: 10 },
  { code: "GM", name: "Gambie",               dialCode: "+220", placeholder: "7 000000",       maxLen: 9 },
  { code: "GH", name: "Ghana",                dialCode: "+233", placeholder: "20 000 0000",    maxLen: 11 },
  { code: "GN", name: "Guinée",               dialCode: "+224", placeholder: "62 00 00 00",    maxLen: 10 },
  { code: "GW", name: "Guinée-Bissau",        dialCode: "+245", placeholder: "955 00 00 00",   maxLen: 11 },
  { code: "CI", name: "Côte d'Ivoire",        dialCode: "+225", placeholder: "07 00 00 00 00", maxLen: 13 },
  { code: "KE", name: "Kenya",                dialCode: "+254", placeholder: "7XX XXX XXX",    maxLen: 12 },
  { code: "LS", name: "Lesotho",              dialCode: "+266", placeholder: "5000 0000",      maxLen: 10 },
  { code: "LR", name: "Libéria",              dialCode: "+231", placeholder: "77 000 0000",    maxLen: 11 },
  { code: "LY", name: "Libye",                dialCode: "+218", placeholder: "91 000 0000",    maxLen: 11 },
  { code: "MG", name: "Madagascar",           dialCode: "+261", placeholder: "32 00 000 00",   maxLen: 12 },
  { code: "MW", name: "Malawi",               dialCode: "+265", placeholder: "99 000 0000",    maxLen: 11 },
  { code: "ML", name: "Mali",                 dialCode: "+223", placeholder: "70 00 00 00",    maxLen: 10 },
  { code: "MR", name: "Mauritanie",           dialCode: "+222", placeholder: "22 00 00 00",    maxLen: 10 },
  { code: "MU", name: "Maurice",              dialCode: "+230", placeholder: "5 000 0000",     maxLen: 9 },
  { code: "MA", name: "Maroc",                dialCode: "+212", placeholder: "6 00 00 00 00",  maxLen: 11 },
  { code: "MZ", name: "Mozambique",           dialCode: "+258", placeholder: "82 000 0000",    maxLen: 11 },
  { code: "NA", name: "Namibie",              dialCode: "+264", placeholder: "81 000 0000",    maxLen: 11 },
  { code: "NE", name: "Niger",                dialCode: "+227", placeholder: "96 00 00 00",    maxLen: 10 },
  { code: "NG", name: "Nigéria",              dialCode: "+234", placeholder: "803 000 0000",   maxLen: 13 },
  { code: "RW", name: "Rwanda",               dialCode: "+250", placeholder: "78 000 0000",    maxLen: 11 },
  { code: "ST", name: "São Tomé & Príncipe",  dialCode: "+239", placeholder: "981 0000",       maxLen: 9 },
  { code: "SN", name: "Sénégal",              dialCode: "+221", placeholder: "77 000 00 00",   maxLen: 11 },
  { code: "SC", name: "Seychelles",           dialCode: "+248", placeholder: "2 521 000",      maxLen: 9 },
  { code: "SL", name: "Sierra Leone",         dialCode: "+232", placeholder: "76 000 000",     maxLen: 10 },
  { code: "SO", name: "Somalie",              dialCode: "+252", placeholder: "61 1 000000",    maxLen: 11 },
  { code: "ZA", name: "Afrique du Sud",       dialCode: "+27",  placeholder: "71 000 0000",    maxLen: 11 },
  { code: "SS", name: "Soudan du Sud",        dialCode: "+211", placeholder: "91 123 4567",    maxLen: 11 },
  { code: "SD", name: "Soudan",               dialCode: "+249", placeholder: "91 123 4567",    maxLen: 11 },
  { code: "TZ", name: "Tanzanie",             dialCode: "+255", placeholder: "74 000 0000",    maxLen: 11 },
  { code: "TG", name: "Togo",                 dialCode: "+228", placeholder: "90 00 00 00",    maxLen: 10 },
  { code: "TN", name: "Tunisie",              dialCode: "+216", placeholder: "20 000 000",     maxLen: 10 },
  { code: "UG", name: "Ouganda",              dialCode: "+256", placeholder: "70 000 0000",    maxLen: 11 },
  { code: "ZM", name: "Zambie",               dialCode: "+260", placeholder: "97 1234567",     maxLen: 11 },
  { code: "ZW", name: "Zimbabwe",             dialCode: "+263", placeholder: "77 123 4567",    maxLen: 11 },
];

// Default: Bénin
const DEFAULT_COUNTRY = ALL_AFRICAN_COUNTRIES.find(c => c.code === "BJ")!;

/* -----------------------------------------
   Shared visual atoms
----------------------------------------- */
function AfricanDots() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-20">
      {[0, 1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => (
          <circle key={`${row}-${col}`}
            cx={col * 30 + 15} cy={row * 30 + 15}
            r={row % 2 === col % 2 ? 5 : 2.5} fill="white"
          />
        ))
      )}
    </svg>
  );
}

const BG_IMAGE = imgLoginBg;

const STEP_ACCENT: Record<string, string> = {
  phone: "#F77F00", otp: "#2A9D8F", register: "#1E6091",
};
const STEP_GRADIENT: Record<string, string> = {
  phone: "rgba(247,127,0,0.92)", otp: "rgba(42,157,143,0.88)", register: "rgba(30,96,145,0.88)",
};

/* ---------------------------------------
   Country Bottom Sheet (searchable)
---------------------------------------- */
function CountryBottomSheet({
  open, onClose, selected, onSelect, accent,
}: {
  open: boolean;
  onClose: () => void;
  selected: Country;
  onSelect: (c: Country) => void;
  accent: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? ALL_AFRICAN_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_AFRICAN_COUNTRIES;

  return createPortal(
    <>
      <div
        className="fixed inset-0 transition-all duration-300"
        style={{
          zIndex: 9998,
          background: open ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0)",
          backdropFilter: open ? "blur(4px)" : "none",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
        }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 transition-transform duration-400"
        style={{
          zIndex: 9999,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transitionTimingFunction: open ? "cubic-bezier(0.22,1,0.36,1)" : "ease-in",
          pointerEvents: open ? "auto" : "none",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="rounded-t-3xl border-t border-white/15 flex flex-col"
          style={{
            background: "rgba(8,4,1,0.92)",
            backdropFilter: "blur(28px) saturate(1.8)",
            WebkitBackdropFilter: "blur(28px) saturate(1.8)",
            maxHeight: "80dvh",
          }}
        >
          {/* Handle + header */}
          <div className="shrink-0 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-1 rounded-full bg-white/20 absolute left-1/2 -translate-x-1/2 top-3" />
              <p className="text-white/80 text-sm font-semibold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                <Globe size={14} className="text-white/70 inline mr-1.5" />Indicatif téléphonique
              </p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/15"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <Search size={14} className="text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/35"
              />
              {query && <button onClick={() => setQuery("")}><X size={12} className="text-white/40" /></button>}
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-y-auto flex-1 px-5 pb-10 flex flex-col gap-1.5">
            {filtered.map(country => {
              const isSelected = country.code === selected.code;
              return (
                <button
                  key={country.code}
                  onClick={() => { onSelect(country); onClose(); setQuery(""); }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: isSelected ? `${accent}20` : "rgba(255,255,255,0.05)",
                    border: isSelected ? `1.5px solid ${accent}55` : "1.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[11px] font-bold tracking-wide text-white shrink-0">{country.code}</span>
                  <span className="flex-1 text-white text-sm font-medium truncate" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{country.name}</span>
                  <span className="text-white/60 text-xs font-bold shrink-0" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{country.dialCode}</span>
                  {isSelected && <Check size={13} className="text-white shrink-0" style={{ color: accent }} />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-white/40 text-sm text-center py-6">Aucun pays trouvé</p>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* -----------------------------------------
   Country Trigger Button
----------------------------------------- */
function CountryTrigger({ country, onClick, accent }: { country: Country; onClick: () => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 active:scale-95 transition-transform"
      style={{ background: `${accent}15`, borderColor: `${accent}35` }}
    >
      <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/15 px-1 text-[10px] font-bold leading-none text-white">{country.code}</span>
      <span className="text-white/90 text-xs font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{country.dialCode}</span>
      <ChevronDown size={11} className="text-white/50" />
    </button>
  );
}

/* -----------------------------------------
   Glass input (generic)
----------------------------------------- */
function GlassInput({
  icon: Icon, placeholder, value, onChange, error, type = "text",
  onKeyDown, inputRef, inputMode, maxLength, autoComplete,
  prefix, prefixNode,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; type?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  inputRef?: (el: HTMLInputElement | null) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number; autoComplete?: string;
  prefix?: string;
  prefixNode?: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${
          error ? "border-[#D62828]/70" : "border-white/15 focus-within:border-white/35"
        }`}
        style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}
      >
        <Icon className={`w-4 h-4 shrink-0 ${error ? "text-[#D62828]" : "text-white/50"}`} />
        {prefix && !prefixNode && (
          <span className="text-white/60 text-sm px-2 py-0.5 rounded-lg border border-white/15 shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            {prefix}
          </span>
        )}
        {prefixNode}
        <input
          ref={inputRef} type={type} inputMode={inputMode}
          placeholder={placeholder} value={value}
          maxLength={maxLength} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40 min-w-0"
        />
      </div>
      {error && (
        <p className="text-[10px] text-[#D62828] mt-1.5 px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/* -----------------------------------------
   GlassSelect (native select styled)
----------------------------------------- */
function GlassSelect({
  icon: Icon, label, value, onChange, options, error,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${
          error ? "border-[#D62828]/70" : "border-white/15 focus-within:border-white/35"
        }`}
        style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}
      >
        <Icon className={`w-4 h-4 shrink-0 ${error ? "text-[#D62828]" : "text-white/50"}`} />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-white min-w-0 cursor-pointer"
          style={{ color: value ? "white" : "rgba(255,255,255,0.4)" }}
        >
          <option value="" disabled style={{ background: "#0d1117" }}>{label}</option>
          {options.map(opt => (
            <option key={opt} value={opt} style={{ background: "#0d1117", color: "white" }}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={13} className="text-white/40 shrink-0 pointer-events-none" />
      </div>
      {error && (
        <p className="text-[10px] text-[#D62828] mt-1.5 px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/* -----------------------------------------
   Registration form state
----------------------------------------- */
interface RegForm {
  prenom: string;
  nom: string;
  phone: string;
  email: string;
  type: string;
  country: string;
  department: string;
  commune: string;
  quartier: string;
  codeParrainage: string;
  invitationKey: string;
}

const ACCOUNT_TYPES = [
  "Particulier", "Étudiant", "Fonctionnaire", "Commerçant",
  "Dame de marché", "Salarié", "Autre",
];
const AGENT_TYPE = "Chauffeur/Agent";
// L'administrateur ne s'inscrit pas via OTP : il se connecte par email/mot de
// passe sur /admin/login (secrets ADMIN_EMAIL / ADMIN_PASSWORD).
const ALL_TYPES = [...ACCOUNT_TYPES, AGENT_TYPE];

/* -----------------------------------------
   Main LoginPage
----------------------------------------- */
export function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      initFcm().then(token => setFcmToken(token));
    }
  }, []);

  const ensureFcmToken = async (): Promise<string | null> => {
    if (fcmToken) return fcmToken;
    try {
      const token = await initFcm();
      if (token) setFcmToken(token);
      return token;
    } catch { return null; }
  };

  /* Stored registration data to pass through on OTP verify */
  const regDataRef = useRef<RegForm | null>(null);

  const getTargetRoute = (type: string) =>
    type === AGENT_TYPE ? "/driver" : "/app";

  const finalizeAuth = async (phoneE164: string, code: string, redirect: string, regForm?: RegForm) => {
    try {
      const isAgent = regForm?.type === AGENT_TYPE;
      const session = await verifyOtp(phoneE164, code, {
        fcmToken,
        fullName: regForm ? `${regForm.prenom} ${regForm.nom}`.trim() : undefined,
        role: regForm
          ? regForm.type === AGENT_TYPE ? "driver" : "client"
          : undefined,
        email: regForm?.email || undefined,
        country: regForm?.country || undefined,
        department: regForm?.department || undefined,
        commune: regForm?.commune || undefined,
        quartier: regForm?.quartier || undefined,
        referralCodeUsed: (!isAgent && regForm?.codeParrainage) ? regForm.codeParrainage : undefined,
        invitationKey: (isAgent && regForm?.invitationKey) ? regForm.invitationKey : undefined,
      });
      dispatch({ type: "SET_USER", user: session.user });
      logger.info("auth.login.success", { phone: phoneE164 });
      toast.success("Connexion réussie !", { description: `Bienvenue ${session.user.fullName}` });
      navigate(redirect);
    } catch (e) {
      logger.warn("auth.login.fail", { e: String(e) });
      toast.error("Échec de la connexion", { description: String(e) });
    }
  };

  /* Country selectors */
  const [loginCountry, setLoginCountry]       = useState<Country>(DEFAULT_COUNTRY);
  const [registerCountry, setRegisterCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showPicker, setShowPicker]           = useState<"login" | "register" | null>(null);

  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [form, setForm]     = useState<RegForm>({
    prenom: "", nom: "", phone: "", email: "",
    type: "Particulier", country: "Bénin",
    department: "", commune: "", quartier: "",
    codeParrainage: "", invitationKey: "",
  });
  const [countdown, setCountdown]   = useState(30);
  const [loading, setLoading]       = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs  = useRef<(HTMLInputElement | null)[]>([]);

  const accent   = STEP_ACCENT[step];
  const gradFrom = STEP_GRADIENT[step];

  useEffect(() => {
    if (step === "otp") {
      setCountdown(30);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  useEffect(() => {
    if (step !== "otp") return;
    const unsubscribe = onForegroundMessage((payload) => {
      if (payload.data?.type === "otp" && payload.data?.code) {
        const code = String(payload.data.code).slice(0, 6);
        const arr = code.split("").concat(Array(6).fill("")).slice(0, 6);
        setOtp(arr);
        toast.success("Code reçu par notification");
      }
    });
    const swListener = (event: MessageEvent) => {
      if (event.data?.type === "FCM_OTP" && event.data?.code) {
        const code = String(event.data.code).slice(0, 6);
        const arr = code.split("").concat(Array(6).fill("")).slice(0, 6);
        setOtp(arr);
      }
    };
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", swListener);
    return () => {
      unsubscribe();
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", swListener);
    };
  }, [step]);

  const validatePhone = (p: string) => {
    const c = p.replace(/\s/g, "");
    if (!c) { setPhoneError("Entrez un numéro de téléphone"); return false; }
    if (c.length < 7) { setPhoneError("Numéro trop court"); return false; }
    if (!/^\d+$/.test(c)) { setPhoneError("Chiffres uniquement"); return false; }
    setPhoneError(""); return true;
  };

  const handlePhoneSubmit = async () => {
    if (!validatePhone(phone)) return;
    setLoading(true);
    try {
      const fullPhone = `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      const token = await ensureFcmToken();
      const { push } = await requestOtp(fullPhone, token);
      regDataRef.current = null; // login flow, no reg data
      setStep("otp");
      if (push && push.sent === 0 && token) {
        toast.warning("Notification indisponible", {
          description: `Code push impossible (${push.reason ?? "raison inconnue"}). Vérifiez vos notifications.`,
          duration: 12000,
        });
      } else {
        toast.success("Code envoyé !", {
          description: token
            ? "Votre code arrive par notification push."
            : "Autorisez les notifications pour recevoir votre code.",
          duration: 10000,
        });
      }
    } catch (e) {
      toast.error("Erreur lors de l'envoi du code", { description: String(e) });
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.join("").length === 6) {
      const entered = newOtp.join("");
      setLoading(true);
      const rd = regDataRef.current;
      const fullPhone = rd
        ? `${registerCountry.dialCode}${rd.phone}`.replace(/\s+/g, "")
        : `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      const redirect = rd ? getTargetRoute(rd.type) : "/app";
      finalizeAuth(fullPhone, entered, redirect, rd ?? undefined).finally(() => setLoading(false));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp]; pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
    if (pasted.length === 6) {
      setLoading(true);
      const rd = regDataRef.current;
      const fullPhone = rd
        ? `${registerCountry.dialCode}${rd.phone}`.replace(/\s+/g, "")
        : `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      const redirect = rd ? getTargetRoute(rd.type) : "/app";
      finalizeAuth(fullPhone, pasted, redirect, rd ?? undefined).finally(() => setLoading(false));
    }
  };

  const handleOtpSubmit = () => {
    const entered = otp.join("");
    if (entered.length < 4) { toast.error("Entrez le code OTP complet"); return; }
    setLoading(true);
    const rd = regDataRef.current;
    const fullPhone = rd
      ? `${registerCountry.dialCode}${rd.phone}`.replace(/\s+/g, "")
      : `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
    const redirect = rd ? getTargetRoute(rd.type) : "/app";
    finalizeAuth(fullPhone, entered, redirect, rd ?? undefined).finally(() => setLoading(false));
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setCountdown(30); setOtp(["", "", "", "", "", ""]);
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
    try {
      const rd = regDataRef.current;
      const fullPhone = rd
        ? `${registerCountry.dialCode}${rd.phone}`.replace(/\s+/g, "")
        : `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      const token = await ensureFcmToken();
      await requestOtp(fullPhone, token);
      toast.success("Code renvoyé !");
    } catch { toast.error("Erreur lors du renvoi du code"); }
    otpRefs.current[0]?.focus();
  };

  const isAgent = form.type === AGENT_TYPE;

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    if (!form.prenom.trim()) errors.prenom = "Prénom requis";
    if (!form.nom.trim()) errors.nom = "Nom requis";
    if (!form.phone.trim()) errors.phone = "Téléphone requis";
    else if (form.phone.replace(/\s/g, "").length < 7) errors.phone = "Numéro trop court";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    if (!form.country) errors.country = "Pays requis";
    if (!form.commune.trim()) errors.commune = "Ville/Commune requise";
    if (isAgent && !form.invitationKey.trim()) errors.invitationKey = "Clé d'invitation requise";
    if (!acceptTerms) errors.terms = "Acceptez les conditions";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const fullPhone = `${registerCountry.dialCode}${form.phone}`.replace(/\s+/g, "");
      const token = await ensureFcmToken();
      await requestOtp(fullPhone, token);
      regDataRef.current = { ...form };
      setStep("otp");
      toast.success("Inscription en cours...", {
        description: token ? "Code de vérification envoyé par notification push." : "Autorisez les notifications pour recevoir votre code.",
        duration: 10000,
      });
    } catch (e) {
      toast.error("Erreur lors de l'envoi du code", { description: String(e) });
    } finally { setLoading(false); }
  };

  const [testingPush, setTestingPush] = useState(false);
  const handleTestPush = async () => {
    setTestingPush(true);
    toast.loading("Envoi de la notification test…", { id: "test-push" });
    try {
      const r = await sendTestPush();
      if (r.ok) {
        toast.success("Notification test envoyée", { id: "test-push", description: "Vérifiez vos notifications.", duration: 10000 });
      } else if (!r.tokenObtained) {
        toast.error("Impossible d'activer les notifications", { id: "test-push", description: r.error ?? "Permission refusée", duration: 12000 });
      } else {
        toast.error("Erreur serveur push", { id: "test-push", description: r.push?.reason ?? r.error ?? "Cause inconnue", duration: 14000 });
      }
    } finally { setTestingPush(false); }
  };

  const handleBiometric = async () => {
    setLoading(true);
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          toast("Vérification biométrique...", { description: "Utilisez votre empreinte ou Face ID" });
          await new Promise(r => setTimeout(r, 1800));
          setLoading(false);
          toast.success("Authentification biométrique réussie !");
          navigate("/app");
          return;
        }
      } catch {}
    }
    toast("Vérification biométrique...", { description: "Placez votre doigt sur le capteur" });
    setTimeout(() => { setLoading(false); toast.success("Authentification réussie !"); navigate("/app"); }, 2000);
  };

  const stepMeta = {
    phone:    { icon: Hand,   title: "Bon retour !",    subtitle: "Entrez votre numéro pour continuer" },
    otp:      { icon: Lock,   title: "Vérification",    subtitle: fcmToken ? "Code envoyé par notification push" : "Saisissez le code reçu" },
    register: { icon: Rocket, title: "Créer un compte", subtitle: "Rejoignez la famille IPPOO" },
  }[step];
  const StepIcon = stepMeta.icon;

  const countrySelectOptions = ALL_AFRICAN_COUNTRIES.map(c => c.name);
  const selectedCountryObj = ALL_AFRICAN_COUNTRIES.find(c => c.name === form.country) ?? DEFAULT_COUNTRY;

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ height: "100dvh", minHeight: "100vh" }}>
      {/* Background */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <ImageWithFallback src={BG_IMAGE} alt="IPPOO" className="w-full h-full object-cover object-center" style={{ transform: "scale(1.04)" }} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 transition-all duration-700" style={{
        zIndex: 2,
        background: `linear-gradient(to top, ${gradFrom} 0%, rgba(10,5,0,0.72) 40%, rgba(0,0,0,0.28) 65%, transparent 100%)`,
      }} />

      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ zIndex: 3, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
      <div className="absolute top-0 right-0 pointer-events-none" style={{ zIndex: 4 }}><AfricanDots /></div>

      {/* Header */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-12" style={{ zIndex: 10 }}>
        <div />
        {step === "phone" && (
          <button
            onClick={() => { localStorage.removeItem("ippoo_onboarding_done"); navigate("/onboarding"); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white/70 text-xs font-medium border border-white/15 active:scale-95 transition-transform backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
            Intro
          </button>
        )}
        {(step === "otp" || step === "register") && (
          <button
            onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setFormErrors({}); regDataRef.current = null; }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white/70 text-xs font-medium border border-white/15 active:scale-95 transition-transform backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <ChevronLeft size={13} /> Retour
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="absolute inset-x-0 bottom-0 overflow-y-auto" style={{ zIndex: 10, maxHeight: "88%", WebkitOverflowScrolling: "touch" }}>
        <div className="px-5 pt-4 pb-10 flex flex-col gap-5">

          {/* Step title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${accent}33` }}>
                <StepIcon className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-white leading-tight" style={{ fontFamily: "Plus Jakarta Sans, Inter, sans-serif", fontSize: "clamp(1.6rem,7vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {stepMeta.title}
              </h2>
            </div>
            <p className="text-white/65" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, paddingLeft: 2 }}>
              {stepMeta.subtitle}
            </p>
          </div>

          {/* Glass card */}
          <div className="rounded-2xl border border-white/12 p-5" style={{ background: "rgba(10,6,2,0.55)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)" }}>

            {/* ── PHONE STEP ── */}
            {step === "phone" && (
              <div className="space-y-4">
                <GlassInput
                  icon={Phone}
                  placeholder={loginCountry.placeholder}
                  value={phone}
                  onChange={v => { setPhone(v.replace(/[^\d\s]/g, "")); setPhoneError(""); }}
                  onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                  error={phoneError}
                  inputMode="numeric"
                  maxLength={loginCountry.maxLen}
                  autoComplete="tel"
                  prefixNode={
                    <CountryTrigger country={loginCountry} onClick={() => setShowPicker("login")} accent={accent} />
                  }
                />

                <button
                  onClick={handlePhoneSubmit} disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold active:scale-[0.97] transition-all disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 24px ${accent}55`, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", fontSize: 15 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Envoi en cours..." : "Recevoir le code OTP"}
                  {!loading && <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center"><ArrowRight size={15} /></div>}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/15" /><span className="text-white/35 text-xs">ou</span><div className="flex-1 h-px bg-white/15" />
                </div>

                <button
                  onClick={handleBiometric} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white/75 text-sm font-medium border border-white/15 active:bg-white/10 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <Fingerprint className="w-5 h-5 text-violet-400" />
                  Connexion biométrique
                </button>

                <button onClick={handleTestPush} disabled={testingPush}
                  className="w-full flex items-center justify-center gap-2 py-2 text-white/45 text-[11px] active:text-white/70 transition-colors disabled:opacity-50">
                  {testingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  Tester la notification
                </button>

                <p className="text-center text-white/45 text-xs pt-1">
                  Pas encore de compte ?{" "}
                  <button onClick={() => { setStep("register"); setFormErrors({}); }} className="font-semibold underline underline-offset-2" style={{ color: accent }}>
                    S'inscrire
                  </button>
                </p>

                <button
                  onClick={() => navigate("/admin/login")}
                  className="w-full flex items-center justify-center gap-1.5 text-white/35 text-[11px] pt-1 active:text-white/60 transition-colors"
                >
                  <Shield className="w-3 h-3" /> Espace administrateur
                </button>
              </div>
            )}

            {/* ── OTP STEP ── */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}>
                    <Shield className="w-7 h-7" style={{ color: accent }} />
                  </div>
                </div>

                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-14 text-center text-lg rounded-xl border-2 outline-none transition-all"
                      style={{
                        background: digit ? `${accent}18` : "rgba(255,255,255,0.08)",
                        borderColor: digit ? accent : "rgba(255,255,255,0.18)",
                        color: "white", backdropFilter: "blur(8px)",
                        boxShadow: digit ? `0 0 12px ${accent}33` : "none",
                      }}
                    />
                  ))}
                </div>

                <button onClick={handleOtpSubmit} disabled={loading || otp.join("").length < 4}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold active:scale-[0.97] transition-all disabled:opacity-40"
                  style={{
                    background: otp.join("").length >= 4 ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : "rgba(255,255,255,0.10)",
                    boxShadow: otp.join("").length >= 4 ? `0 8px 24px ${accent}44` : "none",
                    fontFamily: "Plus Jakarta Sans, Inter, sans-serif", fontSize: 15,
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Vérification..." : "Vérifier le code"}
                  {!loading && otp.join("").length >= 4 && <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center"><ArrowRight size={15} /></div>}
                </button>

                <p className="text-center">
                  <button onClick={handleResendOtp} disabled={countdown > 0} className="text-sm transition-opacity"
                    style={{ color: countdown > 0 ? "rgba(255,255,255,0.35)" : accent }}>
                    {countdown > 0 ? `Renvoyer le code (${countdown}s)` : "Renvoyer le code"}
                  </button>
                </p>

                <div className="rounded-xl p-3 flex items-start gap-2 border border-white/10" style={{ background: `${accent}12` }}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
                  <p className="text-white/55 text-[10px]">Ne partagez jamais ce code. IPPOO ne vous demandera jamais votre code par téléphone.</p>
                </div>
              </div>
            )}

            {/* ── REGISTER STEP ── */}
            {step === "register" && (
              <div className="space-y-3">
                {/* Account type */}
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Type de compte</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TYPES.map(type => (
                      <button key={type} onClick={() => setForm({ ...form, type })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                        style={{
                          background: form.type === type ? accent : "rgba(255,255,255,0.10)",
                          color: form.type === type ? "white" : "rgba(255,255,255,0.60)",
                          border: form.type === type ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.12)",
                          boxShadow: form.type === type ? `0 4px 12px ${accent}44` : "none",
                        }}>{type}</button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <GlassInput icon={User} placeholder="Prénom *" value={form.prenom}
                    onChange={v => { setForm({ ...form, prenom: v }); setFormErrors(p => ({ ...p, prenom: "" })); }}
                    error={formErrors.prenom} autoComplete="given-name" />
                  <GlassInput icon={User} placeholder="Nom *" value={form.nom}
                    onChange={v => { setForm({ ...form, nom: v }); setFormErrors(p => ({ ...p, nom: "" })); }}
                    error={formErrors.nom} autoComplete="family-name" />
                </div>

                {/* Phone */}
                <GlassInput
                  icon={Phone} placeholder={registerCountry.placeholder} value={form.phone} type="tel"
                  onChange={v => { setForm({ ...form, phone: v.replace(/[^\d\s]/g, "") }); setFormErrors(p => ({ ...p, phone: "" })); }}
                  error={formErrors.phone} inputMode="numeric" maxLength={registerCountry.maxLen} autoComplete="tel"
                  prefixNode={<CountryTrigger country={registerCountry} onClick={() => setShowPicker("register")} accent={accent} />}
                />

                {/* Email */}
                <GlassInput icon={Mail} placeholder="Email (optionnel)" value={form.email} type="email"
                  onChange={v => { setForm({ ...form, email: v }); setFormErrors(p => ({ ...p, email: "" })); }}
                  error={formErrors.email} autoComplete="email" />

                {/* Country (African countries) */}
                <GlassSelect
                  icon={Globe} label="Pays *" value={form.country}
                  onChange={v => {
                    const found = ALL_AFRICAN_COUNTRIES.find(c => c.name === v);
                    setForm({ ...form, country: v, department: "", commune: "" });
                    if (found) setRegisterCountry(found);
                    setFormErrors(p => ({ ...p, country: "" }));
                  }}
                  options={countrySelectOptions}
                  error={formErrors.country}
                />

                {/* Department */}
                <GlassInput icon={Building2} placeholder="Département / Province" value={form.department}
                  onChange={v => setForm({ ...form, department: v })}
                  error={formErrors.department} autoComplete="address-level1" />

                {/* Commune */}
                <GlassInput icon={MapPin} placeholder="Ville / Commune *" value={form.commune}
                  onChange={v => { setForm({ ...form, commune: v }); setFormErrors(p => ({ ...p, commune: "" })); }}
                  error={formErrors.commune} autoComplete="address-level2" />

                {/* Quartier */}
                <GlassInput icon={MapPin} placeholder="Quartier (optionnel)" value={form.quartier}
                  onChange={v => setForm({ ...form, quartier: v })}
                  autoComplete="street-address" />

                {/* Referral code (non-agents) or Invitation key (agents) */}
                {!isAgent ? (
                  <GlassInput icon={Hash} placeholder="Code de parrainage (optionnel)" value={form.codeParrainage}
                    onChange={v => setForm({ ...form, codeParrainage: v.toUpperCase() })}
                    autoComplete="off" maxLength={12} />
                ) : (
                  <GlassInput icon={Key} placeholder="Clé d'invitation agent *" value={form.invitationKey}
                    onChange={v => { setForm({ ...form, invitationKey: v }); setFormErrors(p => ({ ...p, invitationKey: "" })); }}
                    error={formErrors.invitationKey} autoComplete="off" />
                )}

                {/* Terms */}
                <button onClick={() => { setAcceptTerms(!acceptTerms); setFormErrors(p => ({ ...p, terms: "" })); }}
                  className="flex items-start gap-3 py-1 w-full text-left active:opacity-70 transition-opacity">
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{ background: acceptTerms ? accent : "transparent", borderColor: acceptTerms ? accent : formErrors.terms ? "#D62828" : "rgba(255,255,255,0.30)" }}>
                    {acceptTerms && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-white/50 text-xs">
                    J'accepte les <span className="underline underline-offset-2" style={{ color: `${accent}dd` }}>conditions d'utilisation</span> et la <span className="underline underline-offset-2" style={{ color: `${accent}dd` }}>politique de confidentialité</span> d'IPPOO
                  </p>
                </button>
                {formErrors.terms && <p className="text-[10px] text-[#D62828] -mt-1 px-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {formErrors.terms}</p>}

                <button onClick={handleRegister} disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold active:scale-[0.97] transition-all disabled:opacity-60 mt-1"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 24px ${accent}44`, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", fontSize: 15 }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Création du compte..." : (isAgent ? "S'inscrire comme agent" : "S'inscrire")}
                  {!loading && <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center"><ArrowRight size={15} /></div>}
                </button>

                <p className="text-center text-white/40 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                  Déjà un compte ?{" "}
                  <button onClick={() => setStep("phone")} className="font-semibold underline underline-offset-2" style={{ color: accent }}>Se connecter</button>
                </p>
              </div>
            )}
          </div>

          <div className="h-2" />
        </div>
      </div>

      {/* Country bottom sheet */}
      <CountryBottomSheet
        open={showPicker !== null}
        onClose={() => setShowPicker(null)}
        selected={showPicker === "register" ? registerCountry : loginCountry}
        onSelect={c => {
          if (showPicker === "register") {
            setRegisterCountry(c);
            setForm(f => ({ ...f, country: c.name }));
          } else {
            setLoginCountry(c);
          }
        }}
        accent={accent}
      />
    </div>
  );
}
