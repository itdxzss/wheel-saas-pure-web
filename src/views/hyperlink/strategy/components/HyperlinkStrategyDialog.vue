<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import type { HyperlinkAccountMatchCount } from "@/api/hyperlink-task";
import { accountFilterSummary } from "../../task/domain/editor-rules";
import {
  STRATEGY_TASK_MODES,
  type HyperlinkStrategyForm
} from "../domain/strategy-form";

const visible = defineModel<boolean>({ required: true });
const form = defineModel<HyperlinkStrategyForm>("form", { required: true });
const props = defineProps<{
  editing: boolean;
  loading: boolean;
  detailLoading: boolean;
  contextLoading: boolean;
  contextError?: string;
  match: HyperlinkAccountMatchCount | null;
  matching: boolean;
  matchError?: string;
}>();
const emit = defineEmits<{
  (event: "save"): void;
  (event: "open-filter"): void;
  (event: "retry-context"): void;
  (event: "retry-match"): void;
}>();

const filterTags = computed(() =>
  accountFilterSummary(form.value.accountFilter)
);
const matchSummary = computed(() => {
  if (!props.match) return "";
  const count = props.match.availableAccountCount;
  if (form.value.maxUseAccounts > 0) {
    return `当前匹配 ${count} 个，本次最多使用 ${Math.min(
      count,
      form.value.maxUseAccounts
    )} 个`;
  }
  return `当前匹配 ${count} 个，不限使用账号数`;
});
const cleanSnapshot = ref("");

function formSnapshot(): string {
  return JSON.stringify(form.value);
}

watch(
  [visible, () => props.detailLoading],
  async ([opened, detailLoading]) => {
    if (!opened || detailLoading) return;
    await nextTick();
    cleanSnapshot.value = formSnapshot();
  },
  { immediate: true }
);

async function confirmClose(): Promise<boolean> {
  if (props.loading || formSnapshot() === cleanSnapshot.value) return true;
  try {
    await ElMessageBox.confirm(
      "当前策略还有未保存的修改，确定放弃吗？",
      "放弃修改",
      {
        confirmButtonText: "放弃修改",
        cancelButtonText: "继续编辑",
        type: "warning"
      }
    );
    return true;
  } catch {
    return false;
  }
}

async function beforeClose(done: () => void): Promise<void> {
  if (await confirmClose()) done();
}

async function requestClose(): Promise<void> {
  if (await confirmClose()) visible.value = false;
}

