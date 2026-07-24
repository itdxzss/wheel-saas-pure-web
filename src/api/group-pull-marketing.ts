import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";

/** 拉群营销任务主状态：待启动、执行中、已暂停、已完成、已手动结束。 */
export type GroupPullTaskStatus = 1 | 2 | 5 | 7 | 8;

/** 拉群营销执行阻塞原因。 */
export type GroupPullBlockReason = 0 | 1 | 2 | 3 | 4 | 5;

/** 拉群营销资源状态：未锁定、已锁定、释放中、已释放。 */
export type GroupPullResourceStatus = 1 | 2 | 3 | 4;

/** 群组发言权限：不操作、禁言、不禁言。 */
export type GroupPullSpeakPermission = 1 | 2 | 3;

/** 创建拉群营销任务时随料子文件一起提交的配置。 */
export interface CreateGroupPullMarketingConfig {
  taskName: string;
  builderGroupId: number;
  successGroupId?: number | null;
  failureGroupId?: number | null;
  marketingGroupId: number;
  marketingAccountGroupLimit: number;
  marketingTemplateId: number;
  sendIntervalSeconds: number;
  groupNamePrefix?: string | null;
  friendRetryLimit: number;
  materialPerGroup: number;
  speakPermission: GroupPullSpeakPermission;
  builderExitEnabled: boolean;
  remark?: string | null;
  taskEndAt: number;
}

/** 拉群营销一级任务列表行，字段名与 Armada 后端 VO 保持一致。 */
export interface GroupPullMarketingTaskRow {
  id: number;
  taskName: string;
  status: GroupPullTaskStatus;
  blockReason: GroupPullBlockReason;
  resourceStatus: GroupPullResourceStatus;
  totalDataCount: number;
  completedDataCount: number;
  successGroupCount: number;
  failedGroupCount: number;
  marketingAccountTotalCount?: number | null;
  usedMarketingAccountCount: number;
  createdAt: number;
  taskEndAt: number;
}

/** 拉群营销任务配置及聚合统计详情。 */
export interface GroupPullMarketingTaskDetail
  extends GroupPullMarketingTaskRow {
  builderGroupId: number;
  successGroupId?: number | null;
  failureGroupId?: number | null;
  marketingGroupId: number;
  marketingAccountGroupLimit: number;
  marketingTemplateId: number;
  sendIntervalSeconds: number;
  groupNamePrefix?: string | null;
  friendRetryLimit: number;
  materialPerGroup: number;
  speakPermission: GroupPullSpeakPermission;
  builderExitEnabled: boolean;
  remark?: string | null;
  updatedAt: number;
}

/** 一条正式进入建群流程的群组执行明细。 */
export interface GroupPullMarketingGroupRow {
  executionId: number;
  builderAccountPhone?: string | null;
  marketingAccountPhone?: string | null;
  groupName?: string | null;
  groupJid?: string | null;
  groupInviteUrl?: string | null;
  groupStatus?: number | null;
  materialJoinedCount: number;
  groupMemberCount?: number | null;
  sentMessageCount: number;
  speakPermission: GroupPullSpeakPermission;
  builderExitEnabled: boolean;
  builderExitStatus: number;
  marketerAdminStatus: number;
  executionStatus: number;
  failureStage: number;
  failureReason?: string | null;
  marketingSendStatus?: number | null;
  lastSentAt?: number | null;
  groupCreatedAt?: number | null;
}

/** 拉群营销一级列表查询条件。 */
export interface GroupPullMarketingTaskQuery {
  page?: number;
  pageSize?: number;
  id?: number;
  keyword?: string;
  status?: GroupPullTaskStatus | "";
  blockReason?: GroupPullBlockReason | "";
  resourceStatus?: GroupPullResourceStatus | "";
}

/** 群组执行明细分页条件。 */
export interface GroupPullMarketingGroupQuery {
  page?: number;
  pageSize?: number;
}

function optionalCode<T extends number>(value?: T | ""): T | undefined {
  return value === "" ? undefined : value;
}

/** 分页查询拉群营销一级任务列表。 */
export function listGroupPullMarketingTasks(
  query: GroupPullMarketingTaskQuery = {}
): Promise<PageResponse<GroupPullMarketingTaskRow>> {
  return armadaRequest<PageResponse<GroupPullMarketingTaskRow>>(
    "get",
    "/api/group-pull-marketing-tasks",
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        id: query.id,
        keyword: query.keyword?.trim() || undefined,
        status: optionalCode(query.status),
        blockReason: optionalCode(query.blockReason),
        resourceStatus: optionalCode(query.resourceStatus)
      }
    }
  );
}

/** 使用唯一配置 JSON 和唯一料子文件保存待启动任务。 */
export function createGroupPullMarketingTask(
  config: CreateGroupPullMarketingConfig,
  materialFile: File
): Promise<GroupPullMarketingTaskDetail> {
  const formData = new FormData();
  formData.append(
    "config",
    new Blob([JSON.stringify(config)], { type: "application/json" })
  );
  formData.append("materialFile", materialFile);
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "post",
    "/api/group-pull-marketing-tasks",
    { data: formData },
    {
      // 交给浏览器补 multipart boundary，手工设置会导致 Spring 无法解析 part。
      beforeRequestCallback: request => {
        delete request.headers["Content-Type"];
      }
    }
  );
}

/** 查询拉群营销任务配置详情。 */
export function getGroupPullMarketingTask(
  id: number
): Promise<GroupPullMarketingTaskDetail> {
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "get",
    `/api/group-pull-marketing-tasks/${id}`
  );
}

/** 分页查询任务的正式建群执行明细。 */
export function listGroupPullMarketingGroups(
  id: number,
  query: GroupPullMarketingGroupQuery = {}
): Promise<PageResponse<GroupPullMarketingGroupRow>> {
  return armadaRequest<PageResponse<GroupPullMarketingGroupRow>>(
    "get",
    `/api/group-pull-marketing-tasks/${id}/groups`,
    { params: { page: query.page, pageSize: query.pageSize } }
  );
}

/** 启动待启动任务并尝试锁定营销分组。 */
export function startGroupPullMarketingTask(
  id: number
): Promise<GroupPullMarketingTaskDetail> {
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "post",
    `/api/group-pull-marketing-tasks/${id}/start`
  );
}

/** 暂停执行中的任务，已有营销资源继续保持锁定。 */
export function pauseGroupPullMarketingTask(
  id: number
): Promise<GroupPullMarketingTaskDetail> {
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "post",
    `/api/group-pull-marketing-tasks/${id}/pause`
  );
}

/** 恢复已暂停且资源锁仍有效的任务。 */
export function resumeGroupPullMarketingTask(
  id: number
): Promise<GroupPullMarketingTaskDetail> {
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "post",
    `/api/group-pull-marketing-tasks/${id}/resume`
  );
}

/** 手动结束任务并发起安全资源释放。 */
export function releaseGroupPullMarketingTask(
  id: number
): Promise<GroupPullMarketingTaskDetail> {
  return armadaRequest<GroupPullMarketingTaskDetail>(
    "post",
    `/api/group-pull-marketing-tasks/${id}/release`
  );
}

/** 删除从未启动且未持有资源的任务。 */
export function deleteGroupPullMarketingTask(id: number): Promise<void> {
  return armadaRequest<void>("delete", `/api/group-pull-marketing-tasks/${id}`);
}
