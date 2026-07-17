<script setup lang="ts">
import { computed } from "vue";
import type {
  HistoricalGroupAddStatus,
  HistoricalGroupContactStatus,
  HistoricalGroupMarketingStatus,
  HistoricalGroupPullExecution,
  HistoricalGroupPullStatus,
  HistoricalGroupSendStatus
} from "@/api/historical-group";

defineOptions({
  name: "HistoricalGroupExecutionResult"
});

const props = defineProps<{
  execution: HistoricalGroupPullExecution;
  polling: boolean;
}>();

type TagType = "primary" | "success" | "warning" | "info" | "danger";

const pullStatusMeta: Record<
  HistoricalGroupPullStatus,
  { label: string; type: TagType }
> = {
  PENDING: { label: "待启动", type: "info" },
  RUNNING: { label: "拉人中", type: "primary" },
  SUCCESS: { label: "拉人成功", type: "success" },
  PARTIAL_SUCCESS: { label: "部分成功", type: "warning" },
  FAILED: { label: "拉人失败", type: "danger" }
};

const marketingStatusMeta: Record<
  HistoricalGroupMarketingStatus,
  { label: string; type: TagType }
> = {
  NOT_APPLICABLE: { label: "无营销账号", type: "info" },
  NOT_STARTED: { label: "未发送", type: "info" },
  SENDING: { label: "发送中", type: "primary" },
  SUCCESS: { label: "发送成功", type: "success" },
  PARTIAL_SUCCESS: { label: "部分成功", type: "warning" },
  FAILED: { label: "发送失败", type: "danger" }
};

const contactLabels: Record<HistoricalGroupContactStatus, string> = {
  PENDING: "待保存",
  SUCCESS: "保存成功",
  FAILED: "保存失败"
};

const addLabels: Record<HistoricalGroupAddStatus, string> = {
  PENDING: "待添加",
  SUCCESS: "添加成功",
  FAILED: "添加失败"
};

const sendLabels: Record<HistoricalGroupSendStatus, string> = {
  NOT_APPLICABLE: "不适用",
  PENDING: "待发送",
  SENDING: "发送中",
  SUCCESS: "发送成功",
  FAILED: "发送失败"
};

const totalCount = computed(() => {
  const counted =
    (props.execution.normalCount ?? 0) +
    (props.execution.marketingCount ?? 0) +
    (props.execution.invalidCount ?? 0) +
    (props.execution.duplicateCount ?? 0);
  return counted || props.execution.members.length;
});
</script>

<template>
  <section class="execution-result">
    <div class="result-title">
      <strong>拉人及营销执行结果</strong>
      <el-tag
        :type="pullStatusMeta[execution.pullStatus].type"
        :effect="polling ? 'dark' : 'light'"
      >
        {{ pullStatusMeta[execution.pullStatus].label }}
      </el-tag>
      <el-tag :type="marketingStatusMeta[execution.marketingStatus].type">
        {{ marketingStatusMeta[execution.marketingStatus].label }}
      </el-tag>
    </div>

    <el-descriptions :column="4" border>
      <el-descriptions-item label="执行 ID">
        {{ execution.id }}
      </el-descriptions-item>
      <el-descriptions-item label="材料总数">
        {{ totalCount }}
      </el-descriptions-item>
      <el-descriptions-item label="普通号码数">
        {{ execution.normalCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="营销账号数">
        {{ execution.marketingCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="无效号码数">
        {{ execution.invalidCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="重复号码数">
        {{ execution.duplicateCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="拉人成功数">
        {{ execution.pullSuccessCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="拉人失败数">
        {{ execution.pullFailureCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="营销成功数">
        {{ execution.sendSuccessCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="营销失败数">
        {{ execution.sendFailureCount ?? 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="随机拉手账号">
        <span class="full-value">{{ execution.pullerPhone || "-" }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="随机拉手账号 ID">
        {{ execution.pullerAccountId ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="完整拉手 JID" :span="2">
        <span class="full-value">{{
          execution.pullerParticipantJid || "-"
        }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="失败阶段" :span="4">
        <span class="full-value">{{ execution.failureStage || "-" }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="完整执行错误码" :span="2">
        <span class="full-value">{{ execution.errorCode || "-" }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="完整执行错误信息" :span="2">
        <span class="full-value">{{ execution.errorMessage || "-" }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <el-table :data="execution.members" row-key="phone">
      <el-table-column label="材料类型" width="110">
        <template #default="{ row }">
          {{ row.materialType === "MARKETING" ? "营销账号" : "普通号码" }}
        </template>
      </el-table-column>
      <el-table-column label="完整号码" min-width="150">
        <template #default="{ row }">
          <span class="full-value">{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column label="完整成员 JID" min-width="250">
        <template #default="{ row }">
          <span class="full-value">{{ row.participantJid || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="联系人状态" width="110">
        <template #default="{ row }">
          {{ contactLabels[row.contactStatus] }}
        </template>
      </el-table-column>
      <el-table-column label="完整联系人错误" min-width="240">
        <template #default="{ row }">
          <div class="full-value">{{ row.contactErrorCode || "-" }}</div>
          <div class="full-value">{{ row.contactErrorMessage || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="添加状态" width="110">
        <template #default="{ row }">
          {{ addLabels[row.addStatus] }}
        </template>
      </el-table-column>
      <el-table-column label="完整添加错误" min-width="240">
        <template #default="{ row }">
          <div class="full-value">{{ row.addErrorCode || "-" }}</div>
          <div class="full-value">{{ row.addErrorMessage || "-" }}</div>
        </template>
      </el-table-column>
      <el-table-column label="营销账号" min-width="200">
        <template #default="{ row }">
          <div>账号 ID：{{ row.accountId ?? "-" }}</div>
          <div class="full-value">
            协议账号：{{ row.protocolAccountId || "-" }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="发送状态" width="110">
        <template #default="{ row }">
          {{ sendLabels[row.sendStatus] }}
        </template>
      </el-table-column>
      <el-table-column label="完整消息 ID" min-width="250">
        <template #default="{ row }">
          <div class="full-value">命令：{{ row.sendCommandId || "-" }}</div>
          <div class="full-value">
            结果事件：{{ row.sendResultEventId || "-" }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="完整发送错误" min-width="260">
        <template #default="{ row }">
          <div class="full-value">{{ row.sendErrorCode || "-" }}</div>
          <div class="full-value">{{ row.sendErrorMessage || "-" }}</div>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.execution-result :deep(.el-table) {
  margin-top: 16px;
}

.full-value {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
