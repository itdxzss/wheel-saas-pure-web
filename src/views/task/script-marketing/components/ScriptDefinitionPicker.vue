<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  listScriptDefinitions,
  getScriptDefinition,
  type ScriptDefinition,
  type ScriptDefinitionSummary
} from "@/api/script-library";
import { apiErrorMessage } from "@/utils/api-error";
defineProps<{ hasSnapshot?: boolean }>();
const emit = defineEmits<{
  select: [definition: ScriptDefinition];
  clear: [];
}>();
const selecting = defineModel<boolean>("loading", { default: false });
const selected = ref<number>();
const appliedSelection = ref<number>();
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
async function choose(id?: number) {
  const request = ++selectionRequestId;
  if (typeof id !== "number") {
    selected.value = undefined;
    appliedSelection.value = undefined;
    selecting.value = false;
    emit("clear");
    return;
  }
  selecting.value = true;
  try {
    const definition = await getScriptDefinition(id);
    if (request !== selectionRequestId || selected.value !== id) return;
    if (!definition.enabled) {
      selected.value = appliedSelection.value;
      ElMessage.warning("该剧本已停用，请重新选择");
      return;
    }
    appliedSelection.value = id;
    emit("select", definition);
  } catch (error) {
    if (request === selectionRequestId) {
      selected.value = appliedSelection.value;
      ElMessage.error(apiErrorMessage(error, "剧本读取失败"));
    }
  } finally {
    if (request === selectionRequestId) selecting.value = false;
  }
}
onBeforeUnmount(() => {
  requestId++;
  selectionRequestId++;
  selecting.value = false;
});
</script>

<template>
  <el-form-item label="选用剧本" required>
    <el-select
      v-model="selected"
      clearable
      filterable
      remote
      :remote-method="value => search(value)"
      :loading="loading || selecting"
      :placeholder="
        hasSnapshot ? '使用已保存剧本，可重新选择' : '搜索并选用已启用剧本'
      "
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
    <el-text type="info">{{
      hasSnapshot && !selected
        ? "当前使用已保存的任务剧本，重新选择将替换其内容。"
        : "选择后在下方预览，内容和间隔在养群剧本中维护。"
    }}</el-text>
  </el-form-item>
</template>
