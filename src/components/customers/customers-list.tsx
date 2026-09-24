"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { profileName, displayName, formatDate, isOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalespersonFilter, ALL_SALESPEOPLE } from "@/components/filters/salesperson-filter";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function CustomersList({
  customers,
  profiles,
}: {
  customers: Customer[];
  profiles: Profile[];
}) {
  const [salespersonId, setSalespersonId] = useState(ALL_SALESPEOPLE);

  const salespeople = useMemo(
    () =>
      profiles
        .filter((p) => ["admin", "sales"].includes(p.role))
        .map((p) => ({ id: p.id, name: displayName(p.full_name, p.email) })),
    [profiles],
  );

  const visibleCustomers = useMemo(
    () =>
      salespersonId === ALL_SALESPEOPLE
        ? customers
        : customers.filter((c) => c.salesperson_id === salespersonId),
    [customers, salespersonId],
  );

  return (
    <div className="flex flex-col gap-4">
      <SalespersonFilter
        value={salespersonId}
        onChange={setSalespersonId}
        salespeople={salespeople}
      />

      {visibleCustomers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers match this filter.</p>
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
                {visibleCustomers.map((customer) => {
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
            {visibleCustomers.map((customer) => {
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
                        overdue
                          ? "text-sm font-medium text-destructive"
                          : "text-sm text-muted-foreground"
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
