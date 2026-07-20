export type UserRole = "QS" | "OPS_ADMIN";

export type UserProfile = {
  id: string;
  nama: string;
  role: UserRole;
  proyek_assigned: string[];
};

export type Proyek = {
  id: string;
  kode_proyek: string;
  nama_proyek: string;
  nilai_kontrak_rap: number | null;
  status_aktif: boolean;
  created_at: string;
};

export type KategoriPengeluaran = {
  id: number;
  nama: string;
};

export type Pengeluaran = {
  id: string;
  proyek_id: string;
  kategori_id: number;
  tanggal: string;
  keterangan: string;
  volume: number | null;
  satuan: string | null;
  harga_satuan: number | null;
  total: number;
  dicatat_oleh: string;
  dibuat_pada: string;
  catatan: string | null;
  bukti_pembayaran_url: string | null;
};

export type PengeluaranWithRelations = Pengeluaran & {
  proyek: Pick<Proyek, "id" | "kode_proyek" | "nama_proyek">;
  kategori_pengeluaran: Pick<KategoriPengeluaran, "id" | "nama">;
  users: Pick<UserProfile, "id" | "nama">;
};
