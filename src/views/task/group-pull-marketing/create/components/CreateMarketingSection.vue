<script setup lang="ts">
import { watch } from "vue";
import {
  showSendRounds,
  type GroupPullMarketingCreateDraft,
  type UnmetAction
} from "../create-draft";
import { normalizeThreshold, thresholdMaximum } from "../create-interactions";

defineOptions({ name: "GroupPullMarketingCreateMarketingSection" });

const draft = defineModel<GroupPullMarketingCreateDraft>({ required: true });

const unmetActionOptions: Array<{ label: string; value: UnmetAction }> = [
  { label: "继续补充", value: "CONTINUE" },
  { label: "更换拉手", value: "REPLACE_PULLER" },
  { label: "更换水军", value: "REPLACE_WATER_ARMY" },
  { label: "补充目标数据", value: "SUPPLY_TARGET" },
  { label: "重试", value: "RETRY" },
  { label: "暂停当前群", value: "PAUSE_GROUP" },
  { label: "允许部分完成", value: "PARTIAL_COMPLETE" },
  { label: "转人工", value: "MANUAL" },
  { label: "放弃当前群", value: "ABANDON_GROUP" }
];

watch(
  () => draft.value.waterArmyThresholdMode,
  mode => {
    draft.value.waterArmyThreshold = normalizeThreshold(
      draft.value.waterArmyThreshold,
      mode
    );
  }
);

watch(
  () => draft.value.targetThresholdMode,
  mode => {
    draft.value.targetThreshold = normalizeThreshold(
      draft.value.targetThreshold,
      mode
    );
  }
);
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">4</el-tag>
        <div>
          <strong>目标数据与营销消息</strong>
          <p>最低成功标准、营销模板快照、发送规则与营销开始条件</p>
        </div>
      </div>
    </template>

    <div class="form-grid">
      <el-form-item label="营销发送间隔" required>
        <el-input-number
          v-model="draft.marketingIntervalMinutes"
          :min="1"
          :step="5"
        />
        <span class="field-unit">分钟/次</span>
      </el-form-item>

      <el-form-item label="营销模板" required>
        <el-select
          v-model="draft.marketingTemplateId"
          filterable
          clearable
          placeholder="暂无可选营销模板"
        />
      </el-form-item>

      <el-form-item label="模板版本">
        <el-input model-value="--" readonly />
      </el-form-item>

      <el-form-item label="推广链接">
        <el-input model-value="--" readonly />
      </el-form-item>

      <el-form-item label="模板内容预览" class="span-two">
        <div class="preview-empty">--</div>
      </el-form-item>

      <el-form-item label="立即发送第一条">
        <el-switch
          v-model="draft.sendFirstImmediately"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item label="发送方式">
        <el-radio-group v-model="draft.sendMode">
          <el-radio-button value="ROUNDS">固定发送轮次</el-radio-button>
          <el-radio-button value="DURATION">固定持续时间</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="showSendRounds(draft.sendMode)" label="固定发送轮次">
        <el-input-number v-model="draft.sendRounds" :min="1" />
        <span class="field-unit">轮</span>
      </el-form-item>

      <el-form-item v-else label="固定持续时间">
        <el-input-number v-model="draft.sendDurationMinutes" :min="1" />
        <span class="field-unit">分钟</span>
      </el-form-item>

      <el-form-item label="消息发送总上限">
        <el-input-number v-model="draft.messageLimit" :min="1" />
        <span class="field-unit">条</span>
      </el-form-item>

      <el-form-item label="失败重试次数">
        <el-input-number v-model="draft.sendRetryLimit" :min="0" />
        <span class="field-unit">次</span>
      </el-form-item>

      <el-form-item label="群组异常处理方式">
        <el-select v-model="draft.groupFailureAction">
          <el-option label="暂停当前群" value="PAUSE_GROUP" />
          <el-option label="跳过当前群" value="SKIP_GROUP" />
          <el-option label="转人工" value="MANUAL" />
        </el-select>
      </el-form-item>

      <el-form-item label="营销开始方式">
        <el-select v-model="draft.marketingStartMode">
          <el-option label="达到最低拉人标准后开始" value="MINIMUM_REACHED" />
          <el-option label="拉人结束后开始" value="PULL_COMPLETED" />
        </el-select>
      </el-form-item>

      <el-form-item label="水军最低成功标准" class="threshold-field">
        <el-radio-group v-model="draft.waterArmyThresholdMode">
          <el-radio-button value="COUNT">人数</el-radio-button>
          <el-radio-button value="RATE">成功率</el-radio-button>
        </el-radio-group>
        <el-input-number
          v-model="draft.waterArmyThreshold"
          :min="0"
          :max="thresholdMaximum(draft.waterArmyThresholdMode)"
        />
        <span class="field-unit">
          {{ draft.waterArmyThresholdMode === "COUNT" ? "人" : "%" }}
        </span>
      </el-form-item>

      <el-form-item label="目标数据最低成功标准" class="threshold-field">
        <el-radio-group v-model="draft.targetThresholdMode">
          <el-radio-button value="COUNT">人数</el-radio-button>
          <el-radio-button value="RATE">成功率</el-radio-button>
        </el-radio-group>
        <el-input-number
          v-model="draft.targetThreshold"
          :min="0"
          :max="thresholdMaximum(draft.targetThresholdMode)"
        />
        <span class="field-unit">
          {{ draft.targetThresholdMode === "COUNT" ? "人" : "%" }}
        </span>
      </el-form-item>

      <el-form-item label="未达标处理方式" class="span-two">
        <el-checkbox-group v-model="draft.unmetActions" class="action-grid">
          <el-checkbox
            v-for="option in unmetActionOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </div>

    <el-alert
      title="模板、推广链接和消息内容必须来自真实接口；当前不展示原型示例值"
      type="info"
      :closable="false"
    />
  </el-card>
</template>

<style scoped>
.create-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.section-header strong {
  font-size: 16px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.span-two {
  grid-column: 1 / -1;
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-input-number) {
  flex: 1;
  width: 100%;
}

.field-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.preview-empty {
  width: 100%;
  min-height: 64px;
  padding: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.threshold-field :deep(.el-form-item__content) {
  flex-wrap: nowrap;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

@media (width <= 900px) {
  .form-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .span-two {
    grid-column: auto;
  }
}
</style>
