import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    redirect("/leads");
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Management metrics will live here.
      </p>
    </div>
  );
}
