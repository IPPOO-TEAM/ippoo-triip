import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAppStore } from "../store/app-store";

interface Props {
  children: React.ReactNode;
  role?: "client" | "driver" | "admin";
  /** Page de connexion vers laquelle rediriger si non authentifié. */
  loginPath?: string;
}

export function RequireAuth({ children, role, loginPath }: Props) {
  const { state } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // L'espace admin a sa propre connexion (email/mot de passe).
  const resolvedLoginPath = loginPath ?? (role === "admin" ? "/admin/login" : "/login");

  useEffect(() => {
    if (!state.hydrated) return;

    if (!state.user) {
      navigate(resolvedLoginPath, { replace: true, state: { from: location.pathname } });
      return;
    }

    if (role && state.user.role !== role) {
      // Wrong role — redirect to their proper portal
      const destination =
        state.user.role === "driver" ? "/driver" :
        state.user.role === "admin"  ? "/admin"  : "/app";
      // Si on exige un admin mais l'utilisateur ne l'est pas, on l'envoie
      // vers la connexion admin plutôt que vers son portail.
      navigate(role === "admin" ? resolvedLoginPath : destination, { replace: true });
    }
  }, [state.hydrated, state.user, role, navigate, location.pathname, resolvedLoginPath]);

  // Show nothing while hydration is running
  if (!state.hydrated) return null;

  // Not authenticated
  if (!state.user) return null;

  // Wrong role
  if (role && state.user.role !== role) return null;

  return <>{children}</>;
}
