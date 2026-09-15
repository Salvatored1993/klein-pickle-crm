"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCustomer,
  updateCustomer,
  type CustomerInput,
} from "@/app/(app)/customers/actions";
import type { Database } from "@/lib/database.types";
import { CUSTOMER_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProductChecklist } from "@/components/products/product-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

export function CustomerForm({
  mode,
  customer,
  initialProductIds = [],
  salespeople,
  products,
  currentUser,
}: {
  mode: "create" | "edit";
  customer?: Customer;
  initialProductIds?: string[];
  salespeople: Profile[];
  products: Product[];
  currentUser: Profile;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<CustomerInput>(
    customer ?? {
      salesperson_id: currentUser.id,
      company_name: "",
      checkin_frequency_days: 30,
      is_active: true,
    },
  );
  const [productIds, setProductIds] = useState<string[]>(initialProductIds);

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProduct(id: string) {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createCustomer(values, productIds);
        } else if (customer) {
          await updateCustomer(customer.id, values, productIds);
          toast.success("Customer updated");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const canPickSalesperson = currentUser.role === "admin";
  const canEdit =
    mode === "create" ||
    currentUser.role === "admin" ||
    currentUser.id === customer?.salesperson_id;
  const accountOwner = customer
    ? salespeople.find((p) => p.id === customer.salesperson_id)
    : undefined;
  const ownerName = accountOwner?.full_name ?? accountOwner?.email ?? "another salesperson";
  const assignedSalesperson = salespeople.find((p) => p.id === values.salesperson_id);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-24 md:pb-6">
      {!canEdit ? (
        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          You&apos;re viewing {ownerName}&apos;s customer. Only they or an admin can make
          changes here — you can still add tasks and comments below.
        </p>
      ) : null}
      <fieldset disabled={!canEdit} className="contents">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Account owner</Label>
            {canPickSalesperson ? (
              <Select
                value={values.salesperson_id}
                onValueChange={(v) => v && set("salesperson_id", v)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) =>
                      salespeople.find((p) => p.id === v)?.full_name ??
                      salespeople.find((p) => p.id === v)?.email ??
                      ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {salespeople.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={assignedSalesperson?.full_name ?? assignedSalesperson?.email ?? ""}
                disabled
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              required
              value={values.company_name}
              onChange={(e) => set("company_name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="primary_contact_name">Primary contact</Label>
            <Input
              id="primary_contact_name"
              value={values.primary_contact_name ?? ""}
              onChange={(e) => set("primary_contact_name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact_email">Contact email</Label>
            <Input
              id="contact_email"
              type="email"
              value={values.contact_email ?? ""}
              onChange={(e) => set("contact_email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact_phone">Contact phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={values.contact_phone ?? ""}
              onChange={(e) => set("contact_phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Customer type</Label>
            <Select
              value={values.customer_type ?? undefined}
              onValueChange={(v) => set("customer_type", v as CustomerInput["customer_type"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="distributor">Distributor</Label>
            <Input
              id="distributor"
              value={values.distributor ?? ""}
              onChange={(e) => set("distributor", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="ship_to_locations">Ship-to locations</Label>
            <Textarea
              id="ship_to_locations"
              rows={2}
              value={values.ship_to_locations ?? ""}
              onChange={(e) => set("ship_to_locations", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Products purchased</Label>
            <ProductChecklist
              products={products}
              selectedIds={productIds}
              onToggle={toggleProduct}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in cadence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="checkin_frequency_days">Check in every (days)</Label>
            <Input
              id="checkin_frequency_days"
              type="number"
              min={1}
              value={values.checkin_frequency_days ?? 30}
              onChange={(e) => set("checkin_frequency_days", Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="is_active">Active account</Label>
            <Switch
              id="is_active"
              checked={values.is_active ?? true}
              onCheckedChange={(v) => set("is_active", v)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="next_action">Next action</Label>
            <Input
              id="next_action"
              value={values.next_action ?? ""}
              onChange={(e) => set("next_action", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="next_checkin_date">Next check-in date</Label>
            <Input
              id="next_checkin_date"
              type="date"
              value={values.next_checkin_date ?? ""}
              onChange={(e) => set("next_checkin_date", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={values.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is a general summary and gets overwritten each edit. For a dated
              history of updates, use the Activity tab instead.
            </p>
          </div>
        </CardContent>
      </Card>
      </fieldset>

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background p-3 md:static md:border-none md:bg-transparent md:p-0">
          <Button type="submit" disabled={isPending} className="w-full md:w-auto">
            {isPending ? "Saving…" : mode === "create" ? "Add customer" : "Save changes"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
