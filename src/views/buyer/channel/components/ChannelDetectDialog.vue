<script setup lang="ts">
import type { ChannelDetectResult } from "@/api/buyer-channel";

defineProps<{ modelValue: boolean; result: ChannelDetectResult | null }>();
defineEmits<{ (event: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="渠道检测结果"
    width="520px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-result
      v-if="result"
      :icon="result.success ? 'success' : 'error'"
      :title="result.success ? '检测通过' : '检测未通过'"
      :sub-title="result.summary"
    >
      <template #extra
        ><el-text type="info"
          >检测时间：{{ result.checkedAt }}</el-text
        ></template
      >
    </el-result>
    <el-empty v-else description="暂无检测结果" />
  </el-dialog>
</template>
