<script setup lang="ts">
import { computed } from "vue";
import {
  creatorDeletionLabel,
  type CreatorDeletionProgress
} from "../creator-deletion-display";

const props = defineProps<{ execution: CreatorDeletionProgress }>();
const label = computed(() => creatorDeletionLabel(props.execution));
</script>

<template>
  <div
    v-if="label"
    class="deletion-progress"
    data-testid="creator-deletion-progress"
  >
    <strong>{{ label }}</strong>
    <span v-if="execution.creatorDeletionReason">{{
      execution.creatorDeletionReason
    }}</span>
    <small v-if="execution.creatorDeletionOperationId">
      注销操作：{{ execution.creatorDeletionOperationId }}
    </small>
  </div>
</template>

<style scoped>
.deletion-progress {
  display: grid;
  gap: 4px;
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.deletion-progress span,
.deletion-progress small {
  color: var(--el-text-color-secondary);
}
</style>
