import { useNavigate } from "react-router";
import { Home, AlertTriangle } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-[#F77F00] to-[#E9C46A] rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-orange-400/30">
        <AlertTriangle className="w-9 h-9 text-white" strokeWidth={1.8} />
      </div>
      <h2 className="title-gradient mb-2">Page introuvable</h2>
      <p className="text-sm text-gray-400 mb-8 max-w-[260px]">
        La page que vous cherchez n'existe pas ou a ete deplacee.
      </p>
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-2 bg-gradient-to-r from-[#F77F00] to-[#E9C46A] text-white px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-400/25 active:scale-[0.98] transition-transform"
      >
        <Home className="w-4 h-4" /> Retour a l'accueil
      </button>
    </div>
  );
}
