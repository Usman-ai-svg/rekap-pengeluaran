-- Nanoland — Sistem Pencatatan & Konsolidasi Pengeluaran Proyek
-- Phase 1 schema. Safe to re-run: drops its own objects first, so
-- running this whole file again (e.g. after a partial/failed run)
-- just resets and recreates everything from scratch. Do not run
-- this against a project that already has real data you want to keep.

create extension if not exists "pgcrypto";

-- ============================================================
-- Reset (drop in dependency order, ignore if this is a fresh project)
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop policy if exists "bukti_pembayaran_insert" on storage.objects;
drop policy if exists "bukti_pembayaran_select" on storage.objects;
drop policy if exists "bukti_pembayaran_delete" on storage.objects;

drop table if exists public.pengeluaran cascade;
drop table if exists public.users cascade;
drop table if exists public.kategori_pengeluaran cascade;
drop table if exists public.proyek cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.current_user_proyek_ids() cascade;
drop function if exists public.is_ops_admin() cascade;

drop type if exists public.user_role cascade;

-- ============================================================
-- Tables
-- ============================================================

create table public.proyek (
  id uuid primary key default gen_random_uuid(),
  kode_proyek text not null unique,
  nama_proyek text not null,
  nilai_kontrak_rap numeric,
  status_aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.kategori_pengeluaran (
  id serial primary key,
  nama text not null unique
);

create type public.user_role as enum ('QS', 'OPS_ADMIN');

-- One row per auth.users entry; created automatically via trigger below.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  role public.user_role not null default 'QS',
  proyek_assigned uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  proyek_id uuid not null references public.proyek (id),
  kategori_id integer not null references public.kategori_pengeluaran (id),
  tanggal date not null,
  keterangan text not null,
  volume numeric,
  satuan text,
  harga_satuan numeric,
  total numeric not null,
  dicatat_oleh uuid not null references public.users (id),
  dibuat_pada timestamptz not null default now(),
  catatan text,
  bukti_pembayaran_url text
);

create index pengeluaran_proyek_id_idx on public.pengeluaran (proyek_id);
create index pengeluaran_kategori_id_idx on public.pengeluaran (kategori_id);
create index pengeluaran_tanggal_idx on public.pengeluaran (tanggal);

-- ============================================================
-- Seed default kategori
-- ============================================================

insert into public.kategori_pengeluaran (nama) values
  ('BORONGAN'),
  ('TENAGA_HARIAN'),
  ('MATERIAL'),
  ('PETTY_CASH'),
  ('ORMAS'),
  ('SUBKON')
on conflict (nama) do nothing;

-- ============================================================
-- Auto-create a users profile row when someone signs up.
-- New users default to QS with no assigned proyek; an OPS_ADMIN
-- promotes/assigns them from the Admin page.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nama, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nama', new.email), 'QS');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Helper functions (security definer so RLS on `users` doesn't
-- recurse when other policies look up the caller's role/proyek).
-- ============================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_user_proyek_ids()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select proyek_assigned from public.users where id = auth.uid();
$$;

create or replace function public.is_ops_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'OPS_ADMIN';
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.proyek enable row level security;
alter table public.kategori_pengeluaran enable row level security;
alter table public.users enable row level security;
alter table public.pengeluaran enable row level security;

-- users: everyone can read their own profile; admins can read/manage everyone.
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_select_admin" on public.users
  for select using (public.is_ops_admin());

create policy "users_admin_write" on public.users
  for update using (public.is_ops_admin())
  with check (public.is_ops_admin());

-- proyek: admins see/manage all; QS see only their assigned proyek.
create policy "proyek_select" on public.proyek
  for select using (
    public.is_ops_admin() or id = any (public.current_user_proyek_ids())
  );

create policy "proyek_admin_insert" on public.proyek
  for insert with check (public.is_ops_admin());

create policy "proyek_admin_update" on public.proyek
  for update using (public.is_ops_admin()) with check (public.is_ops_admin());

create policy "proyek_admin_delete" on public.proyek
  for delete using (public.is_ops_admin());

-- kategori_pengeluaran: any signed-in user can read; only admins manage.
create policy "kategori_select_all" on public.kategori_pengeluaran
  for select using (auth.uid() is not null);

create policy "kategori_admin_insert" on public.kategori_pengeluaran
  for insert with check (public.is_ops_admin());

create policy "kategori_admin_update" on public.kategori_pengeluaran
  for update using (public.is_ops_admin()) with check (public.is_ops_admin());

create policy "kategori_admin_delete" on public.kategori_pengeluaran
  for delete using (public.is_ops_admin());

-- pengeluaran: admins see/manage all; QS see/manage entries for their
-- assigned proyek, and can only edit/delete rows they created.
create policy "pengeluaran_select" on public.pengeluaran
  for select using (
    public.is_ops_admin() or proyek_id = any (public.current_user_proyek_ids())
  );

create policy "pengeluaran_insert" on public.pengeluaran
  for insert with check (
    dicatat_oleh = auth.uid()
    and (
      public.is_ops_admin() or proyek_id = any (public.current_user_proyek_ids())
    )
  );

create policy "pengeluaran_update" on public.pengeluaran
  for update using (
    public.is_ops_admin()
    or (proyek_id = any (public.current_user_proyek_ids()) and dicatat_oleh = auth.uid())
  ) with check (
    public.is_ops_admin()
    or (proyek_id = any (public.current_user_proyek_ids()) and dicatat_oleh = auth.uid())
  );

create policy "pengeluaran_delete" on public.pengeluaran
  for delete using (
    public.is_ops_admin()
    or (proyek_id = any (public.current_user_proyek_ids()) and dicatat_oleh = auth.uid())
  );

-- ============================================================
-- Storage — bukti pembayaran (private bucket, accessed via
-- signed URLs generated server-side after the app confirms the
-- caller can already read the related pengeluaran row). Files are
-- uploaded to `${proyek_id}/${uuid}.ext`, so the first path segment
-- is used to scope access to the same proyek the caller can access.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bukti-pembayaran',
  'bukti-pembayaran',
  false,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "bukti_pembayaran_insert" on storage.objects
  for insert with check (
    bucket_id = 'bukti-pembayaran'
    and (
      public.is_ops_admin()
      or (storage.foldername(name))[1]::uuid = any (public.current_user_proyek_ids())
    )
  );

create policy "bukti_pembayaran_select" on storage.objects
  for select using (
    bucket_id = 'bukti-pembayaran'
    and (
      public.is_ops_admin()
      or (storage.foldername(name))[1]::uuid = any (public.current_user_proyek_ids())
    )
  );

create policy "bukti_pembayaran_delete" on storage.objects
  for delete using (
    bucket_id = 'bukti-pembayaran'
    and (
      public.is_ops_admin()
      or (storage.foldername(name))[1]::uuid = any (public.current_user_proyek_ids())
    )
  );
