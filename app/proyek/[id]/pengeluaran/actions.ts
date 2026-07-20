"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function uploadBukti(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proyekId: string,
  file: File,
) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${proyekId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("bukti-pembayaran")
    .upload(path, file);
  if (error) throw new Error(`Gagal upload bukti pembayaran: ${error.message}`);
  return path;
}

function parseFields(formData: FormData) {
  const proyekId = String(formData.get("proyek_id") ?? "");
  const kategoriId = Number(formData.get("kategori_id"));
  const tanggal = String(formData.get("tanggal") ?? "");
  const keterangan = String(formData.get("keterangan") ?? "").trim();
  const volumeRaw = formData.get("volume");
  const satuanRaw = formData.get("satuan");
  const hargaSatuanRaw = formData.get("harga_satuan");
  const totalRaw = formData.get("total");
  const catatanRaw = formData.get("catatan");

  const volume = volumeRaw && volumeRaw !== "" ? Number(volumeRaw) : null;
  const satuan = satuanRaw && satuanRaw !== "" ? String(satuanRaw) : null;
  const hargaSatuan =
    hargaSatuanRaw && hargaSatuanRaw !== "" ? Number(hargaSatuanRaw) : null;
  const total = Number(totalRaw);
  const catatan = catatanRaw && catatanRaw !== "" ? String(catatanRaw) : null;

  if (!proyekId || !kategoriId || !tanggal || !keterangan || !Number.isFinite(total)) {
    throw new Error("Data tidak lengkap. Pastikan semua field wajib terisi.");
  }

  return { proyekId, kategoriId, tanggal, keterangan, volume, satuan, hargaSatuan, total, catatan };
}

export async function createPengeluaran(formData: FormData) {
  const { authId } = await requireUser();
  const supabase = await createClient();
  const fields = parseFields(formData);

  const file = formData.get("bukti") as File | null;
  let buktiPath: string | null = null;
  if (file && file.size > 0) {
    buktiPath = await uploadBukti(supabase, fields.proyekId, file);
  }

  const { error } = await supabase.from("pengeluaran").insert({
    proyek_id: fields.proyekId,
    kategori_id: fields.kategoriId,
    tanggal: fields.tanggal,
    keterangan: fields.keterangan,
    volume: fields.volume,
    satuan: fields.satuan,
    harga_satuan: fields.hargaSatuan,
    total: fields.total,
    dicatat_oleh: authId,
    catatan: fields.catatan,
    bukti_pembayaran_url: buktiPath,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/proyek/${fields.proyekId}/pengeluaran`);
  redirect(`/proyek/${fields.proyekId}/pengeluaran`);
}

export async function updatePengeluaran(pengeluaranId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const fields = parseFields(formData);

  const file = formData.get("bukti") as File | null;
  let buktiPath: string | undefined;
  if (file && file.size > 0) {
    buktiPath = await uploadBukti(supabase, fields.proyekId, file);
  }

  const { error } = await supabase
    .from("pengeluaran")
    .update({
      kategori_id: fields.kategoriId,
      tanggal: fields.tanggal,
      keterangan: fields.keterangan,
      volume: fields.volume,
      satuan: fields.satuan,
      harga_satuan: fields.hargaSatuan,
      total: fields.total,
      catatan: fields.catatan,
      ...(buktiPath ? { bukti_pembayaran_url: buktiPath } : {}),
    })
    .eq("id", pengeluaranId);

  if (error) throw new Error(error.message);

  revalidatePath(`/proyek/${fields.proyekId}/pengeluaran`);
  redirect(`/proyek/${fields.proyekId}/pengeluaran`);
}

export async function deletePengeluaran(proyekId: string, pengeluaranId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("pengeluaran")
    .delete()
    .eq("id", pengeluaranId);

  if (error) throw new Error(error.message);

  revalidatePath(`/proyek/${proyekId}/pengeluaran`);
}
