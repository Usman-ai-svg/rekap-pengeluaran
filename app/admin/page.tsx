import { requireOpsAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { UserAccessForm } from "@/components/user-access-form";
import {
  createKategori,
  createProyek,
  updateProyekStatus,
  updateUserAccess,
} from "./actions";
import type { KategoriPengeluaran, Proyek, UserProfile } from "@/lib/types";

export default async function AdminPage() {
  await requireOpsAdmin();
  const supabase = await createClient();

  const [{ data: proyekList }, { data: kategoriList }, { data: userList }] =
    await Promise.all([
      supabase.from("proyek").select("*").order("nama_proyek"),
      supabase.from("kategori_pengeluaran").select("*").order("nama"),
      supabase.from("users").select("id, nama, role, proyek_assigned").order("nama"),
    ]);

  const proyek = (proyekList ?? []) as Proyek[];
  const kategori = (kategoriList ?? []) as KategoriPengeluaran[];
  const users = (userList ?? []) as UserProfile[];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-neutral-500">Kelola proyek, kategori, dan akses user.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Proyek</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
                <th className="py-2 pr-3">Kode</th>
                <th className="py-2 pr-3">Nama</th>
                <th className="py-2 pr-3 text-right">Nilai Kontrak/RAP</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {proyek.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-3">{p.kode_proyek}</td>
                  <td className="py-2 pr-3">{p.nama_proyek}</td>
                  <td className="py-2 pr-3 text-right">{formatRupiah(p.nilai_kontrak_rap)}</td>
                  <td className="py-2 pr-3">
                    <form
                      action={async () => {
                        "use server";
                        await updateProyekStatus(p.id, !p.status_aktif);
                      }}
                    >
                      <button
                        type="submit"
                        className={
                          p.status_aktif
                            ? "rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800"
                        }
                      >
                        {p.status_aktif ? "Aktif" : "Nonaktif"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {proyek.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-neutral-400">
                    Belum ada proyek.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={createProyek} className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="kode_proyek" className="font-medium">
              Kode Proyek
            </label>
            <input
              id="kode_proyek"
              name="kode_proyek"
              required
              placeholder="SR"
              className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="nama_proyek" className="font-medium">
              Nama Proyek
            </label>
            <input
              id="nama_proyek"
              name="nama_proyek"
              required
              placeholder="Serium Residence"
              className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="nilai_kontrak_rap" className="font-medium">
              Nilai Kontrak/RAP
            </label>
            <input
              id="nilai_kontrak_rap"
              name="nilai_kontrak_rap"
              type="number"
              step="any"
              className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white dark:bg-white dark:text-neutral-900"
          >
            Tambah Proyek
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Kategori Pengeluaran</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {kategori.map((k) => (
            <span
              key={k.id}
              className="rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800"
            >
              {k.nama}
            </span>
          ))}
        </div>
        <form action={createKategori} className="flex items-end gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <label htmlFor="nama" className="font-medium">
              Kategori Baru
            </label>
            <input
              id="nama"
              name="nama"
              required
              placeholder="mis. SEWA_ALAT"
              className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white dark:bg-white dark:text-neutral-900"
          >
            Tambah Kategori
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Akses User</h2>
        <p className="text-sm text-neutral-500">
          User baru otomatis dibuat saat sign up (akun dibuat lewat Supabase Auth) dengan
          role QS dan tanpa proyek. Atur role dan proyek yang bisa diakses di sini.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((u) => (
            <UserAccessForm
              key={u.id}
              user={u}
              proyekList={proyek}
              action={updateUserAccess.bind(null, u.id)}
            />
          ))}
          {users.length === 0 && (
            <p className="text-sm text-neutral-400">Belum ada user.</p>
          )}
        </div>
      </section>
    </div>
  );
}
