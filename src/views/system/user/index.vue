<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  changeSystemUserStatus,
  createSystemUser,
  listSystemUsers,
  resetSystemUserPassword,
  updateSystemUser,
  type SystemStatus,
  type SystemUser
} from "@/api/system-user";
import { listSystemRoles, type SystemRole } from "@/api/system-role";
import { apiErrorMessage } from "@/utils/api-error";
import {
  isValidPassword,
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE
} from "@/utils/password-policy";

defineOptions({ name: "SystemUser" });

const rows = ref<SystemUser[]>([]);
const roles = ref<SystemRole[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const filters = reactive<{ keyword: string; status?: SystemStatus }>({
  keyword: ""
});
const dialogVisible = ref(false);
const editingId = ref<number>();
const formRef = ref<FormInstance>();
const resetDialogVisible = ref(false);
const resetTarget = ref<SystemUser>();
const resetFormRef = ref<FormInstance>();
const resetSaving = ref(false);
const form = reactive({
  username: "",
  nickname: "",
  password: "",
  roleIds: [] as number[]
});
const resetForm = reactive({ password: "" });
const LOGIN_ACCOUNT_PATTERN = /^[A-Za-z0-9._-]+$/;
const columns = [
  { label: "登录账号", prop: "username" },
  { label: "用户昵称", prop: "nickname" },
  { label: "角色", prop: "roleIds" },
  { label: "状态", prop: "status" },
  { label: "创建时间", prop: "createdAt" }
];
const rules = {
  username: [
    { required: true, message: "请输入登录账号", trigger: "blur" },
    {
      pattern: LOGIN_ACCOUNT_PATTERN,
      message: "登录账号只能包含字母、数字、点、下划线和短横线",
      trigger: "blur"
    }
  ],
  password: [
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (editingId.value || isValidPassword(value)) callback();
        else callback(new Error(PASSWORD_RULE_MESSAGE));
      },
      trigger: "blur"
    }
  ]
};
const resetRules = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    {
      pattern: PASSWORD_PATTERN,
      message: PASSWORD_RULE_MESSAGE,
      trigger: "blur"
    }
  ]
};

const filteredRows = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return rows.value.filter(row => {
    const matchesKeyword =
      !keyword ||
      row.username.toLowerCase().includes(keyword) ||
      (row.nickname ?? "").toLowerCase().includes(keyword);
    return (
      matchesKeyword &&
      (filters.status === undefined || row.status === filters.status)
    );
  });
});

function roleNames(roleIds: number[]): string {
  const byId = new Map(roles.value.map(role => [role.id, role.roleName]));
  return roleIds.map(id => byId.get(id) ?? `角色#${id}`).join("、") || "未分配";
}

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [userResult, roleResult] = await Promise.all([
      listSystemUsers(),
      listSystemRoles()
    ]);
    rows.value = userResult;
    roles.value = roleResult;
    errorMessage.value = "";
  } catch (error) {
    rows.value = [];
    errorMessage.value = apiErrorMessage(error, "用户列表加载失败");
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingId.value = undefined;
  Object.assign(form, {
    username: "",
    nickname: "",
    password: "",
    roleIds: []
  });
  dialogVisible.value = true;
}

function openEdit(row: SystemUser): void {
  editingId.value = row.id;
  Object.assign(form, {
    username: row.username,
    nickname: row.nickname ?? "",
    password: "",
    roleIds: [...row.roleIds]
  });
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await updateSystemUser(editingId.value, {
        nickname: form.nickname.trim() || undefined,
        roleIds: form.roleIds
      });
    } else {
      await createSystemUser({
        username: form.username.trim(),
        nickname: form.nickname.trim() || undefined,
        password: form.password,
        roleIds: form.roleIds
      });
    }
    ElMessage.success(editingId.value ? "用户已更新" : "用户已创建");
    dialogVisible.value = false;
    await refresh();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "用户保存失败"));
  } finally {
    saving.value = false;
  }
}

function openResetPassword(row: SystemUser): void {
  resetTarget.value = row;
  resetForm.password = "";
  resetDialogVisible.value = true;
}

