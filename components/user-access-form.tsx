"use client";

import { useState } from "react";
import type { Proyek, UserProfile } from "@/lib/types";

type Props = {
  user: UserProfile;
  proyekList: Proyek[];
  action: (role: "QS" | "OPS_ADMIN", proyekAssigned: string[]) => void;
};

export function UserAccessForm({ user, proyekList, action }: Props) {
  const [role, setRole] = useState<"QS" | "OPS_ADMIN">(user.role);
  const [assigned, setAssigned] = useState<string[]>(user.proyek_assigned);

  function toggle(proyekId: string) {
    setAssigned((prev) =>
      prev.includes(proyekId) ? prev.filter((id) => id !== proyekId) : [...prev, proyekId],
    );
  }

  return (
    <form
      action={() => action(role, assigned)}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{user.nama}</p>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "QS" | "OPS_ADMIN")}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="QS">QS</option>
          <option value="OPS_ADMIN">OPS_ADMIN</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        {proyekList.map((p) => (
          <label key={p.id} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={assigned.includes(p.id)}
              onChange={() => toggle(p.id)}
            />
            {p.kode_proyek}
          </label>
        ))}
      </div>
      <button
        type="submit"
        className="mt-1 self-start rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Simpan
      </button>
    </form>
  );
}
