import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { listProfiles, listProducts } from "@/app/(app)/admin/actions";
import { UserRoleTable } from "@/components/admin/user-role-table";
import { ProductCatalog } from "@/components/admin/product-catalog";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    redirect("/leads");
  }

  const [profiles, products] = await Promise.all([listProfiles(), listProducts()]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid max-w-3xl gap-6">
        <UserRoleTable profiles={profiles} currentUserId={user.id} />
        <ProductCatalog products={products} />
      </div>
    </div>
  );
}
