<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { GroupFolderOption } from "@/api/group-folder";

defineOptions({
  name: "BatchAssignFolderDialog"
});

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  options: GroupFolderOption[];
  selectedCount: number;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "submit", folderId: number | null): void;
}>();

const selectedFolderId = ref<number | "UNASSIGNED" | "">("");

watch(
  () => props.modelValue,
  visible => {
    if (visible) selectedFolderId.value = "";
  }
);

function close(): void {
  if (!props.loading) emit("update:modelValue", false);
}

function submit(): void {
  if (selectedFolderId.value === "") {
    ElMessage.warning("请选择目标分组");
    return;
  }
  emit(
    "submit",
    selectedFolderId.value === "UNASSIGNED" ? null : selectedFolderId.value
  );
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="批量分组"
    width="480px"
    destroy-on-close
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @update:model-value="value => !value && close()"
  >
    <el-alert
      :title="`已选择 ${selectedCount} 个群组`"
      type="info"
      :closable="false"
      show-icon
    />
    <el-form class="assign-folder-form" label-position="top">
      <el-form-item label="目标分组" required>
        <el-select
          v-model="selectedFolderId"
          class="assign-folder-select"
          placeholder="请选择分组"
          filterable
        >
          <el-option label="不绑定（转入未分组）" value="UNASSIGNED" />
          <el-option
            v-for="option in options"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="loading" @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        确认分组
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.assign-folder-form {
  margin-top: 18px;
}

.assign-folder-select {
  width: 100%;
}
</style>
