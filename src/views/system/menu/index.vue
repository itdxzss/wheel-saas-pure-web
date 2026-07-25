<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { IconifyIconOnline } from "@/components/ReIcon";
import {
  changeSystemMenuStatus,
  createSystemMenu,
  getSystemMenuTree,
  updateSystemMenu,
  type SystemMenuNode,
  type SystemMenuPayload,
  type SystemMenuType
} from "@/api/system-menu";
import type { SystemStatus } from "@/api/system-user";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "SystemMenu" });

const rows = ref<SystemMenuNode[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const dialogVisible = ref(false);
const editingId = ref<number>();
const editingNode = ref<SystemMenuNode | null>(null);
const createParent = ref<SystemMenuNode | null>(null);
const formRef = ref<FormInstance>();
const treeProps = { children: "children", hasChildren: "hasChildren" };
const form = reactive<SystemMenuPayload>({
  parentId: 0,
  menuName: "",
  menuKey: "",
  menuType: "D",
  routePath: undefined,
  componentPath: undefined,
  permKey: undefined,
  icon: undefined,
  sortNo: 0
});
const columns = [
  { label: "节点名称", prop: "menuName" },
  { label: "菜单标识", prop: "menuKey" },
  { label: "节点类型", prop: "menuType" },
  { label: "路由路径", prop: "routePath" },
  { label: "组件路径", prop: "componentPath" },
  { label: "权限编码", prop: "permKey" },
  { label: "排序", prop: "sortNo" },
  { label: "状态", prop: "status" }
];
const typeOptions: Array<{ label: string; value: SystemMenuType }> = [
  { label: "D目录", value: "D" },
  { label: "M菜单", value: "M" },
  { label: "B按钮", value: "B" }
];
const componentOptions = [
  "account/index/index",
  "account/group/index",
  "account/import/index",
  "group/imports/index",
  "group/list/index",
  "group/history/index",
  "task/pull-task/index",
  "task/join-task/index",
  "task/group-marketing/index",
  "task/group-pull-marketing/index",
  "task/group-creation-marketing/index",
  "material/marketing-template/index",
  "resource/ip/index",
  "resource/ip-stats/index",
  "buyer/template/index",
  "buyer/channel/index",
  "buyer/channel-stats/index",
  "system/user/index",
  "system/role/index",
  "system/menu/index"
];
const iconOptions = [
  { label: "用户", value: "ep:user" },
  { label: "群聊", value: "ep:chat-dot-round" },
  { label: "列表", value: "ep:list" },
  { label: "文档", value: "ep:document" },
  { label: "连接", value: "ep:connection" },
  { label: "趋势", value: "ep:trend-charts" },
  { label: "设置", value: "ep:setting" },
  { label: "首页", value: "ep:home-filled" },
  { label: "文件夹", value: "ep:folder" },
  { label: "数据分析", value: "ep:data-analysis" },
  { label: "任务", value: "ep:tickets" },
  { label: "资源", value: "ep:coin" },
  { label: "权限", value: "ep:lock" },
  { label: "菜单", value: "ep:menu" },
  { label: "工具", value: "ep:tools" },
  { label: "监控", value: "ep:monitor" }
];
const rules = {
  menuName: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
  menuKey: [{ required: true, message: "请输入菜单标识", trigger: "blur" }],
  menuType: [{ required: true, message: "请选择节点类型", trigger: "change" }]
};

const flatNodes = computed(() => {
  const result: SystemMenuNode[] = [];
  const visit = (nodes: SystemMenuNode[]): void =>
    nodes.forEach(node => {
      result.push(node);
      visit(node.children);
    });
  visit(rows.value);
  return result;
});
const isCreating = computed(() => editingId.value === undefined);
const isEditing = computed(() => editingId.value !== undefined);
const isRootCreate = computed(
  () => isCreating.value && createParent.value === null
);
const isChildCreate = computed(
  () => isCreating.value && createParent.value !== null
);
const selectableTypeOptions = computed(() => {
  if (!isCreating.value) return typeOptions;
  const parent = createParent.value;
  if (!parent) return typeOptions.filter(item => item.value === "D");
  if (parent.menuType === "M")
    return typeOptions.filter(item => item.value === "B");
  return typeOptions.filter(item => item.value !== "B");
});
const dialogTitle = computed(() => {
  if (editingNode.value)
    return `编辑${nodeTypeName(editingNode.value.menuType)}“${editingNode.value.menuName}”`;
  if (isRootCreate.value) return "新增一级目录";
  return `在“${createParent.value?.menuName ?? ""}”下新增子节点`;
});
const editingParentName = computed(() => {
  if (!editingNode.value?.parentId) return "根节点";
  return (
    flatNodes.value.find(node => node.id === editingNode.value?.parentId)
      ?.menuName ?? "未知父节点"
  );
});

function nodeTypeLabel(type: SystemMenuType): string {
  return typeOptions.find(item => item.value === type)?.label ?? type;
}

function nodeTypeName(type: SystemMenuType): string {
  if (type === "D") return "目录";
  if (type === "M") return "菜单";
  return "按钮";
}

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    rows.value = await getSystemMenuTree();
    errorMessage.value = "";
  } catch (error) {
    rows.value = [];
    errorMessage.value = apiErrorMessage(error, "菜单树加载失败");
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
}

