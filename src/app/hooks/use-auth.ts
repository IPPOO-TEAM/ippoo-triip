/**
 * Hook d'authentification IPPOO — encapsule le flux OTP.
 * Usage :
 *   const { sendOtp, verify, logout, loading, error } = useAuth();
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "../services/auth";
import { useAppStore } from "../store/app-store";
import { logger } from "../services/logger";
import { ApiError } from "../api/client";

export function useAuth() {
  const navigate = useNavigate();
  const { dispatch, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (phone: string) => {
    setLoading(true); setError(null);
    try {
      await requestOtp(phone);
      toast.success("Code envoyé par SMS");
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Numéro invalide";
      setError(msg); toast.error(msg);
      logger.warn("auth.otp.request.fail", { msg });
      return false;
    } finally { setLoading(false); }
  }, []);

  const verify = useCallback(async (phone: string, otp: string, redirect = "/") => {
    setLoading(true); setError(null);
    try {
      const session = await verifyOtp(phone, otp);
      dispatch({ type: "SET_USER", user: session.user });
      toast.success("Connexion réussie", { description: `Bienvenue ${session.user.fullName}` });
      navigate(redirect);
      return session.user;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Code incorrect";
      setError(msg); toast.error(msg);
      logger.warn("auth.otp.verify.fail", { msg });
      return null;
    } finally { setLoading(false); }
  }, [dispatch, navigate]);

  const logout = useCallback(async () => {
    await storeLogout();
    toast.success("À bientôt !");
    navigate("/login");
  }, [storeLogout, navigate]);

  return { sendOtp, verify, logout, loading, error };
}
