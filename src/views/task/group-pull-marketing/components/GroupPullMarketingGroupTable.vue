<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { GroupPullMarketingGroupRow } from "@/api/group-pull-marketing";
import {
  builderExitStatusLabel,
  executionStageLabel,
  executionStatusLabel,
  formatEpoch,
  groupLinkMeta,
  groupStatusLabel,
  groupStatusTagType,
  marketerAdminStatusLabel,
  marketingSendStatusLabel,
  speakPermissionLabel
} from "../constants";

defineOptions({
  name: "GroupPullMarketingGroupTable"
});

const props = defineProps<{
  loading: boolean;
  page: number;
  pageSize: number;
  rows: GroupPullMarketingGroupRow[];
  total: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});

const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function linkMeta(row: GroupPullMarketingGroupRow) {
  return groupLinkMeta(row);
}

async function copyGroupLink(row: GroupPullMarketingGroupRow): Promise<void> {
  const meta = linkMeta(row);
  if (!meta.available || !meta.url) return;
  try {
    await navigator.clipboard.writeText(meta.url);
    ElMessage.success("群链接已复制");
  } catch {
    ElMessage.error("群链接复制失败，请手动复制");
  }
}
</script>

<template>
  <el-card shadow="never">
    <el-table v-loading="loading" :data="rows" row-key="executionId" border>
      <el-table-column label="序号" width="70">
        <template #default="{ $index }">
          {{ (page - 1) * pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column
        prop="builderAccountPhone"
        label="建群账号"
        min-width="155"
        show-overflow-tooltip
      />
      <el-table-column
        prop="marketingAccountPhone"
        label="营销账号"
        min-width="155"
        show-overflow-tooltip
      />
      <el-table-column
        prop="groupName"
        label="群名称"
        min-width="170"
        show-overflow-tooltip
      />
      <el-table-column label="群链接" min-width="260">
        <template #default="{ row }">
          <div class="group-link-cell">
            <span class="group-link-text">{{ linkMeta(row).label }}</span>
            <template v-if="linkMeta(row).available">
              <el-link
                :href="linkMeta(row).url || undefined"
                target="_blank"
                rel="noopener noreferrer"
                type="primary"
              >
                打开
              </el-link>
              <el-button link type="primary" @click="copyGroupLink(row)">
                复制
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="群状态" width="100">
        <template #default="{ row }">
          <el-tag
            size="small"
            effect="plain"
            :type="groupStatusTagType(row.groupStatus)"
          >
            {{ groupStatusLabel(row.groupStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="materialJoinedCount"
        label="进群人数"
        width="100"
      />
      <el-table-column label="群人数" width="90">
        <template #default="{ row }">
          {{ row.groupMemberCount == null ? "-" : row.groupMemberCount }}
        </template>
      </el-table-column>
      <el-table-column
        prop="sentMessageCount"
        label="营销号发送条数"
        width="140"
      />
      <el-table-column label="发言权限" width="110">
        <template #default="{ row }">
          {{ speakPermissionLabel(row.speakPermission) }}
        </template>
      </el-table-column>
      <el-table-column label="建群账号退出配置" width="140">
        <template #default="{ row }">
          {{ row.builderExitEnabled ? "开启" : "关闭" }}
        </template>
      </el-table-column>
      <el-table-column label="退群状态" width="110">
        <template #default="{ row }">
          {{ builderExitStatusLabel(row.builderExitStatus) }}
        </template>
      </el-table-column>
      <el-table-column label="管理员状态" width="110">
        <template #default="{ row }">
          {{ marketerAdminStatusLabel(row.marketerAdminStatus) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="175">
        <template #default="{ row }">
          {{ formatEpoch(row.groupCreatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="建群执行结果" width="120">
        <template #default="{ row }">
          {{ executionStatusLabel(row.executionStatus) }}
        </template>
      </el-table-column>
      <el-table-column label="失败阶段" min-width="130">
        <template #default="{ row }">
          {{ executionStageLabel(row.failureStage) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="failureReason"
        label="失败原因"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column label="营销发送状态" width="120">
        <template #default="{ row }">
          {{ marketingSendStatusLabel(row.marketingSendStatus) }}
        </template>
      </el-table-column>
      <el-table-column label="最后发送时间" min-width="175">
        <template #default="{ row }">
          {{ formatEpoch(row.lastSentAt) }}
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无群组明细" />
      </template>
    </el-table>

    <WheelPagination
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :total="total"
      @change="emit('refresh')"
    />
  </el-card>
</template>

<style scoped>
.group-link-cell {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.group-link-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
