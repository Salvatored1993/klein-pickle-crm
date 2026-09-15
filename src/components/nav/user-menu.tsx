"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { signOut } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null;
  role: string;
}) {
  const displayName = fullName ?? email ?? "Unnamed user";
  const [isSigningOut, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut();
      } catch (err) {
        // redirect() inside the action throws internally on success — only
        // a real failure reaches here.
        toast.error(err instanceof Error ? err.message : "Could not sign out");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-2 px-2 py-2"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium leading-none">{displayName}</span>
          <span className="text-xs capitalize text-muted-foreground">
            {role}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut className="size-4" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
