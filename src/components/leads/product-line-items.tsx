"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { Database, PackSize } from "@/lib/database.types";
import type { LeadProductLineItem } from "@/app/(app)/leads/actions";
import { PACK_SIZES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [stagingSizes, setStagingSizes] = useState<PackSize[]>([]);

  const groups = new Map<string, Product[]>();
  for (const product of products) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category)!.push(product);
  }

  function toggleStagingSize(size: PackSize) {
    setStagingSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  function addOrUpdateLineItem() {
    if (!stagingProductId) return;
    const next = value.filter((item) => item.productId !== stagingProductId);
    next.push({ productId: stagingProductId, packSizes: stagingSizes });
    onChange(next);
    setStagingProductId("");
    setStagingSizes([]);
  }

  function removeLineItem(productId: string) {
    onChange(value.filter((item) => item.productId !== productId));
  }

  function editLineItem(item: LeadProductLineItem) {
    setStagingProductId(item.productId);
    setStagingSizes(item.packSizes);
    onChange(value.filter((v) => v.productId !== item.productId));
  }

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "Unknown product";
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-2 rounded-md border p-2"
            >
              <button
                type="button"
                onClick={() => editLineItem(item)}
                className="flex-1 text-left text-sm hover:underline"
              >
                <span className="font-medium">{productName(item.productId)}</span>
                {item.packSizes.length > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {item.packSizes.join(", ")}
                  </span>
                ) : (
                  <span className="text-muted-foreground"> — no size set</span>
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
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No products added yet — pick one below and add a size.
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-md border p-3">
        <Select value={stagingProductId} onValueChange={(v) => setStagingProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a product" />
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

        <div className="flex flex-wrap gap-3">
          {PACK_SIZES.map((size) => (
            <label key={size} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={stagingSizes.includes(size)}
                onCheckedChange={() => toggleStagingSize(size)}
              />
              {size}
            </label>
          ))}
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
