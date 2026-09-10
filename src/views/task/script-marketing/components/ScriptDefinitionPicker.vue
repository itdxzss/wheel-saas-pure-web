<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  listScriptDefinitions,
  getScriptDefinition,
  type ScriptDefinition,
  type ScriptDefinitionSummary
} from "@/api/script-library";
import { apiErrorMessage } from "@/utils/api-error";
const emit = defineEmits<{ select: [definition: ScriptDefinition] }>();
const selected = ref<number>();
const rows = ref<ScriptDefinitionSummary[]>([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const keyword = ref("");
let requestId = 0;
let selectionRequestId = 0;
async function search(value = "", append = false) {
  const request = ++requestId;
  loading.value = true;
  const requestedPage = append ? page.value + 1 : 1;
  try {
    const result = await listScriptDefinitions({
      keyword: value,
      status: 1,
      page: requestedPage,
      pageSize: 50
    });
    if (request !== requestId) return;
    rows.value = append ? [...rows.value, ...result.list] : result.list;
    total.value = result.total;
    page.value = requestedPage;
    keyword.value = value;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "剧本读取失败"));
  } finally {
    if (request === requestId) loading.value = false;
  }
}
async function choose(id: number) {
  const request = ++selectionRequestId;
  loading.value = true;
  try {
    const definition = await getScriptDefinition(id);
    if (request !== selectionRequestId || selected.value !== id) return;
    if (!definition.enabled) {
      ElMessage.warning("该剧本已停用，请重新选择");
      return;
    }
    emit("select", definition);
  } catch (error) {
    if (request === selectionRequestId)
      ElMessage.error(apiErrorMessage(error, "剧本读取失败"));
  } finally {
    if (request === selectionRequestId) loading.value = false;
  }
}
</script>

<template>
  <el-form-item label="选用剧本">
    <el-select
      v-model="selected"
      filterable
      remote
      :remote-method="value => search(value)"
      :loading="loading"
      placeholder="搜索已启用剧本，复制到当前任务"
      @visible-change="open => open && search()"
      @change="choose"
    >
      <el-option
        v-for="row in rows"
        :key="row.id"
        :value="row.id"
        :label="row.name"
      />
      <template #footer
        ><el-button
          v-if="page * 50 < total"
          text
          :loading="loading"
          @click="search(keyword, true)"
          >加载更多</el-button
        ></template
      >
    </el-select>
    <el-text type="info"
      >选用会替换当前消息编排；也可以直接在下方配置。</el-text
    >
  </el-form-item>
</template>
