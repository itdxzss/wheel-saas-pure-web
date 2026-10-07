<script setup lang="ts" generic="F extends ImmediatePullTaskForm">
import type {
  ImmediatePullTaskCreateState,
  ImmediatePullTaskForm
} from "../composables/useImmediatePullTaskCreate";
import { formatAccountGroupLabel } from "@/utils/account-group-label";
import PullTaskDirectLinkResources from "./PullTaskDirectLinkResources.vue";

defineOptions({ name: "PullTaskImmediateCreateContent" });
defineProps<{
  state: ImmediatePullTaskCreateState<F>;
  simpleNewGroup?: boolean;
}>();
const form = defineModel<F>("form", { required: true });
const parameterGroups = [
  {
    title: "执行配置",
    fields: [
      { key: "pullerCountPerGroup", label: "拉手数量", min: 1, max: 50 },
      { key: "concurrentGroupCount", label: "同时启动任务数", min: 1, max: 100 }
    ]
  },
  {
    title: "前期拉人",
    fields: [
      { key: "earlyPullCount", label: "前期单次拉人数", min: 1 },
      { key: "earlyPullCallCount", label: "前期拉人执行次数", min: 1 }
    ]
  }
] as const;
const groupFields = [
  { key: "pullerGroupId", label: "拉手分组", required: true },
  {
    key: "pullerFinishGroupId",
    label: "任务完成的拉手移至分组",
    required: false
  }
] as const;
</script>

<template>
  <div v-loading="state.loading" class="direct-link-content">
    <el-alert
      v-if="state.error"
      :title="state.error"
      type="error"
      :closable="false"
      show-icon
    />
    <el-form :model="form" label-position="top" :disabled="state.creating">
      <div class="task-overview">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.taskName" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="自动启动" class="start-field">
          <el-switch
            v-model="form.autoStart"
            active-text="创建后立即启动"
            inactive-text="待启动"
          />
        </el-form-item>
      </div>

      <div class="direct-columns">
        <div class="direct-column">
          <slot name="target" />
          <PullTaskDirectLinkResources
            :state="state"
            :simple-new-group="simpleNewGroup"
          />

          <div class="task-remark">
            <el-form-item label="任务备注">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
                placeholder="选填，记录本次任务说明"
              />
            </el-form-item>
          </div>
        </div>

        <div class="direct-column">
          <el-card class="direct-card" shadow="never">
            <template #header
              ><div class="section-heading">
                <strong>拉人参数</strong><span>人数 · 间隔 · 并发</span>
              </div></template
            >
            <div class="parameter-section">
              <h4>常规拉人</h4>
              <div class="direct-grid">
                <el-form-item label="单次拉人数范围" required>
                  <div class="range-inputs">
                    <el-input-number
                      v-model="form.pullCountMin"
                      :min="1"
                      :max="simpleNewGroup ? 50 : undefined"
                      :precision="0"
                      controls-position="right"
                      aria-label="单次拉人数下限"
                    />
                    <span>至</span>
                    <el-input-number
                      v-model="form.pullCountMax"
                      :min="form.pullCountMin"
                      :max="simpleNewGroup ? 50 : undefined"
                      :precision="0"
                      controls-position="right"
                      aria-label="单次拉人数上限"
                    />
                  </div>
                </el-form-item>
                <el-form-item
                  v-if="simpleNewGroup"
                  label="拉人随机间隔（秒）"
                  required
                >
                  <slot name="interval" />
                </el-form-item>
                <el-form-item v-else label="拉人间隔（秒）">
                  <el-input-number
                    v-model="form.pullIntervalSeconds"
                    :min="0"
                    :precision="0"
                    controls-position="right"
                  />
                </el-form-item>
              </div>
            </div>
            <div
              v-for="group in simpleNewGroup
                ? parameterGroups.slice(0, 1)
                : parameterGroups"
              :key="group.title"
              class="parameter-section"
            >
              <h4>{{ group.title }}</h4>
              <div class="direct-grid">
                <el-form-item
                  v-for="field in group.fields"
                  :key="field.key"
                  :label="field.label"
                  required
                >
                  <el-input-number
                    v-model="form[field.key]"
                    :min="field.min"
                    :max="'max' in field ? field.max : undefined"
                    :precision="0"
                    controls-position="right"
                  />
                </el-form-item>
              </div>
            </div>
          </el-card>

          <el-card class="direct-card" shadow="never">
            <template #header
              ><div class="section-heading">
                <strong>账号分组</strong
                ><span>{{
                  simpleNewGroup
                    ? "建群、管理、拉手与站台资源"
                    : "拉手与站台资源"
                }}</span>
              </div></template
            >
            <slot name="accounts" />
            <div class="direct-grid">
              <el-form-item
                v-for="field in groupFields"
                :key="field.key"
                :label="field.label"
                :required="field.required"
              >
                <el-select
                  v-model="form[field.key]"
                  clearable
                  filterable
                  class="full-width"
                  placeholder="请选择账号分组"
                >
                  <el-option
                    v-for="group in state.accountGroups"
                    :key="group.id"
                    :value="group.id"
                    :label="formatAccountGroupLabel(group)"
                  />
                </el-select>
              </el-form-item>
            </div>
            <div class="parameter-section station-section">
              <h4>站台配置</h4>
              <div class="direct-grid">
                <el-form-item label="站台数量/次">
                  <el-input-number
                    v-model="form.stationCountPerCall"
                    :min="0"
                    :max="50"
                    :precision="0"
                    controls-position="right"
                  />
                </el-form-item>
                <el-form-item
                  label="站台分组"
                  :required="form.stationCountPerCall > 0"
                >
                  <el-select
                    v-model="form.stationGroupId"
                    clearable
                    filterable
                    class="full-width"
                    placeholder="请选择站台分组"
                  >
                    <el-option
                      v-for="group in state.accountGroups"
                      :key="group.id"
                      :value="group.id"
                      :label="formatAccountGroupLabel(group)"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.direct-link-content {
  min-width: 0;
}

