# Sistem Rental Motor Yogyakarta (MVP)

Platform rental motor online berbasis web untuk wilayah Yogyakarta dengan sistem ketersediaan real-time, penentuan harga dan denda otomatis (Policy Engine dengan snapshot), serta zero double-booking yang dijamin oleh database constraint PostgreSQL (`EXCLUDE USING gist`).

---

## 🚀 Cara Menjalankan Proyek

### Prasyarat

- **Node.js**: v20+ atau v22+
- **Package Manager**: `pnpm` (disarankan v9+)
- **Database**: PostgreSQL 16+ dengan ekstensi `btree_gist`

### Langkah Instalasi

1. Clone repositori dan masuk ke direktori proyek:
   ```bash
   cd web-rental-motor
   ```
2. Pasang dependensi:
   ```bash
   pnpm install
   ```
3. Siapkan environment file:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan `DATABASE_URL` dan konfigurasi environment lainnya.
4. Generate Prisma Client & jalankan migrasi database:
   ```bash
   pnpm db:migrate
   ```
5. Jalankan server pengembangan (development):
   ```bash
   pnpm dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

### Perintah Pengujian & Build

- **Typecheck**: `pnpm typecheck`
- **Linting**: `pnpm lint`
- **Unit & Integration Test**: `pnpm test`
- **Production Build**: `pnpm build` (atau `pnpm next build --webpack` untuk lingkungan bundling spesifik)

---

## 📁 Struktur Folder Proyek

```
src/
├── app/
│   ├── (public)/                 # Rute publik (katalog motor, cek booking, dll.)
│   │   ├── page.tsx              # Landing page publik
│   │   ├── motor/
│   │   │   ├── page.tsx          # Katalog motor
│   │   │   └── [id]/page.tsx     # Detail unit motor
│   │   └── cek-status/page.tsx   # Cek status pemesanan
│   ├── (admin)/admin/            # Panel manajemen admin (/admin/*)
│   │   ├── login/page.tsx        # Halaman login admin (tanpa sidebar)
│   │   └── (panel)/              # Halaman ber-layout sidebar admin
│   │       ├── dashboard/page.tsx # Ringkasan metrik & tindakan
│   │       ├── timeline/page.tsx  # Kalender pemesanan armada & buffer
│   │       ├── armada/page.tsx    # Manajemen unit & blackout
│   │       ├── transaksi/page.tsx # Konfirmasi DP, pelunasan & refund
│   │       ├── pelanggan/page.tsx # Data pelanggan & riwayat blacklist
│   │       └── pengaturan/page.tsx# Konfigurasi sistem
│   ├── api/                      # Endpoint API (webhook, cron, dsb.)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Styling global Tailwind CSS
├── components/
│   ├── ui/                       # Komponen antarmuka dasar shadcn/ui
│   ├── booking/                  # Komponen alur pemesanan
│   ├── admin/                    # Komponen khusus panel admin
│   └── shared/                   # Komponen bersama
├── lib/                          # Modul utilitas & konfigurasi (prisma, auth, pricing, dsb.)
├── server/
│   ├── actions/                  # Server Actions Next.js (mutasi data)
│   └── queries/                  # Query data & data fetching layer
├── types/                        # Definisi tipe TypeScript global (tanpa 'any')
tests/
├── unit/                         # Unit tests logika bisnis & helper
├── integration/                  # Pengujian integrasi komponen & query DB
└── e2e/                          # End-to-end tests alur pengguna
```

---

## 📐 Konvensi Pengembangan & Aturan Utama

1. **Server Actions untuk Mutasi Data**:
   - Seluruh mutasi data (create, update, delete) wajib menggunakan Next.js Server Actions (`"use server"`).
   - API route (`/api/...`) hanya digunakan untuk kebutuhan webhook, Vercel cron job, atau endpoint publik eksternal.

2. **Validasi Server-Side dengan Zod**:
   - Seluruh payload input ke Server Actions dan API route WAJIB divalidasi menggunakan Zod schema sebelum diproses.

3. **Bebas Tipe `any` (Strict TypeScript)**:
   - Dilarang keras menggunakan tipe `any`. Gunakan interface/type eksplisit, `unknown` dengan type-narrowing, atau type inference Prisma/Zod.
   - Pengecualian hanya berlaku untuk raw SQL query PostgreSQL khusus (`$queryRaw`) dengan komentar dokumentasi yang jelas.

4. **Waktu dan Standar UTC di Database**:
   - Semua penyimpanan tanggal dan waktu (`DateTime`) di database PostgreSQL WAJIB bertipe `@db.Timestamptz(3)` dan berada dalam format UTC.
   - Konversi ke Waktu Indonesia Barat (WIB / Asia/Jakarta, UTC+7) HANYA dilakukan pada layer antarmuka pengguna (UI render dan input form).
   - Dilarang memanipulasi timezone secara manual di layer database queries.

5. **Penanganan Uang & Durasi**:
   - Nilai uang disimpan sebagai integer Rupiah (tanpa desimal/float).
   - Durasi sewa dibulatkan ke atas per jam (`Math.ceil`). Keterlambatan dihitung dalam menit.
