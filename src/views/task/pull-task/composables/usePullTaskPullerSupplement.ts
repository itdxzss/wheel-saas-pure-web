import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPullTaskPullerSupplementOptions,
  supplementPullTaskPuller,
  type PullTaskPullerSupplementOptions,
  type PullTaskPullerSupplementRequest
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskPullerSupplementForm {
  accountGroupId: number | "";
  supplementCount: number;
  selectionMode: 1 | 2;
  accountIds: number[];
  continueRemainingData: true;
}

export interface PullTaskPullerSupplementState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  options: Ref<PullTaskPullerSupplementOptions | null>;
  form: PullTaskPullerSupplementForm;
  open: (taskId: number, executionId: number) => Promise<void>;
  changeAccountGroup: (accountGroupId: number) => Promise<void>;
  changeSelectionMode: (selectionMode: 1 | 2) => void;
  submit: () => Promise<void>;
}

interface PullerSupplementCallbacks {
  onSubmitted: () => Promise<void>;
}

interface TargetExecution {
  taskId: number;
  executionId: number;
}

function emptyForm(): PullTaskPullerSupplementForm {
  return {
    accountGroupId: "",
    supplementCount: 1,
    selectionMode: 1,
    accountIds: [],
    continueRemainingData: true
  };
}

function positiveId(value: number | ""): value is number {
  return typeof value === "number" && value > 0;
}

export function usePullTaskPullerSupplement(
  callbacks: PullerSupplementCallbacks
): PullTaskPullerSupplementState {
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const options = ref<PullTaskPullerSupplementOptions | null>(null);
  const form = reactive<PullTaskPullerSupplementForm>(emptyForm());
  let target: TargetExecution | null = null;

  function applyOptions(result: PullTaskPullerSupplementOptions): void {
    options.value = result;
    form.accountGroupId = result.pullerGroupId ?? "";
    form.supplementCount = Math.max(result.missingPullerCount, 1);
    form.accountIds = [];
  }

  async function loadOptions(accountGroupId?: number): Promise<void> {
    if (!target) return;
    loading.value = true;
    try {
      applyOptions(
        await getPullTaskPullerSupplementOptions(
          target.taskId,
          target.executionId,
          accountGroupId
        )
      );
    } catch (error) {
      options.value = null;
      ElMessage.error(apiErrorMessage(error, "补充拉手候选资源加载失败"));
    } finally {
      loading.value = false;
    }
  }

  async function open(taskId: number, executionId: number): Promise<void> {
    target = { taskId, executionId };
    Object.assign(form, emptyForm());
    options.value = null;
    visible.value = true;
    await loadOptions();
  }

  async function changeAccountGroup(accountGroupId: number): Promise<void> {
    form.accountGroupId = accountGroupId;
    form.accountIds = [];
    await loadOptions(accountGroupId);
  }

  function changeSelectionMode(selectionMode: 1 | 2): void {
    form.selectionMode = selectionMode;
    form.accountIds = [];
  }

  function payload(): PullTaskPullerSupplementRequest | null {
    if (!target || !positiveId(form.accountGroupId)) {
      ElMessage.warning("请选择拉手账号分组");
      return null;
    }
    const missing = options.value?.missingPullerCount ?? 0;
    if (missing <= 0) {
      ElMessage.warning("当前拉手已经补足");
      return null;
    }
    if (form.supplementCount < 1 || form.supplementCount > missing) {
      ElMessage.warning(`补充数量不能超过当前缺口 ${missing}`);
      return null;
    }
    if (form.selectionMode === 2) {
      const selected = new Set(form.accountIds);
      if (selected.size !== form.supplementCount) {
        ElMessage.warning(`请选择 ${form.supplementCount} 个候选拉手账号`);
        return null;
      }
    } else if ((options.value?.candidates.length ?? 0) < form.supplementCount) {
      ElMessage.warning("当前可用候选拉手数量不足");
      return null;
    }
    return {
      accountGroupId: form.accountGroupId,
      supplementCount: form.supplementCount,
      selectionMode: form.selectionMode,
      entryMode: 1,
      accountIds: form.selectionMode === 2 ? [...form.accountIds] : []
    };
  }

  async function submit(): Promise<void> {
    const request = payload();
    if (!request || !target) return;
    saving.value = true;
    try {
      await supplementPullTaskPuller(
        target.taskId,
        target.executionId,
        request
      );
      visible.value = false;
      ElMessage.success("补充拉手指令已提交");
      await callbacks.onSubmitted();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "补充拉手提交失败"));
    } finally {
      saving.value = false;
    }
  }

  return {
    visible,
    loading,
    saving,
    options,
    form,
    open,
    changeAccountGroup,
    changeSelectionMode,
    submit
  };
}
