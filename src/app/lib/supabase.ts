/**
 * Client Supabase frontend
 * Usage: import { supabase } from "@/app/lib/supabase";
 *
 * Le client est cree avec la publicAnonKey. Pour les operations
 * qui necessitent l'auth (Realtime RLS), on passe le JWT IPPOO
 * via setSession() apres connexion.
 */
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

export const SUPABASE_URL  = `https://${projectId}.supabase.co`;
export const SUPABASE_ANON = publicAnonKey;

// Client singleton -- utilise l'anon key pour Realtime
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

/**
 * Injecte le JWT IPPOO dans le client Supabase pour activer les
 * politiques RLS lors des souscriptions Realtime.
 * Appeler apres une connexion reussie, ou apres un refresh de token.
 */
export function setSupabaseAuth(accessToken: string | null) {
  if (accessToken) {
    supabase.realtime.setAuth(accessToken);
  } else {
    supabase.realtime.setAuth(null);
  }
}
