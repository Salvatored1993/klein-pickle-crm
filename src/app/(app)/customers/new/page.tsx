import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listSalespeople } from "@/lib/queries/profiles";
import { listActiveProducts } from "@/lib/queries/products";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function NewCustomerPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [salespeople, products] = await Promise.all([
    listSalespeople(),
    listActiveProducts(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">New customer</h1>
      <div className="max-w-3xl">
        <CustomerForm
          mode="create"
          salespeople={salespeople}
          products={products}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
