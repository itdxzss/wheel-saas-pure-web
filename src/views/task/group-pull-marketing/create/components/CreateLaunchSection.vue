<script setup lang="ts">
import {
  showScheduledStart,
  type GroupPullMarketingCreateDraft
} from "../create-draft";

defineOptions({ name: "GroupPullMarketingCreateLaunchSection" });

const draft = defineModel<GroupPullMarketingCreateDraft>({ required: true });
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">5</el-tag>
        <div>
          <strong>任务启动时机</strong>
          <p>创建后立即开始，或指定未来时间启动</p>
        </div>
      </div>
    </template>

    <el-form-item label="任务什么时候开始">
      <el-radio-group v-model="draft.startMode">
        <el-radio-button value="IMMEDIATE">创建后立即开始</el-radio-button>
        <el-radio-button value="SCHEDULED">指定时间开始</el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item
      v-if="showScheduledStart(draft.startMode)"
      label="指定启动时间"
    >
      <el-date-picker
        v-model="draft.scheduledAt"
        type="datetime"
        value-format="YYYY-MM-DD HH:mm:ss"
        placeholder="请选择未来启动时间"
      />
    </el-form-item>

    <el-alert
      title="邀请链接重置能力待后端确认；本阶段不执行链接重置"
      type="warning"
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
</style>
