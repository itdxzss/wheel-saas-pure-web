<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import {
  ElMessage,
  ElMessageBox,
  ElTree,
  type FormInstance
} from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  changeSystemRoleStatus,
  createSystemRole,
  getSystemRoleMenuIds,
  listSystemRoles,
  replaceSystemRoleMenus,
  updateSystemRole,
  type SystemRole
} from "@/api/system-role";
import { getSystemMenuTree, type SystemMenuNode } from "@/api/system-menu";
import type { SystemStatus } from "@/api/system-user";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "SystemRole" });

const rows = ref<SystemRole[]>([]);
const menuTree = ref<SystemMenuNode[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const filters = reactive<{ keyword: string; status?: SystemStatus }>({
  keyword: ""
});
const formVisible = ref(false);
const editingRole = ref<SystemRole>();
const formRef = ref<FormInstance>();
const form = reactive({ roleName: "", roleCode: "", remark: "" });
const permissionVisible = ref(false);
const permissionRole = ref<SystemRole>();
const permissionLoading = ref(false);
const treeRef = ref<InstanceType<typeof ElTree>>();
const treeProps = {
  label: "menuName",
  children: "children",
  disabled: (): boolean => Boolean(permissionRole.value?.system)
};
const columns = [
  { label: "角色名称", prop: "roleName" },
  { label: "角色编码", prop: "roleCode" },
  { label: "用户数量", prop: "userCount" },
  { label: "备注", prop: "remark" },
  { label: "状态", prop: "status" },
  { label: "创建时间", prop: "createdAt" }
];
const rules = {
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleCode: [{ required: true, message: "请输入角色编码", trigger: "blur" }]
};

const filteredRows = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return rows.value.filter(row => {
    const matches =
      !keyword ||
      row.roleName.toLowerCase().includes(keyword) ||
      row.roleCode.toLowerCase().includes(keyword);
    return (
      matches && (filters.status === undefined || row.status === filters.status)
    );
  });
});

function flattenMenus(nodes: SystemMenuNode[]): Map<number, SystemMenuNode> {
  const result = new Map<number, SystemMenuNode>();
  const visit = (items: SystemMenuNode[]): void => {
    items.forEach(item => {
      result.set(item.id, item);
      visit(item.children);
    });
  };
  visit(nodes);
  return result;
}

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [roleResult, menuResult] = await Promise.all([
      listSystemRoles(),
      getSystemMenuTree()
    ]);
    rows.value = roleResult;
    menuTree.value = menuResult;
    errorMessage.value = "";
  } catch (error) {
    rows.value = [];
    errorMessage.value = apiErrorMessage(error, "角色列表加载失败");
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingRole.value = undefined;
  Object.assign(form, { roleName: "", roleCode: "", remark: "" });
  formVisible.value = true;
}

function openEdit(row: SystemRole): void {
  editingRole.value = row;
  Object.assign(form, {
    roleName: row.roleName,
    roleCode: row.roleCode,
    remark: row.remark ?? ""
  });
  formVisible.value = true;
}

async function saveRole(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    if (editingRole.value) {
      await updateSystemRole(editingRole.value.id, {
        roleName: form.roleName.trim(),
        remark: form.remark.trim() || undefined
      });
    } else {
      await createSystemRole({
        roleName: form.roleName.trim(),
        roleCode: form.roleCode.trim(),
        remark: form.remark.trim() || undefined
      });
    }
    ElMessage.success(editingRole.value ? "角色已更新" : "角色已创建");
    formVisible.value = false;
    await refresh();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "角色保存失败"));
  } finally {
    saving.value = false;
  }
}

async function openPermissions(row: SystemRole): Promise<void> {
  permissionRole.value = row;
  permissionVisible.value = true;
  permissionLoading.value = true;
  try {
    const ids = await getSystemRoleMenuIds(row.id);
    await nextTick();
    treeRef.value?.setCheckedKeys(ids, false);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "角色权限加载失败"));
  } finally {
    permissionLoading.value = false;
  }
}

async function savePermissions(): Promise<void> {
  if (!permissionRole.value || permissionRole.value.system) return;
  const byId = flattenMenus(menuTree.value);
  const checked = treeRef.value?.getCheckedKeys(false) as number[] | undefined;
  const selected = new Set<number>();
  (checked ?? []).forEach(id => {
    const node = byId.get(id);
    if (!node || node.menuType === "D") return;
    selected.add(id);
    if (node.menuType === "B") {
      const parent = byId.get(node.parentId);
      if (parent?.menuType === "M") selected.add(parent.id);
    }
  });
  permissionLoading.value = true;
  try {
    await replaceSystemRoleMenus(permissionRole.value.id, [...selected]);
    ElMessage.success("角色权限已保存");
    permissionVisible.value = false;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "角色权限保存失败"));
  } finally {
    permissionLoading.value = false;
  }
}

