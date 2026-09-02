/**
 * Schéma de domaine centralisé IPPOO - validé par Zod
 * Toutes les entités métier de l'application transitent par ces schémas.
 */
import { z } from "zod";

/* ------------ Identifiants & primitives ------------ */
export const IdSchema = z.string().min(1);
export const PhoneBJSchema = z
  .string()
  .regex(/^(\+229)?0?[0-9]{8,10}$/, "Numéro béninois invalide");
export const MoneyXOFSchema = z.number().int().nonnegative();
export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().optional(),
});

/* ------------ Utilisateur ------------ */
export const UserRoleSchema = z.enum(["client", "driver", "admin"]);
export const KycStatusSchema = z.enum(["pending", "verified", "rejected"]);

export const UserSchema = z.object({
  id: IdSchema,
  role: UserRoleSchema,
  fullName: z.string().min(2),
  phone: PhoneBJSchema,
  // Tolérant aux null renvoyés par Postgres (convertis en undefined).
  email: z.string().email().nullish().transform((v) => v ?? undefined),
  avatarUrl: z.string().url().nullish().transform((v) => v ?? undefined),
  city: z.string().default("Cotonou"),
  language: z.enum(["fr", "fon", "yor", "en"]).default("fr"),
  kycStatus: KycStatusSchema.default("pending"),
  // Accepte les timestamps Postgres ("2026-09-02 12:34:56+00") comme l'ISO strict.
  createdAt: z.string(),
});

/* ------------ Chauffeur ------------ */
export const VehicleTypeSchema = z.enum(["moto", "tricycle", "car", "van", "truck"]);

export const DriverProfileSchema = UserSchema.extend({
  role: z.literal("driver"),
  vehicleType: VehicleTypeSchema,
  vehiclePlate: z.string().min(4),
  licenseNumber: z.string(),
  rating: z.number().min(0).max(5).default(5),
  totalRides: z.number().int().nonnegative().default(0),
  isOnline: z.boolean().default(false),
  currentLocation: GeoPointSchema.optional(),
});

/* ------------ Service / Course ------------ */
export const ServiceTypeSchema = z.enum([
  "taxi_moto",
  "delivery",
  "heavy_transport",
  "group_order",
  "carpool",
  "air_freight",
]);

export const RideStatusSchema = z.enum([
  "requested",
  "accepted",
  "arriving",
  "in_progress",
  "completed",
  "cancelled",
]);

export const RideSchema = z.object({
  id: IdSchema,
  clientId: IdSchema,
  driverId: IdSchema.optional(),
  serviceType: ServiceTypeSchema,
  status: RideStatusSchema,
  origin: GeoPointSchema,
  destination: GeoPointSchema,
  priceXOF: MoneyXOFSchema,
  distanceKm: z.number().nonnegative().optional(),
  durationMin: z.number().nonnegative().optional(),
  scheduledAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

/* ------------ Paiement & Wallet ------------ */
export const PaymentMethodSchema = z.enum([
  "mtn_momo",
  "moov_money",
  "celtiis_cash",
  "card",
  "cash",
  "wallet",
]);

export const TransactionTypeSchema = z.enum([
  "topup",
  "ride_payment",
  "withdrawal",
  "refund",
  "referral_bonus",
  "promo_credit",
]);

export const TransactionStatusSchema = z.enum([
  "pending",
  "processing",
  "success",
  "failed",
  "reversed",
]);

export const TransactionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  type: TransactionTypeSchema,
  method: PaymentMethodSchema,
  amountXOF: MoneyXOFSchema,
  status: TransactionStatusSchema,
  reference: z.string().optional(),
  rideId: IdSchema.optional(),
  createdAt: z.string().datetime(),
  description: z.string().optional(),
});

export const WalletSchema = z.object({
  userId: IdSchema,
  balanceXOF: MoneyXOFSchema,
  pendingXOF: MoneyXOFSchema.default(0),
  currency: z.literal("XOF").default("XOF"),
});

/* ------------ Notification ------------ */
export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  type: z.enum(["ride", "payment", "promo", "system", "sos"]),
  title: z.string(),
  body: z.string(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/* ------------ Auth ------------ */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});

export const LoginRequestSchema = z.object({
  phone: PhoneBJSchema,
  password: z.string().min(6).optional(),
  otp: z.string().length(6).optional(),
});

/* ------------ Évènements de course (timeline) ------------ */
export const RideEventSchema = z.object({
  id: IdSchema,
  rideId: IdSchema,
  status: RideStatusSchema,
  label: z.string(),
  at: z.string().datetime(),
  location: GeoPointSchema.optional(),
});

