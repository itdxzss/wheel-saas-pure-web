<script setup lang="ts">
import type {
  DirectLinkPullTaskCreateState,
  DirectLinkPullTaskForm
} from "../composables/useDirectLinkPullTaskCreate";
import PullTaskImmediateCreateContent from "./PullTaskImmediateCreateContent.vue";
defineProps<{ state: DirectLinkPullTaskCreateState }>();
const form = defineModel<DirectLinkPullTaskForm>("form", { required: true });
</script>
<template>
  <PullTaskImmediateCreateContent v-model:form="form" :state="state">
    <template #target>
      <el-card class="direct-card target-card" shadow="never">
        <template #header>
          <div class="section-heading">
            <strong>目标群组</strong><span>选择分组或粘贴链接</span>
          </div>
        </template>
        <el-form-item label="群组分组">
          <el-select
            v-model="form.groupFolderId"
            clearable
            filterable
            placeholder="请选择群组分组"
            class="full-width"
          >
            <el-option
              v-for="folder in state.groupFolders"
              :key="folder.id"
              :label="`${folder.name}（${folder.groupCount} 个群）`"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="群链接">
          <el-input
            v-model="form.linksText"
            type="textarea"
            :rows="4"
            placeholder="每行一个群链接，例如 https://chat.whatsapp.com/…"
          />
        </el-form-item>
        <p class="field-hint">
          群组分组和手工链接任选其一，同时填写时合并使用。
        </p>
        <div class="permission-note">
          拉手踩链接进群后直接拉人，请提前准备好群内加人权限和账号联系人。
        </div>
      </el-card>
    </template>
  </PullTaskImmediateCreateContent>
</template>
<style scoped>
.full-width {
  width: 100%;
}

.section-heading {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.permission-note {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
}
</style>
