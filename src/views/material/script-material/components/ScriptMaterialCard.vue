<script setup lang="ts">
import { computed } from "vue";
import type { ScriptMaterial } from "@/api/script-library";
import ScriptMaterialPreview from "./ScriptMaterialPreview.vue";

const props = defineProps<{ material: ScriptMaterial; copying: boolean }>();
defineEmits<{
  preview: [material: ScriptMaterial];
  edit: [material: ScriptMaterial];
  copy: [material: ScriptMaterial];
}>();

const kind = computed(() => {
  if (props.material.linkMode === 2)
    return { label: "按钮消息", type: "success" as const };
  if (props.material.linkMode === 3)
    return { label: "图片 / 图文", type: "warning" as const };
  return { label: "文字 / 链接", type: "primary" as const };
});
</script>

<template>
  <el-card shadow="hover" class="material-card" :body-style="{ padding: 0 }">
    <div class="material-heading">
      <el-tag :type="kind.type" size="small" effect="light">{{
        kind.label
      }}</el-tag>
      <span class="material-id">#{{ material.id }}</span>
    </div>
    <ScriptMaterialPreview :message="material" compact />
    <div class="material-name" :title="material.templateName">
      {{ material.templateName }}
    </div>
    <div class="material-actions">
      <el-button link type="primary" @click="$emit('preview', material)"
        >预览</el-button
      >
      <el-button
        v-perms="'tenant:script_marketing:edit'"
        link
        type="primary"
        @click="$emit('edit', material)"
        >编辑</el-button
      >
      <el-button
        v-perms="'tenant:script_marketing:create'"
        link
        :loading="copying"
        :disabled="copying"
        @click="$emit('copy', material)"
        >复制</el-button
      >
    </div>
  </el-card>
</template>

<style scoped>
.material-card {
  min-width: 0;
  border-radius: 8px;
}

.material-heading,
.material-actions {
  display: flex;
  align-items: center;
  padding: 12px 14px;
}

.material-heading {
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.material-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.material-name {
  padding: 12px 14px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  border-top: 1px solid var(--el-border-color-lighter);
}

.material-actions {
  gap: 16px;
}

.material-actions .el-button + .el-button {
  margin-left: 0;
}
</style>
