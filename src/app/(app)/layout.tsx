import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { BottomNav } from "@/components/nav/bottom-nav";
import { UserMenu } from "@/components/nav/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/leads" className="text-sm font-semibold">
            Klein Pickle CRM
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav role={user.role} />
        </div>
        <div className="border-t p-2">
          <UserMenu fullName={user.full_name} role={user.role} />
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link href="/leads" className="text-sm font-semibold">
            Klein Pickle CRM
          </Link>
          <UserMenu fullName={user.full_name} role={user.role} />
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        <BottomNav role={user.role} />
      </div>
    </div>
  );
}
