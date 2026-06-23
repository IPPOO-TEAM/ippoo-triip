/**
 * Service SOS IPPOO — bouton d'urgence géolocalisé.
 * Envoie position + alerte à : contacts d'urgence, support IPPOO, police locale.
 */
import { api } from "../api/client";
import { logger } from "./logger";
import { enqueueOffline } from "./offline";

const POLICE_BJ = "117"; // Police nationale Bénin
const GENDARMERIE_BJ = "118";

export type EmergencyContact = { name: string; phone: string };

export function getEmergencyContacts(): EmergencyContact[] {
  try {
    return JSON.parse(localStorage.getItem("ippoo_emergency_contacts") || "[]");
  } catch { return []; }
}

export function setEmergencyContacts(contacts: EmergencyContact[]) {
  localStorage.setItem("ippoo_emergency_contacts", JSON.stringify(contacts.slice(0, 5)));
}

async function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

export async function triggerSos(opts: { reason?: string; rideId?: string } = {}) {
  logger.warn("sos.triggered", opts);
  const position = await getPosition();
  const contacts = getEmergencyContacts();
  const payload = {
    reason: opts.reason ?? "manual",
    rideId: opts.rideId,
    position,
    contacts,
    triggeredAt: new Date().toISOString(),
  };

  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);

  try {
    await api.post("/sos/alert", payload);
  } catch (e) {
    // Hors ligne : on persiste en file pour rejouer
    await enqueueOffline({
      kind: "sos.alert", method: "POST", path: "/sos/alert", payload,
    });
    logger.error("sos.api.fail.enqueued", { e: String(e) });
  }

  // Envoi SMS direct via lien tel: pour appel d'urgence (fallback hors-ligne)
  return {
    position,
    contactsNotified: contacts.length,
    policeNumber: POLICE_BJ,
    gendarmerieNumber: GENDARMERIE_BJ,
    smsBody: buildSmsBody(payload),
  };
}

function buildSmsBody(payload: { position: { lat: number; lng: number } | null; rideId?: string }) {
  const loc = payload.position
    ? `https://maps.google.com/?q=${payload.position.lat},${payload.position.lng}`
    : "position inconnue";
  return `🚨 URGENCE IPPOO · J'ai besoin d'aide. Ma position : ${loc}${
    payload.rideId ? ` (course #${payload.rideId})` : ""
  }`;
}

export function callPolice() {
  window.location.href = `tel:${POLICE_BJ}`;
}

export function callGendarmerie() {
  window.location.href = `tel:${GENDARMERIE_BJ}`;
}

export function smsContacts(body: string, numbers: string[]) {
  const recipients = numbers.join(",");
  window.location.href = `sms:${recipients}?body=${encodeURIComponent(body)}`;
}
