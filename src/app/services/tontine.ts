/**
 * Tontines covoiturage IPPOO — adapter le concept africain de la tontine
 * au covoiturage récurrent (trajets domicile-travail à plusieurs).
 *
 * Logique : N membres cotisent au pot commun chaque cycle.
 * Le pot finance les courses du cycle ; le solde est redistribué.
 * Le "tour" tournant désigne le membre qui réserve les courses du jour.
 */
import { z } from "zod";
import { api } from "../api/client";
import { MoneyXOFSchema, IdSchema } from "../types/domain";

export const TontineMemberSchema = z.object({
  userId: IdSchema,
  fullName: z.string(),
  phone: z.string(),
  contributionXOF: MoneyXOFSchema,
  paidThisCycle: z.boolean().default(false),
});

export const TontineSchema = z.object({
  id: IdSchema,
  name: z.string(),
  cycleStart: z.string().datetime(),
  cycleDays: z.number().int().positive(),
  potXOF: MoneyXOFSchema,
  members: z.array(TontineMemberSchema),
  rotationIndex: z.number().int().nonnegative(),
});

export type Tontine = z.infer<typeof TontineSchema>;
export type TontineMember = z.infer<typeof TontineMemberSchema>;

export async function createTontine(input: {
  name: string;
  contributionXOF: number;
  cycleDays: number;
  memberPhones: string[];
}): Promise<Tontine> {
  return api.post<Tontine>("/tontines", input, { schema: TontineSchema });
}

export async function listMyTontines(): Promise<Tontine[]> {
  return api.get<Tontine[]>("/tontines/mine");
}

export async function payContribution(tontineId: string): Promise<Tontine> {
  return api.post<Tontine>(`/tontines/${tontineId}/contribute`, {}, { schema: TontineSchema });
}

export async function advanceRotation(tontineId: string): Promise<Tontine> {
  return api.post<Tontine>(`/tontines/${tontineId}/rotate`, {}, { schema: TontineSchema });
}

/** Calcule le membre actuellement responsable du tour */
export function currentHolder(t: Tontine): TontineMember | null {
  if (t.members.length === 0) return null;
  return t.members[t.rotationIndex % t.members.length] ?? null;
}

/** Combien chaque membre récupère si on clôture maintenant */
export function settlementPerMember(t: Tontine): number {
  if (t.members.length === 0) return 0;
  return Math.floor(t.potXOF / t.members.length);
}
