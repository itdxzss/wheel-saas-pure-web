import {
  computed,
  onScopeDispose,
  ref,
  watch,
  type ComputedRef,
  type Ref
} from "vue";
import {
  getTierCheck,
  listTierCheckItems,
  recheckTierCheck,
  retryTierCheck,
  stopTierCheck,
  type TierCheckItem,
  type TierCheckTask
} from "@/api/account-tier-check";
import { apiErrorMessage } from "@/utils/api-error";
import { tierEntries } from "../tier-check-display";

export const TIER_DETAIL_POLL_MS = 4000;

export interface TierCheckDetailState {
  task: Ref<TierCheckTask | null>;
  items: Ref<TierCheckItem[]>;
  itemPage: Ref<number>;
  itemTotal: Ref<number>;
  filter: Ref<"all" | "changed" | "lost">;
  busy: Ref<boolean>;
  error: Ref<string>;
  sortedTierCounts: ComputedRef<ReturnType<typeof tierEntries>>;
  refresh: () => Promise<void>;
  act: (action: "stop" | "retry" | "recheck") => Promise<boolean>;
}

/** 只读刷新进度；切换批次/关闭后拒绝旧结果，绝不自动创建复查。 */
export function useTierCheckDetail(
  open: Ref<boolean>,
  taskId: Readonly<Ref<number | null>>
): TierCheckDetailState {
  const task = ref<TierCheckTask | null>(null);
  const items = ref<TierCheckItem[]>([]);
  const itemPage = ref(1);
  const itemTotal = ref(0);
  const filter = ref<"all" | "changed" | "lost">("all");
  const busy = ref(false);
  const error = ref("");
  const sortedTierCounts = computed(() => tierEntries(task.value?.tierCounts));
  let generation = 0;
  let itemGeneration = 0;
  let taskGeneration = 0;
  let resetting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function stopPolling(): void {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  function schedule(): void {
    stopPolling();
    if (open.value && task.value?.status === 1)
      timer = setTimeout(() => void refresh(), TIER_DETAIL_POLL_MS);
  }
  async function loadItems(): Promise<void> {
    const id = taskId.value;
    if (!open.value || !id) return;
    const current = generation;
    const request = ++itemGeneration;
    try {
      const result = await listTierCheckItems(
        id,
        itemPage.value,
        filter.value === "all" ? undefined : filter.value
      );
      if (current !== generation || request !== itemGeneration) return;
      items.value = result.list ?? [];
      itemTotal.value = result.total ?? 0;
    } catch (e) {
      if (current === generation && request === itemGeneration) {
        items.value = [];
        itemTotal.value = 0;
        error.value = apiErrorMessage(e, "检测明细加载失败");
      }
    }
  }
  async function loadTask(): Promise<void> {
    const id = taskId.value;
    if (!open.value || !id) return;
    const current = generation;
    const request = ++taskGeneration;
    try {
      const result = await getTierCheck(id);
      if (current === generation && request === taskGeneration)
        task.value = result;
    } catch (e) {
      if (current === generation && request === taskGeneration)
        error.value = apiErrorMessage(e, "检测详情加载失败");
    }
  }
  async function refresh(): Promise<void> {
    const current = generation;
    error.value = "";
    await Promise.all([loadTask(), loadItems()]);
    if (current === generation) schedule();
  }
  watch(
    [open, taskId],
    ([visible]) => {
      generation++;
      stopPolling();
      busy.value = false;
      resetting = true;
      itemPage.value = 1;
      filter.value = "all";
      resetting = false;
      task.value = null;
      items.value = [];
      itemTotal.value = 0;
      error.value = "";
      if (visible) void refresh();
    },
    { flush: "sync" }
  );
  watch(
    filter,
    () => {
      if (resetting || !open.value) return;
      resetting = true;
      itemPage.value = 1;
      resetting = false;
      error.value = "";
      void loadItems();
    },
    { flush: "sync" }
  );
  watch(
    itemPage,
    () => {
      if (!resetting && open.value) {
        error.value = "";
        void loadItems();
      }
    },
    { flush: "sync" }
  );
  async function act(action: "stop" | "retry" | "recheck"): Promise<boolean> {
    if (!open.value || !taskId.value || busy.value) return false;
    const current = generation;
    const id = taskId.value;
    busy.value = true;
    error.value = "";
    try {
      await {
        stop: stopTierCheck,
        retry: retryTierCheck,
        recheck: recheckTierCheck
      }[action](id);
      if (current !== generation) return false;
      await refresh();
      return current === generation;
    } catch (e) {
      if (current === generation)
        error.value = apiErrorMessage(e, "检测操作失败");
      return false;
    } finally {
      if (current === generation) busy.value = false;
    }
  }
  onScopeDispose(() => {
    generation++;
    stopPolling();
  });
  return {
    task,
    items,
    itemPage,
    itemTotal,
    filter,
    busy,
    error,
    sortedTierCounts,
    refresh,
    act
  };
}
