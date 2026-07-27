import { armadaRequest } from "@/api/armada";

export interface SystemUserOption {
  id: number;
  name: string;
  status: number;
}

interface SystemUserVO {
  id: number;
  username: string;
  nickname?: string | null;
  status: number;
  roleIds: number[];
  createdAt: number;
  updatedAt: number;
}

function systemUserOptionName(user: SystemUserVO): string {
  const username = user.username.trim();
  const nickname = user.nickname?.trim();
  return nickname && nickname !== username
    ? `${nickname}（${username}）`
    : username;
}

export async function listSystemUserOptions(): Promise<SystemUserOption[]> {
  const users = await armadaRequest<SystemUserVO[]>("get", "/api/admin/users");
  return users.map(user => ({
    id: user.id,
    name: systemUserOptionName(user),
    status: user.status
  }));
}
