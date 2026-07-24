<script setup lang="ts">
import { computed } from "vue";
import type { BuyerTemplateRow } from "@/api/buyer-template";
import { dateV2MockProfiles } from "../../../../../mock/date-v2-preview";
import BasicEarnLanding from "../../basic-earn-preview/components/BasicEarnLanding.vue";
import DateV2Landing from "../../date-v2-preview/components/DateV2Landing.vue";
import { resolveBuyerTemplatePreviewKind } from "../domain/buyer-template-preview";

const props = defineProps<{
  modelValue: boolean;
  row: BuyerTemplateRow | null;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const previewKind = computed(() =>
  resolveBuyerTemplatePreviewKind(props.row?.code)
);
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="row ? `${row.name} - 预览` : '模板预览'"
    class="buyer-template-preview-dialog"
    width="520px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="previewKind" class="preview-viewport">
      <DateV2Landing
        v-if="previewKind === 'date-v2'"
        :profiles="dateV2MockProfiles"
        :show-app-download="false"
      />
      <BasicEarnLanding v-else :show-app-download="false" />
    </div>
    <el-empty v-else description="该模板首页暂未开放预览" />
  </el-dialog>
</template>

<style scoped>
.preview-viewport {
  --date-theme: #ff5c74;
  --earn-theme: #f5a20a;

  width: 100%;
  height: min(74vh, 760px);
  overflow: auto;
  background: #f8f3ea;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  transform: translateZ(0);
}

.preview-viewport :deep(.landing),
.preview-viewport :deep(.reward-page) {
  min-height: 100%;
}

.preview-viewport :deep(.claim-bar) {
  padding-right: 18px;
  padding-left: 18px;
}

@media (width <= 600px) {
  :global(.buyer-template-preview-dialog) {
    width: calc(100% - 24px) !important;
  }
}
</style>
