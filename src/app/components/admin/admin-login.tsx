import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Mail, Lock, ArrowRight, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { adminLogin } from "../../services/auth";
import { useAppStore } from "../../store/app-store";
import { logger } from "../../services/logger";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const session = await adminLogin(email, password);
      dispatch({ type: "SET_USER", user: session.user });
      logger.info("auth.admin.login.success", { email });
      toast.success("Bienvenue dans l'espace administrateur");
      navigate("/admin", { replace: true });
    } catch (e: any) {
      const msg = e?.message ?? "Connexion impossible";
      logger.warn("auth.admin.login.fail", { e: String(e) });
      setError(msg);
      toast.error("Échec de la connexion", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center px-5 py-10 bg-[#0F172A] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#1E6091]/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 w-96 h-96 rounded-full bg-[#F77F00]/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#F77F00] flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white text-2xl font-extrabold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Espace Administrateur
          </h1>
          <p className="text-slate-400 text-sm mt-1">IPPOO TRIIP — accès réservé</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-xl p-6 space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 border border-slate-600/60 bg-slate-900/50 focus-within:border-[#F77F00]/60 transition-colors">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="email"
              autoComplete="username"
              placeholder="Email administrateur"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 min-w-0"
            />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 border border-slate-600/60 bg-slate-900/50 focus-within:border-[#F77F00]/60 transition-colors">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 min-w-0"
            />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-slate-400 hover:text-white transition-colors shrink-0">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F77F00, #F77F00cc)", boxShadow: "0 8px 24px rgba(247,127,0,0.35)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Connexion..." : "Se connecter"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full text-center text-slate-400 text-xs mt-5 hover:text-white transition-colors"
        >
          Retour à la connexion utilisateur
        </button>
      </div>
    </div>
  );
}
