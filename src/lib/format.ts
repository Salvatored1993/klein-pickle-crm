import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function profileName(
  profiles: Pick<Profile, "id" | "full_name" | "email">[],
  id: string | null,
) {
  if (!id) return null;
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return "Unknown";
  return profile.full_name ?? profile.email ?? "Unknown";
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(`${dateStr}T00:00:00`) < new Date(new Date().toDateString());
}
