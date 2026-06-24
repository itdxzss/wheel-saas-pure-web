<script setup lang="ts">
import { ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "ResourceIp"
});

interface IpManageRow {
  id: number;
  country: string;
  proxyType: string;
  proxyAddress: string;
  username: string;
  password: string;
  validAccountCount: number;
  source: string;
  createdAt: string;
}

interface IpSearchForm {
  country: string;
  proxyType: string;
  source: string;
}

interface IpImportForm {
  country: string;
  proxyType: string;
  source: string;
}

const countryOptions = [
  "混合（不限国家）",
  "巴基斯坦",
  "印度",
  "马来西亚",
  "印度尼西亚"
];
const proxyTypeOptions = ["HTTP", "SOCKS5"];
const searchForm = ref<IpSearchForm>({
  country: "",
  proxyType: "",
  source: ""
});
const loading = ref(false);
const guideCollapsed = ref(false);
const rows = ref<IpManageRow[]>([]);
const selectedRows = ref<IpManageRow[]>([]);
const showImportDrawer = ref(false);
const importForm = ref<IpImportForm>({
  country: "",
  proxyType: "HTTP",
  source: ""
});
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const columns: TableColumnList = [
  { label: "国家", prop: "country", width: 130 },
  { label: "类型", prop: "proxyType", width: 110 },
  { label: "代理地址", prop: "proxyAddress", minWidth: 220 },
  { label: "用户名", prop: "username", minWidth: 140 },
  { label: "密码", prop: "password", minWidth: 140 },
  { label: "有效账号", prop: "validAccountCount", width: 110 },
  { label: "来源", prop: "source", minWidth: 140 },
  { label: "创建时间", prop: "createdAt", width: 180 }
];

function refreshIpList() {
  loading.value = false;
}

function openImportDrawer() {
  showImportDrawer.value = true;
}

function deleteSelectedIps() {
  if (selectedRows.value.length === 0) return;
}

function onSelectionChange(selection: IpManageRow[]) {
  selectedRows.value = selection;
}

function searchIpList() {
  page.value = 1;
  refreshIpList();
}

function resetSearchForm() {
  searchForm.value.country = "";
  searchForm.value.proxyType = "";
  searchForm.value.source = "";
  searchIpList();
}
</script>

