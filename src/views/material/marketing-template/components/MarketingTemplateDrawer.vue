<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile, UploadUserFile } from "element-plus";
import type {
  MarketingDrawerMode,
  MarketingTemplateForm
} from "../composables/useMarketingTemplatePage";
import MarketingButtonEditor from "./MarketingButtonEditor.vue";
import MarketingTemplatePreview from "./MarketingTemplatePreview.vue";

const visible = defineModel<boolean>({ required: true });
const form = defineModel<MarketingTemplateForm>("form", { required: true });

const props = defineProps<{
  mode: MarketingDrawerMode;
  loading: boolean;
  title: string;
}>();

const emit = defineEmits<{
  (event: "save"): void;
}>();

const imageFileList = ref<UploadUserFile[]>([]);
let currentObjectUrl = "";

const isPreview = () => props.mode === "preview";

function revokeCurrentObjectUrl() {
  if (!currentObjectUrl) return;
  URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = "";
}

function onImageChange(file: UploadFile) {
  form.value.imageName = file.name ?? "";
  if (!file.raw) return;
  if (file.raw.size > 500 * 1024) {
    ElMessage.warning("图片超过 500KB 限制，请压缩后再上传");
    imageFileList.value = [];
    clearImage();
    return;
  }

  revokeCurrentObjectUrl();
  currentObjectUrl = URL.createObjectURL(file.raw);
  form.value.imageUrl = currentObjectUrl;
}

function clearImage() {
  revokeCurrentObjectUrl();
  imageFileList.value = [];
  form.value.imageName = "";
  form.value.imageUrl = "";
}

onBeforeUnmount(() => {
  revokeCurrentObjectUrl();
});

watch(visible, opened => {
  if (opened && !form.value.imageName) imageFileList.value = [];
});
</script>

<template>
  <el-drawer v-model="visible" :title="title" size="1180px" destroy-on-close>
    <div class="drawer-subtitle">
      左侧按照 WhatsApp 聊天页收到的营销模版消息实时预览，右侧支持最多 3
      个按钮。
    </div>

    <div class="marketing-template-drawer">
      <MarketingTemplatePreview :form="form" />

      <el-form :model="form" label-position="top" class="drawer-form">
        <el-alert
          class="drawer-alert"
          type="info"
          show-icon
          :closable="false"
          title="营销模版支持普通超链和按钮超链；按钮超链最多 3 个。"
        />

        <el-card shadow="never" class="form-card">
          <template #header>
            <div>
              <div class="form-card-title">模版基础信息</div>
              <div class="form-card-sub">
                编辑内容后，左侧 WhatsApp 预览同步更新。
              </div>
            </div>
          </template>

          <el-form-item label="模版名称" required>
            <el-input
              v-model="form.templateName"
              clearable
              maxlength="128"
              show-word-limit
              :disabled="isPreview()"
              placeholder="请输入模版名称"
            />
          </el-form-item>

          <el-form-item label="超链模式" required>
            <el-select
              v-model="form.linkMode"
              class="drawer-select"
              :disabled="isPreview()"
            >
              <el-option label="普通超链" value="NORMAL" />
              <el-option label="按钮超链" value="BUTTON" />
            </el-select>
          </el-form-item>
        </el-card>

        <el-card shadow="never" class="form-card">
          <template #header>
            <div>
              <div class="form-card-title">内容设置</div>
              <div class="form-card-sub">标题、正文、图片和推广链接</div>
            </div>
          </template>

          <el-form-item label="上传图片">
            <el-upload
              v-model:file-list="imageFileList"
              drag
              accept="image/*"
              :auto-upload="false"
              :disabled="isPreview()"
              :limit="1"
              :on-change="onImageChange"
            >
              <div class="upload-main">
                {{ form.imageName || "上传图片" }}
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  图片要求不超过 500KB；选择后按 WhatsApp 图片消息比例预览。
                </div>
              </template>
            </el-upload>
            <el-card
              v-if="form.imageUrl"
              shadow="never"
              class="image-preview-card"
            >
              <el-image
                :src="form.imageUrl"
                fit="cover"
                class="image-preview"
              />
              <div class="image-preview-meta">
                <span>{{ form.imageName }}</span>
                <span>营销主图预览会实时同步到左侧</span>
              </div>
            </el-card>
            <el-button
              v-if="form.imageName && !isPreview()"
              class="clear-image-button"
              text
              type="danger"
              @click="clearImage"
            >
              删除图片
            </el-button>
          </el-form-item>

          <el-form-item label="内容" required>
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              :disabled="isPreview()"
              placeholder="请输入内容"
            />
          </el-form-item>

          <el-form-item label="文本" required>
            <el-input
              v-model="form.text"
              type="textarea"
              :rows="4"
              :disabled="isPreview()"
              placeholder="请输入文本"
            />
          </el-form-item>

          <el-form-item label="推广链接" required>
            <el-input
              v-model="form.promotionLink"
              clearable
              :disabled="isPreview()"
              placeholder="请输入推广 URL"
            />
          </el-form-item>
        </el-card>

        <MarketingButtonEditor
          v-if="form.linkMode === 'BUTTON'"
          v-model="form.buttons"
          :disabled="isPreview()"
        />
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-if="!isPreview()"
        type="primary"
        :loading="props.loading"
        @click="emit('save')"
      >
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.marketing-template-drawer {
  display: grid;
  grid-template-columns: minmax(330px, 0.72fr) minmax(560px, 1.28fr);
  gap: 16px;
}

.drawer-subtitle {
  margin: -8px 0 16px;
  color: var(--el-text-color-secondary);
}

.drawer-alert {
  margin-bottom: 16px;
}

.drawer-form {
  display: grid;
  gap: 16px;
}

.form-card {
  border-radius: 4px;
}

.form-card-title {
  font-weight: 600;
}

.form-card-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.drawer-select,
:deep(.el-upload),
:deep(.el-upload-dragger) {
  width: 100%;
}

.upload-main {
  color: var(--el-text-color-regular);
}

.image-preview-card {
  margin-top: 10px;
  border-radius: 4px;
}

.image-preview {
  width: 100%;
  height: 160px;
  border-radius: 4px;
}

.image-preview-meta {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.clear-image-button {
  margin-top: 8px;
}

@media (width <= 980px) {
  .marketing-template-drawer {
    grid-template-columns: 1fr;
  }
}
</style>
