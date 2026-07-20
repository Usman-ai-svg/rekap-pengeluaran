import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PengeluaranForm } from "@/components/pengeluaran-form";
import { updatePengeluaran } from "../../actions";
import type { KategoriPengeluaran, Pengeluaran, Proyek } from "@/lib/types";

export default async function EditPengeluaranPage({
  params,
}: {
  params: Promise<{ id: string; pengeluaranId: string }>;
}) {
  const { id, pengeluaranId } = await params;
  await requireUser();
  const supabase = await createClient();

  const [{ data: proyek }, { data: kategoriList }, { data: pengeluaran }] =
    await Promise.all([
      supabase.from("proyek").select("*").eq("id", id).single(),
      supabase.from("kategori_pengeluaran").select("*").order("nama"),
      supabase.from("pengeluaran").select("*").eq("id", pengeluaranId).single(),
    ]);

  if (!proyek || !pengeluaran) notFound();

  const updateWithId = updatePengeluaran.bind(null, pengeluaranId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Edit Pengeluaran</h1>
        <p className="text-sm text-neutral-500">
          {(proyek as Proyek).nama_proyek} ({(proyek as Proyek).kode_proyek})
        </p>
      </div>
      <PengeluaranForm
        proyekId={id}
        kategoriList={(kategoriList ?? []) as KategoriPengeluaran[]}
        action={updateWithId}
        defaultValues={pengeluaran as Pengeluaran}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
