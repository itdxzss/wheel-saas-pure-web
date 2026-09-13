<script setup lang="ts">
import {
  groupRowStatusOptions,
  standardStageOptions,
  standardWaitResourceOptions
} from "../constants";
import type { PullTaskDetailSearchForm } from "../composables/usePullTaskPage";

defineProps<{ normalLink: boolean; newGroupMode: boolean }>();
const searchForm = defineModel<PullTaskDetailSearchForm>({ required: true });
const emit = defineEmits<{
  (event: "refresh-detail-groups"): void;
  (event: "reset-detail-search"): void;
  (event: "run-group-operation", operation: string): void;
  (event: "run-rows-operation", operation: string): void;
}>();
</script>

<template>
  <el-form :model="searchForm" inline class="detail-search">
    <el-form-item label="任务情况">
      <el-select v-model="searchForm.status" clearable class="search-select">
        <el-option
          v-for="item in groupRowStatusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item :label="newGroupMode ? '群名 / 料子' : '群链接'">
      <el-input
        v-model="searchForm.keyword"
        clearable
        class="search-keyword"
        :placeholder="newGroupMode ? '群名 / 料子包名称' : '群名 / 群链接'"
        @keyup.enter="emit('refresh-detail-groups')"
      />
    </el-form-item>
    <el-form-item v-if="normalLink" label="当前阶段">
      <el-select v-model="searchForm.stage" clearable class="search-select">
        <el-option
          v-for="item in standardStageOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="normalLink" label="资源异常">
      <el-select
        v-model="searchForm.waitResourceType"
        clearable
        class="search-select"
      >
        <el-option
          v-for="item in standardWaitResourceOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="emit('refresh-detail-groups')">
        查询
      </el-button>
      <el-button @click="emit('reset-detail-search')">重置</el-button>
      <el-dropdown
        v-if="!normalLink"
        @command="op => emit('run-group-operation', op)"
      >
        <el-button>批量群组操作</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="CHECK_STATUS">
              批量检测群状态
            </el-dropdown-item>
            <el-dropdown-item command="SET_ADMIN">
              批量设置管理员
            </el-dropdown-item>
            <el-dropdown-item command="REFRESH_LINK">
              批量刷新群链接
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown
        v-if="!normalLink"
        @command="op => emit('run-rows-operation', op)"
      >
        <el-button>批量任务操作</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="END">批量完成任务</el-dropdown-item>
            <el-dropdown-item command="PAUSE">批量暂停任务</el-dropdown-item>
            <el-dropdown-item command="RESTART">批量重启任务</el-dropdown-item>
            <el-dropdown-item command="UNSUBMIT">取消交单标记</el-dropdown-item>
            <el-dropdown-item command="START">批量启动任务</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.detail-search {
  padding: 12px 12px 0;
  margin-bottom: 16px;
  background: var(--el-fill-color-lighter);
}

.search-keyword {
  width: 220px;
}

.search-select {
  width: 150px;
}
</style>
