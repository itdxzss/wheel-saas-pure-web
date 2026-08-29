<script setup lang="ts">
import { computed } from "vue";
import type {
  HyperlinkAccountMatchCount,
  HyperlinkStrategyOption,
  HyperlinkTaskCreateContext
} from "@/api/hyperlink-task";
import {
  accountFilterSummary,
  type HyperlinkTaskForm
} from "../domain/editor-rules";

const form = defineModel<HyperlinkTaskForm>({ required: true });
const props = defineProps<{
  disabled: boolean;
  allowReferences: boolean;
  strategies: HyperlinkStrategyOption[];
  strategyLoading: boolean;
  strategyError?: string;
  match: HyperlinkAccountMatchCount | null;
  matching: boolean;
  matchError: string;
  createContext: HyperlinkTaskCreateContext | null;
}>();
const emit = defineEmits<{
  (event: "use-strategy", id: number | null): void;
  (event: "retry-strategies"): void;
  (event: "open-filter"): void;
  (event: "clear-filter"): void;
  (event: "retry-match"): void;
  (event: "task-mode-change"): void;
}>();

const strategyId = defineModel<number | null>("strategyId", { default: null });
const intervalRange = computed<[number, number]>({
  get: () =>
    [
      form.value.messageIntervalMinSeconds,
      form.value.messageIntervalMaxSeconds
    ] as [number, number],
  set: value => {
    form.value.messageIntervalMinSeconds = value[0];
    form.value.messageIntervalMaxSeconds = value[1];
  }
});
const filterTags = computed(() =>
  accountFilterSummary(form.value.accountFilter)
);
const taskModes = [
  {
    value: "instant",
    label: "即时群发",
    tip: "一次发完当前数据包，启用时至少需要 1 个可用账号。"
  },
  {
    value: "rolling",
    label: "预发布",
    tip: "到结束时间或数据包发完先到为准，符合条件的新号自动加入。"
  },
  {
    value: "cycle",
    label: "周期循环",
    tip: "按间隔循环选取账号，用于分时段风控观察，由用户手动停止。"
  }
] as const;

function applyPreset(min: number, max: number): void {
  intervalRange.value = [min, max];
}

function clearFilter(): void {
  emit("clear-filter");
}
</script>

