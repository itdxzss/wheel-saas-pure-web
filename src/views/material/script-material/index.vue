<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
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
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import Gallery from "~icons/solar/gallery-wide-bold-duotone";
import Plus from "~icons/ep/plus";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import ScriptMaterialCard from "./components/ScriptMaterialCard.vue";
import ScriptMaterialPreview from "./components/ScriptMaterialPreview.vue";

defineOptions({ name: "ScriptMaterialLibrary" });
const filters = reactive({
  keyword: "",
  linkMode: undefined as number | undefined
});
const page = ref(1);
const pageSize = ref(24);
const total = ref(0);
const rows = ref<ScriptMaterial[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const open = ref(false);
const saving = ref(false);
const editing = ref<number>();
const message = ref(newStep().message);
const previewOpen = ref(false);
const previewMaterial = ref<ScriptMaterial>();
const copyingIds = reactive(new Set<number>());
let requestId = 0;

async function load() {
  const current = ++requestId;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listScriptMaterials({
      keyword: filters.keyword.trim() || undefined,
      linkMode: filters.linkMode,
      page: page.value,
      pageSize: pageSize.value
    });
    if (current !== requestId) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (current !== requestId) return;
    rows.value = [];
    total.value = 0;
    errorMessage.value = apiErrorMessage(error, "素材读取失败");
  } finally {
    if (current === requestId) loading.value = false;
  }
}
function search() {
  page.value = 1;
  void load();
}
function reset() {
  filters.keyword = "";
  filters.linkMode = undefined;
  search();
}
function preview(row: ScriptMaterial) {
  previewMaterial.value = row;
  previewOpen.value = true;
}
function edit(row?: ScriptMaterial) {
  editing.value = row?.id;
  message.value = row ? JSON.parse(JSON.stringify(row)) : newStep().message;
  previewOpen.value = false;
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
  if (copyingIds.has(row.id)) return;
  copyingIds.add(row.id);
  try {
    await copyScriptMaterial(row.id);
    ElMessage.success("素材已复制");
    page.value = 1;
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "素材复制失败"));
  } finally {
    copyingIds.delete(row.id);
  }
}
onMounted(load);
onBeforeUnmount(() => requestId++);
</script>

<template>
  <div class="script-material-page">
    <el-card shadow="never" class="intro-card">
      <div class="intro-content">
        <div class="intro-icon" aria-hidden="true">
          <component :is="useRenderIcon(Gallery)" />
        </div>
        <div class="intro-copy">
          <h2>剧本素材库</h2>
          <p>
            管理文字、图片和按钮消息，编排剧本时可直接选用。素材修改不影响已保存的剧本。
          </p>
        </div>
        <el-button
          v-perms="'tenant:script_marketing:create'"
          :icon="useRenderIcon(Plus)"
          @click="edit()"
          >新建消息素材</el-button
        >
      </div>
    </el-card>

    <el-card shadow="never" class="filter-card">
      <el-form :model="filters" inline @submit.prevent="search">
        <el-form-item label="素材名称">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="按素材名称搜索"
            @clear="search"
          />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select
            v-model="filters.linkMode"
            clearable
            placeholder="全部类型"
            @change="search"
          >
            <el-option :value="1" label="文字 / 链接" />
            <el-option :value="3" label="图片 / 图文" />
            <el-option :value="2" label="按钮消息" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :icon="useRenderIcon(Search)"
            >查询</el-button
          >
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div class="list-toolbar">
        <span
          >消息素材 <span class="material-count">共 {{ total }} 条</span></span
        >
        <el-button
          :icon="useRenderIcon(Refresh)"
          :loading="loading"
          @click="load"
          >刷新</el-button
        >
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
      />
      <div v-loading="loading" class="material-list">
        <div v-if="rows.length" class="material-grid">
          <ScriptMaterialCard
            v-for="row in rows"
            :key="row.id"
            :material="row"
            :copying="copyingIds.has(row.id)"
            @preview="preview"
            @edit="edit"
            @copy="copy"
          />
        </div>
        <el-empty
          v-else-if="!loading && !errorMessage"
          :description="
            filters.keyword || filters.linkMode
              ? '暂无符合条件的素材'
              : '暂无消息素材'
          "
        >
          <el-button v-if="filters.keyword || filters.linkMode" @click="reset"
            >清空筛选</el-button
          >
          <el-button
            v-else
            v-perms="'tenant:script_marketing:create'"
            type="primary"
            @click="edit()"
            >创建第一条素材</el-button
          >
        </el-empty>
      </div>
      <WheelPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        @change="load"
      />
    </el-card>

    <el-drawer
      v-model="previewOpen"
      title="素材预览"
      size="min(560px, 100vw)"
      destroy-on-close
    >
      <template v-if="previewMaterial">
        <h3 class="preview-name">{{ previewMaterial.templateName }}</h3>
        <ScriptMaterialPreview :message="previewMaterial" />
      </template>
      <template #footer>
        <el-button @click="previewOpen = false">关闭</el-button>
        <el-button
          v-perms="'tenant:script_marketing:edit'"
          type="primary"
          @click="edit(previewMaterial)"
          >编辑素材</el-button
        >
      </template>
    </el-drawer>

    <el-drawer
      v-model="open"
      :title="editing ? '编辑消息素材' : '新建消息素材'"
      size="min(780px, 100vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      :show-close="!saving"
      destroy-on-close
    >
      <el-form :model="message" label-width="100px" :disabled="saving">
        <el-form-item label="素材名称" required
          ><el-input v-model="message.templateName" maxlength="100"
        /></el-form-item>
        <ScriptMessageEditor v-model="message" :show-template-picker="false" />
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="open = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save"
          >保存素材</el-button
        >
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.script-material-page {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.intro-card {
  color: #fff;
  background: linear-gradient(
    110deg,
    var(--el-color-primary),
    var(--el-color-primary-dark-2)
  );
  border: 0;
}

.intro-content,
.list-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
}

.intro-icon {
  display: grid;
  flex: 0 0 48px;
  place-items: center;
  height: 48px;
  font-size: 28px;
  background: rgb(255 255 255 / 14%);
  border: 1px solid rgb(255 255 255 / 36%);
  border-radius: 10px;
}

.intro-copy {
  flex: 1;
  min-width: 0;
}

.intro-copy h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.intro-copy p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.filter-card .el-input {
  width: 220px;
}

.filter-card .el-select {
  width: 180px;
}

.list-toolbar {
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
}

.material-count {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.material-list {
  min-height: 300px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  align-items: start;
}

.preview-name {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media (width <= 600px) {
  .script-material-page {
    padding: 8px;
  }

  .intro-content {
    flex-wrap: wrap;
  }

  .intro-icon {
    display: none;
  }

  .intro-copy {
    flex-basis: 100%;
  }

  .material-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .list-card :deep(.el-pagination) {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
}
</style>
