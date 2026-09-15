<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage, type TableInstance } from "element-plus";
import {
  listGroupDataPackages,
  type GroupDataPackage
} from "@/api/group-data-package";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "PullTaskDataPackagePicker" });
const props = defineProps<{
  existingIds: number[];
  planning: boolean;
  resourceError: string;
}>();
const emit = defineEmits<{ (event: "plan", ids: number[]): void }>();
const visible = ref(false);
const keyword = ref("");
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const rows = ref<GroupDataPackage[]>([]);
const selected = ref<GroupDataPackage[]>([]);
const table = ref<TableInstance>();
const loading = ref(false);
const errorMessage = ref("");
const selectedCount = computed(() =>
  selected.value.reduce((sum, row) => sum + row.metrics.unusedCount, 0)
);
let requestVersion = 0;
let restoring = false;
let submittedIds: number[] = [];

function selectable(row: GroupDataPackage): boolean {
  return row.metrics.unusedCount > 0 && !props.existingIds.includes(row.id);
}

async function load(): Promise<void> {
  const version = ++requestVersion;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listGroupDataPackages({
      page: page.value,
      pageSize: pageSize.value,
      name: keyword.value,
      forTask: true
    });
    if (version !== requestVersion) return;
    restoring = true;
    rows.value = result.list;
    total.value = result.total;
    selected.value = selected.value.filter(
      row => !props.existingIds.includes(row.id)
    );
    await nextTick();
    rows.value.forEach(row =>
      table.value?.toggleRowSelection(
        row,
        selected.value.some(item => item.id === row.id)
      )
    );
    restoring = false;
  } catch (error) {
    if (version === requestVersion)
      errorMessage.value = apiErrorMessage(error, "数据包加载失败");
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

function selectionChange(value: GroupDataPackage[]): void {
  if (restoring) return;
  const pageIds = new Set(rows.value.map(row => row.id));
  const previous = selected.value.filter(row => !pageIds.has(row.id));
  selected.value = [...previous, ...value.filter(selectable)];
}
function search(): void {
  page.value = 1;
  void load();
}
function open(): void {
  visible.value = true;
  selected.value = [];
  keyword.value = "";
  page.value = 1;
  submittedIds = [];
  void load();
}
function submit(): void {
  if (!selected.value.length || props.planning) return;
  if (selected.value.length > 50) {
    ElMessage.warning("单次最多选择 50 个数据包");
    return;
  }
  submittedIds = selected.value.map(row => row.id);
  emit("plan", submittedIds);
}
watch(
  () => props.existingIds,
  ids => {
    if (submittedIds.length && submittedIds.every(id => ids.includes(id))) {
      selected.value = [];
      submittedIds = [];
      visible.value = false;
    }
  },
  { deep: true }
);
</script>

<template>
  <el-button
    v-auth="'tenant:group_data_package:view'"
    type="primary"
    plain
    :disabled="planning"
    @click="open"
    >选择数据包</el-button
  >
  <el-dialog
    v-model="visible"
    title="选择拉群数据包"
    width="820px"
    :close-on-click-modal="!planning"
    :show-close="!planning"
    :close-on-press-escape="!planning"
    destroy-on-close
  >
    <el-alert
      title="每个包对应一份料子执行单元，按勾选顺序加入计划。加入计划后可预览号码数量，创建任务时才会领取号码；如果号码已被其他任务取用，需要重新选择。"
      type="info"
      :closable="false"
      show-icon
    />
    <el-form inline class="picker-search" @submit.prevent="search">
      <el-form-item label="数据包名称"
        ><el-input
          v-model="keyword"
          clearable
          placeholder="搜索可用数据包"
          @keyup.enter="search"
      /></el-form-item>
      <el-form-item
        ><el-button
          type="primary"
          :loading="loading"
          :disabled="planning"
          native-type="submit"
          >搜索</el-button
        ><el-button :disabled="loading || planning" @click="load"
          >刷新</el-button
        ></el-form-item
      >
    </el-form>
    <el-alert
      v-if="errorMessage || resourceError"
      :title="errorMessage || resourceError"
      type="error"
      :closable="false"
    />
    <el-table
      ref="table"
      v-loading="loading || planning"
      :data="rows"
      row-key="id"
      border
      height="330"
      @selection-change="selectionChange"
    >
      <el-table-column type="selection" :selectable="selectable" width="45" />
      <el-table-column prop="id" label="ID" width="75" />
      <el-table-column
        prop="name"
        label="数据包"
        min-width="170"
        show-overflow-tooltip
      />
      <el-table-column prop="primaryCountryIso2" label="国家" width="75" />
      <el-table-column label="未使用" width="110"
        ><template #default="{ row }">{{
          row.metrics.unusedCount.toLocaleString()
        }}</template></el-table-column
      >
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column label="状态" width="95"
        ><template #default="{ row }">{{
          existingIds.includes(row.id) ? "已在计划中" : "可选择"
        }}</template></el-table-column
      >
      <template #empty
        ><el-empty description="暂无可用数据包，请先在拉群数据包菜单导入号码"
      /></template>
    </el-table>
    <WheelPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      :total="total"
      @change="load"
    />
    <p>
      已选 {{ selected.length }} 个包，共
      {{ selectedCount.toLocaleString() }} 个当前未使用号码（单次最多 50
      个包）。
    </p>
    <div class="selected-packages">
      <el-tag v-for="(row, index) in selected" :key="row.id" size="small"
        >{{ index + 1 }}. {{ row.name }}</el-tag
      >
    </div>
    <template #footer
      ><el-button :disabled="planning" @click="visible = false">取消</el-button
      ><el-button
        type="primary"
        :loading="planning"
        :disabled="!selected.length || selected.length > 50 || loading"
        @click="submit"
        >加入执行计划</el-button
      ></template
    >
  </el-dialog>
</template>

<style scoped>
.picker-search {
  margin-top: 18px;
}

.selected-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
