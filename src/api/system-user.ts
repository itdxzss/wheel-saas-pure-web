import { armadaRequest } from "@/api/armada";

export type SystemStatus = 0 | 1;

export interface SystemUser {
  id: number;
  username: string;
  nickname?: string | null;
  status: SystemStatus;
  roleIds: number[];
  createdAt: number;
  updatedAt: number;
}

export interface SystemUserOption {
  id: number;
  name: string;
  status: SystemStatus;
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

function systemUserOptionName(user: SystemUser): string {
  const username = user.username.trim();
  const nickname = user.nickname?.trim();
  return nickname && nickname !== username
    ? `${nickname}（${username}）`
    : username;
}

export function listSystemUsers(): Promise<SystemUser[]> {
  return armadaRequest<SystemUser[]>("get", "/api/admin/users");
}

export async function listSystemUserOptions(): Promise<SystemUserOption[]> {
  const users = await listSystemUsers();
  return users.map(user => ({
    id: user.id,
    name: systemUserOptionName(user),
    status: user.status
  }));
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
