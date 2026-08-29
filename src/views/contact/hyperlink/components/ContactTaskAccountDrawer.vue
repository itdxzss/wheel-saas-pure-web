<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  listContactTaskAccountData,
  type ContactTaskAccountItem
} from "@/api/contact-task";
import { message } from "@/utils/message";

const props = defineProps<{
  modelValue: boolean;
  taskId: number | null;
  taskName: string;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const rows = ref<ContactTaskAccountItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const sortBy = ref<string | undefined>(undefined);
const sortOrder = ref<"asc" | "desc" | undefined>(undefined);
const loading = ref(false);

/** 三个数值列走服务端排序；其余列后端会忽略，不给排序入口。 */
const SORTABLE_COLUMNS = ["needSendNum", "sentNum", "failNum"];

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

async function load() {
  if (props.taskId == null) {
    return;
  }
  loading.value = true;
  try {
    const result = await listContactTaskAccountData(props.taskId, {
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });
    rows.value = result.list ?? [];
    total.value = result.total ?? 0;
  } catch (error) {
    message((error as Error)?.message ?? "账号发送数据加载失败", {
      type: "error"
    });
  } finally {
    loading.value = false;
  }
}

function changeSort({ prop, order }: { prop: string; order: string | null }) {
  if (!order || !SORTABLE_COLUMNS.includes(prop)) {
    sortBy.value = undefined;
    sortOrder.value = undefined;
  } else {
    sortBy.value = prop;
    sortOrder.value = order === "ascending" ? "asc" : "desc";
  }
  page.value = 1;
  load();
}

function changePage(next: number) {
  page.value = next;
  load();
}

function changePageSize(next: number) {
  pageSize.value = next;
  page.value = 1;
  load();
}

/** 单账号进度：已发送 / 计划发送。计划为 0 时按 0 显示，避免除零出 NaN。 */
function progressOf(row: ContactTaskAccountItem): number {
  const need = row.needSendNum ?? 0;
  const sent = row.sentNum ?? 0;
  if (need <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((sent / need) * 100));
}

watch(
  () => [props.modelValue, props.taskId],
  ([open]) => {
    if (open) {
      page.value = 1;
      sortBy.value = undefined;
      sortOrder.value = undefined;
      load();
    }
  }
);
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`账号发送数据 · ${taskName}`"
    size="960px"
    direction="rtl"
  >
    <el-table
      v-loading="loading"
      :data="rows"
      border
      stripe
      @sort-change="changeSort"
    >
      <el-table-column prop="accountId" label="账号ID" width="120" />
      <el-table-column label="账号手机号" min-width="180">
        <template #default="{ row }">
          <div class="account-phone">
            <span>{{ row.accountPhone || "-" }}</span>
            <el-tag
              :type="row.accountStatus === 'valid' ? 'success' : 'danger'"
              size="small"
              effect="plain"
            >
              {{ row.accountStatus === "valid" ? "有效" : "无效" }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="needSendNum"
        label="计划发送"
        width="130"
        sortable="custom"
      />
      <el-table-column
        prop="sentNum"
        label="已发送"
        width="130"
        sortable="custom"
      />
      <el-table-column
        prop="failNum"
        label="失败"
        width="120"
        sortable="custom"
      />
      <el-table-column label="进度" min-width="200">
        <template #default="{ row }">
          <el-progress
            :percentage="progressOf(row)"
            :stroke-width="10"
            striped
          />
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="account-pagination"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100, 200]"
      @current-change="changePage"
      @size-change="changePageSize"
    />
  </el-drawer>
</template>

<style scoped>
.account-phone {
  display: flex;
  gap: 8px;
  align-items: center;
}

.account-pagination {
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
