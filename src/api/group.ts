import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeGroupClassificationRow,
  type GroupClassification
} from "./group-classification";

export type { GroupClassification } from "./group-classification";

export interface GroupListRow {
  id: number;
  url: string;
  groupName?: string | null;
  waSubject?: string | null;
  groupJid?: string | null;
  sourceFileName?: string | null;
  folderId?: number | null;
  folderName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  healthStatus?: number | null;
  banned?: boolean | null;
  memberCount?: number | null;
  admin?: string | null;
  syncProtocolMask?: number | null;
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
  groupClassification: GroupClassification;
  inviteUrl?: string | null;
  adminPhones?: string[] | null;
  availableAdmin?: boolean | null;
  availableAdminCount?: number | null;
  creatorPhone?: string | null;
  creatorCountryIso2?: string | null;
  creatorCountryName?: string | null;
  creatorCountryFlag?: string | null;
  creatorContinentCode?: string | null;
  groupCreatedAt?: number | null;
  metadataSyncStatus?: string | null;
  metadataSyncedAt?: number | null;
  metadataSyncError?: string | null;
}

interface BackendGroupListRow
  extends Omit<GroupListRow, "groupClassification"> {
  groupClassification?: unknown;
  isHistorical?: boolean | null;
  isPostControl?: boolean | null;
}

export interface GroupListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sourceFileName?: string;
  origin?: number | "";
  membershipState?: number | "";
  folderId?: number;
  withoutFolder?: boolean;
  groupType?: "HISTORICAL" | "POST_CONTROL";
  availableAdmin?: boolean;
  memberCountMin?: number;
  memberCountMax?: number;
  continentCode?: string;
  countryIso2?: string;
  ageDaysMin?: number;
  ageDaysMax?: number;
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

export type TimedMessageMode = "off" | "24h" | "7d" | "90d";

export interface GroupPermissionState {
  editGroupSettings: boolean | null;
  sendMessages: boolean | null;
  addMembers: boolean | null;
  inviteViaLink: boolean | null;
  adminApproveNewMembers: boolean | null;
}

export interface GroupDetail {
  groupLinkId: number;
  groupJid: string | null;
  groupName: string | null;
  remark: string | null;
  avatarUrl: string | null;
  liveStateAvailable: boolean;
  liveStateUnavailableReason: string | null;
  timedMessageMode: TimedMessageMode | null;
  permissions: GroupPermissionState;
  capabilities: {
    inviteViaLink: { supported: boolean; reason: string | null };
  };
  membersAvailable: boolean;
  membersUnavailableReason: string | null;
  members: GroupMember[];
  metadataSyncStatus: string | null;
  metadataSyncedAt: number | null;
  metadataSyncError: string | null;
}

interface BackendGroupDetail extends Omit<GroupDetail, "members"> {
  members: BackendGroupMember[];
}

export interface GroupAvatarUpdate {
  applied: boolean;
  mirrorSynced: boolean;
  avatarUrl: string | null;
}

export type GroupPermissionKey =
  | "EDIT_GROUP_SETTINGS"
  | "SEND_MESSAGES"
  | "ADD_MEMBERS"
  | "INVITE_VIA_LINK"
  | "ADMIN_APPROVE_NEW_MEMBERS";

export interface GroupMemberOpResult {
  ok: boolean;
  partial: boolean;
  message?: string | null;
  results?: Array<{ jid: string; status: string; reason: string | null }>;
}

export interface GroupMetadataSyncAccepted {
  accepted: boolean;
  status: string;
}

export interface GroupCreatorLeaveCapability {
  executable: boolean;
  blockedReasonCode: string | null;
  blockedReason: string | null;
}

export type GroupCreatorLeaveStatus =
  | "SUCCESS"
  | "NOT_CREATOR"
  | "CREATOR_UNAVAILABLE"
  | "NO_AVAILABLE_CONTROLLER"
  | "PROMOTION_FAILED"
  | "LEAVE_FAILED";

export interface GroupCreatorLeaveResult {
  status: GroupCreatorLeaveStatus;
  message: string;
}

function toListParams(query: GroupListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    status: query.status,
    sourceFileName: query.sourceFileName,
    origin: query.origin || undefined,
    membershipState: query.membershipState || undefined,
    folderId: query.folderId,
    withoutFolder: query.withoutFolder,
    groupType: query.groupType,
    availableAdmin: query.availableAdmin,
    memberCountMin: query.memberCountMin,
    memberCountMax: query.memberCountMax,
    continentCode: query.continentCode,
    countryIso2: query.countryIso2,
    ageDaysMin: query.ageDaysMin,
    ageDaysMax: query.ageDaysMax
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

function toGroupListRow(row: BackendGroupListRow): GroupListRow {
  return normalizeGroupClassificationRow(row);
}

export async function listGroups(
  query: GroupListQuery = {}
): Promise<PageResponse<GroupListRow>> {
  const response = await armadaRequest<PageResponse<BackendGroupListRow>>(
    "get",
    "/api/group-links",
    { params: toListParams(query) }
  );
  return {
    ...response,
    list: response.list?.map(toGroupListRow)
  };
}

export function batchDeleteGroups(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/group-links/batch-delete", {
    data: { ids }
  });
}

