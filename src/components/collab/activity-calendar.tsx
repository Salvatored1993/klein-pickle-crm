"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { profileName, formatDateTime } from "@/lib/format";
import { describeActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Activity = Database["public"]["Tables"]["activity"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function ActivityCalendar({
  activity,
  profiles,
}: {
  activity: Activity[];
  profiles: Profile[];
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(() => dateKey(today));

  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const item of activity) {
      const key = dateKey(new Date(item.created_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [activity]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const selectedActivity = selected ? (byDay.get(selected) ?? []) : [];
  const todayKey = dateKey(today);

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
          const count = byDay.get(key)?.length ?? 0;
          const isSelected = key === selected;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isToday && !isSelected ? "ring-1 ring-primary" : undefined,
              )}
            >
              {date.getDate()}
              {count > 0 ? (
                <span
                  className={cn(
                    "size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary",
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
        </p>
        {selectedActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates logged this day.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedActivity.map((item) => {
              const description = describeActivity(item);
              const author = profileName(profiles, item.author_id);
              return (
                <li key={item.id} className="rounded-md border p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{author ?? "System"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {description ?? item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
