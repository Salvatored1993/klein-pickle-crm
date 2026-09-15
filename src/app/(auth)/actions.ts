"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return "Incorrect email or password.";
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ResetRequestResult = { status: "idle" | "sent" | "error"; message?: string };

export async function requestPasswordReset(
  _prevState: ResetRequestResult,
  formData: FormData,
): Promise<ResetRequestResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error", message: "Enter your email address." };

  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) return { status: "error", message: error.message };
  return { status: "sent" };
}

export async function updatePassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
