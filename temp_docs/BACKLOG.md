# BACKLOG — Sistem Rental Motor Yogyakarta

## 1. Product Goal

**Sistem Rental Motor Yogyakarta** adalah platform rental motor online dengan sistem ketersediaan real-time, kalkulasi harga dan denda otomatis, serta panel admin yang aturannya (tarif, buffer, denda, refund) bisa diedit tanpa coding lewat **Policy Engine** dengan versioning.

Target utama MVP:

- **Zero double-booking** (dijamin constraint database PostgreSQL `EXCLUDE USING gist`, bukan hanya pengecekan di aplikasi).
- Admin dapat **mengecek ketersediaan unit < 5 detik**.
- **Harga dan denda terhitung otomatis** sesuai policy yang berlaku saat booking dibuat (snapshot).

---

## 2. MVP Scope

Scope MVP dirancang untuk **1 developer (solo)** selama **7 sprint (±7–9 minggu full-time, 14–18 minggu part-time)**, dengan total **135 story point** (1 pt ≈ 2–4 jam) dan **180 task**. Rilis awal dengan 3–5 unit, jalankan 2–4 minggu, baru iterasi berdasarkan data nyata.

1. **Foundation & Auth:** project Next.js 15, Prisma + PostgreSQL dengan constraint anti-overlap, login admin 2 role (OWNER, STAFF).
2. **Armada & Policy Engine:** CRUD unit, blackout tanggal, kebijakan tarif/aturan dengan versioning dan audit log.
3. **Booking Publik:** katalog, pencarian ketersediaan + kalender, kalkulator harga hybrid, form booking (KTP/SIM, S&K), halaman sukses, cek riwayat.
4. **Admin Booking:** dashboard "Perlu Tindakan", timeline kalender, cek cepat, konfirmasi DP, pembatalan + refund, serah terima, relokasi.
5. **Check-out, Denda & Extend:** denda otomatis per blok menit, buffer terpotong saat telat, perpanjangan sewa, force majeure.
6. **Notifikasi & Dokumen:** email transaksional, invoice PDF, cron (pending timeout, cleanup file).
7. **Keamanan & Pelanggan:** upload aman, rate limit + Turnstile, blacklist, S&K, retensi dokumen 90 hari.
8. **Laporan, Ops & Produksi:** laporan pendapatan/utilisasi, export CSV, feature flag/maintenance, E2E + race-condition test, backup, go-live.

---

## 3. Tech Stack

| Komponen            | Teknologi / Library                         | Keterangan                                                  |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **Framework**       | Next.js 15 (App Router)                     | RSC, Server Actions, ISR                                    |
| **Language**        | TypeScript 5 (strict)                       | Type safety end-to-end                                      |
| **ORM**             | Prisma 6                                    | Migrations, raw SQL untuk EXCLUDE                           |
| **Database**        | PostgreSQL 16                               | `tstzrange` + `EXCLUDE USING gist` (Neon / Vercel Postgres) |
| **Styling / UI**    | Tailwind CSS 4 + shadcn/ui                  | Utility-first, komponen copy-paste                          |
| **Auth**            | Auth.js v5 (Credentials, JWT)               | Login admin, cookie httpOnly                                |
| **Form & Validasi** | react-hook-form + zod                       | Skema validasi sama di client dan server                    |
| **State / Data**    | RSC + TanStack Query                        | RSC awal, cache client                                      |
| **Email**           | Resend + React Email                        | Template email JSX                                          |
| **PDF**             | @react-pdf/renderer                         | Invoice sebagai komponen React                              |
| **Storage**         | S3-compatible (Wasabi)                      | KTP/SIM privat, signed URL                                  |
| **Cron**            | Vercel Cron                                 | Pending timeout, cleanup file                               |
| **Anti-spam**       | Cloudflare Turnstile + rate limit (Upstash) | Form publik dan endpoint                                    |
| **Monitoring**      | Sentry                                      | Error tracking dan alert                                    |
| **Testing**         | Vitest, testcontainers, Playwright          | Unit, integrasi, E2E                                        |
| **Deploy**          | Vercel (atau VPS + Docker)                  | Preview per PR                                              |

---

## 4. Konteks Proyek untuk AI Agent

Blok di bawah adalah ringkasan PRD beserta keputusan teknis untuk semua temuan di Section 9. **Tempel seluruh blok ini sebagai pesan pertama** ke AI/agent pada setiap sesi baru, lalu tempel **satu task** (judul, meta, Description, dan Acceptance Criteria) dan minta agent mengerjakan HANYA task itu. Bagian bertanda **(ASUMSI)** adalah keputusan yang saya isi karena PRD belum menetapkannya; ubah di sini bila berbeda.

```text
KONTEKS PROYEK: Sistem Rental Motor Yogyakarta (solo developer, MVP)

PERAN KAMU
Senior full-stack engineer. Kerjakan HANYA subtugas yang saya berikan. Jangan menambah fitur di luar
scope. Sebelum menulis kode, baca file yang relevan di repo. Setelah selesai: jalankan `pnpm typecheck`,
`pnpm lint`, `pnpm test`, lalu ringkas file yang diubah, asumsi yang kamu ambil, dan cara memverifikasi.
Bila instruksi bertabrakan dengan kode yang sudah ada, berhenti dan tanyakan, jangan menebak.

STACK
Next.js 15 (App Router, Server Actions) + TypeScript 5 strict + Prisma 6 + PostgreSQL 16 + Tailwind 4
+ shadcn/ui + Auth.js v5 (next-auth@beta, Credentials, JWT) + react-hook-form + zod + TanStack Query
+ Resend/React Email + @react-pdf/renderer + S3-compatible (Wasabi) + Sentry + Vitest + Playwright.
Package manager: pnpm. Deploy: Vercel (Vercel Cron). Jangan memakai MySQL/MongoDB, localStorage untuk
auth, setTimeout untuk timeout bisnis, atau Prisma Studio sebagai panel admin.

STRUKTUR FOLDER (src/)
app/(public)/...            halaman publik: /, /motor/[slug], /booking/[unitId], /booking/sukses/[kode],
                            /cek-booking, /syarat-ketentuan
app/(admin)/admin/...       halaman admin dengan URL /admin/* (WAJIB ada folder "admin" di dalam route
                            group, karena route group saja tidak menambah segmen URL).
                            login/ (tanpa sidebar) dan (panel)/ (layout sidebar) yang berisi: dashboard,
                            timeline, booking/[id], armada, pelanggan, policy, audit, laporan, setting
app/api/...                 auth/[...nextauth], availability, upload, extend, cron/pending-timeout,
                            cron/cleanup-files
components/{ui,booking,admin,shared}/
lib/                        prisma.ts auth.ts auth-guard.ts pricing.ts penalty.ts refund.ts availability.ts
                            policy.ts audit.ts s3.ts email.ts zod-schemas.ts rate-limit.ts utils.ts env.ts
server/actions/  server/queries/   types/index.ts   tests/{unit,integration,e2e}/
Konvensi: Server Action untuk mutasi (API route hanya untuk webhook/cron/endpoint publik); semua input
divalidasi zod di server; fungsi bisnis uang/waktu harus MURNI (tanpa akses DB) agar mudah dites;
penamaan fungsi bisnis Bahasa Indonesia (hitungHarga), infrastruktur Bahasa Inggris (createBooking);
tanpa `any` (kecuali raw SQL yang diberi komentar alasan).

WAKTU & UANG
- Semua Date di aplikasi dan DB = UTC. Semua kolom DateTime di Prisma WAJIB `@db.Timestamptz(3)`
  (default Prisma `timestamp` tanpa zona akan membuat generated column EXCLUDE gagal). Konversi ke WIB
  (Asia/Jakarta, UTC+7) hanya di layer tampilan dan input form (helper formatWIB, parseWIBToUTC).
- Uang = Int Rupiah (tanpa desimal, tanpa float). Pembulatan: Math.round ke Rupiah terdekat.
- Durasi dibulatkan KE ATAS per jam (ceil). Keterlambatan dihitung dalam menit.

MODEL DATA (ringkas; detail lengkap ada di prisma/schema.prisma)
User(role OWNER|STAFF), Unit(platNomor, tipe, slug, status READY|RENTED|MAINTENANCE, deletedAt),
Blackout(unitId, mulai, selesai, alasan), Policy(scope GLOBAL|TYPE|UNIT, scopeKey, version, effectiveFrom,
billingMode, hargaPerJam, hargaHarian, minDurasiJam=12, hargaMinimum?, diskonMingguan(%), diskonBulanan(%),
bufferJam=2, bufferAntarJemput=3, dendaTier(Json, berisi aturan denda per blok menit), graceMenit=15, depositNominal, jamBuka, jamTutup,
biayaLuarJam, pendingTimeoutMenit=120, maxDurasiHari=30, refundH3Persen, refundH1Persen,
refundNoShowPersen, createdBy, changeReason), Customer(noHp unik, ktpUrl, simUrl, isBlacklisted,
lateCount), Booking(kodeBooking, unitId, customerId, mulai, selesai, bufferSampai, denganAntarJemput,
policyVersionId, policySnapshot(Json), hargaDasar, diskon, totalHarga, status, dpNominal, depositNominal,
dikonfirmasiAt, diambilAt, dikembalikanAt), ExtendRequest, PenaltyLog(bookingId unik), AuditLog,
SystemSetting(key, value Json).
Policy TIDAK PERNAH di-update atau dihapus; setiap perubahan = baris baru dengan version+1.
Unit.policyId tidak dipakai di MVP; override per unit memakai Policy scope UNIT (scopeKey = unit.id).

ATURAN BISNIS FINAL
1) Resolusi policy: UNIT (scopeKey=unit.id) > TYPE (scopeKey=unit.tipe) > GLOBAL, ambil version tertinggi
   dengan effectiveFrom <= waktu acuan. Booking menyimpan policyVersionId + policySnapshot lengkap;
   semua perhitungan lanjutan (denda, refund, extend) memakai SNAPSHOT booking, bukan policy terbaru.
2) Harga (billingMode HYBRID), jam = ceil(durasi dalam jam):
   - jam < minDurasiJam           -> minDurasiJam x hargaPerJam
   - minDurasiJam <= jam < 24     -> min(jam x hargaPerJam, hargaHarian)
   - jam >= 24                    -> floor(jam/24) x hargaHarian + min((jam mod 24) x hargaPerJam, hargaHarian)
   HOURLY: max(jam, minDurasiJam) x hargaPerJam. FULL_DAY: ceil(jam/24) x hargaHarian.
   Diskon (persen, tidak kumulatif, ambil yang terbesar): diskonBulanan bila hari >= 30, diskonMingguan
   bila hari >= 7 (hari = floor(jam/24)). diskon = round(hargaDasar x persen/100). total = hargaDasar -
   diskon. Bila hargaMinimum != null: total = max(total, hargaMinimum). Biaya luar jam (biayaLuarJam)
   ditambahkan 1x untuk setiap pengambilan/pengembalian di luar jamBuka-jamTutup (WIB). (ASUMSI)
   Invarian policy: hargaHarian >= minDurasiJam x hargaPerJam.
3) Buffer: bufferSampai = selesai + bufferJam jam; bila denganAntarJemput: selesai + bufferAntarJemput jam.
   Slot yang memblokir (EXCLUDE & cekBentrok): status PENDING, CONFIRMED, ACTIVE, RETURNED, LATE.
   Rentang yang dipakai: [mulai, bufferSampai) (batas atas eksklusif). Blackout dan unit MAINTENANCE/
   deletedAt juga memblokir, dicek di aplikasi.

   BUFFER SAAT CHECK-OUT: KEPUTUSAN FINAL OWNER (18 Nov 2026). Jangan diubah tanpa persetujuan owner.
   dikembalikanAt = jam kembali sebenarnya. sisaBuffer = max(0, bufferSampai - dikembalikanAt).
   Aturan berlaku untuk SEMUA kasus keterlambatan, termasuk yang masih dalam grace.
   - Pulang LEBIH AWAL (dikembalikanAt < selesai):
       bufferSampai = dikembalikanAt + buffer (buffer dari snapshot booking). Slot terbuka lebih cepat.
   - Pulang TEPAT WAKTU (dikembalikanAt == selesai):
       bufferSampai tidak berubah.
   - Pulang TELAT DALAM GRACE (selesai < dikembalikanAt <= selesai + graceMenit):
       bufferSampai TIDAK berubah. Denda Rp 0. lateCount TIDAK bertambah.
   - Pulang TELAT > GRACE (dikembalikanAt > selesai + graceMenit):
       bufferSampai TIDAK berubah / TIDAK diperpanjang (keterlambatan memotong sisa buffer).
       Denda dihitung per blok menit (rule 4). lateCount bertambah 1.
   - Pulang TELAT SAMPAI BUFFER HABIS (dikembalikanAt >= bufferSampai):
       bufferSampai TETAP. sisaBuffer = 0. Check-out tetap BERHASIL (tidak ada pelanggaran EXCLUDE,
       karena bufferSampai tidak pernah naik). Denda tetap dihitung per blok menit.

   PERINGATAN BUFFER TIPIS (keputusan owner, 18 Nov 2026). Konstanta BUFFER_TIPIS_MENIT = 30.
   - Booking berikutnya = booking di unit yang sama berstatus PENDING/CONFIRMED dengan mulai terdekat
     setelah booking ini. EXCLUDE menjamin mulai-nya >= bufferSampai.
   - jedaKeBerikut = mulai booking berikutnya - dikembalikanAt (menit).
   - peringatanBuffer = "KRITIS" bila jedaKeBerikut <= 0 (unit kembali setelah booking berikutnya
     seharusnya mulai); "TIPIS" bila 0 < jedaKeBerikut < 30; null bila jedaKeBerikut >= 30 atau tidak
     ada booking berikutnya.
   - Peringatan hanya informasi untuk admin (dialog check-out, detail booking) + AuditLog
     "booking.buffer_habis" (KRITIS) atau "booking.buffer_tipis" (TIPIS). Check-out TETAP berhasil.
   - Karena jedaKeBerikut >= sisaBuffer, peringatan hanya muncul bila sisaBuffer < 30 menit DAN ada
     booking berikutnya yang mulai pas di ujung buffer.

   Contoh (selesai 14:00, buffer 2 jam, bufferSampai awal 16:00, grace 15 menit, booking berikut B):
     pulang 11:00 -> bufferSampai = 13:00, slot terbuka 13:00, denda Rp 0.
     pulang 14:00 -> bufferSampai = 16:00, sisa buffer 2 jam, denda Rp 0.
     pulang 14:10 -> bufferSampai = 16:00, sisa 1j50m, denda Rp 0 (dalam grace).
     pulang 14:15 -> bufferSampai = 16:00, sisa 1j45m, denda Rp 0 (tepat di batas grace).
     pulang 14:16 -> bufferSampai = 16:00, sisa 1j44m, denda 1 blok (lewat grace).
     pulang 15:00 -> bufferSampai = 16:00, sisa 1 jam, denda 3 blok.
     pulang 15:30, B mulai 16:00 -> sisa 30 menit, jeda 30 -> tanpa peringatan (batas tidak termasuk).
     pulang 15:31, B mulai 16:00 -> sisa 29 menit, jeda 29 -> peringatan TIPIS.
     pulang 15:50, B mulai 18:00 -> sisa 10 menit, jeda 130 -> tanpa peringatan (B masih lama).
     pulang 16:30, B mulai 16:00 -> sisa 0, jeda -30 -> peringatan KRITIS.
   PENTING: bufferSampai tidak pernah diperpanjang saat telat, jadi check-out TIDAK PERNAH gagal karena
   EXCLUDE. Konflik dengan booking berikutnya ditangani lewat peringatan + relokasi (US-4.5), bukan
   lewat constraint database.
4) Denda (dari snapshot), dihitung PER BLOK MENIT agar adil untuk keterlambatan singkat maupun lama.
   telatMenit = max(0, dikembalikanAt - selesai) dalam menit.
   dendaTier JSON (nama kolom dipertahankan, isinya aturan denda):
   {"mode":"PER_BLOK","blokMenit":15,"nominalPerBlok":5000,"hitungSetelahGrace":true,"maksKaliHargaHarianPer24Jam":1}
   - telatMenit <= graceMenit -> Rp 0 (masa toleransi)
   - menitDihitung = hitungSetelahGrace ? telatMenit - graceMenit : telatMenit
   - blok = ceil(menitDihitung / blokMenit); dendaMentah = blok x nominalPerBlok
   - batas = ceil(telatMenit / 1440) x maksKaliHargaHarianPer24Jam x hargaHarian (denda tidak pernah
     melebihi harga sewa harian untuk tiap 24 jam keterlambatan)
   - dendaNominal = min(dendaMentah, batas)
   (ASUMSI: 15 menit per blok, Rp 5.000 per blok = Rp 20.000/jam = 2x hargaPerJam; semua angka diedit
   owner lewat Policy Engine.) Denda berlaku untuk keterlambatan melewati grace, TERPISAH dari buffer.
5) Refund atas DP (dpNominal), dihitung dari waktu pembatalan vs mulai (ASUMSI): batal >= 72 jam sebelum
   mulai -> refundH3Persen; >= 24 jam dan < 72 jam -> refundH1Persen; < 24 jam sebelum mulai atau status
   NO_SHOW -> refundNoShowPersen. refund = floor(dpNominal x persen/100). DP default = 30% dari totalHarga
   dibulatkan ke atas per Rp1.000, persen disimpan di SystemSetting 'dp_persen'. (ASUMSI)
6) State machine booking (transisi di luar tabel ini DITOLAK di server, dan setiap transisi dicatat AuditLog):
   PENDING -> CONFIRMED | CANCELLED
   CONFIRMED -> ACTIVE | CANCELLED | NO_SHOW
   ACTIVE -> RETURNED | LATE
   LATE -> RETURNED
   RETURNED -> COMPLETED   (terminal: COMPLETED, CANCELLED, NO_SHOW)
   ACTIVE menjadi LATE oleh cron bila now > selesai + graceMenit. checkOut menerima ACTIVE atau LATE.
7) Pending timeout: PENDING yang umurnya > pendingTimeoutMenit dibatalkan otomatis oleh cron (CANCELLED).
8) Extend: hargaTambahan = totalBaru - totalLama, dihitung ulang dengan snapshot dari (mulai, selesaiBaru);
   hanya boleh bila tidak bentrok (termasuk buffer) dan total durasi <= maxDurasiHari.
9) kodeBooking: "RMJ-" + 6 karakter Crockford base32 acak (tanpa I, L, O, U), bukan berurutan.
   noHp: normalisasi ke format 08xxxxxxxxxx (regex ^08\d{8,11}$). Plat: huruf besar.
10) Customer dianggap blacklist bila isBlacklisted=true; lateCount >= 3 hanya memunculkan peringatan ke
    admin, bukan blacklist otomatis. (ASUMSI)
11) KTP/SIM: bucket S3 privat, akses hanya via signed URL 5 menit, dihapus otomatis > 90 hari setelah
    upload, lalu kolom ktpUrl/simUrl di-set null.
12) SystemSetting keys: 'whatsapp_number', 'dp_persen', 'maintenance_mode', 'feature_flags'.

PRISMA & DATABASE
- Constraint anti double-booking ada di migration SQL kustom (EXCLUDE USING gist pada kolom generated
  "periode" tstzrange). Kolom itu dideklarasikan di schema.prisma sebagai
  `periode Unsupported("tstzrange")?` supaya Prisma tidak mendeteksi drift. Jangan menghapus atau
  men-generate ulang migration tersebut. Pelanggaran constraint = SQLSTATE 23P01; bentuk error Prisma
  harus diverifikasi lewat test, jangan ditebak.
- Mutasi yang melibatkan lebih dari satu tabel (status + audit log, check-out + denda + buffer) wajib
  dalam satu prisma.$transaction.

KEAMANAN
Password bcryptjs cost 12. Cookie httpOnly + secure + sameSite=lax. Setiap Server Action admin memanggil
requireRole() di baris pertama. File upload: validasi MIME + magic bytes, maks 2 MB. Rate limit untuk
endpoint publik. Turnstile di form publik. Jangan log data pribadi (KTP, SIM, noHp lengkap) ke Sentry.
```

---

## 5. Definition of Done

Sebuah task dianggap **Completed** (`[x]`) apabila memenuhi syarat berikut:

- [ ] Implementasi sesuai PRD dan deskripsi task.
- [ ] Seluruh **Acceptance Criteria** pada task terpenuhi.
- [ ] `pnpm typecheck` lolos, tanpa `any` (kecuali raw SQL yang diberi komentar).
- [ ] Unit test untuk logika bisnis (coverage > 80%; fungsi uang > 90%).
- [ ] Deploy ke Vercel preview dan diuji di mobile (untuk task UI).
- [ ] Tidak ada error baru di Sentry setelah 24 jam.
- [ ] Tidak menyebabkan regression pada fitur yang sudah berjalan.
- [ ] Commit memakai Conventional Commits.
- [ ] Environment variables dan konfigurasi baru didokumentasikan di `.env.example` / README.
- [ ] Status task pada `BACKLOG.md` diperbarui.

---

## 6. Status Legend

- `[ ]` **Not Started:** Task belum mulai dikerjakan.
- `[-]` **In Progress:** Task sedang aktif dikerjakan.
- `[x]` **Completed:** Task selesai dan memenuhi Definition of Done.
- `[!]` **Blocked:** Task terhambat oleh dependency atau kendala teknis.

---

## 7. Priority Legend

- **P0 (Mandatory MVP):** Krusial untuk keberhasilan MVP (anti double-booking, harga/denda, alur booking, keamanan dasar).
- **P1 (Important):** Penting untuk stabilitas, kenyamanan, dan operasional (notifikasi, pelanggan, laporan).
- **P2 (Nice to Have):** Opsional; boleh digeser ke setelah go-live bila jadwal mepet.

---

## 8. Sprint Overview

### Timeline Sprint (estimasi solo full-time)

```text
Sprint 0 = Minggu 1     : Foundation
Sprint 1 = Minggu 2     : Armada & Policy Engine
Sprint 2 = Minggu 3–4   : Booking oleh Pelanggan
Sprint 3 = Minggu 5     : Operasional Admin
Sprint 4 = Minggu 6     : Check-out, Denda, Extend & Email
Sprint 5 = Minggu 7     : Dokumen, Cron & Keamanan
Sprint 6 = Minggu 8–9   : Laporan, Ops & Pre-Launch
```

### Tabel Ringkasan Sprint

| Sprint       | Fokus Utama               | Epic   | Pts | Task | Status          |
| ------------ | ------------------------- | ------ | --- | ---- | --------------- |
| **Sprint 0** | Fondasi                   | E1     | 12  | 30   | [-] In Progress |
| **Sprint 1** | Armada & Policy           | E2     | 18  | 24   | [ ] Not Started |
| **Sprint 2** | Booking oleh Pelanggan    | E3     | 28  | 38   | [ ] Not Started |
| **Sprint 3** | Operasional Admin         | E4     | 22  | 22   | [ ] Not Started |
| **Sprint 4** | Check-out, Denda & Extend | E5, E6 | 19  | 22   | [ ] Not Started |
| **Sprint 5** | Dokumen, Cron & Keamanan  | E6, E7 | 18  | 24   | [ ] Not Started |
| **Sprint 6** | Laporan, Ops & Pre-Launch | E8, E9 | 18  | 20   | [ ] Not Started |

### Progress Summary

| Metric                  | Value    |
| ----------------------- | -------- |
| **Total Tasks**         | 180      |
| **Completed (`[x]`)**   | 1        |
| **In Progress (`[-]`)** | 0        |
| **Blocked (`[!]`)**     | 0        |
| **Not Started (`[ ]`)** | 179      |
| **Progress Percentage** | **0,6%** |

### Task Paling Kritis

| Story                             | Task ID                                          | Sprint       | Alasan                          |
| --------------------------------- | ------------------------------------------------ | ------------ | ------------------------------- |
| US-1.2 EXCLUDE constraint         | `DB-001` s/d `DB-009`                            | Sprint 0     | Fondasi; salah = double-booking |
| US-3.3 + US-5.1 Pricing & penalty | `PRC-001` s/d `PRC-007`, `PEN-001` s/d `PEN-004` | Sprint 2 / 4 | Menyangkut uang                 |
| US-3.4 Booking creation           | `BKG-001` s/d `BKG-011`                          | Sprint 2     | Race condition + validasi       |
| US-5.2 Check-out, buffer & denda  | `CHK-001` s/d `CHK-006`                          | Sprint 4     | Logika berantai                 |
| US-2.2 Policy versioning          | `POL-001` s/d `POL-010`                          | Sprint 1     | Proteksi hukum                  |

---

## 9. Temuan PRD & Keputusan Sebelum Mulai

