<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox, type UploadFile } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  batchDeleteGroupImportGroups,
  createGroupLinkImportBatch,
  createGroupLinkLabel,
  exportGroupImportGroupFailures,
  listGroupImportDetails,
  listGroupImportGroups,
  listGroupLinksForMigration,
  listGroupLinkLabels,
  migrateGroupLinks,
  type GroupImportDetail,
  type GroupImportGroup,
  type GroupLinkForMigration,
  type GroupLinkLabel
} from "@/api/group-import";
import { apiErrorMessage } from "@/utils/api-error";
import { formatEpochMillis } from "@/utils/time";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "TaskGroupLinkImports"
});

interface GroupImportSearchForm {
  keyword: string;
  id: string;
  importedRange: string[];
  status: string;
}

interface GroupImportForm {
  linkLabelId: string;
  sourceName: string;
  text: string;
}

interface CreateLabelForm {
  name: string;
  country: string;
  remark: string;
}

const searchForm = ref<GroupImportSearchForm>({
  keyword: "",
  id: "",
  importedRange: [],
  status: ""
});
const importForm = ref<GroupImportForm>({
  linkLabelId: "",
  sourceName: "",
  text: ""
});
const createLabelForm = ref<CreateLabelForm>({
  name: "",
  country: "",
  remark: ""
});
const loading = ref(false);
const importSubmitting = ref(false);
const createLabelSubmitting = ref(false);
const detailLoading = ref(false);
const migrateLoading = ref(false);
const migrateSubmitting = ref(false);
const showImportDrawer = ref(false);
const showCreateLabelDrawer = ref(false);
const showDetailDrawer = ref(false);
const showMigrateDrawer = ref(false);
const rows = ref<GroupImportGroup[]>([]);
const selectedRows = ref<GroupImportGroup[]>([]);
const labelOptions = ref<GroupLinkLabel[]>([]);
const uploadFiles = ref<UploadFile[]>([]);
const importFile = ref<File | null>(null);
const currentDetailGroup = ref<GroupImportGroup | null>(null);
const currentMigrateGroup = ref<GroupImportGroup | null>(null);
const detailRows = ref<GroupImportDetail[]>([]);
const migrateRows = ref<GroupLinkForMigration[]>([]);
const selectedMigrateLinks = ref<GroupLinkForMigration[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const detailPage = ref(1);
const detailPageSize = ref(10);
const detailTotal = ref(0);
const migratePage = ref(1);
const migratePageSize = ref(10);
const migrateTotal = ref(0);
const migrateKeyword = ref("");
const migrateTargetLabelId = ref("");

const selectedCount = computed(() => selectedRows.value.length);

const importStatusOptions = [
  { label: "全部状态", value: "" },
  { label: "未导入", value: "EMPTY" },
  { label: "已完成", value: "DONE" },
  { label: "部分成功", value: "PARTIAL" },
  { label: "失败", value: "FAILED" }
];

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "WS链接分组", prop: "linkLabelName", minWidth: 180 },
  { label: "最近来源文件", prop: "sourceFile", minWidth: 180 },
  { label: "导入次数", prop: "fileCount", width: 110 },
  { label: "总行数", prop: "totalRows", width: 100 },
  { label: "成功", prop: "successRows", width: 100 },
  { label: "失败", prop: "failedRows", width: 100 },
  { label: "最近导入", prop: "importedAt", width: 180 },
  { label: "状态", prop: "status", width: 110 }
];

function statusLabel(status?: string | null): string {
  if (status === "DONE") return "已完成";
  if (status === "PARTIAL") return "部分成功";
  if (status === "FAILED") return "失败";
  if (status === "EMPTY") return "未导入";
  return status || "-";
}

function statusType(status?: string | null) {
  if (status === "DONE") return "success";
  if (status === "PARTIAL") return "warning";
  if (status === "FAILED") return "danger";
  return "info";
}

function sourceFileText(row: unknown): string {
  const group = row as GroupImportGroup;
  if (!group.sourceFile) return "-";
  return group.fileCount > 1
    ? `${group.sourceFile} 等${group.fileCount}批`
    : group.sourceFile;
}

function linkName(row: unknown): string {
  const link = row as GroupLinkForMigration;
  return link.groupName || link.waSubject || `群链接 ${link.id}`;
}

function optionalNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function searchId(): number | undefined {
  return optionalNumber(searchForm.value.id.trim());
}

async function refreshImports() {
  selectedRows.value = [];
  loading.value = true;
  try {
    const response = await listGroupImportGroups({
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchForm.value.keyword.trim() || undefined,
      id: searchId(),
      importedFrom: optionalNumber(searchForm.value.importedRange[0]),
      importedTo: optionalNumber(searchForm.value.importedRange[1]),
      status: searchForm.value.status || undefined
    });
    rows.value = response.list ?? [];
    total.value = response.total ?? 0;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(apiErrorMessage(error, "导入链接列表加载失败"));
  } finally {
    loading.value = false;
  }
}

function searchImports() {
  page.value = 1;
  void refreshImports();
}

function resetSearchForm() {
  searchForm.value = {
    keyword: "",
    id: "",
    importedRange: [],
    status: ""
  };
  searchImports();
}

function onSelectionChange(selection: GroupImportGroup[]) {
  selectedRows.value = selection;
}

async function loadLabelOptions(keyword?: string) {
  try {
    const response = await listGroupLinkLabels(keyword);
    labelOptions.value = response.list ?? [];
  } catch (error) {
    labelOptions.value = [];
    ElMessage.warning(apiErrorMessage(error, "WS链接分组加载失败"));
  }
}

function openImportDrawer() {
  importForm.value = {
    linkLabelId: "",
    sourceName: "",
    text: ""
  };
  uploadFiles.value = [];
  importFile.value = null;
  showImportDrawer.value = true;
  void loadLabelOptions();
}

function onUploadChange(file: UploadFile) {
  uploadFiles.value = file ? [file] : [];
  importFile.value = file.raw ?? null;
}

function onUploadRemove() {
  uploadFiles.value = [];
  importFile.value = null;
}

async function submitImport() {
  const labelId = Number(importForm.value.linkLabelId);
  const text = importForm.value.text.trim();
  if (!labelId) {
    ElMessage.warning("请选择WS链接分组");
    return;
  }
  if (!text && !importFile.value) {
    ElMessage.warning("请粘贴群链接内容或上传文件");
    return;
  }
  importSubmitting.value = true;
  try {
    await createGroupLinkImportBatch({
      labelId,
      batchName: importForm.value.sourceName.trim() || null,
      text: text || null,
      file: importFile.value
    });
    ElMessage.success("群链接已导入");
    showImportDrawer.value = false;
    await refreshImports();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "群链接导入失败"));
  } finally {
    importSubmitting.value = false;
  }
}

function openCreateLabelDrawer() {
  createLabelForm.value = {
    name: "",
    country: "",
    remark: ""
  };
  showCreateLabelDrawer.value = true;
}

async function submitCreateLabel() {
  const name = createLabelForm.value.name.trim();
  if (!name) {
    ElMessage.warning("请填写分组名称");
    return;
  }
  createLabelSubmitting.value = true;
  try {
    const created = await createGroupLinkLabel({
      name,
      region: createLabelForm.value.country.trim() || null,
      remark: createLabelForm.value.remark.trim() || null
    });
    ElMessage.success("WS链接分组已新增");
    showCreateLabelDrawer.value = false;
    if (showMigrateDrawer.value) {
      migrateTargetLabelId.value = String(created.id);
    }
    await loadLabelOptions();
    await refreshImports();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "新增WS链接分组失败"));
  } finally {
    createLabelSubmitting.value = false;
  }
}

async function deleteSelectedImports() {
  if (selectedRows.value.length === 0) return;
  const names = selectedRows.value
    .slice(0, 3)
    .map(row => `「${row.linkLabelName}」`)
    .join("、");
  const suffix = selectedRows.value.length > 3 ? "等" : "";
  const hasLinks = selectedRows.value.some(row => row.linkCount > 0);
  const message = hasLinks
    ? `所选分组中存在活跃链接，确认删除 ${names}${suffix} ${selectedRows.value.length} 个WS链接分组吗？`
    : `确认删除 ${names}${suffix} ${selectedRows.value.length} 个WS链接分组吗？`;
  try {
    await ElMessageBox.confirm(message, "删除WS链接分组", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
    await batchDeleteGroupImportGroups(selectedRows.value.map(row => row.id));
    ElMessage.success("WS链接分组已删除");
    await refreshImports();
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(apiErrorMessage(error, "删除WS链接分组失败"));
    }
  }
}

