<script setup lang="ts">
import { computed } from "vue";
import { ElMessage, type UploadFile } from "element-plus";
import type {
  GroupPullMarketingCreateDraft,
  TargetDataMetrics
} from "../create-draft";
import { resolveTargetFileSelection } from "../create-interactions";

defineOptions({ name: "GroupPullMarketingCreateBaseInfoSection" });

const props = defineProps<{
  metrics: TargetDataMetrics;
}>();

const draft = defineModel<GroupPullMarketingCreateDraft>({ required: true });

const metricItems = computed(() => [
  { key: "raw", label: "原始数量", value: props.metrics.raw },
  { key: "valid", label: "有效数量", value: props.metrics.valid },
  { key: "duplicate", label: "重复数量", value: props.metrics.duplicate },
  { key: "malformed", label: "格式错误", value: props.metrics.malformed },
  {
    key: "invalidPhone",
    label: "无效号码",
    value: props.metrics.invalidPhone
  },
  {
    key: "unregistered",
    label: "未注册",
    value: props.metrics.unregistered
  },
  { key: "used", label: "已成功使用", value: props.metrics.used },
  { key: "reserved", label: "其他任务预占", value: props.metrics.reserved },
  { key: "available", label: "当前可用", value: props.metrics.available }
]);

function metricLabel(value: number | null): string {
  return value == null ? "--" : new Intl.NumberFormat("en-US").format(value);
}

function selectTargetFile(file: UploadFile): void {
  const result = resolveTargetFileSelection(
    draft.value.targetFile,
    file.raw ?? null
  );
  draft.value.targetFile = result.file;
  if (result.warning) ElMessage.warning(result.warning);
}
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">1</el-tag>
        <div>
          <strong>基础信息</strong>
          <p>任务名称、备注、群组来源与目标数据包</p>
        </div>
      </div>
    </template>

    <div class="form-grid">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="draft.taskName"
          maxlength="64"
          show-word-limit
          placeholder="请输入任务名称"
        />
      </el-form-item>

      <el-form-item label="群组来源" required>
        <el-radio-group v-model="draft.groupSource">
          <el-radio-button value="HISTORICAL">历史老群</el-radio-button>
          <el-radio-button value="SELF_COLLECTED">自收群</el-radio-button>
          <el-radio-button value="MIXED">混合来源</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="任务备注" class="span-two">
        <el-input
          v-model="draft.remark"
          type="textarea"
          :rows="3"
          maxlength="512"
          show-word-limit
          placeholder="请输入任务备注"
        />
      </el-form-item>

      <el-form-item label="目标数据包" required>
        <el-select
          v-model="draft.targetPackageId"
          filterable
          clearable
          placeholder="暂无可选数据包"
        />
        <span class="field-hint">数据包接口接入后展示可用候选项</span>
      </el-form-item>

      <el-form-item label="上传 TXT">
        <div class="upload-row">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".txt"
            :on-change="selectTargetFile"
          >
            <el-button>选择文件</el-button>
          </el-upload>
          <span class="file-name">
            {{ draft.targetFile?.name || "未选择文件" }}
          </span>
        </div>
        <span class="field-hint">本阶段仅保留文件名，不上传或伪造解析结果</span>
      </el-form-item>
    </div>

    <div class="metric-grid">
      <div v-for="item in metricItems" :key="item.key" class="metric-card">
        <strong>{{ metricLabel(item.value) }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.create-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.section-header strong {
  font-size: 16px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.span-two {
  grid-column: 1 / -1;
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-input-number) {
  width: 100%;
}

.field-hint {
  display: block;
  width: 100%;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.upload-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-name {
  color: var(--el-text-color-regular);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.metric-card strong {
  font-size: 18px;
}

.metric-card span {
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .form-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .span-two {
    grid-column: auto;
  }
}
</style>
