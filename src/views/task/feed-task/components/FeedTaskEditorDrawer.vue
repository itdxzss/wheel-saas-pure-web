<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, type UploadFile, type UploadRawFile } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Filter from "~icons/ri/filter-3-line";
import Upload from "~icons/ep/upload";
import Delete from "~icons/ep/delete";
import User from "~icons/ep/user";
import {
  accountFilterSummary,
  feedTaskThemeOptions,
  type FeedTaskForm
} from "../constants";

defineOptions({ name: "FeedTaskEditorDrawer" });

const visible = defineModel<boolean>({ required: true });
const form = defineModel<FeedTaskForm>("form", { required: true });

const props = defineProps<{
  editId: number | null;
  readonly: boolean;
  loading: boolean;
  availableAccountCount: number | null;
  accountCountLoading: boolean;
  imagePreview: string | null;
}>();

const emit = defineEmits<{
  (event: "open-filter"): void;
  (event: "submit"): void;
  (event: "image-change", value: UploadRawFile): void;
  (event: "image-clear"): void;
  (event: "request-close", done?: () => void): void;
}>();

const formRef = ref();
const demoImage = "https://picsum.photos/seed/feed-status-preview/800/450";
const previewImage = computed(() => props.imagePreview || demoImage);
const hasFilter = computed(() => Object.keys(form.value.accountFilter).length > 0);
const canSubmit = computed(() => !props.readonly && !props.loading);

async function submit(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (valid) emit("submit");
}

function onImageChange(file: UploadFile): void {
  const rawFile = file.raw;
  if (!rawFile) return;
  if (!/jpe?g$/i.test(rawFile.name)) {
    ElMessage.warning("仅支持 jpg / jpeg 格式");
    return;
  }
  if (rawFile.size > 500 * 1024) {
    ElMessage.warning("图片大小不能超过 500KB");
    return;
  }
  emit("image-change", rawFile);
}

function chooseTheme(theme: (typeof feedTaskThemeOptions)[number]): void {
  form.value.backgroundColor = theme.backgroundColor;
  form.value.textColor = theme.textColor;
}

