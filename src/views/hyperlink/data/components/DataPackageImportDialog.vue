<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, type UploadFile, type UploadInstance } from "element-plus";
import type {
  DataPackageImportInput,
  DataPackageImportMode,
  DataPackageImportResult,
  DataPackageListItem
} from "@/api/hyperlink-data-package";
import {
  dataPackageImportModeLabel,
  inspectDataPackageTxt,
  type DataPackageTxtInspection
} from "../composables/useDataPackageImport";
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
  emit("submit", { mode: mode.value, file: file.value });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`导入号码 · ${dataPackage?.name ?? '-'}`"
    width="680px"
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
      <el-form label-position="top">
        <el-form-item label="导入模式" required>
          <el-radio-group v-model="mode">
            <el-radio-button label="APPEND">追加导入</el-radio-button>
            <el-radio-button label="OVERWRITE">覆盖导入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-alert
          v-if="mode === 'APPEND'"
          type="info"
          show-icon
          :closable="false"
          title="追加导入会保留当前号码，包内已有号码会作为重复项跳过。"
        />
        <el-alert
          v-else
          type="warning"
          show-icon
          :closable="false"
          title="覆盖导入成功后会切换到全新代次，当前号码将不再出现在号码明细中。"
        />

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
                UTF-8 编码，每行一个 6～20 位纯数字号码；空行不计，单次最多 5000
                个非空行。
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-descriptions v-if="inspection" :column="1" border>
          <el-descriptions-item label="文件名">
            {{ inspection.filename }}
          </el-descriptions-item>
          <el-descriptions-item label="非空行数">
            {{ inspection.nonEmptyRowCount }}
          </el-descriptions-item>
        </el-descriptions>
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
        :disabled="!inspection"
        @click="submit"
      >
        确认{{ dataPackageImportModeLabel(mode) }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-item,
.count-tip {
  margin-top: 18px;
}

.upload-item :deep(.el-upload),
.upload-item :deep(.el-upload-dragger),
.import-result {
  width: 100%;
}
</style>
