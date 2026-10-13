"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { profileName, displayName, formatDate, isOverdue } from "@/lib/format";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalespersonFilter, ALL_SALESPEOPLE } from "@/components/filters/salesperson-filter";

// Case-insensitive and ignores punctuation/spacing, so "tonys" finds
// "Tony`s Liquor" and "smartf" finds "Smart & Final".
function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

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
  const [search, setSearch] = useState("");

  const salespeople = useMemo(
    () =>
      profiles
        .filter((p) => ["admin", "sales"].includes(p.role))
        .map((p) => ({ id: p.id, name: displayName(p.full_name, p.email) })),
    [profiles],
  );

  const visibleCustomers = useMemo(() => {
    const bySalesperson =
      salespersonId === ALL_SALESPEOPLE
        ? customers
        : customers.filter((c) => c.salesperson_id === salespersonId);
    const query = normalize(search);
    if (!query) return bySalesperson;
    // Names that start with what was typed come first, then any other
    // name containing it (e.g. "fin" finds "Smart & Final #499").
    const matches = bySalesperson.filter((c) => normalize(c.company_name).includes(query));
    return [
      ...matches.filter((c) => normalize(c.company_name).startsWith(query)),
      ...matches.filter((c) => !normalize(c.company_name).startsWith(query)),
    ];
  }, [customers, salespersonId, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            aria-label="Search customers by name"
            className="pl-8"
          />
        </div>
        <SalespersonFilter
          value={salespersonId}
          onChange={setSalespersonId}
          salespeople={salespeople}
        />
      </div>

      {visibleCustomers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search ? `No customers match "${search}".` : "No customers match this filter."}
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
