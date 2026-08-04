import { ref, type Ref } from "vue";
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
  open: (taskId: number, executionId: number) => Promise<void>;
}

/** 加载普通群链接单群的角色、调用、动作和逐成员真实结果。 */
export function usePullTaskExecutionDetail(): PullTaskExecutionDetailState {
  const visible = ref(false);
  const loading = ref(false);
  const detail = ref<PullTaskStandardExecutionDetail | null>(null);
  const members = ref<PullTaskStandardMember[]>([]);

  async function open(taskId: number, executionId: number): Promise<void> {
    visible.value = true;
    loading.value = true;
    detail.value = null;
    members.value = [];
    try {
      const [executionDetail, executionMembers] = await Promise.all([
        getPullTaskStandardExecutionDetail(taskId, executionId),
        getPullTaskStandardExecutionMembers(taskId, executionId)
      ]);
      detail.value = executionDetail;
      members.value = executionMembers;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群执行明细加载失败"));
    } finally {
      loading.value = false;
    }
  }

  return { visible, loading, detail, members, open };
}
