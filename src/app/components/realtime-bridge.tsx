/**
 * <RealtimeBridge/> — pont Realtime → flux de notifications.
 *
 * Monté UNE seule fois au niveau racine. Dès qu'un utilisateur est connecté,
 * il s'abonne aux canaux Realtime Supabase (broadcast utilisateur + global)
 * et injecte chaque notification reçue dans le flux consommé par
 * <PushNotificationHost/>. C'est ce qui fait « passer » les notifications
 * de l'admin vers tous les appareils en temps réel (et non plus seulement
 * entre onglets du même navigateur via localStorage).
 */
import { useEffect } from "react";
import { useAppStore } from "../store/app-store";
import { useRealtime } from "../hooks/use-realtime";
import { api } from "../api/client";
import { ingestPush, type PushType, type PushTarget } from "../store/push-notifications";
import { setUnread, bumpUnread } from "../store/unread";

export function RealtimeBridge() {
  const { state } = useAppStore();
  const userId = state.user?.id ?? null;
  const role = state.user?.role ?? null;
  const { on } = useRealtime(userId);

  // Audience de l'utilisateur courant (pour filtrer ce qui compte comme non-lu).
  const audience: PushTarget | null =
    role === "client" ? "clients" : role === "driver" ? "drivers" : null;

  // Fetch initial du compteur non-lu à la connexion.
  useEffect(() => {
    if (!userId) { setUnread(0); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ count: number }>("/notifications/unread-count");
        if (!cancelled) setUnread(res?.count ?? 0);
      } catch { /* silencieux */ }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const coerceType = (t: unknown): PushType => {
      const v = String(t ?? "info");
      return (["info", "promo", "success", "alert", "system", "ride", "payment", "sos"] as const)
        .includes(v as PushType) ? (v as PushType) : "info";
    };
    const coerceTarget = (t: unknown): PushTarget => {
      const v = String(t ?? "all");
      return (["all", "clients", "drivers"] as const).includes(v as PushTarget) ? (v as PushTarget) : "all";
    };

    // Compte comme non-lu si la notification vise l'audience de l'utilisateur.
    const countIfRelevant = (id: string | undefined, target: PushTarget) => {
      if (audience && (target === "all" || target === audience)) bumpUnread(id);
    };

    // Diffusion admin (broadcastAll "notification")
    const offNotif = on("notification", (p: any) => {
      const target = coerceTarget(p?.target);
      ingestPush({
        id: p?.id,
        title: p?.title ?? "Notification",
        body: p?.body ?? p?.message ?? "",
        type: coerceType(p?.type),
        target,
      });
      countIfRelevant(p?.id, target);
    });

    // Insert Postgres ippoo_triip_notifications (si Realtime table dispo)
    const offNotifNew = on("notification:new", (row: any) => {
      ingestPush({
        id: row?.id,
        title: row?.title ?? "Notification",
        body: row?.body ?? row?.message ?? "",
        type: coerceType(row?.type),
        target: "all",
      });
      countIfRelevant(row?.id, "all");
    });

    // Log push global
    const offPushNew = on("push:new", (row: any) => {
      const target = coerceTarget(row?.target);
      ingestPush({
        id: row?.id,
        title: row?.title ?? "Notification",
        body: row?.body ?? "",
        type: coerceType(row?.type),
        target,
      });
      countIfRelevant(row?.id, target);
    });

    return () => { offNotif(); offNotifNew(); offPushNew(); };
  }, [on, audience]);

  return null;
}
