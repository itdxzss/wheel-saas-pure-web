<script setup lang="ts">
import { computed } from "vue";
import { formatEpochMillis } from "@/utils/time";
import type {
  IpProxyImportSampleCheckResult,
  IpProxyImportSampleRow
} from "@/api/resource-ip";

defineOptions({
  name: "IpImportSampleCheckDialog"
});

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    result?: IpProxyImportSampleCheckResult | null;
  }>(),
  {
    loading: false,
    result: null
  }
);

const visible = defineModel<boolean>({ required: true });

const rows = computed(() => props.result?.samples ?? []);
const successCount = computed(() => rows.value.filter(row => row.passed).length);
const failedCount = computed(() => rows.value.length - successCount.value);

function statusTagType(passed: boolean): "success" | "danger" {
  return passed ? "success" : "danger";
}

function statusLabel(row: Partial<IpProxyImportSampleRow>): string {
  return row.passed || row.connectionStatus === "success" ? "成功" : "失败";
}

function proxyAddress(row: Partial<IpProxyImportSampleRow>): string {
  if (!row.host || row.port == null) return "-";
  return `${row.host}:${row.port}`;
}

function regionLabel(row: Partial<IpProxyImportSampleRow>): string {
  return (
    [row.countryCode, row.location].filter(Boolean).join(" / ") || "-"
  );
}

function checkedAtLabel(value?: number | null): string {
  return formatEpochMillis(value);
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入抽样检测结果"
    width="1080px"
    destroy-on-close
  >
    <div
      v-loading="loading"
      class="sample-check-panel"
      element-loading-text="检测中..."
    >
      <div class="sample-check-summary">
        <el-tag type="success">成功 {{ successCount }}</el-tag>
        <el-tag type="danger">失败 {{ failedCount }}</el-tag>
        <span>共 {{ rows.length }} 条</span>
      </div>

      <el-table :data="rows" border max-height="520">
        <el-table-column label="行号" prop="lineNo" width="80">
          <template #default="{ row }">第 {{ row.lineNo }} 行</template>
        </el-table-column>
        <el-table-column
          label="代理地址"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ proxyAddress(row) }}</template>
        </el-table-column>
        <el-table-column label="连接状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.passed)">
              {{ statusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="WhatsApp" prop="whatsappStatus" width="120">
          <template #default="{ row }">{{ row.whatsappStatus || "-" }}</template>
        </el-table-column>
        <el-table-column
          label="出口 IP"
          prop="outboundIp"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.outboundIp || "-" }}</template>
        </el-table-column>
        <el-table-column
          label="归属地"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ regionLabel(row) }}</template>
        </el-table-column>
        <el-table-column
          label="ISP"
          prop="isp"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.isp || "-" }}</template>
        </el-table-column>
        <el-table-column label="检测时间" prop="checkedAt" width="180">
          <template #default="{ row }">
            {{ checkedAtLabel(row.checkedAt) }}
          </template>
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
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.sample-check-panel {
  min-height: 220px;
}

.sample-check-summary {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
</style>