| #   | Temuan                                                                                                                                                                                                                                                              | Dampak                                            | Tindak lanjut (masuk story)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | Route group `(admin)` **tidak** menambah segmen URL. Folder `(admin)/dashboard` menjadi `/dashboard`, bukan `/admin/dashboard`, padahal middleware & `revalidatePath` memakai `/admin/*`.                                                                           | Middleware tidak melindungi halaman admin         | US-1.3: pakai `(admin)/admin/...` atau folder `admin/` biasa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| N2  | Kolom `periode` (generated column) dan constraint `EXCLUDE` tidak ada di `schema.prisma`. `prisma migrate dev` bisa mendeteksi drift dan mencoba menghapusnya.                                                                                                      | Constraint hilang diam-diam                       | US-1.2: dokumentasikan alur migrasi, tes yang memverifikasi constraint ada, cek di CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| N3  | Penanganan error di `createBooking` memakai `P2010` + `23P01`. Itu kode untuk `$queryRaw`; pada `prisma.booking.create` pelanggaran EXCLUDE bisa muncul sebagai kode berbeda.                                                                                       | Double-booking tidak dipetakan ke `SLOT_BENTROK`  | US-3.4: tulis integration test yang memicu error asli, lalu sesuaikan pengecekan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| N4  | `EXCLUDE` hanya mencakup tabel `Booking`, **tidak** `Blackout` dan `Unit.status = MAINTENANCE`.                                                                                                                                                                     | Unit yang diblokir masih bisa dibooking           | US-2.3 & US-3.4: cek Blackout/MAINTENANCE di aplikasi (atau constraint tambahan)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| N5  | Kebijakan refund (`refundH3Persen`, `refundH1Persen`, `refundNoShowPersen`) ada di skema, tapi **tidak ada rumus/fungsi** di PRD Section 6.                                                                                                                         | `cancelBooking` tidak punya acuan                 | US-4.4: definisikan `lib/refund.ts` + unit test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| N6  | Rumus harga `durasi > 24 jam` dengan sisa jam: sisa `(durasi % 24) × harga_per_jam` bisa lebih mahal dari 1 harian penuh.                                                                                                                                           | Pelanggan bayar lebih dari tarif harian           | US-3.3: putuskan `min(sisa × per_jam, harga_harian)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| N7  | Konflik cron: tabel stack menyebut `pg-boss / Vercel Cron`, bagian 11 memakai Vercel Cron.                                                                                                                                                                          | Ambigu                                            | Putuskan: **Vercel Cron** (sesuai vercel.json). Hobby plan membatasi frekuensi cron, cek plan untuk `*/5`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| N8  | `lateCount` dan `isBlacklisted` ada di `Customer`, tapi tidak ada aturan kapan blacklist otomatis.                                                                                                                                                                  | Fitur setengah jadi                               | US-7.1: tentukan ambang (mis. 3 keterlambatan), atau blacklist manual saja                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| N9  | Retensi KTP/SIM 90 hari, tapi `Customer.ktpUrl/simUrl` hanya menyimpan satu file per pelanggan, dan booking lama masih butuh bukti.                                                                                                                                 | Referensi file rusak setelah cleanup              | US-6.3 / US-7.2: set field jadi `null` saat file dihapus, simpan tanggal upload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| N10 | `bufferAntarJemput` dipakai saat `denganAntarJemput`, tapi `biayaLuarJam`, `jamBuka/jamTutup` tidak dipakai di rumus harga.                                                                                                                                         | Fitur policy tidak terpakai                       | US-3.3: validasi jam operasional & biaya luar jam, atau hapus dari MVP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| N11 | Cek `RETURNED` ikut dalam EXCLUDE; `bufferSampai` ikut berubah saat check-out (US-5.2).                                                                                                                                                                             | Perpanjangan buffer bisa menabrak booking berikut | US-5.2 (KEPUTUSAN FINAL OWNER 18 Nov 2026): (1) Pulang lebih awal → `bufferSampai = dikembalikanAt + buffer` (dimajukan). (2) Tepat waktu → `bufferSampai` tetap. (3) Telat dalam grace (≤ `graceMenit`) → `bufferSampai` tetap, denda Rp 0, `lateCount` tidak bertambah. (4) Telat > grace → `bufferSampai` TETAP (tidak diperpanjang), `sisaBuffer = max(0, bufferSampai − dikembalikanAt)`, denda per blok menit, `lateCount += 1`. (5) Telat sampai buffer habis → check-out tetap SUKSES (tidak melanggar EXCLUDE), denda tetap. (6) Peringatan ke admin bila ada booking berikutnya dan `jedaKeBerikut = mulai booking berikutnya − dikembalikanAt` kurang dari 30 menit: `TIPIS` (0 < jeda < 30) atau `KRITIS` (jeda ≤ 0); lebih dari itu tanpa peringatan (US-4.5 untuk relokasi). |
| N12 | PRD menulis "selalu timestamptz", tetapi `DateTime` Prisma secara default menjadi `timestamp` TANPA zona. Kolom generated `tstzrange(mulai, bufferSampai)` pada migrasi EXCLUDE akan gagal ("generation expression is not immutable") bila kolom bukan timestamptz. | Migrasi EXCLUDE gagal / perilaku zona waktu salah | US-1.2: semua DateTime memakai `@db.Timestamptz(3)`; kolom `periode` dideklarasikan `Unsupported("tstzrange")?` (juga mengatasi N2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## Sprint 0 — Fondasi

**Sprint Goal:** Project terdeploy, database dengan constraint anti double-booking, login admin berfungsi.

---

### Epic 1 — Foundation

**Story dalam sprint ini:** US-1.1 (3 pt); US-1.2 (4 pt); US-1.3 (5 pt).

#### SETUP-001 — `create-next-app` (TypeScript strict, Tailwind 4, App Router, `src/` dir)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** None
- **Status:** [x] Completed

**Description:**

Buat project Next.js 15 bernama "rental-motor-jogja" dengan `pnpm create next-app@latest` (TypeScript, ESLint, Tailwind CSS, App Router, folder src/, alias import "@/*").

- Di tsconfig.json pastikan "strict": true dan tambahkan "noUncheckedIndexedAccess": true.
- Pastikan Tailwind versi 4 terpasang dan halaman default tampil benar.
- Tambahkan script "typecheck": "tsc --noEmit" di package.json.

**Acceptance Criteria:**

- [x] `pnpm dev` berjalan di localhost:3000 dan `pnpm typecheck` lolos tanpa error.
- [x] `pnpm typecheck` dan `pnpm lint` lulus tanpa error (`pnpm test` baru tersedia setelah Vitest dipasang di SETUP-002)

---

#### SETUP-002 — Install dependensi: `prisma`, `@prisma/client`, `next-auth@beta`, `zod`, `react-hook-form`,…

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-001
- **Status:** [x] completed

**Description:*x

Install dependensi dengan pnpm.

- Runtime: @prisma/client, next-auth@beta, zod, react-hook-form, @hookform/resolvers, sonner, bcryptjs, @tanstack/react-query.
- Dev: prisma, vitest, @vitest/coverage-v8, @types/bcryptjs, tsx, prettier, prettier-plugin-tailwindcss.
- Tambahkan script package.json: "test": "vitest run", "test:watch": "vitest", "db:migrate": "prisma migrate dev", "db:deploy": "prisma migrate deploy", "db:seed": "tsx prisma/seed.ts".
- Buat vitest.config.ts (environment node, alias "@" ke ./src, include tests/**/*.test.ts).
- Jangan menulis versi "latest" di package.json; biarkan lockfile yang mengunci versi.

**Acceptance Criteria:**

- [x] `pnpm install` bersih dan `pnpm test` berjalan (boleh "no tests" dulu).
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-003 — Inisialisasi shadcn/ui + komponen dasar (button, input, dialog, sheet, form, table)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-002
- **Status:** [x] Completed

**Description:**

Inisialisasi shadcn/ui (`pnpm dlx shadcn@latest init`, style default, base color neutral, CSS variables) yang kompatibel dengan Tailwind 4.

- Tambahkan komponen: button, input, label, textarea, select, dialog, sheet, form, table, badge, card, tabs, dropdown-menu, calendar, popover, sonner, skeleton, alert.
- Pasang <Toaster /> dari sonner di src/app/layout.tsx.
- Buat halaman sementara /ui-check yang menampilkan setiap komponen untuk cek visual (halaman ini harus dihapus sebelum go-live; beri komentar TODO).

**Acceptance Criteria:**

- [x] Semua komponen tampil tanpa error di console dan `pnpm build` sukses.
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-004 — Buat `lib/prisma.ts` (singleton, aman untuk hot reload)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-003
- **Status:** [x] Completed

**Description:**

Buat src/lib/prisma.ts berisi singleton PrismaClient yang aman untuk hot reload Next.js (simpan instance di globalThis saat NODE_ENV !== "production"). Aktifkan log "error" dan "warn" saja. Ekspor `prisma`.

- Tambahkan komentar singkat mengapa singleton diperlukan.

**Acceptance Criteria:**

- [x] Mengimpor `prisma` dari "@/lib/prisma" di dua file berbeda tidak membuat koneksi ganda saat `pnpm dev` di-reload.
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-005 — Buat struktur folder sesuai PRD Section 3 (`app/(public)`, admin, `lib`, `server/actions`,…

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-004
- **Status:** [x] Completed

**Description:**

Buat struktur folder dan file placeholder sesuai bagian STRUKTUR FOLDER di konteks. Setiap file placeholder cukup berisi `export {}` atau komponen kosong dengan komentar "TODO: US-x.y".

- Penting: halaman admin diletakkan di dalam folder "admin" (bukan hanya route group (admin)) agar URL-nya /admin/*. Halaman panel (dashboard, timeline, armada, dst.) ada di src/app/(admin)/admin/(panel)/<nama>/page.tsx supaya memakai layout sidebar; halaman login di src/app/(admin)/admin/login/page.tsx tanpa sidebar.
- Buat folder tests/{unit,integration,e2e} dan types/index.ts.
- Tambahkan README.md singkat: cara menjalankan, struktur folder, dan konvensi (Server Action, zod, tanpa any, UTC di DB).

**Acceptance Criteria:**

- [x] `pnpm build` sukses dan setiap rute di PRD Section 3 dapat dibuka (halaman kosong tidak masalah).
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-006 — `.env.example` lengkap + validasi env dengan zod (`lib/env.ts`)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-005
- **Status:** [x] Completed

**Description:**

Buat .env.example berisi semua variabel: DATABASE_URL, DIRECT_URL (opsional, untuk Neon pooler), AUTH_SECRET, AUTH_URL, S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM, SENTRY_DSN, CRON_SECRET, TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, NEXT_PUBLIC_BASE_URL. Beri komentar cara membuat secret (`openssl rand -base64 32`, `openssl rand -hex 32`).

- Buat src/lib/env.ts: skema zod yang memvalidasi process.env saat startup (fail fast dengan pesan jelas).
- DATABASE_URL, AUTH_SECRET (min 32 karakter), CRON_SECRET (min 32), NEXT_PUBLIC_BASE_URL selalu wajib.
- Variabel S3, Resend, Turnstile, Sentry boleh opsional di development tetapi wajib di production (NODE_ENV).
- Pisahkan export `serverEnv` dan `publicEnv`.
- Pastikan .env dan .env.local ada di .gitignore.

**Acceptance Criteria:**

- [x] Menjalankan app tanpa DATABASE_URL menampilkan error validasi yang menyebut nama variabelnya.
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-007 — Setup Sentry SDK + endpoint tes error

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-006
- **Status:** [x] Completed

**Description:**

Pasang Sentry untuk Next.js (`pnpm dlx @sentry/wizard@latest -i nextjs`) atau konfigurasi manual: sentry.client.config, sentry.server.config, sentry.edge.config, src/instrumentation.ts, dan wrapper next.config.

- DSN dari env; aktifkan upload source map di build (SENTRY_AUTH_TOKEN hanya di CI/Vercel).
- Tambahkan beforeSend yang menghapus data pribadi (noHp, KTP, SIM, header Authorization/Cookie).
- Buat route /api/debug-sentry yang melempar Error("sentry test"), hanya aktif bila env ENABLE_DEBUG_ROUTES=true (tambahkan ke .env.example).

**Acceptance Criteria:**

- [x] Memanggil /api/debug-sentry di preview memunculkan event di Sentry dengan stack trace yang terbaca.
- [x] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-008 — ESLint + Prettier + `tsc --noEmit` script + commitlint (Conventional Commits)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-007
- **Status:** [ ] Not Started

**Description:**

Siapkan kualitas kode.

- ESLint: next/core-web-vitals + typescript-eslint, dengan aturan @typescript-eslint/no-explicit-any = "error".
- Prettier (+ prettier-plugin-tailwindcss) dan script "lint", "format".
- husky + lint-staged (eslint --fix dan prettier --write pada file staged).
- commitlint dengan @commitlint/config-conventional, dijalankan lewat husky hook commit-msg.
- Workflow GitHub Actions .github/workflows/ci.yml: install pnpm, `pnpm lint`, `pnpm typecheck`, `pnpm test` pada setiap pull request.

**Acceptance Criteria:**

- [ ] Commit dengan pesan "update" ditolak, "chore: setup tooling" diterima, dan CI hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SETUP-009 — Deploy hello-world ke Vercel + database Postgres (Neon/Vercel Postgres)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-008
- **Status:** [ ] Not Started

**Description:**

Deploy hello-world ke Vercel.

- Buat project Vercel dari repo GitHub, aktifkan preview deployment untuk tiap PR.
- Buat database PostgreSQL 16 (Neon atau Vercel Postgres). Bila memakai pooler, tambahkan `directUrl = env("DIRECT_URL")` di datasource schema.prisma untuk migrasi.
- Isi semua env var di Vercel untuk Preview dan Production (nilai rahasia jangan masuk repo).
- Tambahkan "postinstall": "prisma generate" di package.json agar build Vercel membuat Prisma client.

**Acceptance Criteria:**

- [ ] URL produksi/preview menampilkan halaman beranda placeholder dan build Vercel hijau.

---

#### SETUP-010 — Verifikasi: URL preview Vercel hidup, error tes tampil di Sentry

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-009
- **Status:** [ ] Not Started

**Description:**

Verifikasi manual: buka URL preview Vercel (HTTP 200). Dengan ENABLE_DEBUG_ROUTES=true di preview, panggil /api/debug-sentry lalu pastikan eventnya muncul di Sentry dengan stack trace yang terbaca (source map bekerja). Matikan flag setelah tes.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### SETUP-011 — Verifikasi: `pnpm lint`, `pnpm typecheck`, `pnpm test` berjalan hijau

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.1 — Setup project
- **Estimate:** 1h
- **Dependencies:** SETUP-010
- **Status:** [ ] Not Started

**Description:**

Verifikasi: jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test` secara lokal dan pastikan workflow CI GitHub Actions juga hijau di sebuah pull request. Tambahkan minimal satu tes dummy (mis. tests/unit/sanity.test.ts) agar `pnpm test` tidak kosong.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### DB-001 — Salin `schema.prisma` Section 4.1 (User, Unit, Blackout, Policy, Customer, Booking, ExtendRequest,…

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** SETUP-011
- **Status:** [ ] Not Started

**Description:**

Buat prisma/schema.prisma dari PRD Section 4.1 (generator, datasource, enum Role/UnitStatus/PolicyScope/BillingMode/BookingStatus/ExtendStatus, dan model User, Unit, Blackout, Policy, Customer, Booking, ExtendRequest, PenaltyLog, AuditLog, SystemSetting).

- Dua perubahan WAJIB terhadap PRD:
- 1. Tambahkan `@db.Timestamptz(3)` pada SEMUA field DateTime (createdAt, updatedAt, mulai, selesai, bufferSampai, effectiveFrom, deletedAt, dikonfirmasiAt, diambilAt, dikembalikanAt, requestedAt, decidedAt, dsb.). Alasan: tanpa itu Prisma membuat kolom `timestamp` tanpa zona waktu dan generated column tstzrange pada migrasi EXCLUDE gagal (ekspresi tidak immutable).
- 2. Di model Booking tambahkan `periode Unsupported("tstzrange")?` agar Prisma tahu kolom generated itu ada dan tidak mencoba menghapusnya.
- Jalankan `pnpm prisma format` dan `pnpm prisma validate`.

**Acceptance Criteria:**

- [ ] Validate lolos dan semua DateTime bertipe timestamptz.

---

#### DB-002 — `prisma migrate dev --name init`

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-001
- **Status:** [ ] Not Started

**Description:**

Jalankan `pnpm prisma migrate dev --name init` terhadap database development, lalu `pnpm prisma generate`. Periksa file migration.sql yang dihasilkan: pastikan semua kolom waktu bertipe TIMESTAMPTZ(3) dan kolom `periode` ikut terbuat sebagai tipe tstzrange (atau, bila Prisma menolak membuat kolom Unsupported tanpa ekspresi, hapus baris itu dari migrasi init karena akan dibuat di migrasi kustom berikutnya, dan sesuaikan agar tidak terjadi drift).

- Commit folder prisma/migrations.

**Acceptance Criteria:**

- [ ] `pnpm prisma migrate status` menyatakan database up to date.

---

#### DB-003 — Migration kustom `add_booking_exclusion`: `btree_gist`, kolom `periode` generated, constraint…

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-002
- **Status:** [ ] Not Started

**Description:**

Buat migrasi kustom: `pnpm prisma migrate dev --create-only --name add_booking_exclusion`, lalu isi migration.sql dengan:

```text
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking" ADD COLUMN "periode" tstzrange GENERATED ALWAYS AS (tstzrange("mulai", "bufferSampai", '[)')) STORED;
ALTER TABLE "Booking" ADD CONSTRAINT "no_overlap_bookings" EXCLUDE USING gist ("unitId" WITH =, "periode" WITH &&) WHERE ("status" IN ('PENDING','CONFIRMED','ACTIVE','RETURNED','LATE'));
```

- Jangan membuat index "booking_availability_idx" lagi bila @@index([unitId, status, mulai, bufferSampai]) sudah dibuat Prisma (hindari index duplikat). Bila di DB-002 kolom `periode` sudah terbuat, ganti ADD COLUMN dengan penyesuaian yang sesuai.
- Terapkan dengan `pnpm prisma migrate dev`, lalu jalankan lagi `pnpm prisma migrate dev` dan pastikan TIDAK menghasilkan migrasi baru (tanda tidak ada drift).

**Acceptance Criteria:**

- [ ] Constraint no_overlap_bookings ada di pg_constraint dan tidak ada drift.

---

#### DB-004 — Dokumentasikan di README: jangan regenerate migrasi; cara menangani drift (lihat N2)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-003
- **Status:** [ ] Not Started

**Description:**

Tambahkan bagian "Database & Migrasi" di README.md yang menjelaskan: (1) constraint EXCLUDE dan kolom `periode` dibuat lewat migrasi SQL kustom; (2) jangan menjalankan `prisma migrate reset` atau menghapus migrasi tanpa memastikan constraint kembali; (3) cara menambah migrasi baru dengan aman (`--create-only`, cek isi SQL, pastikan tidak ada DROP COLUMN "periode"); (4) perintah `pnpm db:check` untuk memverifikasi constraint (dibuat di DB-007); (5) alasan semua DateTime memakai timestamptz.

**Acceptance Criteria:**

- [ ] Developer baru bisa mengikuti README dari database kosong sampai constraint aktif.

---

#### DB-005 — `seed.ts`: 1 owner, 1 policy GLOBAL, 3 tipe motor (mis. matic, bebek, sport) + beberapa unit

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-004
- **Status:** [ ] Not Started

**Description:**

Buat prisma/seed.ts (dijalankan `pnpm db:seed`, harus idempoten memakai upsert).

- 1 User OWNER: email/nama/password dari env SEED_OWNER_EMAIL, SEED_OWNER_NAME, SEED_OWNER_PASSWORD (hash bcryptjs cost 12); tambahkan ke .env.example.
- 1 Policy GLOBAL version 1: hargaPerJam 10000, hargaHarian 150000, minDurasiJam 12, diskonMingguan 10, diskonBulanan 20, bufferJam 2, bufferAntarJemput 3, graceMenit 15, depositNominal 200000, jamBuka "08:00", jamTutup "20:00", biayaLuarJam 25000, pendingTimeoutMenit 120, maxDurasiHari 30, refundH3Persen 100, refundH1Persen 50, refundNoShowPersen 0, dendaTier sesuai format di konteks, createdBy = id owner, changeReason "Seed awal".
- 3 tipe motor (mis. "Matic 125cc", "Bebek 110cc", "Sport 150cc") dengan 2 unit per tipe (plat contoh, slug unik, status READY).
- SystemSetting: whatsapp_number "6281234567890", dp_persen 30, maintenance_mode false.

**Acceptance Criteria:**

- [ ] `pnpm db:seed` dijalankan dua kali tanpa error dan tanpa data ganda.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### DB-006 — Integration test (testcontainers): dua insert overlap → yang kedua ditolak; booking…

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-005
- **Status:** [ ] Not Started

**Description:**

Buat tests/integration/booking-exclusion.test.ts memakai @testcontainers/postgresql (image postgres:16). Di beforeAll: jalankan container, set DATABASE_URL, jalankan `prisma migrate deploy` (execSync), buat PrismaClient.

- Kasus uji (insert Booking langsung lewat Prisma):
- 1. dua booking unit sama dengan rentang [mulai, bufferSampai) beririsan -> insert kedua ditolak (error 23P01/no_overlap_bookings);
- 2. booking bersebelahan (mulai booking B = bufferSampai booking A tepat) -> diizinkan;
- 3. unit berbeda, waktu sama -> diizinkan;
- 4. booking A berstatus CANCELLED/COMPLETED/NO_SHOW tidak memblokir booking baru;
- 5. mengubah status A dari CANCELLED kembali ke PENDING saat slot sudah terisi -> ditolak;
- 6. UPDATE selesai/bufferSampai yang membuat tumpang tindih -> ditolak.
- Buat helper factory untuk membuat Customer, Unit, Booking minimal.

**Acceptance Criteria:**

- [ ] Semua kasus hijau dan test menampilkan bentuk error asli (log kode error Prisma) untuk dipakai di US-3.4.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### DB-007 — Skrip CI/pre-deploy yang gagal jika constraint `no_overlap_bookings` tidak ada

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1.5h
- **Dependencies:** DB-006
- **Status:** [ ] Not Started

**Description:**

Buat scripts/check-db-constraints.ts (script `pnpm db:check`): koneksi ke DATABASE_URL, query pg_constraint untuk memastikan constraint "no_overlap_bookings" bertipe 'x' (exclusion) ada pada tabel "Booking", dan kolom "periode" ada. Exit code 1 dengan pesan jelas bila hilang.

- Tambahkan ke workflow CI: job yang menyalakan service postgres:16, menjalankan `prisma migrate deploy` lalu `pnpm db:check`. Dokumentasikan agar `pnpm db:check` juga dijalankan terhadap database produksi setelah tiap deploy yang menyentuh migrasi.

**Acceptance Criteria:**

- [ ] Menghapus constraint secara manual membuat script dan CI gagal.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### DB-008 — Verifikasi: Insert paralel pada slot yang sama: tepat satu berhasil

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1h
- **Dependencies:** DB-007
- **Status:** [ ] Not Started

**Description:**

Verifikasi race condition: tulis/jalankan tes yang memanggil 20 insert Booking paralel (Promise.allSettled) untuk unit dan rentang waktu yang sama. Harapan: tepat 1 fulfilled dan 19 rejected dengan error constraint.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### DB-009 — Verifikasi: `prisma migrate deploy` dari database kosong menghasilkan constraint lengkap

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.2 — Prisma schema + migration ⚠️ KRITIS
- **Estimate:** 1h
- **Dependencies:** DB-008
- **Status:** [ ] Not Started

**Description:**

Verifikasi dari nol: buat database kosong, jalankan `pnpm db:deploy` lalu `pnpm db:check` (lolos), lalu `pnpm prisma migrate dev` (tidak membuat migrasi baru / tidak ada drift).

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### AUTH-001 — Auth.js v5 Credentials provider (`lib/auth.ts`, route `api/auth/[...nextauth]`)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** DB-009
- **Status:** [ ] Not Started

**Description:**

Implementasikan Auth.js v5 di src/lib/auth.ts.

- Credentials provider (email, password). authorize(): validasi zod (email valid, password string), cari User by email, bandingkan password dengan bcryptjs.compare. Bila user tidak ada, tetap jalankan compare terhadap hash dummy agar waktu respons seragam. Kembalikan {id, email, name: nama, role}.
- session: { strategy: "jwt", maxAge: 8 jam }. Callback jwt dan session menyalin id dan role ke token dan session.user.
- pages: { signIn: "/admin/login" }.
- Tambahkan src/types/next-auth.d.ts untuk memperluas tipe Session.user (id, role: "OWNER" | "STAFF") dan JWT.
- Ekspor { handlers, auth, signIn, signOut } dan buat src/app/api/auth/[...nextauth]/route.ts yang mengekspor GET dan POST dari handlers.
- Gunakan AUTH_SECRET dari env; trustHost sesuai AUTH_URL.

**Acceptance Criteria:**

- [ ] Login dengan akun seed berhasil dan session.user.role terbaca di Server Component.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-002 — Hash password dengan bcryptjs cost 12; script buat user owner

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-001
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/password.ts: hashPassword(plain) dan verifyPassword(plain, hash) dengan bcryptjs cost 12. Tolak password < 12 karakter di hashPassword.

- Buat scripts/create-user.ts (`pnpm tsx scripts/create-user.ts --email ... --nama ... --role OWNER|STAFF`, password dibaca dari prompt interaktif atau env) untuk membuat user admin tanpa lewat seed.
- Tulis unit test: hash berbeda untuk password sama (salt), verify benar/salah, tolak password pendek.

**Acceptance Criteria:**

- [ ] User baru bisa dibuat via script dan login.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-003 — Middleware proteksi `/admin/*` (perbaiki struktur route sesuai N1)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-002
- **Status:** [ ] Not Started

**Description:**

Buat src/middleware.ts dengan matcher "/admin/:path*" yang memakai auth() dari Auth.js (hanya cek JWT, jangan memanggil Prisma/bcrypt di edge).

- /admin/login dikecualikan; user yang sudah login dan membuka /admin/login diarahkan ke /admin/dashboard.
- Belum login -> redirect ke /admin/login?callbackUrl=<path asal> (validasi callbackUrl hanya boleh path relatif yang diawali /admin).
- Pastikan struktur folder memakai src/app/(admin)/admin/... sehingga URL benar-benar /admin/*.
- Tambahkan juga pengecekan sesi di layout admin (defense in depth).

**Acceptance Criteria:**

- [ ] Akses langsung /admin/dashboard tanpa login selalu redirect, termasuk untuk path bersarang.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-004 — Layout admin + sidebar (navigasi sesuai menu PRD 7.2)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-003
- **Status:** [ ] Not Started

**Description:**

Buat layout admin di src/app/(admin)/admin/(panel)/layout.tsx (server component) atau struktur setara yang TIDAK membungkus halaman login. Layout memanggil auth(), redirect bila tidak ada sesi, dan merender sidebar.

- Sidebar responsif (Sheet di mobile, tetap di desktop) dengan menu: Dashboard, Timeline, Armada, Pelanggan, Policy, Audit Log, Laporan, Setting. Menu Policy, Audit Log, Laporan, Setting hanya untuk OWNER.
- Highlight menu aktif (usePathname di komponen client terpisah).
- Buat halaman /admin/dashboard placeholder dan halaman login (form email/password dengan react-hook-form + zod, tampilkan error "Email atau password salah" generik, toast sonner).
- Tap target minimal 44x44 px untuk mobile.

**Acceptance Criteria:**

- [ ] Login lalu navigasi antar menu berjalan di desktop dan mobile.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-005 — Logout + tampilan sesi (nama, role)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-004
- **Status:** [ ] Not Started

**Description:**

Tambahkan logout dan tampilan sesi di sidebar/header: nama user, badge role, dan tombol "Keluar" yang memanggil Server Action `signOut({ redirectTo: "/admin/login" })`.

**Acceptance Criteria:**

- [ ] Setelah logout, tombol Back browser tidak membuka halaman admin tanpa login.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-006 — Helper `requireRole("OWNER" | "STAFF")` untuk Server Action

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-005
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/auth-guard.ts: `requireUser()` (mengembalikan user sesi atau redirect/throw) dan `requireRole(...roles)` (throw error terketik `ForbiddenError` bila role tidak cocok; pada Server Action kembalikan {ok:false,error:"FORBIDDEN"}). Dokumentasikan bahwa SETIAP Server Action admin wajib memanggilnya di baris pertama.

**Acceptance Criteria:**

- [ ] Helper dipakai di contoh action dan bisa dites dengan mock auth().
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-007 — Cookie httpOnly, secure, sameSite=lax; rate limit login

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-006
- **Status:** [ ] Not Started

**Description:**

Kunci konfigurasi sesi dan batasi percobaan login.

- Pastikan cookie sesi httpOnly, secure di production, sameSite "lax" (set eksplisit di konfigurasi Auth.js).
- Buat src/lib/rate-limit.ts: gunakan @upstash/ratelimit bila UPSTASH_REDIS_REST_URL tersedia, fallback ke Map in-memory (catat di komentar bahwa fallback tidak efektif di serverless). API: `rateLimit(key, {limit, windowSec})` -> {ok, remaining, resetAt}.
- Terapkan di proses login: 5 percobaan per 15 menit per kombinasi email+IP; pesan "Terlalu banyak percobaan, coba lagi nanti".

**Acceptance Criteria:**

- [ ] Percobaan ke-6 dalam 15 menit ditolak walau password benar.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-008 — Unit test helper role

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1.5h
- **Dependencies:** AUTH-007
- **Status:** [ ] Not Started

**Description:**

Tulis unit test Vitest: (1) requireRole mengizinkan OWNER/STAFF sesuai argumen dan menolak role lain dan sesi kosong; (2) verifyPassword; (3) rateLimit fallback in-memory (limit tercapai, reset setelah window, key berbeda terpisah). Gunakan fake timers untuk window.

**Acceptance Criteria:**

- [ ] Semua tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUTH-009 — Verifikasi: Akses `/admin/*` tanpa login → redirect ke login

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1h
- **Dependencies:** AUTH-008
- **Status:** [ ] Not Started

**Description:**

Verifikasi manual: tanpa login buka /admin/dashboard dan /admin/armada -> redirect ke /admin/login; setelah login kembali ke halaman tujuan semula.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### AUTH-010 — Verifikasi: STAFF tidak bisa membuka halaman/aksi khusus OWNER (mis. policy, laporan)

- **Priority:** P0
- **Sprint:** Sprint 0
- **Story:** US-1.3 — Auth admin
- **Estimate:** 1h
- **Dependencies:** AUTH-009
- **Status:** [ ] Not Started

**Description:**

Verifikasi role: login sebagai STAFF, buka /admin/policy dan panggil Server Action khusus OWNER -> ditolak (redirect/FORBIDDEN), menu OWNER tidak tampil. Login sebagai OWNER -> semua bisa diakses.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

## Sprint 1 — Armada & Policy

**Sprint Goal:** Owner bisa mengelola unit, tarif/aturan (versioned), blackout, dan melihat audit log.

---

### Epic 2 — Armada & Policy

**Story dalam sprint ini:** US-2.1 (5 pt); US-2.2 (9 pt); US-2.3 (2 pt); US-2.4 (2 pt).

#### FLEET-001 — Query + tabel daftar unit (filter status, tipe, pencarian plat)

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** AUTH-010
- **Status:** [ ] Not Started

**Description:**

Buat daftar unit di /admin/armada (Server Component).

- src/server/queries/unit.ts: `listUnits({ status?, tipe?, q?, page })` — exclude unit dengan deletedAt != null, pencarian `q` ilike pada platNomor dan tipe, urut createdAt desc, 20 item per halaman, kembalikan {items, total, page, pageCount}.
- Filter lewat searchParams (status, tipe, q, page) sehingga bisa di-bookmark.
- Tabel shadcn: kolom Plat, Tipe, Status (Badge berwarna), Slug, Aksi (Edit, Ubah Status, Blackout, Hapus).
- Tampilkan empty state dan skeleton loading (loading.tsx).

**Acceptance Criteria:**

- [ ] Filter dan pagination bekerja dengan data seed.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-002 — Form tambah/ubah unit (plat, tipe, slug otomatis, policy opsional) dengan zod

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** FLEET-001
- **Status:** [ ] Not Started

**Description:**

Buat form tambah/ubah unit.

- Di src/lib/zod-schemas.ts tambahkan `unitSchema`: platNomor (trim, uppercase, regex /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/), tipe (2-50 karakter), slug opsional (otomatis dari tipe+plat dengan slugify bila kosong; hanya a-z0-9 dan "-").
- Komponen src/components/admin/UnitFormDialog.tsx (shadcn Dialog) dengan react-hook-form + zodResolver(unitSchema), mode create dan edit, menampilkan error per field dan error dari server.
- Gunakan schema yang SAMA di client dan server.

**Acceptance Criteria:**

- [ ] Validasi tampil di UI untuk plat salah format dan tipe kosong.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-003 — Action `upsertUnit` + validasi unik plat & slug

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** FLEET-002
- **Status:** [ ] Not Started

**Description:**

Buat Server Action `upsertUnit` di src/server/actions/unit.ts ("use server").

- Baris pertama requireRole("OWNER") untuk create/edit data unit.
- Parse input dengan unitSchema; bila id ada -> update, bila tidak -> create (status awal READY).
- Tangkap Prisma P2002 pada platNomor/slug dan kembalikan {ok:false, error:"PLAT_SUDAH_ADA" | "SLUG_SUDAH_ADA"}; return {ok:true, unit} bila sukses.
- revalidatePath("/admin/armada").
- Tulis AuditLog (lihat FLEET-006).

**Acceptance Criteria:**

- [ ] Tambah/edit berhasil, duplikat plat menampilkan pesan yang jelas.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-004 — Ubah status `READY / RENTED / MAINTENANCE`

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** FLEET-003
- **Status:** [ ] Not Started

**Description:**

Buat Server Action `setUnitStatus(unitId, status, { force? })`.

- requireRole("OWNER","STAFF").
- Hanya izinkan manual READY <-> MAINTENANCE. Status RENTED hanya diubah otomatis oleh proses serah-terima/check-out (tolak perubahan manual ke atau dari RENTED dengan error "STATUS_OTOMATIS").
- Tolak MAINTENANCE bila ada booking ACTIVE/LATE di unit itu.
- Bila ada booking CONFIRMED/PENDING mendatang, kembalikan {ok:false, error:"ADA_BOOKING_MENDATANG", bookings:[kode...]} kecuali force=true (UI menampilkan dialog konfirmasi).
- Audit log "unit.status".

**Acceptance Criteria:**

- [ ] Aturan di atas teruji lewat unit/integration test sederhana.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-005 — Soft delete (`deletedAt`) dan larangan hapus unit dengan booking aktif/mendatang

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** FLEET-004
- **Status:** [ ] Not Started

**Description:**

Buat Server Action `softDeleteUnit(unitId)` dan `restoreUnit(unitId)` (OWNER).

- Tolak hapus bila ada booking berstatus PENDING/CONFIRMED/ACTIVE/RETURNED/LATE dengan bufferSampai > sekarang; kembalikan daftar kode booking.
- Hapus = set deletedAt = now (tidak ada DELETE fisik). Restore = deletedAt null.
- Pastikan semua query publik dan admin (listUnits, katalog, availability) mengecualikan deletedAt != null; tambahkan helper `activeUnitWhere` di server/queries/unit.ts agar konsisten.
- Audit log "unit.delete"/"unit.restore".

**Acceptance Criteria:**

- [ ] Unit terhapus hilang dari katalog tapi riwayat booking-nya tetap terbaca.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-006 — Audit log untuk perubahan unit

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 2.5h
- **Dependencies:** FLEET-005
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/audit.ts: `writeAudit(tx, { actorType: "USER"|"SYSTEM"|"CUSTOMER", actorId, action, entityId, before, after })` yang menulis ke AuditLog memakai klien transaksi (`tx` bertipe Prisma.TransactionClient atau prisma) agar bisa dipanggil di dalam $transaction yang sama dengan mutasinya.

- Pakai di semua action unit dengan action name: "unit.create", "unit.update", "unit.status", "unit.delete", "unit.restore"; `before`/`after` berisi field relevan saja (tanpa data sensitif).

**Acceptance Criteria:**

- [ ] Setiap mutasi unit menghasilkan 1 baris AuditLog dan gagalnya mutasi tidak meninggalkan baris audit.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FLEET-007 — Verifikasi: Unit yang di-soft-delete tidak tampil di katalog publik tetapi riwayat booking tetap utuh

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.1 — CRUD Unit
- **Estimate:** 1h
- **Dependencies:** FLEET-006
- **Status:** [ ] Not Started

**Description:**

Verifikasi soft delete: buat unit uji dengan satu booking COMPLETED, hapus unit lewat softDeleteUnit. Unit tidak muncul di katalog publik (/ dan /motor/[slug]), di hasil /api/availability, maupun di daftar /admin/armada, tetapi booking lama tetap terbaca di halaman detail booking dan laporan. Restore mengembalikan unit ke daftar.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### POL-001 — `lib/policy.ts::resolvePolicy(unit, at)`: prioritas UNIT → TYPE → GLOBAL, ambil versi dengan…

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** FLEET-007
- **Status:** [ ] Not Started

**Description:**

Implementasikan src/lib/policy.ts::resolvePolicy(unit, at = new Date()) sesuai aturan 1 di konteks.

- Parameter unit minimal {id, tipe}.
- Cari secara berurutan: Policy scope UNIT (scopeKey = unit.id), scope TYPE (scopeKey = unit.tipe), scope GLOBAL (scopeKey null). Untuk tiap scope ambil version tertinggi dengan effectiveFrom <= at; pakai hasil pertama yang ditemukan.
- Lempar error jelas bila GLOBAL pun tidak ada.
- Ekspor tipe `PolicyData` (Policy tanpa relasi) dan fungsi murni `pickPolicy(candidates, unit, at)` yang dipakai resolvePolicy agar mudah dites tanpa DB.
- Unit.policyId diabaikan (beri komentar).

**Acceptance Criteria:**

- [ ] Fungsi mengembalikan policy yang benar untuk skenario prioritas di POL-008.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-002 — Zod schema `dendaTier` (blok menit, nominal per blok, batas harian) + validasi semua field policy…

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-001
- **Status:** [ ] Not Started

**Description:**

Tambahkan di src/lib/zod-schemas.ts: `dendaTierSchema` dan `policySchema`.

- dendaTierSchema: { mode: literal "PER_BLOK", blokMenit: int 1-120, nominalPerBlok: int >= 0 (Rupiah), hitungSetelahGrace: boolean, maksKaliHargaHarianPer24Jam: number 0.5-5 }. Refine: nominalPerBlok x (60/blokMenit) tidak boleh nol bila denda diaktifkan; peringatan (bukan error) bila denda per jam < hargaPerJam.
- policySchema: semua field Policy yang bisa diedit. Aturan: hargaPerJam/hargaHarian int > 0; hargaHarian >= minDurasiJam x hargaPerJam; minDurasiJam 1-24; diskon persen 0-100 (int); bufferJam & bufferAntarJemput 0-24; graceMenit 0-120; depositNominal >= 0; jamBuka/jamTutup format HH:mm dan jamBuka < jamTutup; pendingTimeoutMenit 5-1440; maxDurasiHari 1-90; refund persen 0-100; hargaMinimum null atau int >= 0; changeReason min 5 karakter.
- Pesan error dalam Bahasa Indonesia per field.

**Acceptance Criteria:**

- [ ] Unit test schema untuk kasus valid dan tiap pelanggaran lolos.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-003 — Action `upsertPolicy`: selalu membuat **versi baru**, tidak mengubah versi lama; wajib…

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-002
- **Status:** [ ] Not Started

**Description:**

Buat Server Action `upsertPolicy` di src/server/actions/policy.ts.

- requireRole("OWNER") di baris pertama; input: scope, scopeKey (wajib untuk TYPE/UNIT, null untuk GLOBAL), nilai policy, changeReason, effectiveFrom opsional (default sekarang; boleh masa depan, tidak boleh masa lalu).
- Dalam satu prisma.$transaction: ambil max(version) untuk (scope, scopeKey), insert baris BARU dengan version+1 dan createdBy = id user, tulis AuditLog (POL-007). JANGAN pernah update/delete baris Policy yang sudah ada.
- Tangani balapan dua owner sekaligus lewat constraint @@unique([scope, scopeKey, version]) (retry satu kali bila P2002).
- revalidatePath("/admin/policy").

**Acceptance Criteria:**

- [ ] Dua kali simpan menghasilkan version 1 dan 2 dan baris lama tidak berubah.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-004 — UI form policy (per scope: global/tipe/unit) + pratinjau simulasi harga dan denda

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-003
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/policy (OWNER) dengan tab Global / Per Tipe / Per Unit.

- Tampilkan policy efektif saat ini dan form edit (react-hook-form + policySchema) yang mengelompokkan field: Tarif, Diskon, Buffer, Denda (editor dendaTier: blok menit, nominal per blok, hitung setelah grace, batas per 24 jam), Operasional (jam buka/tutup, biaya luar jam), Refund & DP, Batas (timeout, maxDurasiHari).
- Field changeReason wajib dan tombol "Simpan sebagai versi baru".
- Panel "Simulasi": input mulai/selesai (untuk harga) dan menit keterlambatan (untuk denda), memanggil hitungHarga/hitungDenda dari lib/pricing.ts dan lib/penalty.ts. Bila kedua fungsi belum ada saat subtugas ini dikerjakan, buat panel di balik konstanta SIMULASI_AKTIF = false dan aktifkan setelah US-3.3 dan US-5.1 selesai; sisa form tetap harus selesai dan berfungsi.

**Acceptance Criteria:**

- [ ] Owner bisa mengubah tarif global dan melihat versi baru muncul.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-005 — Riwayat versi policy + diff antar versi

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-004
- **Status:** [ ] Not Started

**Description:**

Buat tampilan riwayat versi policy di halaman yang sama: tabel semua versi untuk scope+scopeKey terpilih (version, effectiveFrom, pembuat, changeReason, badge "Aktif" untuk versi yang sedang berlaku) dan tombol "Bandingkan" yang menampilkan diff field-demi-field antara dua versi (util `diffObjects(a, b)` di lib/utils.ts yang mengembalikan [{field, dari, ke}]; abaikan id/createdAt).

**Acceptance Criteria:**

- [ ] Membandingkan versi 1 dan 2 menampilkan hanya field yang berubah.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-006 — Pastikan booking menyimpan `policyVersionId` dan `policySnapshot` (tidak berubah walau policy diperbarui)

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-005
- **Status:** [ ] Not Started

**Description:**

Pastikan perhitungan lanjutan selalu memakai snapshot booking.

- Di src/lib/policy.ts tambahkan `toSnapshot(policy): PolicySnapshot` (menghapus field internal, mengubah Date menjadi string ISO, memastikan dendaTier tervalidasi) dan `fromSnapshot(json): PolicyData` (parse + validasi dengan zod, kembalikan objek bertipe, tanpa `as any`).
- Dokumentasikan di komentar bahwa createBooking menyimpan policyVersionId = policy.id dan policySnapshot = toSnapshot(policy), dan bahwa hitungDenda/refund/extend wajib memakai fromSnapshot(booking.policySnapshot).
- Unit test round-trip toSnapshot -> fromSnapshot.

**Acceptance Criteria:**

- [ ] Round-trip menghasilkan nilai yang identik.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-007 — Audit log `before/after` untuk tiap perubahan

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-006
- **Status:** [ ] Not Started

**Description:**

Pastikan setiap perubahan policy tercatat di AuditLog dalam transaksi yang sama dengan insert versi baru: action "policy.create_version", entityId = id policy baru, before = ringkasan versi sebelumnya (null untuk versi 1), after = versi baru, ditambah changeReason. Tidak boleh ada data rahasia di JSON.

- Tulis tes integrasi: simpan policy -> ada tepat 1 baris AuditLog dengan before/after benar; bila transaksi gagal (mis. validasi) tidak ada baris audit.

**Acceptance Criteria:**

- [ ] Tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-008 — Unit test `resolvePolicy` (prioritas, tanggal efektif)

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 3h
- **Dependencies:** POL-007
- **Status:** [ ] Not Started

**Description:**

Tulis unit test untuk pickPolicy/resolvePolicy (tests/unit/policy.test.ts) dengan data in-memory: (1) hanya GLOBAL -> GLOBAL; (2) ada TYPE -> TYPE menang atas GLOBAL; (3) ada UNIT -> UNIT menang atas TYPE; (4) beberapa versi -> versi tertinggi yang effectiveFrom <= at; (5) versi masa depan diabaikan sebelum waktunya dan dipakai setelahnya; (6) tanpa GLOBAL -> error; (7) scopeKey tidak cocok diabaikan.

**Acceptance Criteria:**

- [ ] Semua kasus hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### POL-009 — Verifikasi: Mengubah tarif tidak mengubah total booking yang sudah dibuat

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 1h
- **Dependencies:** POL-008
- **Status:** [ ] Not Started

**Description:**

Verifikasi proteksi harga lama: buat booking dummy (lewat seed/tes) dengan policySnapshot versi 1, simpan policy versi 2 dengan tarif berbeda, lalu hitung ulang dari fromSnapshot(booking.policySnapshot). Total harus sama dengan nilai tersimpan.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### POL-010 — Verifikasi: Policy tidak valid ditolak dengan pesan jelas

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.2 — Policy Engine ⚠️
- **Estimate:** 1h
- **Dependencies:** POL-009
- **Status:** [ ] Not Started

**Description:**

Verifikasi UI: kirim form policy dengan jamBuka > jamTutup, persen 150, blokMenit 0, nominalPerBlok negatif, dan changeReason kosong. Setiap pelanggaran ditolak dengan pesan field-level yang jelas dan tidak ada versi baru yang tersimpan.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### BLK-001 — Form + daftar blackout per unit (mulai, selesai, alasan)

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.3 — Blackout tanggal
- **Estimate:** 1.5h
- **Dependencies:** FLEET-007
- **Status:** [ ] Not Started

**Description:**

Buat UI blackout per unit.

- Dari baris unit di /admin/armada, tombol "Blackout" membuka Sheet berisi daftar blackout unit (mendatang dan lampau, urut mulai desc) dan form tambah: mulai, selesai (input datetime-local dalam WIB, dikonversi dengan parseWIBToUTC), alasan.
- Tombol hapus blackout (konfirmasi) untuk blackout yang belum dimulai.
- Tampilkan waktu dengan formatWIB.
- Bila helper waktu belum ada, buat dulu di src/lib/utils.ts: WIB, formatWIB, parseWIBToUTC, toWIBInput.

**Acceptance Criteria:**

- [ ] Blackout tampil di daftar setelah disimpan.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BLK-002 — Action `upsertBlackout` + tolak jika bentrok dengan booking aktif

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.3 — Blackout tanggal
- **Estimate:** 1.5h
- **Dependencies:** BLK-001
- **Status:** [ ] Not Started

**Description:**

Buat Server Action `upsertBlackout` dan `deleteBlackout` di server/actions/unit.ts.

- requireRole("OWNER","STAFF"); zod: selesai > mulai, alasan min 3 karakter, rentang maks 365 hari.
- Tolak bila rentang beririsan dengan booking aktif (PENDING/CONFIRMED/ACTIVE/RETURNED/LATE) pada unit itu, memakai rentang [mulai, bufferSampai); kembalikan {ok:false, error:"BENTROK_BOOKING", bookings:[{kode, mulai, selesai}]}.
- Tolak blackout yang tumpang tindih dengan blackout lain (atau gabungkan) agar data bersih.
- Audit log "blackout.create"/"blackout.delete"; revalidatePath("/admin/armada").

**Acceptance Criteria:**

- [ ] Skenario bentrok mengembalikan daftar booking penyebabnya.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BLK-003 — Integrasi ke `cekBentrok` dan kalender publik (tanggal ter-disable) — lihat N4

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.3 — Blackout tanggal
- **Estimate:** 1.5h
- **Dependencies:** BLK-002
- **Status:** [ ] Not Started

**Description:**

Integrasikan blackout ke pengecekan ketersediaan di src/lib/availability.ts.

- Jika file belum ada, buat dengan `cekBentrok(unitId, mulai, bufferSampai, opts?)` sesuai PRD 5.2 (raw query tstzrange && untuk status PENDING, CONFIRMED, ACTIVE, RETURNED, LATE).
- Tambahkan pengecekan Blackout: bentrok bila blackout.mulai < bufferSampai AND blackout.selesai > mulai. Tambahkan pengecekan Unit.status = MAINTENANCE atau deletedAt != null.
- Kembalikan objek {bentrok: boolean, alasan: "BOOKING" | "BLACKOUT" | "MAINTENANCE" | "UNIT_TIDAK_AKTIF" | null}.
- Buat juga `getBlockedRanges(unitId, from, to)` yang mengembalikan gabungan rentang booking+buffer dan blackout untuk kalender.

**Acceptance Criteria:**

- [ ] Tes integrasi memverifikasi semua alasan.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BLK-004 — Test: booking pada rentang blackout ditolak

- **Priority:** P0
- **Sprint:** Sprint 1
- **Story:** US-2.3 — Blackout tanggal
- **Estimate:** 1.5h
- **Dependencies:** BLK-003
- **Status:** [ ] Not Started

**Description:**

Tulis tes integrasi (Vitest + testcontainers) untuk blackout: (1) booking pada rentang yang tumpang tindih blackout -> cekBentrok {bentrok:true, alasan:"BLACKOUT"}; (2) tepat setelah blackout.selesai -> tidak bentrok; (3) membuat blackout di atas booking aktif ditolak oleh upsertBlackout; (4) unit MAINTENANCE selalu bentrok.

**Acceptance Criteria:**

- [ ] Semua hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUDIT-001 — Halaman daftar audit log (filter entitas, aksi, rentang tanggal; pagination)

- **Priority:** P1
- **Sprint:** Sprint 1
- **Story:** US-2.4 — Audit log viewer
- **Estimate:** 2h
- **Dependencies:** FLEET-007
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/audit (OWNER saja) yang menampilkan AuditLog.

- Query di server/queries/audit.ts dengan filter: action (select), entityId (text), actorId, rentang tanggal (WIB), pagination 20 per halaman (cursor atau offset), urut createdAt desc. Pakai index yang ada (entityId, action+createdAt).
- Filter lewat searchParams; tampilkan waktu dengan formatWIB, nama aktor (join User bila actorType USER).

**Acceptance Criteria:**

- [ ] Filter dan pagination bekerja dengan data hasil aksi unit/policy.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUDIT-002 — Tampilan diff JSON `before/after`

- **Priority:** P1
- **Sprint:** Sprint 1
- **Story:** US-2.4 — Audit log viewer
- **Estimate:** 2h
- **Dependencies:** AUDIT-001
- **Status:** [ ] Not Started

**Description:**

Buat komponen src/components/admin/AuditDiff.tsx yang menampilkan perbandingan before/after JSON sebagai tabel (Field, Sebelum, Sesudah) hanya untuk key yang berubah; nilai objek bertingkat di-flatten dengan dot-notation; sediakan tombol "Lihat JSON mentah" (collapse). Dipakai di baris detail pada halaman audit.

**Acceptance Criteria:**

- [ ] Diff versi policy tampil rapi dan before null (create) menampilkan semua field sebagai baru.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AUDIT-003 — Hanya OWNER yang dapat mengakses

- **Priority:** P1
- **Sprint:** Sprint 1
- **Story:** US-2.4 — Audit log viewer
- **Estimate:** 2h
- **Dependencies:** AUDIT-002
- **Status:** [ ] Not Started

**Description:**

Batasi akses audit hanya untuk OWNER: requireRole("OWNER") di page dan query, menu sidebar disembunyikan untuk STAFF. Tulis tes yang memastikan STAFF mendapat redirect/FORBIDDEN dan OWNER bisa membuka.

**Acceptance Criteria:**

- [ ] Tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

## Sprint 2 — Booking oleh Pelanggan

**Sprint Goal:** Pelanggan bisa mencari, menghitung harga, dan membuat booking tanpa bisa double-booking.

---

### Epic 3 — Booking Flow User

**Story dalam sprint ini:** US-3.2 (7 pt); US-3.3 (4 pt); US-3.4 (7 pt); US-3.5 (3 pt); US-3.1 (4 pt); US-3.6 (3 pt).

#### AVL-001 — `lib/availability.ts::cekBentrok` (sesuai Section 5.2) + gabungkan Blackout & status MAINTENANCE

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** POL-010, BLK-004
- **Status:** [ ] Not Started

**Description:**

Finalisasi src/lib/availability.ts::cekBentrok(unitId, mulai, bufferSampai, opts?: { excludeBookingId?: string }) (lanjutan dari BLK-003 bila sudah ada).

- Raw query lewat prisma.$queryRaw dengan Prisma.sql (parameterized, cast ::timestamptz): SELECT EXISTS(...) pada Booking dengan status IN ('PENDING','CONFIRMED','ACTIVE','RETURNED','LATE') dan tstzrange("mulai","bufferSampai",'[)') && tstzrange($mulai,$bufferSampai,'[)'); abaikan booking dengan id = excludeBookingId (dipakai untuk extend/relokasi).
- Tambahkan cek Blackout, Unit.status MAINTENANCE, dan deletedAt (sesuai BLK-003). Hasil: {bentrok, alasan}.
- Tambahkan komentar bahwa cekBentrok hanya untuk pre-check/UX; yang menjamin keamanan data adalah EXCLUDE constraint.

**Acceptance Criteria:**

- [ ] Tes integrasi menutup kasus batas [) (booking berakhir tepat saat booking baru mulai = tidak bentrok).
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-002 — `POST /api/availability` (input zod; `p95 < 300 ms`), rate limit

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-001
- **Status:** [ ] Not Started

**Description:**

Buat route handler src/app/api/availability/route.ts (POST).

- Input zod: { mulai, selesai (ISO), denganAntarJemput?: boolean, tipe?: string, unitId?: string, mode?: "unit" | "kalender", bulan?: "YYYY-MM" }.
- Validasi: selesai > mulai, mulai >= sekarang, durasi <= maxDurasiHari (dari policy). Rate limit 30 request/menit per IP (lib/rate-limit).
- mode "unit" (default): kembalikan daftar unit yang tersedia {unitId, slug, tipe, estimasiHarga} (pakai hitungHarga bila sudah ada, kalau belum kembalikan null) dan unit yang tidak tersedia beserta alasannya bila unitId diberikan.
- mode "kalender": kembalikan tanggal (WIB, YYYY-MM-DD) yang sepenuhnya terblokir untuk unitId pada bulan tersebut (pakai getBlockedRanges).
- Header Cache-Control: no-store. Target p95 < 300 ms.

**Acceptance Criteria:**

- [ ] Request valid/invalid mengembalikan 200/400 dengan body error yang jelas, 429 saat limit terlewati.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-003 — Query daftar unit tersedia untuk rentang waktu tertentu (pertimbangkan buffer)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-002
- **Status:** [ ] Not Started

**Description:**

Buat src/server/queries/availability.ts::listAvailableUnits({ mulai, selesai, denganAntarJemput, tipe? }).

- Ambil unit aktif (deletedAt null, status != MAINTENANCE, filter tipe), resolve policy per tipe (cache per request), hitung bufferSampai per unit sesuai policy.
- Kelompokkan unit berdasarkan bufferSampai yang sama dan jalankan SATU query raw per kelompok yang mengembalikan unitId yang BENTROK (booking aktif atau blackout), lalu kurangi dari kandidat. Hindari N+1 per unit.
- Kembalikan unit tersedia beserta policy yang dipakai.

**Acceptance Criteria:**

- [ ] Tes integrasi dengan 10 unit dan beberapa booking memberi hasil benar dan hanya melakukan jumlah query yang kecil (log query dicek).
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-004 — Kalender `react-day-picker` v9 dengan tanggal terblokir ter-disable

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-003
- **Status:** [ ] Not Started

**Description:**

Buat komponen kalender src/components/booking/AvailabilityCalendar.tsx memakai react-day-picker v9 + styling Tailwind.

- Mode range (tanggal mulai-selesai), locale Indonesia, minggu mulai Senin.
- `disabled` = tanggal lampau + tanggal terblokir penuh dari POST /api/availability (mode "kalender") untuk unit terpilih; ambil data per bulan yang sedang tampil (TanStack Query, staleTime 30 detik).
- Tampilkan legenda (tersedia, terblokir, dipilih) dan loading state; aksesibel (aria-label, navigasi keyboard).

**Acceptance Criteria:**

- [ ] Tanggal yang dipenuhi booking atau blackout tidak bisa dipilih.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-005 — Pemilih jam dengan batas jam buka/tutup dari policy

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-004
- **Status:** [ ] Not Started

**Description:**

Buat pemilih jam src/components/booking/TimePicker.tsx.

- Pilihan jam interval 30 menit untuk jam mulai dan jam selesai, label zona "WIB".
- Opsi di luar jamBuka-jamTutup (policy) tetap bisa dipilih tetapi diberi penanda "biaya luar jam +Rp X" (bila biayaLuarJam > 0).
- Validasi: mulai >= sekarang + 1 jam; selesai > mulai; kombinasi tanggal+jam diubah ke Date UTC dengan parseWIBToUTC.

**Acceptance Criteria:**

- [ ] Memilih jam di luar operasional menampilkan biaya tambahan di ringkasan.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-006 — Helper timezone `formatWIB`, `parseWIBToUTC` + unit test (termasuk batas tengah malam)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-005
- **Status:** [ ] Not Started

**Description:**

Lengkapi helper waktu di src/lib/utils.ts: `WIB = "Asia/Jakarta"`, `formatWIB(date, opts?)` (Intl.DateTimeFormat id-ID), `parseWIBToUTC("YYYY-MM-DDTHH:mm")` (menambahkan offset +07:00), `toWIBInput(date)` -> "YYYY-MM-DDTHH:mm" untuk input datetime-local, `wibDayBounds(date)` -> {start, end} dalam UTC, `wibHm(date)` -> "HH:mm" WIB.

- Tulis unit test (tests/unit/utils-waktu.test.ts): konversi dua arah, batas tengah malam WIB (00:00 WIB = 17:00 UTC hari sebelumnya), tanggal akhir bulan, dan input tidak valid melempar error.

**Acceptance Criteria:**

- [ ] Semua tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-007 — Index DB dan `EXPLAIN` untuk membuktikan target performa

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 2.5h
- **Dependencies:** AVL-006
- **Status:** [ ] Not Started

**Description:**

Buktikan performa availability.

- Seed 50 unit dan ~5.000 booking historis/mendatang (skrip scripts/seed-load.ts, hanya untuk development).
- Jalankan EXPLAIN (ANALYZE, BUFFERS) untuk query cekBentrok dan listAvailableUnits; pastikan memakai index (booking_availability_idx atau gist pada periode). Bila Seq Scan, tambahkan index yang sesuai lewat migrasi baru (hati-hati: jangan mengubah constraint EXCLUDE).
- Ukur p95 endpoint /api/availability dengan autocannon atau k6 (100 request, 10 paralel) dan catat hasilnya di README.

**Acceptance Criteria:**

- [ ] P95 < 300 ms atau tindakan optimasi terdokumentasi.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### AVL-008 — Verifikasi: Slot yang bentrok (termasuk buffer) tidak muncul sebagai tersedia

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 1h
- **Dependencies:** AVL-007
- **Status:** [ ] Not Started

**Description:**

Verifikasi aturan buffer: buat booking Unit A 10:00-14:00 (bufferJam 2 -> bufferSampai 16:00). Cek slot mulai 15:00 -> tidak tersedia; mulai 16:00 -> tersedia. Cek juga dengan denganAntarJemput (buffer 3 jam -> bufferSampai 17:00).

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### AVL-009 — Verifikasi: Semua waktu tersimpan UTC, tampil WIB

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.2 — Pencarian & kalender ⚠️
- **Estimate:** 1h
- **Dependencies:** AVL-008
- **Status:** [ ] Not Started

**Description:**

Verifikasi zona waktu: pada booking yang disimpan, nilai di DB adalah UTC (WIB dikurangi 7 jam) dan semua tampilan UI (kalender, picker, ringkasan) menampilkan WIB. Uji booking yang melewati tengah malam WIB.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### PRC-001 — `lib/pricing.ts::hitungHarga(mulai, selesai, policy)` (fungsi murni)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 2h
- **Dependencies:** POL-010
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/pricing.ts::hitungHarga(mulai: Date, selesai: Date, policy: PolicyData) sebagai fungsi MURNI (tanpa import prisma/server-only; harus bisa dipakai di client).

- Kembalikan { durasiJam, hari, hargaDasar, diskon, diskonPersen, hargaMinimumDipakai, total, rincian: {label, nominal}[] }.
- durasiMenit = (selesai - mulai)/60000; lempar error terketik bila <= 0. durasiJam = ceil(durasiMenit/60).
- billingMode HYBRID: jam < minDurasiJam -> minDurasiJam x hargaPerJam; minDurasiJam <= jam < 24 -> min(jam x hargaPerJam, hargaHarian); jam >= 24 -> floor(jam/24) x hargaHarian + min((jam mod 24) x hargaPerJam, hargaHarian). HOURLY: max(jam, minDurasiJam) x hargaPerJam. FULL_DAY: ceil(jam/24) x hargaHarian.
- Semua hasil bilangan bulat Rupiah.

**Acceptance Criteria:**

- [ ] Tes di PRC-004 lolos.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PRC-002 — Pembulatan jam ke atas (`ceil`), diskon mingguan/bulanan, `hargaMinimum`

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 2h
- **Dependencies:** PRC-001
- **Status:** [ ] Not Started

**Description:**

Tambahkan diskon dan harga minimum ke hitungHarga.

- hari = floor(durasiJam/24). Diskon persen: diskonBulanan bila hari >= 30, selain itu diskonMingguan bila hari >= 7, selain itu 0 (tidak kumulatif).
- diskon = Math.round(hargaDasar x persen / 100); total = hargaDasar - diskon.
- Bila policy.hargaMinimum != null: total = max(total, hargaMinimum) dan tandai hargaMinimumDipakai.
- Isi rincian dengan baris: "Sewa X hari Y jam", "Diskon N%", "Harga minimum", agar bisa ditampilkan di UI dan invoice.

**Acceptance Criteria:**

- [ ] Contoh 7 hari dan 30 hari pada PRC-004 menghasilkan angka yang tepat.

---

#### PRC-003 — Validasi `maxDurasiHari`, jam operasional, `biayaLuarJam` (lihat N10)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 2h
- **Dependencies:** PRC-002
- **Status:** [ ] Not Started

**Description:**

Buat validateBookingWindow(mulai, selesai, policy, now = new Date()) di src/lib/pricing.ts (murni).

- Error bila: selesai <= mulai; mulai < now; durasi > maxDurasiHari x 24 jam.
- Cek jam pengambilan (mulai) dan pengembalian (selesai) dalam WIB terhadap jamBuka-jamTutup. Setiap kejadian di luar jam menambah policy.biayaLuarJam (maks 2 kali). Kembalikan { ok, errors: string[], biayaLuarJam: number, kejadianLuarJam: ("PENGAMBILAN"|"PENGEMBALIAN")[] }.
- Integrasikan: hitungHarga menerima opsi `biayaLuarJam` dan menambahkannya ke total (baris rincian "Biaya luar jam") SETELAH diskon dan hargaMinimum.

**Acceptance Criteria:**

- [ ] Pengambilan jam 21:00 WIB dengan biayaLuarJam 25000 menambah Rp 25.000 ke total.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PRC-004 — Unit test table-driven: 11 jam, 12 jam, 12j01m, 23 jam, 24 jam, 25 jam, 48 jam, 7 hari, 30 hari, 31…

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 2h
- **Dependencies:** PRC-003
- **Status:** [ ] Not Started

**Description:**

Tulis tests/unit/pricing.test.ts (table-driven, Vitest) dengan policy contoh: hargaPerJam 10000, hargaHarian 150000, minDurasiJam 12, diskonMingguan 10, diskonBulanan 20, maxDurasiHari 30, hargaMinimum null, biayaLuarJam 0.

- Kasus (durasi -> total yang diharapkan):
- 1 jam -> 120000; 11 jam -> 120000; tepat 12 jam -> 120000; 12 jam 1 menit (dibulatkan 13 jam) -> 130000; 14 jam -> 140000; 15 jam -> 150000; 23 jam -> 150000; 24 jam -> 150000; 25 jam -> 160000; 36 jam -> 270000; 47 jam -> 300000; 48 jam -> 300000; 7 hari -> 945000 (1.050.000 - 10%); 30 hari -> 3600000 (4.500.000 - 20%); selesai <= mulai -> error; 31 hari -> ditolak oleh validateBookingWindow.
- Tambahkan juga kasus: hargaMinimum 200000 menaikkan total 120000 menjadi 200000; mode HOURLY dan FULL_DAY; biayaLuarJam; dan properti "total selalu integer, tidak NaN, tidak negatif".

**Acceptance Criteria:**

- [ ] Semua hijau dengan coverage lib/pricing.ts > 90%.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PRC-005 — Kalkulator real-time di form (memakai fungsi yang sama dengan server)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 2h
- **Dependencies:** PRC-004
- **Status:** [ ] Not Started

**Description:**

Buat kalkulator harga real-time di form booking.

- Hook src/components/booking/useHargaPreview.ts yang memanggil hitungHarga + validateBookingWindow (fungsi yang SAMA dengan server, diimpor dari lib/pricing) setiap kali mulai/selesai/antar-jemput berubah (debounce 200 ms).
- Policy dikirim dari Server Component ke komponen client sebagai props berisi hanya field yang diperlukan (hasil toSnapshot).
- Tampilkan panel ringkasan: durasi, rincian baris, diskon, biaya luar jam, total, estimasi DP (dp_persen), deposit. Error validasi ditampilkan inline.
- Catat di komentar bahwa nilai final selalu dihitung ulang di server (createBooking).

**Acceptance Criteria:**

- [ ] Mengubah tanggal/jam langsung memperbarui total tanpa reload.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PRC-006 — Verifikasi: Hasil client dan server identik; coverage fungsi > 90%

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 1h
- **Dependencies:** PRC-005
- **Status:** [ ] Not Started

**Description:**

Verifikasi konsistensi: tulis tes yang membangkitkan 50 pasangan (mulai, selesai) acak dan memastikan hasil hitungHarga identik antara pemanggilan "client" (import langsung) dan jalur server (createBooking dalam tes integrasi). Jalankan `pnpm test --coverage` dan pastikan coverage lib/pricing.ts > 90%.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### PRC-007 — Verifikasi: Semua nominal bilangan bulat Rupiah, tanpa floating point

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.3 — Kalkulator harga 💰 ⚠️
- **Estimate:** 1h
- **Dependencies:** PRC-006
- **Status:** [ ] Not Started

**Description:**

Verifikasi ketahanan angka: semua keluaran memenuhi Number.isInteger, tidak ada NaN/Infinity, tidak negatif; input ekstrem (selesai sama dengan mulai, durasi 90 hari, policy dengan hargaPerJam 1) ditangani dengan error jelas, bukan hasil aneh.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### BKG-001 — Form `react-hook-form` + zod (nama, no HP `08xxxxxxxxxx`, email opsional, tanggal, antar-jemput, S&K)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** AVL-009, PRC-007
- **Status:** [ ] Not Started

**Description:**

Buat form booking di src/app/(public)/booking/[unitId]/page.tsx dan src/components/booking/BookingForm.tsx.

- Schema `bookingSchema` di lib/zod-schemas.ts yang dipakai bersama client dan server (field sesuai PRD 5.1: unitId cuid, nama 2-100, noHp dinormalisasi ke 08xxxxxxxxxx dengan regex ^08\d{8,11}$ — terima input +62/62 lalu ubah, email opsional, mulai, selesai, denganAntarJemput, ktpFileKey, simFileKey, setujuSK literal true, turnstileToken).
- Form memakai react-hook-form + zodResolver, AvailabilityCalendar + TimePicker, panel harga (useHargaPreview), upload KTP & SIM, checkbox S&K dengan tautan ke /syarat-ketentuan, tombol kirim dengan loading state.
- Mobile-first, tap target 44x44 px, label form dan aria-label lengkap.

**Acceptance Criteria:**

- [ ] Form tervalidasi di client dan mengirim data ke Server Action createBooking.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-002 — Upload KTP/SIM via presigned URL (memakai US-7.2) dan simpan file key

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-001
- **Status:** [ ] Not Started

**Description:**

Buat komponen upload src/components/booking/FileUpload.tsx untuk KTP dan SIM.

- Alur: pilih file -> validasi di client (jpg/png/webp/pdf, maks 2 MB) -> POST /api/upload untuk mendapat presigned PUT URL + fileKey -> PUT file langsung ke S3 -> simpan fileKey di form. Tampilkan progress, pratinjau nama file, tombol ganti/hapus.
- Bila US-7.2 belum dikerjakan, buat versi minimal /api/upload (validasi tipe dan ukuran, presigned PUT ke bucket privat) dan beri komentar TODO untuk hardening magic bytes di US-7.2. Jangan menyimpan file di filesystem server.

**Acceptance Criteria:**

- [ ] Dua file terunggah dan fileKey terisi sebelum form boleh dikirim.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-003 — Server Action createBooking (Section 5.1): validasi, resolve policy, hitung harga & bufferSampai,…

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-002
- **Status:** [ ] Not Started

**Description:**

Implementasikan Server Action createBooking di src/server/actions/booking.ts mengikuti PRD 5.1 dengan perbaikan berikut.

- Parse bookingSchema; verifikasi Turnstile (BKG-009); cek maintenance_mode dari SystemSetting.
- Ambil unit (aktif) + resolvePolicy(unit); validateBookingWindow; hitungHarga (+biaya luar jam).
- bufferSampai = selesai + (denganAntarJemput ? bufferAntarJemput : bufferJam) jam (dalam ms, hati-hati satuan).
- Panggil cekBentrok sebagai pre-check (BKG-004), tetapi tetap mengandalkan constraint saat insert.
- prisma.booking.create dengan customer connectOrCreate (bila customer ada: update nama/email/ktpUrl/simUrl terbaru), status PENDING, policyVersionId = policy.id, policySnapshot = toSnapshot(policy) (tanpa as any), hargaDasar, diskon, totalHarga, dpNominal (dp_persen), depositNominal.
- Tulis AuditLog "booking.create" (actorType CUSTOMER) dalam transaksi yang sama.
- revalidatePath("/admin/timeline"); return {ok:true, kode}.

**Acceptance Criteria:**

- [ ] Booking tersimpan dan halaman sukses dapat dibuka.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-004 — Tolak jika pelanggan di-blacklist; cek Blackout/MAINTENANCE (N4)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-003
- **Status:** [ ] Not Started

**Description:**

Tambahkan guard di createBooking sebelum insert: (a) customer isBlacklisted -> {ok:false,error:"TIDAK_DAPAT_DIPROSES"} (pesan netral, jangan membocorkan alasan blacklist); (b) unit tidak ada/deletedAt/MAINTENANCE -> "UNIT_TIDAK_TERSEDIA"; (c) cekBentrok bentrok (booking/blackout) -> "SLOT_BENTROK"; (d) jumlah booking PENDING aktif per noHp > 2 -> "TERLALU_BANYAK_PENDING"; (e) durasi/jam tidak valid dari validateBookingWindow -> "JADWAL_TIDAK_VALID" beserta pesan.

Pesan error yang ramah ditampilkan oleh form (mapping kode -> teks Bahasa Indonesia di satu tempat).

**Acceptance Criteria:**

- [ ] Tiap guard punya unit/integration test.

---

#### BKG-005 — Petakan error EXCLUDE ke SLOT_BENTROK (verifikasi kode error asli — N3) dan tampilkan pesan ramah

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-004
- **Status:** [ ] Not Started

**Description:**

Petakan pelanggaran EXCLUDE ke SLOT_BENTROK dengan benar.

- Buat util isExclusionViolation(e: unknown): boolean di src/lib/db-errors.ts. Jangan menebak: gunakan bentuk error asli yang dicatat oleh tes DB-006/BKG-008 (Prisma bisa melempar PrismaClientKnownRequestError dengan code tertentu atau PrismaClientUnknownRequestError). Cek meta, SQLSTATE "23P01", atau pesan yang memuat "no_overlap_bookings" sebagai fallback.
- Pada createBooking: catch -> bila isExclusionViolation kembalikan {ok:false, error:"SLOT_BENTROK"}, selain itu lempar ulang (jangan ditelan).
- Tambahkan unit test util dengan fixture error asli.

**Acceptance Criteria:**

- [ ] Dua request paralel ke slot yang sama menghasilkan 1 sukses dan 1 SLOT_BENTROK (bukan 500).
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-006 — Generator kodeBooking unik, mudah dibaca, tahan tabrakan

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-005
- **Status:** [ ] Not Started

**Description:**

Buat generateKode() di src/lib/utils.ts: "RMJ-" + 6 karakter acak dari alfabet Crockford base32 tanpa I, L, O, U ("0123456789ABCDEFGHJKMNPQRSTVWXYZ") memakai crypto.randomInt (bukan Math.random).

- Di createBooking, retry hingga 5 kali bila insert gagal karena unique constraint kodeBooking (P2002 pada kolom tersebut).
- Tulis unit test: format kode benar, tidak mengandung karakter terlarang, 10.000 kode tanpa duplikat.

**Acceptance Criteria:**

- [ ] Tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-007 — Idempotency/anti klik ganda

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-006
- **Status:** [ ] Not Started

**Description:**

Cegah booking ganda akibat klik berulang.

- Client: tombol submit disabled saat pending (useTransition) dan ID kunci idempotensi (uuid) dibuat sekali per sesi form.
- Server: sebelum insert, cari booking PENDING dengan unitId, noHp pelanggan, mulai, selesai yang sama dibuat dalam 2 menit terakhir; bila ada kembalikan {ok:true, kode} milik booking itu (tidak membuat baru).

**Acceptance Criteria:**

- [ ] Mengirim form dua kali cepat hanya membuat satu booking.

---

#### BKG-008 — Integration test race condition: 20 request paralel ke slot sama → 1 sukses

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-007
- **Status:** [ ] Not Started

**Description:**

Tulis tests/integration/create-booking.test.ts (testcontainers): seed 1 owner, 1 policy global, 1 unit.

- 20 panggilan createBooking paralel (Promise.allSettled) untuk slot identik dengan pelanggan berbeda -> tepat 1 {ok:true} dan 19 {ok:false, error:"SLOT_BENTROK"}; tidak ada rejected tak terduga; tepat 1 baris Booking.
- Booking bersebelahan tepat di batas buffer -> keduanya sukses.
- Booking di rentang blackout -> SLOT_BENTROK.
- Pelanggan blacklist -> TIDAK_DAPAT_DIPROSES.
- Snapshot policy tersimpan dan total sesuai hitungHarga.

**Acceptance Criteria:**

- [ ] Semua hijau dan stabil dijalankan 5 kali berturut-turut.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-009 — Cloudflare Turnstile pada form

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 2h
- **Dependencies:** BKG-008
- **Status:** [ ] Not Started

**Description:**

Pasang Cloudflare Turnstile.

- Komponen src/components/shared/Turnstile.tsx (script resmi, callback mengisi field turnstileToken di form).
- src/lib/turnstile.ts::verifyTurnstile(token, ip) memanggil [challenges.cloudflare.com/turnstile/v0/siteverify](https://challenges.cloudflare.com/turnstile/v0/siteverify) dengan TURNSTILE_SECRET_KEY; kembalikan boolean; timeout 3 detik; gagal verifikasi -> error "CAPTCHA_GAGAL".
- Di development/test gunakan secret/sitekey uji Turnstile (selalu lolos) via env; di production wajib.

**Acceptance Criteria:**

- [ ] Form tidak bisa dikirim tanpa token valid di production.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BKG-010 — Verifikasi: Booking tersimpan PENDING dengan total harga benar dan snapshot policy

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 1h
- **Dependencies:** BKG-009
- **Status:** [ ] Not Started

**Description:**

Verifikasi hasil booking: setelah submit, di DB ada Booking status PENDING dengan totalHarga = hasil hitungHarga, bufferSampai = selesai + buffer sesuai antar-jemput, policySnapshot terisi lengkap, dpNominal sesuai dp_persen, dan AuditLog "booking.create".

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### BKG-011 — Verifikasi: Tidak ada kondisi di mana dua booking aktif bertumpuk pada unit yang sama

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.4 — Form booking ⚠️
- **Estimate:** 1h
- **Dependencies:** BKG-010
- **Status:** [ ] Not Started

**Description:**

Verifikasi anti double-booking: jalankan skrip stres 20 request paralel ke slot yang sama dari dua browser/terminal. Hasil: 1 booking terbentuk, sisanya mendapat pesan "slot sudah dipesan", tidak ada error 500 dan tidak ada event error di Sentry.

**Acceptance Criteria:**

- [ ] Skenario verifikasi di atas dijalankan dan hasilnya sesuai harapan
- [ ] Hasil (lulus/gagal) dan temuan dicatat di PR atau catatan sprint

---

#### SUC-001 — Halaman booking/sukses/[kode] (ringkasan, kode booking, total, nominal DP)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.5 — Halaman sukses
- **Estimate:** 2h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Buat halaman src/app/(public)/booking/sukses/[kode]/page.tsx (Server Component). Tampilkan: kode booking (besar, bisa disalin), unit, jadwal (WIB), total, nominal DP, status, dan instruksi pembayaran DP. Jika kode tidak ditemukan -> notFound(). Tambahkan <meta name="robots" content="noindex">.

**Acceptance Criteria:**

- [ ] Setelah createBooking pengguna diarahkan ke halaman ini dan melihat data yang benar.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SUC-002 — Countdown batas pembayaran DP berdasarkan pendingTimeoutMenit

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.5 — Halaman sukses
- **Estimate:** 2h
- **Dependencies:** SUC-001
- **Status:** [ ] Not Started

**Description:**

Buat komponen client Countdown.tsx yang menghitung mundur ke createdAt + pendingTimeoutMenit (ambil pendingTimeoutMenit dari policySnapshot booking). Format MM:SS (atau "1 jam 20 menit"), perbarui tiap detik, gunakan waktu server sebagai acuan (kirim deadline ISO dari server agar tidak bergantung jam perangkat). Saat habis tampilkan "Waktu pembayaran DP habis, booking dibatalkan otomatis" dan sembunyikan tombol bayar. Bila status bukan PENDING, countdown tidak ditampilkan.

**Acceptance Criteria:**

- [ ] Countdown akurat dan berhenti di nol.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SUC-003 — Tombol WhatsApp dengan pesan terisi otomatis

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.5 — Halaman sukses
- **Estimate:** 2h
- **Dependencies:** SUC-002
- **Status:** [ ] Not Started

**Description:**

Buat tombol WhatsApp: tautan [wa.me](https://wa.me/)<nomor>?text=<pesan> dengan nomor dari SystemSetting 'whatsapp_number' dan pesan terisi otomatis ("Halo, saya ingin konfirmasi DP booking <kode> atas nama <nama>, total Rp <total>, DP Rp <dp>."), di-encode dengan encodeURIComponent. Buka di tab baru (rel="noopener noreferrer").

**Acceptance Criteria:**

- [ ] Tombol membuka WhatsApp dengan pesan benar.

---

#### SUC-004 — Akses hanya via kode yang tidak mudah ditebak

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.5 — Halaman sukses
- **Estimate:** 2h
- **Dependencies:** SUC-003
- **Status:** [ ] Not Started

**Description:**

Amankan akses halaman sukses: kode berasal dari generateKode (entropi cukup), halaman hanya menampilkan data minimal (tanpa KTP/SIM/email lengkap; noHp dimasking mis. 0812****789), terapkan rateLimit per IP (30/menit) pada halaman/lookup, dan noindex. Pastikan kode booking tidak muncul di log Sentry.

**Acceptance Criteria:**

- [ ] Tidak ada data sensitif di halaman dan rate limit teruji.

---

#### CAT-001 — Beranda + daftar tipe/unit tersedia (RSC, ISR bila sesuai)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.1 — Katalog & detail
- **Estimate:** 3h
- **Dependencies:** AVL-009
- **Status:** [ ] Not Started

**Description:**

Buat beranda (src/app/(public)/page.tsx) dan katalog.

- Query server/queries/unit.ts::listCatalog(): kelompokkan unit aktif (deletedAt null, bukan MAINTENANCE) per tipe dengan harga dari policy efektif (hargaPerJam, hargaHarian, minimum 12 jam) dan jumlah unit.
- Hero singkat + form cepat cek ketersediaan (tanggal/jam) yang mengarahkan ke hasil, daftar kartu motor (shadcn Card), tombol "Lihat Detail" dan "Pesan".
- Gunakan RSC dan revalidate (ISR) 60 detik; loading/empty state.

**Acceptance Criteria:**

- [ ] Beranda menampilkan data seed dan responsif di mobile.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CAT-002 — Halaman motor/[slug] (info, harga per jam/hari, syarat)

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.1 — Katalog & detail
- **Estimate:** 3h
- **Dependencies:** CAT-001
- **Status:** [ ] Not Started

**Description:**

Buat halaman detail src/app/(public)/motor/[slug]/page.tsx: info unit/tipe, harga per jam/hari/minimum, aturan buffer, deposit, syarat singkat (KTP, SIM C), kalender ketersediaan (AvailabilityCalendar) dan tombol "Pesan Sekarang" ke /booking/[unitId] dengan tanggal terpilih. generateStaticParams untuk slug aktif; notFound() untuk slug tidak ada/dihapus.

**Acceptance Criteria:**

- [ ] Slug valid menampilkan halaman lengkap dan slug tak dikenal menampilkan 404.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CAT-003 — SEO dasar (metadata, OG image), loading & empty state

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.1 — Katalog & detail
- **Estimate:** 3h
- **Dependencies:** CAT-002
- **Status:** [ ] Not Started

**Description:**

Tambahkan SEO dasar: generateMetadata per halaman (title, description, canonical), Open Graph/Twitter card, JSON-LD (LocalBusiness/Product sederhana) di beranda dan detail, app/sitemap.ts dan app/robots.ts (disallow /admin dan /api), lang="id" pada <html>. Halaman booking dan sukses noindex.

**Acceptance Criteria:**

- [ ] Lighthouse SEO >= 90 pada beranda dan detail.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CAT-004 — Target LCP < 2,5 s di 4G

- **Priority:** P0
- **Sprint:** Sprint 2
- **Story:** US-3.1 — Katalog & detail
- **Estimate:** 3h
- **Dependencies:** CAT-003
- **Status:** [ ] Not Started

**Description:**

Optimalkan performa publik: next/image dengan ukuran eksplisit dan priority untuk gambar LCP, next/font dengan display swap, hindari JS client yang tidak perlu (komponen client hanya untuk kalender/form), data fetch paralel (Promise.all) di RSC, cache/ISR yang sesuai.

**Acceptance Criteria:**

- [ ] Lighthouse mobile (4G simulasi) menunjukkan LCP < 2,5 detik pada beranda dan detail.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TRK-001 — Halaman cek-booking (input kode + no HP sebagai verifikasi)

- **Priority:** P1
- **Sprint:** Sprint 2
- **Story:** US-3.6 — Cek riwayat
- **Estimate:** 3h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Buat halaman src/app/(public)/cek-booking/page.tsx: form kode booking + nomor HP (verifikasi kepemilikan). Server Action lookupBooking memvalidasi dengan zod, mencari booking by kodeBooking dan customer.noHp yang cocok. Bila tidak cocok kembalikan pesan generik "Booking tidak ditemukan" (jangan bedakan kode salah vs HP salah). Tampilkan hasil di halaman yang sama.

**Acceptance Criteria:**

- [ ] Kode+HP benar menampilkan booking, kombinasi salah menampilkan pesan generik.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TRK-002 — Tampilan status booking, timeline status, tombol request extend

- **Priority:** P1
- **Sprint:** Sprint 2
- **Story:** US-3.6 — Cek riwayat
- **Estimate:** 3h
- **Dependencies:** TRK-001
- **Status:** [ ] Not Started

**Description:**

Tampilkan detail booking pada hasil cek: ringkasan unit/jadwal/harga/DP/deposit, badge status, timeline status (PENDING -> CONFIRMED -> ACTIVE -> RETURNED -> COMPLETED, atau CANCELLED/NO_SHOW/LATE dengan penanda), denda bila ada, dan tombol "Ajukan Perpanjangan" yang hanya muncul untuk status ACTIVE (menuju requestExtend di US-5.3; untuk sekarang tombol disabled dengan tooltip "segera hadir" bila US-5.3 belum selesai).

**Acceptance Criteria:**

- [ ] Setiap status menampilkan tampilan yang sesuai.

---

#### TRK-003 — Rate limit pencarian untuk mencegah enumerasi kode

- **Priority:** P1
- **Sprint:** Sprint 2
- **Story:** US-3.6 — Cek riwayat
- **Estimate:** 3h
- **Dependencies:** TRK-002
- **Status:** [ ] Not Started

**Description:**

Terapkan rate limit pada lookupBooking: 5 percobaan/menit per IP dan 10/jam per kode; tambahkan jeda respons seragam (mis. minimal 300 ms) agar tidak bisa dibedakan secara waktu; pasang Turnstile setelah 3 kegagalan berturut-turut dari IP yang sama.

**Acceptance Criteria:**

- [ ] Percobaan ke-6 dalam semenit mendapat 429/pesan batas dan teruji.

---

## Sprint 3 — Operasional Admin

**Sprint Goal:** Admin bisa melihat timeline, mengonfirmasi DP, mengelola dan merelokasi booking.

---

### Epic 4 — Admin Booking

**Story dalam sprint ini:** US-4.1 (4 pt); US-4.2 (8 pt); US-4.3 (2 pt); US-4.4 (5 pt); US-4.5 (3 pt).

#### DASH-001 — Kartu: DP menunggu konfirmasi, pengambilan hari ini, pengembalian hari ini, booking terlambat,…

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.1 — Dashboard "Perlu Tindakan"
- **Estimate:** 4h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Buat query dashboard src/server/queries/dashboard.ts::getPerluTindakan() yang mengembalikan hitungan dan 5 item teratas untuk:

1. DP menunggu konfirmasi (status PENDING, belum kedaluwarsa); (2) pengambilan hari ini (CONFIRMED dengan mulai pada hari ini WIB, gunakan wibDayBounds); (3) pengembalian hari ini (ACTIVE/LATE dengan selesai hari ini WIB); (4) terlambat (ACTIVE dengan now > selesai + graceMenit dari snapshot, ATAU status LATE) — hitung dari waktu langsung, jangan hanya bergantung pada status LATE yang diisi cron; (5) request extend berstatus PENDING.
   Setiap item: kode, nama pelanggan, unit, waktu relevan (WIB), tautan ke /admin/booking/[id].

**Acceptance Criteria:**

- [ ] Tiap kategori mengembalikan data benar untuk data seed yang disiapkan di tes.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### DASH-002 — Daftar aksi cepat dengan tautan ke detail booking

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.1 — Dashboard "Perlu Tindakan"
- **Estimate:** 4h
- **Dependencies:** DASH-001
- **Status:** [ ] Not Started

**Description:**

Bangun halaman /admin/dashboard: grid kartu "Perlu Tindakan" (angka besar + daftar singkat + tautan "Lihat semua") untuk lima kategori di DASH-001, ditambah ringkasan unit (tersedia/disewa/maintenance). Kartu terlambat berwarna merah. Tampilan mobile-first, tap target 44x44 px, empty state "Tidak ada yang perlu ditindaklanjuti".

**Acceptance Criteria:**

- [ ] Dashboard menampilkan semua kategori dan setiap item mengarah ke detail booking.

---

#### DASH-003 — Query paralel di RSC; indeks pendukung

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.1 — Dashboard "Perlu Tindakan"
- **Estimate:** 4h
- **Dependencies:** DASH-002
- **Status:** [ ] Not Started

**Description:**

Optimalkan dashboard: jalankan semua query paralel dengan Promise.all di Server Component, tambahkan index yang diperlukan (cek EXPLAIN untuk query status+tanggal; index yang ada: [unitId,status,mulai,bufferSampai], [customerId], [status,createdAt]), dan tambahkan tombol refresh/revalidasi (router.refresh). Target waktu render server < 500 ms dengan 5.000 booking.

**Acceptance Criteria:**

- [ ] Waktu query terukur dan tercatat di README.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TL-001 — Komponen grid Gantt (div grid, bukan FullCalendar), baris = unit, kolom = waktu

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Buat komponen grid timeline src/components/admin/Timeline.tsx (div grid + CSS, BUKAN FullCalendar).

Baris = unit (sticky kolom kiri berisi plat/tipe), kolom = slot waktu (skala jam atau hari sesuai zoom).
Props: units, bookings (dengan mulai, selesai, bufferSampai, status, kode, nama), blackouts, rangeStart, rangeEnd, zoom ("hari" | "minggu" | "bulan").
Server Component mengambil data (server/queries/timeline.ts) dan meneruskannya ke komponen presentational; hindari logika bisnis di komponen.

**Acceptance Criteria:**

- [ ] Grid menampilkan unit seed dan header tanggal dalam WIB.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TL-002 — Render 5 warna status (PENDING, CONFIRMED, ACTIVE, LATE, blackout/maintenance) + blok buffer

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-001
- **Status:** [ ] Not Started

**Description:**

Render blok pada timeline: warna per status — PENDING (kuning), CONFIRMED (biru), ACTIVE (hijau), LATE/terlambat (merah), blackout/maintenance (abu-abu bergaris) — plus segmen buffer (setelah selesai sampai bufferSampai) dengan warna lebih pucat dan pola berbeda. Tambahkan legenda warna dan teks alternatif (jangan hanya mengandalkan warna: tampilkan inisial status/ikon). Blok menampilkan kode dan nama pelanggan (truncate).

**Acceptance Criteria:**

- [ ] Semua status dan buffer tampil jelas dan lolos cek kontras WCAG AA.

---

#### TL-003 — Navigasi rentang (hari/minggu/bulan), zoom

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-002
- **Status:** [ ] Not Started

**Description:**

Tambahkan navigasi rentang: tombol Sebelumnya/Hari ini/Berikutnya, pilihan zoom hari/minggu/bulan, dan pemilih tanggal. State di searchParams (?tanggal=YYYY-MM-DD&zoom=minggu) agar bisa dibagikan. Tampilkan penanda garis "sekarang" (WIB).

**Acceptance Criteria:**

- [ ] Berpindah rentang memuat data baru tanpa full reload dan URL ikut berubah.

---

#### TL-004 — Horizontal scroll mobile, tap target 44×44 px

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-003
- **Status:** [ ] Not Started

**Description:**

Buat timeline nyaman di mobile: area grid dapat di-scroll horizontal dengan kolom unit sticky, snap scroll, tap target minimal 44x44 px untuk blok dan tombol, font tidak kurang dari 12 px, dan tombol "Cek cepat" melayang (menuju QCK-001). Uji di lebar 360 px.

**Acceptance Criteria:**

- [ ] Seluruh interaksi bisa dilakukan di layar 360 px tanpa pinch-zoom.

---

#### TL-005 — Klik blok → detail booking (Sheet)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-004
- **Status:** [ ] Not Started

**Description:**

Interaksi klik: mengklik blok booking membuka Sheet detail ringkas (kode, pelanggan, noHp, jadwal, status, total, tombol "Buka detail" ke /admin/booking/[id], tombol aksi cepat sesuai status yang diizinkan state machine). Klik sel kosong pada baris unit membuka dialog "Booking manual" yang menyalin tanggal/jam terpilih ke form (create booking oleh admin, memakai createBooking dengan flag sumber ADMIN tanpa Turnstile).

**Acceptance Criteria:**

- [ ] Dari timeline admin bisa membuka detail dan membuat booking manual.

---

#### TL-006 — Perhitungan posisi/lebar blok dari UTC ke WIB + test fungsi layout

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-005
- **Status:** [ ] Not Started

**Description:**

Pisahkan perhitungan layout menjadi fungsi murni src/lib/timeline-layout.ts: hitungPosisiBlok(mulai, selesai, rangeStart, rangeEnd, zoom) -> {leftPct, widthPct, terpotongKiri, terpotongKanan} dan bagiSegmen(booking) -> {inti, buffer}. Semua dalam UTC internal, konversi WIB hanya untuk label. Tulis unit test: booking di dalam rentang, melewati batas kiri/kanan, di luar rentang (tidak dirender), durasi < 1 slot (lebar minimum), lintas tengah malam WIB.

**Acceptance Criteria:**

- [ ] Tes hijau dan Timeline memakai fungsi ini.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TL-007 — Uji performa (50 unit × 31 hari)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.2 — Timeline kalender ⚠️ KOMPLEKS
- **Estimate:** 3.5h
- **Dependencies:** TL-006
- **Status:** [ ] Not Started

**Description:**

Uji performa timeline: seed 50 unit x 31 hari dengan ~600 booking. Pastikan query hanya mengambil booking/blackout yang beririsan dengan rentang yang tampil (batasi dengan mulai < rangeEnd AND bufferSampai > rangeStart), render server < 800 ms, dan tidak ada re-render berlebih di client (Timeline server component; hanya Sheet interaktif yang client). Catat hasil di README.

**Acceptance Criteria:**

- [ ] Target tercapai atau optimasi terdokumentasi.

---

#### QCK-001 — Form cek rentang waktu → daftar unit tersedia (< 5 detik, target PRD)

- **Priority:** P1
- **Sprint:** Sprint 3
- **Story:** US-4.3 — Cek cepat ketersediaan
- **Estimate:** 3h
- **Dependencies:** AVL-009
- **Status:** [ ] Not Started

**Description:**

Buat form cek cepat ketersediaan di dashboard dan timeline (komponen QuickCheck): input tanggal+jam mulai, selesai, toggle antar-jemput, filter tipe opsional. Submit memanggil listAvailableUnits (server action atau fetch ke /api/availability dengan sesi admin) dan menampilkan hasil dalam < 5 detik: daftar unit tersedia + estimasi harga, atau pesan "Tidak ada unit tersedia" dengan alasan per unit (booking/blackout/maintenance) dan saran jadwal terdekat.

**Acceptance Criteria:**

- [ ] Hasil muncul < 5 detik untuk 50 unit.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### QCK-002 — Tombol "buat booking manual" dari hasil

- **Priority:** P1
- **Sprint:** Sprint 3
- **Story:** US-4.3 — Cek cepat ketersediaan
- **Estimate:** 3h
- **Dependencies:** QCK-001
- **Status:** [ ] Not Started

**Description:**

Tambahkan tombol "Buat booking" pada setiap unit hasil cek cepat yang membuka dialog booking manual dengan unit, tanggal, dan jam terisi. Dialog meminta nama, noHp, (KTP/SIM opsional untuk booking admin), lalu memanggil createBooking dengan sumber ADMIN.

**Acceptance Criteria:**

- [ ] Alur cek cepat -> booking manual selesai tanpa mengetik ulang data jadwal.

---

#### ADM-001 — Halaman detail booking (pelanggan, dokumen via signed URL 5 menit, harga, snapshot policy, log)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** BKG-011, AUTH-010
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/booking/[id] (Server Component): header (kode, status badge, tombol aksi), kartu Pelanggan (nama, noHp dengan tautan WhatsApp, flag blacklist dan lateCount), Jadwal (mulai, selesai, bufferSampai, antar-jemput), Harga (dasar, diskon, biaya luar jam, total, DP, deposit, denda bila ada), Dokumen (tautan KTP/SIM melalui signed URL 5 menit yang dibuat saat klik, bukan saat render), Snapshot policy (collapsible), dan Riwayat (AuditLog entityId = booking.id, dengan AuditDiff).

**Acceptance Criteria:**

- [ ] Semua data tampil benar dan dokumen hanya bisa dibuka lewat signed URL.

---

#### ADM-002 — State machine booking: tabel transisi yang diizinkan + guard di server…

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-001
- **Status:** [ ] Not Started

**Description:**

Implementasikan state machine di src/lib/booking-state.ts (fungsi murni): tabel TRANSISI = { PENDING:[CONFIRMED,CANCELLED], CONFIRMED:[ACTIVE,CANCELLED,NO_SHOW], ACTIVE:[RETURNED,LATE], LATE:[RETURNED], RETURNED:[COMPLETED], COMPLETED:[], CANCELLED:[], NO_SHOW:[] }, bolehTransisi(dari, ke) dan assertTransisi(dari, ke) yang melempar error terketik. Buat helper server ubahStatus(tx, bookingId, ke, opts) yang: membaca status terkini dengan SELECT ... FOR UPDATE (atau updateMany dengan where status = dari dan cek count), memvalidasi transisi, mengupdate, dan menulis AuditLog "booking.status" (before/after) dalam satu transaksi. Semua action admin memakai helper ini (tidak ada update status langsung).

**Acceptance Criteria:**

- [ ] Transisi ilegal ditolak dan perubahan paralel tidak menimpa satu sama lain.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### ADM-003 — Action confirmDP (nominal & bukti DP, dikonfirmasiAt)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-002
- **Status:** [ ] Not Started

**Description:**

Buat Server Action confirmDP(bookingId, { dpNominal, buktiFileKey? }) di server/actions/admin-booking.ts: requireRole("OWNER","STAFF"); hanya dari PENDING; zod: dpNominal int > 0 (default dp yang ditetapkan saat booking, boleh berbeda dengan alasan); simpan dpNominal, dpBuktiUrl, dikonfirmasiAt = now; ubahStatus -> CONFIRMED; tolak bila booking sudah kedaluwarsa dibatalkan cron. Revalidate timeline dan detail. (Email konfirmasi ditambahkan di US-6.1.)

**Acceptance Criteria:**

- [ ] PENDING -> CONFIRMED dengan audit log, dan konfirmasi kedua kali ditolak.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### ADM-004 — Action cancelBooking + lib/refund.ts (H-3, H-1, no-show dari policy; lihat N5) + unit test

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-003
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/refund.ts::hitungRefund(booking: {mulai, dpNominal, status}, waktuBatal, policy) (fungsi murni, aturan 5 di konteks) -> {persen, nominal, label} dan Server Action cancelBooking(bookingId, { alasan }): requireRole; boleh dari PENDING atau CONFIRMED; hitung refund dari policy SNAPSHOT; simpan alasan (di AuditLog.after) dan nominal refund; ubahStatus -> CANCELLED (untuk NO_SHOW, action terpisah markNoShow dari CONFIRMED setelah mulai + grace, dengan refundNoShowPersen); kembalikan ringkasan refund untuk ditampilkan.

Tulis unit test hitungRefund: batal tepat 72 jam, 71 jam 59 menit, tepat 24 jam, 23 jam, setelah mulai, dpNominal null/0, pembulatan floor.

**Acceptance Criteria:**

- [ ] Tes hijau dan UI menampilkan nominal refund sebelum konfirmasi pembatalan.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### ADM-005 — Action serah-terima unit (ACTIVE, diambilAt, deposit)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-004
- **Status:** [ ] Not Started

**Description:**

Buat Server Action handoverUnit(bookingId, { depositDiterima, catatan?, fotoKeys? }) (serah terima unit): hanya dari CONFIRMED; waktu sekarang harus >= mulai - 2 jam (override OWNER); set diambilAt = now, depositNominal = depositDiterima (>= policy.depositNominal), ubahStatus -> ACTIVE, set Unit.status = RENTED; semua dalam satu transaksi. Tambahkan dialog di halaman detail (input deposit, catatan kondisi unit).

**Acceptance Criteria:**

- [ ] Serah terima mengubah status booking dan unit secara atomik.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### ADM-006 — Audit log semua transisi status

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-005
- **Status:** [ ] Not Started

**Description:**

Pastikan setiap aksi di halaman detail (confirmDP, cancelBooking, markNoShow, handoverUnit) menulis AuditLog lewat writeAudit dalam transaksi yang sama, dengan before/after yang berisi status, nominal, dan alasan; actorId = user admin. Tampilkan riwayat di halaman detail (ADM-001).

**Acceptance Criteria:**

- [ ] Setiap aksi menghasilkan tepat satu entri audit yang benar, teruji di tes integrasi.

---

#### ADM-007 — Unit test state machine (transisi ilegal ditolak)

- **Priority:** P0
- **Sprint:** Sprint 3
- **Story:** US-4.4 — Detail & aksi booking
- **Estimate:** 2h
- **Dependencies:** ADM-006
- **Status:** [ ] Not Started

**Description:**

Tulis tests/unit/booking-state.test.ts: semua transisi yang diizinkan lolos, semua transisi lain (matriks 8x8) ditolak, status terminal tidak punya transisi keluar. Tambahkan tes integrasi: dua confirmDP paralel pada booking yang sama -> hanya satu berhasil.

**Acceptance Criteria:**

- [ ] Semua hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### RLC-001 — Action relocateBooking ke unit lain pada rentang sama (cek bentrok + tipe/harga)

- **Priority:** P1
- **Sprint:** Sprint 3
- **Story:** US-4.5 — Relokasi booking
- **Estimate:** 3h
- **Dependencies:** ADM-007
- **Status:** [ ] Not Started

**Description:**

Buat Server Action relocateBooking(bookingId, targetUnitId, { alasan }) (OWNER/STAFF): hanya untuk booking CONFIRMED atau PENDING yang belum diserahterimakan; unit target harus aktif, tersedia (cekBentrok dengan excludeBookingId = bookingId), dan bertipe/tarif sama (atau kembalikan selisih harga dan minta konfirmasi, tidak mengubah totalHarga yang sudah dibayar kecuali disetujui OWNER). UI: dialog di halaman detail booking dengan daftar unit tersedia dari listAvailableUnits untuk rentang booking itu.

**Acceptance Criteria:**

- [ ] Booking berpindah ke unit lain yang tersedia.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### RLC-002 — Dalam transaksi tunggal; tangani kegagalan constraint

- **Priority:** P1
- **Sprint:** Sprint 3
- **Story:** US-4.5 — Relokasi booking
- **Estimate:** 3h
- **Dependencies:** RLC-001
- **Status:** [ ] Not Started

**Description:**

Pastikan relokasi atomik: update unitId dalam satu prisma.$transaction; constraint EXCLUDE tetap menjadi penjaga terakhir — tangkap pelanggaran dengan isExclusionViolation dan kembalikan {ok:false, error:"SLOT_BENTROK"} tanpa perubahan data. Tulis tes integrasi: relokasi ke unit yang baru saja terisi (balapan) menghasilkan tepat satu pemenang.

**Acceptance Criteria:**

- [ ] Tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### RLC-003 — Catat audit + notifikasi pelanggan

- **Priority:** P1
- **Sprint:** Sprint 3
- **Story:** US-4.5 — Relokasi booking
- **Estimate:** 3h
- **Dependencies:** RLC-002
- **Status:** [ ] Not Started

**Description:**

Catat audit "booking.relocate" (before.unitId, after.unitId, alasan) dan siapkan hook notifikasi: panggil fungsi notifyRelocation(booking) (stub sekarang; implementasi email di US-6.1) setelah transaksi berhasil, tanpa membuat relokasi gagal bila notifikasi gagal.

**Acceptance Criteria:**

- [ ] Audit tercatat dan stub dipanggil tepat sekali.

---

## Sprint 4 — Check-out, Denda & Extend

**Sprint Goal:** Pengembalian, denda otomatis, extend, force majeure, dan email transaksional pertama berjalan.

---

### Epic 5 — Check-out, Denda, Extend

**Story dalam sprint ini:** US-5.1 (4 pt); US-5.2 (5 pt); US-5.3 (4 pt); US-5.4 (2 pt).

#### PEN-001 — lib/penalty.ts::hitungDenda(selesai, dikembalikanAt, policy) (fungsi murni)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.1 — Kalkulator denda 💰 ⚠️
- **Estimate:** 3h
- **Dependencies:** PRC-007
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/penalty.ts::hitungDenda(selesai: Date, dikembalikanAt: Date, policy: PolicyData) sebagai fungsi MURNI sesuai aturan 4 di konteks.

Kembalikan { telatMenit, menitDihitung, blok, dendaMentah, batas, dendaNominal, tierLabel, terkenaBatas }.
telatMenit = max(0, floor((dikembalikanAt - selesai)/60000)).
telatMenit <= policy.graceMenit -> dendaNominal 0, tierLabel "Dalam masa toleransi".
menitDihitung = hitungSetelahGrace ? telatMenit - graceMenit : telatMenit; blok = ceil(menitDihitung / blokMenit); dendaMentah = blok x nominalPerBlok.
batas = ceil(telatMenit / 1440) x maksKaliHargaHarianPer24Jam x hargaHarian; dendaNominal = min(dendaMentah, batas), bulatkan Math.round. tierLabel = "<blok> blok x <blokMenit> menit".
Policy yang dipakai SELALU dari fromSnapshot(booking.policySnapshot).

**Acceptance Criteria:**

- [ ] Tes di PEN-003 lolos.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PEN-002 — Baca aturan denda dari dendaTier (JSON) agar bisa diubah via Policy Engine

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.1 — Kalkulator denda 💰 ⚠️
- **Estimate:** 3h
- **Dependencies:** PEN-001
- **Status:** [ ] Not Started

**Description:**

Pastikan hitungDenda membaca aturan denda (blokMenit, nominalPerBlok, hitungSetelahGrace, batas harian) dari policy.dendaTier (JSON tervalidasi dendaTierSchema) dan bukan angka yang ditulis keras di kode, sehingga perubahan lewat Policy Engine berlaku untuk booking baru. Tambahkan fungsi parseDendaTier(json) yang melempar error jelas bila format salah. Aktifkan panel simulasi di halaman policy (SIMULASI_AKTIF = true di POL-004) yang memakai hitungHarga dan hitungDenda.

**Acceptance Criteria:**

- [ ] Mengubah nominal per blok atau blok menit di policy lalu menjalankan simulasi memberi hasil yang berubah sesuai.

---

#### PEN-003 — Unit test batas denda: 15, 16, 31, 60, 120, 465, 1440, 1441 menit

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.1 — Kalkulator denda 💰 ⚠️
- **Estimate:** 3h
- **Dependencies:** PEN-002
- **Status:** [ ] Not Started

**Description:**

Tulis tests/unit/penalty.test.ts dengan policy contoh (hargaHarian 150000, graceMenit 15, dendaTier: blokMenit 15, nominalPerBlok 5000, hitungSetelahGrace true, maksKaliHargaHarianPer24Jam 1). Kasus (telat -> denda):

0 menit -> 0; 10 menit -> 0; 15 menit -> 0; 16 menit -> 5000 (1 blok); 30 menit -> 5000; 31 menit -> 10000 (2 blok); 60 menit -> 15000 (3 blok); 120 menit -> 35000 (7 blok); 180 menit -> 55000 (11 blok); 450 menit -> 145000 (29 blok); 465 menit -> 150000 (30 blok, tepat batas); 600 menit -> 150000 (195000 dipotong batas 1x harian); 1440 menit -> 150000; 1441 menit -> 300000 (batas 2x harian); 2880 menit -> 300000; 2881 menit -> 450000.
Tambahkan: dikembalikan lebih awal dari selesai -> 0; grace policy 30 menit; hitungSetelahGrace false (31 menit -> 3 blok); blokMenit 30 dan nominal kustom; hasil selalu integer.

**Acceptance Criteria:**

- [ ] Semua hijau dengan coverage lib/penalty.ts > 90%.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### PEN-004 — Simpan hasil ke PenaltyLog (menit, tier, nominal)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.1 — Kalkulator denda 💰 ⚠️
- **Estimate:** 3h
- **Dependencies:** PEN-003
- **Status:** [ ] Not Started

**Description:**

Buat fungsi catatDenda(tx, bookingId, hasilDenda, alasanOverride?) yang meng-upsert PenaltyLog (bookingId unik): telatMenit, tierLabel, dendaNominal, alasanOverride. Dokumentasikan bahwa PenaltyLog hanya satu per booking (bila check-out dikoreksi, update baris yang sama dan tulis AuditLog "penalty.update" dengan before/after).

**Acceptance Criteria:**

- [ ] Pemanggilan dua kali tidak membuat baris ganda.

---

#### CHK-001 — Action checkOut: input jam kembali aktual, kondisi unit, catatan

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** ADM-007, PEN-004
- **Status:** [ ] Not Started

**Description:**

Buat Server Action checkOut(bookingId, { dikembalikanAt, kondisi, biayaKerusakan?, catatan? }) di server/actions/admin-booking.ts.

requireRole("OWNER","STAFF"); hanya dari status ACTIVE atau LATE.
dikembalikanAt default now; tidak boleh < diambilAt dan tidak boleh di masa depan (toleransi 5 menit); zod untuk semua input; biayaKerusakan int >= 0.
Dialog UI di halaman detail: input waktu kembali (WIB), kondisi unit (baik/lecet/rusak), biaya kerusakan, catatan, dan tampilan pratinjau denda + rincian pengembalian deposit + sisa buffer + peringatan buffer tipis/habis (bila ada booking berikutnya) sebelum konfirmasi.

**Acceptance Criteria:**

- [ ] Pratinjau menampilkan denda yang sama dengan hasil akhir.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CHK-002 — Hitung denda, tampilkan sebelum konfirmasi, izinkan override dengan alasanOverride (OWNER)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** CHK-001
- **Status:** [ ] Not Started

**Description:**

Di checkOut hitung denda dengan hitungDenda(booking.selesai, dikembalikanAt, fromSnapshot(snapshot)). OWNER boleh override nominal denda dengan dendaOverride dan alasanOverride (wajib min 5 karakter); STAFF tidak boleh override (tolak). Simpan lewat catatDenda dengan alasanOverride dan audit log "penalty.override" bila di-override.

**Acceptance Criteria:**

- [ ] Override oleh STAFF ditolak dan oleh OWNER tercatat lengkap.

---

#### CHK-003 — Potong sisa buffer saat telat; majukan bufferSampai hanya saat pulang awal (N11)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** CHK-002
- **Status:** [ ] Not Started

**Description:**

Atur buffer saat check-out dalam SATU transaksi (aturan buffer dan peringatan buffer tipis di Konteks Proyek). Kolom selesai TIDAK diubah (tetap jadwal kontrak). Contoh: selesai 14:00, buffer 2 jam -> bufferSampai 16:00.

Pulang lebih awal (11:00): bufferSampai = dikembalikanAt + buffer = 13:00 (dari snapshot: bufferJam atau bufferAntarJemput), sehingga slot 13:00-16:00 terbuka. Update kolom bufferSampai (periode ikut berubah otomatis); rentang yang mengecil tidak mungkin melanggar constraint.

Pulang tepat waktu (14:00): bufferSampai tidak berubah.

Pulang telat DALAM GRACE (selesai < dikembalikanAt <= selesai + graceMenit, mis. 14:10 atau 14:15 dengan grace 15 menit):

- bufferSampai TIDAK diubah dan tidak diperpanjang.
- sisaBuffer = max(0, bufferSampai - dikembalikanAt), mis. 14:10 -> sisa 1 jam 50 menit.
- Denda = Rp 0 (karena dalam masa toleransi); lateCount TIDAK bertambah.
- Tetap tulis ke hasil check-out agar UI bisa menampilkan sisa buffer yang benar.

Pulang telat > GRACE (berapa pun menitnya, mis. 14:16, 15:00, 16:30):

- bufferSampai TIDAK diubah dan tidak diperpanjang.
- sisaBuffer = max(0, bufferSampai - dikembalikanAt), mis. 15:00 -> sisa 60 menit, "buffer terpotong 2 jam menjadi 1 jam".
- Denda dihitung per blok menit oleh hitungDenda (PEN-001); lateCount += 1 (lihat CHK-004).
- Buffer terpotong tidak mengubah nominal denda; denda dan buffer adalah dua konsekuensi terpisah.

Pulang telat sampai buffer HABIS (dikembalikanAt >= bufferSampai, mis. 16:30 dengan bufferSampai 16:00):

- sisaBuffer = 0.
- Jangan gagalkan check-out; check-out tetap BERHASIL (karena bufferSampai tidak pernah naik, tidak ada pelanggaran EXCLUDE).

Peringatan buffer tipis/habis (konstanta BUFFER_TIPIS_MENIT = 30 di satu tempat, mis. src/lib/constants.ts). Berlaku untuk SEMUA kasus di atas, bukan hanya telat:

- Cari booking berikutnya di unit yang sama: status PENDING/CONFIRMED dengan mulai terdekat setelah mulai booking ini (satu query terindeks, maks 1 baris).
- jedaKeBerikut = mulai booking berikutnya - dikembalikanAt (menit). EXCLUDE menjamin mulai >= bufferSampai, sehingga jedaKeBerikut >= sisaBuffer.
- peringatanBuffer = "KRITIS" bila jedaKeBerikut <= 0; "TIPIS" bila 0 < jedaKeBerikut < BUFFER_TIPIS_MENIT; null bila jedaKeBerikut >= BUFFER_TIPIS_MENIT atau tidak ada booking berikutnya.
- Kembalikan dari checkOut: { sisaBuffer, jedaKeBerikut, peringatanBuffer, bookingBerikut: { id, kode, mulai } | null }.
- Tulis AuditLog "booking.buffer_habis" (KRITIS) atau "booking.buffer_tipis" (TIPIS) berisi dikembalikanAt, id booking berikutnya, dan jedaKeBerikut. Tanpa peringatan: tidak ada audit.
- UI: banner di dialog check-out dan halaman detail dengan nama pelanggan dan jam mulai booking berikutnya, tombol "Relokasi booking berikutnya" (US-4.5) dan tombol WhatsApp ke penyewa berikutnya. KRITIS berwarna merah, TIPIS kuning.

Denda keterlambatan dihitung terpisah oleh hitungDenda (PEN-001); buffer terpotong tidak mengubah nominal denda.

**Acceptance Criteria:**

- [ ] Pulang lebih awal memajukan `bufferSampai` (slot terbuka lebih cepat), tepat waktu tidak mengubah, telat berapa pun menitnya tidak mengubah tetapi sisa buffer terpotong dan terhitung benar sesuai contoh di deskripsi.
- [ ] Telat dalam grace: denda Rp 0, `lateCount` tidak bertambah, `bufferSampai` tetap, `sisaBuffer` benar.
- [ ] Telat sampai buffer habis: check-out tetap SUKSES (tidak ada error 500, tidak ada pelanggaran `23P01`), denda tetap dihitung, `sisaBuffer` 0.
- [ ] `peringatanBuffer` = `"KRITIS"` bila ada booking berikutnya dan `jedaKeBerikut <= 0` (AuditLog `booking.buffer_habis`); `"TIPIS"` bila ada booking berikutnya dan `0 < jedaKeBerikut < 30` (AuditLog `booking.buffer_tipis`); selain itu `null` tanpa audit. Tepat 30 menit tidak memicu peringatan.
- [ ] Banner peringatan tampil di dialog check-out dan halaman detail dengan tautan relokasi dan WhatsApp ke penyewa berikutnya.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CHK-004 — Update Customer.lateCount, status RETURNED → COMPLETED, unit READY

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** CHK-003
- **Status:** [ ] Not Started

**Description:**

Selesaikan siklus status di checkOut: ubahStatus -> RETURNED, set dikembalikanAt, Unit.status = READY (atau MAINTENANCE bila kondisi "rusak"), Customer.lateCount += 1 bila telatMenit > graceMenit dan denda tidak dibebaskan (lihat US-5.4), dan bila tidak ada tagihan tersisa (denda + kerusakan <= deposit dan semuanya diselesaikan dari deposit) lanjutkan ke COMPLETED; bila ada tagihan yang harus dibayar pelanggan, biarkan RETURNED hingga admin menekan settleBooking (Server Action kecil yang menandai pelunasan dan mengubah ke COMPLETED).

Semua langkah dalam satu prisma.$transaction dengan audit log.

**Acceptance Criteria:**

- [ ] Alur dengan/ tanpa denda berakhir pada status yang benar.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CHK-005 — Proses refund deposit (potong denda/kerusakan)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** CHK-004
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/settlement.ts::hitungPenyelesaian({ depositNominal, dendaNominal, biayaKerusakan }) (murni) -> { potongDeposit, depositDikembalikan, kekurangan }. Aturan: tagihan = denda + kerusakan; potongDeposit = min(deposit, tagihan); depositDikembalikan = deposit - potongDeposit; kekurangan = tagihan - potongDeposit. Tampilkan hasilnya di dialog check-out dan halaman detail. Tulis unit test (deposit > tagihan, = tagihan, < tagihan, tagihan 0).

**Acceptance Criteria:**

- [ ] Tes hijau dan UI menampilkan angka yang sama.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CHK-006 — Integration test: check-out telat memotong buffer (tidak memperpanjang) dan memberi peringatan buffer tipis/habis

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.2 — Flow check-out ⚠️
- **Estimate:** 2.5h
- **Dependencies:** CHK-005
- **Status:** [ ] Not Started

**Description:**

Tulis tests/integration/checkout.test.ts dengan setup: unit U, booking A selesai 14:00 WIB, buffer 2 jam, bufferSampai awal 16:00, grace 15 menit, denda per blok 15 menit Rp 5.000. Booking berikutnya (B) di unit U diatur per kasus. Kasus:

1. Check-out tepat waktu (14:00) -> RETURNED/COMPLETED, denda 0, bufferSampai tetap 16:00, sisaBuffer 120 menit.

2. Check-out TELAT DALAM GRACE (14:10) -> denda Rp 0, lateCount TIDAK bertambah, bufferSampai tetap 16:00, sisaBuffer 110 menit.

3. Check-out tepat di batas grace (14:15) -> denda Rp 0, lateCount TIDAK bertambah, bufferSampai tetap 16:00, sisaBuffer 105 menit.

4. Check-out 1 menit lewat grace (14:16) -> denda 1 blok Rp 5.000, lateCount +1, bufferSampai tetap 16:00, sisaBuffer 104 menit.

5. Check-out terlambat 60 menit (15:00), B mulai 16:00 -> denda 3 blok Rp 15.000, lateCount +1, bufferSampai tetap 16:00, sisaBuffer 60 menit, jedaKeBerikut 60 -> peringatanBuffer null.

6. Check-out terlambat 150 menit (16:30) padahal B sudah mulai 16:00 -> check-out A SUKSES (tidak gagal karena EXCLUDE), denda 9 blok Rp 45.000, sisaBuffer 0, bufferSampai tetap 16:00, jedaKeBerikut -30 -> peringatanBuffer "KRITIS", ada AuditLog "booking.buffer_habis", dan booking B TIDAK ter-rollback (tetap valid di DB).

7. Check-out 15:50, B mulai 16:00 -> denda 7 blok Rp 35.000, sisaBuffer 10 menit, jedaKeBerikut 10 -> peringatanBuffer "TIPIS", ada AuditLog "booking.buffer_tipis".

8. Check-out 15:50, B mulai 18:00 -> sisaBuffer 10 menit tetapi jedaKeBerikut 130 -> peringatanBuffer null, tanpa audit buffer. Ulangi tanpa booking B sama sekali -> peringatanBuffer null.

9. Batas 30 menit: check-out 15:30 dengan B mulai 16:00 -> jedaKeBerikut 30 -> peringatanBuffer null; check-out 15:31 -> jedaKeBerikut 29 -> "TIPIS".

10. Check-out lebih awal (11:00) -> bufferSampai dimajukan ke 13:00, slot 13:00-16:00 terbuka; cekBentrok pada rentang 13:30 sekarang false padahal sebelumnya true; jedaKeBerikut terhadap B 16:00 = 300 -> peringatanBuffer null.

11. Check-out dari status tidak valid (PENDING/CONFIRMED) ditolak.

12. Dua check-out paralel pada booking yang sama -> hanya satu berhasil.

**Acceptance Criteria:**

- [ ] Semua 12 kasus hijau.
- [ ] Tidak ada pelanggaran EXCLUDE (`23P01`) di kasus mana pun, khususnya kasus 6 (telat sampai buffer habis).
- [ ] `bufferSampai` di DB **tidak pernah** > `bufferSampai` awal (tidak ada perpanjangan).
- [ ] `sisaBuffer` konsisten dengan `max(0, bufferSampai − dikembalikanAt)` di semua kasus.
- [ ] `peringatanBuffer` `"KRITIS"` **hanya** saat ada booking berikutnya dan `jedaKeBerikut <= 0`; `"TIPIS"` **hanya** saat ada booking berikutnya dan `0 < jedaKeBerikut < 30`; tanpa booking berikutnya selalu `null`.
- [ ] AuditLog `booking.buffer_habis` / `booking.buffer_tipis` hanya tercatat untuk KRITIS / TIPIS.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EXT-001 — validasiExtend(booking, tambahanJam) di lib/availability.ts: cek bentrok dengan booking…

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.3 — Flow extend
- **Estimate:** 2.5h
- **Dependencies:** ADM-007
- **Status:** [ ] Not Started

**Description:**

Implementasikan src/lib/availability.ts::validasiExtend(booking, tambahanJam, now) dengan semua pengecekan: tambahanJam int 1..72 dan <= sisa batas maxDurasiHari (dari snapshot); status booking ACTIVE/LATE (atau CONFIRMED sebelum diambil bila diizinkan); selesaiBaru = selesai + tambahanJam; bufferSampaiBaru dihitung dengan buffer snapshot; cekBentrok(unitId, mulai, bufferSampaiBaru, {excludeBookingId}) tidak boleh bentrok (booking berikutnya, blackout, maintenance). Kembalikan {ok, selesaiBaru, bufferSampaiBaru, hargaTambahan, alasanTolak?} dengan hargaTambahan = hitungHarga(mulai, selesaiBaru, snapshot).total - totalHarga (minimal 0).

**Acceptance Criteria:**

- [ ] Tes di EXT-005 lolos.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EXT-002 — Action requestExtend + endpoint POST /api/extend (rate limit)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.3 — Flow extend
- **Estimate:** 2.5h
- **Dependencies:** EXT-001
- **Status:** [ ] Not Started

**Description:**

Buat requestExtend(kode, noHp, tambahanJam) (Server Action publik + route POST /api/extend yang membungkusnya): verifikasi kode+noHp, rate limit 5/jam per booking, Turnstile bila dari publik, panggil validasiExtend (pra-cek), lalu buat ExtendRequest PENDING dengan tambahanJam dan hargaTambahan (hitungan sementara). Hanya satu request PENDING per booking. Tampilkan hasil/pesan di halaman cek-booking (aktifkan tombol "Ajukan Perpanjangan" dari TRK-002).

**Acceptance Criteria:**

- [ ] Pelanggan bisa mengajukan extend dan admin melihatnya di dashboard (kategori request extend).
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EXT-003 — Action decideExtend (approve/reject + alasanTolak) dengan update selesai, bufferSampai, harga…

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.3 — Flow extend
- **Estimate:** 2.5h
- **Dependencies:** EXT-002
- **Status:** [ ] Not Started

**Description:**

Buat decideExtend(extendId, { keputusan: "APPROVE"|"REJECT", alasanTolak? }) (OWNER/STAFF). APPROVE: dalam satu transaksi jalankan ulang validasiExtend (data bisa berubah sejak pengajuan), update Booking.selesai, bufferSampai, totalHarga (+hargaTambahan), update ExtendRequest (status APPROVED, decidedAt, hargaTambahan final); tangkap isExclusionViolation -> kembalikan "SLOT_BENTROK" tanpa perubahan. REJECT: alasanTolak wajib min 5 karakter, status REJECTED. Tampilkan antrian extend di dashboard/detail booking dengan tombol setuju/tolak.

**Acceptance Criteria:**

- [ ] Approve memperbarui jadwal dan harga, reject menyimpan alasan.

---

#### EXT-004 — Audit log penolakan extend

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.3 — Flow extend
- **Estimate:** 2.5h
- **Dependencies:** EXT-003
- **Status:** [ ] Not Started

**Description:**

Catat audit: "extend.request", "extend.approve", "extend.reject" (alasanTolak di after), before/after untuk selesai, bufferSampai, totalHarga. Penolakan extend wajib tercatat sesuai PRD (Keamanan: Audit).

**Acceptance Criteria:**

- [ ] Tiap keputusan menghasilkan satu entri audit yang bisa dilihat di /admin/audit.

---

#### EXT-005 — Unit test validasiExtend + integration test race condition (extend vs booking baru)

- **Priority:** P0
- **Sprint:** Sprint 4
- **Story:** US-5.3 — Flow extend
- **Estimate:** 2.5h
- **Dependencies:** EXT-004
- **Status:** [ ] Not Started

**Description:**

Tulis tests: unit test validasiExtend (tanpa DB, dengan fungsi cek bentrok yang di-inject): lolos, bentrok booking berikutnya, melewati maxDurasiHari, jam tidak valid, status tidak valid; hargaTambahan sesuai (mis. extend 3 jam dari booking 12 jam). Tes integrasi: extend vs booking baru yang dibuat paralel pada slot sesudahnya -> tepat satu menang dan data konsisten.

**Acceptance Criteria:**

- [ ] Semua hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FM-001 — Action forceMajeure (OWNER): bebaskan/kurangi denda dengan alasan wajib

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-5.4 — Force majeure
- **Estimate:** 2h
- **Dependencies:** CHK-006
- **Status:** [ ] Not Started

**Description:**

Buat Server Action forceMajeure(bookingId, { persenBebas (0-100), alasan }) khusus OWNER: hanya pada booking yang sudah di-check-out (RETURNED/COMPLETED) atau saat check-out; mengurangi denda sebesar persenBebas (nominal baru = round(denda x (100-persenBebas)/100)); alasan wajib min 10 karakter; update PenaltyLog.dendaNominal dan alasanOverride; hitung ulang penyelesaian (deposit/kekurangan).

**Acceptance Criteria:**

- [ ] Denda berubah sesuai persen dan penyelesaian ikut dihitung ulang.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### FM-002 — Catat di PenaltyLog.alasanOverride + audit log

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-5.4 — Force majeure
- **Estimate:** 2h
- **Dependencies:** FM-001
- **Status:** [ ] Not Started

**Description:**

Catat audit "penalty.force_majeure" (before/after nominal, persenBebas, alasan, actorId) dan tampilkan label "Force majeure" + alasan di halaman detail booking dan invoice.

**Acceptance Criteria:**

- [ ] Jejak audit lengkap dan label tampil.

---

#### FM-003 — Tidak menambah lateCount bila force majeure disetujui

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-5.4 — Force majeure
- **Estimate:** 2h
- **Dependencies:** FM-002
- **Status:** [ ] Not Started

**Description:**

Atur dampak ke Customer.lateCount: bila force majeure membebaskan 100% denda, kurangi lateCount yang ditambahkan oleh check-out booking itu (minimal 0) dan jangan hitung booking itu sebagai keterlambatan. Bila sebagian, lateCount tetap. Tulis tes integrasi untuk kedua kasus.

**Acceptance Criteria:**

- [ ] Tes hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

### Epic 6 — Notifikasi & Dokumen

**Story dalam sprint ini:** US-6.1 (4 pt).

#### EML-001 — Setup Resend + React Email

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-6.1 — Email transaksional
- **Estimate:** 3h
- **Dependencies:** ADM-007
- **Status:** [ ] Not Started

**Description:**

Siapkan email: pasang resend dan @react-email/components; buat src/lib/email.ts dengan klien Resend (RESEND_API_KEY, EMAIL_FROM) dan fungsi sendEmail({to, subject, react}) yang mengembalikan {ok, id?, error?} dan TIDAK melempar error ke pemanggil. Siapkan folder src/emails/ dengan layout dasar (logo teks, footer kontak, font aman email) dan script preview pnpm email:dev.

**Acceptance Criteria:**

- [ ] Email uji terkirim ke alamat sendiri dari development.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EML-002 — Template: booking dibuat, DP dikonfirmasi, pengingat pengambilan, pengingat pengembalian, extend…

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-6.1 — Email transaksional
- **Estimate:** 3h
- **Dependencies:** EML-001
- **Status:** [ ] Not Started

**Description:**

Buat template React Email di src/emails/: BookingDibuat (kode, jadwal WIB, total, DP, batas waktu DP, tautan cek-booking), DPDikonfirmasi, PengingatPengambilan (H-1 / beberapa jam sebelum), PengingatPengembalian, ExtendDisetujui/ExtendDitolak (alasan), BookingDibatalkan (nominal refund), RingkasanCheckout (denda, kerusakan, deposit dikembalikan/kekurangan), UnitDirelokasi. Semua teks Bahasa Indonesia, waktu dalam WIB, nominal berformat Rupiah (helper formatRupiah di lib/utils.ts).

**Acceptance Criteria:**

- [ ] Setiap template tampil benar di preview dan di versi plain-text.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EML-003 — lib/email.ts dengan retry dan logging error (jangan memblokir transaksi booking)

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-6.1 — Email transaksional
- **Estimate:** 3h
- **Dependencies:** EML-002
- **Status:** [ ] Not Started

**Description:**

Hubungkan pengiriman email ke event: panggil sendEmail SETELAH transaksi sukses (createBooking, confirmDP, cancelBooking, decideExtend, checkOut, relocateBooking — ganti stub notifyRelocation). Pengiriman tidak boleh memblokir atau menggagalkan transaksi: jalankan dengan try/catch, log kegagalan ke Sentry (tanpa data pribadi), dan simpan retry sederhana (satu kali ulang setelah 2 detik). Lewati bila customer.email kosong. Untuk pengingat terjadwal sediakan fungsi kirimPengingat() yang dipanggil oleh cron (ditambah di US-6.3 bila diperlukan).

**Acceptance Criteria:**

- [ ] Tiap event mengirim email yang benar dan kegagalan Resend tidak membuat aksi admin gagal.

---

#### EML-004 — Verifikasi domain (SPF/DKIM), uji pada Gmail/Outlook

- **Priority:** P1
- **Sprint:** Sprint 4
- **Story:** US-6.1 — Email transaksional
- **Estimate:** 3h
- **Dependencies:** EML-003
- **Status:** [ ] Not Started

**Description:**

Verifikasi domain pengirim di Resend (DNS: SPF, DKIM, dan DMARC), set EMAIL_FROM memakai domain terverifikasi, kirim email uji ke Gmail dan Outlook, pastikan tidak masuk spam (cek header), tautan memakai NEXT_PUBLIC_BASE_URL produksi. Dokumentasikan langkah DNS di README.

**Acceptance Criteria:**

- [ ] Email uji lolos SPF/DKIM/DMARC di Gmail ("Show original").

---

## Sprint 5 — Dokumen, Cron & Keamanan

**Sprint Goal:** Invoice PDF, cron job, upload aman, manajemen pelanggan, anti-spam, dan S&K siap.

---

### Epic 6 — Notifikasi & Dokumen

**Story dalam sprint ini:** US-6.2 (4 pt); US-6.3 (2 pt).

#### INV-001 — Template invoice @react-pdf/renderer (rincian harga, diskon, denda, deposit)

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-6.2 — Invoice PDF
- **Estimate:** 3h
- **Dependencies:** CHK-006
- **Status:** [ ] Not Started

**Description:**

Buat template invoice dengan @react-pdf/renderer di src/pdf/InvoiceDocument.tsx (komponen React, ukuran A4, font bawaan atau font TTF yang di-bundle).

Isi: header usaha (nama, alamat, kontak dari SystemSetting), kode booking dan tanggal terbit (WIB), data pelanggan (nama, noHp dimasking sebagian), unit (tipe, plat), jadwal, tabel rincian (baris dari hitungHarga.rincian, diskon, biaya luar jam, perpanjangan yang disetujui, denda + label force majeure, biaya kerusakan), total, DP dibayar, deposit, sisa/kekurangan/pengembalian, dan catatan S&K singkat.
Semua data dari DB (Booking + snapshot), bukan dihitung ulang dengan policy terbaru. Format Rupiah konsisten.

**Acceptance Criteria:**

- [ ] PDF contoh untuk booking dengan dan tanpa denda tampil rapi dalam 1 halaman.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### INV-002 — Endpoint unduh invoice (otorisasi via kode + no HP atau sesi admin)

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-6.2 — Invoice PDF
- **Estimate:** 3h
- **Dependencies:** INV-001
- **Status:** [ ] Not Started

**Description:**

Buat endpoint unduh invoice: route GET /api/invoice/[kode] (runtime nodejs).

Otorisasi: (a) sesi admin, atau (b) kode + noHp yang cocok (query/POST body) dari halaman cek-booking; selain itu 404.
Rate limit 10/menit per IP. Header Content-Type application/pdf dan Content-Disposition inline dengan nama invoice-<kode>.pdf. Jangan cache publik (Cache-Control private, no-store).
Tambahkan tombol "Unduh Invoice" di halaman cek-booking dan detail booking admin.

**Acceptance Criteria:**

- [ ] PDF terunduh untuk pemilik sah dan 404 untuk kombinasi salah.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### INV-003 — Lampirkan di email konfirmasi/check-out

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-6.2 — Invoice PDF
- **Estimate:** 3h
- **Dependencies:** INV-002
- **Status:** [ ] Not Started

**Description:**

Lampirkan invoice ke email: pada konfirmasi DP (invoice/ringkasan awal) dan check-out (invoice final), render PDF ke Buffer (renderToBuffer) dan kirim sebagai attachment lewat Resend (maks 5 MB). Bila render gagal, kirim email tanpa lampiran dan catat error ke Sentry. Jangan memblokir transaksi.

**Acceptance Criteria:**

- [ ] Email check-out membawa PDF yang bisa dibuka dengan isi benar.

---

#### INV-004 — Format Rupiah & tanggal WIB konsisten

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-6.2 — Invoice PDF
- **Estimate:** 3h
- **Dependencies:** INV-003
- **Status:** [ ] Not Started

**Description:**

Rapikan format: buat src/lib/format.ts dengan formatRupiah(n) ("Rp 1.250.000", tanpa desimal), formatTanggalWIB, formatDurasi (mis. "1 hari 3 jam") dan pakai di UI, email, dan PDF agar konsisten. Tulis unit test untuk angka 0, ribuan, jutaan, negatif (refund/koreksi), dan tanggal lintas tengah malam WIB.

**Acceptance Criteria:**

- [ ] Tidak ada format uang/tanggal yang ditulis manual di komponen lain.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CRON-001 — GET /api/cron/pending-timeout: batalkan PENDING yang melewati pendingTimeoutMenit (idempoten)

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-6.3 — Cron jobs
- **Estimate:** 1h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Buat GET /api/cron/pending-timeout (src/app/api/cron/pending-timeout/route.ts, runtime nodejs, dynamic = "force-dynamic").

Cek header Authorization: Bearer ${CRON_SECRET} (timing-safe); salah -> 401.
Batalkan semua booking PENDING yang createdAt + pendingTimeoutMenit (dari snapshot masing-masing) < now: gunakan ubahStatus -> CANCELLED dengan actorType SYSTEM dan alasan "timeout DP", dalam batch kecil (maks 100 per eksekusi), idempoten (aman dijalankan ulang/paralel — pakai updateMany dengan where status PENDING lalu audit hanya untuk yang berhasil).
Pada eksekusi yang sama tandai ACTIVE yang now > selesai + graceMenit (snapshot) sebagai LATE (audit "booking.late").
Kembalikan JSON {dibatalkan, ditandaiLate}.

**Acceptance Criteria:**

- [ ] Booking PENDING kedaluwarsa menjadi CANCELLED dan slotnya terbuka kembali.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CRON-002 — GET /api/cron/cleanup-files: hapus KTP/SIM > 90 hari di S3 dan kosongkan referensi (N9)

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-6.3 — Cron jobs
- **Estimate:** 1h
- **Dependencies:** CRON-001
- **Status:** [ ] Not Started

**Description:**

Buat GET /api/cron/cleanup-files: autentikasi sama; cari Customer/Booking dengan dokumen KTP/SIM yang diunggah > 90 hari lalu (butuh tanggal upload: tambahkan kolom dokumenUploadedAt (timestamptz, opsional) di Customer lewat migrasi baru dan isi saat upload), hapus objek S3 (DeleteObject), lalu set ktpUrl/simUrl = null dan tulis AuditLog "customer.docs_purged" (tanpa isi file). Lewati customer yang punya booking ACTIVE/LATE/RETURNED yang belum COMPLETED. Batch 100 per eksekusi, idempoten, tahan error S3 (lanjut ke item berikutnya, laporkan jumlah gagal ke Sentry).

**Acceptance Criteria:**

- [ ] Dokumen > 90 hari terhapus dari bucket dan referensi di DB menjadi null.

---

#### CRON-003 — Verifikasi Authorization: Bearer ${CRON_SECRET} di semua route cron

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-6.3 — Cron jobs
- **Estimate:** 1h
- **Dependencies:** CRON-002
- **Status:** [ ] Not Started

**Description:**

Buat helper src/lib/cron-auth.ts::verifyCronRequest(req) yang membandingkan header Authorization dengan Bearer ${CRON_SECRET} memakai crypto.timingSafeEqual dan dipakai oleh SEMUA route /api/cron/*. Tulis tes: header benar, salah, kosong, panjang berbeda, tanpa "Bearer".

**Acceptance Criteria:**

- [ ] Tidak ada route cron yang bisa dipanggil tanpa secret.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CRON-004 — vercel.json (*/5 * * * * dan 0 3 * * *); cek batasan plan Vercel

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-6.3 — Cron jobs
- **Estimate:** 1h
- **Dependencies:** CRON-003
- **Status:** [ ] Not Started

**Description:**

Buat/lengkapi vercel.json: { "crons": [ { "path": "/api/cron/pending-timeout", "schedule": "*/5 * * * *" }, { "path": "/api/cron/cleanup-files", "schedule": "0 3 * * *" } ] }. Catatan: cron 03:00 UTC = 10:00 WIB; ganti ke "0 20 * * *" (03:00 WIB) bila ingin dini hari. Periksa batas frekuensi cron pada plan Vercel yang dipakai (plan Hobby membatasi cron hanya harian); bila tidak mendukung */5, dokumentasikan alternatif (upgrade, atau pemicu eksternal seperti cron-job.org dengan header Authorization).

**Acceptance Criteria:**

- [ ] Cron terdaftar di dashboard Vercel dan terpicu sesuai jadwal.

---

#### CRON-005 — Test cron: tidak membatalkan booking yang sudah CONFIRMED

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-6.3 — Cron jobs
- **Estimate:** 1h
- **Dependencies:** CRON-004
- **Status:** [ ] Not Started

**Description:**

Tulis tes integrasi cron: (1) PENDING yang melewati timeout menjadi CANCELLED dan slot terbuka; (2) CONFIRMED tidak pernah dibatalkan oleh cron; (3) PENDING belum timeout tidak berubah; (4) menjalankan cron dua kali berurutan/paralel tidak membuat audit ganda; (5) ACTIVE yang melewati selesai + grace menjadi LATE; (6) cleanup-files menghapus dokumen > 90 hari saja (mock S3).

**Acceptance Criteria:**

- [ ] Semua hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

### Epic 7 — Keamanan & Pelanggan

**Story dalam sprint ini:** US-7.1 (4 pt); US-7.2 (4 pt); US-7.3 (2 pt); US-7.4 (2 pt).

#### CUS-001 — Daftar pelanggan + pencarian (nama/no HP) + riwayat booking

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.1 — Manajemen pelanggan
- **Estimate:** 3h
- **Dependencies:** ADM-007
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/pelanggan: daftar pelanggan (nama, noHp, jumlah booking, lateCount, badge blacklist), pencarian by nama/noHp (ilike), filter (blacklist saja, lateCount >= 3), pagination 20, dan halaman detail dengan riwayat booking (tautan ke detail booking). Query di server/queries/customer.ts.

**Acceptance Criteria:**

- [ ] Pencarian dan filter bekerja dengan data seed.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CUS-002 — Blacklist/un-blacklist dengan alasan + audit log

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.1 — Manajemen pelanggan
- **Estimate:** 3h
- **Dependencies:** CUS-001
- **Status:** [ ] Not Started

**Description:**

Buat Server Action setBlacklist(customerId, { isBlacklisted, alasan }) (OWNER/STAFF; alasan wajib min 5 karakter). Update Customer.isBlacklisted, tulis AuditLog "customer.blacklist"/"customer.unblacklist" dengan alasan. Tombol di halaman detail pelanggan dengan dialog konfirmasi. Pastikan createBooking menolak customer blacklist (sudah di BKG-004) dan booking aktif milik customer yang di-blacklist tidak dibatalkan otomatis (tampilkan peringatan ke admin).

**Acceptance Criteria:**

- [ ] Blacklist/unblacklist tercatat dan efeknya terlihat di createBooking.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### CUS-003 — Aturan lateCount (N8) dan tampilan peringatan di form booking admin

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.1 — Manajemen pelanggan
- **Estimate:** 3h
- **Dependencies:** CUS-002
- **Status:** [ ] Not Started

**Description:**

Tampilkan peringatan keterlambatan: bila Customer.lateCount >= 3, tampilkan banner kuning "Pelanggan ini sudah terlambat N kali" di form booking manual admin, halaman detail booking, dan detail pelanggan (BUKAN blacklist otomatis; konstanta ambang LATE_WARNING_THRESHOLD = 3 di satu tempat). Tambahkan tombol cepat "Blacklist" pada banner untuk OWNER/STAFF.

**Acceptance Criteria:**

- [ ] Banner muncul tepat pada lateCount 3 dan tidak pada 2.

---

#### CUS-004 — Tampilan dokumen identitas via signed URL (hanya admin)

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.1 — Manajemen pelanggan
- **Estimate:** 3h
- **Dependencies:** CUS-003
- **Status:** [ ] Not Started

**Description:**

Tampilkan dokumen identitas dengan aman: Server Action getDokumenUrl(customerId, "ktp"|"sim") (OWNER/STAFF) yang membuat signed GET URL S3 berlaku 5 menit (ResponseContentDisposition inline) dan menulis AuditLog "customer.docs_view" (siapa, kapan). Tombol "Lihat KTP/SIM" membuka URL di tab baru. Jangan pernah menyertakan URL/dokumen dalam HTML awal, log, atau Sentry.

**Acceptance Criteria:**

- [ ] URL kedaluwarsa setelah 5 menit dan setiap akses tercatat di audit.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### UPL-001 — lib/s3.ts klien S3-compatible (Wasabi)

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-7.2 — Upload aman 🔒
- **Estimate:** 2.5h
- **Dependencies:** SETUP-011
- **Status:** [ ] Not Started

**Description:**

Buat src/lib/s3.ts memakai @aws-sdk/client-s3 dan @aws-sdk/s3-request-presigner dengan endpoint S3-compatible (Wasabi): S3_ENDPOINT, S3_REGION, S3_BUCKET, kunci dari env, forcePathStyle sesuai kebutuhan. Fungsi: buatPresignedPut(key, contentType, maxBytes), buatPresignedGet(key, expiresSec=300), hapusObjek(key), headObjek(key). Key acak: ktp/<uuid>.<ext> dan sim/<uuid>.<ext> (tanpa nama file asli).

**Acceptance Criteria:**

- [ ] Unggah dan unduh uji lewat presigned URL berhasil di bucket uji.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### UPL-002 — POST /api/upload: validasi MIME + magic bytes, maks 2 MB, presigned URL, nama file acak

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-7.2 — Upload aman 🔒
- **Estimate:** 2.5h
- **Dependencies:** UPL-001
- **Status:** [ ] Not Started

**Description:**

Hardening POST /api/upload: (1) rate limit 10/menit per IP + Turnstile pada penggunaan publik; (2) body zod {jenis: "ktp"|"sim", contentType, ukuran}; hanya image/jpeg, image/png, image/webp, application/pdf; ukuran <= 2 MB; (3) kembalikan presigned PUT dengan batas ukuran dan fileKey; (4) endpoint kedua POST /api/upload/verifikasi {fileKey} yang mengambil 16 byte pertama objek dari S3 dan memvalidasi magic bytes (JPEG FFD8FF, PNG 89504E47, WEBP RIFF....WEBP, PDF 25504446) serta ukuran sebenarnya via headObjek; bila tidak cocok -> hapus objek dan kembalikan error. createBooking hanya menerima fileKey yang sudah lolos verifikasi (tandai di tabel/cache atau verifikasi ulang di createBooking).

**Acceptance Criteria:**

- [ ] File .exe yang diganti nama menjadi .jpg ditolak.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### UPL-003 — Bucket privat; akses lewat signed URL kedaluwarsa 5 menit

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-7.2 — Upload aman 🔒
- **Estimate:** 2.5h
- **Dependencies:** UPL-002
- **Status:** [ ] Not Started

**Description:**

Pastikan bucket privat dan akses lewat signed URL: konfigurasi bucket tanpa public-read (dokumentasikan setting Wasabi), CORS hanya mengizinkan PUT dari domain situs, lifecycle rule opsional untuk objek > 100 hari sebagai pengaman, dan uji bahwa URL objek tanpa signature mengembalikan 403. Signed GET berlaku 5 menit dan hanya dibuat di server (CUS-004).

**Acceptance Criteria:**

- [ ] Akses langsung ke objek tanpa tanda tangan ditolak.

---

#### UPL-004 — Rate limit upload + Turnstile

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-7.2 — Upload aman 🔒
- **Estimate:** 2.5h
- **Dependencies:** UPL-003
- **Status:** [ ] Not Started

**Description:**

Pasang rate limit dan Turnstile khusus upload, serta cegah objek yatim.

/api/upload dan /api/upload/verifikasi memakai rateLimit (10/menit per IP, maks 20 upload per IP per hari, maks 3 file per sesi form) dan verifikasi Turnstile (verifyTurnstile) pada penggunaan publik; permintaan dari sesi admin dikecualikan dari Turnstile.
Objek diunggah dulu ke key sementara tmp/<uuid> dan dipindahkan (CopyObject lalu Delete) ke ktp/ atau sim/ saat createBooking sukses; objek tmp/ yang lebih dari 24 jam dihapus oleh cron cleanup-files (CRON-002).

**Acceptance Criteria:**

- [ ] Upload tanpa Turnstile ditolak di production, limit teruji, dan objek tmp/ lama terhapus oleh cron.

---

#### UPL-005 — Test: file berekstensi palsu ditolak, file terlalu besar ditolak

- **Priority:** P0
- **Sprint:** Sprint 5
- **Story:** US-7.2 — Upload aman 🔒
- **Estimate:** 2.5h
- **Dependencies:** UPL-004
- **Status:** [ ] Not Started

**Description:**

Tulis tes upload: file dengan magic bytes salah ditolak dan objek dihapus; file > 2 MB ditolak; contentType tidak diizinkan ditolak; fileKey bukan milik jenis yang benar ditolak; presigned GET kedaluwarsa. Gunakan mock S3 (aws-sdk-client-mock) untuk unit test dan satu tes manual di bucket uji.

**Acceptance Criteria:**

- [ ] Semua hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SPAM-001 — Rate limit (Upstash/in-memory) untuk booking, availability, cek-booking, login, upload

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.3 — Anti-spam
- **Estimate:** 2h
- **Dependencies:** BKG-011
- **Status:** [ ] Not Started

**Description:**

Terapkan rateLimit (lib/rate-limit.ts, Upstash di produksi) secara konsisten: createBooking 5/10 menit per IP, /api/availability 30/menit, lookupBooking 5/menit, requestExtend 5/jam per booking, /api/upload 10/menit, login 5/15 menit. Satu file konfigurasi RATE_LIMITS terpusat; respon 429 dengan header Retry-After; IP diambil dari x-forwarded-for yang tepercaya di Vercel.

**Acceptance Criteria:**

- [ ] Tiap endpoint punya limit dan teruji.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SPAM-002 — Cloudflare Turnstile di form publik

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.3 — Anti-spam
- **Estimate:** 2h
- **Dependencies:** SPAM-001
- **Status:** [ ] Not Started

**Description:**

Pasang Turnstile di semua form publik (booking, cek-booking setelah 3 kegagalan, ajukan extend) memakai komponen dan verifikasi dari BKG-009. Pastikan token tidak bisa dipakai ulang (Turnstile sudah menolak reuse) dan error pengguna ramah ("Verifikasi gagal, muat ulang halaman").

**Acceptance Criteria:**

- [ ] Request tanpa token valid ditolak di server, bukan hanya di UI.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### SPAM-003 — Batasi jumlah booking PENDING aktif per no HP

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.3 — Anti-spam
- **Estimate:** 2h
- **Dependencies:** SPAM-002
- **Status:** [ ] Not Started

**Description:**

Batasi spam booking PENDING: maksimal 2 booking PENDING aktif per noHp dan 3 per IP dalam 24 jam (simpan hitungan lewat rateLimit/Redis atau query ke DB berdasarkan noHp). Pesan error jelas "Selesaikan pembayaran DP booking sebelumnya". Pastikan konsisten dengan guard di BKG-004.

**Acceptance Criteria:**

- [ ] Percobaan ketiga ditolak dan teruji.

---

#### TNC-001 — Halaman Syarat & Ketentuan, Kebijakan Privasi, FAQ (konten dari owner)

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.4 — Halaman S&K
- **Estimate:** 2h
- **Dependencies:** POL-010
- **Status:** [ ] Not Started

**Description:**

Buat halaman statis (src/app/(public)/(static)/): syarat-ketentuan, kebijakan-privasi, faq. Konten dari owner (siapkan draf awal yang bisa diedit di file MDX/konstanta): persyaratan penyewa (KTP, SIM C, usia), alur booking/DP, aturan keterlambatan dan denda, refund/pembatalan, deposit, kerusakan/kehilangan, larangan, kontak. Tautkan dari footer dan form booking.

**Acceptance Criteria:**

- [ ] Tiga halaman dapat dibuka dan rapi di mobile.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### TNC-002 — Konten S&K selaras dengan policy denda & refund; sertakan retensi data 90 hari

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.4 — Halaman S&K
- **Estimate:** 2h
- **Dependencies:** TNC-001
- **Status:** [ ] Not Started

**Description:**

Selaraskan konten S&K dengan policy aktual: aturan denda (per blok menit) dan refund di halaman S&K dibangkitkan dari policy GLOBAL terbaru (dendaTier, graceMenit, refundH3Persen, refundH1Persen, refundNoShowPersen, depositNominal, jamBuka/jamTutup) sehingga tidak ada selisih antara teks dan aturan. Tambahkan bagian retensi data: dokumen KTP/SIM dihapus 90 hari setelah diunggah.

**Acceptance Criteria:**

- [ ] Mengubah policy mengubah angka di S&K setelah revalidate.

---

#### TNC-003 — Simpan versi S&K yang disetujui pada booking

- **Priority:** P1
- **Sprint:** Sprint 5
- **Story:** US-7.4 — Halaman S&K
- **Estimate:** 2h
- **Dependencies:** TNC-002
- **Status:** [ ] Not Started

**Description:**

Simpan persetujuan S&K pada booking: tambahkan di Booking field skVersi (string) dan skDisetujuiAt (timestamptz) lewat migrasi baru, isi saat createBooking (versi = konstanta SK_VERSION yang dinaikkan setiap S&K berubah, mis. "2026-11-01") dan tampilkan di detail booking admin.

**Acceptance Criteria:**

- [ ] Setiap booking baru memiliki versi dan waktu persetujuan S&K.

---

## Sprint 6 — Laporan, Ops & Pre-Launch

**Sprint Goal:** Laporan, feature flag, E2E/race-condition test lolos, backup teruji, siap go-live.

---

### Epic 8 — Laporan & Ops

**Story dalam sprint ini:** US-8.1 (4 pt); US-8.2 (3 pt); US-8.3 (3 pt).

#### RPT-001 — Pendapatan per hari/minggu/bulan (booking, denda, refund)

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.1 — Dashboard owner
- **Estimate:** 3h
- **Dependencies:** CHK-006
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/laporan (OWNER) bagian Pendapatan. Query server/queries/laporan.ts::pendapatan({from, to, groupBy: "hari"|"minggu"|"bulan"}) dengan SQL agregat (date_trunc pada zona Asia/Jakarta: date_trunc('day', "dikembalikanAt" AT TIME ZONE 'Asia/Jakarta')).

Komponen: sewa (totalHarga booking COMPLETED/RETURNED), denda (PenaltyLog), refund (booking CANCELLED/NO_SHOW), pendapatan bersih = sewa + denda - refund; definisikan jelas di UI tooltip. Tampilkan kartu total dan tabel/grafik (recharts atau SVG sederhana) per periode.

**Acceptance Criteria:**

- [ ] Angka cocok dengan perhitungan manual untuk data seed uji.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### RPT-002 — Utilisasi per unit/tipe (jam terpakai ÷ jam tersedia)

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.1 — Dashboard owner
- **Estimate:** 3h
- **Dependencies:** RPT-001
- **Status:** [ ] Not Started

**Description:**

Tambahkan laporan Utilisasi: per unit dan per tipe, utilisasi = jam tersewa (jumlah durasi ACTIVE..COMPLETED yang beririsan dengan rentang, dipotong ke rentang laporan) / (jam rentang x jumlah unit aktif). Tampilkan persentase, jumlah booking, rata-rata durasi, dan peringkat unit. Hitung di SQL (irisan rentang dengan tstzrange atau LEAST/GREATEST), bukan di JS.

**Acceptance Criteria:**

- [ ] Utilisasi 1 unit yang disewa 12 jam dari 24 jam = 50% pada tes.

---

#### RPT-003 — Booking per status, tingkat pembatalan, keterlambatan

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.1 — Dashboard owner
- **Estimate:** 3h
- **Dependencies:** RPT-002
- **Status:** [ ] Not Started

**Description:**

Tambahkan ringkasan operasional: jumlah booking per status, tingkat pembatalan (CANCELLED / total), tingkat keterlambatan (booking dengan denda > 0 / booking selesai), rata-rata keterlambatan (menit), top 5 pelanggan berdasarkan jumlah booking, dan unit yang paling sering terlambat dikembalikan.

**Acceptance Criteria:**

- [ ] Semua metrik tampil dan konsisten dengan data uji.

---

#### RPT-004 — Filter rentang tanggal; query teragregasi (hindari N+1)

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.1 — Dashboard owner
- **Estimate:** 3h
- **Dependencies:** RPT-003
- **Status:** [ ] Not Started

**Description:**

Tambahkan filter rentang tanggal (preset: hari ini, 7 hari, bulan ini, bulan lalu, kustom) via searchParams dalam WIB, dan pastikan semua query laporan memakai satu query agregat per bagian (tanpa N+1), memiliki index yang sesuai (cek EXPLAIN), dan selesai < 1 detik untuk 5.000 booking. Hanya OWNER yang bisa mengakses (requireRole di page dan query).

**Acceptance Criteria:**

- [ ] Ganti rentang memperbarui semua kartu dan STAFF ditolak.

---

#### EXP-001 — Export CSV laporan pendapatan dan booking

- **Priority:** P2
- **Sprint:** Sprint 6
- **Story:** US-8.2 — Export
- **Estimate:** 3h
- **Dependencies:** RPT-004
- **Status:** [ ] Not Started

**Description:**

Buat export CSV: route GET /api/laporan/export?jenis=pendapatan|booking&from=&to= (OWNER). Gunakan streaming/chunk untuk dataset besar. Kolom booking: kode, tanggal dibuat (WIB), unit, plat, pelanggan, noHp (dimasking), mulai, selesai, status, hargaDasar, diskon, total, DP, denda, deposit. Kolom pendapatan: periode, sewa, denda, refund, bersih.

**Acceptance Criteria:**

- [ ] File terunduh dan isinya sama dengan tampilan laporan.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EXP-002 — Encoding UTF-8 dengan BOM agar terbuka benar di Excel

- **Priority:** P2
- **Sprint:** Sprint 6
- **Story:** US-8.2 — Export
- **Estimate:** 3h
- **Dependencies:** EXP-001
- **Status:** [ ] Not Started

**Description:**

Pastikan CSV terbuka benar di Excel: UTF-8 dengan BOM, pemisah koma (atau titik koma bila diinginkan, buat opsi), nilai uang sebagai angka polos (tanpa "Rp"), tanggal format ISO atau "YYYY-MM-DD HH:mm" WIB, escape tanda kutip dan baris baru, dan lindungi dari CSV injection (awali sel yang diawali =, +, -, @ dengan apostrof). Tulis unit test untuk fungsi toCsv.

**Acceptance Criteria:**

- [ ] Nama dengan koma/tanda kutip/huruf non-ASCII tampil benar di Excel dan tes injection hijau.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### EXP-003 — Hanya OWNER

- **Priority:** P2
- **Sprint:** Sprint 6
- **Story:** US-8.2 — Export
- **Estimate:** 3h
- **Dependencies:** EXP-002
- **Status:** [ ] Not Started

**Description:**

Batasi export hanya untuk OWNER: requireRole("OWNER") di route, batasi rentang maksimal 366 hari, rate limit 5/menit, dan catat AuditLog "laporan.export" (jenis, rentang, actorId).

**Acceptance Criteria:**

- [ ] STAFF mendapat 403 dan setiap export tercatat di audit.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### OPS-001 — UI SystemSetting (mode maintenance, feature flag mis. antar-jemput, extend online)

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.3 — Maintenance & feature flag
- **Estimate:** 3h
- **Dependencies:** AUTH-010
- **Status:** [ ] Not Started

**Description:**

Buat halaman /admin/setting (OWNER) untuk SystemSetting: toggle maintenance_mode, nomor WhatsApp (whatsapp_number), dp_persen (0-100), dan feature_flags (JSON dengan flag: antarJemput, extendOnline, bookingPublik). Validasi tiap key dengan zod di Server Action updateSetting, tulis AuditLog "setting.update" (before/after), dan revalidate halaman publik terkait.

**Acceptance Criteria:**

- [ ] Perubahan setting tersimpan, tervalidasi, dan tercatat.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### OPS-002 — Mode maintenance menutup booking publik, admin tetap bisa masuk

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.3 — Maintenance & feature flag
- **Estimate:** 3h
- **Dependencies:** OPS-001
- **Status:** [ ] Not Started

**Description:**

Implementasikan mode maintenance: bila maintenance_mode = true, halaman /booking/* dan createBooking/requestExtend publik menampilkan/mengembalikan pesan "Sedang dalam pemeliharaan" (HTTP 503 untuk API), katalog tetap bisa dilihat, dan seluruh /admin/* tetap berfungsi. Banner kuning di admin saat mode aktif. Gunakan satu helper isMaintenance() yang dipakai middleware/Server Action.

**Acceptance Criteria:**

- [ ] Pelanggan tidak bisa membuat booking selama maintenance sementara admin tetap bisa bekerja.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### OPS-003 — Cache pembacaan setting dengan invalidasi saat diubah

- **Priority:** P1
- **Sprint:** Sprint 6
- **Story:** US-8.3 — Maintenance & feature flag
- **Estimate:** 3h
- **Dependencies:** OPS-002
- **Status:** [ ] Not Started

**Description:**

Tambahkan helper getSetting(key) dengan cache (unstable_cache atau cache per request + tag "settings") dan invalidasi dengan revalidateTag("settings") saat updateSetting. Pastikan pembacaan setting di halaman publik tidak menambah query DB per request secara berlebihan dan nilai default aman bila key belum ada.

**Acceptance Criteria:**

- [ ] Mengubah setting terlihat di situs dalam hitungan detik dan pembacaan ter-cache.

---

### Epic 9 — Pre-Launch

**Story dalam sprint ini:** US-9.1 (5 pt); US-9.2 (3 pt).

#### QA-001 — Playwright: alur booking lengkap publik → admin konfirmasi → check-out

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** EXT-005, CRON-005, UPL-005
- **Status:** [ ] Not Started

**Description:**

Siapkan Playwright (tests/e2e, playwright.config.ts) dengan database uji khusus (reset + seed di globalSetup). Tulis e2e alur lengkap: pelanggan membuka katalog -> memilih unit dan jadwal -> mengisi form + unggah KTP/SIM (file fixture) -> halaman sukses (kode booking); admin login -> dashboard menampilkan PENDING -> konfirmasi DP -> serah terima -> check-out terlambat (ada denda) -> invoice tersedia; cek-booking menampilkan status akhir. Jalankan di Chromium mobile dan desktop.

**Acceptance Criteria:**

- [ ] Alur lengkap hijau dua kali berturut-turut di CI.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### QA-002 — Integration test race condition (createBooking, requestExtend, relocateBooking)

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** QA-001
- **Status:** [ ] Not Started

**Description:**

Rapikan dan jalankan semua tes race condition sebagai suite pnpm test:race: createBooking paralel (slot sama, 20 request), requestExtend/decideExtend vs booking baru, relocateBooking ke unit yang sama dari dua admin, dua checkOut paralel, dua confirmDP paralel. Setiap tes harus menegaskan invarian akhir: tidak ada dua booking aktif beririsan pada satu unit (query validasi independen) dan tidak ada error 500 tak terduga.

**Acceptance Criteria:**

- [ ] Suite hijau stabil di 10 kali jalan berturut-turut.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### QA-003 — Manual checklist 10 skenario:

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** QA-002
- **Status:** [ ] Not Started

**Description:**

Siapkan checklist manual 10 skenario di docs/qa-checklist.md (kolom: skenario, langkah, hasil yang diharapkan, hasil aktual, lulus/gagal, tanggal, penguji) lalu jalankan semuanya di preview/staging: (1) booking normal 12 jam; (2) booking < 12 jam (harga minimum); (3) booking multi-hari dengan diskon; (4) slot bentrok termasuk buffer; (5) booking pada blackout/maintenance; (6) timeout PENDING oleh cron; (7) cancel dengan refund H-3, H-1, dan no-show; (8) check-out terlambat (16, 31, 120 menit, dan > 24 jam) beserta sisa buffer yang terpotong; (9) extend disetujui dan ditolak; (10) perubahan policy tidak memengaruhi booking lama. Cantumkan angka konkret yang diharapkan di tiap skenario.

**Acceptance Criteria:**

- [ ] 10 skenario lulus dan temuan bug dicatat/diperbaiki.

---

#### QA-004 — Uji mobile (Android Chrome, iOS Safari) untuk form & timeline

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** QA-003
- **Status:** [ ] Not Started

**Description:**

Uji manual di perangkat nyata: Android Chrome dan iOS Safari (atau BrowserStack) untuk beranda, form booking (kalender, picker jam, upload kamera), halaman sukses, cek-booking, serta admin (login, dashboard, timeline 360 px, check-out). Catat masalah (zoom otomatis input iOS bila font < 16 px, keyboard menutupi tombol, safe-area) dan perbaiki. Cek aksesibilitas dasar: kontras AA, label, fokus keyboard, aria-label tombol ikon.

**Acceptance Criteria:**

- [ ] Semua alur utama dapat diselesaikan di kedua perangkat tanpa bug blocker.

---

#### QA-005 — Audit keamanan ringan: akses tanpa login, IDOR kode booking, upload berbahaya

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** QA-004
- **Status:** [ ] Not Started

**Description:**

Audit keamanan ringan: (1) semua /admin/* dan Server Action admin menolak akses tanpa sesi dan role salah (uji dengan curl); (2) IDOR: kode booking/ID tidak bisa dipakai membaca data orang lain (halaman sukses, cek-booking, invoice, dokumen); (3) upload berbahaya ditolak; (4) rate limit dan Turnstile aktif di produksi; (5) header keamanan (CSP dasar, X-Frame-Options, Referrer-Policy) di next.config; (6) tidak ada secret/PII di log dan Sentry; (7) cron menolak tanpa secret; (8) pnpm audit tanpa vuln high/critical yang belum ditangani.

**Acceptance Criteria:**

- [ ] Setiap butir punya bukti lulus dan temuan diperbaiki.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### QA-006 — Uji beban singkat /api/availability (target p95 < 300 ms)

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.1 — Uji E2E & race condition ⚠️ WAJIB
- **Estimate:** 2.5h
- **Dependencies:** QA-005
- **Status:** [ ] Not Started

**Description:**

Uji beban singkat /api/availability dan halaman beranda dengan k6 atau autocannon (50 koneksi paralel selama 60 detik) pada environment staging dengan data uji (50 unit, ~5.000 booking). Targetkan p95 /api/availability < 300 ms dan tidak ada error. Catat hasil dan tindakan optimasi di README.

**Acceptance Criteria:**

- [ ] Target terpenuhi atau ada rencana perbaikan yang diterima.

---

#### BAK-001 — Aktifkan PITR (Neon/Vercel Postgres) atau pg_dump harian ke S3 (retensi 30 hari)

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.2 — Backup otomatis
- **Estimate:** 2h
- **Dependencies:** DB-009
- **Status:** [ ] Not Started

**Description:**

Aktifkan backup database. Neon/Vercel Postgres: aktifkan PITR dan catat retensinya. VPS: buat skrip pg_dump -Fc harian (cron 02:00 WIB) yang mengunggah ke bucket S3 terpisah dengan enkripsi dan retensi 30 hari (lifecycle rule), serta notifikasi bila gagal. Backup tidak boleh berada di bucket yang sama dengan dokumen KTP/SIM.

**Acceptance Criteria:**

- [ ] Backup otomatis berjalan dan satu file backup terverifikasi ada di bucket.

---

#### BAK-002 — Uji restore minimal 1× sebelum go-live dan dokumentasikan langkahnya

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.2 — Backup otomatis
- **Estimate:** 2h
- **Dependencies:** BAK-001
- **Status:** [ ] Not Started

**Description:**

UJI RESTORE minimal satu kali sebelum go-live: pulihkan backup/PITR ke database baru, jalankan pnpm db:check (constraint no_overlap_bookings harus ada), hitung baris tabel utama (Booking, Customer, Policy), jalankan aplikasi terhadap database hasil restore, dan catat waktu pemulihan (RTO). Dokumentasikan langkah-langkahnya di docs/runbook-restore.md.

**Acceptance Criteria:**

- [ ] Restore berhasil dan constraint serta data utuh.

---

#### BAK-003 — Alert Sentry untuk kegagalan cron/backup

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.2 — Backup otomatis
- **Estimate:** 2h
- **Dependencies:** BAK-002
- **Status:** [ ] Not Started

**Description:**

Siapkan alert operasional di Sentry: alert untuk error rate naik, kegagalan cron (route cron mengirim captureMessage bila gagal atau tidak berjalan > 15 menit untuk pending-timeout via cron monitor Sentry), kegagalan backup, dan kegagalan pengiriman email. Kirim notifikasi ke email/WhatsApp owner.

**Acceptance Criteria:**

- [ ] Alert uji terkirim ke owner untuk tiap jenis.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

#### BAK-004 — Checklist go-live (env produksi, domain, SSL, seed owner, akun Sentry)

- **Priority:** P0
- **Sprint:** Sprint 6
- **Story:** US-9.2 — Backup otomatis
- **Estimate:** 2h
- **Dependencies:** BAK-003
- **Status:** [ ] Not Started

**Description:**

Buat dan jalankan checklist go-live di docs/go-live.md: env produksi lengkap dan terverifikasi (env.ts lolos), domain + SSL, DNS email (SPF/DKIM/DMARC), seed owner dan penggantian password awal, policy GLOBAL produksi diisi tarif nyata, S&K final, 3-5 unit nyata terdaftar, ENABLE_DEBUG_ROUTES=false dan halaman /ui-check dihapus, pnpm db:check terhadap produksi, backup + restore teruji, Sentry aktif, cron terpicu, uji booking sungguhan end-to-end oleh owner, rencana rollback (redeploy versi sebelumnya + restore).

**Acceptance Criteria:**

- [ ] Semua butir dicentang dan owner menyetujui go-live.
- [ ] `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lulus tanpa error

---

## 10. Post-MVP / Future Backlog

Berikut kandidat di luar scope MVP (bukan bagian PRD v2.0; ditambahkan sebagai pengingat agar tidak menyusup ke MVP):

- Pembayaran online / payment gateway (verifikasi DP otomatis, Midtrans/Xendit).
- Notifikasi WhatsApp otomatis (WhatsApp Business API) selain email.
- Aplikasi mobile native/cross-platform untuk pelanggan dan staf.
- Multi-cabang / multi-lokasi dan transfer unit antar cabang.
- Promo, voucher, dan program loyalitas; tarif musiman/dinamis.
- Pelacakan GPS unit dan jadwal servis berbasis kilometer.
- Ulasan & rating, serta tanda tangan digital kontrak sewa.
- Laporan lanjutan / BI dan integrasi akuntansi.

---

## 11. PRD Coverage Validation

Tabel berikut memastikan seluruh requirement MVP dari PRD ter-cover oleh task pada backlog ini:

| Requirement PRD                                               | Task ID Terkait                                               | Sprint             | Coverage Status |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------ | --------------- |
| Setup project, deploy, monitoring Sentry                      | SETUP-001 s/d SETUP-011                                       | Sprint 0           | Covered         |
| Skema DB + EXCLUDE constraint (zero double-booking)           | DB-001 s/d DB-009                                             | Sprint 0           | Covered         |
| Auth admin 2 role (Owner, Staff)                              | AUTH-001 s/d AUTH-010                                         | Sprint 0           | Covered         |
| Manajemen armada (CRUD unit)                                  | FLEET-001 s/d FLEET-007                                       | Sprint 1           | Covered         |
| Policy Engine (edit, versioning, audit)                       | POL-001 s/d POL-010, AUDIT-001 s/d AUDIT-003                  | Sprint 1           | Covered         |
| Blackout tanggal                                              | BLK-001 s/d BLK-004                                           | Sprint 1           | Covered         |
| Katalog & detail motor                                        | CAT-001 s/d CAT-004                                           | Sprint 2           | Covered         |
| Pencarian ketersediaan + kalender terblokir                   | AVL-001 s/d AVL-009                                           | Sprint 2           | Covered         |
| Kalkulasi harga hybrid (min 12 jam)                           | PRC-001 s/d PRC-007                                           | Sprint 2           | Covered         |
| Form booking (KTP/SIM, kalkulator real-time, S&K)             | BKG-001 s/d BKG-011, UPL-001 s/d UPL-005, TNC-001 s/d TNC-003 | Sprint 2, Sprint 5 | Covered         |
| Halaman sukses (kode, countdown DP, WhatsApp)                 | SUC-001 s/d SUC-004                                           | Sprint 2           | Covered         |
| Cek riwayat booking by kode                                   | TRK-001 s/d TRK-003                                           | Sprint 2           | Covered         |
| Dashboard "Perlu Tindakan"                                    | DASH-001 s/d DASH-003                                         | Sprint 3           | Covered         |
| Timeline kalender admin (Gantt, 5 warna, mobile)              | TL-001 s/d TL-007                                             | Sprint 3           | Covered         |
| Cek ketersediaan cepat < 5 detik                              | QCK-001 s/d QCK-002                                           | Sprint 3           | Covered         |
| Detail booking, konfirmasi DP, cancel + refund, state machine | ADM-001 s/d ADM-007                                           | Sprint 3           | Covered         |
| Relokasi booking                                              | RLC-001 s/d RLC-003                                           | Sprint 3           | Covered         |
| Denda otomatis per blok menit (grace 15 menit)                | PEN-001 s/d PEN-004                                           | Sprint 4           | Covered         |
| Flow check-out + buffer terpotong & peringatan buffer tipis   | CHK-001 s/d CHK-006                                           | Sprint 4           | Covered         |
| Extend sewa                                                   | EXT-001 s/d EXT-005                                           | Sprint 4           | Covered         |
| Force majeure                                                 | FM-001 s/d FM-003                                             | Sprint 4           | Covered         |
| Email transaksional                                           | EML-001 s/d EML-004                                           | Sprint 4           | Covered         |
| Invoice PDF                                                   | INV-001 s/d INV-004                                           | Sprint 5           | Covered         |
| Cron: pending timeout & cleanup file 90 hari                  | CRON-001 s/d CRON-005                                         | Sprint 5           | Covered         |
| Manajemen pelanggan & blacklist                               | CUS-001 s/d CUS-004                                           | Sprint 5           | Covered         |
| Anti-spam (rate limit, Turnstile)                             | SPAM-001 s/d SPAM-003                                         | Sprint 5           | Covered         |
| Laporan pendapatan & utilisasi                                | RPT-001 s/d RPT-004                                           | Sprint 6           | Covered         |
| Export laporan CSV                                            | EXP-001 s/d EXP-003                                           | Sprint 6           | Covered         |
| Mode maintenance & feature flag                               | OPS-001 s/d OPS-003                                           | Sprint 6           | Covered         |
| Uji E2E & race condition                                      | QA-001 s/d QA-006                                             | Sprint 6           | Covered         |
| Backup otomatis & go-live                                     | BAK-001 s/d BAK-004                                           | Sprint 6           | Covered         |

---

## Changelog

### v2.2 — 18 November 2026

- Format dirapikan: pembungkus dan instruksi sisa jawaban AI dihapus, blok Timeline Sprint dan blok Konteks Proyek diperbaiki barisnya.
- **Peringatan buffer tipis (keputusan owner):** bila ada booking berikutnya di unit yang sama dan jeda dari jam kembali ke jam mulai booking tersebut kurang dari 30 menit, admin mendapat peringatan `TIPIS` (0 < jeda < 30) atau `KRITIS` (jeda ≤ 0) beserta AuditLog `booking.buffer_tipis` / `booking.buffer_habis`. Menggantikan aturan lama yang hanya memberi peringatan saat sisa buffer 0. Berubah di: Section 4 Rule 3, Section 9 N11, CHK-001, CHK-003, CHK-006.
- CHK-006: 9 kasus menjadi 12 kasus (menambah kasus TIPIS, booking berikutnya jauh, dan batas tepat 30 menit). Flag `perluRelokasi` diganti `peringatanBuffer`.
- Status SETUP-001 diperbaiki (typo) dan Progress Summary diperbarui; poin `pnpm test` dikeluarkan dari SETUP-001 karena Vitest baru dipasang di SETUP-002.
- Tanggal keputusan buffer/denda dikoreksi menjadi 18 November 2026 (sebelumnya tertulis tanggal PRD, 13 November 2025).
- Judul "Task Paling Kritis" dan baris Coverage Validation untuk US-5.2 disesuaikan dengan aturan buffer yang baru.

### v2.1 — 18 November 2026

- Aturan buffer saat check-out dirinci menjadi lima kasus: pulang lebih awal, tepat waktu, telat dalam grace, telat melewati grace, dan telat sampai buffer habis. `bufferSampai` tidak pernah diperpanjang saat telat, sehingga check-out tidak pernah gagal karena constraint EXCLUDE.
- Denda dihitung per blok menit (bukan tier harian).
- Berubah di: Section 4 Rule 3 dan 4, Section 9 N11, CHK-003, CHK-006.
