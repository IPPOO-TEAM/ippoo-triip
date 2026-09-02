/**
 * Configuration centrale de la plateforme IPPOO TRIIP - SOURCE DE VÉRITÉ UNIQUE.
 *
 * Permet à l'administrateur (back office) d'éditer :
 *   - les tarifs/prix et les fiches de chaque offre/service,
 *   - les tarifs des véhicules de course,
 *   - la localisation / adresse et les coordonnées de contact.
 *
 * Les données sont persistées dans localStorage et diffusées en temps réel à
 * TOUS les espaces (client, chauffeur, admin, landing) via un store
 * `useSyncExternalStore` + synchronisation inter-onglets (`storage`).
 */
import { useSyncExternalStore } from "react";

export interface OfferConfig {
  id: string;
  name: string;
  /** Petite accroche / stat affichée (ex. « 2 min d'attente ») */
  tagline: string;
  /** Fiche descriptive complète de l'offre */
  description: string;
  /** Prix de départ en FCFA */
  priceFrom: number;
  /** Tarif au km en FCFA (0 si non applicable) */
  perKm: number;
  active: boolean;
}

export interface RideVehicleConfig {
  id: string;
  label: string;
  basePrice: number;
  maxPrice: number;
  perKm: number;
  active: boolean;
}

export interface ContactConfig {
  address: string;
  phone: string;
  email: string;
  /** Requête utilisée pour le lien Google Maps */
  mapsQuery: string;
}

export interface PlatformConfig {
  offers: OfferConfig[];
  rideVehicles: RideVehicleConfig[];
  contact: ContactConfig;
  updatedAt: number;
}

const STORAGE_KEY = "ippoo_triip_platform_config_v1";

export const DEFAULT_CONFIG: PlatformConfig = {
  offers: [
    {
      id: "taxi",
      name: "Taxi-Moto",
      tagline: "2 min d'attente moyenne",
      description:
        "Déplacez-vous rapidement à travers la ville sur nos motos sécurisées. Chauffeurs vérifiés, casques fournis, tarifs transparents.",
      priceFrom: 500,
      perKm: 150,
      active: true,
    },
    {
      id: "delivery",
      name: "Livraison de colis",
      tagline: "30 min de livraison moyenne",
      description:
        "Envoyez vos colis, documents et paquets partout en ville. Suivi en temps réel, photo de preuve à la livraison, confirmation OTP.",
      priceFrom: 1500,
      perKm: 120,
      active: true,
    },
    {
      id: "heavy",
      name: "Transport de biens lourds",
      tagline: "Jusqu'à 5 tonnes",
      description:
        "Déménagements, meubles, équipements. Camionnettes, pickups et camions avec manutentionnaires qualifiés.",
      priceFrom: 5000,
      perKm: 300,
      active: true,
    },
    {
      id: "group",
      name: "Commandes groupées",
      tagline: "Jusqu'à 60% d'économie",
      description:
        "Regroupez vos commandes entre voisins, collègues ou amis. Partagez les frais de livraison et économisez ensemble.",
      priceFrom: 1000,
      perKm: 0,
      active: true,
    },
    {
      id: "carpool",
      name: "Covoiturage",
      tagline: "12 villes desservies",
      description:
        "Partagez vos trajets longue distance entre les grandes villes d'Afrique. Confortable, économique, écologique.",
      priceFrom: 2000,
      perKm: 35,
      active: true,
    },
    {
      id: "air",
      name: "IPPOO AIR",
      tagline: "8 aéroports connectés",
      description:
        "Transport aérien complet : passagers, colis & documents, fret cargo. Du domicile à l'aéroport et retour, avec suivi intégral.",
      priceFrom: 25000,
      perKm: 0,
      active: true,
    },
  ],
  rideVehicles: [
    { id: "moto", label: "Moto", basePrice: 500, maxPrice: 1500, perKm: 150, active: true },
    { id: "tricycle", label: "Tricycle", basePrice: 800, maxPrice: 2000, perKm: 130, active: true },
    { id: "voiture", label: "Voiture", basePrice: 1500, maxPrice: 4000, perKm: 180, active: true },
    { id: "minibus", label: "Mini-bus", basePrice: 3000, maxPrice: 8000, perKm: 250, active: true },
  ],
  contact: {
    address: "Carrefour Cadjehoun, Cotonou, Bénin",
    phone: "+229 97 00 00 00",
    email: "ippooz.up.2@gmail.com",
    mapsQuery: "Carrefour Cadjehoun, Cotonou, Bénin",
  },
  updatedAt: 0,
};

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

/** Fusionne la config sauvegardée avec les valeurs par défaut (tolère les champs manquants) */
function migrate(saved: Partial<PlatformConfig> | null): PlatformConfig {
  if (!saved) return clone(DEFAULT_CONFIG);
  return {
    offers: Array.isArray(saved.offers) && saved.offers.length ? saved.offers : clone(DEFAULT_CONFIG.offers),
    rideVehicles:
      Array.isArray(saved.rideVehicles) && saved.rideVehicles.length
        ? saved.rideVehicles
        : clone(DEFAULT_CONFIG.rideVehicles),
    contact: { ...DEFAULT_CONFIG.contact, ...(saved.contact || {}) },
    updatedAt: saved.updatedAt || 0,
  };
}

function load(): PlatformConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return migrate(raw ? JSON.parse(raw) : null);
  } catch {
    return clone(DEFAULT_CONFIG);
  }
}

let current: PlatformConfig = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* quota / mode privé - ignoré */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getPlatformConfig(): PlatformConfig {
  return current;
}

export function setPlatformConfig(
  updater: PlatformConfig | ((c: PlatformConfig) => PlatformConfig),
) {
  const next = typeof updater === "function" ? (updater as any)(current) : updater;
  current = { ...next, updatedAt: Date.now() };
  persist();
  emit();
}

export function resetPlatformConfig() {
  current = { ...clone(DEFAULT_CONFIG), updatedAt: Date.now() };
  persist();
  emit();
}

/* -- Mises à jour ciblées -- */
export function updateOffer(id: string, patch: Partial<OfferConfig>) {
  setPlatformConfig((c) => ({
    ...c,
    offers: c.offers.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  }));
}

export function updateRideVehicle(id: string, patch: Partial<RideVehicleConfig>) {
  setPlatformConfig((c) => ({
    ...c,
    rideVehicles: c.rideVehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  }));
}

export function updateContact(patch: Partial<ContactConfig>) {
  setPlatformConfig((c) => ({ ...c, contact: { ...c.contact, ...patch } }));
}

/* -- Synchronisation inter-onglets -- */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      current = load();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Hook React : renvoie la config et se re-rend à chaque modification (tous espaces). */
export function usePlatformConfig(): PlatformConfig {
  return useSyncExternalStore(subscribe, getPlatformConfig, getPlatformConfig);
}

/** Helper rapide pour récupérer une offre par id. */
export function findOffer(c: PlatformConfig, id: string): OfferConfig | undefined {
  return c.offers.find((o) => o.id === id);
}
