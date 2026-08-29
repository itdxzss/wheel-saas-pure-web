<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessageBox, type FormInstance } from "element-plus";
import type { HyperlinkTaskMutationReceipt } from "@/api/hyperlink-task";
import { MESSAGE_TYPE_OPTIONS } from "../domain/editor-rules";
import { useHyperlinkTaskEditor } from "../composables/useHyperlinkTaskEditor";
import HyperlinkAccountFilterDrawer from "./HyperlinkAccountFilterDrawer.vue";
import HyperlinkMessageContentForm from "./HyperlinkMessageContentForm.vue";
import HyperlinkSendStrategyForm from "./HyperlinkSendStrategyForm.vue";
import HyperlinkTaskFinalReview from "./HyperlinkTaskFinalReview.vue";
import HyperlinkTaskPreview from "./HyperlinkTaskPreview.vue";

const emit = defineEmits<{
  (event: "submitted", receipt: HyperlinkTaskMutationReceipt): void;
}>();
const editor = useHyperlinkTaskEditor((event, receipt) => emit(event, receipt));
const formRef = ref<FormInstance>();
const accountFilterVisible = ref(false);
const templateId = ref<number | null>(null);
const strategyId = ref<number | null>(null);

const allowReferences = computed(
  () => editor.mode.value === "create" || editor.mode.value === "copy"
);
const messageTypeDisabled = computed(
  () => editor.readonly.value || editor.mode.value === "edit"
);
const drawerWidth = computed(() =>
  typeof window === "undefined"
    ? "1180px"
    : `${Math.min(1240, Math.max(820, window.innerWidth - 80))}px`
);
const subtitle = computed(() => {
  if (editor.mode.value === "view") {
    return "任务已开始/进行中/已完成/已暂停/已停止，仅可查看，不能修改";
  }
  if (editor.mode.value === "copy") {
    return "已沿用源任务配置，请重新选择数据包后保存";
  }
  return "左侧实时预览 · 右侧填写表单，所见即所得";
});

async function requestClose(): Promise<void> {
  if (editor.readonly.value) {
    editor.forceClose();
    return;
  }
  try {
    await ElMessageBox.confirm(
      editor.mode.value === "edit"
        ? "当前编辑内容尚未保存，关闭后未保存的修改将丢失。是否继续？"
        : "当前正在新建超链群发任务，关闭后已填写的内容将丢失。是否继续？",
      "确认关闭？",
      {
        type: "warning",
        confirmButtonText: "关闭",
        cancelButtonText: "继续编辑"
      }
    );
    editor.forceClose();
  } catch {
    // 用户选择继续编辑。
  }
}

function beforeClose(done: () => void): void {
  void requestClose().then(() => {
    if (!editor.visible.value) done();
  });
}

defineExpose({
  openCreate: editor.openCreate,
  openEdit: editor.openEdit,
  openView: editor.openView,
  openCopy: editor.openCopy
});
</script>