function resetForm(): void {
  Object.assign(form, {
    parentId: 0,
    menuName: "",
    menuKey: "",
    menuType: "D",
    routePath: undefined,
    componentPath: undefined,
    permKey: undefined,
    icon: undefined,
    sortNo: 0
  });
}

function openCreate(parent?: SystemMenuNode): void {
  editingId.value = undefined;
  editingNode.value = null;
  createParent.value = parent ?? null;
  resetForm();
  if (parent) {
    form.parentId = parent.id;
    form.menuType = parent.menuType === "M" ? "B" : "M";
  }
  dialogVisible.value = true;
}

function openEdit(row: SystemMenuNode): void {
  editingId.value = row.id;
  editingNode.value = row;
  createParent.value = null;
  Object.assign(form, {
    parentId: row.parentId,
    menuName: row.menuName,
    menuKey: row.menuKey,
    menuType: row.menuType,
    routePath: row.routePath,
    componentPath: row.componentPath,
    permKey: row.permKey,
    icon: row.icon,
    sortNo: row.sortNo
  });
  dialogVisible.value = true;
}

function payload(): SystemMenuPayload {
  return {
    parentId: form.parentId,
    menuName: form.menuName.trim(),
    menuKey: form.menuKey.trim(),
    menuType: form.menuType,
    routePath: form.menuType === "M" ? form.routePath?.trim() : undefined,
    componentPath: form.menuType === "M" ? form.componentPath : undefined,
    permKey: form.menuType === "D" ? undefined : form.permKey?.trim(),
    icon: form.menuType === "B" ? undefined : form.icon?.trim(),
    sortNo: form.sortNo
  };
}

async function save(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  if (form.menuType !== "D" && !form.parentId) {
    ElMessage.warning("菜单或按钮必须选择父节点");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) await updateSystemMenu(editingId.value, payload());
    else await createSystemMenu(payload());
    ElMessage.success(editingId.value ? "菜单节点已更新" : "菜单节点已创建");
    dialogVisible.value = false;
    await refresh();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "菜单节点保存失败"));
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: SystemMenuNode): Promise<void> {
  const nextStatus: SystemStatus = row.status === 1 ? 0 : 1;
  const action = nextStatus === 1 ? "启用" : "禁用";
  try {
    await ElMessageBox.confirm(
      `${action}父节点会影响其子节点的实际权限，确认继续吗？`,
      `${action}确认`,
      { type: "warning" }
    );
    await changeSystemMenuStatus(row.id, nextStatus);
    ElMessage.success(`菜单节点已${action}`);
    await refresh();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(apiErrorMessage(error, `${action}菜单节点失败`));
  }
}

onMounted(refresh);
</script>

