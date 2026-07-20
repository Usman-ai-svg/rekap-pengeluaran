import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PengeluaranForm } from "@/components/pengeluaran-form";
import { createPengeluaran } from "../actions";
import type { KategoriPengeluaran, Proyek } from "@/lib/types";

export default async function CatatPengeluaranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const [{ data: proyek }, { data: kategoriList }] = await Promise.all([
    supabase.from("proyek").select("*").eq("id", id).single(),
    supabase.from("kategori_pengeluaran").select("*").order("nama"),
  ]);

  if (!proyek) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Catat Pengeluaran</h1>
        <p className="text-sm text-neutral-500">
          {(proyek as Proyek).nama_proyek} ({(proyek as Proyek).kode_proyek})
        </p>
      </div>
      <PengeluaranForm
        proyekId={id}
        kategoriList={(kategoriList ?? []) as KategoriPengeluaran[]}
        action={createPengeluaran}
        submitLabel="Simpan Pengeluaran"
      />
    </div>
  );
}