<template>
  <el-drawer
    v-model="editor.visible.value"
    :title="editor.drawerTitle.value"
    :size="drawerWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="beforeClose"
    :show-close="
      !editor.provisioning.value || Boolean(editor.provisionError.value)
    "
    destroy-on-close
  >
    <el-alert
      v-if="
        editor.mode.value === 'edit' &&
        editor.detail.value &&
        !editor.detail.value.editable
      "
      type="warning"
      show-icon
      :closable="false"
      title="该任务当前不可编辑，已切换为查看模式。"
    />
    <el-alert
      v-if="editor.resourceErrors.value['创建上下文']"
      type="error"
      show-icon
      :closable="false"
      :title="editor.resourceErrors.value['创建上下文']"
    >
      <el-button link type="primary" @click="editor.retryCreateContext"
        >重试</el-button
      >
    </el-alert>
    <el-alert
      v-else-if="editor.defaultGroupDependencyError.value"
      type="error"
      show-icon
      :closable="false"
      :title="editor.defaultGroupDependencyError.value"
    />
    <el-alert
      v-if="editor.conflictError.value"
      type="warning"
      show-icon
      :closable="false"
      :title="editor.conflictError.value"
    >
      <el-button link type="primary" @click="editor.reloadAfterConflict">
        重新加载服务器版本
      </el-button>
    </el-alert>
    <p class="drawer-subtitle">{{ subtitle }}</p>
    <el-alert
      v-if="editor.provisionError.value"
      type="error"
      show-icon
      :closable="false"
      :title="editor.provisionError.value"
    >
      <el-button
        v-if="editor.provisioning.value"
        link
        type="primary"
        @click="editor.retryProvisionStatus"
      >
        重新查询准备状态
      </el-button>
      <el-button
        v-else-if="editor.provisionFailed.value"
        link
        type="primary"
        @click="editor.retryProvisionSubmission"
      >
        重新提交准备
      </el-button>
    </el-alert>
    <el-skeleton v-if="editor.detailLoading.value" :rows="12" animated />
    <div v-else class="editor-layout">
      <HyperlinkTaskPreview :form="editor.form.value" />
      <el-form
        ref="formRef"
        :model="editor.form.value"
        label-position="top"
        class="editor-form"
      >
        <el-card shadow="never" class="section-card">
          <template #header>
            <b><span class="section-index">1</span> 基础信息</b>
          </template>
          <el-form-item label="消息类型" required>
            <el-select
              v-model="editor.form.value.messageType"
              :disabled="messageTypeDisabled"
              class="full-width"
            >
              <el-option
                v-if="editor.form.value.messageType === 2"
                label="双图文（历史）"
                :value="2"
              />
              <el-option
                v-for="option in MESSAGE_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-alert
            v-if="editor.form.value.messageType === 1"
            type="warning"
            :closable="false"
            title="单图文可能在大部分手机型号上无法正常显示，建议优先选择其他消息类型"
          />
          <el-form-item label="任务名称" required>
            <el-input
              v-model="editor.form.value.taskName"
              maxlength="128"
              show-word-limit
              :disabled="editor.readonly.value"
              :placeholder="
                editor.selectedDataPackage.value?.name || '请输入任务名称'
              "
            />
          </el-form-item>
        </el-card>

        <HyperlinkMessageContentForm
          v-model="editor.form.value"
          v-model:template-id="templateId"
          :disabled="editor.readonly.value"
          :allow-references="allowReferences"
          :templates="editor.templateOptions.value"
          :template-loading="
            editor.importingTemplate.value || editor.templateLoading.value
          "
          :template-has-more="editor.templateHasMore.value"
          :template-error="editor.resourceErrors.value['模板']"
          @use-template="editor.useTemplate"
          @retry-templates="editor.retryTemplates"
          @search-templates="editor.searchTemplates"
          @load-more-templates="editor.loadMoreTemplates"
        />

        <HyperlinkSendStrategyForm
          v-model="editor.form.value"
          v-model:strategy-id="strategyId"
          :disabled="editor.readonly.value"
          :allow-references="allowReferences"
          :strategies="editor.strategyOptions.value"
          :strategy-loading="editor.resourceLoading.value"
          :strategy-error="editor.resourceErrors.value['策略']"
          :match="editor.match.value"
          :matching="editor.matching.value"
          :match-error="editor.matchError.value"
          :create-context="editor.createContext.value"
          @use-strategy="editor.useStrategy"
          @retry-strategies="editor.retryStrategies"
          @open-filter="accountFilterVisible = true"
          @clear-filter="editor.resetAccountFilter"
          @retry-match="editor.refreshMatch"
          @task-mode-change="editor.switchTaskMode"
        />

        <el-card shadow="never" class="section-card">
          <template #header>
            <b><span class="section-index">4</span> 受众与发布</b>
          </template>
          <el-form-item
            label="受众数据包"
            :required="editor.form.value.enabled"
          >
            <el-select
              v-model="editor.form.value.dataPackageId"
              filterable
              remote
              clearable
              :remote-method="editor.searchDataPackages"
              :disabled="editor.readonly.value"
              :loading="editor.dataPackageLoading.value"
              class="full-width"
              placeholder="选择一个数据包"
              @change="editor.selectDataPackage"
            >
              <el-option
                v-if="
                  editor.form.value.dataPackageId &&
                  !editor.dataPackages.value.some(
                    item => item.id === editor.form.value.dataPackageId
                  )
                "
                :label="`${editor.detail.value?.dataPackageName || `数据包 #${editor.form.value.dataPackageId}`}${editor.detail.value?.dataPackageAvailable ? '' : '（已不可用）'}`"
                :value="editor.form.value.dataPackageId"
                disabled
              />
              <el-option
                v-for="item in editor.dataPackages.value"
                :key="item.id"
                :label="`${item.name} · 未使用 ${item.metrics.unusedCount} 条${item.remark ? ` · ${item.remark}` : ''}`"
                :value="item.id"
              />
            </el-select>
            <el-button
              v-if="editor.dataPackageHasMore.value"
              link
              type="primary"
              :loading="editor.dataPackageLoading.value"
              @click="editor.loadMoreDataPackages"
            >
              加载更多数据包
            </el-button>
            <el-alert
              v-if="editor.resourceErrors.value['数据包']"
              type="error"
              :closable="false"
              :title="editor.resourceErrors.value['数据包']"
            >
              <el-button link type="primary" @click="editor.retryDataPackages"
                >重试</el-button
              >
            </el-alert>
          </el-form-item>
          <el-form-item label="任务开关">
            <el-radio-group
              v-model="editor.form.value.enabled"
              :disabled="editor.readonly.value"
              class="publish-grid"
            >
              <el-radio-button
                :value="true"
                :disabled="Boolean(editor.defaultGroupDependencyError.value)"
              >
                <b>启用并入队</b><small>保存后按策略入队执行</small>
              </el-radio-button>
              <el-radio-button :value="false">
                <b>仅保存（不发送）</b><small>只保存配置，数据包可空</small>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-card>
      </el-form>
    </div>

    <template #footer>
      <el-button
        v-if="editor.readonly.value"
        type="primary"
        @click="editor.forceClose"
        >关闭</el-button
      >
      <template v-else>
        <span
          v-if="editor.provisioning.value && !editor.provisionError.value"
          class="preparing"
          >任务正在准备...</span
        >
        <el-button
          :disabled="
            editor.saving.value ||
            (editor.provisioning.value && !editor.provisionError.value)
          "
          @click="requestClose"
          >取消</el-button
        >
        <el-button
          type="primary"
          :loading="editor.saving.value || editor.provisioning.value"
          :disabled="
            editor.provisioning.value || editor.accountMatchUnready.value
          "
          @click="editor.submit"
        >
          {{
            editor.provisionFailed.value
              ? "重新提交准备"
              : editor.mode.value === "edit"
                ? "保存修改"
                : "创建任务"
          }}
        </el-button>
      </template>
    </template>

    <HyperlinkAccountFilterDrawer
      v-model="accountFilterVisible"
      v-model:value="editor.form.value.accountFilter"
      :options="editor.filterOptions.value"
      :option-errors="editor.resourceErrors.value"
      :default-group-ids="
        editor.createContext.value?.defaultAccountGroupIds ?? []
      "
      @confirmed="editor.setAccountFilter"
    />
    <HyperlinkTaskFinalReview
      v-model="editor.finalReviewVisible.value"
      :form="editor.form.value"
      :quote="editor.quote.value"
      :create-context="editor.createContext.value"
      :data-package="editor.selectedDataPackage.value"
      :match="editor.match.value"
      :loading="editor.saving.value || editor.matching.value"
      @confirm="editor.confirmFinalReview"
    />
  </el-drawer>
</template>

<style scoped>
.drawer-subtitle {
  margin: -8px 0 14px;
  color: var(--el-text-color-secondary);
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(330px, 0.7fr) minmax(580px, 1.3fr);
  gap: 16px;
  align-items: start;
}

.section-card {
  margin-bottom: 16px;
}

.section-index {
  display: inline-grid;
  place-content: center;
  width: 24px;
  height: 24px;
  margin-right: 6px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.full-width {
  width: 100%;
}

.publish-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: 100%;
}

.publish-grid :deep(.el-radio-button__inner) {
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 66px;
  white-space: normal;
}

.publish-grid small,
.preparing {
  color: var(--el-text-color-secondary);
}

.preparing {
  margin-right: 12px;
}

@media (width <= 980px) {
  .editor-layout {
    grid-template-columns: 330px minmax(580px, 1fr);
  }
}
</style>
