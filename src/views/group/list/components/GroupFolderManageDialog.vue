<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteGroupFolders,
  createGroupFolder,
  listGroupFolders,
  updateGroupFolder,
  type GroupFolderRow
} from "@/api/group-folder";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { apiErrorMessage } from "@/utils/api-error";
import { formatEpochMillis } from "@/utils/time";

defineOptions({
  name: "GroupFolderManageDialog"
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "changed", deletedFolderIds: number[]): void;
}>();

const loading = ref(false);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const rows = ref<GroupFolderRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref("");
const editorOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: "" });

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

async function loadRows(): Promise<void> {
  loading.value = true;
  try {
    const response = await listGroupFolders({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined
    });
    rows.value = response.list ?? [];
    total.value = response.total ?? 0;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(apiErrorMessage(error, "群组分组加载失败，请稍后重试"));
  } finally {
    loading.value = false;
  }
}

function search(): void {
  page.value = 1;
  void loadRows();
}

function resetSearch(): void {
  keyword.value = "";
  search();
}

function openCreate(): void {
  editingId.value = null;
  form.name = "";
  editorOpen.value = true;
}

function openEdit(row: GroupFolderRow): void {
  editingId.value = row.id;
  form.name = row.name;
  editorOpen.value = true;
}

async function save(): Promise<void> {
  const name = form.name.trim();
  if (!name) {
    ElMessage.warning("请输入分组名称");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value == null) {
      await createGroupFolder({ name });
      ElMessage.success("群组分组已创建");
    } else {
      await updateGroupFolder(editingId.value, { name });
      ElMessage.success("群组分组已更新");
    }
    editorOpen.value = false;
    emit("changed", []);
    await loadRows();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群组分组保存失败，请稍后重试"));
  } finally {
    saving.value = false;
  }
}

async function deleteFolder(row: GroupFolderRow): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `删除后，该分组下 ${row.groupCount} 个群组将进入未分组。确认删除吗？`,
      "删除群组分组",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  deletingId.value = row.id;
  try {
    const result = await batchDeleteGroupFolders([row.id]);
    ElMessage.success(
      `已删除分组，${result.ungroupedGroupCount} 个群组进入未分组`
    );
    if (rows.value.length === 1 && page.value > 1) page.value -= 1;
    emit("changed", [row.id]);
    await loadRows();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群组分组删除失败，请稍后重试"));
  } finally {
    deletingId.value = null;
  }
}

watch(
  () => props.modelValue,
  value => {
    if (value) void loadRows();
  }
);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="管理群组分组"
    width="760px"
    destroy-on-close
  >
    <div class="folder-toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索分组名称"
        @keyup.enter="search"
        @clear="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button type="primary" plain @click="openCreate">新建分组</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="name" label="分组名称" min-width="220" />
      <el-table-column prop="groupCount" label="群组数量" width="120" />
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatEpochMillis(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            link
            type="danger"
            :loading="deletingId === row.id"
            :disabled="deletingId != null"
            @click="deleteFolder(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无群组分组" />
      </template>
    </el-table>

    <WheelPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @change="loadRows"
    />

    <el-dialog
      v-model="editorOpen"
      :title="editingId == null ? '新建分组' : '编辑分组'"
      width="460px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="!saving"
      :show-close="!saving"
    >
      <el-form :model="form" label-position="top" @submit.prevent>
        <el-form-item label="分组名称" required>
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="请输入分组名称"
            @keyup.enter="save"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="editorOpen = false">
          取消
        </el-button>
        <el-button type="primary" :loading="saving" @click="save">
          保存
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.folder-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.folder-toolbar .el-input {
  width: 260px;
}
</style>
