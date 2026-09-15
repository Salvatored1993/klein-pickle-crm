"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { Database, PackSize } from "@/lib/database.types";
import type { LeadProductLineItem } from "@/app/(app)/leads/actions";
import { PACK_SIZES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = Database["public"]["Tables"]["products"]["Row"];

const EMPTY_STAGING: Omit<LeadProductLineItem, "productId"> = {
  packSizes: [],
  proposedVolume: null,
  volumeUnit: null,
  estimatedAnnualVolume: null,
  estimatedAnnualSales: null,
  targetPrice: null,
};

function formatCurrencyShort(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductLineItems({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: LeadProductLineItem[];
  onChange: (value: LeadProductLineItem[]) => void;
}) {
  const [stagingProductId, setStagingProductId] = useState<string>("");
  const [staging, setStaging] = useState(EMPTY_STAGING);

  const groups = new Map<string, Product[]>();
  for (const product of products) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category)!.push(product);
  }

  function setStagingField<K extends keyof typeof EMPTY_STAGING>(
    key: K,
    val: (typeof EMPTY_STAGING)[K],
  ) {
    setStaging((prev) => ({ ...prev, [key]: val }));
  }

  function toggleStagingSize(size: PackSize) {
    setStaging((prev) => ({
      ...prev,
      packSizes: prev.packSizes.includes(size)
        ? prev.packSizes.filter((s) => s !== size)
        : [...prev.packSizes, size],
    }));
  }

  function addOrUpdateLineItem() {
    if (!stagingProductId) return;
    const next = value.filter((item) => item.productId !== stagingProductId);
    next.push({ productId: stagingProductId, ...staging });
    onChange(next);
    setStagingProductId("");
    setStaging(EMPTY_STAGING);
  }

  function removeLineItem(productId: string) {
    onChange(value.filter((item) => item.productId !== productId));
  }

  function editLineItem(item: LeadProductLineItem) {
    setStagingProductId(item.productId);
    setStaging({
      packSizes: item.packSizes,
      proposedVolume: item.proposedVolume,
      volumeUnit: item.volumeUnit,
      estimatedAnnualVolume: item.estimatedAnnualVolume,
      estimatedAnnualSales: item.estimatedAnnualSales,
      targetPrice: item.targetPrice,
    });
    onChange(value.filter((v) => v.productId !== item.productId));
  }

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "Unknown product";
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((item) => {
            const details = [
              item.packSizes.length > 0 ? item.packSizes.join(", ") : null,
              item.proposedVolume
                ? `${item.proposedVolume} ${item.volumeUnit ?? "units"} proposed`
                : null,
              item.estimatedAnnualVolume
                ? `${item.estimatedAnnualVolume} ${item.volumeUnit ?? "units"}/yr est.`
                : null,
              formatCurrencyShort(item.estimatedAnnualSales)
                ? `${formatCurrencyShort(item.estimatedAnnualSales)}/yr`
                : null,
              formatCurrencyShort(item.targetPrice)
                ? `${formatCurrencyShort(item.targetPrice)} target`
                : null,
            ].filter(Boolean);

            return (
              <li
                key={item.productId}
                className="flex items-start justify-between gap-2 rounded-md border p-2"
              >
                <button
                  type="button"
                  onClick={() => editLineItem(item)}
                  className="flex-1 text-left text-sm hover:underline"
                >
                  <span className="font-medium">{productName(item.productId)}</span>
                  {details.length > 0 ? (
                    <span className="text-muted-foreground"> — {details.join(" · ")}</span>
                  ) : (
                    <span className="text-muted-foreground"> — no details yet</span>
                  )}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLineItem(item.productId)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No products added yet — pick one below and fill in its details.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-md border p-3">
        <Select value={stagingProductId} onValueChange={(v) => setStagingProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a product">
              {(v: string | null) => (v ? productName(v) : "Choose a product")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Array.from(groups.entries()).map(([category, items]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {items.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Pack size(s)</Label>
          <div className="flex flex-wrap gap-3">
            {PACK_SIZES.map((size) => (
              <label key={size} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={staging.packSizes.includes(size)}
                  onCheckedChange={() => toggleStagingSize(size)}
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-proposed-volume">
              Proposed volume
            </Label>
            <Input
              id="li-proposed-volume"
              type="number"
              value={staging.proposedVolume ?? ""}
              onChange={(e) =>
                setStagingField(
                  "proposedVolume",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-volume-unit">
              Volume unit
            </Label>
            <Input
              id="li-volume-unit"
              placeholder="e.g. cases, pallets, lbs"
              value={staging.volumeUnit ?? ""}
              onChange={(e) => setStagingField("volumeUnit", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-annual-volume">
              Estimated annual volume
            </Label>
            <Input
              id="li-annual-volume"
              type="number"
              value={staging.estimatedAnnualVolume ?? ""}
              onChange={(e) =>
                setStagingField(
                  "estimatedAnnualVolume",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-annual-sales">
              Estimated annual sales ($)
            </Label>
            <Input
              id="li-annual-sales"
              type="number"
              value={staging.estimatedAnnualSales ?? ""}
              onChange={(e) =>
                setStagingField(
                  "estimatedAnnualSales",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-target-price">
              Target price ($)
            </Label>
            <Input
              id="li-target-price"
              type="number"
              step="0.01"
              value={staging.targetPrice ?? ""}
              onChange={(e) =>
                setStagingField("targetPrice", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={!stagingProductId}
          onClick={addOrUpdateLineItem}
        >
          <Plus className="size-4" />
          {value.some((i) => i.productId === stagingProductId)
            ? "Update product"
            : "Add product"}
        </Button>
      </div>
    </div>
  );
}
