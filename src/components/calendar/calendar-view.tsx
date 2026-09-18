"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarItem } from "@/lib/queries/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function CalendarView({ items }: { items: CalendarItem[] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(() => dateKey(today));

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = dateKey(new Date(`${item.date}T00:00:00`));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const todayKey = dateKey(today);
  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];
  const selectedIsPast = selected !== null && selected < todayKey;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium">
          {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const key = dateKey(date);
          const dayItems = byDay.get(key) ?? [];
          const isSelected = key === selected;
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                isToday && !isSelected ? "ring-1 ring-primary" : undefined,
              )}
            >
              {date.getDate()}
              {dayItems.length > 0 ? (
                <span
                  className={cn(
                    "size-1 rounded-full",
                    isSelected
                      ? "bg-primary-foreground"
                      : isPast
                        ? "bg-destructive"
                        : "bg-primary",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <p className="text-sm font-medium">
          {selected
            ? new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Select a day"}
          {selectedIsPast && selectedItems.length > 0 ? (
            <span className="ml-2 text-xs font-normal text-destructive">overdue</span>
          ) : null}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled this day.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.type === "lead" ? `/leads/${item.id}` : `/customers/${item.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{item.companyName}</span>
                  <Badge variant="secondary">
                    {item.type === "lead" ? "Lead follow-up" : "Customer check-in"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
