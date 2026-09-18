import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Nobody's account has a full_name set (they were created directly in
// Supabase, which doesn't collect one) — fall back to the email's local
// part, capitalized, rather than showing the raw address or "Unnamed".
export function nameFromEmail(email: string | null) {
  if (!email) return null;
  const localPart = email.split("@")[0];
  if (!localPart) return null;
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export function displayName(
  fullName: string | null,
  email: string | null,
  fallback = "Unnamed",
) {
  return fullName ?? nameFromEmail(email) ?? fallback;
}

export function profileName(
  profiles: Pick<Profile, "id" | "full_name" | "email">[],
  id: string | null,
) {
  if (!id) return null;
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return "Unknown";
  return displayName(profile.full_name, profile.email, "Unknown");
}

export function productLabel(product: { item_number: string; name: string }) {
  return `${product.item_number} - ${product.name}`;
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
