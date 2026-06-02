import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export const ADMIN_NAV = [
  { label: "Dashboard", path: "/app/admin", icon: LayoutDashboard },
  { label: "Insumos", path: "/app", icon: Package },
  { label: "Usuários", path: "/app/admin/users", icon: Users },
  { label: "Métricas", path: "/app/admin/metrics", icon: BarChart3 },
  { label: "Config", path: "/app/admin/settings", icon: Settings },
];
