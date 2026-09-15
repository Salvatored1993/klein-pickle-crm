import Link from "next/link";
import { listCustomers } from "@/lib/queries/customers";
import { listProfiles } from "@/app/(app)/admin/actions";
import { profileName, formatDate, isOverdue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <>
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Account owner</TableHead>
                  <TableHead>Last contact</TableHead>
                  <TableHead>Next check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const overdue = customer.is_active && isOverdue(customer.next_checkin_date);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {customer.company_name}
                        </Link>
                      </TableCell>
                      <TableCell>{profileName(profiles, customer.salesperson_id)}</TableCell>
                      <TableCell>{formatDate(customer.last_contact_date)}</TableCell>
                      <TableCell>
                        <span className={overdue ? "font-medium text-destructive" : undefined}>
                          {formatDate(customer.next_checkin_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!customer.is_active ? (
                          <Badge variant="secondary">Inactive</Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">On track</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {customers.map((customer) => {
              const overdue = customer.is_active && isOverdue(customer.next_checkin_date);
              return (
                <li key={customer.id}>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex flex-col gap-1 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{customer.company_name}</span>
                      {!customer.is_active ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : overdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="secondary">On track</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {profileName(profiles, customer.salesperson_id)}
                    </span>
                    <span
                      className={
                        overdue ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"
                      }
                    >
                      Next check-in {formatDate(customer.next_checkin_date)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
