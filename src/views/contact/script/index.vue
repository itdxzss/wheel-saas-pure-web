<script setup lang="ts">
defineOptions({ name: "ContactScriptTask" });
</script>

<template>
  <!--
    通讯录剧本任务：竞品当前构建里这一页本身就是一个空占位（script-DcoFUVM0.js
    只渲染一个 Result），没有任何功能。逐字复刻，不编造功能。
  -->
  <div class="contact-script-page">
    <el-result
      icon="info"
      title="敬请期待"
      sub-title="通讯录剧本任务正在建设中"
    />
  </div>
</template>

<style scoped>
.contact-script-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}
</style>
