---BEGIN---
---

title: "PRD: Sistem Rental Motor Yogyakarta"
version: "2.0"
date: "2025-11-13"
author: "Owner / Solo Developer"
status: "Ready for Development"
stack: "Next.js 15 + TypeScript + Prisma + PostgreSQL + Tailwind"
---

# 📘 PRD: Sistem Rental Motor Yogyakarta

**Versi**: 2.0  
**Tanggal**: 13 November 2025  
**Author**: Owner / Solo Developer  
**Tech Stack**: Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind  
**Status**: Ready for Development

---

## 1. Ringkasan Produk

Platform rental motor online untuk Yogyakarta dengan sistem ketersediaan real-time, kalkulasi harga/denda otomatis, dan panel admin yang bisa diedit tanpa coding (Policy Engine).

**Target**: zero double-booking, admin bisa cek ketersediaan < 5 detik, denda terhitung otomatis.

**Business rules** (harga hybrid minimum 12 jam, buffer 2 jam, denda tiered, state machine booking, kebijakan refund) mengacu pada Section 6 sebagai referensi tunggal.

---

## 2. Tech Stack & Keputusan Arsitektur

### 2.1 Stack Final

| Layer         | Teknologi              | Versi             | Alasan                                             |
| ------------- | ---------------------- | ----------------- | -------------------------------------------------- |
| Framework     | Next.js                | 15.x (App Router) | RSC, Server Actions, ISR, zero-config deploy       |
| Bahasa        | TypeScript             | 5.x (strict)      | Type safety end-to-end                             |
| ORM           | Prisma                 | 6.x               | Migrations, type-safe query, raw SQL untuk EXCLUDE |
| Database      | PostgreSQL             | 16.x              | `tstzrange` + `EXCLUDE USING gist`                 |
| Styling       | Tailwind CSS           | 4.x               | Utility-first                                      |
| UI Components | shadcn/ui              | latest            | Copy-paste, tidak locked-in                        |
| Auth          | Auth.js (NextAuth v5)  | 5.x               | Credentials provider admin                         |
| Form          | react-hook-form + zod  | latest            | Validasi client & server identik                   |
| State         | RSC + TanStack Query   | latest            | RSC awal, TanStack client cache                    |
| Email         | Resend + React Email   | latest            | Template email JSX                                 |
| PDF           | @react-pdf/renderer    | latest            | Invoice pakai komponen React                       |
| Storage       | S3-compatible (Wasabi) | —                 | File KTP/SIM, signed URL                           |
| Queue/Cron    | pg-boss / Vercel Cron  | —                 | Pending timeout, cleanup                           |
| Monitoring    | Sentry                 | latest            | Error tracking                                     |
| Deploy        | Vercel / VPS + Docker  | —                 | Vercel paling mulus untuk Next 15                  |

### 2.2 Yang Perlu Dihindari

- ❌ MySQL / MongoDB — tidak punya `EXCLUDE` constraint
- ❌ Prisma Studio sebagai admin panel — ini debug tool
- ❌ `setTimeout` untuk pending timeout — hilang saat restart
- ❌ localStorage untuk auth — pakai cookie httpOnly
- ❌ Simpan tanggal di DB sebagai string — selalu `timestamptz`

---

## 3. Struktur Project

```
rental-motor-jogja/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── motor/[slug]/page.tsx
│   │   │   ├── booking/[unitId]/page.tsx
│   │   │   ├── booking/sukses/[kode]/page.tsx
│   │   │   ├── cek-booking/page.tsx
│   │   │   └── (static)/syarat-ketentuan/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── booking/[id]/page.tsx
│   │   │   ├── timeline/page.tsx
│   │   │   ├── armada/page.tsx
│   │   │   ├── pelanggan/page.tsx
│   │   │   ├── policy/page.tsx
│   │   │   ├── laporan/page.tsx
│   │   │   └── setting/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── availability/route.ts
│   │   │   ├── booking/route.ts
│   │   │   ├── upload/route.ts
│   │   │   ├── extend/route.ts
│   │   │   └── cron/pending-timeout/route.ts
│   │   └── layout.tsx
│   ├── components/{ui,booking,admin,shared}/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── pricing.ts
│   │   ├── penalty.ts
│   │   ├── availability.ts
│   │   ├── policy.ts
│   │   ├── s3.ts
│   │   ├── email.ts
│   │   ├── zod-schemas.ts
│   │   └── utils.ts
│   ├── server/{actions,queries}/
│   └── types/index.ts
├── tests/unit/{pricing,penalty}.test.ts
└── .env.example
```