async function loadDetails() {
  if (!currentDetailGroup.value) return;
  detailLoading.value = true;
  try {
    const response = await listGroupImportDetails({
      labelId: currentDetailGroup.value.id,
      page: detailPage.value,
      pageSize: detailPageSize.value
    });
    detailRows.value = response.list ?? [];
    detailTotal.value = response.total ?? 0;
  } catch (error) {
    detailRows.value = [];
    detailTotal.value = 0;
    ElMessage.error(apiErrorMessage(error, "导入明细加载失败"));
  } finally {
    detailLoading.value = false;
  }
}

function openDetailDrawer(row: unknown) {
  currentDetailGroup.value = row as GroupImportGroup;
  detailPage.value = 1;
  showDetailDrawer.value = true;
  void loadDetails();
}

async function loadMigrationLinks() {
  if (!currentMigrateGroup.value) return;
  migrateLoading.value = true;
  selectedMigrateLinks.value = [];
  try {
    const response = await listGroupLinksForMigration({
      labelId: currentMigrateGroup.value.id,
      page: migratePage.value,
      pageSize: migratePageSize.value,
      keyword: migrateKeyword.value.trim() || undefined
    });
    migrateRows.value = response.list ?? [];
    migrateTotal.value = response.total ?? 0;
  } catch (error) {
    migrateRows.value = [];
    migrateTotal.value = 0;
    ElMessage.error(apiErrorMessage(error, "群链接加载失败"));
  } finally {
    migrateLoading.value = false;
  }
}

function openMigrateDrawer(row: unknown) {
  currentMigrateGroup.value = row as GroupImportGroup;
  migrateTargetLabelId.value = "";
  migrateKeyword.value = "";
  migratePage.value = 1;
  selectedMigrateLinks.value = [];
  showMigrateDrawer.value = true;
  void loadLabelOptions();
  void loadMigrationLinks();
}

function searchMigrationLinks() {
  migratePage.value = 1;
  void loadMigrationLinks();
}

function onMigrateSelectionChange(selection: GroupLinkForMigration[]) {
  selectedMigrateLinks.value = selection;
}

async function submitMigration() {
  if (!currentMigrateGroup.value) return;
  const targetLabelId = Number(migrateTargetLabelId.value);
  if (selectedMigrateLinks.value.length === 0) {
    ElMessage.warning("请先选择需要迁移的群链接");
    return;
  }
  if (!targetLabelId) {
    ElMessage.warning("请选择目标WS链接分组");
    return;
  }
  if (targetLabelId === currentMigrateGroup.value.id) {
    ElMessage.warning("目标分组不能与当前分组相同");
    return;
  }
  const target = labelOptions.value.find(item => item.id === targetLabelId);
  try {
    await ElMessageBox.confirm(
      `确认将 ${selectedMigrateLinks.value.length} 条群链接迁移到「${target?.name || targetLabelId}」吗？`,
      "迁移群链接",
      {
        type: "warning",
        confirmButtonText: "迁移",
        cancelButtonText: "取消"
      }
    );
    migrateSubmitting.value = true;
    await migrateGroupLinks({
      linkIds: selectedMigrateLinks.value.map(row => row.id),
      targetLabelId
    });
    ElMessage.success("群链接已迁移");
    await loadMigrationLinks();
    await refreshImports();
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(apiErrorMessage(error, "迁移群链接失败"));
    }
  } finally {
    migrateSubmitting.value = false;
  }
}

