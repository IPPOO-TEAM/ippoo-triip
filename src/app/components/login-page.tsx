import ippooLogo from "../../imports/IPPOO_Transport_&_Logistique-1.png";
import { generateOTP } from "./utils";
import { verifyOtp } from "../services/auth";
import { useAppStore } from "../store/app-store";
import { logger } from "../services/logger";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Phone, Shield, ArrowRight, ChevronLeft, Fingerprint,
  Mail, User, Check, AlertTriangle, Loader2, ChevronDown, X, Globe, Hand, Lock, Rocket,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

import imgLoginBg from "figma:asset/6cc3d4905bdcc38a53430299260f13a383d87250.png";

/* ─────────────────────────────────────────
   Countries data
───────────────────────────────────────── */
interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
  maxLen: number;
}

const COUNTRIES: Country[] = [
  { code: "BJ", name: "Bénin",        flag: "🇧🇯", dialCode: "+229", placeholder: "97 00 00 00",    maxLen: 10 },
  { code: "NE", name: "Niger",         flag: "🇳🇪", dialCode: "+227", placeholder: "96 00 00 00",    maxLen: 10 },
  { code: "NG", name: "Nigéria",       flag: "🇳🇬", dialCode: "+234", placeholder: "803 000 0000",   maxLen: 13 },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", placeholder: "07 00 00 00 00", maxLen: 13 },
  { code: "GH", name: "Ghana",         flag: "🇬🇭", dialCode: "+233", placeholder: "20 000 0000",    maxLen: 12 },
];

/* ─────────────────────────────────────────
   Shared visual atoms
───────────────────────────────────────── */
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

