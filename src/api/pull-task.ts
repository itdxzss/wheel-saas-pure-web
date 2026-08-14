import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";
import type { PageResponse } from "@/api/account";

export type PullTaskStandardStatus =
  | "WAIT_START"
  | "EXECUTING"
  | "PAUSED"
  | "INTERRUPTED"
  | "COMPLETED"
  | "ENDED";

export type PullTaskMarketingStatus =
  | "DRAFT"
  | "WAIT_START"
  | "VALIDATING"
  | "WAITING_RESOURCE"
  | "EXECUTING"
  | "PARTIAL_COMPLETED"
  | "PAUSED"
  | "STOPPED"
  | "COMPLETED"
  | "FAILED";

export type PullTaskStatus = PullTaskStandardStatus | PullTaskMarketingStatus;

export type PullTaskMode = "OLD_LINK" | "CREATE_NEW" | "NORMAL_LINK" | string;

export type PullTaskType = "STANDARD" | "GROUP_MARKETING";

export type PullTaskGroupSource = "HISTORICAL" | "SELF_COLLECTED" | "MIXED";

export type PullTaskResourceShortageType =
  | "TARGET_DATA"
  | "PULLER"
  | "WATER_ARMY"
  | "ADMIN"
  | "STATION"
  | "MARKETING_ADMIN";

export interface PullTaskResourceShortage {
  type: PullTaskResourceShortageType;
}

export type PullTaskListAction =
  | "DETAIL"
  | "START"
  | "PAUSE"
  | "RESUME"
  | "END"
  | "DELETE";

export interface PullTaskGroupProgress {
  processedGroupCount: number;
  targetGroupCount: number;
  transferSuccessCount: number;
  transferPendingCloseCount: number | null;
  transferPartialCount: number | null;
  transferFailedCount: number;
  transferRunningCount: number;
  transferWaitingCount: number;
}

export interface PullTaskPullResult {
  plannedTargetCount: number;
  effectiveTargetCount: number;
  joinedSuccessCount: number;
  alreadyInGroupCount: number | null;
  privacyRestrictedCount: number | null;
  invalidNumberCount: number | null;
  unregisteredCount: number | null;
  failedCount: number;
  unknownCount: number;
  remainingTargetCount: number;
  effectiveSuccessRate: number | null;
}

export interface PullTaskMarketingProgress {
  waitingCount: number;
  runningCount: number;
  pausedCount: number;
  completedCount: number;
  abnormalStoppedCount: number;
}

export interface PullTaskMessageStats {
  successCount: number;
  failedCount: number;
  unknownCount: number;
}

export interface PullTaskExceptionStats {
  abnormalGroupCount: number;
  managerShortageGroupCount: number | null;
  pullerShortageGroupCount: number;
  stationShortageGroupCount: number | null;
  bannedAccountCount: number | null;
}

export interface PullTaskResourceStats {
  remainingTargetCount: number;
  availablePullerCount: number;
  shortages: PullTaskResourceShortage[];
}

export type PullTaskGroupStatus =
  | "WAIT_START"
  | "INITIALIZING"
  | "RUNNING"
  | "GROUP_CREATE_FAILED"
  | "GROUP_BANNED"
  | "PULLER_SHORTAGE"
  | "STATION_SHORTAGE"
  | "PAUSED"
  | "COMPLETED"
  | "ENDED"
  | "ADMIN_SETUP_FAILED"
  | "WAITING_APPROVAL"
  | "GROUP_INVALID"
  | string;

export interface PullTaskRow {
  id: number;
  taskName: string;
  groupName?: string | null;
  mode: PullTaskMode;
  status: PullTaskStatus;
  taskType: PullTaskType;
  groupSource: PullTaskGroupSource | null;
  primaryStage: string | null;
  blockingReason: string | null;
  groupCount: number;
  expectedPullCount: number;
  operatorName: string | null;
  remark?: string | null;
  groupProgress: PullTaskGroupProgress | null;
  pullResult: PullTaskPullResult | null;
  marketingProgress: PullTaskMarketingProgress | null;
  messageStats: PullTaskMessageStats | null;
  exceptionStats: PullTaskExceptionStats | null;
  resourceStats: PullTaskResourceStats | null;
  createdAt: number | null;
  lastExecutedAt: number | null;
  allowedActions: PullTaskListAction[];
}

