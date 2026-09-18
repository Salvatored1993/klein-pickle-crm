import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listUpcomingForCalendar } from "@/lib/queries/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const items = await listUpcomingForCalendar(
    currentUser.role === "admin" ? null : currentUser.id,
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-semibold">Calendar</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {currentUser.role === "admin"
          ? "Every lead follow-up and customer check-in across the team."
          : "Your lead follow-ups and customer check-ins."}
      </p>
      <div className="max-w-md">
        <CalendarView items={items} />
      </div>
    </div>
  );
}