export function batchAssignGroupFolder(
  ids: number[],
  folderId: number | null
): Promise<number> {
  return armadaRequest<number>("post", "/api/group-links/batch-assign-folder", {
    data: { ids, folderId }
  });
}

export async function getGroupMembers(id: number): Promise<GroupMemberList> {
  const data = await armadaRequest<BackendGroupMemberList>(
    "get",
    `/api/group-links/${id}/members`
  );
  return toGroupMemberList(data);
}

export async function getGroupDetail(id: number): Promise<GroupDetail> {
  const data = await armadaRequest<BackendGroupDetail>(
    "get",
    `/api/group-links/${id}/detail`
  );
  return {
    ...data,
    members: (data.members ?? []).map(toGroupMember)
  };
}

export function requestGroupMetadataSync(
  id: number
): Promise<GroupMetadataSyncAccepted> {
  return armadaRequest<GroupMetadataSyncAccepted>(
    "post",
    `/api/group-links/${id}/metadata-sync`
  );
}

export function getGroupCreatorLeaveCapability(
  id: number
): Promise<GroupCreatorLeaveCapability> {
  return armadaRequest<GroupCreatorLeaveCapability>(
    "get",
    `/api/group-links/${id}/creator-leave-capability`
  );
}

export function executeGroupCreatorLeave(
  id: number
): Promise<GroupCreatorLeaveResult> {
  return armadaRequest<GroupCreatorLeaveResult>(
    "post",
    `/api/group-links/${id}/creator-leave`
  );
}

export function updateGroupSubject(id: number, subject: string): Promise<void> {
  return armadaRequest<void>("post", `/api/group-links/${id}/subject`, {
    data: { subject }
  });
}

export function updateGroupRemark(id: number, remark: string): Promise<void> {
  return armadaRequest<void>("patch", `/api/group-links/${id}`, {
    data: { remark }
  });
}

export function updateTimedMessage(
  id: number,
  mode: TimedMessageMode
): Promise<void> {
  return armadaRequest<void>("post", `/api/group-links/${id}/timed-message`, {
    data: { mode }
  });
}

export function updateGroupSetting(
  id: number,
  key: GroupPermissionKey,
  enabled: boolean
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/group-links/${id}/settings`,
    { data: { key, enabled } },
    { timeout: 45_000 }
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
): Promise<GroupAvatarUpdate> {
  const form = new FormData();
  form.append("file", file);
  return armadaRequest<GroupAvatarUpdate>(
    "post",
    `/api/group-links/${id}/avatar`,
    { data: form },
    {
      timeout: 45000,
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export type GroupBatchTaskType = "REFRESH_LINK" | "REFRESH_INFO";

export type GroupBatchTaskStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type GroupBatchTaskItemStatus =
  | "PENDING"
  | "DISPATCHED"
  | "WAITING_RESULT"
  | "SUCCESS"
  | "FAILED"
  | "CANCELED";

export interface GroupBatchTaskAccepted {
  taskId: number;
  createdAt: number | null;
  status: GroupBatchTaskStatus;
}

export interface GroupBatchTaskItem {
  groupLinkId: number;
  groupJid: string | null;
  account: string | null;
  status: GroupBatchTaskItemStatus;
  description: string | null;
  operatedAt: number | null;
}

export interface GroupBatchTaskDetail {
  taskId: number;
  taskType: GroupBatchTaskType;
  status: GroupBatchTaskStatus;
  /** 后端直接给出是否终态，前端据此停止轮询，不自行维护状态枚举。 */
  terminal: boolean;
  createdAt: number | null;
  completedAt: number | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  items: GroupBatchTaskItem[];
}

export function batchRefreshGroupLinks(
  ids: number[],
  requestId: string
): Promise<GroupBatchTaskAccepted> {
  return armadaRequest<GroupBatchTaskAccepted>(
    "post",
    "/api/group-links/batch-refresh-links",
    { data: { ids, requestId } }
  );
}

export function batchRefreshGroupInfo(
  ids: number[],
  requestId: string
): Promise<GroupBatchTaskAccepted> {
  return armadaRequest<GroupBatchTaskAccepted>(
    "post",
    "/api/group-links/batch-refresh-info",
    { data: { ids, requestId } }
  );
}

export function getGroupBatchTask(
  taskId: number
): Promise<GroupBatchTaskDetail> {
  return armadaRequest<GroupBatchTaskDetail>(
    "get",
    `/api/group-links/batch-tasks/${taskId}`
  );
}

/** 取消任务中尚未开始执行的明细；返回实际取消的明细数。 */
export function cancelGroupBatchTask(taskId: number): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/group-links/batch-tasks/${taskId}/cancel`
  );
}