export interface PullTaskGroupRow {
  id: number;
  seq: number;
  groupName?: string | null;
  groupLinkUrl?: string | null;
  sourceFileName?: string | null;
  status: PullTaskGroupStatus;
  memberCount?: number | null;
  joinedCount?: number | null;
  failedCount?: number | null;
  unusedCount?: number | null;
  expectedPullCount?: number | null;
  submitted?: boolean | null;
  blockReason?: string | null;
  adminPhones?: string[] | null;
  pullerPhones?: string[] | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  executionStatus?: number | null;
  stage?: number | null;
  manualPaused?: boolean | null;
  waitResourceType?: number | null;
  reasonCode?: string | null;
  lastBusinessExecutedAt?: number | null;
  materialSummary?: PullTaskStandardMaterialSummary | null;
  managers?: PullTaskStandardResourceCount | null;
  pullers?: PullTaskStandardResourceCount | null;
  stations?: PullTaskStandardResourceCount | null;
}

export interface PullTaskSummary {
  status: PullTaskStatus;
  mode: PullTaskMode;
  groupCount: number;
  totalMembers: number;
  abnormalCount: number;
  joinedCount: number;
  unusedCount: number;
  expectedPullCount: number;
}

export interface PullTaskDetail extends PullTaskRow {
  summary?: PullTaskSummary | null;
  config?: Record<string, unknown> | null;
  standardSetting?: PullTaskStandardSetting | null;
  groupSetting?: PullTaskStandardGroupSetting | null;
}

export interface PullTaskLinkGroup {
  id: number;
  name: string;
  totalLinks?: number | null;
}

export interface PullTaskLinkOption {
  id: number;
  groupName?: string | null;
  linkUrl: string;
  url?: string | null;
  statusLabel?: string | null;
  memberCount?: number | null;
}

interface BackendPullTaskLinkOption extends PullTaskLinkOption {
  url?: string | null;
  groupName?: string | null;
  waSubject?: string | null;
}

export interface PullTaskQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  status?: PullTaskStatus | "";
  taskType?: PullTaskType | "";
  groupSource?: PullTaskGroupSource | "";
  operator?: string;
}

export interface PullTaskGroupMarketingSetting {
  configured: boolean;
  marketingSilenceMinutes: number | null;
  groupLockdownMinutes: number | null;
  maxMarketingAccountsPerGroup: number | null;
}

export interface UpdatePullTaskGroupMarketingSettingRequest {
  marketingSilenceMinutes: number;
  groupLockdownMinutes: number;
  maxMarketingAccountsPerGroup: number;
}

export type PullTaskGroupCandidateStatus =
  | "NORMAL"
  | "WAITING_ACCOUNT_ONLINE"
  | "NO_ADMIN_PERMISSION"
  | "NO_ELIGIBLE_ACCOUNT"
  | "GROUP_BANNED"
  | "LINK_INVALID"
  | "GROUP_UNAVAILABLE"
  | "UNKNOWN"
  | "OCCUPIED";

export interface PullTaskGroupCandidateAccount {
  accountId: number;
  accountPhone: string;
  groupRole: "CREATOR" | "ADMIN";
  loginState: number | null;
  lastSeenAt: number | null;
}

export interface PullTaskGroupCandidateRow {
  groupLinkId: number;
  groupJid: string;
  groupName: string | null;
  source: Exclude<PullTaskGroupSource, "MIXED">;
  ownerPhone: string | null;
  countryIso2: string | null;
  countryName: string | null;
  countryFlag: string | null;
  groupCreatedAt: number | null;
  memberSize: number | null;
  announceOnly: boolean | null;
  avatarUrl: string | null;
  lastSyncedAt: number | null;
  sourceJoinTaskId: number | null;
  sourceJoinTaskName: string | null;
  sourceJoinedAt: number | null;
  sourcePromotedAt: number | null;
  operableAccounts: PullTaskGroupCandidateAccount[];
  eligibleAccountCount: number;
  onlineAccountCount: number;
  status: PullTaskGroupCandidateStatus;
  selectable: boolean;
  inCurrentWaitingPool: boolean;
  occupiedTaskName: string | null;
  disabledReason: string | null;
  lastValidatedAt: number | null;
}

