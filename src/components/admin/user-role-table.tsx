"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole, setUserActive } from "@/app/(app)/admin/actions";
import type { Database, UserRole } from "@/lib/database.types";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const ROLES: UserRole[] = ["admin", "sales", "qa", "operations"];

export function UserRoleTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team members</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {profile.full_name ?? "Unnamed"}
                {profile.id === currentUserId ? " (you)" : ""}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={profile.role}
                disabled={isPending || profile.id === currentUserId}
                onValueChange={(v) =>
                  v &&
                  startTransition(async () => {
                    await setUserRole(profile.id, v as UserRole);
                    router.refresh();
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                checked={profile.is_active}
                disabled={isPending || profile.id === currentUserId}
                onCheckedChange={(v) =>
                  startTransition(async () => {
                    await setUserActive(profile.id, v);
                    router.refresh();
                  })
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
