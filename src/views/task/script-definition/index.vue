<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  listScriptDefinitions,
  getScriptDefinition,
  saveScriptDefinition,
  deleteScriptDefinition,
  type ScriptDefinitionSummary
} from "@/api/script-library";
import ScriptComposer from "./components/ScriptComposer.vue";
import {
  newStep,
  copyStep,
  type EditableStep
} from "@/views/task/script-marketing/form";
import { apiErrorMessage } from "@/utils/api-error";
defineOptions({ name: "ScriptDefinitionLibrary" });
const filters = reactive({
  keyword: "",
  status: undefined as number | undefined
});
const page = ref(1);
const total = ref(0);
const rows = ref<ScriptDefinitionSummary[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const open = ref(false);
const saving = ref(false);
const editing = ref<number>();
const composer = ref<InstanceType<typeof ScriptComposer>>();
const form = reactive<{
  name: string;
  enabled: boolean;
  steps: EditableStep[];
}>({ name: "", enabled: true, steps: [] });
async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listScriptDefinitions({
      ...filters,
      page: page.value,
      pageSize: 20
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "剧本读取失败");
  } finally {
    loading.value = false;
  }
}
async function edit(row?: ScriptDefinitionSummary, copy = false) {
  try {
    const value = row ? await getScriptDefinition(row.id) : undefined;
    editing.value = copy ? undefined : row?.id;
    form.name = value ? value.name + (copy ? " 副本" : "") : "";
    form.enabled = value?.enabled ?? true;
    form.steps = value
      ? value.steps.map(copyStep)
      : [newStep("ADMIN"), newStep()];
    if (!value) form.steps[1].roleKey = "推手1";
    open.value = true;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "剧本读取失败"));
  }
}
async function save() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写剧本名称");
    return;
  }
  if (!composer.value?.validate()) return;
  saving.value = true;
  try {
    await saveScriptDefinition(
      {
        name: form.name.trim(),
        enabled: form.enabled,
        steps: form.steps.map(step => ({
          role: step.role,
          roleKey: step.roleKey?.trim() || "",
          accountId: null,
          waitMinSeconds: step.waitMinSeconds,
          waitMaxSeconds: step.waitMaxSeconds,
          message: {
            ...step.message,
            buttons: step.message.linkMode === 2 ? step.message.buttons : [],
            promotionLink:
              step.message.linkMode === 2 ? "" : step.message.promotionLink
          }
        }))
      },
      editing.value
    );
    open.value = false;
    ElMessage.success("剧本已保存，创建任务时可以选用");
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "剧本保存失败"));
  } finally {
    saving.value = false;
  }
}
async function remove(row: ScriptDefinitionSummary) {
  try {
    await ElMessageBox.confirm(
      "删除后不再出现在剧本库，已保存任务的内容保持不变。",
      "删除剧本",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deleteScriptDefinition(row.id);
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "剧本删除失败"));
  }
}
onMounted(load);
</script>

<template>
  <div class="library bg-bg_color">
    <el-space class="toolbar" wrap
      ><h2>养群剧本</h2>
      <el-button
        v-perms="'tenant:script_marketing:create'"
        type="primary"
        @click="edit()"
        >新建剧本</el-button
      ><el-button :loading="loading" @click="load">刷新</el-button>
    </el-space>
    <el-alert
      title="在这里编排角色、素材和发送间隔；创建任务时再选择推手分组、管理员及目标群。"
      type="info"
      :closable="false"
    />
    <el-form
      :model="filters"
      inline
      class="search"
      @submit.prevent="
        page = 1;
        load();
      "
    >
      <el-form-item label="剧本名称"
        ><el-input v-model="filters.keyword" clearable
      /></el-form-item>
      <el-form-item label="状态"
        ><el-select
          v-model="filters.status"
          clearable
          placeholder="全部"
          style="width: 150px"
        >
          <el-option :value="1" label="启用" /><el-option
            :value="0"
            label="停用"
          /> </el-select></el-form-item
      ><el-form-item
        ><el-button native-type="submit" type="primary"
          >查询</el-button
        ></el-form-item
      >
    </el-form>
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="false"
    />
    <el-table
      v-loading="loading"
      :data="rows"
      row-key="id"
      border
      empty-text="暂无养群剧本"
    >
      <el-table-column prop="id" label="ID" width="80" /><el-table-column
        prop="name"
        label="剧本名称"
        min-width="220"
      />
      <el-table-column label="状态" width="100"
        ><template #default="{ row }"
          ><el-tag :type="row.enabled ? 'success' : 'info'">{{
            row.enabled ? "启用" : "停用"
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="更新时间" min-width="180"
        ><template #default="{ row }">{{
          new Date(row.updatedAt).toLocaleString()
        }}</template></el-table-column
      >
      <el-table-column label="操作" min-width="220"
        ><template #default="{ row }">
          <el-button
            v-perms="'tenant:script_marketing:edit'"
            link
            type="primary"
            @click="edit(row)"
            >编辑</el-button
          >
          <el-button
            v-perms="'tenant:script_marketing:create'"
            link
            @click="edit(row, true)"
            >复制</el-button
          >
          <el-button
            v-perms="'tenant:script_marketing:edit'"
            link
            type="danger"
            @click="remove(row)"
            >删除</el-button
          >
        </template></el-table-column
      >
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="20"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
    />
    <el-drawer
      v-model="open"
      :title="editing ? '编辑养群剧本' : '新建养群剧本'"
      class="script-definition-drawer"
      size="min(1720px, 96vw)"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form
        :model="form"
        label-position="top"
        class="definition-form"
        :disabled="saving"
      >
        <div class="definition-basics">
          <el-form-item label="剧本名称" required
            ><el-input v-model="form.name" maxlength="100"
          /></el-form-item>
          <el-form-item label="启用"
            ><el-switch v-model="form.enabled"
          /></el-form-item>
          <span class="basics-hint"
            >编排角色和消息，创建任务时再分配账号与目标群。</span
          >
        </div>
        <ScriptComposer ref="composer" v-model="form.steps" />
      </el-form>
      <template #footer
        ><el-button :disabled="saving" @click="open = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="save"
          >保存剧本</el-button
        ></template
      >
    </el-drawer>
  </div>
</template>

<style scoped>
.library {
  padding: 20px;
  border-radius: 8px;
}

.toolbar {
  margin-bottom: 16px;
}

.search {
  margin-top: 20px;
}

.el-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}

:deep(.script-definition-drawer .el-drawer__header) {
  padding: 18px 20px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.script-definition-drawer .el-drawer__body) {
  display: flex;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

:deep(.script-definition-drawer .el-drawer__footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.definition-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.definition-basics {
  display: flex;
  flex: 0 0 auto;
  gap: 24px;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.definition-basics .el-form-item {
  margin-bottom: 0;
}

.definition-basics .el-form-item:first-child {
  flex: 1;
  max-width: 640px;
}

.basics-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1000px) {
  :deep(.script-definition-drawer) {
    width: 100% !important;
  }

  .basics-hint {
    display: none;
  }
}

@media (width <= 700px) {
  :deep(.script-definition-drawer .el-drawer__body) {
    display: block;
    overflow: auto;
  }
}
</style>
