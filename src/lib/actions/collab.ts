"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus, TaskPriority } from "@/lib/database.types";

type Target = { leadId?: string; customerId?: string };

function targetPath({ leadId, customerId }: Target) {
  return leadId ? `/leads/${leadId}` : `/customers/${customerId}`;
}

export async function createTask(
  target: Target,
  input: {
    title: string;
    description?: string;
    assignedTo?: string;
    priority?: TaskPriority;
    dueDate?: string;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    lead_id: target.leadId ?? null,
    customer_id: target.customerId ?? null,
    title: input.title,
    description: input.description || null,
    assigned_to: input.assignedTo || null,
    priority: input.priority ?? "Medium",
    due_date: input.dueDate || null,
    created_by: user?.id,
  });

  if (error) throw error;
  revalidatePath(targetPath(target));
}

export async function setTaskStatus(
  taskId: string,
  status: TaskStatus,
  target: Target,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "Done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath(targetPath(target));
}

export async function addComment(target: Target, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("activity").insert({
    lead_id: target.leadId ?? null,
    customer_id: target.customerId ?? null,
    author_id: user?.id,
    activity_type: "comment",
    body,
  });

  if (error) throw error;
  revalidatePath(targetPath(target));
}

export async function logCheckin(customerId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("activity").insert({
    customer_id: customerId,
    author_id: user?.id,
    activity_type: "checkin",
    body,
  });

  if (error) throw error;
  revalidatePath(`/customers/${customerId}`);
}
