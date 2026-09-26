"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { profileName, displayName, formatCurrency, formatDate, isOverdue } from "@/lib/format";
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

type Lead = Database["public"]["Views"]["leads_with_totals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function LeadsList({ leads, profiles }: { leads: Lead[]; profiles: Profile[] }) {
  const [salespersonId, setSalespersonId] = useState(ALL_SALESPEOPLE);

  const salespeople = useMemo(
    () =>
      profiles
        .filter((p) => ["admin", "sales"].includes(p.role))
        .map((p) => ({ id: p.id, name: displayName(p.full_name, p.email) })),
    [profiles],
  );

  const visibleLeads = useMemo(
    () =>
      salespersonId === ALL_SALESPEOPLE
        ? leads
        : leads.filter((l) => l.salesperson_id === salespersonId),
    [leads, salespersonId],
  );

  return (
    <div className="flex flex-col gap-4">
      <SalespersonFilter
        value={salespersonId}
        onChange={setSalespersonId}
        salespeople={salespeople}
      />

      {visibleLeads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leads match this filter.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Est. annual sales</TableHead>
                  <TableHead>Next follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLeads.map((lead) => {
                  // Details come back null from the DB for a lead that
                  // isn't yours (privacy — see leads_with_totals) —
                  // sales_stage is never legitimately null on a real row,
                  // so its absence is a reliable "this is masked" signal.
                  const isPrivate = lead.sales_stage === null;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                          {lead.company_name}
                        </Link>
                      </TableCell>
                      <TableCell>{profileName(profiles, lead.salesperson_id)}</TableCell>
                      <TableCell>
                        {isPrivate ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Private
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{lead.sales_stage}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPrivate ? (
                          <span className="text-muted-foreground">Private</span>
                        ) : (
                          formatCurrency(lead.estimated_annual_sales)
                        )}
                      </TableCell>
                      <TableCell>
                        {isPrivate ? (
                          <span className="text-muted-foreground">Private</span>
                        ) : (
                          <span
                            className={
                              isOverdue(lead.next_follow_up_date) &&
                              !["Won", "Lost"].includes(lead.sales_stage ?? "")
                                ? "font-medium text-destructive"
                                : undefined
                            }
                          >
                            {formatDate(lead.next_follow_up_date)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {visibleLeads.map((lead) => {
              const isPrivate = lead.sales_stage === null;
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex flex-col gap-1 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{lead.company_name}</span>
                      {isPrivate ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{lead.sales_stage}</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {profileName(profiles, lead.salesperson_id)}
                    </span>
                    {isPrivate ? (
                      <span className="text-sm text-muted-foreground">Details private</span>
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatCurrency(lead.estimated_annual_sales)}</span>
                        <span
                          className={
                            isOverdue(lead.next_follow_up_date) &&
                            !["Won", "Lost"].includes(lead.sales_stage ?? "")
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          Follow up {formatDate(lead.next_follow_up_date)}
                        </span>
                      </div>
                    )}
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
