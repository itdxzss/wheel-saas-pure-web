import { armadaRequest } from "@/api/armada";

export type SystemStatus = 0 | 1;

export interface SystemUser {
  id: number;
  username: string;
  nickname?: string;
  status: SystemStatus;
  roleIds: number[];
  createdAt: number;
  updatedAt: number;
}

export interface SystemUserCreatePayload {
  username: string;
  nickname?: string;
  password: string;
  roleIds: number[];
}

export interface SystemUserUpdatePayload {
  nickname?: string;
  roleIds: number[];
}

export function listSystemUsers(): Promise<SystemUser[]> {
  return armadaRequest<SystemUser[]>("get", "/api/admin/users");
}

export function getSystemUser(id: number): Promise<SystemUser> {
  return armadaRequest<SystemUser>("get", `/api/admin/users/${id}`);
}

export function createSystemUser(
  payload: SystemUserCreatePayload
): Promise<SystemUser> {
  return armadaRequest<SystemUser>("post", "/api/admin/users", {
    data: payload
  });
}

export function updateSystemUser(
  id: number,
  payload: SystemUserUpdatePayload
): Promise<SystemUser> {
  return armadaRequest<SystemUser>("put", `/api/admin/users/${id}`, {
    data: payload
  });
}

export function resetSystemUserPassword(
  id: number,
  newPassword: string
): Promise<void> {
  return armadaRequest<void>("post", `/api/admin/users/${id}/reset-password`, {
    data: { newPassword }
  });
}

export function changeSystemUserStatus(
  id: number,
  status: SystemStatus
): Promise<void> {
  return armadaRequest<void>("patch", `/api/admin/users/${id}/status`, {
    data: { status }
  });
}
