"use client";

import { useState, useTransition } from "react";
import { createTask, setTaskStatus } from "@/lib/actions/collab";
import type { Database, TaskPriority } from "@/lib/database.types";
import { profileName, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PRIORITY_VARIANT: Record<TaskPriority, "secondary" | "default" | "destructive"> = {
  Low: "secondary",
  Medium: "default",
  High: "destructive",
};

export function TaskList({
  target,
  tasks,
  profiles,
}: {
  target: { leadId?: string; customerId?: string };
  tasks: Task[];
  profiles: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleDone(task: Task) {
    startTransition(async () => {
      await setTaskStatus(
        task.id,
        task.status === "Done" ? "Open" : "Done",
        target,
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tasks</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <Plus className="size-4" />
            New task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New task</DialogTitle>
            </DialogHeader>
            <NewTaskForm
              target={target}
              profiles={profiles}
              onDone={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-md border p-3"
            >
              <input
                type="checkbox"
                checked={task.status === "Done"}
                onChange={() => toggleDone(task)}
                disabled={isPending}
                className="mt-1 size-4"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={
                    task.status === "Done"
                      ? "text-sm line-through text-muted-foreground"
                      : "text-sm font-medium"
                  }
                >
                  {task.title}
                </p>
                {task.description ? (
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={PRIORITY_VARIANT[task.priority]}>
                    {task.priority}
                  </Badge>
                  {task.assigned_to ? (
                    <span>Assigned to {profileName(profiles, task.assigned_to)}</span>
                  ) : null}
                  {task.due_date ? <span>Due {formatDate(task.due_date)}</span> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewTaskForm({
  target,
  profiles,
  onDone,
}: {
  target: { leadId?: string; customerId?: string };
  profiles: Profile[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");

  return (
    <form
      className="flex flex-col gap-4"
      action={(formData: FormData) => {
        startTransition(async () => {
          await createTask(target, {
            title: String(formData.get("title")),
            description: String(formData.get("description") ?? ""),
            assignedTo: assignedTo || undefined,
            priority,
            dueDate: String(formData.get("due_date") ?? "") || undefined,
          });
          onDone();
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Assign to</Label>
          <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="due_date">Due date</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
