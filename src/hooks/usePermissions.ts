import { useAuth } from "./use-auth";

type Permission = "add_items" | "view_reports" | "manage_suppliers";

const PERMISSION_MAP: Record<Permission, keyof import("@/types/inventory").UserPermissions> = {
  add_items: "can_add_items",
  view_reports: "can_view_reports",
  manage_suppliers: "can_manage_suppliers",
};

export function usePermissions() {
  const { profile } = useAuth();

  const can = (permission: Permission): boolean => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    const key = PERMISSION_MAP[permission];
    return (profile as any)[key] === true;
  };

  return { can, isAdmin: profile?.role === "admin" };
}
