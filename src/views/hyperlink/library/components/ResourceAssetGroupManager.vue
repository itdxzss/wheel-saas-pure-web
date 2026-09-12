<script setup lang="ts">
import { formatAssetGroupLabel } from "../domain/resource-asset";
import { ref, watch } from "vue";
import type { ResourceAssetGroup } from "@/api/resource-asset";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{
  groups: ResourceAssetGroup[];
  busy: boolean;
  editPermission: string;
  deletePermission: string;
}>();
defineEmits<{
  (event: "create", name: string): void;
  (event: "remove", group: ResourceAssetGroup): void;
}>();
const name = ref("");
watch(
  () => props.groups,
  () => {
    name.value = "";
  }
);
watch(visible, () => {
  name.value = "";
});
</script>

<template>
  <el-dialog
    v-model="visible"
    title="管理素材分组"
    width="min(560px, calc(100vw - 32px))"
  >
    <el-form
      v-auth="editPermission"
      inline
      @submit.prevent="$emit('create', name)"
    >
      <el-form-item label="分组名称">
        <el-input
          v-model="name"
          maxlength="64"
          placeholder="输入新分组名称"
          :disabled="busy"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :loading="busy"
          :disabled="!name.trim()"
          @click="$emit('create', name)"
          >新增分组</el-button
        >
      </el-form-item>
    </el-form>
    <el-alert
      title="删除分组后，图片移到“未分组”，已有模板引用保持有效。"
      type="info"
      :closable="false"
    />
    <el-table
      :data="groups"
      max-height="360"
      empty-text="暂无分组，可先创建一个"
    >
      <el-table-column prop="groupName" label="分组名称" show-overflow-tooltip>
        <template #default="{ row }">{{ formatAssetGroupLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button
            v-auth="deletePermission"
            link
            type="danger"
            :disabled="busy"
            @click="$emit('remove', row)"
            >删除分组</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
