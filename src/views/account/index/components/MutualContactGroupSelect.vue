<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { formatAccountGroupLabel } from "@/utils/account-group-label";
const model = defineModel<number>();
defineProps<{ disabled?: boolean }>();
const rows = ref<AccountGroupApiRow[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");
const page = ref(1);
const total = ref(0);
let generation = 0;
async function load(reset: boolean): Promise<void> {
  const current = ++generation;
  loading.value = true;
  error.value = "";
  try {
    const nextPage = reset ? 1 : page.value + 1;
    const result = await listAccountGroups({
      page: nextPage,
      pageSize: 50,
      keyword: keyword.value
    });
    if (current !== generation) return;
    rows.value = reset
      ? (result.list ?? [])
      : [...rows.value, ...(result.list ?? [])];
    total.value = result.total ?? 0;
    page.value = nextPage;
  } catch (cause) {
    if (current === generation)
      error.value = cause instanceof Error ? cause.message : "分组加载失败";
  } finally {
    if (current === generation) loading.value = false;
  }
}
function search(value: string): void {
  keyword.value = value;
  void load(true);
}
onMounted(() => void load(true));
</script>
<template>
  <div class="w-full">
    <el-select
      v-model="model"
      filterable
      remote
      clearable
      :remote-method="search"
      :loading="loading"
      :disabled="disabled"
      placeholder="搜索账号分组"
      class="w-full"
    >
      <el-option
        v-for="row in rows"
        :key="row.id"
        :value="row.id"
        :label="formatAccountGroupLabel(row)"
      />
      <template #footer>
        <el-button
          v-if="rows.length < total"
          text
          :loading="loading"
          @click="load(false)"
          >加载更多分组</el-button
        >
        <span v-else>共 {{ total }} 个匹配分组</span>
      </template>
    </el-select>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
  </div>
</template>
