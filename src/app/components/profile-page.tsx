import { useNavigate } from "react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronRight, ChevronLeft, User, MapPin, Moon, FileText, LogOut,
  Camera, Star, Settings, Key, Fingerprint, Eye, Award, Ticket,
  X, Check, Plus, Trash2, Upload, Globe, Bell, Phone, Mail, Shield,
  Edit3, EyeOff, AlertTriangle, Info, Sun, Monitor, MapPinned,
  Share2, HelpCircle, MessageCircle, Heart, Smartphone, Clock,
  Database, UserX, Copy, ExternalLink, ChevronDown, Lock, Pencil,
  Image, RotateCcw, SwitchCamera, ZoomIn
} from "lucide-react";
import { AfricanPattern } from "./icons";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { AVATARS } from "./avatars";
import { SettingsCard } from "./settings-card";
import { api } from "../api/client";

/* ─── Types ─── */
type PanelId = null | "personal" | "addresses" | "documents" | "pin" | "biometric" | "privacy" | "darkmode" | "settings" | "logout";

interface Address {
  id: number;
  label: string;
  value: string;
  isDefault?: boolean;
}

interface DocItem {
  id: number;
  name: string;
  type: string;
  status: "verified" | "pending" | "rejected";
  date: string;
}

/* ─── Slide Panel Wrapper ─── */
function SlidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "visible" : "invisible"}`}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <p className="text-slate-800 flex-1">{title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Toggle ─── */
function Toggle({ on, onToggle, label, desc, disabled = false }: { on: boolean; onToggle: () => void; label: string; desc: string; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onToggle} className={`w-full flex items-center justify-between py-4 border-b border-slate-50 ${disabled ? "opacity-50" : ""}`}>
      <div className="text-left">
        <p className="text-sm text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <div className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${on ? "bg-[#2A9D8F]" : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

/* ─── Input Field ─── */
function Field({ label, value, onChange, type = "text", icon: Icon, placeholder, error, disabled = false, rightElement }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; icon?: React.ElementType;
  placeholder?: string; error?: string; disabled?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-50 border rounded-xl py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F77F00]/30 focus:border-[#F77F00] transition ${Icon ? "pl-10" : "px-4"} ${rightElement ? "pr-12" : "pr-4"} ${error ? "border-[#D62828] bg-red-50/30" : "border-slate-200"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && <p className="text-[10px] text-[#D62828] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

/* ─── Save Button ─── */
function SaveButton({ onClick, label = "Enregistrer", loading = false, disabled = false }: { onClick: () => void; label?: string; loading?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={loading || disabled ? undefined : onClick}
      className={`w-full mt-6 bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white py-3.5 rounded-xl shadow-lg shadow-orange-200/50 active:scale-[0.98] transition flex items-center justify-center gap-2 ${(loading || disabled) ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {label}
    </button>
  );
}

