export type ManagedUserStatus = "ENABLED" | "DISABLED";

export interface ManagedUser {
  id: number;
  username: string;
  parentUserId?: number;
  parentUsername?: string;
  role: string;
  status: ManagedUserStatus;
  googleBound: boolean;
  createdAt: string;
}

export interface UserFormPayload {
  username: string;
  password?: string;
  parentUserId?: number;
  role: string;
}

export const mockRoleOptions = [
  { label: "系统管理员", value: "系统管理员" },
  { label: "运营专员", value: "运营专员" },
  { label: "数据查看员", value: "数据查看员" }
];

export const mockUserRows: ManagedUser[] = [
  {
    id: 307,
    username: "test",
    role: "系统管理员",
    status: "ENABLED",
    googleBound: false,
    createdAt: "2026-07-09 22:54:34"
  },
  {
    id: 239,
    username: "testuser456",
    role: "运营专员",
    status: "ENABLED",
    googleBound: false,
    createdAt: "2026-06-25 23:15:45"
  },
  {
    id: 215,
    username: "Rahu",
    role: "数据查看员",
    status: "ENABLED",
    googleBound: true,
    createdAt: "2026-06-24 12:08:11"
  },
  {
    id: 196,
    username: "ForeverAditya",
    role: "运营专员",
    status: "ENABLED",
    googleBound: false,
    createdAt: "2026-06-23 13:15:04"
  }
];

export function formatUserCreatedAt(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}:${value("second")}`;
}
