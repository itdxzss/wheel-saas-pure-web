import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPullTaskStationSupplementOptions,
  supplementPullTaskStation,
  type PullTaskStationSupplementOptions,
  type PullTaskStationSupplementRequest
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskStationSupplementForm {
  accountGroupId: number | "";
  supplementCount: number;
  selectionMode: 1 | 2;
  accountIds: number[];
}

interface StationSupplementCallbacks {
  onSubmitted: () => Promise<void>;
}

interface TargetExecution {
  taskId: number;
  executionId: number;
}

export interface PullTaskStationSupplementState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  options: Ref<PullTaskStationSupplementOptions | null>;
  form: PullTaskStationSupplementForm;
  open: (taskId: number, executionId: number) => Promise<void>;
  changeAccountGroup: (accountGroupId: number) => Promise<void>;
  changeSelectionMode: (selectionMode: 1 | 2) => void;
  submit: () => Promise<void>;
}

function emptyForm(): PullTaskStationSupplementForm {
  return {
    accountGroupId: "",
    supplementCount: 1,
    selectionMode: 1,
    accountIds: []
  };
}

function positiveId(value: number | ""): value is number {
  return typeof value === "number" && value > 0;
}

export function usePullTaskStationSupplement(
  callbacks: StationSupplementCallbacks
): PullTaskStationSupplementState {
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const options = ref<PullTaskStationSupplementOptions | null>(null);
  const form = reactive<PullTaskStationSupplementForm>(emptyForm());
  let target: TargetExecution | null = null;

  function applyOptions(result: PullTaskStationSupplementOptions): void {
    options.value = result;
    form.accountGroupId = result.stationGroupId ?? "";
    form.supplementCount = Math.max(result.missingStationCount, 1);
    form.accountIds = [];
  }

  async function loadOptions(accountGroupId?: number): Promise<void> {
    if (!target) return;
    loading.value = true;
    try {
      applyOptions(
        await getPullTaskStationSupplementOptions(
          target.taskId,
          target.executionId,
          accountGroupId
        )
      );
    } catch (error) {
      options.value = null;
      ElMessage.error(apiErrorMessage(error, "补充站台候选资源加载失败"));
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

  function payload(): PullTaskStationSupplementRequest | null {
    if (!target || !positiveId(form.accountGroupId)) {
      ElMessage.warning("请选择站台账号分组");
      return null;
    }
    const missing = options.value?.missingStationCount ?? 0;
    if (missing <= 0) {
      ElMessage.warning("当前站台已经补足");
      return null;
    }
    if (form.supplementCount < 1 || form.supplementCount > missing) {
      ElMessage.warning(`补充数量不能超过当前缺口 ${missing}`);
      return null;
    }
    if (form.selectionMode === 2) {
      if (new Set(form.accountIds).size !== form.supplementCount) {
        ElMessage.warning(`请选择 ${form.supplementCount} 个候选站台账号`);
        return null;
      }
    } else if ((options.value?.candidates.length ?? 0) < form.supplementCount) {
      ElMessage.warning("当前可用候选站台数量不足");
      return null;
    }
    return {
      accountGroupId: form.accountGroupId,
      supplementCount: form.supplementCount,
      selectionMode: form.selectionMode,
      accountIds: form.selectionMode === 2 ? [...form.accountIds] : []
    };
  }

  async function submit(): Promise<void> {
    const request = payload();
    if (!request || !target) return;
    saving.value = true;
    try {
      await supplementPullTaskStation(
        target.taskId,
        target.executionId,
        request
      );
      visible.value = false;
      ElMessage.success("补充站台指令已提交");
      await callbacks.onSubmitted();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "补充站台提交失败"));
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