/* ------------ Parrainage ------------ */
export const ReferralStatusSchema = z.enum(["pending", "registered", "rewarded"]);

export const ReferralSchema = z.object({
  id: IdSchema,
  referrerId: IdSchema,
  code: z.string().min(4),
  inviteePhone: PhoneBJSchema.optional(),
  inviteeName: z.string().optional(),
  status: ReferralStatusSchema.default("pending"),
  rewardXOF: MoneyXOFSchema.default(1000),
  createdAt: z.string().datetime(),
});

export const ReferralSummarySchema = z.object({
  code: z.string(),
  link: z.string().url(),
  invited: z.number().int().nonnegative(),
  registered: z.number().int().nonnegative(),
  totalEarnedXOF: MoneyXOFSchema,
  referrals: z.array(ReferralSchema),
});

/* ------------ Commande groupée ------------ */
export const GroupOrderStatusSchema = z.enum([
  "open",
  "locked",
  "in_delivery",
  "delivered",
  "cancelled",
]);

export const GroupOrderParticipantSchema = z.object({
  userId: IdSchema,
  name: z.string(),
  items: z.number().int().positive(),
  amountXOF: MoneyXOFSchema,
});

export const GroupOrderSchema = z.object({
  id: IdSchema,
  hostId: IdSchema,
  title: z.string(),
  vendor: z.string(),
  status: GroupOrderStatusSchema,
  deliveryFeeXOF: MoneyXOFSchema,
  participants: z.array(GroupOrderParticipantSchema),
  totalXOF: MoneyXOFSchema,
  deadline: z.string().datetime(),
  createdAt: z.string().datetime(),
});

/* ------------ Covoiturage ------------ */
export const CarpoolTripSchema = z.object({
  id: IdSchema,
  driverId: IdSchema,
  driverName: z.string(),
  origin: GeoPointSchema,
  destination: GeoPointSchema,
  departAt: z.string().datetime(),
  seatsTotal: z.number().int().positive(),
  seatsLeft: z.number().int().nonnegative(),
  pricePerSeatXOF: MoneyXOFSchema,
  vehicle: z.string(),
  createdAt: z.string().datetime(),
});

/* ------------ Fret aérien ------------ */
export const AirFreightStatusSchema = z.enum([
  "quoted",
  "booked",
  "in_transit",
  "customs",
  "delivered",
]);

export const AirFreightShipmentSchema = z.object({
  id: IdSchema,
  clientId: IdSchema,
  fromAirport: z.string(),
  toAirport: z.string(),
  weightKg: z.number().positive(),
  category: z.enum(["documents", "parcel", "cargo"]),
  priceXOF: MoneyXOFSchema,
  status: AirFreightStatusSchema,
  trackingCode: z.string(),
  createdAt: z.string().datetime(),
});

/* ------------ Statistiques admin ------------ */
export const AdminStatsSchema = z.object({
  usersTotal: z.number().int().nonnegative(),
  driversOnline: z.number().int().nonnegative(),
  ridesToday: z.number().int().nonnegative(),
  ridesActive: z.number().int().nonnegative(),
  revenueTodayXOF: MoneyXOFSchema,
  revenueMonthXOF: MoneyXOFSchema,
  kycPending: z.number().int().nonnegative(),
  ridesByService: z.array(z.object({ service: ServiceTypeSchema, count: z.number().int() })),
  revenue7d: z.array(z.object({ day: z.string(), amountXOF: MoneyXOFSchema })),
});

/* ------------ Réponse paginée générique ------------ */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

/* ------------ Types exportés ------------ */
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type DriverProfile = z.infer<typeof DriverProfileSchema>;
export type Ride = z.infer<typeof RideSchema>;
export type RideStatus = z.infer<typeof RideStatusSchema>;
export type ServiceType = z.infer<typeof ServiceTypeSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Wallet = z.infer<typeof WalletSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type RideEvent = z.infer<typeof RideEventSchema>;
export type Referral = z.infer<typeof ReferralSchema>;
export type ReferralSummary = z.infer<typeof ReferralSummarySchema>;
export type GroupOrder = z.infer<typeof GroupOrderSchema>;
export type CarpoolTrip = z.infer<typeof CarpoolTripSchema>;
export type AirFreightShipment = z.infer<typeof AirFreightShipmentSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type VehicleType = z.infer<typeof VehicleTypeSchema>;
