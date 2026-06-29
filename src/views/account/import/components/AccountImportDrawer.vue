<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, type UploadFile, type UploadInstance } from "element-plus";
import type {
  AccountGroupApiRow,
  AccountGroupWriteRequest
} from "@/api/account-group";
import {
  AUTO_IP_MODE,
  accountTypeOptions,
  deviceOptions,
  importKindLabelMap,
  importKindOptions
} from "../constants";
import type { AccountImportKind, AccountImportSubmitPayload } from "../types";
import { apiErrorMessage } from "@/utils/api-error";
import UploadFilled from "~icons/ep/upload-filled";

defineOptions({
  name: "AccountImportDrawer"
});

const props = defineProps<{
  groups: AccountGroupApiRow[];
  groupLoading: boolean;
  ipRegions: string[];
  modelValue: boolean;
  submitting: boolean;
  createGroup: (
    data: AccountGroupWriteRequest
  ) => Promise<AccountGroupApiRow | null>;
}>();

const emit = defineEmits<{
  (event: "submit", payload: AccountImportSubmitPayload): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const uploadRef = ref<UploadInstance>();
const groupDrawerVisible = ref(false);
const groupSubmitting = ref(false);
const form = reactive({
  importKind: "six" as AccountImportKind,
  groupId: "" as "" | number,
  device: "安卓",
  accountType: "个人",
  ipMode: AUTO_IP_MODE,
  remark: "",
  text: "",
  filename: "",
  file: null as File | null
});
const groupForm = reactive({
  name: "",
  remark: ""
});

const currentKind = computed(() =>
  importKindOptions.find(item => item.value === form.importKind)
);

watch(
  () => props.modelValue,
  value => {
    if (value) resetForm();
  }
);

function resetForm(): void {
  form.importKind = "six";
  form.groupId = "";
  form.device = "安卓";
  form.accountType = "个人";
  form.ipMode = AUTO_IP_MODE;
  form.remark = "";
  form.text = "";
  form.filename = "";
  form.file = null;
  uploadRef.value?.clearFiles();
}

function switchImportKind(kind: AccountImportKind): void {
  form.importKind = kind;
  form.text = "";
  form.filename = "";
  form.file = null;
  uploadRef.value?.clearFiles();
}

function onKindChange(value: string | number | boolean): void {
  switchImportKind(value as AccountImportKind);
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(String(event.target?.result ?? ""));
    reader.onerror = () => reject(new Error("读取上传文件失败"));
    reader.readAsText(file, "UTF-8");
  });
}

function validFileExt(file: File): boolean {
  const accept = currentKind.value?.accept ?? ".txt";
  return file.name.toLowerCase().endsWith(accept);
}

async function handleUploadChange(uploadFile: UploadFile): Promise<void> {
  const raw = uploadFile.raw;
  if (!raw) return;
  const file = raw as File;
  if (!validFileExt(file)) {
    ElMessage.warning(
      `不支持的文件格式：${file.name}，仅支持 ${currentKind.value?.accept}`
    );
    form.filename = "";
    form.file = null;
    uploadRef.value?.clearFiles();
    return;
  }
  if (file.size === 0) {
    ElMessage.warning("文件内容为空，无法导入");
    form.filename = "";
    form.file = null;
    uploadRef.value?.clearFiles();
    return;
  }
  form.filename = file.name;
  form.file = file;
  if (form.importKind !== "json") {
    try {
      form.text = await readTextFile(file);
      if (!form.text.trim()) ElMessage.warning("文件内容为空，无法导入");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "读取上传文件失败"));
    }
  }
}

function openGroupDrawer(): void {
  groupForm.name = "";
  groupForm.remark = "";
  groupDrawerVisible.value = true;
}

async function confirmCreateGroup(): Promise<void> {
  const name = groupForm.name.trim();
  if (!name) {
    ElMessage.warning("请输入分组名称");
    return;
  }
  groupSubmitting.value = true;
  try {
    const created = await props.createGroup({
      name,
      remark: groupForm.remark.trim() || null
    });
    if (created) {
      form.groupId = created.id;
      groupDrawerVisible.value = false;
    }
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "新增分组失败"));
  } finally {
    groupSubmitting.value = false;
  }
}

