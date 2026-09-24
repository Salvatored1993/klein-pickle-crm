"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ALL_SALESPEOPLE = "__all__";

export function SalespersonFilter({
  value,
  onChange,
  salespeople,
}: {
  value: string;
  onChange: (value: string) => void;
  salespeople: { id: string; name: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue>
          {(v: string) =>
            v === ALL_SALESPEOPLE
              ? "All salespeople"
              : (salespeople.find((s) => s.id === v)?.name ?? "All salespeople")
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_SALESPEOPLE}>All salespeople</SelectItem>
        {salespeople.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
