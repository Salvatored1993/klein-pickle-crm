import Link from "next/link";
import { listCustomers } from "@/lib/queries/customers";
import { listProfiles } from "@/app/(app)/admin/actions";
import { CustomersList } from "@/components/customers/customers-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CustomersPage() {
  const [customers, profiles] = await Promise.all([listCustomers(), listProfiles()]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button render={<Link href="/customers/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customers yet — add your existing accounts here.
        </p>
      ) : (
        <CustomersList customers={customers} profiles={profiles} />
      )}
    </div>
  );
}
