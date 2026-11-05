import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createMutualChats,
  getMutualChats,
  listMutualChatItems,
  listMutualChats,
  previewMutualChats,
  retryMutualChats,
  stopMutualChats,
  type MutualChatItem,
  type MutualChatPreview,
  type MutualChatRequest,
  type MutualChatTask
} from "@/api/account-mutual-chat";
import { validMutualForm } from "../mutual-chat-display";
/** randomUUID 仅在 HTTPS/localhost 可用；HTTP 测试环境回退到 getRandomValues 生成 v4 UUID。 */
function mutualRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value =>
    value.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/** 页面只控制展示和轮询，真实任务及发送间隔均由后端执行。 */
export function useMutualChats(open: Ref<boolean>) {
  const form = reactive<{
    leftGroupId?: number;
    rightGroupId?: number;
    intervalSeconds: number;
    leftText: string;
    rightText: string;
  }>({ intervalSeconds: 10, leftText: "", rightText: "" });
  const preview = ref<MutualChatPreview>();
  const busy = ref(false);
  const error = ref("");
  const tasks = ref<MutualChatTask[]>([]);
  const taskPage = ref(1);
  const taskTotal = ref(0);
  const selected = ref<MutualChatTask>();
  const items = ref<MutualChatItem[]>([]);
  const itemPage = ref(1);
  const itemTotal = ref(0);
  const itemStatus = ref<number>();
  let requestId = mutualRequestId();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let refreshGeneration = 0;
  let pollGeneration = 0;
  const valid = computed(() => validMutualForm(form));
  const canStart = computed(
    () => valid.value && !!preview.value?.operationCount && !busy.value
  );
  function request(): MutualChatRequest {
    return {
      leftGroupId: form.leftGroupId!,
      rightGroupId: form.rightGroupId!,
      intervalSeconds: form.intervalSeconds,
      leftText: form.leftText.trim(),
      rightText: form.rightText.trim(),
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
        listMutualChats(taskPage.value),
        id ? getMutualChats(id) : undefined,
        id
          ? listMutualChatItems(id, itemPage.value, itemStatus.value)
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
      preview.value = await previewMutualChats(request());
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
      const task = await createMutualChats(request());
      selected.value = task;
      itemPage.value = 1;
      itemStatus.value = undefined;
      taskPage.value = 1;
      requestId = mutualRequestId();
      preview.value = undefined;
      ElMessage.success("互聊任务已创建");
      await refresh();
    } catch (cause) {
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function select(task: MutualChatTask): Promise<void> {
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
        "停止后不再派发新消息，已提交消息仍会接收结果。重试可以继续未发送的方向。",
        "停止互聊任务",
        { type: "warning" }
      );
    } catch {
      return;
    }
    busy.value = true;
    error.value = "";
    try {
      await stopMutualChats(id);
      await refresh();
    } catch (cause) {
      report(cause);
    } finally {
      busy.value = false;
    }
  }
  async function retry(): Promise<void> {
    if (!selected.value || busy.value) return;
    const task = selected.value;
    busy.value = true;
    error.value = "";
    try {
      // 查询最新统计，避免轮询旧快照漏掉待确认消息的重复风险。
      const latest = await getMutualChats(task.id);
      if (latest.stats.unknown > 0) {
        try {
          await ElMessageBox.confirm(
            "该消息可能已经发出，重试可能让对方收到重复消息",
            "重试待确认消息",
            { type: "warning" }
          );
        } catch {
          return;
        }
      }
      const count = await retryMutualChats(task.id, latest.stats.unknown > 0);
      ElMessage.info(`已重新排入 ${count} 条失败、待确认或已取消消息`);
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
    requestId = mutualRequestId();
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
