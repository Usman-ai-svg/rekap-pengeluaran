import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function NavBar() {
  const current = await getCurrentUser();
  if (!current) return null;

  const { profile } = current;
  const isAdmin = profile.role === "OPS_ADMIN";

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Rekap Pengeluaran
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Beranda
          </Link>
          {isAdmin && (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/admin" className="hover:underline">
                Admin
              </Link>
            </>
          )}
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-500">
            {profile.nama} ({profile.role})
          </span>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
