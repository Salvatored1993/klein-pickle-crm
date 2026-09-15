"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logCheckin } from "@/lib/actions/collab";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall } from "lucide-react";

export function CheckinForm({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneCall className="size-4" />
          Log a check-in
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          className="flex flex-col gap-2"
          action={(formData: FormData) => {
            const body = String(formData.get("body") ?? "").trim();
            if (!body) return;
            startTransition(async () => {
              await logCheckin(customerId, body);
              formRef.current?.reset();
              toast.success("Check-in logged — clock reset");
              router.refresh();
            });
          }}
        >
          <Textarea
            name="body"
            placeholder="What did you cover in this check-in?"
            rows={2}
            required
          />
          <Button type="submit" size="sm" className="self-end" disabled={isPending}>
            {isPending ? "Logging…" : "Log check-in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
