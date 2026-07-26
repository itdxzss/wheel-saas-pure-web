import { armadaRequest } from "@/api/armada";
import type { SystemStatus } from "@/api/system-user";

export type SystemMenuType = "D" | "M" | "B";

export interface SystemMenuNode {
  id: number;
  parentId: number;
  menuName: string;
  menuKey: string;
  menuType: SystemMenuType;
  routePath?: string;
  componentPath?: string;
  permKey?: string;
  icon?: string;
  sortNo: number;
  status: SystemStatus;
  children: SystemMenuNode[];
}

export interface SystemMenuPayload {
  parentId: number;
  menuName: string;
  menuKey: string;
  menuType: SystemMenuType;
  routePath?: string;
  componentPath?: string;
  permKey?: string;
  icon?: string;
  sortNo: number;
}

export function getSystemMenuTree(): Promise<SystemMenuNode[]> {
  return armadaRequest<SystemMenuNode[]>("get", "/api/admin/menus/tree");
}

export function createSystemMenu(
  payload: SystemMenuPayload
): Promise<SystemMenuNode> {
  return armadaRequest<SystemMenuNode>("post", "/api/admin/menus", {
    data: payload
  });
}

export function updateSystemMenu(
  id: number,
  payload: SystemMenuPayload
): Promise<SystemMenuNode> {
  return armadaRequest<SystemMenuNode>("put", `/api/admin/menus/${id}`, {
    data: payload
  });
}

export function changeSystemMenuStatus(
  id: number,
  status: SystemStatus
): Promise<void> {
  return armadaRequest<void>("patch", `/api/admin/menus/${id}/status`, {
    data: { status }
  });
}
