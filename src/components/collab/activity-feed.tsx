"use client";

import { useRef, useTransition } from "react";
import { addComment } from "@/lib/actions/collab";
import type { Database } from "@/lib/database.types";
import { profileName, formatDateTime } from "@/lib/format";
import { describeActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Activity = Database["public"]["Tables"]["activity"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function ActivityFeed({
  target,
  activity,
  profiles,
}: {
  target: { leadId?: string; customerId?: string };
  activity: Activity[];
  profiles: Profile[];
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        className="flex flex-col gap-2"
        action={(formData: FormData) => {
          const body = String(formData.get("body") ?? "").trim();
          if (!body) return;
          startTransition(async () => {
            await addComment(target, body);
            formRef.current?.reset();
          });
        }}
      >
        <Textarea
          name="body"
          placeholder="Add a comment…"
          rows={2}
          required
        />
        <Button type="submit" size="sm" className="self-end" disabled={isPending}>
          {isPending ? "Posting…" : "Post comment"}
        </Button>
      </form>

      <ul className="flex flex-col gap-3">
        {activity.map((item) => {
          const description = describeActivity(item);
          const author = profileName(profiles, item.author_id);
          return (
            <li key={item.id} className="border-b pb-3 last:border-none">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{author ?? "System"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </span>
              </div>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : (
                <p className="text-sm">{item.body}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
