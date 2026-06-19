/**
 * Hook gestion course IPPOO — création + suivi avec fallback offline.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { RideSchema, type Ride, type ServiceType, type GeoPoint } from "../types/domain";
import { enqueueOffline, cacheGet, cacheSet } from "../services/offline";
import { useAppStore } from "../store/app-store";
import { logger } from "../services/logger";
import { toast } from "sonner";

export function useRide(rideId?: string) {
  const { state, dispatch } = useAppStore();
  const [ride, setRide] = useState<Ride | null>(state.activeRide);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      // 1) Cache local d'abord (offline-first)
      const cached = await cacheGet<Ride>(`ride:${rideId}`);
      if (cached && !cancelled) setRide(cached);

      // 2) Refresh réseau si dispo
      if (state.online) {
        try {
          const fresh = await api.get<Ride>(`/rides/${rideId}`, { schema: RideSchema });
          if (!cancelled) {
            setRide(fresh);
            cacheSet(`ride:${rideId}`, fresh, 3600_000);
            dispatch({ type: "SET_ACTIVE_RIDE", ride: fresh });
          }
        } catch (e) {
          logger.warn("ride.fetch.fail", { rideId, e: String(e) });
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [rideId, state.online, dispatch]);

  const createRide = useCallback(async (input: {
    serviceType: ServiceType;
    origin: GeoPoint;
    destination: GeoPoint;
    priceXOF: number;
    notes?: string;
  }): Promise<Ride | null> => {
    if (!state.online) {
      await enqueueOffline({
        kind: "ride.create", method: "POST", path: "/rides", payload: input,
      });
      toast.info("Course enregistrée hors-ligne", {
        description: "Elle sera envoyée dès que le réseau revient",
      });
      return null;
    }
    try {
      const created = await api.post<Ride>("/rides", input, { schema: RideSchema });
      dispatch({ type: "SET_ACTIVE_RIDE", ride: created });
      cacheSet(`ride:${created.id}`, created, 3600_000);
      return created;
    } catch (e) {
      logger.error("ride.create.fail", { e: String(e) });
      toast.error("Impossible de créer la course");
      return null;
    }
  }, [state.online, dispatch]);

  return { ride, loading, createRide };
}
