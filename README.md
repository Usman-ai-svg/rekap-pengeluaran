# Rekap Pengeluaran — Nanoland

Sistem pencatatan & konsolidasi pengeluaran proyek. Fase 1: form catat
pengeluaran, daftar pengeluaran, dan dashboard konsolidasi sederhana —
menggantikan pencatatan manual di Excel. Lihat PRD untuk konteks lengkap
(alur, skema data, rencana fase berikutnya).

Stack: Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Vercel.

## Setup

1. **Buat project Supabase** (gratis) di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** di project tsb, jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
   Ini membuat tabel (`proyek`, `kategori_pengeluaran`, `users`, `pengeluaran`),
   seed kategori default, trigger auto-provision profil user, RLS policies,
   dan storage bucket privat `bukti-pembayaran`. Script ini aman dijalankan
   ulang (drop-and-recreate) — kalau kena error karena run sebelumnya
   sempat berhenti di tengah jalan, tinggal jalankan lagi seluruh filenya.
3. Di Supabase Dashboard → **Authentication → Providers**, pastikan Email
   provider aktif. Buat user pertama lewat **Authentication → Users → Add user**
   (ini akan otomatis dapat baris `public.users` dengan role `QS`).
4. Jadikan user pertama sebagai admin: di SQL Editor jalankan
   ```sql
   update public.users set role = 'OPS_ADMIN' where id = '<user-id-dari-auth>';
   ```
   Setelah itu, penambahan proyek/kategori/user lain bisa dilakukan lewat
   halaman **Admin** di aplikasi.
5. Salin `.env.local.example` ke `.env.local`, isi dengan **Project URL** dan
   **anon public key** dari Supabase Dashboard → Settings → API.
   ```bash
   cp .env.local.example .env.local
   ```
6. Install dependencies & jalankan dev server:
   ```bash
   npm install
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

## Deploy

Push repo ke GitHub, connect ke [Vercel](https://vercel.com/new), isi env
var yang sama (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
di Vercel project settings, lalu deploy.

## Struktur

```
app/
├── login/                    # Login (Supabase Auth email/password)
├── proyek/[id]/pengeluaran/  # Catat & daftar pengeluaran per proyek
├── dashboard/                # Konsolidasi lintas proyek (Ops)
├── admin/                    # Kelola proyek, kategori, akses user (Ops)
└── (fase depan: anggaran/, business-plan/, progress/ per proyek)
lib/
├── supabase/                 # Browser/server Supabase clients + middleware
├── auth.ts                   # Helper ambil user + role saat ini
└── types.ts
supabase/
└── schema.sql                # Skema DB, RLS, storage bucket
```

## Role & akses

- **QS**: hanya lihat/catat pengeluaran untuk proyek di `proyek_assigned`
  miliknya; hanya bisa edit/hapus entri yang ia catat sendiri.
- **OPS_ADMIN**: akses semua proyek, dashboard konsolidasi, dan halaman
  Admin (kelola proyek, kategori, dan akses user).

User baru yang sign up otomatis dapat profil dengan role `QS` dan tanpa
proyek — admin mengatur role & proyek yang bisa diakses dari halaman Admin.

## Keterbatasan Fase 1 (sesuai PRD)

- Dashboard masih tabel, belum grafis (Fase 2).
- Belum ada export Excel/PDF (Fase 2).
- Query daftar/dashboard belum diberi paginasi eksplisit — untuk volume
  data Fase 1 (3-5 proyek, mingguan) belum jadi masalah, tapi kalau baris
  `pengeluaran` sudah sangat banyak, pertimbangkan menambah paginasi.