.direct-link-content > .el-alert {
  margin-bottom: 12px;
}

.task-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 16px 18px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.task-overview :deep(.el-form-item) {
  margin-bottom: 0;
}

.start-field {
  min-width: 225px;
}

.direct-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.direct-column {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.direct-card {
  min-width: 0;
  border-radius: 10px;
}

.direct-link-content :deep(.el-card__header) {
  padding: 13px 16px;
  border-bottom-color: var(--el-border-color-extra-light);
}

.direct-link-content :deep(.el-card__body) {
  padding: 14px 16px;
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.section-heading strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-heading span,
.field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.direct-link-content :deep(.el-form-item) {
  min-width: 0;
  margin-bottom: 14px;
}

.direct-link-content .task-overview :deep(.el-form-item),
.task-remark :deep(.el-form-item) {
  margin-bottom: 0;
}

.direct-link-content :deep(.el-form-item__label) {
  height: auto;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 20px;
}

.direct-link-content :deep(.el-input-number) {
  width: 160px;
  max-width: 100%;
}

.direct-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.parameter-section h4 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.parameter-section + .parameter-section,
.station-section {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.parameter-section:last-child :deep(.el-form-item) {
  margin-bottom: 0;
}

.range-inputs {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  max-width: 250px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.range-inputs :deep(.el-input-number) {
  flex: 1;
  width: 0;
  min-width: 0;
}

.range-inputs :deep(.el-input__wrapper) {
  padding-left: 6px;
}

.full-width {
  width: 100%;
}

.field-hint {
  margin: -4px 0 12px;
  line-height: 1.6;
}

.permission-note {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
}

.task-remark {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

@media (width <= 1200px) {
  .direct-columns {
    grid-template-columns: 1fr;
  }
}

@media (width <= 760px) {
  .task-overview,
  .direct-grid {
    grid-template-columns: 1fr;
  }

  .task-overview {
    gap: 14px;
  }

  .parameter-section:last-child :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
