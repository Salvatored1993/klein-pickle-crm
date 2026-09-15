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
import { Textarea } from "@/components/ui/textarea";
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

const CUSTOM_PRODUCT = "__custom__";

type Staging = Omit<LeadProductLineItem, "productId" | "customProductName">;

const EMPTY_STAGING: Staging = {
  customSpecs: null,
  packSizes: [],
  customPackSize: null,
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
  const [stagingCustomName, setStagingCustomName] = useState("");
  const [staging, setStaging] = useState<Staging>(EMPTY_STAGING);

  const groups = new Map<string, Product[]>();
  for (const product of products) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category)!.push(product);
  }

  const isCustom = stagingProductId === CUSTOM_PRODUCT;

  function setStagingField<K extends keyof Staging>(key: K, val: Staging[K]) {
    setStaging((prev) => ({ ...prev, [key]: val }));
  }

  function toggleStagingSize(size: PackSize) {
    setStaging((prev) => {
      const isTurningOff = prev.packSizes.includes(size);
      return {
        ...prev,
        packSizes: isTurningOff
          ? prev.packSizes.filter((s) => s !== size)
          : [...prev.packSizes, size],
        customPackSize: size === "Other" && isTurningOff ? null : prev.customPackSize,
      };
    });
  }

  function resetStaging() {
    setStagingProductId("");
    setStagingCustomName("");
    setStaging(EMPTY_STAGING);
  }

  function addOrUpdateLineItem() {
    if (!stagingProductId) return;
    if (isCustom && !stagingCustomName.trim()) return;

    const newItem: LeadProductLineItem = {
      productId: isCustom ? null : stagingProductId,
      customProductName: isCustom ? stagingCustomName.trim() : null,
      customSpecs: staging.customSpecs?.trim() || null,
      packSizes: staging.packSizes,
      customPackSize: staging.packSizes.includes("Other")
        ? staging.customPackSize?.trim() || null
        : null,
      proposedVolume: staging.proposedVolume,
      volumeUnit: staging.volumeUnit,
      estimatedAnnualVolume: staging.estimatedAnnualVolume,
      estimatedAnnualSales: staging.estimatedAnnualSales,
      targetPrice: staging.targetPrice,
    };

    const next = isCustom
      ? [...value, newItem]
      : [...value.filter((item) => item.productId !== stagingProductId), newItem];

    onChange(next);
    resetStaging();
  }

  function removeLineItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function editLineItem(index: number) {
    const item = value[index];
    setStagingProductId(item.productId ?? CUSTOM_PRODUCT);
    setStagingCustomName(item.customProductName ?? "");
    setStaging({
      customSpecs: item.customSpecs,
      packSizes: item.packSizes,
      customPackSize: item.customPackSize,
      proposedVolume: item.proposedVolume,
      volumeUnit: item.volumeUnit,
      estimatedAnnualVolume: item.estimatedAnnualVolume,
      estimatedAnnualSales: item.estimatedAnnualSales,
      targetPrice: item.targetPrice,
    });
    onChange(value.filter((_, i) => i !== index));
  }

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "Unknown product";
  }

  function lineItemLabel(item: LeadProductLineItem) {
    return item.productId ? productName(item.productId) : (item.customProductName ?? "Custom product");
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((item, index) => {
            const sizeLabel =
              item.packSizes.length > 0
                ? item.packSizes
                    .map((s) => (s === "Other" && item.customPackSize ? `Other (${item.customPackSize})` : s))
                    .join(", ")
                : null;

            const details = [
              sizeLabel,
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
              item.customSpecs ? `Specs: ${item.customSpecs}` : null,
            ].filter(Boolean);

            return (
              <li
                key={index}
                className="flex items-start justify-between gap-2 rounded-md border p-2"
              >
                <button
                  type="button"
                  onClick={() => editLineItem(index)}
                  className="flex-1 text-left text-sm hover:underline"
                >
                  <span className="font-medium">{lineItemLabel(item)}</span>
                  {!item.productId ? (
                    <span className="ml-1 text-xs text-muted-foreground">(Custom)</span>
                  ) : null}
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
                  onClick={() => removeLineItem(index)}
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
              {(v: string | null) => {
                if (!v) return "Choose a product";
                if (v === CUSTOM_PRODUCT) return "Other / custom product…";
                return productName(v);
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              <SelectItem value={CUSTOM_PRODUCT}>Other / custom product…</SelectItem>
            </SelectGroup>
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

        {isCustom ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="li-custom-name">
              Custom product name
            </Label>
            <Input
              id="li-custom-name"
              placeholder="e.g. Relish without any red coloring"
              value={stagingCustomName}
              onChange={(e) => setStagingCustomName(e.target.value)}
            />
          </div>
        ) : null}

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
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={staging.packSizes.includes("Other")}
                onCheckedChange={() => toggleStagingSize("Other")}
              />
              Other
            </label>
          </div>
          {staging.packSizes.includes("Other") ? (
            <Input
              placeholder="Describe the size, e.g. 55 gal drum"
              value={staging.customPackSize ?? ""}
              onChange={(e) => setStagingField("customPackSize", e.target.value || null)}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor="li-specs">
            Special specs / requirements
          </Label>
          <Textarea
            id="li-specs"
            rows={2}
            placeholder="Anything specific about how this product needs to be made or packed"
            value={staging.customSpecs ?? ""}
            onChange={(e) => setStagingField("customSpecs", e.target.value || null)}
          />
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
          disabled={!stagingProductId || (isCustom && !stagingCustomName.trim())}
          onClick={addOrUpdateLineItem}
        >
          <Plus className="size-4" />
          {!isCustom && value.some((i) => i.productId === stagingProductId)
            ? "Update product"
            : "Add product"}
        </Button>
      </div>
    </div>
  );
}
