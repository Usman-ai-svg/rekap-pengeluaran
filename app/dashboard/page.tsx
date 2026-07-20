import { requireOpsAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import type { Proyek } from "@/lib/types";

type PengeluaranAgg = {
  proyek_id: string;
  kategori_id: number;
  total: number;
  tanggal: string;
  kategori_pengeluaran: { nama: string } | null;
};

export default async function DashboardPage() {
  await requireOpsAdmin();
  const supabase = await createClient();

  const [{ data: proyekList }, { data: pengeluaranList }] = await Promise.all([
    supabase
      .from("proyek")
      .select("id, kode_proyek, nama_proyek, nilai_kontrak_rap, status_aktif, created_at")
      .order("nama_proyek"),
    supabase
      .from("pengeluaran")
      .select("proyek_id, kategori_id, total, tanggal, kategori_pengeluaran(nama)"),
  ]);

  const proyek = (proyekList ?? []) as Proyek[];
  const pengeluaran = (pengeluaranList ?? []) as unknown as PengeluaranAgg[];

  const totalSemua = pengeluaran.reduce((s, p) => s + Number(p.total), 0);

  const perProyek = new Map<string, number>();
  const perProyekKategori = new Map<string, Map<string, number>>();
  const perBulan = new Map<string, number>();

  for (const p of pengeluaran) {
    perProyek.set(p.proyek_id, (perProyek.get(p.proyek_id) ?? 0) + Number(p.total));

    const kategoriNama = p.kategori_pengeluaran?.nama ?? "Lainnya";
    const byKategori = perProyekKategori.get(p.proyek_id) ?? new Map<string, number>();
    byKategori.set(kategoriNama, (byKategori.get(kategoriNama) ?? 0) + Number(p.total));
    perProyekKategori.set(p.proyek_id, byKategori);

    const bulan = p.tanggal.slice(0, 7);
    perBulan.set(bulan, (perBulan.get(bulan) ?? 0) + Number(p.total));
  }

  const trenBulanan = Array.from(perBulan.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard Konsolidasi</h1>
        <p className="text-sm text-neutral-500">Semua proyek — {proyek.length} proyek aktif/nonaktif</p>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">Total pengeluaran seluruh proyek</p>
        <p className="text-2xl font-semibold">{formatRupiah(totalSemua)}</p>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Realisasi per Proyek</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
                <th className="py-2 pr-3">Proyek</th>
                <th className="py-2 pr-3 text-right">Nilai Kontrak/RAP</th>
                <th className="py-2 pr-3 text-right">Realisasi</th>
                <th className="py-2 pr-3 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {proyek.map((p) => {
                const realisasi = perProyek.get(p.id) ?? 0;
                const pct = p.nilai_kontrak_rap
                  ? ((realisasi / p.nilai_kontrak_rap) * 100).toFixed(1)
                  : null;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="py-2 pr-3">
                      {p.nama_proyek} <span className="text-neutral-400">({p.kode_proyek})</span>
                    </td>
                    <td className="py-2 pr-3 text-right">{formatRupiah(p.nilai_kontrak_rap)}</td>
                    <td className="py-2 pr-3 text-right">{formatRupiah(realisasi)}</td>
                    <td className="py-2 pr-3 text-right">{pct ? `${pct}%` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Breakdown per Proyek per Kategori</h2>
        <div className="flex flex-col gap-4">
          {proyek.map((p) => {
            const byKategori = perProyekKategori.get(p.id);
            if (!byKategori || byKategori.size === 0) return null;
            return (
              <div key={p.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <p className="mb-2 text-sm font-medium">
                  {p.nama_proyek} ({p.kode_proyek})
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {Array.from(byKategori.entries()).map(([kategori, total]) => (
                      <tr key={kategori}>
                        <td className="py-1 pr-3 text-neutral-500">{kategori}</td>
                        <td className="py-1 text-right">{formatRupiah(total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Tren Bulanan</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
                <th className="py-2 pr-3">Bulan</th>
                <th className="py-2 pr-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {trenBulanan.map(([bulan, total]) => (
                <tr key={bulan} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-3">{bulan}</td>
                  <td className="py-2 pr-3 text-right">{formatRupiah(total)}</td>
                </tr>
              ))}
              {trenBulanan.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-neutral-400">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
