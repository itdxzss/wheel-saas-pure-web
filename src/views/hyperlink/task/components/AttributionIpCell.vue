<script setup lang="ts">
defineOptions({ name: "HyperlinkAttributionIpCell" });
defineProps<{
  ip: string | null;
  userAgent: string | null;
  purged: boolean;
  maskedFields: string[];
}>();
</script>

<template>
  <el-tooltip placement="top" :show-after="250">
    <template #content>
      <template v-if="purged">已按 90 天保留策略清理首触环境</template>
      <template v-else-if="maskedFields.includes('ip')">
        当前账号无敏感归因查看权限
      </template>
      <template v-else>
        <div>IP：{{ ip || "-" }}</div>
        <div class="ua-text">User-Agent：{{ userAgent || "-" }}</div>
      </template>
    </template>
    <span class="ip-value">{{ ip || "-" }}</span>
  </el-tooltip>
</template>

<style scoped>
.ip-value {
  display: inline-block;
  max-width: 118px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ua-text {
  max-width: 440px;
  word-break: break-all;
}
</style>