export interface PullTaskGroupCandidateQuery {
  page?: number;
  pageSize?: number;
  source?: PullTaskGroupSource;
  keyword?: string;
  groupJid?: string;
  managerPhone?: string;
  accountGroupId?: number;
  showRegularGroups?: boolean;
  minMemberCount?: number;
  maxMemberCount?: number;
  announceOnly?: boolean;
  reservationToken?: string;
}

export interface PullTaskGroupWaitingPoolRejected {
  groupJid: string;
  reason: string;
}

export interface PullTaskGroupWaitingPool {
  reservationToken: string;
  groups: PullTaskGroupCandidateRow[];
  rejected: PullTaskGroupWaitingPoolRejected[];
}

export interface AddPullTaskGroupWaitingRequest {
  reservationToken: string | null;
  taskName: string;
  plannedStartAt: number | null;
  groupJids: string[];
}

export interface RemovePullTaskGroupWaitingRequest {
  reservationToken: string;
  groupJid: string;
}

export interface PullTaskGroupQuery {
  page?: number;
  pageSize?: number;
  status?: PullTaskGroupStatus | "";
  keyword?: string;
}

export interface CreatePullTaskRequest {
  taskName: string;
  subMode: "OLD_LINK" | "CREATE_NEW";
  useAdmin: boolean;
  wsLinkGroupId?: number | null;
  groupLinkIds: number[];
  pastedLinks: string[];
  templateId?: number | null;
  adminGroupId?: number | null;
  pullerGroupId?: number | null;
  stationOneGroupId?: number | null;
  stationTwoGroupId?: number | null;
  stationThreeGroupId?: number | null;
  adminPerGroup: number;
  pullerPerGroup: number;
  stationOnePerGroup: number;
  stationTwoPerGroup: number;
  stationThreePerGroup: number;
  autoSupplementAdminCount: number;
  autoSupplementAdminTimes: number;
  autoSupplementPullerCount: number;
  autoSupplementPullerTimes: number;
  pullerFinishGroupId?: number | null;
  adminFinishGroupId?: number | null;
  autoStart: boolean;
  pullerEnterFirst: boolean;
  auditMode: string;
  noReleaseAfterPull: boolean;
  pullerSyncMode: string;
  waitBeforePullSeconds: number;
  concurrentTaskCount: number;
  firstPullCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerMaxTotal: number;
  pullerThreadCount: number;
  stationJoinMode: string;
  pullerJoinMode: string;
  pullerQuitMode: string;
  adminQuitMode: string;
  stationQuitAfterDone: boolean;
  materialText: string;
  waterText?: string | null;
  waterMode?: string | null;
  groupProfile: {
    groupName?: string | null;
    mute?: boolean;
    linkPermission?: string | null;
    editPermission?: string | null;
    autoCloseInvite?: boolean;
  };
  remark?: string | null;
}

export type PullTaskStandardLinkLineStatus =
  | "VALID"
  | "INVALID_FORMAT"
  | "DUPLICATE"
  | "OCCUPIED";

export interface PullTaskStandardExecutionRow {
  rowId: number;
  seq: number;
  normalizedLink: string;
  sourceLinkLineNo: number;
  sourceFileName: string;
  totalLineCount: number;
  validMemberCount: number;
  invalidLineCount: number;
  duplicateLineCount: number;
}

export interface PullTaskStandardLinkLine {
  lineNo: number;
  raw: string;
  normalizedLink: string | null;
  status: PullTaskStandardLinkLineStatus;
  reason: string | null;
}

export interface PullTaskStandardMaterialLineError {
  lineNo: number;
  reason: string;
}

export interface PullTaskStandardFileResult {
  fileName: string;
  accepted: boolean;
  validMemberCount: number;
  invalidLineCount: number;
  duplicateLineCount: number;
  rejectReason: string | null;
  lineErrors: PullTaskStandardMaterialLineError[];
}

export interface PullTaskStandardDraft {
  draftTaskId: number | null;
  rows: PullTaskStandardExecutionRow[];
  linkLines: PullTaskStandardLinkLine[];
  fileResults: PullTaskStandardFileResult[];
  matchedCount: number;
  remainingLinkCount: number;
  ignoredFileCount: number;
}