**Konvensi**:

- Server Actions untuk mutasi (bukan API route, kecuali webhook/cron)
- Semua mutasi wajib validasi Zod server-side
- Semua tanggal pakai `Date` di TS, konversi WIB hanya saat render
- Naming: `hitungHarga` (bisnis, Indonesia), `createBooking` (infra, Inggris)

---

## 4. Skema Database (Prisma)

### 4.1 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  nama         String
  role         Role     @default(STAFF)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum Role { OWNER STAFF }

model Unit {
  id        String     @id @default(cuid())
  platNomor String     @unique
  tipe      String
  slug      String     @unique
  status    UnitStatus @default(READY)
  policyId  String?
  policy    Policy?    @relation(fields: [policyId], references: [id])
  bookings  Booking[]
  blackouts Blackout[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?

  @@index([status])
  @@index([tipe])
}

enum UnitStatus { READY RENTED MAINTENANCE }

model Blackout {
  id        String   @id @default(cuid())
  unitId    String
  unit      Unit     @relation(fields: [unitId], references: [id])
  mulai     DateTime
  selesai   DateTime
  alasan    String
  createdAt DateTime @default(now())
  @@index([unitId, mulai, selesai])
}

model Policy {
  id                  String      @id @default(cuid())
  scope               PolicyScope
  scopeKey            String?
  version             Int
  effectiveFrom       DateTime    @default(now())
  billingMode         BillingMode @default(HYBRID)
  hargaPerJam         Int
  hargaHarian         Int
  minDurasiJam        Int         @default(12)
  hargaMinimum        Int?
  diskonMingguan      Int         @default(0)
  diskonBulanan       Int         @default(0)
  bufferJam           Int         @default(2)
  bufferAntarJemput   Int         @default(3)
  dendaTier           Json
  graceMenit          Int         @default(15)
  depositNominal      Int         @default(0)
  jamBuka             String      @default("08:00")
  jamTutup            String      @default("20:00")
  biayaLuarJam        Int         @default(0)
  pendingTimeoutMenit Int         @default(120)
  maxDurasiHari       Int         @default(30)
  refundH3Persen      Int         @default(100)
  refundH1Persen      Int         @default(50)
  refundNoShowPersen  Int         @default(0)
  createdBy           String
  changeReason        String?
  createdAt           DateTime    @default(now())
  units               Unit[]

  @@unique([scope, scopeKey, version])
  @@index([scope, scopeKey, effectiveFrom])
}

enum PolicyScope { GLOBAL TYPE UNIT }
enum BillingMode { HOURLY HYBRID FULL_DAY }

model Customer {
  id            String    @id @default(cuid())
  nama          String
  noHp          String    @unique
  email         String?
  ktpUrl        String?
  simUrl        String?
  isBlacklisted Boolean   @default(false)
  lateCount     Int       @default(0)
  bookings      Booking[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Booking {
  id                String        @id @default(cuid())
  kodeBooking       String        @unique
  unitId            String
  unit              Unit          @relation(fields: [unitId], references: [id])
  customerId        String
  customer          Customer      @relation(fields: [customerId], references: [id])
  mulai             DateTime
  selesai           DateTime
  bufferSampai      DateTime
  denganAntarJemput Boolean       @default(false)
  policyVersionId   String
  policySnapshot    Json
  hargaDasar        Int
  diskon            Int           @default(0)
  totalHarga        Int
  status            BookingStatus @default(PENDING)
  dikonfirmasiAt    DateTime?
  diambilAt         DateTime?
  dikembalikanAt    DateTime?
  dpNominal         Int?
  dpBuktiUrl        String?
  depositNominal    Int?
  extendRequests    ExtendRequest[]
  penaltyLog        PenaltyLog?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([unitId, status, mulai, bufferSampai])
  @@index([customerId])
  @@index([status, createdAt])
}

enum BookingStatus {
  PENDING CONFIRMED ACTIVE RETURNED COMPLETED CANCELLED NO_SHOW LATE
}

model ExtendRequest {
  id            String       @id @default(cuid())
  bookingId     String
  booking       Booking      @relation(fields: [bookingId], references: [id])
  tambahanJam   Int
  status        ExtendStatus @default(PENDING)
  alasanTolak   String?
  requestedAt   DateTime     @default(now())
  decidedAt     DateTime?
  hargaTambahan Int?
}

enum ExtendStatus { PENDING APPROVED REJECTED }

model PenaltyLog {
  id             String   @id @default(cuid())
  bookingId      String   @unique
  booking        Booking  @relation(fields: [bookingId], references: [id])
  telatMenit     Int
  tierLabel      String
  dendaNominal   Int
  alasanOverride String?
  createdAt      DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  actorType String
  actorId   String?
  action    String
  entityId  String?
  before    Json?
  after     Json?
  createdAt DateTime @default(now())
  @@index([entityId])
  @@index([action, createdAt])
}

model SystemSetting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```

### 4.2 Migration SQL Kustom (WAJIB)

File: `prisma/migrations/XXXX_add_booking_exclusion/migration.sql`

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD COLUMN periode tstzrange
  GENERATED ALWAYS AS (tstzrange("mulai", "bufferSampai", '[)')) STORED;

ALTER TABLE "Booking"
  ADD CONSTRAINT no_overlap_bookings
  EXCLUDE USING gist (
    "unitId" WITH =,
    periode WITH &&
  ) WHERE (status IN ('PENDING','CONFIRMED','ACTIVE','RETURNED','LATE'));

CREATE INDEX booking_availability_idx
  ON "Booking" ("unitId", "status", "mulai", "bufferSampai");
```

⚠️ Prisma tidak support `EXCLUDE` native. Tambahkan manual via migration file, jangan regenerate.

---

## 5. Arsitektur Aplikasi

### 5.1 Server Action Pattern

```typescript
// src/server/actions/booking.ts
"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolvePolicy } from "@/lib/policy";
import { hitungHarga } from "@/lib/pricing";
import { revalidatePath } from "next/cache";

const bookingSchema = z.object({
  unitId: z.string().cuid(),
  nama: z.string().min(2).max(100),
  noHp: z.string().regex(/^08\d{8,11}$/),
  email: z.string().email().optional(),
  mulai: z.coerce.date(),
  selesai: z.coerce.date(),
  denganAntarJemput: z.boolean().default(false),
  ktpFileKey: z.string(),
  simFileKey: z.string(),
  setujuSK: z.literal(true),
});

export async function createBooking(input: unknown) {
  const data = bookingSchema.parse(input);
  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: data.unitId },
    include: { policy: true },
  });
  const policy = await resolvePolicy(unit);
  const harga = hitungHarga(data.mulai, data.selesai, policy);

  const bufferMenit = data.denganAntarJemput
    ? policy.bufferAntarJemput * 60
    : policy.bufferJam * 60;
  const bufferSampai = new Date(data.selesai.getTime() + bufferMenit * 60000);

  try {
    const booking = await prisma.booking.create({
      data: {
        kodeBooking: generateKode(),
        unitId: unit.id,
        customer: {
          connectOrCreate: {
            where: { noHp: data.noHp },
            create: {
              nama: data.nama,
              noHp: data.noHp,
              email: data.email,
              ktpUrl: data.ktpFileKey,
              simUrl: data.simFileKey,
            },
          },
        },
        mulai: data.mulai,
        selesai: data.selesai,
        bufferSampai,
        denganAntarJemput: data.denganAntarJemput,
        policyVersionId: policy.id,
        policySnapshot: policy as any,
        hargaDasar: harga.hargaDasar,
        diskon: harga.diskon,
        totalHarga: harga.total,
        status: "PENDING",
      },
    });
    revalidatePath("/admin/timeline");
    return { ok: true, booking };
  } catch (e: any) {
    if (e.code === "P2010" && e.meta?.code === "23P01") {
      return { ok: false, error: "SLOT_BENTROK" };
    }
    throw e;
  }
}
```

### 5.2 Query Ketersediaan

```typescript
// src/lib/availability.ts
export async function cekBentrok(
  unitId: string,
  mulai: Date,
  bufferSampai: Date
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "Booking"
      WHERE "unitId" = ${unitId}
        AND status IN ('PENDING','CONFIRMED','ACTIVE','RETURNED','LATE')
        AND tstzrange("mulai", "bufferSampai", '[)')
            && tstzrange(${mulai}::timestamptz, ${bufferSampai}::timestamptz, '[)')
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}
```

### 5.3 Timezone Helper

```typescript
export const WIB = "Asia/Jakarta";

export function formatWIB(date: Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    dateStyle: "medium",
    timeStyle: "short",
    ...opts,
  }).format(date);
}

export function parseWIBToUTC(localString: string): Date {
  return new Date(localString + ":00+07:00");
}
```

**Aturan**: semua `Date` di aplikasi & DB = UTC. Konversi ke WIB hanya di layer tampilan.

---

## 6. Business Rules (Referensi Tunggal)

| Rule                                    | Implementasi di                        |
| --------------------------------------- | -------------------------------------- |
| Harga hybrid (min 12 jam, ceil per jam) | `lib/pricing.ts::hitungHarga`          |
| Denda tiered (grace 15 mnt, 5 tier)     | `lib/penalty.ts::hitungDenda`          |
| Buffer 2 jam / antar-jemput 3 jam       | `server/actions/booking.ts`            |
| Anti-overlap                            | PostgreSQL EXCLUDE constraint          |
| Extend validasi                         | `lib/availability.ts::validasiExtend`  |
| Policy versioning                       | `lib/policy.ts` + tabel `Policy`       |
| State machine booking                   | Enum `BookingStatus` + guard di action |
| Pending timeout 120 menit               | Cron `/api/cron/pending-timeout`       |
| Timezone WIB                            | `lib/utils.ts`                         |

**Rumus Harga (Hybrid)**:

```
durasi < 12 jam       → harga minimum = 12 × harga_per_jam
12 ≤ durasi < 24 jam  → min(durasi × harga_per_jam, harga_harian)
durasi = 24 jam       → harga_harian
durasi > 24 jam       → floor(durasi/24) × harga_harian + (durasi % 24) × harga_per_jam
```

**Denda Tiered**:

| Telat            | Denda                         |
| ---------------- | ----------------------------- |
| 0 – 15 menit     | Rp 0 (grace)                  |
| 15 menit – 6 jam | 1× harga harian               |
| 6 – 12 jam       | 1,5× harga harian             |
| 12 – 24 jam      | 2× harga harian               |
| > 24 jam         | 2× + 1× per 24 jam berikutnya |

**Unit test wajib** untuk `hitungHarga`, `hitungDenda`, `validasiExtend`.

---

## 7. Fitur (Ringkasan)

### 7.1 Public

- Beranda, katalog motor, detail motor
- Pencarian ketersediaan + kalender disabled tanggal terblokir
- Form booking (upload KTP/SIM, kalkulator harga real-time, checkbox S&K)
- Halaman sukses (kode booking, countdown DP, tombol WA)
- Cek riwayat booking by kode
- Halaman statis: S&K, kebijakan privasi, FAQ

### 7.2 Admin

- Login (2 role: Owner, Staff)
- Dashboard "Perlu Tindakan"
- Timeline kalender (Gantt-style, 5 warna, mobile-friendly)
- Form cek ketersediaan cepat
- Manajemen booking (detail, konfirmasi DP, check-out, cancel, relokasi)
- Manajemen armada (CRUD, blackout tanggal)
- Manajemen pelanggan (blacklist)
- Policy Engine (edit + versioning + audit log)
- Laporan (pendapatan, utilization)
- Setting (mode maintenance, feature flag)

---

## 8. API & Server Actions

### 8.1 API Routes

| Method | Path                      | Fungsi                     |
| ------ | ------------------------- | -------------------------- |
| POST   | /api/auth/[...nextauth]   | Auth.js handler            |
| POST   | /api/availability         | Cek ketersediaan           |
| POST   | /api/upload               | Upload file, return S3 key |
| GET    | /api/cron/pending-timeout | Cancel PENDING > timeout   |
| GET    | /api/cron/cleanup-files   | Hapus KTP/SIM > 90 hari    |
| POST   | /api/extend               | User request extend        |

### 8.2 Server Actions

| Action          | File                     | Fungsi                          |
| --------------- | ------------------------ | ------------------------------- |
| createBooking   | actions/booking.ts       | Buat booking PENDING            |
| confirmDP       | actions/admin-booking.ts | Admin konfirmasi DP             |
| checkOut        | actions/admin-booking.ts | Input jam kembali, hitung denda |
| cancelBooking   | actions/admin-booking.ts | Cancel + hitung refund          |
| requestExtend   | actions/booking.ts       | Request extend                  |
| decideExtend    | actions/admin-booking.ts | Approve/reject extend           |
| relocateBooking | actions/admin-booking.ts | Pindah ke unit lain             |
| upsertPolicy    | actions/policy.ts        | Simpan policy baru              |
| forceMajeure    | actions/admin-booking.ts | Bebaskan denda                  |
| upsertUnit      | actions/unit.ts          | CRUD unit                       |
| upsertBlackout  | actions/unit.ts          | Blokir tanggal                  |

---

## 9. UI/UX Notes

- **Calendar picker**: `react-day-picker` v9 + custom Tailwind
- **Timeline admin**: custom div grid (bukan FullCalendar, terlalu berat)
- **Form**: `react-hook-form` + `zodResolver`
- **Toast**: `sonner`
- **Modal**: shadcn `Dialog` / `Sheet`
- **Mobile-first untuk admin**: horizontal scroll timeline, tap target 44×44 px
- **Accessibility**: label form, kontras WCAG AA, `aria-label` tombol icon

---

## 10. Keamanan & Non-Functional

| Aspek       | Implementasi                                          |
| ----------- | ----------------------------------------------------- |
| Password    | bcryptjs cost 12                                      |
| Session     | Auth.js JWT + cookie httpOnly + secure + sameSite=lax |
| CSRF        | Auth.js + Server Action built-in                      |
| Rate limit  | Upstash ratelimit / in-memory Map                     |
| CAPTCHA     | Cloudflare Turnstile                                  |
| File upload | Validasi MIME + magic bytes, max 2MB, presigned URL   |
| File access | Signed URL 5 menit expiry                             |
| Retensi     | Cron hapus KTP/SIM > 90 hari                          |
| Audit       | Semua mutasi Policy, extend rejection tercatat        |
| Monitoring  | Sentry SDK + source maps                              |

**Performance target**:

- LCP < 2.5s di 4G
- API `/api/availability` < 300ms p95
- RSC data fetch paralel

---

## 11. Deployment

### 11.1 `.env.example`

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
AUTH_SECRET="openssl rand -base64 32"
AUTH_URL="https://rentalmotorjogja.com"
S3_ENDPOINT="https://s3.wasabisys.com"
S3_REGION="ap-southeast-1"
S3_BUCKET="rental-motor-files"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@rentalmotorjogja.com"
SENTRY_DSN="..."
CRON_SECRET="openssl rand -hex 32"
TURNSTILE_SECRET_KEY="..."
NEXT_PUBLIC_TURNSTILE_SITE_KEY="..."
NEXT_PUBLIC_BASE_URL="https://rentalmotorjogja.com"
```

### 11.2 `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/pending-timeout", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/cleanup-files", "schedule": "0 3 * * *" }
  ]
}
```

Cron route wajib cek `Authorization: Bearer ${CRON_SECRET}`.

### 11.3 Backup

- Vercel Postgres / Neon: PITR
- VPS: `pg_dump` harian ke S3, retensi 30 hari
- **Uji restore minimal 1× sebelum go-live**

---

## 12. Testing Strategy

| Level       | Tool                    | Cakupan                                                 |
| ----------- | ----------------------- | ------------------------------------------------------- |
| Unit        | Vitest                  | hitungHarga, hitungDenda, validasiExtend, parseWIBToUTC |
| Integration | Vitest + testcontainers | cekBentrok, createBooking (race condition)              |
| E2E         | Playwright              | Booking flow lengkap                                    |
| Manual      | Checklist               | 10 skenario US-9.1                                      |

---

# 📋 BACKLOG

Total **~135 story points** (1 pt ≈ 2–4 jam).

## 🏔️ EPIC 1: Foundation (12 pt)

### US-1.1 — Setup project (3 pt)

- [ ] create-next-app TS + Tailwind + App Router
- [ ] Install: prisma, @prisma/client, next-auth@beta, zod, react-hook-form, @hookform/resolvers, sonner, shadcn
- [ ] Setup lib/prisma.ts singleton
- [ ] .env.example lengkap
- [ ] Sentry SDK + test error
- [ ] Deploy hello-world ke Vercel

### US-1.2 — Prisma schema + migration (4 pt)

- [ ] Tulis schema.prisma
- [ ] prisma migrate dev --name init
- [ ] Migration SQL kustom EXCLUDE constraint
- [ ] seed.ts (1 owner, 1 global policy, 3 tipe motor)
- [ ] Verifikasi constraint via test

### US-1.3 — Auth admin (5 pt)

- [ ] Auth.js v5 Credentials provider
- [ ] bcryptjs hashing
- [ ] Middleware protect /admin/*
- [ ] Layout admin + sidebar
- [ ] Logout + session display
- [ ] Server-side role check

## 🏔️ EPIC 2: Armada & Policy (18 pt)

### US-2.1 — CRUD Unit (5 pt)

### US-2.2 — Policy Engine (9 pt)

### US-2.3 — Blackout tanggal (2 pt)

### US-2.4 — Audit log viewer (2 pt)

## 🏔️ EPIC 3: Booking Flow User (28 pt)

### US-3.1 — Katalog & detail (4 pt)

### US-3.2 — Pencarian & kalender (7 pt) ⚠️

### US-3.3 — Kalkulator harga (4 pt) ⚠️ UANG

### US-3.4 — Form booking (7 pt)

### US-3.5 — Halaman sukses (3 pt)

### US-3.6 — Cek riwayat (3 pt)

## 🏔️ EPIC 4: Admin Booking (22 pt)

### US-4.1 — Dashboard (4 pt)

### US-4.2 — Timeline kalender (8 pt) ⚠️ KOMPLEKS

### US-4.3 — Cek cepat (2 pt)

### US-4.4 — Detail & aksi (5 pt)

### US-4.5 — Relokasi (3 pt)

## 🏔️ EPIC 5: Check-out, Denda, Extend (15 pt)

### US-5.1 — Kalkulator denda (4 pt) ⚠️ UANG

### US-5.2 — Flow check-out (5 pt)

### US-5.3 — Flow extend (4 pt)

### US-5.4 — Force majeure (2 pt)

## 🏔️ EPIC 6: Notifikasi & Dokumen (10 pt)

### US-6.1 — Email transaksional (4 pt)

### US-6.2 — Invoice PDF (4 pt)

### US-6.3 — Cron jobs (2 pt)

## 🏔️ EPIC 7: Keamanan & Pelanggan (12 pt)

### US-7.1 — Manajemen pelanggan (4 pt)

### US-7.2 — Upload aman (4 pt)

### US-7.3 — Anti-spam (2 pt)

### US-7.4 — Halaman S&K (2 pt)

## 🏔️ EPIC 8: Laporan & Ops (10 pt)

### US-8.1 — Dashboard owner (4 pt)

### US-8.2 — Export (3 pt)

### US-8.3 — Maintenance & feature flag (3 pt)

## 🏔️ EPIC 9: Pre-Launch (8 pt)

### US-9.1 — Uji E2E & race condition (5 pt) ⚠️ WAJIB

### US-9.2 — Backup otomatis (3 pt)

---

## 📊 Ringkasan

| Epic                    | Points  | Sprint        |
| ----------------------- | ------- | ------------- |
| 1. Foundation           | 12      | S0            |
| 2. Armada & Policy      | 18      | S1            |
| 3. Booking User         | 28      | S2            |
| 4. Admin Booking        | 22      | S3            |
| 5. Check-out & Denda    | 15      | S4            |
| 6. Notifikasi & Dokumen | 10      | S4–S5         |
| 7. Keamanan & Pelanggan | 12      | S5            |
| 8. Laporan & Ops        | 10      | S6            |
| 9. Pre-Launch           | 8       | S6            |
| **Total**               | **135** | **~7 sprint** |

**Estimasi solo full-time**: 7–9 minggu. Part-time: 14–18 minggu.

---

## 🎯 Urutan Eksekusi

### Phase 1 — Fondasi (S0–S1)

`US-1.1 → US-1.2 → US-1.3 → US-2.1 → US-2.2`

### Phase 2 — Bisa Booking (S2)

`US-3.2 → US-3.3 → US-3.4 → US-3.5 → US-3.1`

### Phase 3 — Admin Operasional (S3–S4)

`US-4.1 → US-4.2 → US-4.4 → US-5.1 → US-5.2 → US-5.3`

### Phase 4 — Trust & Security (S5)

`US-6.1 → US-6.2 → US-6.3 → US-7.*`

### Phase 5 — Nilai Tambah (S6)

`US-4.5 → US-5.4 → US-8.* → US-2.3 → US-2.4`

### Phase 6 — Pre-Launch (S6)

`US-9.1 → US-9.2`

---

## ⚠️ Top 5 Task Paling Kritis

| Rank | Task                              | Alasan                          |
| ---- | --------------------------------- | ------------------------------- |
| 1    | US-1.2 EXCLUDE constraint         | Fondasi, salah = double-booking |
| 2    | US-3.3 + US-5.1 Pricing & penalty | Melibatkan uang                 |
| 3    | US-3.4 Booking creation           | Race condition + validasi       |
| 4    | US-5.2 Check-out recalc buffer    | Logika berantai                 |
| 5    | US-2.2 Policy versioning          | Proteksi hukum                  |

---

## ✅ Definition of Done (per task)

- [ ] Acceptance criteria terpenuhi
- [ ] Unit test logika bisnis (coverage > 80%)
- [ ] `tsc --noEmit` lolos, no `any` (kecuali raw SQL)
- [ ] Deploy ke Vercel preview, test mobile
- [ ] No error di Sentry setelah 24 jam
- [ ] Commit message Conventional Commits

---

## 📝 Catatan Akhir

Dokumen siap dieksekusi. Mulai dari US-1.1, kerjakan berurutan. Referensi balik ke Section 4 (Schema), 5 (Arsitektur), 6 (Business Rules) saat coding.

Jangan menambah fitur di luar scope MVP sebelum go-live. Rilis dulu dengan 3–5 unit, jalankan 2–4 minggu, baru iterasi berdasarkan data nyata.

Good luck.
---END---
