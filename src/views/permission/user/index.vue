<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import ResetUserPasswordDialog from "./components/ResetUserPasswordDialog.vue";
import UserFormDrawer from "./components/UserFormDrawer.vue";
import {
  formatUserCreatedAt,
  mockUserRows,
  type ManagedUser,
  type UserFormPayload
} from "./user-management";

defineOptions({ name: "PermissionUserManagement" });

const columns: TableColumnList = [
  { label: "序号", type: "index", width: 72 },
  { label: "用户 ID", prop: "id", width: 110 },
  { label: "用户名", prop: "username", minWidth: 140 },
  { label: "上级用户", prop: "parentUsername", minWidth: 140 },
  { label: "角色", prop: "role", minWidth: 140 },
  { label: "状态", prop: "status", width: 100 },
  { label: "Google 令牌", prop: "googleBound", width: 130 },
  { label: "创建时间", prop: "createdAt", minWidth: 180 }
];
const filters = reactive({
  username: "",
  parentUserId: undefined as number | undefined
});
const rows = ref<ManagedUser[]>([...mockUserRows]);
const drawerVisible = ref(false);
const editingUser = ref<ManagedUser>();
const passwordDialogVisible = ref(false);
const passwordUser = ref<ManagedUser>();

const filteredRows = computed(() => {
  const keyword = filters.username.trim().toLowerCase();
  return rows.value.filter(row => {
    const matchesUsername =
      !keyword || row.username.toLowerCase().includes(keyword);
    const matchesParent =
      !filters.parentUserId || row.parentUserId === filters.parentUserId;
    return matchesUsername && matchesParent;
  });
});

function resetFilters(): void {
  filters.username = "";
  filters.parentUserId = undefined;
}

function addUser(): void {
  editingUser.value = undefined;
  drawerVisible.value = true;
}

function editUser(user: ManagedUser): void {
  editingUser.value = user;
  drawerVisible.value = true;
}

function saveUser(payload: UserFormPayload): void {
  const parent = rows.value.find(item => item.id === payload.parentUserId);
  if (editingUser.value) {
    const index = rows.value.findIndex(
      item => item.id === editingUser.value?.id
    );
    rows.value[index] = {
      ...rows.value[index],
      username: payload.username,
      role: payload.role,
      parentUserId: payload.parentUserId,
      parentUsername: parent?.username
    };
    ElMessage.success("用户已更新");
    return;
  }
  rows.value.unshift({
    id: Date.now(),
    username: payload.username,
    role: payload.role,
    parentUserId: payload.parentUserId,
    parentUsername: parent?.username,
    status: "ENABLED",
    googleBound: false,
    createdAt: formatUserCreatedAt()
  });
  ElMessage.success("用户已新增");
}

function openPasswordDialog(user: ManagedUser): void {
  passwordUser.value = user;
  passwordDialogVisible.value = true;
}

function resetPassword(): void {
  ElMessage.success(`已重置用户 ${passwordUser.value?.username ?? ""} 的密码`);
}

function toggleUserStatus(user: ManagedUser): void {
  user.status = user.status === "ENABLED" ? "DISABLED" : "ENABLED";
  ElMessage.success(user.status === "DISABLED" ? "用户已禁用" : "用户已启用");
}
</script>

<template>
  <div class="permission-user-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            clearable
            placeholder="请输入用户名搜索"
            @keyup.enter.prevent
          />
        </el-form-item>
        <el-form-item label="上级用户">
          <el-select
            v-model="filters.parentUserId"
            clearable
            placeholder="请选择上级用户"
          >
            <el-option
              v-for="user in rows"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <PureTableBar title="用户管理" :columns="columns" @refresh="resetFilters">
      <template #buttons>
        <el-button type="primary" @click="addUser">新增用户</el-button>
        <el-button @click="resetFilters">刷新</el-button>
      </template>
      <template #default="{ dynamicColumns }">
        <el-table :data="filteredRows" row-key="id" border>
          <el-table-column type="selection" width="48" />
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop ?? column.type"
            v-bind="column"
          >
            <template
              v-if="column.prop === 'parentUsername'"
              #default="{ row }"
            >
              {{ row.parentUsername || "-" }}
            </template>
            <template v-else-if="column.prop === 'status'" #default="{ row }">
              <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
                {{ row.status === "ENABLED" ? "启用" : "禁用" }}
              </el-tag>
            </template>
            <template
              v-else-if="column.prop === 'googleBound'"
              #default="{ row }"
            >
              <el-tag
                :type="row.googleBound ? 'success' : 'info'"
                effect="plain"
              >
                {{ row.googleBound ? "已绑定" : "未绑定" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="240">
            <template #default="{ row }">
              <el-button link type="primary" @click="editUser(row)"
                >编辑</el-button
              >
              <el-button link type="primary" @click="openPasswordDialog(row)"
                >重置密码</el-button
              >
              <el-popconfirm
                :title="
                  row.status === 'ENABLED'
                    ? `确认禁用用户 ${row.username} 吗？`
                    : `确认启用用户 ${row.username} 吗？`
                "
                confirm-button-text="确认"
                cancel-button-text="取消"
                @confirm="toggleUserStatus(row)"
              >
                <template #reference>
                  <el-button
                    link
                    :type="row.status === 'ENABLED' ? 'warning' : 'success'"
                  >
                    {{ row.status === "ENABLED" ? "禁用" : "启用" }}
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无用户" /></template>
        </el-table>
      </template>
    </PureTableBar>

    <UserFormDrawer
      v-model="drawerVisible"
      :user="editingUser"
      :parent-users="rows"
      @saved="saveUser"
    />
    <ResetUserPasswordDialog
      v-model="passwordDialogVisible"
      :user="passwordUser"
      @saved="resetPassword"
    />
  </div>
</template>

<style scoped>
.permission-user-page {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-input),
.filter-card :deep(.el-select) {
  width: 220px;
}
</style>
