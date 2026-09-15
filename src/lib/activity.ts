import type { Database } from "@/lib/database.types";

type Activity = Database["public"]["Tables"]["activity"]["Row"];

export function describeActivity(activity: Activity) {
  const meta = (activity.metadata ?? {}) as Record<string, string>;
  switch (activity.activity_type) {
    case "lead_created":
      return "created this lead";
    case "customer_created":
      return "added this customer";
    case "stage_change":
      return `moved the stage from ${meta.from_stage} to ${meta.to_stage}`;
    case "checkin":
      return "logged a check-in";
    default:
      return null;
  }
}
