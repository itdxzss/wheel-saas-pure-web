<script setup lang="ts">
import {
  genFileId,
  type UploadRawFile,
  type UploadUserFile
} from "element-plus";
import type {
  IpAllocationMode,
  ProxyTypeLabel
} from "@/api/resource-ip-mapping";
import type { IpImportForm } from "../composables/useResourceIpPage";

defineOptions({
  name: "IpImportDialog"
});

defineProps<{
  allocationModeOptions: Array<{ label: string; value: IpAllocationMode }>;
  importErrors: string[];
  importing: boolean;
  proxyTypeOptions: ProxyTypeLabel[];
}>();

const emit = defineEmits<{
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<IpImportForm>("form", { required: true });
const uploadFiles = defineModel<UploadUserFile[]>("uploadFiles", {
  required: true
});

/** el-upload 超出 1 个文件时用新文件替换旧文件,匹配“单个 TXT 批次”的导入语义。 */
function replaceUploadFile(file: File): void {
  const rawFile = file as UploadRawFile;
  rawFile.uid = genFileId();
  uploadFiles.value = [
    {
      name: rawFile.name,
      status: "ready",
      size: rawFile.size,
      raw: rawFile,
      uid: rawFile.uid
    }
  ];
}

/** 用户重复选择文件时保留最后一次选择,避免导入多个批次混在一起。 */
function handleUploadExceed(files: File[]): void {
  const [file] = files;
  if (!file) return;
  replaceUploadFile(file);
}

/** 表单校验和文件读取放在父级 composable,弹窗只负责发出提交意图。 */
function submit(): void {
  emit("submit");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="ip-import-dialog"
    title="TXT 批量导入"
    width="1080px"
    destroy-on-close
  >
    <div class="format-box">
      <strong>文件格式要求</strong>
      <p>
        每行一条记录，字段之间使用 <b>:</b>（英文冒号）分隔：
        代理地址:端口:用户名:密码
      </p>
      <code>proxy.example.com:443:oper:mysecretpass1</code>
      <code>proxy.example.com:443:oper:mysecretpass2</code>
      <p class="format-warn">
        仅支持上述英文冒号格式；不符合规范的行将作为格式错误不予导入，并在导入后逐行提示。分配方式
        / 来源 / 类型将作用于文件中全部记录。
      </p>
    </div>

    <el-form class="ip-import-form" :model="form" label-position="top">
      <div class="form-grid">
        <el-form-item label="分配方式" required>
          <el-radio-group v-model="form.allocationMode">
            <el-radio-button
              v-for="mode in allocationModeOptions"
              :key="mode.value"
              :label="mode.label"
              :value="mode.value"
            />
          </el-radio-group>
          <div class="allocation-mode-help">
            智能会导入后检测出口国家并落对应国家；混合会直接进入混合分组。
          </div>
        </el-form-item>
        <el-form-item label="代理类型" required>
          <el-radio-group v-model="form.proxyType">
            <el-radio-button
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-radio-group>
        </el-form-item>
      </div>
      <el-form-item label="来源" required>
        <el-input
          v-model="form.source"
          clearable
          placeholder="请输入来源，如：xx 运营商 / 代理商名称"
        />
      </el-form-item>
      <el-form-item label="TXT 文件" required>
        <el-upload
          v-model:file-list="uploadFiles"
          drag
          accept=".txt,text/plain"
          :auto-upload="false"
          :limit="1"
          :on-exceed="handleUploadExceed"
        >
          <div class="ip-upload-icon">↥</div>
          <div class="ip-upload-text">点击选择 TXT 文件</div>
          <template #tip>
            <div class="el-upload__tip">仅支持 .txt 格式，编码建议 UTF-8</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="importErrors.length > 0"
      class="ip-import-errors"
      type="warning"
      show-icon
      :closable="false"
      title="以下行未导入"
    >
      <ul class="ip-import-error-list">
        <li v-for="item in importErrors" :key="item">{{ item }}</li>
      </ul>
    </el-alert>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="importing" @click="submit">
        开始导入
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.format-box {
  display: grid;
  gap: 10px;
  padding: 16px;
  margin-bottom: 18px;
  background: #fff8ef;
  border: 1px solid #ffd7a8;
  border-radius: 8px;
}

.format-box strong {
  font-size: 15px;
  color: #c81e1e;
}

.format-box p {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.format-box code {
  display: block;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #b45309;
  background: var(--el-fill-color-blank);
  border-radius: 6px;
}

.format-box .format-warn {
  color: #f04438;
}

.ip-import-form :deep(.el-select),
.ip-import-form :deep(.el-upload),
.ip-import-form :deep(.el-upload-dragger) {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(220px, 0.55fr);
  gap: 18px;
}

.allocation-mode-help {
  margin-top: 8px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.ip-upload-icon {
  font-size: 30px;
  line-height: 1;
  color: var(--el-color-primary);
}

.ip-upload-text {
  margin-top: 8px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ip-import-errors {
  margin-top: 16px;
}

.ip-import-error-list {
  padding-left: 18px;
  margin: 8px 0 0;
}

@media (width <= 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
