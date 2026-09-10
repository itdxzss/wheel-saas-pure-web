import {
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type Ref
} from "vue";

/** 仅在可见且启用时串行刷新，关闭、卸载或切到后台后取消计时。 */
export function useContactRefresh(
  enabled: Ref<boolean>,
  refresh: () => Promise<void>
): void {
  const visible = ref(typeof document !== "undefined" && !document.hidden);
  const active = ref(true);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  function stop() {
    generation++;
    clearTimeout(timer);
  }
  function schedule() {
    stop();
    if (!enabled.value || !visible.value || !active.value) return;
    const version = generation;
    timer = setTimeout(async () => {
      try {
        await refresh();
      } finally {
        if (version === generation) schedule();
      }
    }, 10_000);
  }
  function visibilityChanged() {
    visible.value = !document.hidden;
  }
  watch([enabled, visible, active], schedule, { immediate: true });
  onActivated(() => {
    active.value = true;
  });
  onDeactivated(() => {
    active.value = false;
  });
  onMounted(() =>
    document.addEventListener("visibilitychange", visibilityChanged)
  );
  onUnmounted(() => {
    stop();
    document.removeEventListener("visibilitychange", visibilityChanged);
  });
}