export interface PullTaskStandardGroupSettingRequest {
  settingTiming: "BEFORE_PULL" | "AFTER_PULL";
  groupName: string | null;
  useMaterialFileNameAsGroupName: boolean;
  avatarFileKey: string | null;
  groupDescription: string | null;
  autoCloseMuteAfterTask: boolean;
  autoCloseInviteAfterTask: boolean;
  editPermission: "UNCHANGED" | "ALLOW" | "DISALLOW";
  muteMode: "UNCHANGED" | "MUTE" | "UNMUTE";
  linkPermission: "ALL" | "ADMIN_ONLY";
  disappearingMessage:
    | "UNCHANGED"
    | "ONE_DAY"
    | "SEVEN_DAYS"
    | "NINETY_DAYS"
    | "OFF";
}

export interface PullTaskStandardCreateRequest {
  draftTaskId: number;
  taskName: string;
  remark: string | null;
  autoStart: 0 | 1;
  groupFolderId: number | null;
  pullerSyncMode: "SINGLE" | "BATCH";
  materialAdminTiming: 1 | 2;
  clearExistingMembers: boolean;
  earlyPullCount: number;
  earlyPullCallCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerCountPerGroup: number;
  stationCountPerCall: number;
  concurrentGroupCount: number;
  managerGroupId: number;
  pullerGroupId: number;
  stationGroupId: number | null;
  managerFinishGroupId: number | null;
  pullerFinishGroupId: number | null;
  groupSetting: PullTaskStandardGroupSettingRequest;
}

export interface PullTaskStandardGroupAvatarUpload {
  avatarFileKey: string;
  originalFileName: string;
  previewUrl: string;
}

export interface PullTaskStandardCreated {
  id: number;
  taskName: string;
  status: PullTaskStandardStatus;
  groupCount: number;
  expectedPullCount: number;
}

export interface PullTaskStandardExecutionSummary {
  executionId: number;
  seq: number;
  normalizedLink: string;
  groupJid: string | null;
  sourceFileName: string | null;
  executionStatus: number;
  stage: number;
  manualPaused: boolean;
  waitResourceType: number | null;
  validMemberCount: number;
  reasonCode: string | null;
  reasonMessage: string | null;
  lastBusinessExecutedAt: number | null;
  materialSummary: PullTaskStandardMaterialSummary | null;
  managers: PullTaskStandardResourceCount | null;
  pullers: PullTaskStandardResourceCount | null;
  stations: PullTaskStandardResourceCount | null;
}

export interface PullTaskStandardRole {
  roleRowId: number;
  accountId: number;
  accountPhone: string;
  roleType: number;
  roleSeq: number;
  membershipStatus: number;
  adminStatus: number;
  availabilityStatus: number;
  unavailableReasonCode: string | null;
  pullCallId: number | null;
}

export interface PullTaskStandardCall {
  callId: number;
  callSeq: number;
  pullerAccountId: number | null;
  plannedMaterialCount: number;
  plannedStationCount: number;
  callStatus: number;
  reasonCode: string | null;
  reasonMessage: string | null;
  submittedAt: number | null;
  resultAt: number | null;
}

export interface PullTaskStandardAction {
  actionId: number;
  actionType: number;
  actorRoleRowId: number;
  targetRoleRowId: number;
  actionStatus: number;
  reasonCode: string | null;
  reasonMessage: string | null;
  submittedAt: number | null;
  resultAt: number | null;
}

export interface PullTaskStandardExecutionDetail {
  execution: PullTaskStandardExecutionSummary;
  roles: PullTaskStandardRole[];
  calls: PullTaskStandardCall[];
  actions: PullTaskStandardAction[];
}

export interface PullTaskStandardMember {
  memberId: number;
  memberSeq: number;
  normalizedPhone: string;
  adminRequired: boolean;
  pullCallId: number | null;
  pullStatus: number;
  pullReasonCode: string | null;
  pullReasonMessage: string | null;
  waJid: string | null;
  adminStatus: number;
  adminReasonCode: string | null;
}

export interface PullTaskStandardMaterialSummary {
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  unknownCount: number;
  remainingCount: number;
  submittedCount: number;
  canceledCount: number;
}

