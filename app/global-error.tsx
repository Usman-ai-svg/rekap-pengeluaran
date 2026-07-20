"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16 px-4">
          <h1 className="text-lg font-semibold">Aplikasi gagal dimuat</h1>
          <p className="text-sm text-neutral-500">
            {error.message || "Terjadi kesalahan tak terduga. Cek koneksi ke Supabase (env var NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)."}
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
