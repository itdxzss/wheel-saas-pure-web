<script setup lang="ts">
import { ref, watch } from "vue";
import {
  listGroupDataPackagePhones,
  listGroupDataPackageImports,
  type GroupDataPackage,
  type GroupDataPackagePhone,
  type GroupDataPackagePhoneStatus,
  type GroupDataPackageImportRecord
} from "@/api/group-data-package";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { apiErrorMessage } from "@/utils/api-error";
import { formatEpochMillis } from "@/utils/time";
import { phoneStatusLabels } from "../domain/package-display";

defineOptions({ name: "GroupPackageDetailDrawer" });
const props = defineProps<{
  target: GroupDataPackage | null;
  initialTab: "phones" | "imports";
}>();
const visible = defineModel<boolean>({ required: true });
const tab = ref("phones");
const phone = ref("");
const status = ref<GroupDataPackagePhoneStatus>();
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const phones = ref<GroupDataPackagePhone[]>([]);
const imports = ref<GroupDataPackageImportRecord[]>([]);
const loading = ref(false);
const errorMessage = ref("");
let requestVersion = 0;

async function load(): Promise<void> {
  if (!props.target) return;
  const version = ++requestVersion;
  loading.value = true;
  errorMessage.value = "";
  try {
    if (tab.value === "phones") {
      const result = await listGroupDataPackagePhones(props.target.id, {
        page: page.value,
        pageSize: pageSize.value,
        phone: phone.value,
        status: status.value
      });
      if (version !== requestVersion) return;
      phones.value = result.list;
      total.value = result.total;
    } else {
      const result = await listGroupDataPackageImports(props.target.id, {
        page: page.value,
        pageSize: pageSize.value
      });
      if (version !== requestVersion) return;
      imports.value = result.list;
      total.value = result.total;
    }
  } catch (error) {
    if (version === requestVersion) {
      errorMessage.value = apiErrorMessage(error, "详情加载失败");
      phones.value = [];
      imports.value = [];
      total.value = 0;
    }
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

function search(): void {
  page.value = 1;
  void load();
}
function reset(): void {
  phone.value = "";
  status.value = undefined;
  search();
}
watch(visible, value => {
  requestVersion++;
  if (!value) return;
  tab.value = props.initialTab;
  phone.value = "";
  status.value = undefined;
  page.value = 1;
  phones.value = [];
  imports.value = [];
  void load();
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${target?.name ?? ''} · 数据包详情`"
    size="min(1100px, 95vw)"
    destroy-on-close
  >
    <el-tabs v-model="tab" @tab-change="search"
      ><el-tab-pane label="查看号码" name="phones" /><el-tab-pane
        label="导入记录"
        name="imports"
    /></el-tabs>
    <el-form v-if="tab === 'phones'" inline @submit.prevent="search">
      <el-form-item label="手机号"
        ><el-input
          v-model="phone"
          clearable
          placeholder="手机号搜索"
          @keyup.enter="search"
      /></el-form-item>
      <el-form-item label="状态"
        ><el-select
          v-model="status"
          clearable
          placeholder="全部状态"
          style="width: 160px"
          ><el-option
            v-for="(label, key) in phoneStatusLabels"
            :key="key"
            :value="key"
            :label="label" /></el-select
      ></el-form-item>
      <el-form-item
        ><el-button type="primary" :loading="loading" native-type="submit"
          >搜索</el-button
        ><el-button @click="reset">重置</el-button></el-form-item
      >
    </el-form>
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="false"
      ><el-button link type="primary" @click="load">重试</el-button></el-alert
    >
    <el-table
      v-if="tab === 'phones'"
      v-loading="loading"
      :data="phones"
      row-key="id"
      border
      height="510"
    >
      <el-table-column prop="memberSeq" label="#" width="70" />
      <el-table-column prop="phone" label="手机号" min-width="155" />
      <el-table-column label="管理员" width="88"
        ><template #default="{ row }"
          ><el-tag v-if="row.adminRequired" size="small">A</el-tag
          ><span v-else>—</span></template
        ></el-table-column
      >
      <el-table-column label="状态" width="125"
        ><template #default="{ row }">{{
          phoneStatusLabels[row.status] ?? row.status
        }}</template></el-table-column
      >
      <el-table-column prop="countryIso2" label="国家" width="80" />
      <el-table-column prop="sourceLineNo" label="原始行" width="90" />
      <el-table-column label="入库时间" width="175"
        ><template #default="{ row }">{{
          formatEpochMillis(row.createdAt)
        }}</template></el-table-column
      >
      <template #empty><el-empty description="暂无符合条件的号码" /></template>
    </el-table>
    <el-table
      v-else
      v-loading="loading"
      :data="imports"
      row-key="id"
      border
      height="510"
    >
      <el-table-column prop="id" label="批次" width="80" />
      <el-table-column
        prop="fileName"
        label="文件"
        min-width="165"
        show-overflow-tooltip
      />
      <el-table-column label="模式" width="90"
        ><template #default="{ row }">{{
          row.mode === "overwrite" ? "覆盖导入" : "增量导入"
        }}</template></el-table-column
      >
      <el-table-column label="状态" width="90"
        ><template #default="{ row }"
          ><el-tag
            :type="
              row.status === 2
                ? 'success'
                : row.status === 3
                  ? 'danger'
                  : 'warning'
            "
            size="small"
            >{{
              { 1: "处理中", 2: "成功", 3: "失败" }[row.status] ?? row.status
            }}</el-tag
          ></template
        ></el-table-column
      >
      <el-table-column
        prop="totalRows"
        label="原始"
        width="80"
      /><el-table-column prop="acceptedRows" label="新增" width="80" />
      <el-table-column
        prop="duplicatedRows"
        label="重复"
        width="80"
      /><el-table-column prop="invalidRows" label="错误" width="80" />
      <el-table-column prop="privacyFilteredRows" label="隐私过滤" width="90" />
      <el-table-column
        prop="failureReason"
        label="失败原因"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column label="导入时间" width="175"
        ><template #default="{ row }">{{
          formatEpochMillis(row.createdAt)
        }}</template></el-table-column
      >
      <template #empty><el-empty description="暂无导入记录" /></template>
    </el-table>
    <WheelPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :page-sizes="[20, 50, 100]"
      :total="total"
      @change="load"
    />
  </el-drawer>
</template>