function requestClose(done?: () => void): void {
  emit("request-close", done);
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="readonly ? '查看动态消息任务' : editId ? '编辑动态消息任务' : '新建动态消息任务'"
    size="1080px"
    :close-on-click-modal="false"
    :before-close="requestClose"
  >
    <div class="feed-editor-layout">
      <section class="feed-preview-panel">
        <div class="preview-heading">
          <span class="preview-title">WhatsApp 动态预览</span>
          <el-tag type="success" effect="plain">Status</el-tag>
        </div>
        <div class="status-preview" :style="{ backgroundColor: form.backgroundColor, color: form.textColor }">
          <img :src="previewImage" alt="动态链接预览图" class="status-preview-image" />
          <div class="status-preview-title">{{ form.title || "推广标题" }}</div>
          <div class="status-preview-description">{{ form.description || "点击查看详情" }}</div>
          <div class="status-preview-content">{{ form.content || "这里是状态正文内容" }}</div>
          <div class="status-preview-link">{{ form.promotionLink || "https://example.com" }}</div>
        </div>
        <el-alert
          title="命中账号后，每个账号都会以 Status 形式发布同一条动态。"
          type="success"
          :closable="false"
          show-icon
        />
      </section>

      <el-form ref="formRef" :model="form" label-position="top" class="feed-editor-form" :disabled="readonly">
        <el-divider content-position="left">1. 基础信息</el-divider>
        <el-form-item label="任务名称" prop="name" required>
          <el-input v-model="form.name" maxlength="128" show-word-limit placeholder="例如：2026 春节-新品状态曝光" />
        </el-form-item>
        <el-form-item label="账号范围" required>
          <div class="account-filter-summary">
            <div>
              <el-icon v-if="!hasFilter" color="#67c23a"><User /></el-icon>
              <span>{{ hasFilter ? accountFilterSummary(form.accountFilter) : "未限制（全部有效账号）" }}</span>
              <el-tag v-loading="accountCountLoading" size="small" type="success" effect="plain">
                {{ availableAccountCount == null ? "—" : `${availableAccountCount} 个可用` }}
              </el-tag>
            </div>
            <el-button size="small" :disabled="readonly" :icon="useRenderIcon(Filter)" @click="emit('open-filter')">{{ hasFilter ? "修改筛选" : "设置筛选" }}</el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">2. 动态内容</el-divider>
        <el-form-item label="链接预览图">
          <div class="image-upload-row">
            <img :src="previewImage" alt="链接预览图" class="upload-preview" />
            <div>
              <el-upload :show-file-list="false" :auto-upload="false" :disabled="readonly" accept=".jpg,.jpeg" :on-change="onImageChange">
                <el-button :disabled="readonly" :icon="useRenderIcon(Upload)">选择 JPG / JPEG</el-button>
              </el-upload>
              <el-button v-if="imagePreview" link type="danger" :disabled="readonly" :icon="useRenderIcon(Delete)" @click="emit('image-clear')">移除图片</el-button>
              <div class="field-tip">建议 16:9，文件不超过 500KB</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="推广标题" prop="title" required>
          <el-input v-model="form.title" maxlength="512" show-word-limit placeholder="例如：🔥 限时特惠" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" maxlength="2048" placeholder="广告卡片内、标题下方的副标题小字" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="状态文本，支持换行" />
        </el-form-item>
        <el-form-item label="推广链接" prop="promotionLink" required>
          <el-input v-model="form.promotionLink" maxlength="2048" placeholder="https://..." />
        </el-form-item>

        <el-divider content-position="left">3. 样式</el-divider>
        <div class="theme-options">
          <button
            v-for="theme in feedTaskThemeOptions"
            :key="theme.name"
            type="button"
            class="theme-option"
            :class="{ active: form.backgroundColor === theme.backgroundColor && form.textColor === theme.textColor }"
            :disabled="readonly"
            :style="{ backgroundColor: theme.backgroundColor, color: theme.textColor }"
            @click="chooseTheme(theme)"
          >
            {{ theme.name }}
          </button>
        </div>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="背景颜色"><el-color-picker v-model="form.backgroundColor" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="文字颜色"><el-color-picker v-model="form.textColor" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">4. 发送策略</el-divider>
        <el-form-item label="任务模式">
          <el-radio-group v-model="form.taskMode">
            <el-radio-button value="instant">即时发布</el-radio-button>
            <el-radio-button value="rolling">预发布</el-radio-button>
          </el-radio-group>
          <div class="field-tip">即时任务一轮发完结束；预发布到指定时间结束，期间符合条件的新号自动加入。</div>
        </el-form-item>
        <el-form-item v-if="form.taskMode === 'rolling'" label="计划结束时间" required>
          <el-date-picker v-model="form.taskPlannedEndAt" type="datetime" value-format="x" format="YYYY-MM-DD HH:mm" placeholder="选择任务自动结束时间" class="w-full" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="最大执行账号数"><el-input-number v-model="form.concurrency" :min="1" :max="200" class="w-full" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失败重试次数"><el-input-number v-model="form.retryMax" :min="0" :max="10" class="w-full" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="启动方式">
          <el-radio-group v-model="form.startMode">
            <el-radio value="now">立即执行</el-radio>
            <el-radio value="scheduled">延后执行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.startMode === 'scheduled'" label="延迟时间" required>
          <el-input-number v-model="form.taskDelayMinutes" :min="1" :step="1" class="w-full"><template #suffix>分钟后开始</template></el-input-number>
        </el-form-item>

        <el-divider content-position="left">5. 发布</el-divider>
        <el-form-item label="任务开关">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用并入队</el-radio>
            <el-radio :value="0">仅保存（不发送）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="requestClose()">关闭</el-button>
        <el-button v-if="canSubmit" type="primary" :loading="loading" @click="submit">{{ editId ? "保存修改" : "创建任务" }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.feed-editor-layout { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 24px; }
.feed-preview-panel { position: sticky; top: 0; align-self: start; }
.preview-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.preview-title { font-size: 16px; font-weight: 600; }
.status-preview { overflow: hidden; padding-bottom: 18px; border-radius: 12px; box-shadow: 0 8px 24px rgb(0 0 0 / 12%); }
.status-preview-image { display: block; width: 100%; height: 180px; object-fit: cover; }
.status-preview-title, .status-preview-description, .status-preview-content, .status-preview-link { padding: 0 16px; }
.status-preview-title { padding-top: 16px; font-size: 18px; font-weight: 700; }
.status-preview-description { padding-top: 4px; font-size: 13px; opacity: .8; }
.status-preview-content { padding-top: 18px; white-space: pre-wrap; line-height: 1.6; }
.status-preview-link { display: inline-block; margin: 14px 16px 0; padding: 4px 8px; border-radius: 999px; background: rgb(0 0 0 / 16%); font-size: 11px; word-break: break-all; }
.account-filter-summary { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 12px; border: 1px solid var(--el-border-color); border-radius: 6px; }
.account-filter-summary > div { display: flex; align-items: center; gap: 8px; min-width: 0; }
.account-filter-summary span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-upload-row { display: flex; align-items: center; gap: 16px; }
.upload-preview { width: 128px; height: 72px; border-radius: 6px; object-fit: cover; }
.field-tip { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.theme-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.theme-option { padding: 6px 12px; border: 2px solid transparent; border-radius: 6px; cursor: pointer; }
.theme-option.active { border-color: var(--el-color-primary); }
@media (max-width: 900px) { .feed-editor-layout { grid-template-columns: 1fr; } .feed-preview-panel { position: static; } }
</style>
