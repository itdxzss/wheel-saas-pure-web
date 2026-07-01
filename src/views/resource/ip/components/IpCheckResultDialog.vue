<script setup lang="ts">
import { computed } from "vue";
import { formatEpochMillis } from "@/utils/time";
import type { IpProxyCheckResult } from "@/api/resource-ip";

defineOptions({
  name: "IpCheckResultDialog"
});

const props = defineProps<{
  results: IpProxyCheckResult[];
}>();

const visible = defineModel<boolean>({ required: true });

const successCount = computed(
  () => props.results.filter(item => item.checkStatus === "success").length
);
const failedCount = computed(() => props.results.length - successCount.value);

/** checkStatus 只代表本次检测结果,不等同于代理池业务状态。 */
function statusTagType(
  status: IpProxyCheckResult["checkStatus"]
): "success" | "danger" {
  return status === "success" ? "success" : "danger";
}

function statusLabel(status: IpProxyCheckResult["checkStatus"]): string {
  return status === "success" ? "成功" : "失败";
}

function checkedAtLabel(value?: number | null): string {
  return formatEpochMillis(value);
}

/** 优先展示检测国家码和后端最终 region;没有 region 时退回检测位置文本。 */
function regionLabel(row: Partial<IpProxyCheckResult>): string {
  return (
    [row.countryCode, row.region || row.location].filter(Boolean).join(" / ") ||
    "-"
  );
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="IP 检测结果"
    width="980px"
    destroy-on-close
  >
    <div class="check-summary">
      <el-tag type="success">成功 {{ successCount }}</el-tag>
      <el-tag type="danger">失败 {{ failedCount }}</el-tag>
      <span>共 {{ results.length }} 条</span>
    </div>

    <el-table :data="results" border max-height="520">
      <el-table-column label="检测状态" prop="checkStatus" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.checkStatus)">
            {{ statusLabel(row.checkStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="代理/ID" prop="id" width="100">
        <template #default="{ row }">#{{ row.id }}</template>
      </el-table-column>
      <el-table-column
        label="出口 IP"
        prop="outboundIp"
        min-width="140"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.outboundIp || "-" }}</template>
      </el-table-column>
      <el-table-column label="国家/地区" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ regionLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column
        label="ISP"
        prop="isp"
        min-width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.isp || "-" }}</template>
      </el-table-column>
      <el-table-column label="WhatsApp" prop="whatsappStatus" width="120">
        <template #default="{ row }">{{ row.whatsappStatus || "unknown" }}</template>
      </el-table-column>
      <el-table-column label="检测时间" prop="checkedAt" width="180">
        <template #default="{ row }">{{ checkedAtLabel(row.checkedAt) }}</template>
      </el-table-column>
      <el-table-column
        label="错误原因"
        prop="errorMessage"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.errorMessage || "-" }}</template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无检测结果" />
      </template>
    </el-table>
  </el-dialog>
</template>

<style scoped>
.check-summary {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
}
</style>
