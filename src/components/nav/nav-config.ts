import type { UserRole } from "@/lib/database.types";
import {
  Home,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  AlarmClockCheck,
  Settings,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/team", label: "Team", icon: Users },
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
  { href: "/", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: ListChecks },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
];

export function visibleNavItems(items: NavItem[], role: UserRole) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
