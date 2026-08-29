<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, type UploadFile, type UploadInstance } from "element-plus";
import type {
  DataPackageImportInput,
  DataPackageImportMode,
  DataPackageImportResult,
  DataPackageListItem
} from "@/api/hyperlink-data-package";
import { downloadBlobFile } from "@/utils/download";
import {
  DATA_PACKAGE_IMPORT_MAX_ROWS,
  DATA_PACKAGE_IMPORT_SAMPLE,
  dataPackageImportModeLabel,
  inspectDataPackageTxt,
  type DataPackageTxtInspection
} from "../composables/useDataPackageImport";
import DataPackageImportGuide from "./DataPackageImportGuide.vue";
import Close from "~icons/ep/close";
import Document from "~icons/ep/document";
import UploadFilled from "~icons/ep/upload-filled";

defineOptions({ name: "DataPackageImportDialog" });

const props = defineProps<{
  dataPackage: DataPackageListItem | null;
  defaultMode: DataPackageImportMode;
  modelValue: boolean;
  result: DataPackageImportResult | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "submit", value: DataPackageImportInput): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const uploadRef = ref<UploadInstance>();
const mode = ref<DataPackageImportMode>("APPEND");
const file = ref<File | null>(null);
const inspection = ref<DataPackageTxtInspection | null>(null);
const inspecting = ref(false);
const modeOptions: Array<{
  description: string;
  label: string;
  value: DataPackageImportMode;
}> = [
  {
    description: "保留原有号码，仅追加新号码（自动去重）",
    label: "增量导入",
    value: "APPEND"
  },
  {
    description: "清空原有号码，仅保留本次上传文件中的号码",
    label: "覆盖导入",
    value: "OVERWRITE"
  }
];
const formattedMaxRows = DATA_PACKAGE_IMPORT_MAX_ROWS.toLocaleString("en-US");
const forbiddenCountryMessage = computed(() =>
  (inspection.value?.forbiddenCountries ?? [])
    .map(country => `${country.label} ${formatCount(country.count)} 条`)
    .join("、")
);
const canSubmit = computed(
  () =>
    Boolean(file.value) &&
    Boolean(inspection.value?.validPhoneCount) &&
    !inspection.value?.exceedsMaxRows &&
    !inspection.value?.forbiddenCountries.length
);

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatFileSize(value: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function downloadTemplate(): void {
  downloadBlobFile(
    "data-package-phones-sample.txt",
    new Blob([DATA_PACKAGE_IMPORT_SAMPLE], {
      type: "text/plain;charset=utf-8"
    })
  );
}

async function handleUploadChange(uploadFile: UploadFile): Promise<void> {
  const raw = uploadFile.raw as File | undefined;
  if (!raw) return;
  uploadRef.value?.clearFiles();
  file.value = raw;
  inspection.value = null;
  inspecting.value = true;
  try {
    inspection.value = await inspectDataPackageTxt(raw);
  } catch (error) {
    file.value = null;
    inspection.value = null;
    uploadRef.value?.clearFiles();
    ElMessage.warning(
      error instanceof Error ? error.message : "TXT 文件读取失败"
    );
  } finally {
    inspecting.value = false;
  }
}

function removeFile(): void {
  file.value = null;
  inspection.value = null;
  uploadRef.value?.clearFiles();
}

function submit(): void {
  if (!file.value || !inspection.value) {
    ElMessage.warning("请选择符合规则的 TXT 文件");
    return;
  }
  if (!inspection.value.validPhoneCount) {
    ElMessage.warning("文件中未解析到有效手机号，请检查格式后重试");
    return;
  }
  if (inspection.value.exceedsMaxRows) {
    ElMessage.error(
      `本次解析 ${formatCount(inspection.value.nonEmptyRowCount)} 条，已超过单次最大 ${formattedMaxRows} 条限制，请拆分文件后再上传`
    );
    return;
  }
  if (inspection.value.forbiddenCountries.length) {
    ElMessage.error(
      `检测到禁止上传国家的号码（${forbiddenCountryMessage.value}），请移除后再上传`
    );
    return;
  }
  emit("submit", { mode: mode.value, file: file.value });
}

watch(
  () => props.modelValue,
  value => {
    if (!value) return;
    mode.value = props.defaultMode;
    file.value = null;
    inspection.value = null;
    uploadRef.value?.clearFiles();
  }
);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入手机号"
    width="760px"
    destroy-on-close
    :close-on-click-modal="!submitting"
  >
    <template v-if="result">
      <el-result icon="success" title="导入完成">
        <template #sub-title>
          {{ dataPackageImportModeLabel(result.mode) }}，当前代次
          {{ result.generation }}
        </template>
        <template #extra>
          <el-descriptions :column="2" border class="import-result">
            <el-descriptions-item label="导入批次">
              {{ result.importId }}
            </el-descriptions-item>
            <el-descriptions-item label="文件非空行">
              {{ result.totalRows }}
            </el-descriptions-item>
            <el-descriptions-item label="成功导入">
              {{ result.acceptedRows }}
            </el-descriptions-item>
            <el-descriptions-item label="非法号码">
              {{ result.invalidRows }}
            </el-descriptions-item>
            <el-descriptions-item label="重复号码">
              {{ result.duplicatedRows }}
            </el-descriptions-item>
            <el-descriptions-item label="导入后号码总数">
              {{ result.phoneCountAfterImport }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </el-result>
    </template>

    <template v-else>
      <DataPackageImportGuide
        :data-package="dataPackage"
        :formatted-max-rows="formattedMaxRows"
        @download-template="downloadTemplate"
      />

      <el-form label-position="top">
        <el-form-item label="导入模式" required>
          <el-radio-group v-model="mode" class="mode-grid">
            <el-radio
              v-for="option in modeOptions"
              :key="option.value"
              :value="option.value"
              border
              class="mode-card"
            >
              <span class="mode-card__copy">
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item class="upload-item" label="TXT 文件" required>
          <el-upload
            ref="uploadRef"
            drag
            accept=".txt,text/plain"
            :auto-upload="false"
            :class="{ 'has-file': file }"
            :show-file-list="false"
            :on-change="handleUploadChange"
          >
            <div v-if="file" class="selected-file">
              <span class="selected-file__icon">
                <el-icon><Document /></el-icon>
              </span>
              <span class="selected-file__copy">
                <strong :title="file.name">{{ file.name }}</strong>
                <span>
                  {{ formatFileSize(file.size) }} · 点击或拖拽重新选择
                </span>
              </span>
              <el-button
                class="selected-file__remove"
                text
                circle
                aria-label="移除文件"
                @click.stop="removeFile"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <template v-else>
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将 TXT 文件拖到此处，或 <em>点击选择</em>
              </div>
            </template>
            <template #tip>
              <div v-if="!file" class="el-upload__tip">
                仅支持 .txt 格式，必须使用 UTF-8 编码；单次最多
                {{ formattedMaxRows }} 个非空行。
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-alert
          v-if="inspection"
          class="inspection-alert"
          type="success"
          show-icon
          :closable="false"
          :title="`共解析到 ${formatCount(inspection.validPhoneCount)} 个有效手机号`"
        />
        <el-alert
          v-if="inspection?.exceedsMaxRows"
          class="inspection-alert"
          type="error"
          show-icon
          :closable="false"
          :title="`本次解析 ${formatCount(inspection.nonEmptyRowCount)} 条，已超过单次最大 ${formattedMaxRows} 条限制，请拆分文件后再上传`"
        />
        <el-alert
          v-if="inspection?.forbiddenCountries.length"
          class="inspection-alert"
          type="error"
          show-icon
          :closable="false"
          :title="`检测到禁止上传国家的号码：${forbiddenCountryMessage}`"
        />
        <el-alert
          v-if="inspection?.brazilRisk"
          class="brazil-risk-alert inspection-alert"
          type="warning"
          show-icon
          :closable="false"
        >
          <template #title>
            <strong>巴西号码风险提醒</strong>
          </template>
          <div class="brazil-risk-copy">
            <p>
              抽样检测到本次上传的号码<strong
                >疑似全部为巴西号码（55 开头）</strong
              >。巴西手机号存在<strong>「+9 / 去9」</strong>两种格式（如
              <code>5511987654321</code> 与
              <code>551187654321</code> 可能指向同一 WhatsApp 账号）。
            </p>
            <p>
              <strong>请务必确认：</strong
              >您上传的号码已经过第三方平台的筛选/映射处理，否则可能出现大量号码无法识别或重复发送，造成营销资源浪费。
            </p>
            <div class="brazil-risk-samples">
              <span>本次抽样：</span>
              <code
                v-for="phone in inspection.brazilRisk.samplePhones"
                :key="phone"
              >
                {{ phone }}
              </code>
            </div>
          </div>
        </el-alert>
      </el-form>
    </template>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">
        {{ result ? "关闭" : "取消" }}
      </el-button>
      <el-button
        v-if="!result"
        type="primary"
        :loading="submitting || inspecting"
        :disabled="!canSubmit"
        @click="submit"
      >
        <el-icon><UploadFilled /></el-icon>
        开始导入
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.mode-card {
  width: 100%;
  height: auto;
  min-height: 76px;
  padding: 13px 14px;
  margin: 0;
  white-space: normal;
  border-radius: 10px;
}

.mode-card :deep(.el-radio__input) {
  align-self: flex-start;
  margin-top: 2px;
}

.mode-card :deep(.el-radio__label) {
  flex: 1;
  min-width: 0;
}

.mode-card__copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--el-text-color-primary);
}

.mode-card__copy span {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.upload-item,
.inspection-alert {
  margin-top: 18px;
}

.upload-item :deep(.el-upload),
.upload-item :deep(.el-upload-dragger),
.import-result {
  width: 100%;
}

.upload-item .has-file :deep(.el-upload-dragger) {
  padding: 0;
  text-align: left;
  border-style: solid;
}

.selected-file {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 13px;
}

.selected-file__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
}

.selected-file__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.selected-file__copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.selected-file__copy span {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.selected-file__remove {
  flex-shrink: 0;
}

.brazil-risk-copy {
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
}

.brazil-risk-copy p {
  margin: 5px 0 0;
}

.brazil-risk-copy strong {
  color: var(--el-color-danger);
}

.brazil-risk-copy code,
.brazil-risk-samples code {
  padding: 1px 5px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-8);
  border-radius: 4px;
}

.brazil-risk-samples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
}

@media (width <= 720px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
