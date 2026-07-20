import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { deletePengeluaran } from "./actions";
import type { KategoriPengeluaran, Proyek } from "@/lib/types";

type Row = {
  id: string;
  tanggal: string;
  keterangan: string;
  volume: number | null;
  satuan: string | null;
  harga_satuan: number | null;
  total: number;
  catatan: string | null;
  bukti_pembayaran_url: string | null;
  dicatat_oleh: string;
  kategori_pengeluaran: { id: number; nama: string } | null;
  users: { id: string; nama: string } | null;
};

export default async function DaftarPengeluaranPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kategori?: string; dari?: string; sampai?: string }>;
}) {
  const { id } = await params;
  const { kategori, dari, sampai } = await searchParams;
  const { authId, profile } = await requireUser();
  const supabase = await createClient();

  const { data: proyek } = await supabase
    .from("proyek")
    .select("*")
    .eq("id", id)
    .single();

  if (!proyek) notFound();

  const { data: kategoriList } = await supabase
    .from("kategori_pengeluaran")
    .select("*")
    .order("nama");

  let query = supabase
    .from("pengeluaran")
    .select(
      "id, tanggal, keterangan, volume, satuan, harga_satuan, total, catatan, bukti_pembayaran_url, dicatat_oleh, kategori_pengeluaran(id, nama), users(id, nama)",
    )
    .eq("proyek_id", id)
    .order("tanggal", { ascending: false });

  if (kategori) query = query.eq("kategori_id", Number(kategori));
  if (dari) query = query.gte("tanggal", dari);
  if (sampai) query = query.lte("tanggal", sampai);

  const { data: rows, error } = await query;
  const pengeluaran = (rows ?? []) as unknown as Row[];
  const totalKeseluruhan = pengeluaran.reduce((sum, r) => sum + Number(r.total), 0);

  const signedUrls = await Promise.all(
    pengeluaran.map(async (r) => {
      if (!r.bukti_pembayaran_url) return [r.id, null] as const;
      const { data } = await supabase.storage
        .from("bukti-pembayaran")
        .createSignedUrl(r.bukti_pembayaran_url, 60 * 60);
      return [r.id, data?.signedUrl ?? null] as const;
    }),
  );
  const buktiMap = new Map(signedUrls);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Daftar Pengeluaran</h1>
          <p className="text-sm text-neutral-500">
            {(proyek as Proyek).nama_proyek} ({(proyek as Proyek).kode_proyek})
          </p>
        </div>
        <Link
          href={`/proyek/${id}/pengeluaran/baru`}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          + Catat Pengeluaran
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="kategori" className="font-medium">
            Kategori
          </label>
          <select
            id="kategori"
            name="kategori"
            defaultValue={kategori ?? ""}
            className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Semua</option>
            {((kategoriList ?? []) as KategoriPengeluaran[]).map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dari" className="font-medium">
            Dari tanggal
          </label>
          <input
            id="dari"
            name="dari"
            type="date"
            defaultValue={dari ?? ""}
            className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sampai" className="font-medium">
            Sampai tanggal
          </label>
          <input
            id="sampai"
            name="sampai"
            type="date"
            defaultValue={sampai ?? ""}
            className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
        >
          Filter
        </button>
        {(kategori || dari || sampai) && (
          <Link href={`/proyek/${id}/pengeluaran`} className="text-neutral-500 hover:underline">
            Reset
          </Link>
        )}
      </form>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
              <th className="py-2 pr-3">Tanggal</th>
              <th className="py-2 pr-3">Kategori</th>
              <th className="py-2 pr-3">Keterangan</th>
              <th className="py-2 pr-3">Vol × Satuan</th>
              <th className="py-2 pr-3 text-right">Harga Satuan</th>
              <th className="py-2 pr-3 text-right">Total</th>
              <th className="py-2 pr-3">Dicatat Oleh</th>
              <th className="py-2 pr-3">Bukti</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {pengeluaran.map((row) => {
              const canEdit = profile.role === "OPS_ADMIN" || row.dicatat_oleh === authId;
              return (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 align-top dark:border-neutral-900"
                >
                  <td className="py-2 pr-3 whitespace-nowrap">{formatTanggal(row.tanggal)}</td>
                  <td className="py-2 pr-3">{row.kategori_pengeluaran?.nama ?? "-"}</td>
                  <td className="py-2 pr-3">
                    {row.keterangan}
                    {row.catatan && (
                      <div className="text-xs text-neutral-400">{row.catatan}</div>
                    )}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {row.volume ? `${row.volume} ${row.satuan ?? ""}` : "-"}
                  </td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    {formatRupiah(row.harga_satuan)}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                    {formatRupiah(row.total)}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{row.users?.nama ?? "-"}</td>
                  <td className="py-2 pr-3">
                    {buktiMap.get(row.id) ? (
                      <a
                        href={buktiMap.get(row.id)!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Lihat
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {canEdit && (
                      <div className="flex gap-2">
                        <Link
                          href={`/proyek/${id}/pengeluaran/${row.id}/edit`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Edit
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await deletePengeluaran(id, row.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-red-600 hover:underline dark:text-red-400"
                          >
                            Hapus
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {pengeluaran.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-neutral-400">
                  Belum ada pengeluaran tercatat.
                </td>
              </tr>
            )}
          </tbody>
          {pengeluaran.length > 0 && (
            <tfoot>
              <tr className="border-t border-neutral-200 font-medium dark:border-neutral-800">
                <td colSpan={5} className="py-2 pr-3 text-right">
                  Total
                </td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">
                  {formatRupiah(totalKeseluruhan)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
