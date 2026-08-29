<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "@/utils/message";
import {
  contactTaskImageUrl,
  uploadContactTaskImage,
  type ContactTaskDetail
} from "@/api/contact-task";
import ContactTaskPreview from "./ContactTaskPreview.vue";
import ContactAccountFilterDialog from "./ContactAccountFilterDialog.vue";
import {
  emptyAccountFilterForm,
  hasAnyFilter,
  parseAccountFilter,
  type AccountFilterForm
} from "../domain/account-filter";
import {
  INTERVAL_INPUT_MAX,
  INTERVAL_PRESETS,
  INTERVAL_SLIDER_MAX,
  INTERVAL_SLIDER_MIN,
  matchIntervalPreset,
  normalizeInterval
} from "../domain/interval-preset";
import {
  MESSAGE_TYPE_IMAGE,
  MESSAGE_TYPE_LINK,
  defaultTaskForm,
  toWriteRequest,
  validateTaskForm,
  type ContactTaskForm
} from "../domain/task-form";

const props = defineProps<{
  modelValue: boolean;
  /** create 新建 / edit 编辑 / view 只读 */
  mode: "create" | "edit" | "view";
  detail: ContactTaskDetail | null;
  /** 账号范围实时试算命中数；未试算为 undefined */
  matchedAccountCount?: number;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", body: ReturnType<typeof toWriteRequest>): void;
  (e: "filterChange", filter: AccountFilterForm): void;
}>();

/** 图片限制与竞品一致。 */
const IMAGE_ACCEPT = ".jpg,.jpeg";
const IMAGE_MAX_BYTES = 500 * 1024;

const form = ref<ContactTaskForm>(defaultTaskForm());
const filter = ref<AccountFilterForm>(emptyAccountFilterForm());
const filterDialogVisible = ref(false);
const uploading = ref(false);
const imageUrl = ref("");

const readonly = computed(() => props.mode === "view");
/** 编辑态锁消息类型：后端 update 就是这么校验的。 */
const messageTypeLocked = computed(() => props.mode === "edit");
const isLink = computed(() => form.value.messageType === MESSAGE_TYPE_LINK);
const activePreset = computed(() =>
  matchIntervalPreset(
    form.value.msgIntervalMinSec,
    form.value.msgIntervalMaxSec
  )
);
const filterLimited = computed(() => hasAnyFilter(filter.value));
const accountRangeError = computed(
  () => form.value.isEnabled === 1 && props.matchedAccountCount === 0
);

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const drawerTitle = computed(() => {
  if (props.mode === "create") return "新建通讯录任务";
  return props.mode === "edit" ? "编辑通讯录任务" : "查看通讯录任务";
});

function resetFromDetail(detail: ContactTaskDetail | null) {
  if (!detail) {
    form.value = defaultTaskForm();
    filter.value = emptyAccountFilterForm();
    imageUrl.value = "";
    return;
  }
  form.value = {
    name: detail.name ?? "",
    messageType: detail.messageType,
    title: detail.title ?? "",
    // 后端字段叫 description，表单叫 linkDescription
    linkDescription: detail.description ?? "",
    promotionLink: detail.promotionLink ?? "",
    content: detail.content ?? "",
    previewImageFileId: detail.previewImageFileId ?? null,
    msgIntervalMinSec: Number(detail.msgIntervalMinSec ?? 0.5),
    msgIntervalMaxSec: Number(detail.msgIntervalMaxSec ?? 1),
    concurrency: detail.concurrency ?? 10,
    maxSendsPerAccount: detail.maxSendsPerAccount ?? 50,
    retryMax: detail.retryMax ?? 3,
    startMode: detail.startMode ?? "now",
    taskDelayMinutes: detail.taskDelayMinutes ?? 0,
    isEnabled: detail.isEnabled ?? 1
  };
  filter.value = parseAccountFilter(detail.accountFilter);
  imageUrl.value = detail.previewImageFileId
    ? contactTaskImageUrl(detail.previewImageFileId)
    : "";
  emit("filterChange", filter.value);
}

