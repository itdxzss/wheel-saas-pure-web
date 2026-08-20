<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { UploadFile } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type {
  PullTaskCreationMode,
  PullTaskStandardDraft,
  PullTaskStandardLinkLineStatus
} from "@/api/pull-task";
import Delete from "~icons/ep/delete";
import Upload from "~icons/ep/upload";

const MAX_MATERIAL_FILE_COUNT = 50;
const MAX_MATERIAL_FILE_BYTES = 2 * 1024 * 1024;

defineOptions({
  name: "PullTaskStandardResources"
});

const props = defineProps<{
  clearing: boolean;
  creationMode: PullTaskCreationMode;
  draft: PullTaskStandardDraft;
  pendingFiles: File[];
  planning: boolean;
  resourceError: string;
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
const uploadValidationMessage = ref("");
let automaticPlanQueued = false;
const pastedLineCount = computed(
  () => linksText.value.split(/\r?\n/).filter(line => line.trim()).length
);
const visibleResourceError = computed(
  () => uploadValidationMessage.value || props.resourceError
);

function scheduleAutomaticPlan(): void {
  if (automaticPlanQueued) return;
  automaticPlanQueued = true;
  void nextTick(() => {
    automaticPlanQueued = false;
    if (props.creationMode === "NEW_GROUP" || linksText.value.trim()) {
      emit("plan");
    }
  });
}

function handleFileChange(uploadFile: UploadFile): void {
  const file = uploadFile.raw;
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".txt")) {
    uploadValidationMessage.value = `${file.name} 不是 TXT 文件，请重新选择`;
    return;
  }
  if (file.size > MAX_MATERIAL_FILE_BYTES) {
    uploadValidationMessage.value = `${file.name} 超过 2MB，请拆分后重新上传`;
    return;
  }
  if (props.pendingFiles.length >= MAX_MATERIAL_FILE_COUNT) {
    uploadValidationMessage.value = `单次最多上传 ${MAX_MATERIAL_FILE_COUNT} 个 TXT 文件`;
    return;
  }
  const knownNames = new Set([
    ...props.pendingFiles.map(item => item.name),
    ...props.draft.rows.map(row => row.sourceFileName)
  ]);
  if (knownNames.has(file.name)) {
    uploadValidationMessage.value = `${file.name} 已添加，请勿重复上传同名文件`;
    return;
  }
  uploadValidationMessage.value = "";
  emit("add-files", [file]);
  scheduleAutomaticPlan();
}

function handlePasteSave(): void {
  pasteVisible.value = false;
  scheduleAutomaticPlan();
}

function handleClear(): void {
  uploadValidationMessage.value = "";
  emit("clear");
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
    element-loading-text="正在校验并生成执行计划"
  >
    <el-card
      v-if="creationMode === 'PASTED_LINK'"
      shadow="never"
      header="群链接模式配置"
    >
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

    <el-card v-else shadow="never" header="新群模式配置">
      <el-alert
        title="每一份解析通过的 TXT 料子文件创建一个新群；不需要粘贴群链接。"
        type="info"
        :closable="false"
        show-icon
        class="resource-tip"
        data-testid="pull-task-new-group-file-rule"
      />
      <el-descriptions :column="2" border size="small" class="draft-stats">
        <el-descriptions-item label="待建群执行行">
          {{ draft.matchedCount }} 个
        </el-descriptions-item>
        <el-descriptions-item label="未采用 TXT">
          {{ draft.ignoredFileCount }} 个
        </el-descriptions-item>
      </el-descriptions>
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
            @click="handleClear"
          >
            清除全部
          </el-button>
        </div>
      </template>

      <el-alert
        :title="
          creationMode === 'NEW_GROUP'
            ? '可一次选择多个 TXT；每个有效文件对应一个新群，A/a 标识会随料子解析。'
            : '可一次选择多个 TXT；A/a 标识会随料子解析。群与 TXT 的匹配及执行顺序由服务端自动生成。'
        "
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

      <el-alert
        v-if="visibleResourceError"
        :title="visibleResourceError"
        type="error"
        :closable="false"
        show-icon
        class="resource-error"
        data-testid="pull-task-upload-error"
      />

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

    <el-dialog
      v-if="creationMode === 'PASTED_LINK'"
      v-model="pasteVisible"
      title="自定义粘贴链接"
      width="680px"
    >
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
.resource-error,
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
