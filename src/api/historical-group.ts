import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

/** 账号组相对历史群的当前成员关系。 */
export type HistoricalGroupMembershipState =
  | "UNVERIFIED"
  | "FETCH_FAILED"
  | "CURRENT_IN_GROUP"
  | "CURRENT_NOT_IN_GROUP";

/** 历史群列表使用的账号组聚合角色分类。 */
export type HistoricalGroupRole = "ADMIN" | "MEMBER";

/** 协议层确认的账号组内最高自身群角色。 */
export type HistoricalGroupSelfRole = "OWNER" | "ADMIN" | "MEMBER";

/** 账号组在目标群中的当前发言状态。 */
export type HistoricalGroupSpeechState =
  | "NORMAL"
  | "ADMIN_CAN_SPEAK"
  | "CANNOT_SPEAK"
  | "ABNORMAL";

/** 单群拉人执行状态。 */
export type HistoricalGroupPullStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED";

/** 单群执行内营销发送状态。 */
export type HistoricalGroupMarketingStatus =
  | "NOT_APPLICABLE"
  | "NOT_STARTED"
  | "SENDING"
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED";

/** 执行明细的材料身份。 */
export type HistoricalGroupMaterialType = "NORMAL" | "MARKETING";

/** 单成员联系人保存状态。 */
export type HistoricalGroupContactStatus = "PENDING" | "SUCCESS" | "FAILED";

/** 单成员入群添加状态。 */
export type HistoricalGroupAddStatus = "PENDING" | "SUCCESS" | "FAILED";

/** 单成员营销发送聚合状态。 */
export type HistoricalGroupSendStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "SENDING"
  | "SUCCESS"
  | "FAILED";

/** baseline 历史群列表中的单群请求级状态。 */
export interface HistoricalGroupItem {
  groupJid: string;
  subject: string | null;
  accountPhones: string[];
  inviteLink: string | null;
  countryIso2: string | null;
  countryName: string | null;
  countryFlag: string | null;
  groupCreatedAt: number | null;
  membershipState: HistoricalGroupMembershipState;
  roleCategory: HistoricalGroupRole | null;
  selfRole: HistoricalGroupSelfRole | null;
  speechState: HistoricalGroupSpeechState | null;
  memberSize: number | null;
  announceOnly: boolean | null;
  operable: boolean;
  disabledReason: string | null;
  errorCode?: string | null;
  errorMessage: string | null;
}

/** 群详情中的完整成员身份与操作保护信息。 */
export interface HistoricalGroupMember {
  participantJid: string;
  phone: string;
  self: boolean;
  owner: boolean;
  admin: boolean;
  selfRole: HistoricalGroupSelfRole;
  operationAllowed: boolean;
  operationDisabledReason: string | null;
}

/** 后端自动选择当前在线群主或管理员读取的历史群详情。 */
export interface HistoricalGroupDetail {
  accountId: number;
  groupJid: string;
  subject: string | null;
  membershipState: HistoricalGroupMembershipState;
  roleCategory: HistoricalGroupRole | null;
  selfRole: HistoricalGroupSelfRole | null;
  speechState: HistoricalGroupSpeechState;
  memberSize: number | null;
  announceOnly: boolean | null;
  inviteUrl: string | null;
  linkAvailable: boolean;
  operationAllowed: boolean;
  operationDisabledReason: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  members: HistoricalGroupMember[];
}

/** 历史群详情查询参数。 */
export interface HistoricalGroupDetailQuery {
  accountGroupId: number;
  groupJid: string;
}

/** 批量成员操作请求；执行账号由后端在账号组内自动选择。 */
export interface HistoricalGroupParticipantActionInput {
  accountGroupId: number;
  groupJid: string;
  participantJids: string[];
}

