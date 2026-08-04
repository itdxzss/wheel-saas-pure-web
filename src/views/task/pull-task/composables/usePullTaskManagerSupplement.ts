import { reactive, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPullTaskManagerSupplementOptions,
  supplementPullTaskManager,
  type PullTaskManagerSupplementOptions,
  type PullTaskManagerSupplementRequest
} from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskManagerSupplementForm {
  accountGroupId: number | "";
  accountId: number | "";
  entryMode: 1 | 2;
  executorRoleRowId: number | "";
}

export interface PullTaskManagerSupplementState {
  visible: Ref<boolean>;
  loading: Ref<boolean>;
  saving: Ref<boolean>;
  options: Ref<PullTaskManagerSupplementOptions | null>;
  form: PullTaskManagerSupplementForm;
  open: (taskId: number, executionId: number) => Promise<void>;
  changeAccountGroup: (accountGroupId: number) => Promise<void>;
  submit: () => Promise<void>;
}

interface ManagerSupplementCallbacks {
  onSubmitted: () => Promise<void>;
}

interface TargetExecution {
  taskId: number;
  executionId: number;
}

function emptyForm(): PullTaskManagerSupplementForm {
  return {
    accountGroupId: "",
    accountId: "",
    entryMode: 1,
    executorRoleRowId: ""
  };
}

function positiveId(value: number | ""): value is number {
  return typeof value === "number" && value > 0;
}

export function usePullTaskManagerSupplement(
  callbacks: ManagerSupplementCallbacks
): PullTaskManagerSupplementState {
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const options = ref<PullTaskManagerSupplementOptions | null>(null);
  const form = reactive<PullTaskManagerSupplementForm>(emptyForm());
  let target: TargetExecution | null = null;

  function applyOptions(result: PullTaskManagerSupplementOptions): void {
    options.value = result;
    form.accountGroupId = result.managerGroupId;
    form.accountId = "";
    if (!result.managerInviteAvailable) {
      form.entryMode = 1;
      form.executorRoleRowId = "";
    }
  }

  async function loadOptions(accountGroupId?: number): Promise<void> {
    if (!target) return;
    loading.value = true;
    try {
      const result = await getPullTaskManagerSupplementOptions(
        target.taskId,
        target.executionId,
        accountGroupId
      );
      applyOptions(result);
    } catch (error) {
      options.value = null;
      ElMessage.error(apiErrorMessage(error, "补充管理员候选资源加载失败"));
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
    form.accountId = "";
    await loadOptions(accountGroupId);
  }

  function payload(): PullTaskManagerSupplementRequest | null {
    if (!target || !positiveId(form.accountGroupId)) {
      ElMessage.warning("请选择管理员账号分组");
      return null;
    }
    if (!positiveId(form.accountId)) {
      ElMessage.warning("请选择候选管理员账号");
      return null;
    }
    if (form.entryMode === 2) {
      if (!options.value?.managerInviteAvailable) {
        ElMessage.warning("当前没有可执行邀请的管理员账号");
        return null;
      }
      if (!positiveId(form.executorRoleRowId)) {
        ElMessage.warning("请选择执行设置账号");
        return null;
      }
    }
    return {
      accountGroupId: form.accountGroupId,
      accountId: form.accountId,
      entryMode: form.entryMode,
      executorRoleRowId:
        form.entryMode === 2 && positiveId(form.executorRoleRowId)
          ? form.executorRoleRowId
          : null
    };
  }

  async function submit(): Promise<void> {
    const request = payload();
    if (!request || !target) return;
    saving.value = true;
    try {
      await supplementPullTaskManager(
        target.taskId,
        target.executionId,
        request
      );
      visible.value = false;
      ElMessage.success("补充管理员指令已提交");
      await callbacks.onSubmitted();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "补充管理员提交失败"));
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
    submit
  };
}