async function exportFailed(row: unknown) {
  const group = row as GroupImportGroup;
  try {
    const blob = await exportGroupImportGroupFailures(group.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `group-link-failed-${group.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success("失败数据已导出");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "导出失败数据失败"));
  }
}

watch([page, pageSize], () => {
  void refreshImports();
});

watch([detailPage, detailPageSize], () => {
  void loadDetails();
});

watch([migratePage, migratePageSize], () => {
  void loadMigrationLinks();
});

onMounted(() => {
  void refreshImports();
  void loadLabelOptions();
});
</script>

<template>
  <div class="group-import-page">
    <div class="group-import-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="group-import-keyword"
            placeholder="搜索：WS链接分组 / 来源文件 / 导入批次 ID"
            @keyup.enter="searchImports"
          />
        </el-form-item>
        <el-form-item label="ID">
          <el-input
            v-model="searchForm.id"
            clearable
            class="group-import-id"
            inputmode="numeric"
            placeholder="ID 精准"
            @keyup.enter="searchImports"
          />
        </el-form-item>
        <el-form-item label="导入时间">
          <el-date-picker
            v-model="searchForm.importedRange"
            type="daterange"
            value-format="x"
            unlink-panels
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="group-import-date"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            clearable
            class="group-import-status"
            placeholder="全部状态"
          >
            <el-option
              v-for="option in importStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchImports"
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

    <PureTableBar title="导入链接" :columns="columns" @refresh="refreshImports">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportDrawer"
        >
          导入群链接
        </el-button>
        <el-button :icon="useRenderIcon(Plus)" @click="openCreateLabelDrawer">
          新增WS链接分组
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="selectedCount === 0"
          :icon="useRenderIcon(Delete)"
          @click="deleteSelectedImports"
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
          <el-table-column type="selection" width="48" />
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="ID"
            width="90"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="linkLabelName"
            label="WS链接分组"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="sourceFile"
            label="最近来源文件"
            min-width="180"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ sourceFileText(row) }}</template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="fileCount"
            label="导入次数"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="totalRows"
            label="总行数"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="successRows"
            label="成功"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="failedRows"
            label="失败"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="importedAt"
            label="最近导入"
            width="180"
          />
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            prop="status"
            label="状态"
            width="110"
          >
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="210">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetailDrawer(row)">
                明细
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="row.failedRows === 0"
                @click="exportFailed(row)"
              >
                导出失败
              </el-button>
              <el-button link type="primary" @click="openMigrateDrawer(row)">
                编辑
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无导入链接" />
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
      v-model="showImportDrawer"
      title="导入群链接"
      size="560px"
      destroy-on-close
    >
      <el-alert
        class="group-import-alert"
        type="info"
        show-icon
        :closable="false"
        title="选择WS链接分组后，粘贴或上传 WS 群链接；系统会自动清洗多余序号、空格和说明文字。"
      />

      <el-form
        class="group-import-form"
        :model="importForm"
        label-position="top"
      >
        <el-form-item label="WS链接分组" required>
          <el-select
            v-model="importForm.linkLabelId"
            clearable
            filterable
            placeholder="请选择WS链接分组"
          >
            <el-option
              v-for="item in labelOptions"
              :key="item.id"
              :label="item.name"
              :value="String(item.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源文件 / 批次名称">
          <el-input
            v-model="importForm.sourceName"
            clearable
            placeholder="例如：5月20日导入批次"
          />
        </el-form-item>
        <el-form-item label="群链接内容">
          <el-input
            v-model="importForm.text"
            type="textarea"
            :rows="6"
            placeholder="支持直接粘贴多行内容，例如：https://chat.whatsapp.com/xxxx"
          />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            v-model:file-list="uploadFiles"
            drag
            accept=".txt,.csv,.xlsx,.xls"
            :auto-upload="false"
            :limit="1"
            :on-change="onUploadChange"
            :on-remove="onUploadRemove"
          >
            <div class="group-import-upload-text">点击上传群链接文件</div>
            <template #tip>
              <div class="el-upload__tip">
                支持 TXT / CSV / Excel；选择文件后将在此显示文件名。
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showImportDrawer = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importSubmitting"
          @click="submitImport"
        >
          开始导入
        </el-button>
      </template>
    </el-drawer>

    <el-drawer
      v-model="showCreateLabelDrawer"
      title="新增WS链接分组"
      size="520px"
      destroy-on-close
    >
      <el-alert
        class="group-import-alert"
        type="info"
        show-icon
        :closable="false"
        title="WS链接分组用于归类导入链接，后续任务可按分组选择链接来源。"
      />

      <el-form
        class="group-import-form"
        :model="createLabelForm"
        label-position="top"
      >
        <el-form-item label="分组名称" required>
          <el-input
            v-model="createLabelForm.name"
            clearable
            maxlength="128"
            show-word-limit
            placeholder="例如：巴铁推手-A / 印度进群-A"
          />
        </el-form-item>
        <el-form-item label="适用国家 / 区域">
          <el-input
            v-model="createLabelForm.country"
            clearable
            placeholder="例如：巴基斯坦 / 印度"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createLabelForm.remark"
            type="textarea"
            :rows="5"
            maxlength="512"
            show-word-limit
            placeholder="填写分组用途、规则或说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateLabelDrawer = false">取消</el-button>
        <el-button
          type="primary"
          :loading="createLabelSubmitting"
          @click="submitCreateLabel"
        >
          确认新增分组
        </el-button>
      </template>
    </el-drawer>

    <el-drawer
      v-model="showDetailDrawer"
      :title="currentDetailGroup?.linkLabelName || '导入明细'"
      size="760px"
      destroy-on-close
    >
      <el-table v-loading="detailLoading" :data="detailRows" row-key="lineNo" border>
        <el-table-column prop="lineNo" label="行号" width="80" />
        <el-table-column
          prop="groupName"
          label="群名称"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.groupName || "-" }}</template>
        </el-table-column>
        <el-table-column
          prop="rawUrl"
          label="群链接"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          prop="sourceFileName"
          label="来源文件"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.sourceFileName || "-" }}</template>
        </el-table-column>
        <el-table-column prop="resultLabel" label="状态" width="100" />
        <el-table-column
          prop="failReason"
          label="失败原因"
          min-width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.failReason || "-" }}</template>
        </el-table-column>
        <el-table-column label="导入时间" width="180">
          <template #default="{ row }">
            {{ formatEpochMillis(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <WheelPagination
        v-model:current-page="detailPage"
        v-model:page-size="detailPageSize"
        :total="detailTotal"
      />
    </el-drawer>

    <el-drawer
      v-model="showMigrateDrawer"
      :title="currentMigrateGroup?.linkLabelName || '编辑WS链接分组'"
      size="860px"
      destroy-on-close
    >
      <div class="group-import-migrate-toolbar">
        <el-input
          v-model="migrateKeyword"
          clearable
          class="group-import-migrate-keyword"
          placeholder="搜索：群名称 / 群链接 / 来源文件"
          @keyup.enter="searchMigrationLinks"
        />
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="searchMigrationLinks"
        >
          搜索
        </el-button>
        <el-select
          v-model="migrateTargetLabelId"
          class="group-import-target-select"
          clearable
          filterable
          placeholder="目标WS链接分组"
        >
          <el-option
            v-for="item in labelOptions"
            :key="item.id"
            :disabled="item.id === currentMigrateGroup?.id"
            :label="item.name"
            :value="String(item.id)"
          />
        </el-select>
        <el-button :icon="useRenderIcon(Plus)" @click="openCreateLabelDrawer">
          新建分组
        </el-button>
      </div>

      <el-table
        v-loading="migrateLoading"
        :data="migrateRows"
        row-key="id"
        border
        @selection-change="onMigrateSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column
          label="群名称"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ linkName(row) }}</template>
        </el-table-column>
        <el-table-column
          prop="url"
          label="群链接"
          min-width="230"
          show-overflow-tooltip
        />
        <el-table-column
          prop="sourceFileName"
          label="来源文件"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.sourceFileName || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            {{ row.statusLabel || row.status || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatEpochMillis(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <WheelPagination
        v-model:current-page="migratePage"
        v-model:page-size="migratePageSize"
        :total="migrateTotal"
      />

      <template #footer>
        <el-button @click="showMigrateDrawer = false">取消</el-button>
        <el-button
          type="primary"
          :loading="migrateSubmitting"
          @click="submitMigration"
        >
          确认迁移
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.group-import-page {
  padding: 16px;
}

.group-import-search {
  margin-bottom: 8px;
  padding: 16px 16px 0;
  border-radius: 4px;
}

.group-import-search :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

.group-import-keyword {
  width: 320px;
}

.group-import-id {
  width: 120px;
}

.group-import-date {
  width: 260px;
}

.group-import-status {
  width: 140px;
}

.group-import-alert {
  margin-bottom: 16px;
}

.group-import-form :deep(.el-select),
.group-import-form :deep(.el-upload),
.group-import-form :deep(.el-upload-dragger) {
  width: 100%;
}

.group-import-upload-text {
  color: var(--el-text-color-regular);
}

.group-import-migrate-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.group-import-migrate-keyword {
  width: 260px;
}

.group-import-target-select {
  width: 220px;
}
</style>
