import type { Database } from "@/lib/database.types";
import { productLabel } from "@/lib/format";
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

  return (
    <div className="flex flex-wrap gap-3 rounded-md border p-3">
      {products.map((product) => (
        <label key={product.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selectedIds.includes(product.id)}
            onCheckedChange={() => onToggle(product.id)}
          />
          {productLabel(product)}
        </label>
      ))}
    </div>
  );
}