<template>
  <el-card shadow="never" class="section-card">
    <template #header>
      <div class="section-header">
        <div>
          <b><span class="section-index">3</span> 发送策略</b>
          <small>选择执行模式、账号范围、间隔与账号限额</small>
        </div>
        <el-select
          v-if="allowReferences"
          v-model="strategyId"
          filterable
          clearable
          :loading="strategyLoading"
          placeholder="引用策略..."
          class="reference-select"
          @change="emit('use-strategy', strategyId)"
        >
          <el-option
            v-for="strategy in strategies"
            :key="strategy.id"
            :label="strategy.name"
            :value="strategy.id"
          />
        </el-select>
      </div>
    </template>

    <el-alert
      v-if="strategyError && allowReferences"
      type="error"
      :closable="false"
      :title="strategyError"
    >
      <el-button link type="primary" @click="emit('retry-strategies')"
        >重试</el-button
      >
    </el-alert>

    <el-form-item label="任务模式" required>
      <el-radio-group
        v-model="form.taskMode"
        :disabled="disabled"
        class="mode-grid"
        @change="emit('task-mode-change')"
      >
        <el-radio-button
          v-for="mode in taskModes"
          :key="mode.value"
          :value="mode.value"
        >
          <b>{{ mode.label }}</b
          ><small>{{ mode.tip }}</small>
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="form.taskMode === 'rolling'"
      label="计划结束时间"
      required
    >
      <el-date-picker
        v-model="form.plannedEndAt"
        type="datetime"
        value-format="x"
        :disabled="disabled"
        placeholder="请选择计划结束时间"
        class="full-width"
      />
    </el-form-item>
    <el-form-item
      v-if="form.taskMode === 'cycle'"
      label="任务执行间隔"
      required
    >
      <el-input-number
        v-model="form.cycleIntervalMinutes"
        :min="1"
        :precision="0"
        :disabled="disabled"
        class="full-width"
      />
      <span class="field-tip">分钟 / 轮</span>
    </el-form-item>

    <el-form-item label="账号范围" required>
      <div class="filter-panel">
        <div class="filter-actions">
          <el-button :disabled="disabled" @click="emit('open-filter')">
            {{ filterTags.length ? "修改筛选条件" : "设置筛选条件" }}
          </el-button>
          <el-button
            v-if="filterTags.length"
            link
            type="danger"
            :disabled="disabled"
            @click="clearFilter"
          >
            清空
          </el-button>
          <span v-if="matching">正在试算匹配账号数...</span>
          <span v-else-if="matchError" class="error-text">
            {{ matchError }}
            <el-button link type="primary" @click="emit('retry-match')"
              >重新试算</el-button
            >
          </span>
          <el-tag v-else type="success">
            匹配 {{ match?.availableAccountCount ?? 0 }} 个账号
          </el-tag>
        </div>
        <div v-if="filterTags.length" class="filter-tags">
          <el-tag v-for="tag in filterTags" :key="tag" effect="plain">{{
            tag
          }}</el-tag>
        </div>
        <small>固定只圈定有效、未导出、未被陌生人禁言的账号。</small>
      </div>
    </el-form-item>

    <el-form-item label="消息间隔" required>
      <div class="interval-editor">
        <div class="preset-row">
          <el-button :disabled="disabled" @click="applyPreset(0, 0.3)"
            >激进 0～0.3s</el-button
          >
          <el-button :disabled="disabled" @click="applyPreset(0.5, 0.7)"
            >常规 0.5～0.7s</el-button
          >
          <el-button :disabled="disabled" @click="applyPreset(1, 1.2)"
            >稳健 1～1.2s</el-button
          >
        </div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-input-number
              v-model="form.messageIntervalMinSeconds"
              :min="0"
              :max="form.messageIntervalMaxSeconds"
              :step="0.1"
              :precision="1"
              :disabled="disabled"
              class="full-width"
            />
          </el-col>
          <el-col :span="12">
            <el-input-number
              v-model="form.messageIntervalMaxSeconds"
              :min="form.messageIntervalMinSeconds"
              :max="10"
              :step="0.1"
              :precision="1"
              :disabled="disabled"
              class="full-width"
            />
          </el-col>
        </el-row>
        <el-slider
          v-model="intervalRange"
          range
          :min="0"
          :max="10"
          :step="0.1"
          :disabled="disabled"
        />
        <small>每条消息发送后会在该范围内随机等待。</small>
      </div>
    </el-form-item>

    <el-row :gutter="12">
      <el-col :span="8">
        <el-form-item label="最大执行账号数" required>
          <el-input-number
            v-model="form.maxExecutingAccounts"
            :min="1"
            :max="
              match?.maxConcurrentNum ?? createContext?.maxConcurrentNum ?? 500
            "
            :precision="0"
            :disabled="disabled"
            class="full-width"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item
          :label="
            form.taskMode === 'cycle' ? '每轮最大账号数' : '最大使用账号数'
          "
        >
          <el-input-number
            v-model="form.maxUseAccounts"
            :min="form.taskMode === 'cycle' ? 1 : 0"
            :precision="0"
            :disabled="disabled"
            class="full-width"
          />
          <small>{{
            form.taskMode === "cycle" ? "周期模式必填" : "0 = 不限号数"
          }}</small>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="每账号最大发送数">
          <el-input-number
            v-model="form.maxSendPerAccount"
            :min="0"
            :precision="0"
            :disabled="disabled"
            class="full-width"
          />
          <small>0 = 不限制 / 封号为止</small>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="启动方式" required>
      <el-radio-group v-model="form.startMode" :disabled="disabled">
        <el-radio-button value="now">立即执行</el-radio-button>
        <el-radio-button value="scheduled">延后执行</el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="form.startMode === 'scheduled'"
      label="延迟时间"
      :required="form.enabled"
    >
      <el-input-number
        v-model="form.delayMinutes"
        :min="1"
        :precision="0"
        :disabled="disabled"
        class="full-width"
      />
      <span class="field-tip">分钟后开始</span>
    </el-form-item>
  </el-card>
</template>

<style scoped>
.section-card {
  margin-bottom: 16px;
}

.section-header,
.section-header > div,
.filter-actions,
.preset-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.section-header > div {
  justify-content: flex-start;
}

.section-header small,
.field-tip,
.filter-panel small,
.interval-editor small,
.el-form-item small {
  color: var(--el-text-color-secondary);
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

.reference-select {
  width: 230px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
}

.mode-grid :deep(.el-radio-button__inner) {
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 74px;
  white-space: normal;
}

.mode-grid small {
  font-size: 11px;
}

.filter-panel,
.interval-editor {
  display: grid;
  gap: 10px;
  width: 100%;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.error-text {
  color: var(--el-color-danger);
}

.full-width {
  width: 100%;
}

.field-tip {
  margin-left: 8px;
}
</style>