export interface PullTaskStandardResourceCount {
  currentCount: number;
  plannedCount: number;
  missingCount: number;
}

export interface PullTaskStandardTaskSummary {
  totalGroupCount: number;
  executingGroupCount: number;
  waitingResourceGroupCount: number;
  completedGroupCount: number;
  failedGroupCount: number;
  abandonedGroupCount: number;
  totalMemberCount: number;
  successfulMemberCount: number;
  failedMemberCount: number;
  unknownMemberCount: number;
  remainingMemberCount: number;
}

export interface PullTaskStandardSetting {
  autoStart: 0 | 1;
  groupFolderId: number | null;
  groupFolderName: string | null;
  pullerSyncMode: "SINGLE" | "BATCH";
  materialAdminTiming: 1 | 2;
  clearExistingMembers: boolean;
  earlyPullCount: number;
  earlyPullCallCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerCountPerGroup: number;
  stationCountPerCall: number;
  concurrentGroupCount: number;
  managerGroupId: number;
  managerGroupName: string;
  pullerGroupId: number;
  pullerGroupName: string;
  stationGroupId: number | null;
  stationGroupName: string | null;
  managerFinishGroupId: number | null;
  managerFinishGroupName: string | null;
  pullerFinishGroupId: number | null;
  pullerFinishGroupName: string | null;
}

export interface PullTaskStandardGroupSetting
  extends PullTaskStandardGroupSettingRequest {
  avatarPreviewUrl: string | null;
}

export interface PullTaskStandardTaskDetail {
  taskId: number;
  taskName: string;
  status: PullTaskStandardStatus;
  groupCount: number;
  expectedPullCount: number;
  startedAt: number | null;
  finishedAt: number | null;
  createdAt: number | null;
  remark: string | null;
  executions: PullTaskStandardExecutionSummary[];
  summary: PullTaskStandardTaskSummary | null;
  standardSetting: PullTaskStandardSetting;
  groupSetting: PullTaskStandardGroupSetting;
}

export interface PullTaskStandardExecutionQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  executionStatus?: number;
  stage?: number;
  waitResourceType?: number;
  manualPaused?: number;
}

export interface PullTaskManagerOptionRole {
  roleRowId: number;
  accountId: number;
  accountPhone: string;
  membershipStatus: number;
  adminStatus: number;
  availabilityStatus: number;
}

export interface PullTaskManagerCandidate {
  accountId: number;
  accountPhone: string;
}

export interface PullTaskManagerSupplementOptions {
  currentManagerCount: number;
  requiredManagerCount: number;
  missingManagerCount: number;
  managerGroupId: number;
  managerInviteAvailable: boolean;
  currentManagers: PullTaskManagerOptionRole[];
  executorAccounts: PullTaskManagerOptionRole[];
  candidates: PullTaskManagerCandidate[];
}

export interface PullTaskManagerSupplementRequest {
  accountGroupId: number;
  accountId: number;
  entryMode: 1 | 2;
  executorRoleRowId: number | null;
}

export interface PullTaskPullerOptionRole {
  roleRowId: number;
  accountId: number;
  accountPhone: string;
  membershipStatus: number;
  availabilityStatus: number;
  occupied: boolean;
}

export interface PullTaskPullerCandidate {
  accountId: number;
  accountPhone: string;
}

export interface PullTaskPullerSupplementOptions {
  currentPullerCount: number;
  requiredPullerCount: number;
  missingPullerCount: number;
  pullerGroupId: number;
  currentPullers: PullTaskPullerOptionRole[];
  candidates: PullTaskPullerCandidate[];
}

export interface PullTaskPullerSupplementRequest {
  accountGroupId: number;
  supplementCount: number;
  selectionMode: 1 | 2;
  entryMode: 1;
  accountIds: number[];
}

export interface PullTaskStationCandidate {
  accountId: number;
  accountPhone: string;
}

export interface PullTaskStationSupplementOptions {
  requiredStationCount: number;
  missingStationCount: number;
  stationGroupId: number | null;
  candidates: PullTaskStationCandidate[];
}

export interface PullTaskStationSupplementRequest {
  accountGroupId: number;
  supplementCount: number;
  selectionMode: 1 | 2;
  accountIds: number[];
}

