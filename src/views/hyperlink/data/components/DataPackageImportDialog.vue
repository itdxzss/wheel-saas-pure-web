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
    !inspection.value?.forbiddenCountries.length
);

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
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
  inspecting.value = true;
  try {
    inspection.value = await inspectDataPackageTxt(raw);
    file.value = raw;
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
            :limit="1"
            :on-change="handleUploadChange"
            :on-remove="removeFile"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将 TXT 文件拖到此处，或 <em>点击选择</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .txt 格式，必须使用 UTF-8 编码；单次最多
                {{ formattedMaxRows }} 个非空行。
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-descriptions v-if="inspection" :column="2" border>
          <el-descriptions-item label="文件名" :span="2">
            {{ inspection.filename }}
          </el-descriptions-item>
          <el-descriptions-item label="非空行数">
            {{ formatCount(inspection.nonEmptyRowCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="有效号码">
            {{ formatCount(inspection.validPhoneCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="非法行">
            {{ formatCount(inspection.invalidRowCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件内重复">
            {{ formatCount(inspection.duplicatedRowCount) }}
          </el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-if="inspection?.forbiddenCountries.length"
          class="forbidden-alert"
          type="error"
          show-icon
          :closable="false"
          :title="`检测到禁止上传国家的号码：${forbiddenCountryMessage}`"
        />
        <el-alert
          class="count-tip"
          type="info"
          :closable="false"
          title="页面行数仅用于确认文件；成功、非法和重复数量以后端导入结果为准。"
        />
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
.count-tip,
.forbidden-alert {
  margin-top: 18px;
}

.upload-item :deep(.el-upload),
.upload-item :deep(.el-upload-dragger),
.import-result {
  width: 100%;
}

@media (width <= 720px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
