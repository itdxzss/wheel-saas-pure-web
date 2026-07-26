import { armadaRequest } from "@/api/armada";
import type { SystemStatus } from "@/api/system-user";

export interface SystemRole {
  id: number;
  roleName: string;
  roleCode: string;
  status: SystemStatus;
  system: boolean;
  remark?: string;
  userCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SystemRoleCreatePayload {
  roleName: string;
  roleCode: string;
  remark?: string;
}

export interface SystemRoleUpdatePayload {
  roleName: string;
  remark?: string;
}

export function listSystemRoles(): Promise<SystemRole[]> {
  return armadaRequest<SystemRole[]>("get", "/api/admin/roles");
}

export function createSystemRole(
  payload: SystemRoleCreatePayload
): Promise<SystemRole> {
  return armadaRequest<SystemRole>("post", "/api/admin/roles", {
    data: payload
  });
}

export function updateSystemRole(
  id: number,
  payload: SystemRoleUpdatePayload
): Promise<SystemRole> {
  return armadaRequest<SystemRole>("put", `/api/admin/roles/${id}`, {
    data: payload
  });
}

export function changeSystemRoleStatus(
  id: number,
  status: SystemStatus
): Promise<void> {
  return armadaRequest<void>("patch", `/api/admin/roles/${id}/status`, {
    data: { status }
  });
}

export function getSystemRoleMenuIds(id: number): Promise<number[]> {
  return armadaRequest<number[]>("get", `/api/admin/roles/${id}/menus`);
}

export function replaceSystemRoleMenus(
  id: number,
  menuIds: number[]
): Promise<void> {
  return armadaRequest<void>("put", `/api/admin/roles/${id}/menus`, {
    data: { menuIds }
  });
}
