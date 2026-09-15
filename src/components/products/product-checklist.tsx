import type { Database } from "@/lib/database.types";
import { Checkbox } from "@/components/ui/checkbox";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductChecklist({
  products,
  selectedIds,
  onToggle,
}: {
  products: Product[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No products in the catalog yet — add some in Admin.
      </p>
    );
  }

  const groups = new Map<string, Product[]>();
  for (const product of products) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category)!.push(product);
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      {Array.from(groups.entries()).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {category}
          </p>
          <div className="flex flex-wrap gap-3">
            {items.map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedIds.includes(product.id)}
                  onCheckedChange={() => onToggle(product.id)}
                />
                {product.name}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
