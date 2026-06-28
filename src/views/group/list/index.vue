<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import GroupListTable from "./components/GroupListTable.vue";
import GroupMemberDrawer from "./components/GroupMemberDrawer.vue";
import {
  groupListColumns,
  groupOriginOptions,
  groupStatusOptions,
  membershipStateOptions
} from "./constants";
import { useGroupListPage } from "./composables/useGroupListPage";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "GroupList"
});

const {
  closeMemberDrawer,
  deleteGroup,
  deleteSelectedGroups,
  drawerGroup,
  drawerOpen,
  loading,
  onDrawerRefresh,
  onSelectionChange,
  openJoinTask,
  openMemberDrawer,
  page,
  pageSize,
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
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="group-list-keyword"
            placeholder="搜索：群名称 / 群链接 / 管理员 / 来源文件"
            @keyup.enter="searchGroups"
          />
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
        <el-form-item label="来源文件">
          <el-input
            v-model="searchForm.sourceFileName"
            clearable
            class="group-list-control"
            placeholder="请输入来源文件"
            @keyup.enter="searchGroups"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select
            v-model="searchForm.origin"
            class="group-list-control"
            placeholder="全部来源"
          >
            <el-option
              v-for="item in groupOriginOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系">
          <el-select
            v-model="searchForm.membershipState"
            class="group-list-control"
            placeholder="全部关系"
          >
            <el-option
              v-for="item in membershipStateOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchGroups"
          >
            搜索
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
      @delete-selected="deleteSelectedGroups"
      @refresh="refreshGroups"
      @row-action="handleRowAction"
      @selection-change="onSelectionChange"
    />

    <GroupMemberDrawer
      v-model="drawerOpen"
      :group="drawerGroup"
      @refresh="onDrawerRefresh"
      @update:model-value="value => !value && closeMemberDrawer()"
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
</style>
