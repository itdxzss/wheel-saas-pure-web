import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  restartMarketingTask,
  type MarketingTaskRow
} from "@/api/marketing-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface MarketingTaskRestartForm {
  taskStartAt: string;
  taskEndAt: string;
}

export interface MarketingTaskRestartState {
  activeRestartTask: Ref<MarketingTaskRow | null>;
  closeRestartDialog: () => void;
  openRestartDialog: (row: MarketingTaskRow) => void;
  restartDialogOpen: Ref<boolean>;
  restartForm: Ref<MarketingTaskRestartForm>;
  restartSubmitting: Ref<boolean>;
  submitRestart: () => Promise<void>;
}

const DEFAULT_TASK_DURATION_MS = 24 * 60 * 60 * 1000;

function originalDuration(row: MarketingTaskRow): number {
  const startAt = row.taskStartAt;
  const endAt = row.taskEndAt;
  return startAt != null && endAt != null && endAt > startAt
    ? endAt - startAt
    : DEFAULT_TASK_DURATION_MS;
}

function timestamp(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 管理已结束营销任务的重新启动弹窗和提交状态,避免生命周期逻辑继续堆入主页面 composable。
 */
export function useMarketingTaskRestart(
  refreshTasks: () => void | Promise<void>
): MarketingTaskRestartState {
  const activeRestartTask = ref<MarketingTaskRow | null>(null);
  const restartDialogOpen = ref(false);
  const restartSubmitting = ref(false);
  const restartForm = ref<MarketingTaskRestartForm>({
    taskStartAt: "",
    taskEndAt: ""
  });

  function openRestartDialog(row: MarketingTaskRow): void {
    if (restartSubmitting.value) return;
    if (row.status !== 7) {
      ElMessage.warning("只有已结束的任务可以重新启动");
      return;
    }
    const now = Date.now();
    // 沿用原任务持续时长;历史窗口异常时回退 24 小时,让运营仍能直接调整并提交。
    const duration = originalDuration(row);
    activeRestartTask.value = row;
    restartForm.value = {
      taskStartAt: String(now),
      taskEndAt: String(now + duration)
    };
    restartDialogOpen.value = true;
  }

  function closeRestartDialog(): void {
    restartDialogOpen.value = false;
    activeRestartTask.value = null;
    restartForm.value = { taskStartAt: "", taskEndAt: "" };
  }

  async function submitRestart(): Promise<void> {
    const task = activeRestartTask.value;
    if (!task) return;
    const taskStartAt = timestamp(restartForm.value.taskStartAt);
    const taskEndAt = timestamp(restartForm.value.taskEndAt);
    if (taskStartAt == null) {
      ElMessage.warning("请选择任务开始时间");
      return;
    }
    if (taskEndAt == null) {
      ElMessage.warning("请选择任务结束时间");
      return;
    }
    if (taskEndAt <= taskStartAt) {
      ElMessage.warning("任务结束时间必须晚于任务开始时间");
      return;
    }
    if (taskEndAt <= Date.now()) {
      ElMessage.warning("任务结束时间必须晚于当前时间");
      return;
    }

    restartSubmitting.value = true;
    try {
      await restartMarketingTask(task.id, { taskStartAt, taskEndAt });
      ElMessage.success("营销任务已重新启动");
      closeRestartDialog();
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "重新启动营销任务失败"));
    } finally {
      restartSubmitting.value = false;
    }
  }

  return {
    activeRestartTask,
    closeRestartDialog,
    openRestartDialog,
    restartDialogOpen,
    restartForm,
    restartSubmitting,
    submitRestart
  };
}
