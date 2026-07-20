"use client";

import { useState } from "react";
import type { KategoriPengeluaran, Pengeluaran } from "@/lib/types";

type Props = {
  proyekId: string;
  kategoriList: KategoriPengeluaran[];
  action: (formData: FormData) => void;
  defaultValues?: Pengeluaran;
  submitLabel: string;
};

export function PengeluaranForm({
  proyekId,
  kategoriList,
  action,
  defaultValues,
  submitLabel,
}: Props) {
  const [volume, setVolume] = useState(defaultValues?.volume?.toString() ?? "");
  const [hargaSatuan, setHargaSatuan] = useState(
    defaultValues?.harga_satuan?.toString() ?? "",
  );
  const [total, setTotal] = useState(defaultValues?.total?.toString() ?? "");
  const [totalTouched, setTotalTouched] = useState(false);

  function recalcTotal(nextVolume: string, nextHarga: string) {
    if (totalTouched) return;
    const v = Number(nextVolume);
    const h = Number(nextHarga);
    if (nextVolume && nextHarga && Number.isFinite(v) && Number.isFinite(h)) {
      setTotal(String(v * h));
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4 max-w-xl">
      <input type="hidden" name="proyek_id" value={proyekId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="kategori_id" className="text-sm font-medium">
          Kategori
        </label>
        <select
          id="kategori_id"
          name="kategori_id"
          required
          defaultValue={defaultValues?.kategori_id ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          {kategoriList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tanggal" className="text-sm font-medium">
          Tanggal
        </label>
        <input
          id="tanggal"
          name="tanggal"
          type="date"
          required
          defaultValue={defaultValues?.tanggal ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="keterangan" className="text-sm font-medium">
          Keterangan
        </label>
        <input
          id="keterangan"
          name="keterangan"
          type="text"
          required
          placeholder="Deskripsi item/pekerjaan"
          defaultValue={defaultValues?.keterangan ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="volume" className="text-sm font-medium">
            Volume <span className="text-neutral-400">(opsional)</span>
          </label>
          <input
            id="volume"
            name="volume"
            type="number"
            step="any"
            value={volume}
            onChange={(e) => {
              setVolume(e.target.value);
              recalcTotal(e.target.value, hargaSatuan);
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="satuan" className="text-sm font-medium">
            Satuan
          </label>
          <input
            id="satuan"
            name="satuan"
            type="text"
            placeholder="ls, m2, unit, dst"
            defaultValue={defaultValues?.satuan ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="harga_satuan" className="text-sm font-medium">
          Harga Satuan <span className="text-neutral-400">(opsional)</span>
        </label>
        <input
          id="harga_satuan"
          name="harga_satuan"
          type="number"
          step="any"
          value={hargaSatuan}
          onChange={(e) => {
            setHargaSatuan(e.target.value);
            recalcTotal(volume, e.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="total" className="text-sm font-medium">
          Total
        </label>
        <input
          id="total"
          name="total"
          type="number"
          step="any"
          required
          value={total}
          onChange={(e) => {
            setTotalTouched(true);
            setTotal(e.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="text-xs text-neutral-400">
          Otomatis dari volume × harga satuan. Untuk item borongan/lumpsum, isi langsung.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="catatan" className="text-sm font-medium">
          Catatan <span className="text-neutral-400">(opsional)</span>
        </label>
        <textarea
          id="catatan"
          name="catatan"
          rows={2}
          defaultValue={defaultValues?.catatan ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bukti" className="text-sm font-medium">
          Bukti Pembayaran{defaultValues ? " (ganti file, opsional)" : ""}
        </label>
        <input
          id="bukti"
          name="bukti"
          type="file"
          accept="image/*,.pdf"
          required={!defaultValues}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-2 file:py-1 dark:border-neutral-700 dark:bg-neutral-900 dark:file:bg-neutral-800"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
      >
        {submitLabel}
      </button>
    </form>
  );
}
