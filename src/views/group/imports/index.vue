<script setup lang="ts">
import { ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "TaskGroupLinkImports"
});

interface GroupImportRow {
  id: number;
  linkLabelName: string;
  sourceFile: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  importedAt: string;
  status: string;
}

interface GroupImportSearchForm {
  keyword: string;
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
  keyword: ""
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
const showImportDrawer = ref(false);
const showCreateLabelDrawer = ref(false);
const rows = ref<GroupImportRow[]>([]);
const selectedRows = ref<GroupImportRow[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 90 },
  { label: "WS链接分组", prop: "linkLabelName", minWidth: 180 },
  { label: "来源文件", prop: "sourceFile", minWidth: 180 },
  { label: "总链接数", prop: "totalRows", width: 110 },
  { label: "成功", prop: "successRows", width: 100 },
  { label: "失败", prop: "failedRows", width: 100 },
  { label: "导入时间", prop: "importedAt", width: 180 },
  { label: "状态", prop: "status", width: 110 }
];

function refreshImports() {
  selectedRows.value = [];
  loading.value = false;
}

function searchImports() {
  page.value = 1;
  refreshImports();
}

function resetSearchForm() {
  searchForm.value.keyword = "";
  searchImports();
}

function onSelectionChange(selection: GroupImportRow[]) {
  selectedRows.value = selection;
}

function openImportDrawer() {
  importForm.value = {
    linkLabelId: "",
    sourceName: "",
    text: ""
  };
  showImportDrawer.value = true;
}

function openCreateLabelDrawer() {
  createLabelForm.value = {
    name: "",
    country: "",
    remark: ""
  };
  showCreateLabelDrawer.value = true;
}

function deleteSelectedImports() {
  if (selectedRows.value.length === 0) return;
}
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
          :disabled="selectedRows.length === 0"
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
            label="来源文件"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="totalRows"
            label="总链接数"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="successRows"
            label="成功"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="failedRows"
            label="失败"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="importedAt"
            label="导入时间"
            width="180"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="status"
            label="状态"
            width="110"
          />
          <el-table-column label="操作" fixed="right" width="190">
            <template #default>
              <el-button link type="primary" disabled>明细</el-button>
              <el-button link type="primary" disabled>导出失败</el-button>
              <el-button link type="primary" disabled>编辑</el-button>
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
          />
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
          <el-upload drag accept=".txt,.csv,.xlsx,.xls" :auto-upload="false">
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
        <el-button type="primary" disabled>开始导入</el-button>
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
        <el-button type="primary" disabled>确认新增分组</el-button>
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
</style>
