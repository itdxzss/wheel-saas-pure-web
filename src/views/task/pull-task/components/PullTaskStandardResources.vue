<script setup lang="ts">
import type { UploadFile } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type {
  PullTaskStandardDraft,
  PullTaskStandardLinkLineStatus
} from "@/api/pull-task";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import Upload from "~icons/ep/upload";

defineOptions({
  name: "PullTaskStandardResources"
});

defineProps<{
  clearing: boolean;
  draft: PullTaskStandardDraft;
  pendingFiles: File[];
  planning: boolean;
}>();

const emit = defineEmits<{
  (event: "add-files", files: File[]): void;
  (event: "clear"): void;
  (event: "move-pending-file", fileName: string, offset: -1 | 1): void;
  (event: "plan"): void;
  (event: "remove-pending-file", fileName: string): void;
}>();

const linksText = defineModel<string>("linksText", { required: true });

function handleFileChange(uploadFile: UploadFile): void {
  if (uploadFile.raw) emit("add-files", [uploadFile.raw]);
}

function statusLabel(status: PullTaskStandardLinkLineStatus): string {
  return {
    VALID: "有效",
    INVALID_FORMAT: "格式错误",
    DUPLICATE: "重复",
    LINK_EXPIRED: "链接失效",
    PROBE_INCOMPLETE: "检测未完成",
    OCCUPIED: "已占用"
  }[status];
}

function statusType(
  status: PullTaskStandardLinkLineStatus
): "success" | "warning" | "danger" | "info" {
  if (status === "VALID") return "success";
  if (status === "PROBE_INCOMPLETE") return "warning";
  if (status === "DUPLICATE") return "info";
  return "danger";
}
</script>

<template>
  <el-card shadow="never" header="群链接与 TXT 料子">
    <el-alert
      title="每行一个群链接；可一次选择多个 TXT。匹配和执行顺序均由服务端随机冻结。"
      type="info"
      :closable="false"
      show-icon
      class="resource-tip"
    />

    <el-input
      v-model="linksText"
      type="textarea"
      :rows="7"
      placeholder="每行一个 chat.whatsapp.com 群链接"
    />

    <div class="resource-actions">
      <el-upload
        multiple
        accept=".txt,text/plain"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <el-button :icon="useRenderIcon(Upload)">选择 TXT</el-button>
      </el-upload>
      <el-button
        type="primary"
        :icon="useRenderIcon(Refresh)"
        :loading="planning"
        @click="emit('plan')"
      >
        预检并随机匹配
      </el-button>
      <el-button
        type="danger"
        plain
        :icon="useRenderIcon(Delete)"
        :loading="clearing"
        @click="emit('clear')"
      >
        清除全部
      </el-button>
    </div>

    <div v-if="pendingFiles.length" class="pending-files">
      <span class="pending-label">待匹配 TXT：</span>
      <div
        v-for="(file, index) in pendingFiles"
        :key="file.name"
        class="pending-file"
      >
        <el-tag
          closable
          type="warning"
          @close="emit('remove-pending-file', file.name)"
        >
          {{ index + 1 }}. {{ file.name }}
        </el-tag>
        <el-button
          link
          type="primary"
          :disabled="index === 0"
          @click="emit('move-pending-file', file.name, -1)"
        >
          上移
        </el-button>
        <el-button
          link
          type="primary"
          :disabled="index === pendingFiles.length - 1"
          @click="emit('move-pending-file', file.name, 1)"
        >
          下移
        </el-button>
      </div>
    </div>

    <el-descriptions :column="3" border size="small" class="draft-stats">
      <el-descriptions-item label="已冻结">
        {{ draft.matchedCount }} 组
      </el-descriptions-item>
      <el-descriptions-item label="待配链接">
        {{ draft.remainingLinkCount }} 条
      </el-descriptions-item>
      <el-descriptions-item label="本次未配 TXT">
        {{ draft.ignoredFileCount }} 个
      </el-descriptions-item>
    </el-descriptions>

    <el-table
      v-if="draft.linkLines.length"
      :data="draft.linkLines"
      max-height="210"
      size="small"
      class="result-table"
    >
      <el-table-column prop="lineNo" label="链接行" width="72" />
      <el-table-column label="状态" width="104">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="raw" label="原始内容" show-overflow-tooltip />
      <el-table-column prop="reason" label="说明" show-overflow-tooltip />
    </el-table>

    <el-table
      v-if="draft.fileResults.length"
      :data="draft.fileResults"
      max-height="210"
      size="small"
      class="result-table"
    >
      <el-table-column prop="fileName" label="TXT" show-overflow-tooltip />
      <el-table-column label="解析" width="86">
        <template #default="{ row }">
          <el-tag :type="row.accepted ? 'success' : 'danger'" size="small">
            {{ row.accepted ? "有效" : "拒绝" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="validMemberCount" label="有效" width="64" />
      <el-table-column prop="invalidLineCount" label="非法" width="64" />
      <el-table-column prop="duplicateLineCount" label="重复" width="64" />
      <el-table-column label="说明" show-overflow-tooltip>
        <template #default="{ row }">
          {{
            row.rejectReason ||
            row.lineErrors
              .map(error => `第 ${error.lineNo} 行：${error.reason}`)
              .join("；") ||
            "--"
          }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.resource-tip,
.resource-actions,
.pending-files,
.draft-stats,
.result-table {
  margin-top: 14px;
}

.resource-tip {
  margin-top: 0;
  margin-bottom: 14px;
}

.resource-actions,
.pending-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.pending-label {
  color: var(--el-text-color-secondary);
}

.pending-file {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
</style>