export interface PullTaskIdsRequest {
  ids: number[];
}

export interface PullTaskSupplementRequest {
  groupRowIds: number[];
  accountGroupId: number;
  countPerGroup: number;
  joinMode: string;
}

export interface PullTaskGroupOperationRequest {
  groupRowIds: number[];
  operation: string;
}

export interface PullTaskExportResult {
  filename: string;
  content: string;
}

function toListParams(query: PullTaskQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    id: query.id,
    keyword: query.keyword?.trim() || undefined,
    status: query.status || undefined,
    taskType: query.taskType || undefined,
    groupSource: query.groupSource || undefined,
    operator: query.operator?.trim() || undefined
  };
}

export function listPullTasks(
  query: PullTaskQuery = {}
): Promise<PageResponse<PullTaskRow>> {
  return armadaRequest<PageResponse<PullTaskRow>>("get", "/api/pull-tasks", {
    params: toListParams(query)
  });
}

export function getPullTaskGroupMarketingSetting(): Promise<PullTaskGroupMarketingSetting> {
  return armadaRequest<PullTaskGroupMarketingSetting>(
    "get",
    "/api/pull-tasks/group-marketing-setting"
  );
}

export function updatePullTaskGroupMarketingSetting(
  data: UpdatePullTaskGroupMarketingSettingRequest
): Promise<PullTaskGroupMarketingSetting> {
  return armadaRequest<PullTaskGroupMarketingSetting>(
    "put",
    "/api/pull-tasks/group-marketing-setting",
    { data }
  );
}

export function listPullTaskGroupMarketingCandidates(
  query: PullTaskGroupCandidateQuery = {}
): Promise<PageResponse<PullTaskGroupCandidateRow>> {
  return armadaRequest<PageResponse<PullTaskGroupCandidateRow>>(
    "get",
    "/api/pull-tasks/group-marketing/candidate-groups",
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        source: query.source,
        keyword: query.keyword?.trim() || undefined,
        groupJid: query.groupJid?.trim() || undefined,
        managerPhone: query.managerPhone?.trim() || undefined,
        accountGroupId: query.accountGroupId,
        showRegularGroups: query.showRegularGroups,
        minMemberCount: query.minMemberCount,
        maxMemberCount: query.maxMemberCount,
        announceOnly: query.announceOnly,
        reservationToken: query.reservationToken?.trim() || undefined
      }
    }
  );
}

export function addPullTaskGroupMarketingWaiting(
  data: AddPullTaskGroupWaitingRequest
): Promise<PullTaskGroupWaitingPool> {
  return armadaRequest<PullTaskGroupWaitingPool>(
    "post",
    "/api/pull-tasks/group-marketing/waiting-pool",
    { data }
  );
}

export function getPullTaskGroupMarketingWaiting(
  reservationToken: string
): Promise<PullTaskGroupWaitingPool> {
  return armadaRequest<PullTaskGroupWaitingPool>(
    "get",
    "/api/pull-tasks/group-marketing/waiting-pool",
    { params: { reservationToken } }
  );
}

export function removePullTaskGroupMarketingWaiting(
  data: RemovePullTaskGroupWaitingRequest
): Promise<PullTaskGroupWaitingPool> {
  return armadaRequest<PullTaskGroupWaitingPool>(
    "post",
    "/api/pull-tasks/group-marketing/waiting-pool/remove",
    { data }
  );
}

export function releasePullTaskGroupMarketingWaiting(
  reservationToken: string
): Promise<void> {
  return armadaRequest<void>(
    "delete",
    "/api/pull-tasks/group-marketing/waiting-pool",
    { params: { reservationToken } }
  );
}

export function createPullTask(
  data: CreatePullTaskRequest
): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", "/api/pull-tasks", { data });
}

export function getPullTaskStandardDraft(): Promise<PullTaskStandardDraft> {
  return armadaRequest<PullTaskStandardDraft>(
    "get",
    "/api/pull-tasks/standard/draft"
  );
}