function applyPreset(key: string) {
  const preset = INTERVAL_PRESETS.find(item => item.key === key);
  if (!preset) return;
  form.value.msgIntervalMinSec = preset.min;
  form.value.msgIntervalMaxSec = preset.max;
}

function syncIntervalFromSlider(value: number[]) {
  form.value.msgIntervalMinSec = value[0];
  form.value.msgIntervalMaxSec = value[1];
}

function normalizeIntervalInputs() {
  const next = normalizeInterval(
    form.value.msgIntervalMinSec,
    form.value.msgIntervalMaxSec
  );
  form.value.msgIntervalMinSec = next.min;
  form.value.msgIntervalMaxSec = next.max;
}

async function pickImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!/\.jpe?g$/i.test(file.name)) {
    message("只支持 jpg / jpeg 图片", { type: "warning" });
    return;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    message("图片不能超过 500KB", { type: "warning" });
    return;
  }
  uploading.value = true;
  try {
    const uploaded = await uploadContactTaskImage(file);
    form.value.previewImageFileId = uploaded.id;
    imageUrl.value = uploaded.url || contactTaskImageUrl(uploaded.id);
  } catch (error) {
    message((error as Error)?.message ?? "图片上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

function clearImage() {
  form.value.previewImageFileId = null;
  imageUrl.value = "";
}

function confirmFilter(next: AccountFilterForm) {
  filter.value = next;
  emit("filterChange", next);
}

function submit() {
  normalizeIntervalInputs();
  const errors = validateTaskForm(form.value, {
    matchedAccountCount: props.matchedAccountCount
  });
  if (errors.length > 0) {
    message(errors[0], { type: "warning" });
    return;
  }
  emit("submit", toWriteRequest(form.value, filter.value));
}

watch(
  () => [props.modelValue, props.detail],
  ([open]) => {
    if (open) {
      resetFromDetail(props.detail);
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    size="1080px"
    direction="rtl"
  >
    <div class="drawer-body">
      <ContactTaskPreview
        class="preview-column"
        :message-type="form.messageType"
        :title="form.title"
        :link-description="form.linkDescription"
        :promotion-link="form.promotionLink"
        :content="form.content"
        :image-url="imageUrl"
      />

      <div class="form-column" :class="{ 'is-readonly': readonly }">
        <el-form :disabled="readonly" label-width="120px">
          <!-- 1 基础信息 -->
          <section class="form-section">
            <header class="section-header">
              <span class="section-index">1</span>
              <div>
                <div class="section-title">基础信息</div>
                <div class="section-desc">
                  选择消息形态、命名任务并圈定账号范围
                </div>
              </div>
            </header>
            <div class="section-body">
              <el-form-item label="消息类型">
                <el-radio-group
                  v-model="form.messageType"
                  :disabled="readonly || messageTypeLocked"
                >
                  <el-radio-button :value="MESSAGE_TYPE_LINK"
                    >链接消息</el-radio-button
                  >
                  <el-radio-button :value="MESSAGE_TYPE_IMAGE"
                    >图文消息</el-radio-button
                  >
                </el-radio-group>
                <span v-if="messageTypeLocked" class="field-tip">
                  任务创建后消息类型不可更改
                </span>
              </el-form-item>
              <el-form-item label="任务名称" required>
                <el-input
                  v-model="form.name"
                  maxlength="128"
                  show-word-limit
                  placeholder="给任务起个名字"
                />
              </el-form-item>
              <el-form-item label="账号范围">
                <div
                  class="account-range"
                  :class="{ 'is-error': accountRangeError }"
                >
                  <div class="account-range-info">
                    <span v-if="filterLimited">已设置筛选条件</span>
                    <span v-else>未限制，将使用全部有效账号</span>
                    <span
                      v-if="matchedAccountCount !== undefined"
                      class="account-range-count"
                      :class="{ 'is-error': accountRangeError }"
                    >
                      命中 {{ matchedAccountCount }} 个账号
                    </span>
                  </div>
                  <el-button
                    :disabled="readonly"
                    @click="filterDialogVisible = true"
                  >
                    设置账号范围
                  </el-button>
                </div>
                <div v-if="accountRangeError" class="account-range-tip">
                  账号范围未命中任何账号，无法启用
                </div>
              </el-form-item>
            </div>
          </section>

          <!-- 2 消息内容 -->
          <section class="form-section">
            <header class="section-header">
              <span class="section-index">2</span>
              <div>
                <div class="section-title">消息内容</div>
                <div class="section-desc">
                  这里编辑的内容会实时反映到左侧预览
                </div>
              </div>
            </header>
            <div class="section-body">
              <template v-if="isLink">
                <el-form-item label="消息标题" required>
                  <el-input
                    v-model="form.title"
                    maxlength="512"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="链接描述" required>
                  <el-input v-model="form.linkDescription" maxlength="2048" />
                </el-form-item>
                <el-form-item label="推广链接" required>
                  <el-input v-model="form.promotionLink" maxlength="2048" />
                </el-form-item>
              </template>
              <el-form-item :label="isLink ? '正文内容' : '图文文案'" required>
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="4"
                  maxlength="2000"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item :label="isLink ? '链接预览图' : '图文配图'">
                <div class="upload-block">
                  <label v-if="!imageUrl" class="upload-area">
                    <input
                      type="file"
                      :accept="IMAGE_ACCEPT"
                      class="upload-input"
                      :disabled="readonly || uploading"
                      @change="pickImage"
                    />
                    <span class="upload-title">点击选择图片</span>
                    <span class="upload-hint">
                      支持 jpg / jpeg，不超过 500KB，建议 16:9
                    </span>
                    <span v-if="!isLink" class="upload-hint">
                      不传则仅发送文字
                    </span>
                  </label>
                  <div v-else class="file-chip">
                    <img :src="imageUrl" alt="已选图片" class="file-thumb" />
                    <el-button
                      link
                      type="danger"
                      :disabled="readonly"
                      @click="clearImage"
                    >
                      移除
                    </el-button>
                  </div>
                </div>
              </el-form-item>
            </div>
          </section>

          <!-- 3 发送策略 -->
          <section class="form-section">
            <header class="section-header">
              <span class="section-index">3</span>
              <div>
                <div class="section-title">发送策略</div>
                <div class="section-desc">控制发送节奏与并发，降低风控风险</div>
              </div>
            </header>
            <div class="section-body">
              <el-form-item label="发送间隔">
                <div class="interval-control">
                  <div class="interval-presets">
                    <span class="interval-presets-label">快捷预设</span>
                    <el-button
                      v-for="preset in INTERVAL_PRESETS"
                      :key="preset.key"
                      size="small"
                      :type="
                        activePreset === preset.key ? 'primary' : 'default'
                      "
                      :disabled="readonly"
                      @click="applyPreset(preset.key)"
                    >
                      {{ preset.label }}
                    </el-button>
                  </div>
                  <div class="interval-stats">
                    <div class="interval-card">
                      <span class="interval-card-label">最小间隔</span>
                      <el-input-number
                        v-model="form.msgIntervalMinSec"
                        :min="INTERVAL_SLIDER_MIN"
                        :max="INTERVAL_INPUT_MAX"
                        :step="0.1"
                        :precision="1"
                        controls-position="right"
                        @blur="normalizeIntervalInputs"
                      />
                    </div>
                    <span class="interval-divider">~</span>
                    <div class="interval-card">
                      <span class="interval-card-label">最大间隔</span>
                      <el-input-number
                        v-model="form.msgIntervalMaxSec"
                        :min="INTERVAL_SLIDER_MIN"
                        :max="INTERVAL_INPUT_MAX"
                        :step="0.1"
                        :precision="1"
                        controls-position="right"
                        @blur="normalizeIntervalInputs"
                      />
                    </div>
                  </div>
                  <el-slider
                    range
                    :model-value="[
                      form.msgIntervalMinSec,
                      form.msgIntervalMaxSec
                    ]"
                    :min="INTERVAL_SLIDER_MIN"
                    :max="INTERVAL_SLIDER_MAX"
                    :step="0.1"
                    :disabled="readonly"
                    @update:model-value="syncIntervalFromSlider"
                  />
                  <p class="interval-tip">
                    间隔指同一个账号给两个好友发消息之间至少等待的秒数，实际发送时在区间内随机取值。
                  </p>
                </div>
              </el-form-item>
              <el-form-item label="最大执行账号数">
                <el-input-number
                  v-model="form.concurrency"
                  :min="1"
                  :max="200"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="每号最大发送数">
                <el-input-number
                  v-model="form.maxSendsPerAccount"
                  :min="0"
                  :step="10"
                  controls-position="right"
                />
                <span class="field-tip">0 表示发给全部联系人</span>
              </el-form-item>
              <el-form-item label="失败重试次数">
                <el-input-number
                  v-model="form.retryMax"
                  :min="0"
                  :max="10"
                  controls-position="right"
                />
              </el-form-item>
            </div>
          </section>

          <!-- 4 发布 -->
          <section class="form-section">
            <header class="section-header">
              <span class="section-index">4</span>
              <div>
                <div class="section-title">发布</div>
                <div class="section-desc">
                  决定这个任务是立即执行还是先存草稿
                </div>
              </div>
            </header>
            <div class="section-body">
              <el-form-item label="启动方式">
                <el-radio-group v-model="form.startMode">
                  <el-radio-button value="now">立即执行</el-radio-button>
                  <el-radio-button value="scheduled">延后执行</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item
                v-if="form.startMode === 'scheduled'"
                label="延迟分钟"
              >
                <el-input-number
                  v-model="form.taskDelayMinutes"
                  :min="0"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="任务开关">
                <div class="status-toggle">
                  <button
                    type="button"
                    class="status-card"
                    :class="{ 'is-active': form.isEnabled === 1 }"
                    :disabled="readonly"
                    @click="form.isEnabled = 1"
                  >
                    <div class="status-title">启用</div>
                    <div class="status-desc">保存后按策略开始发送</div>
                  </button>
                  <button
                    type="button"
                    class="status-card"
                    :class="{ 'is-active': form.isEnabled === 0 }"
                    :disabled="readonly"
                    @click="form.isEnabled = 0"
                  >
                    <div class="status-title">停用</div>
                    <div class="status-desc">仅保存草稿，不发送</div>
                  </button>
                </div>
              </el-form-item>
            </div>
          </section>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button
        v-if="!readonly"
        type="primary"
        :loading="submitting"
        @click="submit"
      >
        保存
      </el-button>
    </template>

    <ContactAccountFilterDialog
      v-model="filterDialogVisible"
      :filter="filter"
      :readonly="readonly"
      @confirm="confirmFilter"
    />
  </el-drawer>
</template>

<style scoped>
.drawer-body {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.preview-column {
  position: sticky;
  top: 0;
  flex-shrink: 0;
}

.form-column {
  flex: 1;
  min-width: 0;
}

.form-column.is-readonly {
  cursor: not-allowed;
}

.form-section {
  margin-bottom: 18px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.section-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-index {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-radius: 6px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.section-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-body {
  padding: 18px;
}

.field-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.account-range {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.account-range.is-error {
  border-color: var(--el-color-danger);
}

.account-range-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.account-range-count {
  padding: 2px 10px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.account-range-count.is-error {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.account-range-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.interval-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.interval-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.interval-presets-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.interval-stats {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
}

.interval-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.interval-card-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.interval-divider {
  font-size: 16px;
  color: var(--el-text-color-placeholder);
}

.interval-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.upload-block {
  width: 100%;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 24px;
  cursor: pointer;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
}

.upload-area:hover {
  border-color: var(--el-color-primary);
}

.upload-input {
  display: none;
}

.upload-title {
  font-size: 14px;
  font-weight: 600;
}

.upload-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-chip {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.file-thumb {
  width: 96px;
  border-radius: 6px;
}

.status-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.status-card {
  padding: 14px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1.5px solid var(--el-border-color);
  border-radius: 8px;
}

.status-card.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.status-title {
  font-size: 14px;
  font-weight: 600;
}

.status-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1100px) {
  .drawer-body {
    flex-direction: column;
  }

  .preview-column {
    position: static;
    width: 100%;
  }
}

@media (width <= 720px) {
  .status-toggle,
  .interval-stats {
    grid-template-columns: 1fr;
  }

  .interval-divider {
    display: none;
  }
}
</style>
