"use server";

import { revalidatePath } from "next/cache";
import { requireOpsAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UNIQUE_VIOLATION = "23505";

export async function createProyek(formData: FormData) {
  await requireOpsAdmin();
  const supabase = await createClient();

  const kodeProyek = String(formData.get("kode_proyek") ?? "").trim();
  const namaProyek = String(formData.get("nama_proyek") ?? "").trim();
  const nilaiRaw = formData.get("nilai_kontrak_rap");
  const nilaiKontrakRap = nilaiRaw && nilaiRaw !== "" ? Number(nilaiRaw) : null;

  if (!kodeProyek || !namaProyek) {
    throw new Error("Kode dan nama proyek wajib diisi.");
  }

  const { error } = await supabase.from("proyek").insert({
    kode_proyek: kodeProyek,
    nama_proyek: namaProyek,
    nilai_kontrak_rap: nilaiKontrakRap,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new Error(`Kode proyek "${kodeProyek}" sudah dipakai. Gunakan kode lain.`);
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateProyekStatus(proyekId: string, statusAktif: boolean) {
  await requireOpsAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("proyek")
    .update({ status_aktif: statusAktif })
    .eq("id", proyekId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createKategori(formData: FormData) {
  await requireOpsAdmin();
  const supabase = await createClient();

  const nama = String(formData.get("nama") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (!nama) throw new Error("Nama kategori wajib diisi.");

  const { error } = await supabase.from("kategori_pengeluaran").insert({ nama });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new Error(`Kategori "${nama}" sudah ada.`);
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin");
}

export async function updateUserAccess(
  userId: string,
  role: "QS" | "OPS_ADMIN",
  proyekAssigned: string[],
) {
  await requireOpsAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ role, proyek_assigned: proyekAssigned })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
