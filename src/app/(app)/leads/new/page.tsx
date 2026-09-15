import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listSalespeople } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { LeadForm } from "@/components/leads/lead-form";

export default async function NewLeadPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [salespeople, products] = await Promise.all([
    listSalespeople(),
    listActiveProducts(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">New lead</h1>
      <div className="max-w-3xl">
        <LeadForm
          mode="create"
          salespeople={salespeople}
          products={products}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
