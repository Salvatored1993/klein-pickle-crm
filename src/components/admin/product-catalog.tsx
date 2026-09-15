"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createProduct, setProductActive } from "@/app/(app)/admin/actions";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductCatalog({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product catalog</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          ref={formRef}
          className="flex gap-2"
          action={(formData: FormData) => {
            const name = String(formData.get("name") ?? "").trim();
            if (!name) return;
            startTransition(async () => {
              try {
                await createProduct(name);
                formRef.current?.reset();
                router.refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add product");
              }
            });
          }}
        >
          <Input name="name" placeholder="Add a product…" required />
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </form>

        <ul className="flex flex-col gap-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className={product.is_active ? undefined : "text-muted-foreground line-through"}>
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
      </CardContent>
    </Card>
  );
}
