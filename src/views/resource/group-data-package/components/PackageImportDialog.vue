<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type UploadFile,
  type UploadInstance
} from "element-plus";
import type {
  GroupDataPackage,
  GroupDataPackageImportInput,
  GroupDataPackageImportMode
} from "@/api/group-data-package";
import { downloadBlobFile } from "@/utils/download";
import {
  GROUP_PACKAGE_SAMPLE,
  inspectGroupPackageFile,
  type GroupPackageInspection
} from "../domain/import-inspection";

defineOptions({ name: "GroupPackageImportDialog" });
const props = defineProps<{
  target: GroupDataPackage | null;
  saving: boolean;
  serverError: string;
}>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  (event: "submit", value: GroupDataPackageImportInput): void;
}>();
const upload = ref<UploadInstance>();
const file = ref<File | null>(null);
const inspection = ref<GroupPackageInspection | null>(null);
const mode = ref<GroupDataPackageImportMode>("append");
const privacyPreset = ref<number | "custom">(60);
const customDays = ref(60);
const inspecting = ref(false);
const confirming = ref(false);
const inspectionError = ref("");
let inspectionVersion = 0;
const canSubmit = computed(
  () =>
    !!file.value &&
    !!inspection.value?.validRows &&
    !inspection.value?.exceedsLimit &&
    !inspecting.value &&
    !confirming.value
);
const days = computed(() =>
  privacyPreset.value === "custom" ? customDays.value : privacyPreset.value
);

watch(visible, value => {
  inspectionVersion++;
  if (!value) return;
  mode.value = "append";
  file.value = null;
  inspection.value = null;
  inspecting.value = false;
  inspectionError.value = "";
  privacyPreset.value = 60;
  upload.value?.clearFiles();
});

function downloadSample(): void {
  downloadBlobFile(
    "拉群数据包_导入样例.txt",
    new Blob([GROUP_PACKAGE_SAMPLE], { type: "text/plain;charset=utf-8" })
  );
}

async function selectFile(value: UploadFile): Promise<void> {
  const candidate = value.raw;
  if (!candidate) return;
  const version = ++inspectionVersion;
  upload.value?.clearFiles();
  file.value = candidate;
  inspection.value = null;
  inspectionError.value = "";
  inspecting.value = true;
  try {
    const result = await inspectGroupPackageFile(candidate);
    if (version === inspectionVersion) inspection.value = result;
  } catch (error) {
    if (version !== inspectionVersion) return;
    inspectionError.value =
      error instanceof TypeError
        ? "文件不是有效 UTF-8 编码，请转换后导入"
        : error instanceof Error
          ? error.message
          : "文件读取失败";
    file.value = null;
  } finally {
    if (version === inspectionVersion) inspecting.value = false;
  }
}

async function submit(): Promise<void> {
  if (!canSubmit.value || !file.value || props.saving) return;
  if (!Number.isInteger(days.value) || days.value < 0 || days.value > 365) {
    ElMessage.warning("隐私过滤天数须为 0–365 的整数");
    return;
  }
  try {
    confirming.value = true;
    await ElMessageBox.confirm(
      `向「${props.target?.name}」${mode.value === "overwrite" ? "覆盖现有号码，导入" : "增量导入"} ${inspection.value.validRows.toLocaleString()} 个文件内去重号码。${mode.value === "overwrite" ? "有正在使用此包的任务时不能覆盖。" : "包内已有号码会再次去重。"}最终新增与隐私过滤数量以导入结果为准。`,
      "导入确认",
      {
        confirmButtonText: "确认导入",
        cancelButtonText: "取消",
        type: mode.value === "overwrite" ? "warning" : "info"
      }
    );
    emit("submit", {
      file: file.value,
      mode: mode.value,
      privacyFilterDays: days.value
    });
  } catch (error) {
    if (error !== "cancel" && error !== "close")
      ElMessage.error("无法确认导入，请重试");
  } finally {
    confirming.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入手机号"
    width="760px"
    :close-on-click-modal="!saving"
    :show-close="!saving"
    :close-on-press-escape="!saving"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="UTF-8 TXT，每行一个手机号；可在行尾加 A/a 标记管理员。保留首次顺序，同号任一行有 A/a 则保留管理员标记。"
    />
    <p class="import-guide">
      支持 7–15 位手机号和 +、空格、括号、短横线。单次最多 100,000
      个有效去重号码，文件不超过 10 MB。
      <el-button link type="primary" @click="downloadSample"
        >下载导入样例</el-button
      >
    </p>
    <el-form label-position="top">
      <el-form-item label="导入模式" required>
        <el-radio-group v-model="mode" :disabled="saving">
          <el-radio value="append">增量导入（保留已有号码，自动去重）</el-radio>
          <el-radio value="overwrite">覆盖导入（替换当前号码）</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="过滤近期因隐私设置拒绝拉群的号码">
        <el-radio-group v-model="privacyPreset" :disabled="saving">
          <el-radio :value="0">不过滤</el-radio
          ><el-radio :value="60">60 天</el-radio
          ><el-radio value="custom">自定义</el-radio>
        </el-radio-group>
        <el-input-number
          v-if="privacyPreset === 'custom'"
          v-model="customDays"
          :min="1"
          :max="365"
          :precision="0"
          :disabled="saving"
        />
        <p class="form-hint">
          按已记录的隐私拒绝结果过滤；不会把格式校验当成号码已注册验证。
        </p>
      </el-form-item>
      <el-form-item label="TXT 文件" required>
        <el-upload
          ref="upload"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".txt,text/plain"
          :disabled="saving || inspecting"
          :on-change="selectFile"
          class="file-upload"
        >
          <p>
            {{
              inspecting
                ? "正在预检文件…"
                : file?.name || "拖拽或点击选择 TXT 文件"
            }}
          </p>
          <span class="form-hint">可以重新选择文件</span>
        </el-upload>
      </el-form-item>
    </el-form>
    <el-alert
      v-if="inspectionError"
      :title="inspectionError"
      type="error"
      :closable="false"
    />
    <el-alert
      v-if="serverError"
      :title="serverError"
      type="error"
      :closable="false"
      show-icon
    />
    <template v-if="inspection">
      <el-descriptions border :column="3" size="small">
        <el-descriptions-item label="原始行">{{
          inspection.totalRows.toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="有效去重号码">{{
          inspection.validRows.toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="重复行">{{
          inspection.duplicatedRows.toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="格式错误">{{
          inspection.invalidRows.toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="管理员标记">{{
          inspection.adminCount.toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="忽略空行">{{
          inspection.blankRows.toLocaleString()
        }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="inspection.exceedsLimit"
        title="有效去重号码超过 100,000，请拆分后重新导入"
        type="error"
        :closable="false"
      />
      <el-table :data="inspection.preview" size="small" max-height="180">
        <el-table-column prop="sourceLineNo" label="原始行" width="80" />
        <el-table-column prop="phone" label="号码预览（前 5 条）" />
        <el-table-column label="管理员" width="80"
          ><template #default="{ row }">{{
            row.adminRequired ? "A" : "—"
          }}</template></el-table-column
        >
      </el-table>
      <p v-if="inspection.errors.length" class="form-hint">
        错误行示例：{{
          inspection.errors.map(item => item.lineNo).join("、")
        }}。无效行会跳过，正式数量以导入结果为准。
      </p>
    </template>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canSubmit"
        :loading="saving"
        @click="submit"
        >确认导入</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.import-guide {
  margin: 12px 0 20px;
  line-height: 1.8;
}

.form-hint {
  width: 100%;
  margin: 6px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-upload {
  width: 100%;
}
</style>
