<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { UploadFile } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type {
  PullTaskStandardDraft,
  PullTaskStandardLinkLineStatus
} from "@/api/pull-task";
import Delete from "~icons/ep/delete";
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
const pasteVisible = ref(false);
let automaticPlanQueued = false;
const pastedLineCount = computed(
  () => linksText.value.split(/\r?\n/).filter(line => line.trim()).length
);

function scheduleAutomaticPlan(): void {
  if (automaticPlanQueued) return;
  automaticPlanQueued = true;
  void nextTick(() => {
    automaticPlanQueued = false;
    if (linksText.value.trim()) emit("plan");
  });
}

function handleFileChange(uploadFile: UploadFile): void {
  if (!uploadFile.raw) return;
  emit("add-files", [uploadFile.raw]);
  scheduleAutomaticPlan();
}

function handlePasteSave(): void {
  pasteVisible.value = false;
  scheduleAutomaticPlan();
}

function statusLabel(status: PullTaskStandardLinkLineStatus): string {
  return {
    VALID: "格式通过",
    INVALID_FORMAT: "格式错误",
    DUPLICATE: "重复",
    OCCUPIED: "已占用"
  }[status];
}

function statusType(
  status: PullTaskStandardLinkLineStatus
): "success" | "warning" | "danger" | "info" {
  if (status === "VALID") return "success";
  if (status === "DUPLICATE") return "info";
  return "danger";
}
</script>

<template>
  <div
    v-loading="planning"
    class="resource-sections"
    element-loading-text="正在解析并生成执行计划"
  >
    <el-card shadow="never" header="群链接模式配置">
      <el-alert
        title="群组分组和手工群链接任选其一；同时填写时合并使用。手工链接每行一个，实际可用性由管理员进群时确认。"
        type="info"
        :closable="false"
        show-icon
        class="resource-tip"
      />

      <div class="link-entry">
        <el-button type="primary" plain @click="pasteVisible = true">
          自定义粘贴链接
        </el-button>
        <el-tag :type="pastedLineCount ? 'success' : 'info'" effect="plain">
          {{
            pastedLineCount
              ? `当前已粘贴 ${pastedLineCount} 行链接`
              : "尚未粘贴链接"
          }}
        </el-tag>
      </div>

      <el-descriptions :column="3" border size="small" class="draft-stats">
        <el-descriptions-item label="已匹配">
          {{ draft.matchedCount }} 组
        </el-descriptions-item>
        <el-descriptions-item label="剩余链接">
          {{ draft.remainingLinkCount }} 条
        </el-descriptions-item>
        <el-descriptions-item label="剩余 TXT">
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
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <strong>料子资源（可批量）</strong>
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
      </template>

      <el-alert
        title="可一次选择多个 TXT；A/a 标识会随料子解析。群与 TXT 的匹配及执行顺序由服务端自动生成。"
        type="info"
        :closable="false"
        show-icon
        class="resource-tip"
      />

      <el-upload
        drag
        multiple
        accept=".txt,text/plain"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        class="txt-upload"
      >
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="el-upload__text">拖拽或点击上传 .txt 文件</div>
      </el-upload>

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

    <el-dialog v-model="pasteVisible" title="自定义粘贴链接" width="680px">
      <el-input
        v-model="linksText"
        type="textarea"
        :rows="12"
        placeholder="请输入群链接，一行一个"
      />
      <template #footer>
        <el-button @click="pasteVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasteSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.resource-sections {
  display: grid;
  gap: 16px;
}

.card-header,
.link-entry,
.pending-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.card-header {
  justify-content: space-between;
}

.resource-tip {
  margin-bottom: 14px;
}

.draft-stats,
.result-table,
.txt-upload,
.pending-files {
  margin-top: 14px;
}

.txt-upload :deep(.el-upload),
.txt-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-icon {
  margin-bottom: 8px;
  font-size: 30px;
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