async function toggleStatus(row: SystemRole): Promise<void> {
  const nextStatus: SystemStatus = row.status === 1 ? 0 : 1;
  const action = nextStatus === 1 ? "启用" : "禁用";
  try {
    await ElMessageBox.confirm(
      `确认${action}角色“${row.roleName}”吗？`,
      `${action}确认`,
      { type: "warning" }
    );
    await changeSystemRoleStatus(row.id, nextStatus);
    ElMessage.success(`角色已${action}`);
    await refresh();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(apiErrorMessage(error, `${action}角色失败`));
  }
}

onMounted(refresh);
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="角色"
          ><el-input
            v-model="filters.keyword"
            clearable
            placeholder="名称或编码"
        /></el-form-item>
        <el-form-item label="状态"
          ><el-select v-model="filters.status" clearable placeholder="全部"
            ><el-option label="启用" :value="1" /><el-option
              label="禁用"
              :value="0" /></el-select
        ></el-form-item>
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
      ><el-button link type="primary" @click="refresh"
        >重试</el-button
      ></el-alert
    >
    <PureTableBar title="角色管理" :columns="columns" @refresh="refresh">
      <template #buttons
        ><el-button
          v-auth="'tenant:system-role:create'"
          type="primary"
          @click="openCreate"
          >新增角色</el-button
        ></template
      >
      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="filteredRows" row-key="id" border>
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop"
            v-bind="column"
            min-width="130"
          >
            <template v-if="column.prop === 'roleName'" #default="{ row }"
              ><span>{{ row.roleName }}</span
              ><el-tag v-if="row.system" class="system-tag" size="small"
                >系统</el-tag
              ></template
            >
            <template v-else-if="column.prop === 'status'" #default="{ row }"
              ><el-tag :type="row.status === 1 ? 'success' : 'info'">{{
                row.status === 1 ? "启用" : "禁用"
              }}</el-tag></template
            >
            <template
              v-else-if="column.prop === 'createdAt'"
              #default="{ row }"
              >{{ new Date(row.createdAt).toLocaleString() }}</template
            >
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="240">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:system-role:edit'"
                link
                type="primary"
                :disabled="row.system"
                @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button
                v-auth="'tenant:system-role:grant'"
                link
                type="primary"
                @click="openPermissions(row)"
                >{{ row.system ? "查看权限" : "分配权限" }}</el-button
              >
              <el-button
                v-auth="'tenant:system-role:status'"
                link
                :disabled="row.system"
                :type="row.status === 1 ? 'danger' : 'success'"
                @click="toggleStatus(row)"
                >{{ row.status === 1 ? "禁用" : "启用" }}</el-button
              >
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无角色" /></template>
        </el-table>
      </template>
    </PureTableBar>

    <el-dialog
      v-model="formVisible"
      :title="editingRole ? '编辑角色' : '新增角色'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="roleName"
          ><el-input
            v-model="form.roleName"
            maxlength="64"
            placeholder="请输入角色名称，例如 运营人员"
        /></el-form-item>
        <el-form-item label="角色编码" prop="roleCode"
          ><el-input
            v-model="form.roleCode"
            :disabled="Boolean(editingRole)"
            maxlength="64"
            placeholder="请输入角色编码，例如 OPERATOR，创建后不可修改"
        /></el-form-item>
        <el-form-item label="备注"
          ><el-input
            v-model="form.remark"
            type="textarea"
            maxlength="255"
            show-word-limit
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="formVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="saveRole"
          >保存</el-button
        ></template
      >
    </el-dialog>

    <el-dialog
      v-model="permissionVisible"
      :title="`${permissionRole?.roleName ?? ''} - 权限配置`"
      width="600px"
      destroy-on-close
    >
      <el-alert
        v-if="permissionRole?.system"
        type="info"
        :closable="false"
        title="系统管理员自动拥有全部有效权限，不保存授权关系。"
      />
      <el-tree
        ref="treeRef"
        v-loading="permissionLoading"
        class="permission-tree"
        :data="menuTree"
        :props="treeProps"
        node-key="id"
        show-checkbox
        check-strictly
        default-expand-all
      />
      <template #footer
        ><el-button @click="permissionVisible = false">关闭</el-button
        ><el-button
          v-if="!permissionRole?.system"
          type="primary"
          :loading="permissionLoading"
          @click="savePermissions"
          >保存权限</el-button
        ></template
      >
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

.system-tag {
  margin-left: 8px;
}

.permission-tree {
  min-height: 280px;
  margin-top: 12px;
}

:deep(.filter-card .el-input),
:deep(.filter-card .el-select) {
  width: 220px;
}
</style>