function switchTaskMode(): void {
  if (form.value.taskMode === "cycle") {
    if (form.value.cycleIntervalMinutes < 30) {
      form.value.cycleIntervalMinutes = 60;
    }
    if (form.value.maxUseAccounts < 1) {
      form.value.maxUseAccounts = 50;
    }
  }
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="editing ? '编辑超链策略' : '新建超链策略'"
    size="min(820px, calc(100vw - 24px))"
    direction="rtl"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="beforeClose"
  >
    <div v-loading="detailLoading" class="strategy-dialog-body">
      <el-alert
        v-if="contextError"
        type="warning"
        :closable="false"
        :title="`${contextError}；账号筛选候选暂不可用`"
      >
        <el-button link type="primary" @click="emit('retry-context')">
          重新加载
        </el-button>
      </el-alert>

      <el-form label-position="top" :model="form">
        <section class="form-section">
          <header class="section-header">
            <span class="section-index">1</span>
            <div>
              <b>基础信息</b><small>策略名称、任务模式与启用状态</small>
            </div>
          </header>
          <el-form-item label="策略名称" required>
            <el-input
              v-model="form.name"
              maxlength="128"
              show-word-limit
              clearable
              placeholder="例如：菲律宾稳健发送 - 即时模式"
            />
          </el-form-item>
          <el-form-item label="任务模式" required>
            <el-radio-group
              v-model="form.taskMode"
              class="mode-grid"
              @change="switchTaskMode"
            >
              <el-radio-button
                v-for="item in STRATEGY_TASK_MODES"
                :key="item.value"
                :value="item.value"
              >
                <b>{{ item.label }}</b>
                <small>{{ item.description }}</small>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch
              v-model="form.enabled"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
            />
            <span class="field-tip"
              >停用后不出现在新建任务的“引用策略”下拉中。</span
            >
          </el-form-item>
        </section>

        <section class="form-section">
          <header class="section-header">
            <span class="section-index">2</span>
            <div>
              <b>账号范围</b><small>与超链任务使用同一套筛选和实时试算</small>
            </div>
          </header>
          <div class="filter-panel">
            <div class="filter-actions">
              <el-button
                type="primary"
                plain
                :loading="contextLoading"
                @click="emit('open-filter')"
              >
                {{ filterTags.length ? "修改筛选条件" : "设置筛选条件" }}
              </el-button>
              <span class="field-tip">固定只圈定当前租户有效账号。</span>
            </div>
            <div v-if="filterTags.length" class="filter-tags">
              <el-tag v-for="tag in filterTags" :key="tag" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
            <el-empty
              v-else
              description="未设置额外筛选条件"
              :image-size="56"
            />
            <el-alert
              v-if="matchError"
              type="error"
              :closable="false"
              class="match-alert"
            >
              <template #title>
                {{ matchError }}
                <el-button link type="primary" @click="emit('retry-match')">
                  重试
                </el-button>
              </template>
            </el-alert>
            <div v-else v-loading="matching" class="match-summary">
              <span>{{ matching ? "正在试算账号范围..." : matchSummary }}</span>
              <el-tag
                v-if="!matching && match?.availableAccountCount === 0"
                type="warning"
                effect="plain"
              >
                当前匹配为 0，仍可保存策略
              </el-tag>
            </div>
          </div>
        </section>

        <section class="form-section">
          <header class="section-header">
            <span class="section-index">3</span>
            <div>
              <b>执行限额</b><small>控制账号并发、使用上限与单号发送上限</small>
            </div>
          </header>
          <el-row :gutter="16">
            <el-col :xs="24" :sm="8">
              <el-form-item label="最大执行账号数" required>
                <el-input-number
                  v-model="form.maxExecutingAccounts"
                  :min="0"
                  :max="100"
                  :precision="0"
                  class="full-width"
                />
                <small
                  >0 表示按账号和协议容量自动均分；固定值范围 1～100。</small
                >
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item
                :label="
                  form.taskMode === 'cycle'
                    ? '每轮最大账号数'
                    : '最大使用账号数'
                "
                :required="form.taskMode === 'cycle'"
              >
                <el-input-number
                  v-model="form.maxUseAccounts"
                  :min="form.taskMode === 'cycle' ? 1 : 0"
                  :precision="0"
                  class="full-width"
                />
                <small>{{
                  form.taskMode === "cycle"
                    ? "周期模式每轮至少 1 个"
                    : "0 表示不限账号数"
                }}</small>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-form-item label="每账号最大发送数">
                <el-input-number
                  v-model="form.maxSendPerAccount"
                  :min="0"
                  :precision="0"
                  class="full-width"
                />
                <small>0 表示不限制单号发送条数。</small>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item
            v-if="form.taskMode === 'cycle'"
            label="周期执行间隔"
            required
          >
            <el-input-number
              v-model="form.cycleIntervalMinutes"
              :min="30"
              :step="10"
              :precision="0"
              class="interval-input"
            />
            <span class="field-tip">分钟 / 轮；策略页下限为 30 分钟。</span>
          </el-form-item>
        </section>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="requestClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="emit('save')">
        {{ editing ? "保存修改" : "创建策略" }}
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.strategy-dialog-body,
form {
  display: grid;
  gap: 14px;
}

.form-section {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.section-header,
.filter-actions,
.filter-tags {
  display: flex;
  gap: 10px;
  align-items: center;
}

.section-header {
  margin-bottom: 16px;
}

.section-header div {
  display: grid;
  gap: 2px;
}

.section-header small,
.field-tip,
.filter-panel small,
.form-section small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-index {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: white;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
}

.mode-grid :deep(.el-radio-button__inner) {
  display: grid;
  gap: 5px;
  width: 100%;
  min-height: 78px;
  padding: 14px 10px;
  white-space: normal;
}

.mode-grid small {
  font-weight: 400;
}

.filter-panel {
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
}

.filter-actions {
  justify-content: space-between;
}

.filter-tags {
  flex-wrap: wrap;
  margin-top: 12px;
}

.match-alert,
.match-summary {
  margin-top: 12px;
}

.match-summary {
  display: flex;
  justify-content: space-between;
  min-height: 32px;
  padding: 8px 10px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.full-width {
  width: 100%;
}

.interval-input {
  width: 220px;
}

@media (width <= 720px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
