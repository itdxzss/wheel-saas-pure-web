import { ref, type Ref } from "vue";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import {
  getGroupPullMarketingTask,
  listGroupPullMarketingGroups,
  type GroupPullMarketingGroupRow,
  type GroupPullMarketingTaskDetail
} from "@/api/group-pull-marketing";
import {
  listMarketingTemplates,
  type MarketingTemplateRow
} from "@/api/marketing-template";
import { ElMessage } from "element-plus";
import { apiErrorMessage } from "@/utils/api-error";

export interface GroupPullMarketingDetailState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  detail: Ref<GroupPullMarketingTaskDetail | null>;
  groups: Ref<GroupPullMarketingGroupRow[]>;
  groupsLoading: Ref<boolean>;
  initialLoading: Ref<boolean>;
  changeTaskId: (taskId: number) => Promise<void>;
  loadGroups: () => Promise<void>;
  loadInitial: () => Promise<void>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
}

/** 将动态路由参数收窄为单个正整数任务 ID。 */
export function parseGroupPullTaskId(raw: unknown): number | null {
  const value = Array.isArray(raw) && raw.length === 1 ? raw[0] : raw;
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/** 拉群营销任务摘要和群组分页明细的页面状态。 */
export function useGroupPullMarketingDetail(
  taskId: number
): GroupPullMarketingDetailState {
  const detail = ref<GroupPullMarketingTaskDetail | null>(null);
  const groups = ref<GroupPullMarketingGroupRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const marketingTemplates = ref<MarketingTemplateRow[]>([]);
  const initialLoading = ref(false);
  const groupsLoading = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  let currentTaskId = taskId;
  let taskVersion = 0;
  let initialRequestVersion = 0;
  let groupRequestVersion = 0;

  async function loadGroups(): Promise<void> {
    const requestTaskId = currentTaskId;
    const requestTaskVersion = taskVersion;
    const requestVersion = ++groupRequestVersion;
    groupsLoading.value = true;
    try {
      const result = await listGroupPullMarketingGroups(requestTaskId, {
        page: page.value,
        pageSize: pageSize.value
      });
      if (
        requestTaskVersion !== taskVersion ||
        requestVersion !== groupRequestVersion
      ) {
        return;
      }
      groups.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      if (
        requestTaskVersion !== taskVersion ||
        requestVersion !== groupRequestVersion
      ) {
        return;
      }
      groups.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "群组明细加载失败"));
    } finally {
      if (
        requestTaskVersion === taskVersion &&
        requestVersion === groupRequestVersion
      ) {
        groupsLoading.value = false;
      }
    }
  }

  async function loadInitial(): Promise<void> {
    const requestTaskId = currentTaskId;
    const requestTaskVersion = taskVersion;
    const requestVersion = ++initialRequestVersion;
    // 首屏同时包含第一页群明细，需要让更早的分页请求失效。
    const requestGroupVersion = ++groupRequestVersion;
    initialLoading.value = true;
    groupsLoading.value = true;
    try {
      // 使用 allSettled 隔离名称字典失败，任务和群明细仍可按 ID 正常展示。
      const [taskResult, groupResult, groupOptions, templateOptions] =
        await Promise.allSettled([
          getGroupPullMarketingTask(requestTaskId),
          listGroupPullMarketingGroups(requestTaskId, {
            page: page.value,
            pageSize: pageSize.value
          }),
          listAccountGroups({ page: 1, pageSize: 500 }),
          listMarketingTemplates({ page: 1, pageSize: 500 })
        ]);
      if (
        requestTaskVersion !== taskVersion ||
        requestVersion !== initialRequestVersion
      ) {
        return;
      }

      let coreLoadFailed = false;
      if (taskResult.status === "fulfilled") {
        detail.value = taskResult.value;
      } else {
        detail.value = null;
        coreLoadFailed = true;
      }
      if (requestGroupVersion === groupRequestVersion) {
        if (groupResult.status === "fulfilled") {
          groups.value = groupResult.value.list ?? [];
          total.value = groupResult.value.total ?? 0;
        } else {
          groups.value = [];
          total.value = 0;
          coreLoadFailed = true;
        }
      }
      if (coreLoadFailed) {
        ElMessage.error("拉群营销任务明细加载失败");
      }

      let optionLoadFailed = false;
      if (groupOptions.status === "fulfilled") {
        accountGroups.value = groupOptions.value.list ?? [];
      } else {
        optionLoadFailed = true;
      }
      if (templateOptions.status === "fulfilled") {
        marketingTemplates.value = templateOptions.value.list ?? [];
      } else {
        optionLoadFailed = true;
      }
      if (optionLoadFailed) {
        ElMessage.warning("部分名称加载失败，当前展示ID");
      }
    } finally {
      if (
        requestTaskVersion === taskVersion &&
        requestVersion === initialRequestVersion
      ) {
        initialLoading.value = false;
      }
      if (
        requestTaskVersion === taskVersion &&
        requestGroupVersion === groupRequestVersion
      ) {
        groupsLoading.value = false;
      }
    }
  }

  /** 同一隐藏路由复用组件时，清空旧任务状态并重新加载新任务。 */
  async function changeTaskId(nextTaskId: number): Promise<void> {
    currentTaskId = nextTaskId;
    taskVersion += 1;
    initialRequestVersion += 1;
    groupRequestVersion += 1;
    detail.value = null;
    groups.value = [];
    accountGroups.value = [];
    marketingTemplates.value = [];
    total.value = 0;
    page.value = 1;
    initialLoading.value = false;
    groupsLoading.value = false;
    await loadInitial();
  }

  return {
    accountGroups,
    changeTaskId,
    detail,
    groups,
    groupsLoading,
    initialLoading,
    loadGroups,
    loadInitial,
    marketingTemplates,
    page,
    pageSize,
    total
  };
}
