<script setup lang="ts">
defineOptions({
  name: "IpStatsSummaryCards"
});

defineProps<{
  cards: Array<{
    key: string;
    label: string;
    value: number | string;
    sub: string;
    type: string;
  }>;
  loading: boolean;
}>();
</script>

<template>
  <div v-loading="loading" class="ip-stats-card-grid">
    <el-card
      v-for="card in cards"
      :key="card.key"
      class="ip-stats-card"
      shadow="never"
      :class="`is-${card.type}`"
    >
      <span>{{ card.label }}</span>
      <strong>{{ card.value }}</strong>
      <small>{{ card.sub }}</small>
    </el-card>
  </div>
</template>

<style scoped>
.ip-stats-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.ip-stats-card {
  border-radius: 6px;
}

.ip-stats-card :deep(.el-card__body) {
  display: grid;
  gap: 6px;
}

.ip-stats-card span,
.ip-stats-card small {
  color: var(--el-text-color-secondary);
}

.ip-stats-card strong {
  font-size: 26px;
  color: var(--el-text-color-primary);
}

.ip-stats-card.is-danger strong {
  color: var(--el-color-danger);
}

.ip-stats-card.is-warning strong {
  color: var(--el-color-warning);
}

.ip-stats-card.is-success strong {
  color: var(--el-color-success);
}
</style>