export function planPullTaskStandardDraft(
  groupFolderId: number | null,
  linksText: string,
  files: File[] = []
): Promise<PullTaskStandardDraft> {
  const data = new FormData();
  if (groupFolderId !== null) {
    data.append("groupFolderId", String(groupFolderId));
  }
  data.append("linksText", linksText);
  files.forEach(file => data.append("files", file));
  return armadaRequest<PullTaskStandardDraft>(
    "post",
    "/api/pull-tasks/standard/draft/plan",
    { data, timeout: 45_000 },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function uploadPullTaskStandardGroupAvatar(
  file: File
): Promise<PullTaskStandardGroupAvatarUpload> {
  const data = new FormData();
  data.append("file", file);
  return armadaRequest<PullTaskStandardGroupAvatarUpload>(
    "post",
    "/api/pull-tasks/standard/group-avatars",
    { data },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function deletePullTaskStandardGroupAvatar(
  avatarFileKey: string
): Promise<void> {
  return armadaRequest<void>(
    "delete",
    `/api/pull-tasks/standard/group-avatars/${encodeURIComponent(avatarFileKey)}`
  );
}

export function getPullTaskStandardGroupAvatarContent(
  avatarPreviewUrl: string
): Promise<Blob> {
  const prefix = "/api/pull-tasks/standard/group-avatars/";
  if (!avatarPreviewUrl.startsWith(prefix)) {
    return Promise.reject(new Error("群头像预览地址不合法"));
  }
  return http.request<Blob>("get", avatarPreviewUrl, {
    responseType: "blob"
  });
}

export function removePullTaskStandardDraftRow(
  rowId: number
): Promise<PullTaskStandardDraft> {
  return armadaRequest<PullTaskStandardDraft>(
    "delete",
    `/api/pull-tasks/standard/draft/rows/${rowId}`
  );
}

export function clearPullTaskStandardDraft(): Promise<PullTaskStandardDraft> {
  return armadaRequest<PullTaskStandardDraft>(
    "delete",
    "/api/pull-tasks/standard/draft"
  );
}

export function createPullTaskStandard(
  data: PullTaskStandardCreateRequest
): Promise<PullTaskStandardCreated> {
  return armadaRequest<PullTaskStandardCreated>(
    "post",
    "/api/pull-tasks/standard",
    { data }
  );
}

export function getPullTaskStandardDetail(
  taskId: number
): Promise<PullTaskStandardTaskDetail> {
  return armadaRequest<PullTaskStandardTaskDetail>(
    "get",
    `/api/pull-tasks/standard/${taskId}`
  );
}

export function listPullTaskStandardExecutions(
  taskId: number,
  query: PullTaskStandardExecutionQuery
): Promise<PageResponse<PullTaskStandardExecutionSummary>> {
  return armadaRequest<PageResponse<PullTaskStandardExecutionSummary>>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions`,
    { params: query }
  );
}

export function getPullTaskStandardExecutionDetail(
  taskId: number,
  executionId: number
): Promise<PullTaskStandardExecutionDetail> {
  return armadaRequest<PullTaskStandardExecutionDetail>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}`
  );
}

export function getPullTaskStandardExecutionMembers(
  taskId: number,
  executionId: number
): Promise<PullTaskStandardMember[]> {
  return armadaRequest<PullTaskStandardMember[]>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/members`
  );
}

export function startPullTaskStandard(taskId: number): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/start`
  );
}

export function pausePullTaskStandard(taskId: number): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/pause`
  );
}

export function resumePullTaskStandard(taskId: number): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/resume`
  );
}

export function endPullTaskStandard(taskId: number): Promise<void> {
  return armadaRequest<void>("post", `/api/pull-tasks/standard/${taskId}/end`);
}

export function pausePullTaskStandardExecution(
  taskId: number,
  executionId: number
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/pause`
  );
}

export function resumePullTaskStandardExecution(
  taskId: number,
  executionId: number
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/resume`
  );
}

export function endPullTaskStandardExecution(
  taskId: number,
  executionId: number
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/end`
  );
}

export function getPullTaskManagerSupplementOptions(
  taskId: number,
  executionId: number,
  accountGroupId?: number
): Promise<PullTaskManagerSupplementOptions> {
  return armadaRequest<PullTaskManagerSupplementOptions>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/manager-supplement/options`,
    { params: { accountGroupId } }
  );
}

