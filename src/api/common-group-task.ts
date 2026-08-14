import { armadaRequest } from "@/api/armada";

export type CommonGroupMemberSource = "CONTROLLED_GROUP" | "EMPTY_GROUP";

export interface CommonGroupSettingsRequest {
  sendMessagesAllowed: boolean;
  editGroupSettingsAllowed: boolean;
  addMembersAllowed: boolean;
  joinApprovalEnabled: boolean;
  ephemeralDurationSeconds: number;
}

export interface CommonGroupTaskCreateRequest {
  adminAccountGroupId: number;
  creatorLeavePolicy: "KEEP" | "LEAVE";
  memberSource: CommonGroupMemberSource;
  memberAccountGroupId: number;
  memberCount: number;
  folderId: number | null;
  groupNameTemplate: string;
  groupCount: number;
  startNo: number;
  speed: "NORMAL";
  successMigrationGroupId: number | null;
  failedMigrationGroupId: number | null;
  settings: CommonGroupSettingsRequest;
}

export interface CommonGroupTaskSummary {
  id: number;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CommonGroupTaskItemResult {
  id: number;
  itemNo: number;
  groupSubject: string;
  creatorAccountId: number;
  creatorWsPhone: string;
  creatorProtocolBackend: "WEB" | "ANDROID";
  groupJid: string | null;
  groupLinkId: number | null;
  status:
    | "PENDING"
    | "RUNNING"
    | "CREATED"
    | "CREATED_PARTIAL"
    | "RESULT_UNKNOWN"
    | "FAILED";
  currentStep: string;
  settingsStatus: string | null;
  creatorLeaveStatus: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  updatedAt: number;
}

export interface CommonGroupTaskDetailResult {
  task: CommonGroupTaskSummary;
  items: CommonGroupTaskItemResult[];
}

export function createCommonGroupTask(
  data: CommonGroupTaskCreateRequest,
  idempotencyKey: string
): Promise<CommonGroupTaskSummary> {
  return armadaRequest<CommonGroupTaskSummary>(
    "post",
    "/api/normal-group-creation-tasks",
    { data, headers: { "Idempotency-Key": idempotencyKey } }
  );
}

export function getCommonGroupTask(
  taskId: number
): Promise<CommonGroupTaskDetailResult> {
  return armadaRequest<CommonGroupTaskDetailResult>(
    "get",
    `/api/normal-group-creation-tasks/${taskId}`
  );
}

export function retryCommonGroupTaskItem(
  taskId: number,
  itemId: number
): Promise<void> {
  return armadaRequest<void>(
    "post",
    `/api/normal-group-creation-tasks/${taskId}/items/${itemId}/retry`
  );
}
