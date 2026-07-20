import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import type { Proyek } from "@/lib/types";

export default async function Home() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: proyekList } = await supabase
    .from("proyek")
    .select("id, kode_proyek, nama_proyek, nilai_kontrak_rap, status_aktif, created_at")
    .order("nama_proyek");

  const proyek = (proyekList ?? []) as Proyek[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Halo, {profile.nama}</h1>
        <p className="text-sm text-neutral-500">
          {profile.role === "OPS_ADMIN"
            ? "Pilih proyek untuk mencatat atau melihat pengeluaran."
            : "Proyek yang ditugaskan ke kamu."}
        </p>
      </div>

      {proyek.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Belum ada proyek yang bisa diakses. Hubungi admin.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {proyek.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{p.nama_proyek}</h2>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {p.kode_proyek}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Nilai kontrak/RAP: {formatRupiah(p.nilai_kontrak_rap)}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link
                  href={`/proyek/${p.id}/pengeluaran/baru`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Catat Pengeluaran
                </Link>
                <Link
                  href={`/proyek/${p.id}/pengeluaran`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Daftar Pengeluaran
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
