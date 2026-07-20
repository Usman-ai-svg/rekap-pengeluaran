import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export async function getCurrentUser(): Promise<{
  authId: string;
  email: string | null;
  profile: UserProfile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, nama, role, proyek_assigned")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { authId: user.id, email: user.email ?? null, profile };
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

export async function requireOpsAdmin() {
  const current = await requireUser();
  if (current.profile.role !== "OPS_ADMIN") redirect("/");
  return current;
}