<template>
  <div class="system-page">
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
    <PureTableBar title="菜单管理" :columns="columns" @refresh="refresh">
      <template #buttons
        ><el-button
          v-auth="'tenant:system-menu:create'"
          type="primary"
          @click="openCreate()"
          >新增一级目录</el-button
        ></template
      >
      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          :tree-props="treeProps"
          default-expand-all
          border
        >
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop"
            v-bind="column"
            min-width="130"
          >
            <template v-if="column.prop === 'menuType'" #default="{ row }"
              ><el-tag>{{ nodeTypeLabel(row.menuType) }}</el-tag></template
            >
            <template v-else-if="column.prop === 'status'" #default="{ row }"
              ><el-tag :type="row.status === 1 ? 'success' : 'info'">{{
                row.status === 1 ? "启用" : "禁用"
              }}</el-tag></template
            >
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="220">
            <template #default="{ row }">
              <el-button
                v-if="row.menuType !== 'B'"
                v-auth="'tenant:system-menu:create'"
                link
                type="primary"
                @click="openCreate(row)"
                >新增子节点</el-button
              >
              <el-button
                v-auth="'tenant:system-menu:edit'"
                link
                type="primary"
                @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button
                v-auth="'tenant:system-menu:status'"
                link
                :type="row.status === 1 ? 'danger' : 'success'"
                @click="toggleStatus(row)"
                >{{ row.status === 1 ? "禁用" : "启用" }}</el-button
              >
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无菜单节点" /></template>
        </el-table>
      </template>
    </PureTableBar>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="isChildCreate" label="节点类型" prop="menuType"
          ><el-radio-group v-model="form.menuType"
            ><el-radio-button
              v-for="item in selectableTypeOptions"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-radio-button
            ></el-radio-group
          ></el-form-item
        >
        <el-form-item v-if="isEditing" label="节点类型">
          <el-input :model-value="nodeTypeName(form.menuType)" disabled />
        </el-form-item>
        <el-form-item v-if="createParent" label="父节点">
          <el-input :model-value="createParent?.menuName" disabled />
        </el-form-item>
        <el-form-item v-else-if="isEditing" label="父节点">
          <el-input :model-value="editingParentName" disabled />
        </el-form-item>
        <el-form-item label="节点名称" prop="menuName"
          ><el-input v-model="form.menuName" maxlength="64"
        /></el-form-item>
        <el-form-item label="菜单标识" prop="menuKey"
          ><el-input v-model="form.menuKey" maxlength="64"
        /></el-form-item>
        <el-form-item v-if="form.menuType === 'M'" label="路由路径"
          ><el-input
            v-model="form.routePath"
            placeholder="例如 /system/user"
            maxlength="128"
        /></el-form-item>
        <el-form-item v-if="form.menuType === 'M'" label="组件路径"
          ><el-select v-model="form.componentPath" filterable class="full-width"
            ><el-option
              v-for="item in componentOptions"
              :key="item"
              :label="item"
              :value="item" /></el-select
        ></el-form-item>
        <el-form-item v-if="form.menuType !== 'D'" label="权限编码"
          ><el-input v-model="form.permKey" maxlength="128"
        /></el-form-item>
        <el-form-item v-if="form.menuType !== 'B'" label="图标">
          <el-select
            v-model="form.icon"
            filterable
            clearable
            class="full-width"
            placeholder="请选择菜单图标"
          >
            <el-option
              v-for="item in iconOptions"
              :key="item.value"
              :label="`${item.label} ${item.value}`"
              :value="item.value"
            >
              <div class="icon-option">
                <IconifyIconOnline :icon="item.value" />
                <span>{{ item.label }}</span>
                <code>{{ item.value }}</code>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序"
          ><el-input-number v-model="form.sortNo" :min="0" :max="9999"
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="dialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="save"
          >保存</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>

<style scoped>
.system-page {
  padding: 16px;
}

.system-page > .el-alert {
  margin-bottom: 16px;
}

.full-width {
  width: 100%;
}

.icon-option {
  display: flex;
  gap: 10px;
  align-items: center;
}

.icon-option code {
  margin-left: auto;
  color: var(--el-text-color-secondary);
}
</style>
