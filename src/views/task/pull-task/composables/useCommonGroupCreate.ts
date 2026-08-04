import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createCommonGroupTask,
  type CommonGroupTaskCreateResult
} from "@/api/common-group-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { listGroupFolders, type GroupFolderRow } from "@/api/group-folder";
import { apiErrorMessage } from "@/utils/api-error";
import {
  createCommonGroupForm,
  toCommonGroupCreateRequest,
  validateCommonGroupForm,
  type CommonGroupForm,
  type CommonGroupFormErrors
} from "../common-group/common-group-form";

export type CommonGroupTaskItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

export interface CommonGroupTaskItem {
  index: number;
  groupName: string;
  status: CommonGroupTaskItemStatus;
  message: string;
}

export interface CommonGroupMockTask extends CommonGroupTaskCreateResult {
  status: "PROCESSING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  items: CommonGroupTaskItem[];
}

export interface CommonGroupCreateState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  cancel: () => Promise<void>;
  confirmCreate: () => Promise<void>;
  confirmVisible: Ref<boolean>;
  creating: Ref<boolean>;
  errors: CommonGroupFormErrors;
  form: CommonGroupForm;
  groupFolders: Ref<GroupFolderRow[]>;
  loading: Ref<boolean>;
  open: () => Promise<void>;
  requestClose: (done: () => void) => Promise<void>;
  reset: () => void;
  resultVisible: Ref<boolean>;
  returnToForm: () => Promise<void>;
  retryItem: (item: CommonGroupTaskItem) => void;
  submit: () => void;
  task: Ref<CommonGroupMockTask | null>;
  taskProgress: ComputedRef<number>;
  visible: Ref<boolean>;
}

export function useCommonGroupCreate(): CommonGroupCreateState {
  const visible = ref(false);
  const loading = ref(false);
  const creating = ref(false);
  const confirmVisible = ref(false);
  const resultVisible = ref(false);
  const form = reactive<CommonGroupForm>(createCommonGroupForm());
  const errors = reactive<CommonGroupFormErrors>({});
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const groupFolders = ref<GroupFolderRow[]>([]);
  const task = ref<CommonGroupMockTask | null>(null);
  let cleanSnapshot = JSON.stringify(form);
  let executionTimer: ReturnType<typeof setInterval> | undefined;

  const taskProgress = computed(() => {
    if (!task.value?.items.length) return 0;
    const finished = task.value.items.filter(item =>
      ["SUCCESS", "FAILED"].includes(item.status)
    ).length;
    return Math.round((finished / task.value.items.length) * 100);
  });

  function clearErrors(): void {
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof CommonGroupFormErrors];
    });
  }

  function reset(): void {
    Object.assign(form, createCommonGroupForm());
    clearErrors();
    cleanSnapshot = JSON.stringify(form);
  }

  async function loadOptions(): Promise<void> {
    loading.value = true;
    try {
      const [accountResult, folderResult] = await Promise.allSettled([
        listAccountGroups({ page: 1, pageSize: 500 }),
        listGroupFolders({ page: 1, pageSize: 500 })
      ]);
      if (accountResult.status === "fulfilled") {
        accountGroups.value = accountResult.value.list ?? [];
      } else {
        accountGroups.value = [];
        ElMessage.error(
          apiErrorMessage(accountResult.reason, "账号分组加载失败")
        );
      }
      if (folderResult.status === "fulfilled") {
        groupFolders.value = folderResult.value.list ?? [];
      } else {
        groupFolders.value = [];
        ElMessage.error(
          apiErrorMessage(folderResult.reason, "群组分组加载失败")
        );
      }
    } finally {
      loading.value = false;
    }
  }

  async function open(): Promise<void> {
    reset();
    visible.value = true;
    await loadOptions();
  }

  async function requestClose(done: () => void): Promise<void> {
    if (JSON.stringify(form) !== cleanSnapshot) {
      try {
        await ElMessageBox.confirm("放弃未提交的修改？", "提示", {
          confirmButtonText: "放弃",
          cancelButtonText: "继续编辑",
          type: "warning"
        });
      } catch {
        return;
      }
    }
    done();
    reset();
  }

  async function cancel(): Promise<void> {
    await requestClose(() => {
      visible.value = false;
    });
  }

  function submit(): void {
    clearErrors();
    Object.assign(errors, validateCommonGroupForm(form));
    if (Object.keys(errors).length) {
      ElMessage.warning("请检查并完善必填配置");
      return;
    }
    confirmVisible.value = true;
  }

  function stopExecution(): void {
    if (executionTimer) clearInterval(executionTimer);
    executionTimer = undefined;
  }

  function updateTaskStatus(): void {
    if (!task.value) return;
    const hasPending = task.value.items.some(item =>
      ["PENDING", "PROCESSING"].includes(item.status)
    );
    if (hasPending) {
      task.value.status = "PROCESSING";
      return;
    }
    const successCount = task.value.items.filter(
      item => item.status === "SUCCESS"
    ).length;
    task.value.status =
      successCount === task.value.items.length
        ? "SUCCESS"
        : successCount === 0
          ? "FAILED"
          : "PARTIAL_SUCCESS";
  }

  function startMockExecution(): void {
    stopExecution();
    executionTimer = setInterval(() => {
      if (!task.value) return stopExecution();
      const processing = task.value.items.find(
        item => item.status === "PROCESSING"
      );
      if (processing) {
        const shouldFail =
          task.value.items.length >= 3 &&
          processing.index === task.value.items.length;
        processing.status = shouldFail ? "FAILED" : "SUCCESS";
        processing.message = shouldFail ? "模拟执行失败，可重试" : "建群成功";
      }
      const next = task.value.items.find(item => item.status === "PENDING");
      if (next) {
        next.status = "PROCESSING";
        next.message = "正在创建";
      } else {
        stopExecution();
      }
      updateTaskStatus();
    }, 700);
  }

  async function confirmCreate(): Promise<void> {
    creating.value = true;
    try {
      const result = await createCommonGroupTask(
        toCommonGroupCreateRequest(form)
      );
      const prefix = form.groupName.trim() || "群名称";
      task.value = {
        ...result,
        status: "PROCESSING",
        items: Array.from({ length: form.groupCount }, (_, offset) => ({
          index: offset + 1,
          groupName: `${prefix}${form.startIndex + offset}`,
          status: "PENDING",
          message: "等待执行"
        }))
      };
      confirmVisible.value = false;
      visible.value = false;
      resultVisible.value = true;
      task.value.items[0]!.status = "PROCESSING";
      task.value.items[0]!.message = "正在创建";
      startMockExecution();
      ElMessage.success("普群任务创建成功");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "普群任务创建失败"));
    } finally {
      creating.value = false;
    }
  }

  function retryItem(item: CommonGroupTaskItem): void {
    if (item.status !== "FAILED") return;
    item.status = "PROCESSING";
    item.message = "正在重试";
    window.setTimeout(() => {
      item.status = "SUCCESS";
      item.message = "重试成功";
      updateTaskStatus();
      ElMessage.success(`${item.groupName} 重试成功`);
    }, 600);
  }

  async function returnToForm(): Promise<void> {
    stopExecution();
    resultVisible.value = false;
    task.value = null;
    await open();
  }

  onBeforeUnmount(stopExecution);

  return {
    accountGroups,
    cancel,
    confirmCreate,
    confirmVisible,
    creating,
    errors,
    form,
    groupFolders,
    loading,
    open,
    requestClose,
    reset,
    resultVisible,
    returnToForm,
    retryItem,
    submit,
    task,
    taskProgress,
    visible
  };
}
