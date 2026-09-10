import { armadaRequest } from "@/api/armada";
import { ArmadaApiError } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import type { GroupListRow } from "@/api/group";

/** 独立后端 ScriptMarketingSaveDTO 的消息快照契约。 */
export interface ScriptMessage {
  templateName: string;
  linkMode: 1 | 2 | 3;
  content: string;
  bodyText: string;
  imageFileId: number | null;
  promotionLink: string;
  mentionAll: boolean;
  buttons: {
    type: "LINK_JUMP" | "COPY_CONTENT" | "QUICK_REPLY";
    text: string;
    param: string;
  }[];
}
export interface ScriptStep {
  role: "ADMIN" | "PROMOTER";
  accountId: number | null;
  message: ScriptMessage;
  roleKey: string | null;
  waitMinSeconds: number | null;
  waitMaxSeconds: number | null;
}
export interface ScriptSave {
  accountGroupId: number | null;
  taskName: string;
  intervalSeconds: number;
  startAt: number | null;
  endAt: number | null;
  groupLinkIds: number[];
  steps: ScriptStep[];
}
export interface ScriptTask {
  accountGroupId: number | null;
  pauseReason: string | null;
  id: number;
  taskName: string;
  status: 0 | 1 | 2 | 3 | 4;
  intervalSeconds: number;
  startAt: number;
  endAt: number | null;
  createdAt: number;
  groupCount: number;
  successCount: number;
  failedCount: number;
  unknownCount: number;
  inFlightCount: number;
}
export interface ScriptGroup {
  bindingsJson: string | null;
  paused: boolean;
  pauseReason: string | null;
  id: number;
  taskId: number;
  groupLinkId: number;
  groupJid: string;
  groupName: string | null;
  nextStep: number;
  nextAt: number;
  remainingWaitMs: number;
}
export interface ScriptRecord {
  id: number;
  groupId: number;
  stepIndex: number;
  accountId: number;
  commandId: string;
  status: 1 | 2 | 3 | 4 | 5;
  reason: string | null;
  messageId: string | null;
  submittedAt: number;
  finishedAt: number | null;
}
export interface ScriptDetail {
  task: ScriptTask;
  steps: ScriptStep[];
  groups: ScriptGroup[];
}
export interface ScriptAccountOption {
  id: number;
  wsPhone: string;
  loginState?: number;
}
export type ScriptAction = "start" | "pause" | "resume" | "close";
export interface ScriptQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
}
const root = "/api/script-marketing-tasks";
export const listScriptTasks = (
  query: ScriptQuery
): Promise<PageResponse<ScriptTask>> =>
  armadaRequest("get", root, { params: query });
export const getScriptTask = (id: number): Promise<ScriptDetail> =>
  armadaRequest("get", `${root}/${id}`);
export const saveScriptTask = (
  data: ScriptSave,
  id?: number
): Promise<ScriptDetail> =>
  armadaRequest(id ? "put" : "post", id ? `${root}/${id}` : root, { data });
export const actOnScriptTask = (
  id: number,
  action: ScriptAction
): Promise<void> => armadaRequest("post", `${root}/${id}/${action}`);
export const listScriptRecords = (
  id: number,
  page: number
): Promise<PageResponse<ScriptRecord>> =>
  armadaRequest("get", `${root}/${id}/records`, {
    params: { page, pageSize: 20 }
  });
export const scriptAccountOptions = (
  keyword = ""
): Promise<PageResponse<ScriptAccountOption>> =>
  armadaRequest("get", `${root}/options/accounts`, {
    params: { keyword, page: 1, pageSize: 100 }
  });
export const scriptGroupOptions = (
  accountGroupId: number,
  keyword = "",
  page = 1
): Promise<PageResponse<GroupListRow>> =>
  armadaRequest("get", `${root}/options/groups`, {
    params: { accountGroupId, keyword, page, pageSize: 100 }
  });

export interface ScriptAccountGroupOption {
  id: number;
  name: string;
}
export interface ScriptQualificationGroup {
  groupLinkId: number;
  groupJid: string;
  groupName: string | null;
  ready: boolean;
  required: number;
  available: number;
  shortage: number;
  offline: number;
  noPermission: number;
  unconfirmed: number;
  reasons: string[];
}
export interface ScriptQualification {
  ready: boolean;
  accountCount: number;
  requiredPromoters: number;
  poolReason: string | null;
  checkedAt: number;
  groups: ScriptQualificationGroup[];
}
export const scriptAccountGroupOptions = (): Promise<
  ScriptAccountGroupOption[]
> => armadaRequest("get", `${root}/options/account-groups`);
export const checkScriptDraft = (
  data: ScriptSave
): Promise<ScriptQualification> =>
  armadaRequest("post", `${root}/check`, { data });
export const checkScriptTask = (id: number): Promise<ScriptQualification> =>
  armadaRequest("get", `${root}/${id}/check`);
export const actOnScriptGroup = (
  id: number,
  groupId: number,
  action: "pause" | "resume"
): Promise<void> =>
  armadaRequest("post", `${root}/${id}/groups/${groupId}/${action}`);

/** 只接收后端逐群资格报告形状，其他业务错误仍使用普通错误处理。 */
export function qualificationFromError(
  error: unknown
): ScriptQualification | undefined {
  if (!(error instanceof ArmadaApiError)) return;
  const data = error.data;
  if (
    !data ||
    typeof data !== "object" ||
    !("ready" in data) ||
    typeof data.ready !== "boolean" ||
    !("groups" in data) ||
    !Array.isArray(data.groups)
  )
    return;
  if (
    !data.groups.every(
      row =>
        row &&
        typeof row.groupLinkId === "number" &&
        typeof row.shortage === "number" &&
        Array.isArray(row.reasons)
    )
  )
    return;
  return data as ScriptQualification;
}
