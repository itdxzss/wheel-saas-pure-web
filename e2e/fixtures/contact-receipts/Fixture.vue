<script setup lang="ts">
import { ref } from "vue";
import ContactTaskAccountDrawer from "../../../src/views/contact/hyperlink/components/ContactTaskAccountDrawer.vue";
const visible = ref(true);
</script>
<template>
  <el-button @click="visible = true">打开结果</el-button
  ><ContactTaskAccountDrawer
    v-model="visible"
    :task-id="42"
    task-name="本地合成数据"
  />
</template>
