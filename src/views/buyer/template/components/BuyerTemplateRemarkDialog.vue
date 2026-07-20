<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  remark: string;
  loading: boolean;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:remark", value: string): void;
  (event: "save"): void;
}>();
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑备注"
    width="520px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-input
      :model-value="remark"
      type="textarea"
      :rows="6"
      maxlength="500"
      show-word-limit
      placeholder="请输入备注，可留空"
      @update:model-value="$emit('update:remark', $event)"
    />
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="$emit('save')">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