/* ───────────────────────────────────────
   Country Bottom Sheet
──────────────────────────────────────── */
function CountryBottomSheet({
  open, onClose, selected, onSelect, accent,
}: {
  open: boolean;
  onClose: () => void;
  selected: Country;
  onSelect: (c: Country) => void;
  accent: string;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          zIndex: 50,
          background: open ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0)",
          backdropFilter: open ? "blur(4px)" : "none",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 transition-transform duration-400"
        style={{
          zIndex: 51,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transitionTimingFunction: open ? "cubic-bezier(0.22,1,0.36,1)" : "ease-in",
        }}
      >
        <div
          className="rounded-t-3xl border-t border-white/15 p-5 pb-10"
          style={{
            background: "rgba(8,4,1,0.85)",
            backdropFilter: "blur(28px) saturate(1.8)",
            WebkitBackdropFilter: "blur(28px) saturate(1.8)",
          }}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-1 rounded-full bg-white/20 absolute left-1/2 -translate-x-1/2 top-3" />
            <p
              className="text-white/80 text-sm font-semibold"
              style={{ fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}
            >
              <Globe size={14} className="text-white/70 inline mr-1.5" />Sélectionner l'indicatif
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <X size={14} className="text-white/60" />
            </button>
          </div>

          {/* Country list */}
          <div className="flex flex-col gap-2">
            {COUNTRIES.map(country => {
              const isSelected = country.code === selected.code;
              return (
                <button
                  key={country.code}
                  onClick={() => { onSelect(country); onClose(); }}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: isSelected ? `${accent}20` : "rgba(255,255,255,0.06)",
                    border: isSelected ? `1.5px solid ${accent}55` : "1.5px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? `0 4px 16px ${accent}25` : "none",
                  }}
                >
                  {/* Flag */}
                  <span className="text-3xl leading-none">{country.flag}</span>

                  {/* Name + placeholder hint */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white text-sm font-medium leading-tight"
                      style={{ fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}
                    >
                      {country.name}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{country.placeholder}</p>
                  </div>

                  {/* Dial code badge */}
                  <div
                    className="px-3 py-1.5 rounded-xl shrink-0"
                    style={{
                      background: isSelected ? accent : "rgba(255,255,255,0.10)",
                      border: isSelected ? "none" : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <span
                      className="text-white font-bold text-sm"
                      style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
                    >
                      {country.dialCode}
                    </span>
                  </div>

                  {/* Check */}
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: accent }}
                    >
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Country Trigger Button (shared)
───────────────────────────────────────── */
function CountryTrigger({ country, onClick, accent }: { country: Country; onClick: () => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 active:scale-95 transition-transform"
      style={{
        background: `${accent}15`,
        borderColor: `${accent}35`,
      }}
    >
      <span className="text-base leading-none">{country.flag}</span>
      <span
        className="text-white/90 text-xs font-semibold"
        style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}
      >
        {country.dialCode}
      </span>
      <ChevronDown size={11} className="text-white/50" />
    </button>
  );
}

/* ─────────────────────────────────────────
   Glass input (generic)
───────────────────────────────────────── */
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

        {/* String prefix (for non-phone fields) */}
        {prefix && !prefixNode && (
          <span className="text-white/60 text-sm px-2 py-0.5 rounded-lg border border-white/15 shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            {prefix}
          </span>
        )}

        {/* Node prefix (country selector) */}
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

/* ─────────────────────────────────────────
   Main LoginPage
─────��─────────────────────────────────── */
export function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");

  /** Hydrate le store global IPPOO après OTP validé (audit améliorations) */
  const finalizeAuth = async (phoneE164: string, code: string, redirect: string) => {
    try {
      const session = await verifyOtp(phoneE164, code);
      dispatch({ type: "SET_USER", user: session.user });
      logger.info("auth.login.success", { phone: phoneE164 });
      toast.success("Connexion réussie !", { description: `Bienvenue ${session.user.fullName}` });
      navigate(redirect);
    } catch (e) {
      logger.warn("auth.login.fail", { e: String(e) });
      toast.error("Échec de la connexion");
    }
  };

  /* Country selectors — independent for login + register */
  const [loginCountry, setLoginCountry]       = useState<Country>(COUNTRIES[0]);
  const [registerCountry, setRegisterCountry] = useState<Country>(COUNTRIES[0]);
  const [showPicker, setShowPicker]           = useState<"login" | "register" | null>(null);

  const [phone, setPhone]       = useState("");
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState(""); // OTP généré côté client
  const [form, setForm]         = useState({ nom: "", prenom: "", phone: "", email: "", type: "Particulier" });
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading]   = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showEmail, setShowEmail]    = useState(false);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs    = useRef<(HTMLInputElement | null)[]>([]);

  const getTargetRoute = () => form.type === "Chauffeur/Agent" ? "/driver" : form.type === "Administrateur" ? "/admin" : "/";
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

  const accountTypes = ["Particulier", "Etudiant", "Fonctionnaire", "Commercant", "Dame de marché", "Salarié", "Chauffeur/Agent", "Administrateur", "Autre"];

  const validatePhone = (p: string) => {
    const c = p.replace(/\s/g, "");
    if (!c) { setPhoneError("Entrez un numéro de téléphone"); return false; }
    if (c.length < 7) { setPhoneError("Numéro trop court"); return false; }
    if (!/^\d+$/.test(c)) { setPhoneError("Chiffres uniquement"); return false; }
    setPhoneError(""); return true;
  };

  const handlePhoneSubmit = () => {
    if (!validatePhone(phone)) return;
    setLoading(true);
    const code = generateOTP();
    setGeneratedOtp(code);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      toast.success("Code OTP envoyé !", {
        description: `SMS au ${loginCountry.dialCode} ${phone}. Code de test : ${code}`,
        duration: 10000,
      });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.join("").length === 6) {
      const entered = newOtp.join("");
      if (generatedOtp && entered !== generatedOtp) {
        toast.error("Code OTP incorrect", { description: `Code attendu: ${generatedOtp}` });
        return;
      }
      setLoading(true);
      const fullPhone = `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      finalizeAuth(fullPhone, entered, getTargetRoute()).finally(() => setLoading(false));
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
      const fullPhone = `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
      finalizeAuth(fullPhone, pasted, getTargetRoute()).finally(() => setLoading(false));
    }
  };

  const handleOtpSubmit = () => {
    const entered = otp.join("");
    if (entered.length < 4) { toast.error("Entrez le code OTP complet"); return; }
    if (generatedOtp && entered !== generatedOtp) {
      toast.error("Code OTP incorrect", { description: `Code attendu: ${generatedOtp}` });
      return;
    }
    setLoading(true);
    const fullPhone = `${loginCountry.dialCode}${phone}`.replace(/\s+/g, "");
    finalizeAuth(fullPhone, entered, getTargetRoute()).finally(() => setLoading(false));
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(30); setOtp(["", "", "", "", "", ""]);
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
    toast.success("Code renvoyé !", { description: `Nouveau SMS au ${loginCountry.dialCode} ${phone}` });
    otpRefs.current[0]?.focus();
  };

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    if (!form.prenom.trim()) errors.prenom = "Prénom requis";
    if (!form.nom.trim()) errors.nom = "Nom requis";
    if (!form.phone.trim()) errors.phone = "Téléphone requis";
    else if (form.phone.replace(/\s/g, "").length < 7) errors.phone = "Numéro trop court";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    if (!acceptTerms) errors.terms = "Acceptez les conditions";
    setFormErrors(errors); return Object.keys(errors).length === 0;
  };

  const handleRegister = () => {
    if (!validateRegister()) return;
    setLoading(true);
    setPhone(form.phone);
    const code = generateOTP();
    setGeneratedOtp(code);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      toast.success("Inscription en cours...", {
        description: `Code de test : ${code}. SMS au ${registerCountry.dialCode} ${form.phone}`,
        duration: 10000,
      });
    }, 1200);
  };

  const handleBiometric = async () => {
    setLoading(true);
    // Tenter l'authentification WebAuthn (biométrie native du navigateur)
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          toast("Vérification biométrique...", { description: "Utilisez votre empreinte ou Face ID" });
          // Simulation WebAuthn sans backend (enregistrement requis en prod)
          await new Promise(r => setTimeout(r, 1800));
          setLoading(false);
          toast.success("Authentification biométrique réussie !");
          navigate("/");
          return;
        }
      } catch (_) {}
    }
    // Fallback pour navigateurs sans WebAuthn
    toast("Vérification biométrique...", { description: "Placez votre doigt sur le capteur" });
    setTimeout(() => { setLoading(false); toast.success("Authentification réussie !"); navigate("/"); }, 2000);
  };

  const stepMeta = {
    phone:    { icon: Hand, title: "Bon retour !",    subtitle: "Entrez votre numéro pour continuer" },
    otp:      { icon: Lock, title: "Vérification",    subtitle: `Code à 6 chiffres envoyé au ${loginCountry.dialCode} ${phone}` },
    register: { icon: Rocket, title: "Créer un compte", subtitle: "Rejoignez la famille IPPOO" },
  }[step];

  /* ── Render ── */
  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "100dvh", minHeight: "100vh" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <ImageWithFallback src={BG_IMAGE} alt="IPPOO" className="w-full h-full object-cover object-center" style={{ transform: "scale(1.04)" }} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 transition-all duration-700" style={{
        zIndex: 2,
        background: `linear-gradient(to top, ${gradFrom} 0%, rgba(10,5,0,0.72) 40%, rgba(0,0,0,0.28) 65%, transparent 100%)`,
      }} />

      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ zIndex: 3, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

      {/* African dots */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{ zIndex: 4 }}><AfricanDots /></div>

      {/* ── Country bottom sheet (rendered inside the relative container) ── */}
      <CountryBottomSheet
        open={showPicker !== null}
        onClose={() => setShowPicker(null)}
        selected={showPicker === "register" ? registerCountry : loginCountry}
        onSelect={c => { if (showPicker === "register") setRegisterCountry(c); else setLoginCountry(c); }}
        accent={accent}
      />

      {/* ── Header ── */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-12" style={{ zIndex: 10 }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src={ippooLogo} alt="IPPOO TRIIP" className="h-10 w-auto" />
        </div>

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
            onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setFormErrors({}); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white/70 text-xs font-medium border border-white/15 active:scale-95 transition-transform backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <ChevronLeft size={13} /> Retour
          </button>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-y-auto"
        style={{ zIndex: 10, maxHeight: "88%", WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-5 pt-4 pb-10 flex flex-col gap-5">

          {/* Step title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${accent}33` }}>
                <stepMeta.icon className="w-4 h-4 text-white" />
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
          <div className="rounded-3xl border border-white/12 p-5" style={{ background: "rgba(10,6,2,0.55)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)" }}>

            {/* ══ PHONE STEP ══ */}
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
                    <CountryTrigger
                      country={loginCountry}
                      onClick={() => setShowPicker("login")}
                      accent={accent}
                    />
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
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-white/35 text-xs">ou</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>

                <button
                  onClick={handleBiometric} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white/75 text-sm font-medium border border-white/15 active:bg-white/10 transition-all"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <Fingerprint className="w-5 h-5 text-violet-400" />
                  Connexion biométrique
                </button>

                <p className="text-center text-white/45 text-xs pt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                  Pas encore de compte ?{" "}
                  <button onClick={() => { setStep("register"); setFormErrors({}); }} className="font-semibold underline underline-offset-2" style={{ color: accent }}>
                    S'inscrire
                  </button>
                </p>
              </div>
            )}

            {/* ══ OTP STEP ══ */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}>
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

                <button
                  onClick={handleOtpSubmit} disabled={loading || otp.join("").length < 4}
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

            {/* ══ REGISTER STEP ══ */}
            {step === "register" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <GlassInput icon={User} placeholder="Prénom" value={form.prenom}
                    onChange={v => { setForm({ ...form, prenom: v }); setFormErrors(p => ({ ...p, prenom: "" })); }}
                    error={formErrors.prenom} autoComplete="given-name" />
                  <GlassInput icon={User} placeholder="Nom" value={form.nom}
                    onChange={v => { setForm({ ...form, nom: v }); setFormErrors(p => ({ ...p, nom: "" })); }}
                    error={formErrors.nom} autoComplete="family-name" />
                </div>

                <GlassInput
                  icon={Phone}
                  placeholder={registerCountry.placeholder}
                  value={form.phone} type="tel"
                  onChange={v => { setForm({ ...form, phone: v.replace(/[^\d\s]/g, "") }); setFormErrors(p => ({ ...p, phone: "" })); }}
                  error={formErrors.phone}
                  inputMode="numeric"
                  maxLength={registerCountry.maxLen}
                  autoComplete="tel"
                  prefixNode={
                    <CountryTrigger
                      country={registerCountry}
                      onClick={() => setShowPicker("register")}
                      accent={accent}
                    />
                  }
                />

                {!showEmail ? (
                  <button onClick={() => setShowEmail(true)} className="flex items-center gap-2 text-xs py-1 px-2" style={{ color: `${accent}cc` }}>
                    <Mail size={13} /> Ajouter un email (optionnel)
                  </button>
                ) : (
                  <GlassInput icon={Mail} placeholder="Email (optionnel)" value={form.email} type="email"
                    onChange={v => { setForm({ ...form, email: v }); setFormErrors(p => ({ ...p, email: "" })); }}
                    error={formErrors.email} autoComplete="email" />
                )}

                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>Type de compte</p>
                  <div className="flex flex-wrap gap-2">
                    {accountTypes.map(type => (
                      <button key={type} onClick={() => setForm({ ...form, type })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                        style={{
                          background: form.type === type ? accent : "rgba(255,255,255,0.10)",
                          color: form.type === type ? "white" : "rgba(255,255,255,0.60)",
                          border: form.type === type ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.12)",
                          boxShadow: form.type === type ? `0 4px 12px ${accent}44` : "none",
                        }}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

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
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold active:scale-[0.97] transition-all disabled:opacity-60 mt-2"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 24px ${accent}44`, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", fontSize: 15 }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Création du compte..." : "S'inscrire"}
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
    </div>
  );
}