/* ─── Section Header ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">{children}</p>;
}

/* ─── Info Row ─── */
function InfoRow({ icon: Icon, label, value, color = "text-slate-400" }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm text-slate-500 flex-1">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

/* ─── PIN Strength ─── */
function PinStrength({ pin }: { pin: string }) {
  const len = pin.length;
  const isNumeric = /^\d+$/.test(pin);
  const level = !pin ? 0 : !isNumeric ? 0 : len < 4 ? 1 : len === 4 ? 2 : len >= 6 ? 3 : 2;
  const labels = ["", "Faible", "Moyen", "Fort"];
  const colors = ["", "bg-[#D62828]", "bg-[#E9C46A]", "bg-[#2A9D8F]"];
  const textColors = ["", "text-[#D62828]", "text-[#E9C46A]", "text-[#2A9D8F]"];

  if (!pin) return null;
  return (
    <div className="mb-4">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= level ? colors[level] : "bg-slate-200"}`} />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <p className={`text-[10px] ${textColors[level]}`}>{labels[level]}</p>
        {!isNumeric && pin.length > 0 && <p className="text-[10px] text-[#D62828]">Chiffres uniquement</p>}
      </div>
    </div>
  );
}

/* ─── Menu config ─── */
const menuSections = [
  {
    title: "COMPTE",
    items: [
      { icon: User, label: "Informations personnelles", desc: "Nom, telephone, email", gradient: "from-blue-500 to-indigo-600", panel: "personal" as PanelId },
      { icon: MapPin, label: "Adresses favorites", desc: "Domicile, Bureau, Marche", gradient: "from-cyan-500 to-teal-600", panel: "addresses" as PanelId },
      { icon: FileText, label: "Documents", desc: "Verification d'identite", gradient: "from-orange-400 to-rose-500", panel: "documents" as PanelId },
      { icon: Ticket, label: "Mes coupons", desc: "Promotions et reductions", gradient: "from-amber-400 to-amber-600", panel: null as PanelId },
    ],
  },
  {
    title: "SECURITE",
    items: [
      { icon: Key, label: "Changer le code PIN", desc: "Securite IPPOO Cash", gradient: "from-emerald-500 to-green-600", panel: "pin" as PanelId },
      { icon: Fingerprint, label: "Connexion biometrique", desc: "Empreinte / FaceID", gradient: "from-violet-500 to-purple-600", panel: "biometric" as PanelId },
      { icon: Eye, label: "Confidentialite", desc: "Donnees et visibilite", gradient: "from-slate-500 to-slate-700", panel: "privacy" as PanelId },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { icon: Moon, label: "Apparence", desc: "Theme de l'application", gradient: "from-indigo-500 to-violet-600", panel: "darkmode" as PanelId },
      { icon: Settings, label: "Parametres", desc: "Langue, notifications, compte", gradient: "from-slate-400 to-slate-600", panel: "settings" as PanelId },
    ],
  },
];

/* ──────────────────── MAIN COMPONENT ──────────────────── */
export function ProfilePage() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [saving, setSaving] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(AVATARS["DA"] || "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState("");

  /* Camera capture */
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    stopCamera();
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      toast.error("Impossible d'accéder à la caméra", { description: "Vérifiez les permissions de votre navigateur" });
      setShowCamera(false);
    }
  }, [facingMode, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Centre-crop carré
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    // Mirror pour selfie
    if (facingMode === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }, [facingMode, stopCamera]);

  const toggleFacingMode = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (showCamera && !capturedPhoto) startCamera(next);
  }, [facingMode, showCamera, capturedPhoto, startCamera]);

  const confirmCapturedPhoto = useCallback(() => {
    if (capturedPhoto) {
      setAvatarSrc(capturedPhoto);
      toast.success("Photo de profil mise à jour !");
    }
    setCapturedPhoto(null);
    setShowCamera(false);
  }, [capturedPhoto]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const closeCamera = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setShowCamera(false);
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  /* Personal info */
  const [name, setName] = useState("Dosso Adjovi");
  const [firstName, setFirstName] = useState("Dosso");
  const [lastName, setLastName] = useState("Adjovi");
  const [phone, setPhone] = useState("+229 97 00 00 00");
  const [email, setEmail] = useState("dosso.adjovi@email.com");
  const [gender, setGender] = useState<"homme" | "femme" | "autre">("homme");
  const [birthDate, setBirthDate] = useState("1995-06-15");
  const [accountType, setAccountType] = useState<"particulier" | "professionnel">("particulier");
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  // Charge l'identité depuis le backend mock (repli sur les valeurs par défaut)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await api.get<any>("/users/me");
        if (cancelled || !u) return;
        if (u.fullName) {
          setName(u.fullName);
          const [fn, ...rest] = u.fullName.split(" ");
          setFirstName(fn);
          if (rest.length) setLastName(rest.join(" "));
        }
        if (u.phone) setPhone(u.phone);
        if (u.email) setEmail(u.email);
      } catch {
        /* repli silencieux */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Addresses */
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, label: "Domicile", value: "Quartier Zongo, Rue 142, Cotonou", isDefault: true },
    { id: 2, label: "Bureau", value: "Boulevard St-Michel, Immeuble BCEAO, Cotonou" },
    { id: 3, label: "Marche Dantokpa", value: "Marche Dantokpa, Stand A24, Cotonou" },
  ]);
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddrValue, setNewAddrValue] = useState("");
  const [editingAddr, setEditingAddr] = useState<number | null>(null);
  const [editAddrLabel, setEditAddrLabel] = useState("");
  const [editAddrValue, setEditAddrValue] = useState("");

  /* Documents */
  const [docs, setDocs] = useState<DocItem[]>([
    { id: 1, name: "Carte Nationale d'Identite (Recto)", type: "CNI", status: "verified", date: "12 Mars 2026" },
    { id: 2, name: "Carte Nationale d'Identite (Verso)", type: "CNI", status: "verified", date: "12 Mars 2026" },
    { id: 3, name: "Justificatif de domicile", type: "Justificatif", status: "pending", date: "08 Avril 2026" },
  ]);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [newDocType, setNewDocType] = useState("");
  const docTypes = ["CNI (Recto)", "CNI (Verso)", "Passeport", "Permis de conduire", "Justificatif de domicile", "Attestation professionnelle"];

  /* PIN */
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  /* Biometric */
  const [biometric, setBiometric] = useState(false);
  const [biometricEnrolling, setBiometricEnrolling] = useState(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face">("fingerprint");

  /* Privacy */
  const [maskNumber, setMaskNumber] = useState(true);
  const [hideActivity, setHideActivity] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowDataCollection, setAllowDataCollection] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  /* Appearance */
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">("light");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  /* Settings */
  const [language, setLanguage] = useState("Francais");
  const [notifRide, setNotifRide] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifChat, setNotifChat] = useState(false);
  const [notifSound, setNotifSound] = useState(true);
  const [notifVibrate, setNotifVibrate] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const closePanel = () => { setActivePanel(null); setPersonalErrors({}); setSaving(false); };

  const handleMenuClick = (item: (typeof menuSections)[0]["items"][0]) => {
    if (item.label === "Mes coupons") navigate("/app/coupons");
    else if (item.panel) setActivePanel(item.panel);
  };

  /* ─── Validators ─── */
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = (p: string) => /^\+?\d[\d\s]{7,}$/.test(p.replace(/\s/g, ""));

  const handleSavePersonal = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "Prenom requis";
    if (!lastName.trim()) errors.lastName = "Nom requis";
    if (!validatePhone(phone)) errors.phone = "Numero de telephone invalide";
    if (email && !validateEmail(email)) errors.email = "Adresse email invalide";
    setPersonalErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    // Persiste dans le backend mock (repli silencieux si indisponible)
    api.patch("/users/me", { fullName: `${firstName} ${lastName}`, phone, email }).catch(() => {});
    setTimeout(() => {
      setName(`${firstName} ${lastName}`);
      setSaving(false);
      toast.success("Profil mis a jour avec succes", { description: `${firstName} ${lastName} · ${phone}` });
      closePanel();
    }, 800);
  };

  const handleSavePin = () => {
    if (!oldPin) { toast.error("Entrez votre ancien code PIN"); return; }
    if (oldPin !== "1234") { toast.error("Ancien code PIN incorrect", { description: "Le PIN par defaut est 1234" }); return; }
    if (!newPin) { toast.error("Entrez un nouveau code PIN"); return; }
    if (!/^\d+$/.test(newPin)) { toast.error("Le PIN ne doit contenir que des chiffres"); return; }
    if (newPin.length < 4) { toast.error("Le PIN doit contenir au moins 4 chiffres"); return; }
    if (newPin !== confirmPin) { toast.error("Les codes PIN ne correspondent pas"); return; }
    if (newPin === oldPin) { toast.error("Le nouveau PIN doit etre different de l'ancien"); return; }

    setSaving(true);
    setTimeout(() => {
      toast.success("Code PIN modifie avec succes", { description: "Votre nouveau PIN est actif" });
      setOldPin(""); setNewPin(""); setConfirmPin("");
      setSaving(false);
      closePanel();
    }, 800);
  };

  const handleBiometricToggle = async () => {
    if (!biometric) {
      setBiometricEnrolling(true);
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (available) {
            await new Promise(r => setTimeout(r, 2000));
            setBiometricEnrolling(false);
            setBiometric(true);
            toast.success(`${biometricType === "fingerprint" ? "Empreinte digitale" : "Reconnaissance faciale"} activee`, {
              description: "Vous pouvez desormais vous connecter avec votre biometrie",
            });
            return;
          }
        } catch (_) {}
      }
      setTimeout(() => {
        setBiometricEnrolling(false);
        setBiometric(true);
        toast.success(`${biometricType === "fingerprint" ? "Empreinte digitale" : "Reconnaissance faciale"} activee`);
      }, 2000);
    } else {
      setBiometric(false);
      toast("Connexion biometrique desactivee");
    }
  };

  const startEditAddr = (addr: Address) => {
    setEditingAddr(addr.id);
    setEditAddrLabel(addr.label);
    setEditAddrValue(addr.value);
  };

  const saveEditAddr = () => {
    if (!editAddrLabel.trim() || !editAddrValue.trim()) { toast.error("Remplissez les deux champs"); return; }
    setAddresses(prev => prev.map(a => a.id === editingAddr ? { ...a, label: editAddrLabel, value: editAddrValue } : a));
    setEditingAddr(null);
    toast.success("Adresse modifiee");
  };

  const handleUploadDoc = (type: string) => {
    setPendingDocType(type);
    setShowDocUpload(false);
    setNewDocType("");
    // Declencher le selecteur de fichier reel
    setTimeout(() => docInputRef.current?.click(), 100);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "SUPPRIMER") {
      toast.error("Tapez SUPPRIMER pour confirmer");
      return;
    }
    toast.success("Compte supprime", { description: "Vos donnees seront effacees sous 30 jours" });
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Input caché pour avatar (unique, top-level) */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Image trop lourde", { description: "Taille max : 5 Mo" });
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            setAvatarSrc(ev.target?.result as string);
            toast.success("Photo de profil mise à jour !");
          };
          reader.onerror = () => {
            toast.error("Erreur de lecture du fichier");
          };
          reader.readAsDataURL(file);
        }}
      />
      {/* Input cache pour documents */}
      <input
        ref={docInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file || !pendingDocType) return;
          const newDoc: DocItem = {
            id: Date.now(),
            name: `${pendingDocType}, ${file.name}`,
            type: pendingDocType.includes("CNI") ? "CNI" : pendingDocType.includes("Passeport") ? "Passeport" : "Autre",
            status: "pending",
            date: "10 Avril 2026",
          };
          setDocs(prev => [...prev, newDoc]);
          setPendingDocType("");
          toast.success("Document televerse !", { description: `${pendingDocType}, Verification sous 24-48h` });
        }}
      />
      {/* ═══ HEADER ═══ */}
      <div className="relative bg-[#1E6091] px-5 pt-14 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/15 rounded-full -mr-20 -mt-10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative">
            <div className="w-[72px] h-[72px] bg-white/15 rounded-3xl flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-xl">
              {avatarSrc ? (
                <ImageWithFallback src={avatarSrc} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F77F00] to-amber-400 flex items-center justify-center">
                  <span className="text-white text-xl">DA</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPhotoMenu(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition"
            >
              <Camera className="w-4 h-4 text-blue-600" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-white text-lg">{name}</p>
            <p className="text-blue-200 text-xs">{maskNumber ? phone.replace(/(\d{2})\s(\d{2})\s(\d{2})\s(\d{2})$/, "** ** ** **") : phone}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-white/15 text-white px-2.5 py-1 rounded-full border border-white/15 capitalize">{accountType}</span>
              <div className="flex items-center gap-1 bg-white/15 px-2 py-1 rounded-full border border-white/15">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-white">4.8</span>
              </div>
            </div>
          </div>
          <button onClick={() => setActivePanel("personal")} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center border border-white/10">
            <Edit3 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="px-5 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-5 border border-white/80">
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => navigate("/app/history")} className="text-center group">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 group-active:scale-90 transition">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-blue-600 text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>24</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Courses</p>
            </button>
            <button onClick={() => navigate("/app/history")} className="text-center border-x border-slate-100 group">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2 group-active:scale-90 transition">
                <Award className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-orange-500 text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>12</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Livraisons</p>
            </button>
            <button onClick={() => navigate("/app/wallet")} className="text-center group">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 group-active:scale-90 transition">
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-emerald-500 text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>12.3k</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">IPPOO Cash</p>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RÉGLAGES AVANCÉS (audit améliorations) ═══ */}
      <div className="px-5 mt-5">
        <SettingsCard />
      </div>

      {/* ═══ MENU ═══ */}
      <div className="px-5 mt-5 space-y-5">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] text-slate-400 tracking-widest mb-2.5 px-1">{section.title}</p>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition active:bg-slate-100 ${
                    i < section.items.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className={`w-9 h-9 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Support & Help */}
        <div>
          <p className="text-[10px] text-slate-400 tracking-widest mb-2.5 px-1">AIDE</p>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <button onClick={() => navigate("/app/support")} className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition active:bg-slate-100 border-b border-slate-50">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-slate-800">Centre d'aide</p>
                <p className="text-[10px] text-slate-400">FAQ et support client</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("IPPOO-2024-USR-DA"); toast.success("ID copie : IPPOO-2024-USR-DA"); }} className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition active:bg-slate-100">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shadow-sm">
                <Copy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-slate-800">Mon ID utilisateur</p>
                <p className="text-[10px] text-slate-400">IPPOO-2024-USR-DA</p>
              </div>
              <Copy className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* App version */}
        <div className="text-center py-2">
          <p className="text-[10px] text-slate-300">IPPOO TRIIP · v1.4.2</p>
        </div>

        <button
          onClick={() => setActivePanel("logout")}
          className="w-full flex items-center justify-center gap-2 text-red-500 py-3.5 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" /> Deconnexion
        </button>
      </div>

      {/* ═══════════════ PANELS ═══════════════ */}

      {/* ─── INFORMATIONS PERSONNELLES ─── */}
      <SlidePanel open={activePanel === "personal"} onClose={closePanel} title="Informations personnelles">
        <div className="relative w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-6 shadow-lg">
          {avatarSrc ? (
            <ImageWithFallback src={avatarSrc} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F77F00] to-amber-400 flex items-center justify-center">
              <span className="text-white text-3xl">DA</span>
            </div>
          )}
          <button
            onClick={() => setShowPhotoMenu(true)}
            className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>

        <SectionLabel>Identite</SectionLabel>
        <Field label="Prenom" value={firstName} onChange={setFirstName} icon={User} error={personalErrors.firstName} placeholder="Votre prenom" />
        <Field label="Nom de famille" value={lastName} onChange={setLastName} icon={User} error={personalErrors.lastName} placeholder="Votre nom" />

        <div className="mb-4">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 block">Genre</label>
          <div className="flex gap-2">
            {([["homme", "Homme"], ["femme", "Femme"], ["autre", "Autre"]] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setGender(val)}
                className={`flex-1 py-2.5 rounded-xl text-sm border-2 transition ${gender === val ? "border-[#F77F00] bg-orange-50 text-[#F77F00]" : "border-slate-200 text-slate-500"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <Field label="Date de naissance" value={birthDate} onChange={setBirthDate} type="date" />

        <SectionLabel>Contact</SectionLabel>
        <Field label="Telephone" value={phone} onChange={setPhone} type="tel" icon={Phone} error={personalErrors.phone} placeholder="+229 XX XX XX XX" />
        <Field label="Email" value={email} onChange={setEmail} type="email" icon={Mail} error={personalErrors.email} placeholder="votre@email.com" />

        <SectionLabel>Type de compte</SectionLabel>
        <div className="flex gap-2 mb-4">
          {([["particulier", "Particulier"], ["professionnel", "Professionnel"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setAccountType(val)}
              className={`flex-1 py-3 rounded-xl text-sm border-2 transition ${accountType === val ? "border-[#1E6091] bg-blue-50 text-[#1E6091]" : "border-slate-200 text-slate-500"}`}>
              {lbl}
            </button>
          ))}
        </div>

        <SaveButton onClick={handleSavePersonal} loading={saving} label="Enregistrer les modifications" />
      </SlidePanel>

      {/* ─── ADRESSES FAVORITES ─── */}
      <SlidePanel open={activePanel === "addresses"} onClose={closePanel} title="Adresses favorites">
        <div className="space-y-3 mb-6">
          {addresses.map((addr) => (
            <div key={addr.id}>
              {editingAddr === addr.id ? (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 space-y-2">
                  <input value={editAddrLabel} onChange={(e) => setEditAddrLabel(e.target.value)} className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-[#F77F00]" placeholder="Nom" />
                  <input value={editAddrValue} onChange={(e) => setEditAddrValue(e.target.value)} className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-slate-200 outline-none focus:border-[#F77F00]" placeholder="Adresse" />
                  <div className="flex gap-2">
                    <button onClick={saveEditAddr} className="flex-1 flex items-center justify-center gap-1.5 bg-[#2A9D8F] text-white py-2 rounded-xl text-sm">
                      <Check className="w-3.5 h-3.5" /> Sauver
                    </button>
                    <button onClick={() => setEditingAddr(null)} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 py-2 rounded-xl text-sm">
                      <X className="w-3.5 h-3.5" /> Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center gap-3 rounded-xl p-3.5 border ${addr.isDefault ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-100"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-[#2A9D8F]" : "bg-slate-200"}`}>
                    <MapPin className={`w-4 h-4 ${addr.isDefault ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-800">{addr.label}</p>
                      {addr.isDefault && <span className="text-[9px] bg-[#2A9D8F] text-white px-1.5 py-0.5 rounded-full">Defaut</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{addr.value}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!addr.isDefault && (
                      <button onClick={() => { setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id }))); toast.success(`${addr.label} definie par defaut`); }}
                        className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center" title="Definir par defaut">
                        <MapPinned className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    )}
                    <button onClick={() => startEditAddr(addr)} className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                    <button onClick={() => { setAddresses(prev => prev.filter(a => a.id !== addr.id)); toast("Adresse supprimee", { description: addr.label }); }}
                      className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucune adresse enregistree</p>
            </div>
          )}
        </div>

        <SectionLabel>Ajouter une adresse</SectionLabel>
        <Field label="Nom (ex: Gym, Ecole)" value={newAddrLabel} onChange={setNewAddrLabel} placeholder="Nom du lieu" />
        <Field label="Adresse complete" value={newAddrValue} onChange={setNewAddrValue} icon={MapPin} placeholder="Rue, quartier, ville" />
        <button
          onClick={() => {
            if (!newAddrLabel.trim()) { toast.error("Donnez un nom a cette adresse"); return; }
            if (!newAddrValue.trim()) { toast.error("Entrez l'adresse complete"); return; }
            setAddresses(prev => [...prev, { id: Date.now(), label: newAddrLabel, value: newAddrValue }]);
            setNewAddrLabel(""); setNewAddrValue("");
            toast.success("Adresse ajoutee", { description: newAddrLabel });
          }}
          className="w-full flex items-center justify-center gap-2 bg-[#2A9D8F] text-white py-3.5 rounded-xl active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" /> Ajouter cette adresse
        </button>
      </SlidePanel>

      {/* ─── DOCUMENTS ─── */}
      <SlidePanel open={activePanel === "documents"} onClose={closePanel} title="Mes documents">
        <div className="bg-blue-50 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1E6091] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#1E6091]">Verification d'identite</p>
            <p className="text-[10px] text-blue-400 mt-1">Televersez vos documents pour verifier votre identite. La verification prend 24 a 48 heures.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                doc.status === "verified" ? "bg-emerald-100" : doc.status === "rejected" ? "bg-red-100" : "bg-amber-100"
              }`}>
                {doc.status === "verified" ? <Check className="w-4 h-4 text-emerald-600" />
                  : doc.status === "rejected" ? <X className="w-4 h-4 text-red-600" />
                  : <Clock className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">{doc.name}</p>
                <p className={`text-[10px] ${doc.status === "verified" ? "text-emerald-500" : doc.status === "rejected" ? "text-red-500" : "text-amber-500"}`}>
                  {doc.status === "verified" ? "Verifie" : doc.status === "rejected" ? "Rejete - Renvoyez" : "En attente"} · {doc.date}
                </p>
              </div>
              <button onClick={() => {
                setDocs(prev => prev.filter(d => d.id !== doc.id));
                toast("Document supprime", { description: doc.name });
              }} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Upload section */}
        {showDocUpload ? (
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 space-y-3">
            <p className="text-sm text-slate-700">Choisir le type de document</p>
            <div className="space-y-2">
              {docTypes.map(dt => (
                <button key={dt} onClick={() => handleUploadDoc(dt)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100 hover:border-[#F77F00] transition text-left">
                  <FileText className="w-4 h-4 text-[#F77F00]" />
                  <span className="text-sm text-slate-700">{dt}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDocUpload(false)} className="w-full text-sm text-slate-500 py-2">Annuler</button>
          </div>
        ) : (
          <button
            onClick={() => setShowDocUpload(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white py-3.5 rounded-xl shadow-lg shadow-orange-200/50 active:scale-[0.98] transition"
          >
            <Upload className="w-4 h-4" /> Telecharger un document
          </button>
        )}
      </SlidePanel>

      {/* ─── CODE PIN ─── */}
      <SlidePanel open={activePanel === "pin"} onClose={closePanel} title="Changer le code PIN">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Key className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="text-xs text-slate-400 text-center mb-6">Le code PIN securise vos paiements IPPOO Cash et vos transactions.</p>

        <Field label="Ancien code PIN" value={oldPin} onChange={setOldPin} type={showOldPin ? "text" : "password"} icon={Lock} placeholder="Entrez votre PIN actuel"
          rightElement={<button onClick={() => setShowOldPin(!showOldPin)}>{showOldPin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</button>}
        />
        <Field label="Nouveau code PIN" value={newPin} onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 6))} type={showNewPin ? "text" : "password"} icon={Key} placeholder="4 a 6 chiffres"
          rightElement={<button onClick={() => setShowNewPin(!showNewPin)}>{showNewPin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</button>}
        />
        <PinStrength pin={newPin} />
        <Field label="Confirmer le nouveau PIN" value={confirmPin} onChange={(v) => setConfirmPin(v.replace(/\D/g, "").slice(0, 6))} type={showConfirmPin ? "text" : "password"} icon={Key} placeholder="Retapez le nouveau PIN"
          error={confirmPin && newPin !== confirmPin ? "Les PIN ne correspondent pas" : undefined}
          rightElement={<button onClick={() => setShowConfirmPin(!showConfirmPin)}>{showConfirmPin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</button>}
        />

        <SaveButton onClick={handleSavePin} loading={saving} label="Modifier le PIN"
          disabled={!oldPin || !newPin || !confirmPin || newPin !== confirmPin} />

        <p className="text-[10px] text-slate-400 text-center mt-4">PIN oublie ? <button onClick={() => { toast("Code de verification envoye par SMS", { description: phone }); }} className="text-[#1E6091] underline">Reinitialiser par SMS</button></p>
      </SlidePanel>

      {/* ─── BIOMETRIQUE ─── */}
      <SlidePanel open={activePanel === "biometric"} onClose={closePanel} title="Connexion biometrique">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition ${biometric ? "bg-violet-100" : "bg-violet-50"}`}>
          {biometricEnrolling ? (
            <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          ) : (
            <Fingerprint className={`w-9 h-9 ${biometric ? "text-violet-600" : "text-violet-400"}`} />
          )}
        </div>

        {biometricEnrolling ? (
          <div className="text-center mb-8">
            <p className="text-sm text-slate-700">Enregistrement en cours...</p>
            <p className="text-xs text-slate-400 mt-1">Placez votre doigt sur le capteur</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center mb-6">
            {biometric
              ? "La connexion biometrique est active. Vous pouvez vous connecter sans code PIN."
              : "Activez la biometrie pour une connexion plus rapide et securisee."
            }
          </p>
        )}

        <SectionLabel>Type de biometrie</SectionLabel>
        <div className="flex gap-2 mb-6">
          {([["fingerprint", "Empreinte", Fingerprint], ["face", "Visage", Smartphone]] as const).map(([val, lbl, Ic]) => (
            <button key={val} onClick={() => setBiometricType(val as "fingerprint" | "face")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm transition ${biometricType === val ? "border-violet-400 bg-violet-50 text-violet-600" : "border-slate-200 text-slate-500"}`}>
              <Ic className="w-4 h-4" /> {lbl}
            </button>
          ))}
        </div>

        <Toggle
          on={biometric}
          onToggle={handleBiometricToggle}
          label={biometricType === "fingerprint" ? "Empreinte digitale" : "Reconnaissance faciale"}
          desc={biometric ? "Active · Derniere utilisation: Aujourd'hui" : "Desactive · Non enregistre"}
          disabled={biometricEnrolling}
        />

        {biometric && (
          <div className="mt-4 bg-violet-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-violet-600">
              <Shield className="w-4 h-4" />
              <span>Vos donnees biometriques restent sur votre appareil et ne sont jamais partagees.</span>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* ─── CONFIDENTIALITE ─── */}
      <SlidePanel open={activePanel === "privacy"} onClose={closePanel} title="Confidentialite & securite">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-7 h-7 text-slate-600" />
        </div>

        <SectionLabel>Visibilite</SectionLabel>
        <Toggle on={maskNumber} onToggle={() => { setMaskNumber(!maskNumber); toast.success(!maskNumber ? "Numero masque pour les chauffeurs" : "Numero visible pour les chauffeurs"); }}
          label="Masquer mon numero" desc="Le chauffeur ne verra pas votre vrai numero" />
        <Toggle on={showOnlineStatus} onToggle={() => { setShowOnlineStatus(!showOnlineStatus); toast.success(!showOnlineStatus ? "Statut en ligne visible" : "Statut en ligne masque"); }}
          label="Afficher mon statut en ligne" desc="Les autres utilisateurs voient si vous etes connecte" />
        <Toggle on={hideActivity} onToggle={() => { setHideActivity(!hideActivity); toast.success(!hideActivity ? "Historique masque" : "Historique visible"); }}
          label="Masquer mon activite" desc="Historique de courses invisible pour les tiers" />

        <div className="mt-4" />
        <SectionLabel>Localisation & donnees</SectionLabel>
        <Toggle on={shareLocation} onToggle={() => {
          if (shareLocation) {
            toast("Attention", { description: "Desactiver le partage de localisation peut affecter le service", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> });
          }
          setShareLocation(!shareLocation);
        }}
          label="Partager ma localisation" desc="Necessaire pour le suivi en temps reel" />
        <Toggle on={allowDataCollection} onToggle={() => { setAllowDataCollection(!allowDataCollection); toast.success(!allowDataCollection ? "Collecte autorisee" : "Collecte limitee"); }}
          label="Amelioration du service" desc="Autoriser la collecte anonyme pour ameliorer l'app" />

        <div className="mt-4" />
        <SectionLabel>Securite avancee</SectionLabel>
        <Toggle on={twoFactor} onToggle={() => {
          setTwoFactor(!twoFactor);
          if (!twoFactor) toast.success("Verification en deux etapes activee", { description: "Un code SMS sera envoye a chaque connexion" });
          else toast("Verification en deux etapes desactivee");
        }}
          label="Verification en deux etapes" desc="Code SMS supplementaire a chaque connexion" />

        <div className="mt-6">
          <button onClick={() => { toast.success("Rapport de donnees demande", { description: "Vous recevrez un email avec vos donnees sous 48h" }); }}
            className="w-full flex items-center justify-center gap-2 text-[#1E6091] py-3 rounded-xl border border-blue-200 bg-blue-50 text-sm mb-3">
            <Database className="w-4 h-4" /> Demander mes donnees
          </button>
        </div>
      </SlidePanel>

      {/* ─── APPARENCE ─── */}
      <SlidePanel open={activePanel === "darkmode"} onClose={closePanel} title="Apparence">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {themeMode === "light" ? <Sun className="w-7 h-7 text-amber-500" /> : themeMode === "dark" ? <Moon className="w-7 h-7 text-indigo-600" /> : <Monitor className="w-7 h-7 text-slate-600" />}
        </div>

        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([
            { val: "light" as const, label: "Clair", Icon: Sun, preview: "bg-white border-slate-200" },
            { val: "dark" as const, label: "Sombre", Icon: Moon, preview: "bg-slate-800" },
            { val: "auto" as const, label: "Auto", Icon: Monitor, preview: "bg-gradient-to-r from-white to-slate-800" },
          ]).map(({ val, label, Icon: Ic, preview }) => (
            <button key={val} onClick={() => { setThemeMode(val); toast.success(`Theme: ${label}`); }}
              className={`rounded-2xl border-2 p-3 text-center transition ${themeMode === val ? "border-[#F77F00] bg-orange-50" : "border-slate-200 bg-white"}`}>
              <div className={`w-full h-12 rounded-xl mb-2 border ${preview}`} />
              <div className="flex items-center justify-center gap-1.5">
                <Ic className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-700">{label}</p>
              </div>
            </button>
          ))}
        </div>

        <SectionLabel>Taille du texte</SectionLabel>
        <div className="flex gap-2 mb-6">
          {([["small", "Petit", "text-xs"], ["medium", "Moyen", "text-sm"], ["large", "Grand", "text-base"]] as const).map(([val, lbl, size]) => (
            <button key={val} onClick={() => { setFontSize(val); toast.success(`Taille: ${lbl}`); }}
              className={`flex-1 py-3 rounded-xl border-2 transition ${fontSize === val ? "border-[#F77F00] bg-orange-50" : "border-slate-200"}`}>
              <span className={`${size} text-slate-700`}>Aa</span>
              <p className="text-[10px] text-slate-400 mt-1">{lbl}</p>
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Apercu</p>
          <div className={`bg-white rounded-xl p-4 border border-slate-100 ${themeMode === "dark" ? "!bg-slate-800 !border-slate-700" : ""}`}>
            <p className={`${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"} ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>
              Bonjour Dosso ! Votre prochain trajet est a 14h30.
            </p>
            <p className={`${fontSize === "small" ? "text-[10px]" : fontSize === "large" ? "text-sm" : "text-xs"} ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"} mt-1`}>
              Campus → Cotonou Centre
            </p>
          </div>
        </div>
      </SlidePanel>

      {/* ─── PARAMETRES ─── */}
      <SlidePanel open={activePanel === "settings"} onClose={closePanel} title="Parametres">
        <SectionLabel>Langue de l'application</SectionLabel>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { code: "Francais", flag: "🇫🇷" },
            { code: "English", flag: "🇬🇧" },
            { code: "Fon", flag: "🇧🇯" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); toast.success(`Langue: ${lang.code}`); }}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition text-sm ${language === lang.code ? "border-[#F77F00] bg-orange-50 text-[#F77F00]" : "border-slate-200 text-slate-600"}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-xs">{lang.code}</span>
            </button>
          ))}
        </div>

        <SectionLabel>Notifications push</SectionLabel>
        <Toggle on={notifRide} onToggle={() => { setNotifRide(!notifRide); toast.success(!notifRide ? "Notifications courses activees" : "Notifications courses desactivees"); }}
          label="Courses & livraisons" desc="Mise a jour en temps reel de vos trajets" />
        <Toggle on={notifPromo} onToggle={() => { setNotifPromo(!notifPromo); toast.success(!notifPromo ? "Notifications promos activees" : "Notifications promos desactivees"); }}
          label="Promotions & offres" desc="Coupons, reductions et offres speciales" />
        <Toggle on={notifChat} onToggle={() => { setNotifChat(!notifChat); toast.success(!notifChat ? "Notifications chat activees" : "Notifications chat desactivees"); }}
          label="Messages chauffeurs" desc="Notifications de chat en course" />

        <div className="mt-2" />
        <SectionLabel>Sons & vibrations</SectionLabel>
        <Toggle on={notifSound} onToggle={() => { setNotifSound(!notifSound); }} label="Sons de notification" desc="Jouer un son a chaque notification" />
        <Toggle on={notifVibrate} onToggle={() => { setNotifVibrate(!notifVibrate); }} label="Vibrations" desc="Vibrer a chaque notification" />

        <div className="mt-6" />
        <SectionLabel>Gestion du compte</SectionLabel>
        <button onClick={() => { toast.success("Donnees du cache supprimees", { description: "1.2 Mo liberes" }); }}
          className="w-full flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100 mb-2.5 text-left">
          <Database className="w-4 h-4 text-slate-500" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">Vider le cache</p>
            <p className="text-[10px] text-slate-400">Liberer de l'espace · 1.2 Mo</p>
          </div>
        </button>
        <button onClick={() => { toast.success("Donnees exportees", { description: "Un lien de telechargement a ete envoye a votre email" }); }}
          className="w-full flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100 mb-2.5 text-left">
          <ExternalLink className="w-4 h-4 text-[#1E6091]" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">Exporter mes donnees</p>
            <p className="text-[10px] text-slate-400">Recevoir un fichier avec toutes vos donnees</p>
          </div>
        </button>

        <div className="mt-6" />
        <SectionLabel>Zone de danger</SectionLabel>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3.5 border border-red-200 text-left">
            <UserX className="w-4 h-4 text-[#D62828]" />
            <div className="flex-1">
              <p className="text-sm text-[#D62828]">Supprimer mon compte</p>
              <p className="text-[10px] text-red-400">Cette action est irreversible</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        ) : (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-[#D62828] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#D62828]">Confirmer la suppression</p>
                <p className="text-[10px] text-red-400 mt-1">Toutes vos donnees (courses, portefeuille, documents) seront definitivement supprimees apres 30 jours. Tapez <strong>SUPPRIMER</strong> pour confirmer.</p>
              </div>
            </div>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="w-full bg-white rounded-xl px-4 py-3 border border-red-200 text-sm outline-none focus:border-[#D62828] text-[#D62828]"
            />
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount}
                className={`flex-1 py-3 rounded-xl text-sm transition ${deleteConfirmText === "SUPPRIMER" ? "bg-[#D62828] text-white" : "bg-red-200 text-red-400 cursor-not-allowed"}`}>
                Supprimer definitivement
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="flex-1 py-3 rounded-xl text-sm bg-slate-100 text-slate-600">
                Annuler
              </button>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* ─── DECONNEXION ─── */}
      <SlidePanel open={activePanel === "logout"} onClose={closePanel} title="Deconnexion">
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
            <LogOut className="w-9 h-9 text-[#D62828]" />
          </div>
          <p className="text-slate-800 text-center mb-2">Vous souhaitez vous deconnecter ?</p>
          <p className="text-xs text-slate-400 text-center mb-8">Vous devrez entrer vos identifiants pour vous reconnecter. Vos donnees ne seront pas perdues.</p>

          <button
            onClick={() => {
              toast.success("Deconnexion reussie", { description: "A bientot sur IPPOO !" });
              setTimeout(() => navigate("/login"), 800);
            }}
            className="w-full bg-[#D62828] text-white py-3.5 rounded-xl active:scale-[0.98] transition mb-3"
          >
            Oui, me deconnecter
          </button>
          <button onClick={closePanel} className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl active:scale-[0.98] transition">
            Annuler
          </button>
        </div>
      </SlidePanel>

      {/* ═══ PHOTO SOURCE PICKER ═══ */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPhotoMenu(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-slate-800 text-center mb-5">Changer la photo de profil</p>

            {/* Preview current */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-6 shadow-lg border-2 border-slate-100">
              {avatarSrc ? (
                <ImageWithFallback src={avatarSrc} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F77F00] to-amber-400 flex items-center justify-center">
                  <span className="text-white text-2xl">DA</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowPhotoMenu(false);
                  setShowCamera(true);
                  setTimeout(() => startCamera(), 100);
                }}
                className="w-full flex items-center gap-4 bg-blue-50 rounded-2xl px-5 py-4 border border-blue-100 active:bg-blue-100 transition"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-slate-800">Prendre une photo</p>
                  <p className="text-[10px] text-slate-400">Utiliser la caméra de l'appareil</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowPhotoMenu(false);
                  setTimeout(() => avatarInputRef.current?.click(), 100);
                }}
                className="w-full flex items-center gap-4 bg-violet-50 rounded-2xl px-5 py-4 border border-violet-100 active:bg-violet-100 transition"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/25">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-slate-800">Choisir dans la galerie</p>
                  <p className="text-[10px] text-slate-400">Sélectionner depuis vos photos</p>
                </div>
              </button>

              {avatarSrc && avatarSrc !== (AVATARS["DA"] || "") && (
                <button
                  onClick={() => {
                    setAvatarSrc(AVATARS["DA"] || "");
                    setShowPhotoMenu(false);
                    toast.success("Photo par défaut restaurée");
                  }}
                  className="w-full flex items-center gap-4 bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 active:bg-slate-100 transition"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shadow-md shadow-slate-400/25">
                    <RotateCcw className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-slate-800">Restaurer la photo par défaut</p>
                    <p className="text-[10px] text-slate-400">Revenir à la photo originale</p>
                  </div>
                </button>
              )}
            </div>

            <button onClick={() => setShowPhotoMenu(false)} className="w-full mt-4 text-sm text-slate-400 py-2">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ═══ CAMERA CAPTURE MODAL ═══ */}
      {showCamera && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col">
          {/* Camera top bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
            <button onClick={closeCamera} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 active:scale-90 transition">
              <X className="w-5 h-5 text-white" />
            </button>
            <p className="text-white text-sm">Photo de profil</p>
            <button onClick={toggleFacingMode} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 active:scale-90 transition">
              <SwitchCamera className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Video / Captured preview */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="relative w-full max-w-[340px] aspect-square rounded-[32px] overflow-hidden bg-slate-900 shadow-2xl">
              {/* Circular overlay guide */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                <svg viewBox="0 0 340 340" className="w-full h-full">
                  <defs>
                    <mask id="circleMask">
                      <rect width="340" height="340" fill="white" />
                      <circle cx="170" cy="170" r="140" fill="black" />
                    </mask>
                  </defs>
                  <rect width="340" height="340" fill="rgba(0,0,0,0.5)" mask="url(#circleMask)" />
                  <circle cx="170" cy="170" r="140" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
                </svg>
              </div>

              {capturedPhoto ? (
                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                      <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                      <p className="text-white/60 text-sm">Chargement de la caméra...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Canvas caché pour capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Bottom controls */}
          <div className="px-6 pb-10 pt-6">
            {capturedPhoto ? (
              <div className="flex items-center justify-center gap-6">
                <button onClick={retakePhoto}
                  className="flex flex-col items-center gap-2 active:scale-90 transition">
                  <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <RotateCcw className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/70 text-[11px]">Reprendre</span>
                </button>
                <button onClick={confirmCapturedPhoto}
                  className="flex flex-col items-center gap-2 active:scale-90 transition">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white/70 text-[11px]">Confirmer</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-8">
                <button onClick={() => { closeCamera(); setTimeout(() => avatarInputRef.current?.click(), 100); }}
                  className="flex flex-col items-center gap-2 active:scale-90 transition">
                  <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-[10px]">Galerie</span>
                </button>
                <button onClick={capturePhoto} disabled={!cameraReady}
                  className="active:scale-90 transition disabled:opacity-40">
                  <div className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-[58px] h-[58px] bg-white rounded-full" />
                  </div>
                </button>
                <button onClick={toggleFacingMode}
                  className="flex flex-col items-center gap-2 active:scale-90 transition">
                  <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <SwitchCamera className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-[10px]">Inverser</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}