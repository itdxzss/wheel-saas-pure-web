<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  batchDeleteAccountGroups,
  createAccountGroup
} from "@/api/account-group";
import Search from "~icons/ri/search-line";
import Delete from "~icons/ep/delete";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "AccountGroup"
});

interface AccountGroupRow {
  id: number;
  name: string;
  totalAccounts: number;
  onlineAccounts: number;
  abnormalAccounts: number;
  bannedAccounts: number;
  accountCountSummary?: string;
  updatedAt: string;
  systemBuiltin: boolean;
}

interface AccountGroupSearchForm {
  groupId: string;
  groupName: string;
}

interface AccountGroupCreateForm {
  name: string;
  remark: string;
}

const searchForm = ref<AccountGroupSearchForm>({
  groupId: "",
  groupName: ""
});
const createForm = ref<AccountGroupCreateForm>({
  name: "",
  remark: ""
});
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const showCreateDrawer = ref(false);
const rows = ref<AccountGroupRow[]>([]);
const selectedRows = ref<AccountGroupRow[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const columns: TableColumnList = [
  { label: "分组ID", prop: "id", width: 110 },
  { label: "分组名称", prop: "name", minWidth: 220 },
  {
    label: "账号数量 (在线/异常/封号)",
    prop: "accountCountSummary",
    minWidth: 220
  },
  { label: "更新时间", prop: "updatedAt", width: 180 }
];

function buildAccountGroupKeyword() {
  const groupId = searchForm.value.groupId.trim();
  if (groupId) return groupId;
  const groupName = searchForm.value.groupName.trim();
  return groupName || undefined;
}

function formatAccountCount(row: AccountGroupRow) {
  return (
    row.accountCountSummary ??
    `${row.totalAccounts} - ${row.onlineAccounts} / ${row.abnormalAccounts} / ${row.bannedAccounts}`
  );
}

function refreshAccountGroups() {
  const keyword = buildAccountGroupKeyword();
  void keyword;
  selectedRows.value = [];
  loading.value = false;
}

function onSelectionChange(rows: AccountGroupRow[]) {
  selectedRows.value = rows;
}

function isSelectable(row: AccountGroupRow) {
  return row.systemBuiltin !== true;
}

function apiErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}

function openCreateDrawer() {
  createForm.value = {
    name: "",
    remark: ""
  };
  showCreateDrawer.value = true;
}

async function submitCreateAccountGroup() {
  const name = createForm.value.name.trim();
  const remark = createForm.value.remark.trim();
  if (!name) {
    ElMessage.warning("请填写分组名称");
    return;
  }
  createLoading.value = true;
  try {
    await createAccountGroup({
      name,
      remark: remark || null
    });
    ElMessage.success("新增分组成功");
    showCreateDrawer.value = false;
    refreshAccountGroups();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "新增分组失败，请稍后重试"));
  } finally {
    createLoading.value = false;
  }
}

async function deleteSelectedAccountGroups() {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定删除已勾选的 ${selectedRows.value.length} 个分组吗？仅空分组可删除，组内有账号的分组请先清空再删。`,
      "批量删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }
  deleteLoading.value = true;
  try {
    await batchDeleteAccountGroups(selectedRows.value.map(row => row.id));
    ElMessage.success("删除选中分组成功");
    refreshAccountGroups();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "批量删除失败，请稍后重试"));
  } finally {
    deleteLoading.value = false;
  }
}

function searchAccountGroups() {
  page.value = 1;
  refreshAccountGroups();
}

function resetSearchForm() {
  searchForm.value.groupId = "";
  searchForm.value.groupName = "";
  searchAccountGroups();
}
</script>

<template>
  <div class="account-group-page">
    <div class="account-group-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="分组ID">
          <el-input
            v-model="searchForm.groupId"
            clearable
            placeholder="请输入分组ID"
            @keyup.enter="searchAccountGroups"
          />
        </el-form-item>
        <el-form-item label="分组名称">
          <el-input
            v-model="searchForm.groupName"
            clearable
            placeholder="请输入分组名称"
            @keyup.enter="searchAccountGroups"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchAccountGroups"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <PureTableBar
      title="账号分组"
      :columns="columns"
      @refresh="refreshAccountGroups"
    >
      <template #buttons>
        <el-button type="primary" @click="openCreateDrawer">新增分组</el-button>
        <el-button
          type="danger"
          plain
          :disabled="selectedRows.length === 0 || deleteLoading"
          :icon="useRenderIcon(Delete)"
          :loading="deleteLoading"
          @click="deleteSelectedAccountGroups"
        >
          删除选中
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          @selection-change="onSelectionChange"
        >
          <el-table-column
            type="selection"
            width="48"
            :selectable="isSelectable"
          />
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="分组ID"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            label="分组名称"
            min-width="220"
          >
            <template #default="{ row }">
              <span>{{ row.name }}</span>
              <el-tag
                v-if="row.systemBuiltin"
                class="ml-2"
                size="small"
                type="info"
              >
                系统
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            label="账号数量 (在线/异常/封号)"
            min-width="220"
          >
            <template #default="{ row }">
              {{ formatAccountCount(row as AccountGroupRow) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="updatedAt"
            label="更新时间"
            width="180"
          />
          <template #empty>
            <el-empty description="暂无账号分组" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
        />
      </template>
    </PureTableBar>

    <el-drawer
      v-model="showCreateDrawer"
      title="新增分组"
      size="480px"
      destroy-on-close
    >
      <el-form :model="createForm" label-position="top">
        <el-form-item label="分组名称" required>
          <el-input
            v-model="createForm.name"
            :maxlength="128"
            show-word-limit
            placeholder="例如：巴铁推手-A / 印度进群-A"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="4"
            :maxlength="512"
            show-word-limit
            placeholder="填写分组用途、规则或说明，例如：用于进群账号，国家=巴基斯坦，账号状态=正常"
          />
        </el-form-item>
      </el-form>

      <el-alert
        class="account-group-create-alert"
        type="info"
        show-icon
        :closable="false"
        title="新增分组会保存到账号分组接口；系统默认分组不允许删除。"
      />

      <template #footer>
        <el-button @click="showCreateDrawer = false">取消</el-button>
        <el-button
          type="primary"
          :loading="createLoading"
          @click="submitCreateAccountGroup"
        >
          确认新增分组
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.account-group-page {
  padding: 16px;
}

.account-group-search {
  padding: 16px 16px 0;
}

.account-group-search :deep(.el-form-item) {
  margin-bottom: 16px;
}

.account-group-create-alert {
  margin-top: 16px;
}
</style>
