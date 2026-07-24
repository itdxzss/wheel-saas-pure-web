<script setup lang="ts">
import { computed } from "vue";
import type { AccountGroupMarketingOccupancy } from "@/api/account-group";
import { formatEpochMillis } from "@/utils/time";
import {
  marketingOccupancyMeta,
  occupiedBusinessTypeOptions
} from "../marketing-occupancy";

defineOptions({
  name: "MarketingOccupancyDialog"
});

const props = defineProps<{
  detail: AccountGroupMarketingOccupancy | null;
  loading: boolean;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: "task-click", detail: AccountGroupMarketingOccupancy): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

function taskBusinessLabel(type?: number | null): string {
  return (
    occupiedBusinessTypeOptions.find(option => option.value === type)?.label ??
    marketingOccupancyMeta(props.detail?.occupancyType).label
  );
}

function taskStatusLabel(
  status?: number | null,
  taskBusinessType?: number | null
): string {
  if (status === 8) {
    return taskBusinessType === 1 ? "已关闭" : "已手动结束";
  }
  return (
    {
      1: "待启动",
      2: "执行中",
      5: "已暂停",
      7: "已完成"
    }[status ?? 0] ?? "-"
  );
}

function resourceStatusLabel(detail: AccountGroupMarketingOccupancy): string {
  if (!detail.taskId) return "未锁定";
  return (
    {
      1: "未锁定",
      2: "已锁定",
      3: "释放中",
      4: "已释放"
    }[detail.resourceStatus ?? 2] ?? "已锁定"
  );
}

function formatLockedAt(value?: number | null): string {
  return formatEpochMillis(value);
}

/** 模式二、模式三等任务尚无前端详情页，只展示信息，不提供无效跳转。 */
function canOpenTask(detail: AccountGroupMarketingOccupancy): boolean {
  return Boolean(
    detail.taskId &&
      detail.taskName &&
      (detail.taskBusinessType === 1 || detail.taskBusinessType === 2)
  );
}
</script>

<template>
  <el-dialog v-model="visible" title="营销占用详情" width="600px">
    <div v-loading="loading" class="marketing-occupancy-detail">
      <el-result v-if="detail && !detail.taskId" icon="info" title="当前空闲" />
      <el-descriptions v-else-if="detail" :column="2" border>
        <el-descriptions-item label="营销任务类型">
          {{ taskBusinessLabel(detail.taskBusinessType) }}
        </el-descriptions-item>
        <el-descriptions-item label="任务ID">
          {{ detail.taskId ?? "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="任务名称">
          <el-button
            v-if="canOpenTask(detail)"
            link
            type="primary"
            @click="emit('task-click', detail)"
          >
            {{ detail.taskName }}
          </el-button>
          <span v-else>{{ detail.taskName || "-" }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="当前任务状态">
          {{ taskStatusLabel(detail.taskStatus, detail.taskBusinessType) }}
        </el-descriptions-item>
        <el-descriptions-item label="分组锁定状态">
          {{ resourceStatusLabel(detail) }}
        </el-descriptions-item>
        <el-descriptions-item label="锁定时间">
          {{ formatLockedAt(detail.lockedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="营销账号总数量">
          {{ detail.marketingAccountTotalCount }}
        </el-descriptions-item>
        <el-descriptions-item label="实际调用营销账号数量">
          {{ detail.marketingAccountUsedCount }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="暂无占用详情" />
    </div>
  </el-dialog>
</template>

<style scoped>
.marketing-occupancy-detail {
  min-height: 160px;
}
</style>
