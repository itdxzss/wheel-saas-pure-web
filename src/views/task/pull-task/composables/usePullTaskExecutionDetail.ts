import { ref, watch, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPullTaskStandardExecutionDetail,
  getPullTaskStandardExecutionMembers,
  type PullTaskStandardExecutionDetail,
  type PullTaskStandardMember
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskExecutionDetailState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  detail: Ref<PullTaskStandardExecutionDetail | null>;
  members: Ref<PullTaskStandardMember[]>;
  refreshError: Ref<string>;
  refreshedAt: Ref<number | null>;
  refresh: (silent?: boolean) => Promise<void>;
  open: (taskId: number, executionId: number) => Promise<void>;
}

/** 加载普通群链接单群的角色、调用、动作和逐成员真实结果。 */
export function usePullTaskExecutionDetail(): PullTaskExecutionDetailState {
  const visible = ref(false);
  const loading = ref(false);
  const detail = ref<PullTaskStandardExecutionDetail | null>(null);
  const members = ref<PullTaskStandardMember[]>([]);
  const refreshError = ref("");
  const refreshedAt = ref<number | null>(null);
  let target: { taskId: number; executionId: number } | null = null;
  let requestVersion = 0;

  watch(
    visible,
    value => {
      if (!value) {
        requestVersion++;
        target = null;
        loading.value = false;
      }
    },
    { flush: "sync" }
  );

  async function open(taskId: number, executionId: number): Promise<void> {
    visible.value = true;
    requestVersion++;
    target = { taskId, executionId };
    loading.value = false;
    detail.value = null;
    members.value = [];
    refreshError.value = "";
    refreshedAt.value = null;
    await refresh();
  }

  async function refresh(silent = false): Promise<void> {
    if (!target || loading.value || !visible.value) return;
    const { taskId, executionId } = target;
    const version = ++requestVersion;
    loading.value = true;
    try {
      const [executionDetail, executionMembers] = await Promise.all([
        getPullTaskStandardExecutionDetail(taskId, executionId),
        getPullTaskStandardExecutionMembers(taskId, executionId)
      ]);
      if (version !== requestVersion) return;
      detail.value = executionDetail;
      members.value = executionMembers;
      refreshedAt.value =
        executionDetail.execution.observation?.observedAt ?? Date.now();
      refreshError.value = "";
    } catch (error) {
      if (version !== requestVersion) return;
      refreshError.value = apiErrorMessage(error, "群执行明细加载失败");
      if (!silent) ElMessage.error(refreshError.value);
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  return {
    visible,
    loading,
    detail,
    members,
    open,
    refresh,
    refreshError,
    refreshedAt
  };
}
