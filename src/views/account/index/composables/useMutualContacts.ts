import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createMutualContacts,
  getMutualContacts,
  listMutualContactItems,
  listMutualContacts,
  previewMutualContacts,
  retryMutualContacts,
  stopMutualContacts,
  type MutualContactItem,
  type MutualContactPreview,
  type MutualContactRequest,
  type MutualContactTask
} from "@/api/account-mutual-contact";
import { validMutualForm } from "../mutual-contact-display";
/** 页面只控制展示和轮询，真实任务及保存间隔均由后端执行。 */
export function useMutualContacts(open: Ref<boolean>) {
  const form = reactive<{
    leftGroupId?: number;
    rightGroupId?: number;
    intervalSeconds: number;
  }>({ intervalSeconds: 0 });
  const preview = ref<MutualContactPreview>();
  const busy = ref(false);
  const error = ref("");
  const tasks = ref<MutualContactTask[]>([]);
  const taskPage = ref(1);
  const taskTotal = ref(0);
  const selected = ref<MutualContactTask>();
  const items = ref<MutualContactItem[]>([]);
  const itemPage = ref(1);
  const itemTotal = ref(0);
  const itemStatus = ref<number>();
  let requestId = crypto.randomUUID();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let refreshGeneration = 0;
  let pollGeneration = 0;
  const valid = computed(() =>
    validMutualForm(form.leftGroupId, form.rightGroupId, form.intervalSeconds)
  );
  const canStart = computed(
    () => valid.value && !!preview.value?.operationCount && !busy.value
  );
  function request(): MutualContactRequest {
    return {
      leftGroupId: form.leftGroupId!,
      rightGroupId: form.rightGroupId!,
      intervalSeconds: form.intervalSeconds,
      requestId,
      previewToken: preview.value?.previewToken
    };
  }
  function report(cause: unknown): void {
    error.value = cause instanceof Error ? cause.message : "操作失败，请重试";
  }
  async function refresh(): Promise<void> {
    const generation = ++refreshGeneration;
    const id = selected.value?.id;
    try {
      const [list, detail, rows] = await Promise.all([
        listMutualContacts(taskPage.value),
        id ? getMutualContacts(id) : undefined,
        id
          ? listMutualContactItems(id, itemPage.value, itemStatus.value)
          : undefined
      ]);
      if (generation !== refreshGeneration || !open.value) return;
      tasks.value = list.list ?? [];
      taskTotal.value = list.total ?? 0;
      if (id === selected.value?.id && detail) {
        selected.value = detail;
        items.value = rows?.list ?? [];
        itemTotal.value = rows?.total ?? 0;
      }
    } catch (cause) {
      if (generation === refreshGeneration) report(cause);
    }
  }
  async function check(): Promise<void> {
    if (!valid.value || busy.value) return;
    busy.value = true;
    error.value = "";
    try {
      preview.value = await previewMutualContacts(request());
    } catch (cause) {
      preview.value = undefined;
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function start(): Promise<void> {
    if (!canStart.value) return;
    busy.value = true;
    error.value = "";
    try {
      const task = await createMutualContacts(request());
      selected.value = task;
      itemPage.value = 1;
      itemStatus.value = undefined;
      taskPage.value = 1;
      requestId = crypto.randomUUID();
      preview.value = undefined;
      ElMessage.success("互存任务已创建");
      await refresh();
    } catch (cause) {
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function select(task: MutualContactTask): Promise<void> {
    selected.value = task;
    items.value = [];
    itemPage.value = 1;
    itemStatus.value = undefined;
    await refresh();
  }
  async function stop(): Promise<void> {
    if (!selected.value || busy.value) return;
    const id = selected.value.id;
    try {
      await ElMessageBox.confirm(
        "停止后不再派发后续保存，已提交操作仍会接收结果，已保存联系人保留。",
        "停止互存任务",
        { type: "warning" }
      );
    } catch {
      return;
    }
    busy.value = true;
    error.value = "";
    try {
      await stopMutualContacts(id);
      await refresh();
    } catch (cause) {
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function retry(): Promise<void> {
    if (!selected.value || busy.value) return;
    busy.value = true;
    error.value = "";
    try {
      const count = await retryMutualContacts(selected.value.id);
      ElMessage.info(`已重新排入 ${count} 条明确失败操作`);
      await refresh();
    } catch (cause) {
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function poll(generation: number): Promise<void> {
    await refresh();
    if (open.value && generation === pollGeneration)
      timer = setTimeout(() => void poll(generation), 3000);
  }
  watch(form, () => {
    preview.value = undefined;
    requestId = crypto.randomUUID();
  });
  watch(open, value => {
    if (timer) clearTimeout(timer);
    refreshGeneration++;
    pollGeneration++;
    if (value) void poll(pollGeneration);
  });
  watch([taskPage, itemPage, itemStatus], () => {
    if (open.value) void refresh();
  });
  onBeforeUnmount(() => {
    pollGeneration++;
    if (timer) clearTimeout(timer);
    refreshGeneration++;
  });
  return {
    form,
    preview,
    busy,
    error,
    tasks,
    taskPage,
    taskTotal,
    selected,
    items,
    itemPage,
    itemTotal,
    itemStatus,
    valid,
    canStart,
    check,
    start,
    select,
    stop,
    retry,
    refresh
  };
}