export function supplementPullTaskManager(
  taskId: number,
  executionId: number,
  data: PullTaskManagerSupplementRequest
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/manager-supplement`,
    { data }
  );
}

export function getPullTaskPullerSupplementOptions(
  taskId: number,
  executionId: number,
  accountGroupId?: number
): Promise<PullTaskPullerSupplementOptions> {
  return armadaRequest<PullTaskPullerSupplementOptions>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/puller-supplement/options`,
    { params: { accountGroupId } }
  );
}

export function supplementPullTaskPuller(
  taskId: number,
  executionId: number,
  data: PullTaskPullerSupplementRequest
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/puller-supplement`,
    { data }
  );
}

export function getPullTaskStationSupplementOptions(
  taskId: number,
  executionId: number,
  accountGroupId?: number
): Promise<PullTaskStationSupplementOptions> {
  return armadaRequest<PullTaskStationSupplementOptions>(
    "get",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/station-supplement/options`,
    { params: { accountGroupId } }
  );
}

export function supplementPullTaskStation(
  taskId: number,
  executionId: number,
  data: PullTaskStationSupplementRequest
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/pull-tasks/standard/${taskId}/executions/${executionId}/station-supplement`,
    { data }
  );
}

export function getPullTaskDetail(id: number): Promise<PullTaskDetail> {
  return armadaRequest<PullTaskDetail>("get", `/api/pull-tasks/${id}`);
}

export function listPullTaskGroups(
  id: number,
  query: PullTaskGroupQuery = {}
): Promise<PageResponse<PullTaskGroupRow>> {
  return armadaRequest<PageResponse<PullTaskGroupRow>>(
    "get",
    `/api/pull-tasks/${id}/groups`,
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status || undefined,
        keyword: query.keyword || undefined
      }
    }
  );
}

export function startPullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/start`);
}

export function pausePullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/pause`);
}

export function stopPullTask(id: number): Promise<PullTaskRow> {
  return armadaRequest<PullTaskRow>("post", `/api/pull-tasks/${id}/stop`);
}

export function batchDeletePullTasks(ids: number[]): Promise<number> {
  return armadaRequest<number>("post", "/api/pull-tasks/batch-delete", {
    data: { ids }
  });
}

export function listPullTaskLinkGroups(): Promise<PullTaskLinkGroup[]> {
  return armadaRequest<PullTaskLinkGroup[]>("get", "/api/group-link-labels");
}

export function listPullTaskGroupLinks(
  params: { page?: number; pageSize?: number; labelId?: number | null } = {}
): Promise<PageResponse<PullTaskLinkOption>> {
  return armadaRequest<PageResponse<BackendPullTaskLinkOption>>(
    "get",
    "/api/group-links",
    {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        labelId: params.labelId || undefined
      }
    }
  ).then(result => ({
    ...result,
    list:
      result.list?.map(row => ({
        ...row,
        groupName: row.groupName ?? row.waSubject ?? null,
        linkUrl: row.linkUrl ?? row.url ?? ""
      })) ?? []
  }));
}

export function supplementPullTaskRows(
  id: number,
  data: PullTaskSupplementRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/supplement-pullers`,
    { data }
  );
}

export function runPullTaskGroupOperation(
  id: number,
  data: PullTaskGroupOperationRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/operations`,
    { data }
  );
}

export function runPullTaskRowsOperation(
  id: number,
  data: PullTaskGroupOperationRequest
): Promise<number> {
  return armadaRequest<number>(
    "post",
    `/api/pull-tasks/${id}/groups/task-operations`,
    { data }
  );
}

export function exportPullTaskReport(
  id: number,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-report`,
    { params: { groupRowIds: groupRowIds.join(",") || undefined } }
  );
}

export function exportPullTaskGroupLinks(
  id: number,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-links`,
    { params: { groupRowIds: groupRowIds.join(",") || undefined } }
  );
}

export function exportPullTaskResources(
  id: number,
  kind: string,
  groupRowIds: number[] = []
): Promise<PullTaskExportResult> {
  return armadaRequest<PullTaskExportResult>(
    "get",
    `/api/pull-tasks/${id}/export-resources`,
    {
      params: {
        kind,
        groupRowIds: groupRowIds.join(",") || undefined
      }
    }
  );
}
