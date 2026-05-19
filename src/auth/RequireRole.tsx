import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { hasAnyRole, type Role } from "@/domain/roles";

export function RequireRole({
  roles,
  children,
  fallback = "/",
}: {
  roles: readonly Role[];
  children: ReactNode;
  fallback?: string;
}) {
  const { role } = useAuth();
  if (hasAnyRole(role, roles)) {
    return <>{children}</>;
  }
  return <Navigate to={fallback} replace />;
}
