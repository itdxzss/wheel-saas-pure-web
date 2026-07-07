<script setup lang="ts">
import type { GroupCreationMarketingTaskDetail } from "@/api/group-creation-marketing";
import {
  formatEpoch,
  itemStatusLabel,
  itemStatusTagType,
  taskStatusLabel,
  taskStatusTagType
} from "../constants";

defineOptions({
  name: "GroupCreationMarketingDetailDrawer"
});

defineProps<{
  detail: GroupCreationMarketingTaskDetail | null;
  loading: boolean;
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-drawer v-model="visible" size="76%" destroy-on-close title="建群营销明细">
    <div v-loading="loading" class="detail-drawer">
      <el-descriptions v-if="detail" :column="3" border>
        <el-descriptions-item label="任务名称">
          {{ detail.taskName }}
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag
            size="small"
            :type="taskStatusTagType(detail.status)"
            effect="plain"
          >
            {{ taskStatusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号分组">
          {{ detail.accountGroupName }}
        </el-descriptions-item>
        <el-descriptions-item label="营销模板">
          {{ detail.marketingTemplateName }}
        </el-descriptions-item>
        <el-descriptions-item label="匹配文件">
          {{ detail.matchedItemCount }} 个
        </el-descriptions-item>
        <el-descriptions-item label="未匹配文件">
          {{ detail.unmatchedFileCount }} 个
        </el-descriptions-item>
        <el-descriptions-item label="成功">
          {{ detail.successCount }}
        </el-descriptions-item>
        <el-descriptions-item label="失败">
          {{ detail.failedCount }}
        </el-descriptions-item>
        <el-descriptions-item label="放弃">
          {{ detail.abandonedCount }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatEpoch(detail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{ formatEpoch(detail.finishedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="营销任务ID">
          {{ detail.marketingTaskId || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        class="detail-table"
        :data="detail?.items ?? []"
        row-key="id"
        border
      >
        <el-table-column type="index" label="#" width="56" />
        <el-table-column
          prop="fileName"
          label="料子文件"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column
          prop="accountPhone"
          label="执行账号"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="participantCount" label="号码数" width="90" />
        <el-table-column
          prop="groupSubject"
          label="群名称"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="groupJid"
          label="群JID"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="itemStatusTagType(row.status)"
              effect="plain"
            >
              {{ itemStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reasonMessage || row.reasonCode || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatEpoch(row.updatedAt) }}
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无执行明细" />
        </template>
      </el-table>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer {
  min-height: 320px;
}

.detail-table {
  margin-top: 16px;
}
</style>
