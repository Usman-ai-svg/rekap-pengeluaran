"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16">
      <h1 className="text-lg font-semibold">Terjadi kesalahan</h1>
      <p className="text-sm text-neutral-500">{error.message || "Terjadi kesalahan tak terduga."}</p>
      <button
        onClick={reset}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
      >
        Coba lagi
      </button>
    </div>
  );
}
