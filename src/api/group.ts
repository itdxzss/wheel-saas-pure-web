import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

export interface GroupListRow {
  id: number;
  url: string;
  groupName?: string | null;
  waSubject?: string | null;
  groupJid?: string | null;
  sourceFileName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  healthStatus?: number | null;
  banned?: boolean | null;
  memberCount?: number | null;
  admin?: string | null;
  origin?: number | null;
  source?: string | null;
  membershipState?: number | null;
  membershipStateLabel?: string | null;
  remark?: string | null;
  avatarUrl?: string | null;
  ownerPhone?: string | null;
  lastPreviewAt?: number | null;
  lastCheckAt?: number | null;
  lastHealthError?: string | null;
  createdAt?: number | null;
}

export interface GroupListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sourceFileName?: string;
  origin?: number | "";
  membershipState?: number | "";
}

export interface GroupMember {
  jid: string;
  phone: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "ME" | string;
  roleText?: string | null;
  locked?: boolean | null;
}

interface BackendGroupMember {
  jid?: string | null;
  phone?: string | null;
  admin?: boolean | null;
  owner?: boolean | null;
  role?: string | null;
}

interface BackendGroupMemberList {
  groupLinkId: number;
  groupJid: string;
  total: number;
  members: BackendGroupMember[];
}

export interface GroupMemberList {
  groupLinkId: number;
  groupJid: string;
  total: number;
  members: GroupMember[];
}

export interface GroupDetail {
  id: number;
  groupJid?: string | null;
  groupName?: string | null;
  url?: string | null;
  description?: string | null;
  memberCount?: number | null;
  membersAvailable: boolean;
  membersUnavailableReason?: string | null;
  locked?: boolean | null;
  announcementOnly?: boolean | null;
  members: GroupMember[];
}

export interface GroupProfileUpdate {
  groupName?: string;
  remark?: string;
  avatarUrl?: string;
}

export interface GroupSettingsUpdate {
  locked?: boolean;
  announcementOnly?: boolean;
}

export interface GroupSettingsResult {
  applied: boolean;
  reason?: string | null;
}

export interface GroupMemberOpResult {
  ok: boolean;
  partial: boolean;
  message?: string | null;
  results?: Array<{ jid: string; status: string }>;
}

function toListParams(query: GroupListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    status: query.status,
    sourceFileName: query.sourceFileName,
    origin: query.origin || undefined,
    membershipState: query.membershipState || undefined
  };
}

function toGroupMember(member: BackendGroupMember): GroupMember {
  const role = member.owner
    ? "OWNER"
    : member.admin || member.role === "admin"
      ? "ADMIN"
      : "MEMBER";
  const roleText =
    role === "OWNER" ? "群主" : role === "ADMIN" ? "管理员" : "成员";
  const jid = member.jid ?? member.phone ?? "";
  const phone = member.phone ?? jid;
  return {
    jid,
    phone,
    name: phone,
    role,
    roleText,
    locked: role === "OWNER"
  };
}

function toGroupMemberList(data: BackendGroupMemberList): GroupMemberList {
  return {
    groupLinkId: data.groupLinkId,
    groupJid: data.groupJid,
    total: data.total,
    members: (data.members ?? []).map(toGroupMember)
  };
}

export function listGroups(
  query: GroupListQuery = {}
): Promise<PageResponse<GroupListRow>> {
  return armadaRequest<PageResponse<GroupListRow>>("get", "/api/group-links", {
    params: toListParams(query)
  });
}

export function batchDeleteGroups(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/group-links/batch-delete", {
    data: { ids }
  });
}

export async function getGroupMembers(id: number): Promise<GroupMemberList> {
  const data = await armadaRequest<BackendGroupMemberList>(
    "get",
    `/api/group-links/${id}/members`
  );
  return toGroupMemberList(data);
}

export function updateGroupProfile(
  id: number,
  data: GroupProfileUpdate
): Promise<GroupListRow> {
  return armadaRequest<GroupListRow>("patch", `/api/group-links/${id}`, {
    data
  });
}

export function updateGroupSettings(
  id: number,
  data: GroupSettingsUpdate
): Promise<GroupSettingsResult> {
  return armadaRequest<GroupSettingsResult>(
    "post",
    `/api/group-links/${id}/settings`,
    { data }
  );
}

export function promoteGroupMembers(
  id: number,
  jids: string[]
): Promise<GroupMemberOpResult> {
  return armadaRequest<GroupMemberOpResult>(
    "post",
    `/api/group-links/${id}/members/promote-batch`,
    { data: { jids } }
  );
}

export function demoteGroupMembers(
  id: number,
  jids: string[]
): Promise<GroupMemberOpResult> {
  return armadaRequest<GroupMemberOpResult>(
    "post",
    `/api/group-links/${id}/members/demote-batch`,
    { data: { jids } }
  );
}

export function kickGroupMembers(
  id: number,
  jids: string[]
): Promise<GroupMemberOpResult> {
  return armadaRequest<GroupMemberOpResult>(
    "post",
    `/api/group-links/${id}/members/kick-batch`,
    { data: { jids } }
  );
}

export function uploadGroupAvatar(
  id: number,
  file: File
): Promise<GroupListRow> {
  const form = new FormData();
  form.append("file", file);
  return armadaRequest<GroupListRow>(
    "post",
    `/api/group-links/${id}/avatar`,
    { data: form },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}
