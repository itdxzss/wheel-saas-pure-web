<script setup lang="ts">
import { computed, ref } from "vue";
import { hasAuth } from "@/router/utils";
import type {
  GroupDataPackageExportFormat,
  GroupDataPackageExportStatus,
  GroupDataPackageMetrics
} from "@/api/group-data-package";
import { exportCount, exportOptions } from "../domain/package-display";

defineOptions({ name: "GroupPackageExportMenu" });
const props = defineProps<{
  metrics: GroupDataPackageMetrics;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  size?: "small" | "default";
}>();
const emit = defineEmits<{
  (
    event: "export",
    status: GroupDataPackageExportStatus,
    format: GroupDataPackageExportFormat
  ): void;
}>();
const visible = ref(false);
const canExport = computed(() => hasAuth("tenant:group_data_package:export"));
const options = computed(() =>
  exportOptions.map(item => {
    const count = exportCount(props.metrics, item.value);
    const label = `${item.label}（${count.toLocaleString()}）`;
    if (item.value === "unused" || item.value === "success")
      return {
        value: `${item.value}:txt`,
        label: `${label} · TXT`,
        disabled: count === 0
      };
    return {
      value: item.value,
      label,
      disabled: count === 0,
      children: [
        { value: `${item.value}:txt`, label: "TXT（保留 A 标记）" },
        { value: `${item.value}:csv`, label: "CSV（含号码明细）" }
      ]
    };
  })
);
function select(value: unknown): void {
  if (typeof value !== "string") return;
  const [status, format] = value.split(":");
  if (
    !exportOptions.some(item => item.value === status) ||
    (format !== "txt" && format !== "csv")
  )
    return;
  visible.value = false;
  emit("export", status as GroupDataPackageExportStatus, format);
}
</script>

<template>
  <el-popover
    v-if="canExport"
    v-model:visible="visible"
    trigger="click"
    placement="bottom-start"
    :width="500"
    :disabled="disabled || loading"
  >
    <template #reference>
      <el-button
        type="primary"
        plain
        :size="size ?? 'small'"
        :disabled="disabled"
        :loading="loading"
        >{{ label ?? "导出" }} ▾</el-button
      >
    </template>
    <el-cascader-panel
      v-if="visible"
      :options="options"
      :props="{ emitPath: false }"
      @change="select"
    />
  </el-popover>
</template>
