<script setup lang="ts">
import type { MarketingTaskRow } from "@/api/marketing-task";
import { marketingTemplateValue } from "./marketing-template-info";

defineOptions({
  name: "GroupMarketingTemplatePreviewDialog"
});

defineProps<{
  task: MarketingTaskRow | null;
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`营销模板：${task?.marketingTemplateName || '—'}`"
    width="640px"
    destroy-on-close
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item label="内容">
        <div class="template-full-text">
          {{ marketingTemplateValue(task?.marketingTemplateContent) }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="文本">
        <div class="template-full-text">
          {{ marketingTemplateValue(task?.marketingTemplateBodyText) }}
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<style scoped>
.template-full-text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
