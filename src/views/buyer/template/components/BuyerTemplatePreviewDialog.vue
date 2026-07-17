<script setup lang="ts">
import type { BuyerTemplateRow } from "@/api/buyer-template";

defineProps<{
  modelValue: boolean;
  row: BuyerTemplateRow | null;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="row ? `${row.name} - 预览` : '模板预览'"
    width="720px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-image
      v-if="row?.previewUrl"
      class="preview-image"
      :src="row.previewUrl"
      :preview-src-list="[row.previewUrl]"
      fit="contain"
    />
    <el-empty v-else description="暂无预览图" />
  </el-dialog>
</template>

<style scoped>
.preview-image {
  display: block;
  width: 100%;
  max-height: 70vh;
}
</style>
