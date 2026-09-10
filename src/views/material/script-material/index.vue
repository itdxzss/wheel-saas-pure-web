<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  listScriptMaterials,
  saveScriptMaterial,
  copyScriptMaterial,
  type ScriptMaterial
} from "@/api/script-library";
import { newStep } from "@/views/task/script-marketing/form";
import ScriptMessageEditor from "@/views/task/script-marketing/components/ScriptMessageEditor.vue";
import { apiErrorMessage } from "@/utils/api-error";
defineOptions({ name: "ScriptMaterialLibrary" });
const filters = reactive({
  keyword: "",
  linkMode: undefined as number | undefined
});
const page = ref(1);
const total = ref(0);
const rows = ref<ScriptMaterial[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const open = ref(false);
const saving = ref(false);
const editing = ref<number>();
const message = ref(newStep().message);
async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listScriptMaterials({
      ...filters,
      page: page.value,
      pageSize: 20
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "素材读取失败");
  } finally {
    loading.value = false;
  }
}
function edit(row?: ScriptMaterial) {
  editing.value = row?.id;
  message.value = row ? JSON.parse(JSON.stringify(row)) : newStep().message;
  open.value = true;
}
async function save() {
  if (!message.value.templateName.trim()) {
    ElMessage.warning("请填写素材名称");
    return;
  }
  saving.value = true;
  try {
    await saveScriptMaterial(message.value, editing.value);
    open.value = false;
    ElMessage.success("素材已保存");
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "素材保存失败"));
  } finally {
    saving.value = false;
  }
}
async function copy(row: ScriptMaterial) {
  try {
    await copyScriptMaterial(row.id);
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "素材复制失败"));
  }
}
onMounted(load);
</script>

<template>
  <div class="library bg-bg_color">
    <el-space class="toolbar" wrap
      ><h2>剧本素材库</h2>
      <el-button
        v-perms="'tenant:script_marketing:create'"
        type="primary"
        @click="edit()"
        >新建消息素材</el-button
      >
      <el-button :loading="loading" @click="load">刷新</el-button>
    </el-space>
    <el-alert
      title="消息素材与现有营销模板共用，图片与超链共用素材库。选入剧本后保存副本，原素材修改不改变已保存剧本。"
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
      <el-form-item label="素材名称"
        ><el-input v-model="filters.keyword" clearable
      /></el-form-item>
      <el-form-item label="类型"
        ><el-select
          v-model="filters.linkMode"
          clearable
          placeholder="全部"
          style="width: 160px"
        >
          <el-option :value="1" label="文字 / 链接" /><el-option
            :value="3"
            label="图片 / 图文"
          /><el-option :value="2" label="按钮消息" /> </el-select
      ></el-form-item>
      <el-form-item
        ><el-button type="primary" native-type="submit"
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
      empty-text="暂无可复用消息素材"
    >
      <el-table-column prop="id" label="ID" width="80" /><el-table-column
        prop="templateName"
        label="素材名称"
        min-width="160"
      />
      <el-table-column label="类型" width="120"
        ><template #default="{ row }">{{
          row.linkMode === 2
            ? "按钮消息"
            : row.linkMode === 3
              ? "图片 / 图文"
              : "文字 / 链接"
        }}</template></el-table-column
      >
      <el-table-column
        prop="content"
        label="内容"
        min-width="240"
        show-overflow-tooltip
      />
      <el-table-column label="图片" width="100"
        ><template #default="{ row }">{{
          row.imageFileId ? "已附带" : "—"
        }}</template></el-table-column
      >
      <el-table-column label="操作" width="160"
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
            @click="copy(row)"
            >复制</el-button
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
      :title="editing ? '编辑消息素材' : '新建消息素材'"
      size="780px"
      :close-on-click-modal="false"
    >
      <el-form :model="message" label-width="100px" :disabled="saving">
        <el-form-item label="素材名称" required
          ><el-input v-model="message.templateName" maxlength="100"
        /></el-form-item>
        <ScriptMessageEditor v-model="message" :show-template-picker="false" />
      </el-form>
      <template #footer
        ><el-button :disabled="saving" @click="open = false">取消</el-button
        ><el-button type="primary" :loading="saving" @click="save"
          >保存素材</el-button
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
</style>