/** 单个成员的协议操作回执。 */
export interface HistoricalGroupParticipantResult {
  participantJid: string;
  success: boolean;
  status?: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/** 批量成员操作的逐项结果。 */
export interface HistoricalGroupParticipantActionResult {
  ok: boolean;
  partial: boolean;
  results: HistoricalGroupParticipantResult[];
}

/** multipart 创建单群拉人执行的固定输入；邀请链接由后端详情固化，不接受前端填写。 */
export interface CreateHistoricalGroupPullExecutionInput {
  file: File;
  sourceAccountGroupId: number;
  groupJid: string;
  pullerAccountGroupId: number;
  singleAddCount: number;
  idempotencyKey: string;
}

/** 执行内单个号码的联系人、添加与营销结果。 */
export interface HistoricalGroupPullMember {
  id?: number;
  lineNo?: number;
  phone: string;
  participantJid: string | null;
  materialType?: HistoricalGroupMaterialType;
  accountId?: number | null;
  protocolAccountId?: string | null;
  contactStatus: HistoricalGroupContactStatus;
  contactErrorCode: string | null;
  contactErrorMessage: string | null;
  addStatus: HistoricalGroupAddStatus;
  addErrorCode: string | null;
  addErrorMessage: string | null;
  sendStatus: HistoricalGroupSendStatus;
  sendCommandId?: string | null;
  sendResultEventId?: string | null;
  sendErrorCode: string | null;
  sendErrorMessage: string | null;
}

/** 单群拉人及营销的完整轮询结果。 */
export interface HistoricalGroupPullExecution {
  id: number;
  operationAccountId?: number;
  sourceAccountGroupId?: number;
  groupJid?: string;
  groupSubject?: string | null;
  inviteUrl?: string | null;
  pullerAccountGroupId?: number;
  pullerAccountId?: number | null;
  pullerPhone?: string | null;
  pullerParticipantJid?: string | null;
  singleAddCount?: number;
  marketingTemplateId?: number | null;
  normalCount?: number;
  marketingCount?: number;
  invalidCount?: number;
  duplicateCount?: number;
  pullSuccessCount?: number;
  pullFailureCount?: number;
  sendSuccessCount?: number;
  sendFailureCount?: number;
  pullStatus: HistoricalGroupPullStatus;
  marketingStatus: HistoricalGroupMarketingStatus;
  failureStage?: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt?: number | null;
  finishedAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  members: HistoricalGroupPullMember[];
}

/** 最近执行查询参数。 */
export interface LatestHistoricalGroupPullExecutionQuery {
  sourceAccountGroupId: number;
  groupJid: string;
}

/** 历史群账号分组分页查询参数。 */
export interface HistoricalGroupListQuery {
  accountGroupId: number;
  page: number;
  pageSize: number;
}

/** 查询账号分组 baseline 中的全部历史群。 */
export function listHistoricalGroups(
  query: HistoricalGroupListQuery
): Promise<PageResponse<HistoricalGroupItem>> {
  return armadaRequest<PageResponse<HistoricalGroupItem>>(
    "get",
    "/api/historical-groups",
    { params: query }
  );
}

/** 刷新账号分组内在线正常账号的当前群摘要。 */
export function refreshHistoricalGroups(accountGroupId: number): Promise<void> {
  return armadaRequest<void>(
    "post",
    "/api/historical-groups/refresh",
    { data: { accountGroupId } },
    { timeout: 60_000 }
  );
}

/** 加载账号组历史范围内单个群的完整成员与邀请链接。 */
export function getHistoricalGroupDetail(
  query: HistoricalGroupDetailQuery
): Promise<HistoricalGroupDetail> {
  return armadaRequest<HistoricalGroupDetail>(
    "get",
    "/api/historical-groups/detail",
    { params: query }
  );
}

function updateHistoricalGroupParticipants(
  action: "promote" | "demote" | "remove",
  data: HistoricalGroupParticipantActionInput
): Promise<HistoricalGroupParticipantActionResult> {
  return armadaRequest<HistoricalGroupParticipantActionResult>(
    "post",
    `/api/historical-groups/participants/${action}`,
    { data }
  );
}

/** 批量提升历史群成员为管理员。 */
export function promoteHistoricalGroupParticipants(
  data: HistoricalGroupParticipantActionInput
): Promise<HistoricalGroupParticipantActionResult> {
  return updateHistoricalGroupParticipants("promote", data);
}

/** 批量将历史群管理员降为普通成员。 */
export function demoteHistoricalGroupParticipants(
  data: HistoricalGroupParticipantActionInput
): Promise<HistoricalGroupParticipantActionResult> {
  return updateHistoricalGroupParticipants("demote", data);
}

/** 批量移除历史群成员。 */
export function removeHistoricalGroupParticipants(
  data: HistoricalGroupParticipantActionInput
): Promise<HistoricalGroupParticipantActionResult> {
  return updateHistoricalGroupParticipants("remove", data);
}

function toHistoricalGroupPullForm(
  data: CreateHistoricalGroupPullExecutionInput
): FormData {
  const form = new FormData();
  form.append("file", data.file);
  form.append("sourceAccountGroupId", String(data.sourceAccountGroupId));
  form.append("groupJid", data.groupJid);
  form.append("pullerAccountGroupId", String(data.pullerAccountGroupId));
  form.append("singleAddCount", String(data.singleAddCount));
  form.append("idempotencyKey", data.idempotencyKey);
  return form;
}

/** 上传材料并创建一条待启动的单群拉人执行。 */
export function createHistoricalGroupPullExecution(
  data: CreateHistoricalGroupPullExecutionInput
): Promise<HistoricalGroupPullExecution> {
  return armadaRequest<HistoricalGroupPullExecution>(
    "post",
    "/api/historical-group-pull-executions",
    { data: toHistoricalGroupPullForm(data) },
    {
      beforeRequestCallback: config => {
        // FormData 必须让浏览器生成带 boundary 的 Content-Type。
        delete config.headers["Content-Type"];
      }
    }
  );
}

/** 原子启动指定单群拉人执行。 */
export function startHistoricalGroupPullExecution(
  id: number
): Promise<HistoricalGroupPullExecution> {
  return armadaRequest<HistoricalGroupPullExecution>(
    "post",
    `/api/historical-group-pull-executions/${id}/start`
  );
}

/** 轮询指定单群拉人执行及全部号码明细。 */
export function getHistoricalGroupPullExecution(
  id: number
): Promise<HistoricalGroupPullExecution> {
  return armadaRequest<HistoricalGroupPullExecution>(
    "get",
    `/api/historical-group-pull-executions/${id}`
  );
}

/** 查询来源账号分组与目标群最近一次执行。 */
export function getLatestHistoricalGroupPullExecution(
  query: LatestHistoricalGroupPullExecutionQuery
): Promise<HistoricalGroupPullExecution | null> {
  return armadaRequest<HistoricalGroupPullExecution | null>(
    "get",
    "/api/historical-group-pull-executions/latest",
    { params: query }
  );
}

/** 为执行内全部营销账号启动一次模板发送。 */
export function sendHistoricalGroupMarketing(
  id: number,
  marketingTemplateId: number
): Promise<HistoricalGroupPullExecution> {
  return armadaRequest<HistoricalGroupPullExecution>(
    "post",
    `/api/historical-group-pull-executions/${id}/marketing-send`,
    { data: { marketingTemplateId } }
  );
}
