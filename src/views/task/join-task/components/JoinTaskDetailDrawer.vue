<script setup lang="ts">
import type { JoinResultRow, JoinTaskDetail } from "@/api/join-task";
import {
  failurePolicyLabel,
  formatEpoch,
  joinResultStatusLabel,
  joinResultStatusTagType,
  joinTaskDistributionLabel,
  joinTaskStatusLabel,
  joinTaskStatusTagType
} from "../constants";

defineOptions({
  name: "JoinTaskDetailDrawer"
});

defineProps<{
  detail: JoinTaskDetail | null;
  loading: boolean;
  results: JoinResultRow[];
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-drawer v-model="visible" size="72%" destroy-on-close title="进群任务详情">
    <div v-loading="loading" class="detail-drawer">
      <el-descriptions v-if="detail" :column="3" border>
        <el-descriptions-item label="任务名称">
          {{ detail.name }}
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag
            size="small"
            :type="joinTaskStatusTagType(detail.status)"
            effect="plain"
          >
            {{ joinTaskStatusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatEpoch(detail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="账号分组">
          {{ detail.accountGroupNames || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="分配方式">
          {{ joinTaskDistributionLabel(detail.distributionMode) }}
        </el-descriptions-item>
        <el-descriptions-item label="进群间隔">
          {{ detail.intervalLabel || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="计划总数">
          {{ detail.total }}
        </el-descriptions-item>
        <el-descriptions-item label="已执行">
          {{ detail.executed }}
        </el-descriptions-item>
        <el-descriptions-item label="成功 / 失败">
          {{ detail.success }} / {{ detail.failed }}
        </el-descriptions-item>
        <el-descriptions-item label="失败策略">
          {{ failurePolicyLabel(detail.failurePolicy) }}
        </el-descriptions-item>
        <el-descriptions-item label="失败重试">
          {{ detail.retryEnabled ? `${detail.retryLimit} 次` : "关闭" }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatEpoch(detail.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="section-title">进群明细</div>
      <el-table class="detail-table" :data="results" border>
        <el-table-column
          prop="account"
          label="账号"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="account-cell">
              <span>{{ row.account || "-" }}</span>
              <small>{{
                row.isAdmin ? "已被设置为管理" : "未被设置为管理"
              }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="link"
          label="群链接"
          min-width="300"
          show-overflow-tooltip
        />
        <el-table-column label="进群状态" width="120">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="joinResultStatusTagType(row.status)"
              effect="plain"
            >
              {{ joinResultStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="reason"
          label="原因"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.reasonLabel || row.reason || "-" }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer {
  min-height: 320px;
}

.section-title {
  margin: 18px 0 10px;
  font-weight: 600;
}

.detail-table {
  width: 100%;
}

.account-cell span,
.account-cell small {
  display: block;
}

.account-cell small {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
}
</style>