<template>
  <div class="ip-manage-page">
    <el-card class="ip-guide-card ip-manage-section" shadow="never">
      <div class="ip-guide-head">
        <div>
          <div class="ip-guide-title">温馨提示：</div>
          <div v-show="!guideCollapsed" class="ip-guide-sub">
            请根据进号的国家上传对应国家代理
            IP；建议同时保留一批混合（AnyWay）作为兜底，避免账号因缺少国家 IP
            无法使用。
          </div>
        </div>
        <el-button
          link
          type="primary"
          @click="guideCollapsed = !guideCollapsed"
        >
          {{ guideCollapsed ? "展开" : "收起" }}
        </el-button>
      </div>

      <div v-show="!guideCollapsed" class="ip-guide-body">
        <div class="ip-provider-grid">
          <div class="ip-provider-card ipidea-card">
            <div class="ip-provider-brand">
              <span class="ip-provider-logo">I</span>
              <span>ipidea</span>
            </div>
            <div class="ip-provider-desc">
              <span>提示：</span><strong>官网需在国内网络环境下访问。</strong>
            </div>
            <div class="ip-provider-line">
              <span>官网：</span><strong>https://grassdata.net</strong>
            </div>
          </div>

          <div class="ip-provider-card">
            <div class="ip-provider-brand">
              <span class="ip-provider-logo">T</span>
              <span>Thordata</span>
            </div>
            <div class="ip-provider-line">
              <span>官网：</span><strong>www.thordata.com</strong>
            </div>
          </div>
        </div>

        <el-alert
          class="ip-recommend-alert"
          type="success"
          :closable="false"
          show-icon
        >
          <template #title>
            <span class="ip-recommend-product">WhatsApp</span>
            <el-tag class="ml-2" size="small" type="success">推荐</el-tag>
            <span class="ml-2">
              优先推荐您使用目标国家的 HTTP 住宅动态 IP，粘性 10 分钟或 15
              分钟均可。
            </span>
          </template>
        </el-alert>
      </div>
    </el-card>

    <div class="ip-manage-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="国家">
          <el-select
            v-model="searchForm.country"
            clearable
            filterable
            placeholder="请选择国家"
            class="ip-filter-control"
          >
            <el-option
              v-for="country in countryOptions"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.proxyType"
            clearable
            placeholder="全部类型"
            class="ip-filter-control ip-filter-control--sm"
          >
            <el-option
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-input
            v-model="searchForm.source"
            clearable
            placeholder="请输入来源"
            class="ip-filter-control"
            @keyup.enter="searchIpList"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchIpList"
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

    <PureTableBar title="IP 管理" :columns="columns" @refresh="refreshIpList">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportDrawer"
        >
          TXT 批量导入
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="selectedRows.length === 0"
          :icon="useRenderIcon(Delete)"
          @click="deleteSelectedIps"
        >
          批量删除
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
            prop="country"
            label="国家"
            width="130"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="proxyType"
            label="类型"
            width="110"
          >
            <template #default="{ row }">
              <el-tag size="small" type="info">
                {{ row.proxyType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="proxyAddress"
            label="代理地址"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="username"
            label="用户名"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="password"
            label="密码"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="validAccountCount"
            label="有效账号"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="source"
            label="来源"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="createdAt"
            label="创建时间"
            width="180"
          />
          <template #empty>
            <el-empty description="暂无 IP 数据" />
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
      title="TXT 批量导入"
      size="520px"
      destroy-on-close
    >
      <el-alert
        class="ip-import-alert"
        type="info"
        show-icon
        :closable="false"
        title="每行一条代理记录，格式为：代理地址:端口:用户名:密码。"
      />

      <el-form class="ip-import-form" :model="importForm" label-position="top">
        <el-form-item label="国家" required>
          <el-select
            v-model="importForm.country"
            clearable
            filterable
            placeholder="请选择国家"
          >
            <el-option
              v-for="country in countryOptions"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="代理类型" required>
          <el-radio-group v-model="importForm.proxyType">
            <el-radio-button
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="来源" required>
          <el-input
            v-model="importForm.source"
            clearable
            placeholder="请输入来源，如：xx 运营商 / 代理商名称"
          />
        </el-form-item>
        <el-form-item label="TXT 文件" required>
          <el-upload drag accept=".txt,text/plain" :auto-upload="false">
            <div class="ip-upload-text">点击或拖拽 TXT 文件到此处</div>
            <template #tip>
              <div class="el-upload__tip">仅支持 .txt 格式，编码建议 UTF-8</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showImportDrawer = false">取消</el-button>
        <el-button type="primary" disabled>开始导入</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.ip-manage-page {
  padding: 16px;
}

.ip-manage-section {
  margin-bottom: 8px;
}

.ip-guide-card {
  background: #f5fbff;
  border-color: #d8ecff;
}

.ip-guide-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.ip-guide-title {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ip-guide-sub {
  margin-top: 6px;
  color: var(--el-text-color-regular);
}

.ip-guide-body {
  margin-top: 14px;
}

.ip-provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.ip-provider-card {
  min-height: 96px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dceaf6;
  border-radius: 8px;
}

.ipidea-card {
  background: #f4f7fb;
}

.ip-provider-brand {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 700;
}

.ip-provider-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.ip-provider-desc,
.ip-provider-line {
  color: var(--el-text-color-regular);
}

.ip-recommend-alert {
  margin-top: 12px;
}

.ip-recommend-product {
  font-weight: 700;
}

.ip-import-alert {
  margin-bottom: 16px;
}

.ip-import-form :deep(.el-select),
.ip-import-form :deep(.el-upload),
.ip-import-form :deep(.el-upload-dragger) {
  width: 100%;
}

.ip-upload-text {
  color: var(--el-text-color-regular);
}

.ip-manage-search {
  padding: 16px 16px 0;
  margin-bottom: 8px;
  border-radius: 4px;
}

.ip-manage-search :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

.ip-filter-control {
  width: 180px;
}

.ip-filter-control--sm {
  width: 140px;
}
</style>
