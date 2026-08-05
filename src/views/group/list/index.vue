<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import BatchAssignFolderDialog from "./components/BatchAssignFolderDialog.vue";
import GroupFolderManageDialog from "./components/GroupFolderManageDialog.vue";
import GroupListTable from "./components/GroupListTable.vue";
import GroupMemberDrawer from "./components/GroupMemberDrawer.vue";
import HistoricalGroupFilterDrawer from "./components/HistoricalGroupFilterDrawer.vue";
import {
  availableAdminOptions,
  groupListColumns,
  groupStatusOptions,
  groupTypeOptions
} from "./constants";
import { useGroupListPage } from "./composables/useGroupListPage";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "GroupList"
});

const {
  assignFolderDialogOpen,
  assigningFolder,
  assignSelectedFolder,
  applyHistoricalFilter,
  clearHistoricalDraft,
  closeHistoricalFilter,
  closeMemberDrawer,
  deleteGroup,
  deleteSelectedGroups,
  drawerGroup,
  drawerOpen,
  countryOptions,
  countryOptionsLoading,
  folderOptions,
  folderOptionsLoading,
  groupFolderManageOpen,
  historicalApplied,
  historicalAppliedCount,
  historicalDraft,
  historicalDrawerOpen,
  loading,
  onGroupFoldersChanged,
  onDrawerRefresh,
  onSelectionChange,
  openAssignFolder,
  openGroupFolderManage,
  openHistoricalFilter,
  openJoinTask,
  openMemberDrawer,
  page,
  pageSize,
  queryHistoricalFilter,
  refreshGroups,
  resetSearchForm,
  rows,
  searchForm,
  searchGroups,
  selectedCount,
  total
} = useGroupListPage();

function handleRowAction(row, action: string): void {
  if (action === "info") {
    openMemberDrawer(row);
  } else if (action === "join") {
    openJoinTask(row);
  } else if (action === "delete") {
    void deleteGroup(row);
  }
}
</script>

<template>
  <div class="group-list-page">
    <div class="group-list-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="群信息">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="group-list-keyword"
            placeholder="群名称 / 邀请链接 / 群JID / 管理员"
            @keyup.enter="searchGroups"
          />
        </el-form-item>
        <el-form-item label="群组分组">
          <el-select
            v-model="searchForm.folderFilter"
            class="group-list-control"
            placeholder="全部分组"
            :loading="folderOptionsLoading"
          >
            <el-option label="全部分组" value="" />
            <el-option label="未分组" value="UNASSIGNED" />
            <el-option
              v-for="item in folderOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="群类型">
          <el-select
            v-model="searchForm.groupType"
            class="group-list-control"
            placeholder="全部群组"
          >
            <el-option
              v-for="item in groupTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            class="group-list-control"
            placeholder="全部状态"
          >
            <el-option
              v-for="item in groupStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="可用管理员">
          <el-select
            v-model="searchForm.availableAdmin"
            class="group-list-control"
            placeholder="全部"
          >
            <el-option
              v-for="item in availableAdminOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="群成员数量">
          <div class="member-range-filter">
            <el-input-number
              v-model="historicalApplied.memberCountMin"
              :min="0"
              controls-position="right"
              placeholder="最小"
            />
            <span>至</span>
            <el-input-number
              v-model="historicalApplied.memberCountMax"
              :min="0"
              controls-position="right"
              placeholder="最大"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button @click="openHistoricalFilter">
            历史群组筛选
            <el-badge
              v-if="historicalAppliedCount"
              :value="historicalAppliedCount"
              class="filter-count"
            />
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchGroups"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <GroupListTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="groupListColumns"
      :loading="loading"
      :rows="rows"
      :selected-count="selectedCount"
      :total="total"
      @assign-folder="openAssignFolder"
      @delete-selected="deleteSelectedGroups"
      @manage-folders="openGroupFolderManage"
      @refresh="refreshGroups"
      @row-action="handleRowAction"
      @selection-change="onSelectionChange"
    />

    <BatchAssignFolderDialog
      v-model="assignFolderDialogOpen"
      :loading="assigningFolder"
      :options="folderOptions"
      :selected-count="selectedCount"
      @submit="assignSelectedFolder"
    />

    <GroupFolderManageDialog
      v-model="groupFolderManageOpen"
      @changed="onGroupFoldersChanged"
    />

    <GroupMemberDrawer
      v-model="drawerOpen"
      :group="drawerGroup"
      @refresh="onDrawerRefresh"
      @update:model-value="value => !value && closeMemberDrawer()"
    />

    <HistoricalGroupFilterDrawer
      v-model="historicalDrawerOpen"
      :value="historicalDraft"
      :countries="countryOptions"
      :loading="countryOptionsLoading"
      @update:value="value => Object.assign(historicalDraft, value)"
      @clear="clearHistoricalDraft"
      @apply="applyHistoricalFilter"
      @query="queryHistoricalFilter"
      @close="closeHistoricalFilter"
    />
  </div>
</template>

<style scoped>
.group-list-page {
  padding: 16px;
}

.group-list-search {
  padding: 16px 16px 0;
  margin-bottom: 12px;
}

.group-list-keyword {
  width: 320px;
}

.group-list-control {
  width: 180px;
}

.member-range-filter {
  display: grid;
  grid-template-columns: 120px auto 120px;
  gap: 8px;
  align-items: center;
}

.filter-count {
  margin-left: 8px;
}
</style>
