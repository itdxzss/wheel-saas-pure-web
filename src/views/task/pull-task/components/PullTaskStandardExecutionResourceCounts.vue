<script setup lang="ts">
import type { PullTaskGroupRow } from "@/api/pull-task";

defineOptions({ name: "PullTaskStandardExecutionResourceCounts" });
defineProps<{ row: PullTaskGroupRow; directLink?: boolean }>();

function countLabel(
  current?: number | null,
  planned?: number | null,
  missing?: number | null
): string {
  if (current == null && planned == null && missing == null) return "-";
  const shortage = missing ? `（缺 ${missing}）` : "";
  return `${current ?? 0}/${planned ?? 0}${shortage}`;
}
</script>

<template>
  <template v-if="!directLink"
    >管理员：{{
      countLabel(
        row.managers?.currentCount,
        row.managers?.plannedCount,
        row.managers?.missingCount
      )
    }}<br
  /></template>
  当前拉手：{{
    countLabel(
      row.pullers?.currentCount,
      row.pullers?.plannedCount,
      row.pullers?.missingCount
    )
  }}<br />
  累计分配拉手：{{
    row.cumulativeAssignedPullerCount == null
      ? "—"
      : `${row.cumulativeAssignedPullerCount} 个`
  }}<br />
  站台：{{
    countLabel(
      row.stations?.currentCount,
      row.stations?.plannedCount,
      row.stations?.missingCount
    )
  }}
</template>