async function submitResetPassword(): Promise<void> {
  if (!(await resetFormRef.value?.validate()) || !resetTarget.value) return;
  resetSaving.value = true;
  try {
    await resetSystemUserPassword(resetTarget.value.id, resetForm.password);
    ElMessage.success("密码已重置");
    resetDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "密码重置失败"));
  } finally {
    resetSaving.value = false;
  }
}

async function toggleStatus(row: SystemUser): Promise<void> {
  const nextStatus: SystemStatus = row.status === 1 ? 0 : 1;
  const action = nextStatus === 1 ? "启用" : "禁用";
  try {
    await ElMessageBox.confirm(
      `确认${action}用户“${row.username}”吗？`,
      `${action}确认`,
      {
        type: "warning"
      }
    );
    await changeSystemUserStatus(row.id, nextStatus);
    ElMessage.success(`用户已${action}`);
    await refresh();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(apiErrorMessage(error, `${action}用户失败`));
  }
}

onMounted(refresh);
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="登录账号/用户昵称">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="请输入关键字"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item
          ><el-button
            @click="Object.assign(filters, { keyword: '', status: undefined })"
            >重置</el-button
          ></el-form-item
        >
      </el-form>
    </el-card>
    <el-alert
      v-if="errorMessage"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="refresh">重试</el-button>
    </el-alert>
    <PureTableBar title="用户管理" :columns="columns" @refresh="refresh">
      <template #buttons>
        <el-button
          v-auth="'tenant:system-user:create'"
          type="primary"
          @click="openCreate"
          >新增用户</el-button
        >
      </template>
      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="filteredRows" row-key="id" border>
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop"
            v-bind="column"
            min-width="140"
          >
            <template v-if="column.prop === 'roleIds'" #default="{ row }">{{
              roleNames(row.roleIds)
            }}</template>
            <template v-else-if="column.prop === 'status'" #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">{{
                row.status === 1 ? "启用" : "禁用"
              }}</el-tag>
            </template>
            <template
              v-else-if="column.prop === 'createdAt'"
              #default="{ row }"
              >{{ new Date(row.createdAt).toLocaleString() }}</template
            >
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="250">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:system-user:edit'"
                link
                type="primary"
                @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button
                v-auth="'tenant:system-user:reset-password'"
                link
                type="primary"
                @click="openResetPassword(row)"
                >重置密码</el-button
              >
              <el-button
                v-auth="'tenant:system-user:status'"
                link
                :type="row.status === 1 ? 'danger' : 'success'"
                @click="toggleStatus(row)"
                >{{ row.status === 1 ? "禁用" : "启用" }}</el-button
              >
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无用户" /></template>
        </el-table>
      </template>
    </PureTableBar>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑用户' : '新增用户'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="登录账号" prop="username"
          ><el-input
            v-model="form.username"
            :disabled="Boolean(editingId)"
            maxlength="64"
            placeholder="请输入登录账号，例如 test0001"
        /></el-form-item>
        <el-form-item label="用户昵称"
          ><el-input
            v-model="form.nickname"
            maxlength="64"
            placeholder="请输入用户昵称，例如 普通用户测试"
        /></el-form-item>
        <el-form-item v-if="!editingId" label="密码" prop="password"
          ><el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="8至64个字符"
        /></el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="form.roleIds"
            multiple
            filterable
            placeholder="请选择角色"
            class="full-width"
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="`${role.roleName}${role.status === 0 ? '（已禁用）' : ''}`"
              :value="role.id"
              :disabled="role.status === 0 && !form.roleIds.includes(role.id)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="dialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="save"
          >保存</el-button
        ></template
      >
    </el-dialog>

    <el-dialog
      v-model="resetDialogVisible"
      title="重置密码"
      width="520px"
      destroy-on-close
    >
      <p class="reset-tip">
        请为登录账号“{{ resetTarget?.username ?? "" }}”设置新密码
      </p>
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="90px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetForm.password"
            type="password"
            show-password
            placeholder="8至64个字符"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="resetSaving"
          @click="submitResetPassword"
          >确认重置</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.system-page {
  padding: 16px;
}

.filter-card,
.system-page > .el-alert {
  margin-bottom: 16px;
}

.full-width {
  width: 100%;
}

.reset-tip {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
}

:deep(.filter-card .el-input),
:deep(.filter-card .el-select) {
  width: 220px;
}
</style>
