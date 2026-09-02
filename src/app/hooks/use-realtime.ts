/**
 * Hook Realtime IPPOO TRIIP
 *
 * Strategies:
 *  1. Broadcast canal "user:{userId}" -- events cibles par le backend
 *     (ride:new, ride:update, wallet:update, push:new, driver:update)
 *  2. Table Realtime -- ecoute les changements Postgres directement
 *     (ippoo_triip_rides, ippoo_triip_notifications, ippoo_triip_wallets,
 *      ippoo_triip_push_notifications). NB: depend de la RLS + d'un JWT
 *      Supabase valide ; le broadcast (canal user/global) reste le chemin
 *      fiable cross-device avec l'anon key.
 *
 * Utilisation:
 *   const { on, onTable } = useRealtime(userId);
 *   useEffect(() => on("ride:update", (ride) => setRide(ride)), [on]);
 */
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type EventHandler = (payload: any) => void;

interface UseRealtimeOptions {
  /** Canal supplementaire a rejoindre (ex: "ippoo:global") */
  extraChannel?: string;
}

export function useRealtime(userId: string | null, opts: UseRealtimeOptions = {}) {
  const userChannelRef  = useRef<RealtimeChannel | null>(null);
  const globalChannelRef = useRef<RealtimeChannel | null>(null);
  const tableChannelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());

  // Dispatch interne
  const dispatch = useCallback((event: string, payload: any) => {
    const handlers = handlersRef.current.get(event);
    if (handlers) handlers.forEach((h) => h(payload));
    // Wildcard "*"
    const wildcards = handlersRef.current.get("*");
    if (wildcards) wildcards.forEach((h) => h({ event, payload }));
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Canal broadcast utilisateur (events cibles backend)
    const userCh = supabase.channel(`user:${userId}`)
      .on("broadcast", { event: "*" }, ({ event, payload }) => dispatch(event, payload))
      .subscribe();
    userChannelRef.current = userCh;

    // Canal broadcast global (push notifs, config updates)
    // NB: doit correspondre EXACTEMENT au canal serveur (broadcastAll).
    const globalCh = supabase.channel("ippoo_triip:global")
      .on("broadcast", { event: "*" }, ({ event, payload }) => dispatch(event, payload))
      .subscribe();
    globalChannelRef.current = globalCh;

    // Realtime Postgres -- tables cles filtrees par userId
    const tableCh = supabase.channel(`db:user:${userId}`)
      // Courses du client
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "ippoo_triip_rides",
        filter: `client_id=eq.${userId}`,
      }, ({ eventType, new: row, old }) => {
        dispatch("ride:update", { eventType, ride: row, old });
      })
      // Notifications de l'utilisateur
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ippoo_triip_notifications",
        filter: `user_id=eq.${userId}`,
      }, ({ new: row }) => {
        dispatch("notification:new", row);
      })
      // Wallet de l'utilisateur
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ippoo_triip_wallets",
        filter: `user_id=eq.${userId}`,
      }, ({ new: row }) => {
        dispatch("wallet:update", {
          userId: row.user_id, balanceXOF: row.balance_xof,
          pendingXOF: row.pending_xof, currency: row.currency,
        });
      })
      // Notifications push globales
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ippoo_triip_push_notifications",
      }, ({ new: row }) => {
        dispatch("push:new", row);
      })
      .subscribe();
    tableChannelRef.current = tableCh;

    return () => {
      supabase.removeChannel(userCh);
      supabase.removeChannel(globalCh);
      supabase.removeChannel(tableCh);
    };
  }, [userId, dispatch]);

  /** Souscrit a un event Realtime. Retourne une fonction de desinscription. */
  const on = useCallback((event: string, handler: EventHandler): (() => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  /** Souscrit directement a une table Postgres (usage avance). */
  const onTable = useCallback(
    (table: string, event: "INSERT" | "UPDATE" | "DELETE" | "*", filter: string | undefined, handler: EventHandler) => {
      const ch = supabase.channel(`extra:${table}:${Date.now()}`)
        .on("postgres_changes" as any, { event, schema: "public", table, filter }, (payload: any) => {
          handler(payload);
        })
        .subscribe();
      return () => supabase.removeChannel(ch);
    },
    []
  );

  return { on, onTable };
}

/**
 * Hook simplifie pour ecouter les mises a jour d'une course.
 * Combine broadcast + table Realtime.
 */
export function useRideRealtime(rideId: string | null, onUpdate: (ride: any) => void) {
  const latestUpdate = useRef(onUpdate);
  latestUpdate.current = onUpdate;

  useEffect(() => {
    if (!rideId) return;
    const ch = supabase.channel(`ride:${rideId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ippoo_rides",
        filter: `id=eq.${rideId}`,
      }, ({ new: row }: any) => {
        latestUpdate.current(row);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [rideId]);
}

/**
 * Hook pour ecouter les nouveaux evenements de course.
 */
export function useRideEventsRealtime(rideId: string | null, onNewEvent: (ev: any) => void) {
  const latestHandler = useRef(onNewEvent);
  latestHandler.current = onNewEvent;

  useEffect(() => {
    if (!rideId) return;
    const ch = supabase.channel(`ride-events:${rideId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ippoo_ride_events",
        filter: `ride_id=eq.${rideId}`,
      }, ({ new: row }: any) => {
        latestHandler.current({
          id: row.id, rideId: row.ride_id, status: row.status, label: row.label,
          location: row.location_lat ? { lat: row.location_lat, lng: row.location_lng } : undefined,
          at: row.created_at,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [rideId]);
}

/**
 * Hook pour les drivers : courses entrantes en temps reel.
 */
export function useDriverRealtime(driverId: string | null, onRideAssigned: (ride: any) => void) {
  const latestHandler = useRef(onRideAssigned);
  latestHandler.current = onRideAssigned;

  useEffect(() => {
    if (!driverId) return;
    const ch = supabase.channel(`driver:incoming:${driverId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ippoo_rides",
        filter: `driver_id=eq.${driverId}`,
      }, ({ new: row }: any) => {
        latestHandler.current(row);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverId]);
}
