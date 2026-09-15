import type { UserRole } from "@/lib/database.types";
import {
  LayoutDashboard,
  ListChecks,
  ListTodo,
  KanbanSquare,
  AlarmClockCheck,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  {
    href: "/reports/overdue",
    label: "Overdue",
    icon: AlarmClockCheck,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    href: "/admin/users",
    label: "Admin",
    icon: Settings,
    roles: ["admin"],
  },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
];

export function visibleNavItems(items: NavItem[], role: UserRole) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
