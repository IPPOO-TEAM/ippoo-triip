/**
 * Service Mobile Money IPPOO - Bénin.
 * Détecte automatiquement l'opérateur depuis le préfixe et lance le flow USSD/STK.
 *
 * Préfixes Bénin (8 chiffres, sans 229) :
 *   MTN    : 96, 97, 51..59, 61..69, 90..99 (mapping simplifié)
 *   Moov   : 94, 95, 98, 99, 60..69 (chevauchement → fallback choix utilisateur)
 *   Celtiis: 90, 91 (Glo historique)
 */
import { api } from "../api/client";
import { logger } from "./logger";
import type { PaymentMethod } from "../types/domain";

export type MomoOperator = "mtn_momo" | "moov_money" | "celtiis_cash";

export function detectOperator(phoneRaw: string): MomoOperator | null {
  const digits = phoneRaw.replace(/\D/g, "").replace(/^229/, "");
  if (digits.length < 2) return null;
  const p = digits.slice(0, 2);
  if (["96", "97", "61", "62", "66", "67", "69"].includes(p)) return "mtn_momo";
  if (["94", "95", "98", "65", "68"].includes(p)) return "moov_money";
  if (["90", "91", "60", "63"].includes(p)) return "celtiis_cash";
  return null;
}

export function operatorLabel(op: MomoOperator): string {
  return {
    mtn_momo: "MTN MoMo",
    moov_money: "Moov Money",
    celtiis_cash: "Celtiis Cash",
  }[op];
}

export function operatorUssdCode(op: MomoOperator): string {
  return { mtn_momo: "*880#", moov_money: "*555#", celtiis_cash: "*811#" }[op];
}

export type MomoInitResult = {
  transactionId: string;
  status: "pending" | "success" | "failed";
  ussdHint: string;
  expiresAt: number;
};

export async function initiatePayment(input: {
  phone: string;
  amountXOF: number;
  operator: MomoOperator;
  rideId?: string;
  description?: string;
}): Promise<MomoInitResult> {
  if (input.amountXOF < 100) throw new Error("Montant minimum : 100 XOF");
  if (input.amountXOF > 500_000) throw new Error("Montant maximum : 500 000 XOF");
  logger.info("momo.initiate", { op: input.operator, amount: input.amountXOF });
  return api.post<MomoInitResult>("/payments/momo/initiate", {
    phone: input.phone,
    amount: input.amountXOF,
    operator: input.operator,
    rideId: input.rideId,
    description: input.description,
  });
}

export async function pollPaymentStatus(
  transactionId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<"success" | "failed" | "timeout"> {
  const interval = opts.intervalMs ?? 3000;
  const deadline = Date.now() + (opts.timeoutMs ?? 120_000);
  while (Date.now() < deadline) {
    try {
      const r = await api.get<{ status: string }>(
        `/payments/momo/${transactionId}/status`,
      );
      if (r.status === "success") return "success";
      if (r.status === "failed") return "failed";
    } catch (e) {
      logger.warn("momo.poll.error", { e: String(e) });
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return "timeout";
}

/** Méthodes disponibles côté UI selon le pays */
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "mtn_momo", label: "MTN MoMo", icon: "📱" },
  { id: "moov_money", label: "Moov Money", icon: "💳" },
  { id: "celtiis_cash", label: "Celtiis Cash", icon: "💰" },
  { id: "cash", label: "Espèces", icon: "💵" },
  { id: "wallet", label: "Portefeuille IPPOO", icon: "👛" },
];
