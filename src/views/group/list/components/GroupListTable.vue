<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { GroupListRow } from "@/api/group";
import { formatEpochMillis as formatEpoch } from "@/utils/time";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "GroupListTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: GroupListRow[];
  selectedCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: "assign-folder"): void;
  (event: "delete-selected"): void;
  (event: "manage-folders"): void;
  (event: "refresh"): void;
  (event: "row-action", row: GroupListRow, action: string): void;
  (event: "selection-change", rows: GroupListRow[]): void;
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

function displayGroupName(row: GroupListRow): string {
  return row.groupName || row.waSubject || `群组 ${row.id}`;
}

function statusType(row: GroupListRow) {
  if (row.status === "AVAILABLE") return "success";
  if (row.status === "BANNED" || row.status === "LINK_INVALID") {
    return "danger";
  }
  if (row.status === "UNAVAILABLE") return "warning";
  return "info";
}

function statusLabel(row: GroupListRow): string {
  return row.statusLabel || row.status || "未检测";
}

function avatarText(row: GroupListRow): string {
  return displayGroupName(row).slice(0, 1) || "群";
}

function formatGroupCreatedAt(value: number | null | undefined): string {
  return value == null ? "-" : formatEpoch(value * 1000);
}
</script>

<template>
  <PureTableBar title="群组列表" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button @click="emit('manage-folders')">管理群组分组</el-button>
      <el-button
        type="primary"
        plain
        :disabled="selectedCount === 0"
        @click="emit('assign-folder')"
      >
        批量分组
        <span v-if="selectedCount">({{ selectedCount }})</span>
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="selectedCount === 0"
        :icon="useRenderIcon(Delete)"
        @click="emit('delete-selected')"
      >
        批量删除
        <span v-if="selectedCount">({{ selectedCount }})</span>
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        @selection-change="emit('selection-change', $event)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="expand" width="46">
          <template #default="{ row }">
            <el-descriptions class="group-detail" :column="2" border>
              <el-descriptions-item label="groupJid">
                {{ row.groupJid || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="群主">
                {{ row.ownerPhone || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="群关系">
                {{ row.membershipStateLabel || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="最近解析">
                {{ formatEpoch(row.lastPreviewAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="最近检测">
                {{ formatEpoch(row.lastCheckAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="检测原因">
                {{ row.lastHealthError || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ row.remark || "-" }}
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!dynamicColumns[0].hide"
          label="群名称"
          min-width="220"
        >
          <template #default="{ row }">
            <div class="group-name-cell">
              <el-avatar v-if="row.avatarUrl" :src="row.avatarUrl" />
              <el-avatar v-else>{{
                avatarText(row as GroupListRow)
              }}</el-avatar>
              <div>
                <strong>{{ displayGroupName(row as GroupListRow) }}</strong>
                <small>{{ row.remark || "暂无备注" }}</small>
                <div class="group-type-tags">
                  <el-tag v-if="row.isHistorical" size="small" type="warning">
                    历史群
                  </el-tag>
                  <el-tag v-if="row.isPostControl" size="small" type="success">
                    上控后群
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          label="群组分组"
          min-width="130"
        >
          <template #default="{ row }">
            {{ row.folderName || "未分组" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="成员数"
          width="100"
        >
          <template #default="{ row }">
            {{ row.memberCount != null ? `${row.memberCount}人` : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="邀请链接"
          min-width="240"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-link
              v-if="row.inviteUrl"
              :href="row.inviteUrl"
              target="_blank"
              type="primary"
            >
              {{ row.inviteUrl }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="全部管理员号码"
          min-width="190"
        >
          <template #default="{ row }">
            <div v-if="row.adminPhones?.length" class="admin-phone-list">
              <el-tag
                v-for="phone in row.adminPhones"
                :key="phone"
                size="small"
                type="info"
              >
                {{ phone }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          label="状态"
          width="110"
        >
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row as GroupListRow)">
              {{ statusLabel(row as GroupListRow) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="可用管理员"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.availableAdmin ? 'success' : 'danger'"
            >
              {{
                row.availableAdmin
                  ? `可用 ${row.availableAdminCount || 0}`
                  : "不可用"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="创建信息"
          min-width="210"
        >
          <template #default="{ row }">
            <div class="creation-info">
              <span
                >{{ row.creatorCountryFlag || "" }}
                {{ row.creatorCountryName || "-" }}</span
              >
              <span>创建者：{{ row.creatorPhone || "-" }}</span>
              <span>建群：{{ formatGroupCreatedAt(row.groupCreatedAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          prop="groupJid"
          label="群 JID"
          min-width="210"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.groupJid || "-" }}</template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[9].hide"
          label="操作"
          fixed="right"
          width="220"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('row-action', row as GroupListRow, 'info')"
            >
              群组信息
            </el-button>
            <el-button
              link
              type="primary"
              @click="emit('row-action', row as GroupListRow, 'join')"
            >
              进群任务
            </el-button>
            <el-button
              link
              type="danger"
              @click="emit('row-action', row as GroupListRow, 'delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty
            description="暂无群组数据，请先导入群链接或创建进群任务。"
          />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </template>
  </PureTableBar>
</template>

<style scoped>
.group-name-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.group-name-cell small {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.group-detail {
  margin: 8px 16px;
}

.group-type-tags,
.admin-phone-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.creation-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
}
</style>
