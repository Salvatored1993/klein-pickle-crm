import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listUpcomingForCalendar } from "@/lib/queries/calendar";
import { listSalespeople } from "@/lib/queries/profiles";
import { displayName } from "@/lib/format";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const isAdmin = currentUser.role === "admin";

  const [items, salespeople] = await Promise.all([
    listUpcomingForCalendar(isAdmin ? null : currentUser.id),
    isAdmin ? listSalespeople() : Promise.resolve(null),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-semibold">Calendar</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {isAdmin
          ? "Every lead follow-up and customer check-in across the team — filter by salesperson below."
          : "Your lead follow-ups and customer check-ins."}
      </p>
      <div className="max-w-md">
        <CalendarView
          items={items}
          salespeople={
            salespeople?.map((p) => ({ id: p.id, name: displayName(p.full_name, p.email) })) ??
            undefined
          }
        />
      </div>
    </div>
  );
}