function submitDrawer(): void {
  if (!form.groupId) {
    ElMessage.warning("请选择账号分组");
    return;
  }
  if (form.importKind === "json") {
    if (!form.file) {
      ElMessage.warning("请上传 JSON号 ZIP 包");
      return;
    }
  } else if (!form.text.trim()) {
    ElMessage.warning(
      form.filename ? "文件内容为空，无法导入" : "请粘贴内容或上传文件"
    );
    return;
  }
  emit("submit", {
    importKind: form.importKind,
    filename: form.filename || null,
    groupId: Number(form.groupId),
    device: form.device,
    accountType: form.accountType,
    ipMode: form.ipMode,
    remark: form.remark.trim() || null,
    text: form.importKind === "json" ? null : form.text,
    file: form.importKind === "json" ? form.file : null
  });
}
</script>

<template>
  <el-drawer v-model="visible" title="导入协议号" size="780px" destroy-on-close>
    <div class="account-import-drawer">
      <el-alert
        class="mb-4"
        type="info"
        show-icon
        :closable="false"
        title="导入后会创建账号导入任务，账号上线和登录结果由后端协议链路回传。"
      />

      <el-form :model="form" label-position="top">
        <el-card shadow="never" class="mb-4">
          <template #header>
            <div class="drawer-card-header">
              <strong>基础信息</strong>
              <el-button link type="primary" @click="openGroupDrawer">
                新增分组
              </el-button>
            </div>
          </template>

          <div class="drawer-grid">
            <el-form-item label="账号分组" required>
              <el-select
                v-model="form.groupId"
                class="drawer-control"
                clearable
                filterable
                :loading="groupLoading"
                placeholder="请选择账号分组"
              >
                <el-option
                  v-for="group in groups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="机型" required>
              <el-radio-group v-model="form.device">
                <el-radio-button
                  v-for="device in deviceOptions"
                  :key="device"
                  :label="device"
                />
              </el-radio-group>
            </el-form-item>

            <el-form-item label="账号类型" required>
              <el-select v-model="form.accountType" class="drawer-control">
                <el-option
                  v-for="item in accountTypeOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="管理客服（二期）">
              <el-input
                disabled
                class="drawer-control"
                placeholder="二期接入客服字典后启用"
              />
            </el-form-item>

            <el-form-item label="选择IP">
              <el-select
                v-model="form.ipMode"
                class="drawer-control"
                filterable
              >
                <el-option
                  v-for="region in ipRegions"
                  :key="region"
                  :label="region"
                  :value="region"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="备注">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              maxlength="512"
              show-word-limit
              placeholder="填写本次导入用途、规则或说明"
            />
          </el-form-item>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <strong>导入内容</strong>
          </template>

          <el-radio-group
            :model-value="form.importKind"
            class="import-kind-group"
            @change="onKindChange"
          >
            <el-radio-button
              v-for="item in importKindOptions"
              :key="item.value"
              :disabled="item.disabled"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>

          <el-alert
            class="mt-3"
            type="success"
            :closable="false"
            :title="currentKind?.desc"
          />

          <el-upload
            ref="uploadRef"
            class="mt-4"
            drag
            :accept="currentKind?.accept"
            :auto-upload="false"
            :limit="1"
            :on-change="handleUploadChange"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                当前类型：{{ importKindLabelMap[form.importKind] }}，支持
                {{ currentKind?.accept }}。
              </div>
            </template>
          </el-upload>

          <el-form-item
            v-if="form.importKind !== 'json'"
            class="mt-4"
            :label="form.importKind === 'six' ? '六段号内容' : '全参账号内容'"
            required
          >
            <el-input
              v-model="form.text"
              type="textarea"
              :rows="8"
              placeholder="请粘贴内容，或上传 TXT 后自动回填"
            />
          </el-form-item>
        </el-card>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitDrawer">
        确认导入
      </el-button>
    </template>
  </el-drawer>

  <el-drawer
    v-model="groupDrawerVisible"
    title="新增分组"
    size="520px"
    destroy-on-close
  >
    <el-form :model="groupForm" label-position="top">
      <el-form-item label="分组名称" required>
        <el-input
          v-model="groupForm.name"
          maxlength="128"
          show-word-limit
          placeholder="例如：巴铁推手-A / 印度进群-A"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="groupForm.remark"
          type="textarea"
          :rows="5"
          maxlength="255"
          show-word-limit
          placeholder="填写分组用途、规则或说明"
        />
      </el-form-item>
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="新增分组会保存到账户分组接口，创建成功后自动回显到账号分组选择框。"
      />
    </el-form>
    <template #footer>
      <el-button @click="groupDrawerVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="groupSubmitting"
        @click="confirmCreateGroup"
      >
        确认新增分组
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.account-import-drawer {
  padding-right: 4px;
}

.drawer-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.drawer-control {
  width: 100%;
}

.import-kind-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .drawer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
