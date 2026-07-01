<script setup lang="ts">
import { computed } from "vue";
import { formatEpochMillis } from "@/utils/time";
import type { IpProxyCheckResult } from "@/api/resource-ip";
import type { IpManageRow } from "@/api/resource-ip-mapping";

defineOptions({
  name: "IpCheckResultDialog"
});

const props = withDefaults(
  defineProps<{
    activeRow?: IpManageRow | null;
    errorMessage?: string;
    loading?: boolean;
    results: IpProxyCheckResult[];
  }>(),
  {
    activeRow: null,
    errorMessage: "",
    loading: false
  }
);

const emit = defineEmits<{
  (event: "rerun"): void;
}>();

const visible = defineModel<boolean>({ required: true });

// activeRow 是单条检测的上下文;批量检测不传 activeRow,继续沿用结果表模式。
const singleMode = computed(() => props.activeRow !== null);
const singleResult = computed(() => props.results[0] ?? null);
const successCount = computed(
  () => props.results.filter(item => item.checkStatus === "success").length
);
const failedCount = computed(() => props.results.length - successCount.value);
const singleFailed = computed(
  () => !props.loading && singleResult.value?.checkStatus === "failed"
);
const singleSucceeded = computed(
  () => !props.loading && singleResult.value?.checkStatus === "success"
);

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

function coordinateLabel(row: Partial<IpProxyCheckResult>): string {
  if (row.detectedLatitude == null || row.detectedLongitude == null) return "-";
  return `${row.detectedLatitude}, ${row.detectedLongitude}`;
}

/** 优先展示检测国家码和后端最终 region;没有 region 时退回检测位置文本。 */
function regionLabel(row: Partial<IpProxyCheckResult>): string {
  return (
    [row.countryCode, row.region || row.location].filter(Boolean).join(" / ") ||
    "-"
  );
}

function singleConnectionStatus(): string {
  if (props.loading) return "正在检测代理连接";
  if (singleSucceeded.value) {
    return `${props.activeRow?.proxyType || "代理"} 代理已就绪`;
  }
  // 接口失败时优先展示后端/请求层错误,没有结果时使用原型里的超时文案兜底。
  return singleResult.value?.errorMessage || "代理连接失败 / 请求超时";
}

function singleWhatsappStatus(): string {
  if (props.loading) return "正在建立 WhatsApp 连通性";
  const status = singleResult.value?.whatsappStatus;
  if (singleSucceeded.value) {
    // 后端可能返回 "HTTP 400" 或其它状态文本,这里拼成原型要求的 WhatsApp 连通描述。
    return status
      ? `CONNECT 隧道建立，WhatsApp 响应 ${status}`
      : "CONNECT 隧道建立";
  }
  // failed/unknown 不直接展示给运营,转成可理解的 CONNECT 失败文案。
  return status && status !== "failed"
    ? status
    : "未建立 CONNECT 隧道，未获取 WhatsApp 响应";
}

function failReason(): string {
  // 请求超时/断网等没有后端检测结果时,errorMessage 比 singleResult 更准确。
  return (
    props.errorMessage ||
    singleResult.value?.errorMessage ||
    "代理服务无响应或当前代理不可达"
  );
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="singleMode ? '代理检测' : 'IP 检测结果'"
    :width="singleMode ? '720px' : '980px'"
    destroy-on-close
  >
    <template v-if="singleMode">
      <div
        v-loading="loading"
        class="single-check-panel"
        element-loading-text="检测中..."
      >
        <div class="single-check-head">
          <div>
            <strong>{{
              activeRow?.source ? `${activeRow.source}代理` : "代理检测"
            }}</strong>
            <span>{{ activeRow?.proxyAddress || "-" }}</span>
          </div>
          <el-tag size="small" type="info">{{
            activeRow?.proxyType || "HTTP"
          }}</el-tag>
        </div>

        <div v-if="loading" class="single-check-state is-checking">
          <span class="single-check-spinner" />
          <strong>正在检测</strong>
        </div>
        <div v-else-if="singleSucceeded" class="single-check-state is-success">
          <span>✓</span>
          <strong>代理可用</strong>
        </div>
        <div v-else class="single-check-state is-failed">
          <span>!</span>
          <strong>代理不可用</strong>
        </div>

        <div class="single-check-grid">
          <div class="single-check-label">连接状态</div>
          <div :class="['single-check-value', { danger: singleFailed }]">
            {{ singleConnectionStatus() }}
          </div>
          <div class="single-check-label">WhatsApp</div>
          <div
            :class="[
              'single-check-value',
              { success: singleSucceeded, danger: singleFailed }
            ]"
          >
            {{ singleWhatsappStatus() }}
          </div>
          <div class="single-check-label">出口 IP</div>
          <div class="single-check-value strong">
            {{ singleResult?.outboundIp || "-" }}
          </div>
          <div class="single-check-label">归属地</div>
          <div class="single-check-value">
            {{ singleResult ? regionLabel(singleResult) : "-" }}
          </div>
          <div class="single-check-label">运营商</div>
          <div class="single-check-value">
            {{ singleResult?.isp || "-" }}
          </div>
          <div class="single-check-label">经纬度</div>
          <div class="single-check-value">
            {{ singleResult ? coordinateLabel(singleResult) : "-" }}
          </div>
          <template v-if="singleFailed || errorMessage">
            <div class="single-check-label">异常原因</div>
            <div class="single-check-value danger">{{ failReason() }}</div>
            <div class="single-check-label">建议处理</div>
            <div class="single-check-value">
              重新检测；仍失败时更换代理或检查供应商服务状态
            </div>
          </template>
        </div>
        <div class="single-check-footer">
          <el-button @click="visible = false">关闭</el-button>
          <el-button type="primary" :loading="loading" @click="emit('rerun')">
            重新检测
          </el-button>
        </div>
      </div>
    </template>

    <template v-else>
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
        <el-table-column
          label="国家/地区"
          min-width="160"
          show-overflow-tooltip
        >
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
          <template #default="{ row }">{{
            row.whatsappStatus || "unknown"
          }}</template>
        </el-table-column>
        <el-table-column label="检测时间" prop="checkedAt" width="180">
          <template #default="{ row }">{{
            checkedAtLabel(row.checkedAt)
          }}</template>
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
    </template>
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

.single-check-panel {
  min-height: 320px;
}

.single-check-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.single-check-head strong,
.single-check-head span {
  display: block;
}

.single-check-head span {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.single-check-state {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 18px 0;
  font-size: 16px;
}

.single-check-state span {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
}

.single-check-state.is-success span {
  background: var(--el-color-success);
}

.single-check-state.is-failed span {
  background: var(--el-color-danger);
}

.single-check-state.is-checking span {
  border: 3px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  background: transparent;
  animation: ip-check-spin 0.9s linear infinite;
}

.single-check-grid {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px 16px;
  align-items: center;
}

.single-check-label {
  color: var(--el-text-color-secondary);
}

.single-check-value {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
}

.single-check-value.strong {
  font-weight: 600;
}

.single-check-value.success {
  color: var(--el-color-success);
}

.single-check-value.danger {
  color: var(--el-color-danger);
}

.single-check-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

@keyframes ip-check-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
