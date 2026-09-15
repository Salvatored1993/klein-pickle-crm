"use client";

import { useMemo, useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createProduct, setProductActive } from "@/app/(app)/admin/actions";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Product = Database["public"]["Tables"]["products"]["Row"];

function groupByCategory(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category)!.push(product);
  }
  return groups;
}

export function ProductCatalog({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );
  const grouped = useMemo(() => groupByCategory(products), [products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product catalog</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          ref={formRef}
          className="flex flex-wrap gap-2"
          action={(formData: FormData) => {
            const name = String(formData.get("name") ?? "").trim();
            const category = String(formData.get("category") ?? "").trim() || "Other";
            if (!name) return;
            startTransition(async () => {
              try {
                await createProduct(name, category);
                formRef.current?.reset();
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add product");
              }
            });
          }}
        >
          <Input name="name" placeholder="Add a product…" required className="flex-1" />
          <Input
            name="category"
            placeholder="Category"
            list="product-categories"
            className="w-40"
          />
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </form>

        <div className="flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {category}
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span
                      className={
                        product.is_active ? undefined : "text-muted-foreground line-through"
                      }
                    >
                      {product.name}
                    </span>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={(v) =>
                        startTransition(async () => {
                          await setProductActive(product.id, v);
                          router.refresh();
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
