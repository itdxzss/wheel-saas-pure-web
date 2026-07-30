import { reactive, ref, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteGroupPullMarketingTask,
  listGroupPullMarketingTasks,
  pauseGroupPullMarketingTask,
  releaseGroupPullMarketingTask,
  resumeGroupPullMarketingTask,
  startGroupPullMarketingTask,
  type GroupPullBlockReason,
  type GroupPullMarketingTaskRow,
  type GroupPullResourceStatus,
  type GroupPullTaskStatus
} from "@/api/group-pull-marketing";
import { apiErrorMessage } from "@/utils/api-error";

export interface GroupPullMarketingSearchForm {
  id: string;
  keyword: string;
  status: GroupPullTaskStatus | "";
  blockReason: GroupPullBlockReason | "";
  resourceStatus: GroupPullResourceStatus | "";
}

export interface GroupPullMarketingPageState {
  deleteTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  loadTasks: () => Promise<void>;
  loading: Ref<boolean>;
  page: Ref<number>;
  pageSize: Ref<number>;
  pauseTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  releaseTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  resetSearchForm: () => void;
  resumeTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  rows: Ref<GroupPullMarketingTaskRow[]>;
  searchForm: GroupPullMarketingSearchForm;
  searchTasks: () => void;
  startTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  total: Ref<number>;
}

/** 拉群营销一级列表查询和生命周期操作。 */
export function useGroupPullMarketingPage(): GroupPullMarketingPageState {
  const searchForm = reactive<GroupPullMarketingSearchForm>({
    id: "",
    keyword: "",
    status: "",
    blockReason: "",
    resourceStatus: ""
  });
  const rows = ref<GroupPullMarketingTaskRow[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  function buildQuery() {
    const parsedId = Number(searchForm.id.trim());
    return {
      page: page.value,
      pageSize: pageSize.value,
      id:
        searchForm.id.trim() && Number.isSafeInteger(parsedId) && parsedId > 0
          ? parsedId
          : undefined,
      keyword: searchForm.keyword,
      status: searchForm.status,
      blockReason: searchForm.blockReason,
      resourceStatus: searchForm.resourceStatus
    };
  }

  async function loadTasks(): Promise<void> {
    loading.value = true;
    try {
      const result = await listGroupPullMarketingTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群营销任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  function searchTasks(): void {
    page.value = 1;
    void loadTasks();
  }

  function resetSearchForm(): void {
    Object.assign(searchForm, {
      id: "",
      keyword: "",
      status: "",
      blockReason: "",
      resourceStatus: ""
    });
    page.value = 1;
    void loadTasks();
  }

  async function runLifecycleAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string
  ): Promise<void> {
    try {
      await action();
      ElMessage.success(successMessage);
      await loadTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, failureMessage));
    }
  }

  async function startTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => startGroupPullMarketingTask(row.id),
      "拉群营销任务已启动",
      "任务启动失败"
    );
  }

  async function pauseTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => pauseGroupPullMarketingTask(row.id),
      "任务已暂停，营销分组继续保持锁定",
      "任务暂停失败"
    );
  }

  async function resumeTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => resumeGroupPullMarketingTask(row.id),
      "拉群营销任务已恢复",
      "任务恢复失败"
    );
  }

  async function releaseTask(row: GroupPullMarketingTaskRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        "释放账号后，当前任务将停止继续创建群组，并解除建群账号及营销分组占用。是否继续？",
        "释放账号",
        { type: "warning", confirmButtonText: "确认释放" }
      );
    } catch {
      return;
    }
    await runLifecycleAction(
      () => releaseGroupPullMarketingTask(row.id),
      "任务已结束，正在释放账号",
      "账号释放失败"
    );
  }

  async function deleteTask(row: GroupPullMarketingTaskRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `确认删除待启动任务“${row.taskName}”吗？`,
        "删除任务",
        { type: "warning" }
      );
    } catch {
      return;
    }
    await runLifecycleAction(
      () => deleteGroupPullMarketingTask(row.id),
      "拉群营销任务已删除",
      "任务删除失败"
    );
  }

  return {
    deleteTask,
    loadTasks,
    loading,
    page,
    pageSize,
    pauseTask,
    releaseTask,
    resetSearchForm,
    resumeTask,
    rows,
    searchForm,
    searchTasks,
    startTask,
    total
  };
}
