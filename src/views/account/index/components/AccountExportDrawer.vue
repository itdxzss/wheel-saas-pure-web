<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TenantAccount } from "@/api/account";
import {
  cancelAccountExport,
  completeAccountExport,
  createAccountExport,
  downloadAccountExport,
  listAccountExports,
  type AccountExportJob
} from "@/api/account-export";
import { downloadBlobFile } from "@/utils/download";
import { apiErrorMessage } from "@/utils/api-error";
import {
  deliverAccountExport,
  selectedExportIds
} from "../account-credential-export";

const emit = defineEmits<{ (event: "changed"): void }>();
const visible = ref(false);
const busy = ref(false);
const loading = ref(false);
const jobs = ref<AccountExportJob[]>([]);
const ids = ref<number[]>([]);
const selectionError = ref("");
const requestId = ref("");

/** 每次打开冻结选择；历史记录入口传空数组，不扩大导出范围。 */
function open(selection: TenantAccount[]) {
  ids.value = [];
  selectionError.value = "";
  requestId.value = "";
  if (selection.length) {
    try {
      ids.value = selectedExportIds(selection);
    } catch (error) {
      selectionError.value = (error as Error).message;
    }
  }
  visible.value = true;
  void refresh();
}

async function refresh() {
  loading.value = true;
  try {
    jobs.value = await listAccountExports();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "导出记录加载失败"));
  } finally {
    loading.value = false;
  }
}

async function create() {
  if (busy.value || !ids.value.length) return;
  try {
    await ElMessageBox.confirm(
      `仅导出已勾选的 ${ids.value.length} 个账号，按导入格式分文件打包。完整接收 ZIP 后，将从控端移除这些账号；文件保留 24 小时可重下载。请确认已自行执行批量离线。`,
      "导出账号并移除",
      {
        type: "warning",
        confirmButtonText: "确认导出",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    // 保留请求编号，响应丢失后重试不会创建另一份导出。
    if (!requestId.value) requestId.value = uuid();
    const job = await createAccountExport(requestId.value, [...ids.value]);
    ids.value = [];
    await deliver(job);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "导出未完成，请在导出记录中重试"));
  } finally {
    busy.value = false;
    emit("changed");
    await refresh();
  }
}

/** getRandomValues 可用于 HTTP 测试环境；不依赖 secure-context-only randomUUID。 */
function uuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value =>
    value.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function deliver(job: AccountExportJob) {
  await deliverAccountExport(job, {
    download: downloadAccountExport,
    save: downloadBlobFile,
    complete: completeAccountExport
  });
  ElMessage.success(
    job.status === "READY"
      ? "文件已接收，所选账号已从控端移除"
      : "已重新下载导出文件"
  );
}

async function retry(job: AccountExportJob) {
  busy.value = true;
  try {
    await deliver(job);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "未完成交付，请重试下载"));
  } finally {
    busy.value = false;
    emit("changed");
    await refresh();
  }
}

async function cancel(job: AccountExportJob) {
  try {
    await ElMessageBox.confirm(
      "取消本次导出并恢复账号使用权限？账号不会自动上线。",
      "取消导出",
      { type: "warning" }
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    await cancelAccountExport(job.id);
    ElMessage.success("已取消导出，账号未移除");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "取消失败"));
  } finally {
    busy.value = false;
    emit("changed");
    await refresh();
  }
}

function downloadable(job: AccountExportJob) {
  return job.status !== "CANCELLED" && job.expiresAt > Date.now();
}

function label(job: AccountExportJob) {
  if (job.status === "CANCELLED") return "已取消";
  if (job.status === "COMPLETED") return "已导出并移除";
  return "待下载并移除";
}

defineExpose({ open });
</script>

<template>
  <el-drawer
    v-model="visible"
    title="账号导出"
    size="760px"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
  >
    <el-alert
      title="先由业务人员批量离线，再导出。导出按钮只校验离线，不执行下线。"
      type="info"
      :closable="false"
      show-icon
    />
    <el-alert
      v-if="selectionError"
      :title="selectionError"
      type="warning"
      :closable="false"
      class="export-gap"
    />
    <div class="export-actions">
      <el-button
        v-if="ids.length"
        type="primary"
        :loading="busy"
        @click="create"
        >导出所选 {{ ids.length }} 个账号并移除</el-button
      >
      <el-button :disabled="busy" :loading="loading" @click="refresh"
        >刷新导出记录</el-button
      >
    </div>
    <p>
      保留原始导入内容；混合格式分别放入
      ZIP。表头全选仅选择当前页。下载中断可在下方重试。
    </p>
    <el-table v-loading="loading" :data="jobs" row-key="id" border>
      <el-table-column label="创建时间" min-width="165"
        ><template #default="{ row }">{{
          new Date(row.createdAt).toLocaleString()
        }}</template></el-table-column
      >
      <el-table-column prop="accountCount" label="账号数" width="80" />
      <el-table-column label="状态" min-width="140"
        ><template #default="{ row }">{{
          label(row)
        }}</template></el-table-column
      >
      <el-table-column label="操作" min-width="175"
        ><template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="busy || !downloadable(row)"
            @click="retry(row)"
            >{{ row.status === "READY" ? "下载并移除" : "重新下载" }}</el-button
          >
          <el-button
            v-if="row.status === 'READY'"
            link
            type="danger"
            :disabled="busy"
            @click="cancel(row)"
            >取消</el-button
          >
        </template></el-table-column
      >
    </el-table>
  </el-drawer>
</template>

<style scoped>
.export-actions {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.export-gap {
  margin-top: 12px;
}
</style>
