import { computed, ref } from "vue";

export function useIpStatsRankCollapse() {
  const rankCollapsed = ref(false);

  const rankCollapseText = computed(() =>
    rankCollapsed.value ? "展开" : "收起"
  );
  const rankAriaExpanded = computed(() =>
    rankCollapsed.value ? "false" : "true"
  );

  function toggleRankCollapse(): void {
    rankCollapsed.value = !rankCollapsed.value;
  }

  return {
    rankAriaExpanded,
    rankCollapsed,
    rankCollapseText,
    toggleRankCollapse
  };
}
