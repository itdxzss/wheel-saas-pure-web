<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import {
  listScriptDefinitions,
  getScriptDefinition,
  type ScriptDefinition,
  type ScriptDefinitionSummary
} from "@/api/script-library";
import { apiErrorMessage } from "@/utils/api-error";
import { estimatedWait } from "../form";
import ScriptDefinitionPreview from "./ScriptDefinitionPreview.vue";
const emit = defineEmits<{
  select: [definition: ScriptDefinition];
  clear: [];
}>();
const selecting = defineModel<boolean>("loading", { default: false });
const selected = ref<number>();
const appliedSelection = ref<number>();
const appliedDefinition = shallowRef<ScriptDefinition>();
const previewOpen = ref(false);
const roleCount = computed(
  () =>
    new Set(
      appliedDefinition.value?.steps.map(step => step.roleKey || step.role)
    ).size
);
const wait = computed(() =>
  estimatedWait(appliedDefinition.value?.steps || [])
);
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
  previewOpen.value = false;
  if (typeof id !== "number") {
    selected.value = undefined;
    appliedSelection.value = undefined;
    appliedDefinition.value = undefined;
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
    appliedDefinition.value = definition;
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
  <el-form-item label="选用剧本">
    <el-select
      v-model="selected"
      clearable
      filterable
      remote
      :remote-method="value => search(value)"
      :loading="loading || selecting"
      placeholder="搜索并选用已启用剧本"
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
    <div v-if="appliedDefinition" class="definition-summary">
      <el-tag size="small" effect="plain">{{ roleCount }} 个角色</el-tag>
      <el-tag size="small" effect="plain"
        >{{ appliedDefinition.steps.length }} 条消息</el-tag
      >
      <el-tag size="small" effect="plain"
        >预计等待 {{ wait[0] }}–{{ wait[1] }} 秒</el-tag
      >
      <el-button size="small" :disabled="selecting" @click="previewOpen = true"
        >查看剧本</el-button
      >
    </div>
    <el-text type="info"
      >选用后替换当前编排并只读预览，管理员账号仍需选择；清除选择后可手动编辑当前内容。</el-text
    >
  </el-form-item>
  <ScriptDefinitionPreview
    v-if="appliedDefinition"
    v-model="previewOpen"
    :definition="appliedDefinition"
  />
</template>

<style scoped>
.definition-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
  margin: 10px 0;
}
</style>
