<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { GroupPullMarketingTaskDetail } from "@/api/group-pull-marketing";
import type { MarketingTemplateRow } from "@/api/marketing-template";
import {
  blockReasonLabel,
  formatEpoch,
  resourceStatusLabel,
  speakPermissionLabel,
  taskStatusLabel
} from "../constants";
import { materialEntryIntervalHint } from "../material-entry-interval";

defineOptions({
  name: "GroupPullMarketingSummary"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  detail: GroupPullMarketingTaskDetail;
  marketingTemplates: MarketingTemplateRow[];
}>();

function groupName(id?: number | null, optional = false): string {
  if (id == null) return optional ? "未配置，账号保留原分组" : "-";
  return props.accountGroups.find(group => group.id === id)?.name ?? `ID ${id}`;
}

function templateName(id: number): string {
  return (
    props.marketingTemplates.find(template => template.id === id)
      ?.templateName ?? `ID ${id}`
  );
}
</script>

<template>
  <el-card shadow="never" class="task-summary">
    <template #header>
      <div class="summary-header">
        <strong>{{ detail.taskName }}</strong>
        <div class="summary-statuses">
          <el-tag effect="plain">{{ taskStatusLabel(detail.status) }}</el-tag>
          <el-tag effect="plain">{{
            blockReasonLabel(detail.blockReason)
          }}</el-tag>
          <el-tag effect="plain">
            {{ resourceStatusLabel(detail.resourceStatus) }}
          </el-tag>
        </div>
      </div>
    </template>

    <el-descriptions :column="3" border>
      <el-descriptions-item label="任务ID">
        {{ detail.id }}
      </el-descriptions-item>
      <el-descriptions-item label="建群账号分组">
        {{ groupName(detail.builderGroupId) }}
      </el-descriptions-item>
      <el-descriptions-item label="营销分组">
        {{ groupName(detail.marketingGroupId) }}
      </el-descriptions-item>
      <el-descriptions-item label="成功转入分组">
        {{ groupName(detail.successGroupId, true) }}
      </el-descriptions-item>
      <el-descriptions-item label="失败转入分组">
        {{ groupName(detail.failureGroupId, true) }}
      </el-descriptions-item>
      <el-descriptions-item label="单营销账号最大群组数">
        {{ detail.marketingAccountGroupLimit }}
      </el-descriptions-item>
      <el-descriptions-item label="营销模板">
        {{ templateName(detail.marketingTemplateId) }}
      </el-descriptions-item>
      <el-descriptions-item label="营销轮次间隔">
        {{ detail.sendIntervalSeconds }} 秒
      </el-descriptions-item>
      <el-descriptions-item label="群名前缀">
        {{ detail.groupNamePrefix || `${detail.taskName}（使用任务名称）` }}
      </el-descriptions-item>
      <el-descriptions-item label="加好友重试次数">
        {{ detail.friendRetryLimit }}
      </el-descriptions-item>
      <el-descriptions-item label="单群抽取数量">
        {{ detail.materialPerGroup }}
      </el-descriptions-item>
      <el-descriptions-item label="拉料间隔">
        {{ detail.materialEntryIntervalSeconds / 60 }} 分钟
        <span class="interval-hint">
          {{
            materialEntryIntervalHint(detail.materialEntryIntervalSeconds / 60)
          }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="群组发言权限">
        {{ speakPermissionLabel(detail.speakPermission) }}
      </el-descriptions-item>
      <el-descriptions-item label="建群账号退出群组">
        {{ detail.builderExitEnabled ? "开启" : "关闭" }}
      </el-descriptions-item>
      <el-descriptions-item label="数据完成量">
        {{ detail.totalDataCount }}/{{ detail.completedDataCount }}
      </el-descriptions-item>
      <el-descriptions-item label="成功/失败群组">
        {{ detail.successGroupCount }}/{{ detail.failedGroupCount }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatEpoch(detail.taskEndAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ detail.remark || "-" }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<style scoped>
.task-summary {
  margin-bottom: 16px;
}

.summary-header,
.summary-statuses {
  display: flex;
  gap: 8px;
  align-items: center;
}

.summary-header {
  justify-content: space-between;
}

.interval-hint {
  display: block;
  color: var(--el-text-color-secondary);
}
</style>
