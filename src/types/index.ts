// TODO: US-1.1
// Global TypeScript Definitions untuk Sistem Rental Motor Yogyakarta (Strict Types, Bebas dari 'any')

export type UserRole = "OWNER" | "STAFF";

export type UnitStatus = "READY" | "RENTED" | "MAINTENANCE";

export type BookingStatus =
  "PENDING" | "CONFIRMED" | "ACTIVE" | "LATE" | "RETURNED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type PolicyScope = "GLOBAL" | "TYPE" | "UNIT";

export type BillingMode = "HYBRID" | "HOURLY" | "FULL_DAY";

export interface DendaTierRule {
  mode: "PER_BLOK";
  blokMenit: number;
  nominalPerBlok: number;
  hitungSetelahGrace: boolean;
  maksKaliHargaHarianPer24Jam: number;
}

export interface PolicySnapshot {
  id: string;
  version: number;
  effectiveFrom: string; // ISO 8601 UTC
  billingMode: BillingMode;
  hargaPerJam: number;
  hargaHarian: number;
  minDurasiJam: number;
  hargaMinimum: number | null;
  diskonMingguan: number;
  diskonBulanan: number;
  bufferJam: number;
  bufferAntarJemput: number;
  dendaTier: DendaTierRule;
  graceMenit: number;
  depositNominal: number;
  jamBuka: string;
  jamTutup: string;
  biayaLuarJam: number;
  pendingTimeoutMenit: number;
  maxDurasiHari: number;
  refundH3Persen: number;
  refundH1Persen: number;
  refundNoShowPersen: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
