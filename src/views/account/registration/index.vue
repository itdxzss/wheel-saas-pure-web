<script setup lang="ts">
import {
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  watch
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ElMessage } from "element-plus";
import {
  createAccountGroup,
  listAccountGroups,
  type AccountGroupApiRow,
  type AccountGroupWriteRequest
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import AccountRegistrationForm from "./components/AccountRegistrationForm.vue";
import AccountRegistrationTasks from "./components/AccountRegistrationTasks.vue";
import DeviceRegistrationPanel from "./components/DeviceRegistrationPanel.vue";
import CloudRegistrationPanel from "./components/CloudRegistrationPanel.vue";
import { useAccountRegistration } from "./composables/useAccountRegistration";

defineOptions({ name: "AccountRegistration" });

const active = ref(false);
const groups = ref<AccountGroupApiRow[]>([]);
const groupLoading = ref(false);
const groupError = ref("");
let groupGeneration = 0;

async function loadGroups(): Promise<void> {
  const token = ++groupGeneration;
  groupLoading.value = true;
  groupError.value = "";
  try {
    const response = await listAccountGroups({ page: 1, pageSize: 500 });
    if (active.value && token === groupGeneration)
      groups.value = response.list ?? [];
  } catch (error) {
    if (active.value && token === groupGeneration)
      groupError.value = apiErrorMessage(error, "账号分组加载失败");
  } finally {
    if (token === groupGeneration) groupLoading.value = false;
  }
}

async function createGroup(
  data: AccountGroupWriteRequest
): Promise<AccountGroupApiRow> {
  const group = await createAccountGroup(data);
  if (!groups.value.some(item => item.id === group.id))
    groups.value = [...groups.value, group];
  return group;
}

onMounted(() => {
  active.value = true;
});
onActivated(() => {
  active.value = true;
});
onDeactivated(() => {
  active.value = false;
});
onUnmounted(() => {
  active.value = false;
});
watch(active, visible => {
  if (visible) void loadGroups();
  else {
    groupGeneration++;
    groupLoading.value = false;
  }
});
const {
  form,
  catalog,
  tiers,
  tasks,
  detail,
  page,
  pageSize,
  total,
  activeTab,
  catalogLoading,
  pricesLoading,
  tasksLoading,
  detailLoading,
  cancelling,
  catalogError,
  priceError,
  tasksError,
  detailError,
  submitError,
  submitState,
  frozen,
  submitting,
  submittedRequest,
  loadCatalog,
  loadPrices,
  changeCountry,
  refreshTasks,
  loadDetail,
  submit,
  resetDraft,
  cancel
} = useAccountRegistration(active);

onBeforeRouteLeave(() => {
  if (submitting.value || submitState.value === "unknown") {
    ElMessage.warning("提交结果尚未确认，请先在本页核对原请求后再离开");
    return false;
  }
});
</script>

<template>
  <div class="account-registration-page bg-bg_color">
    <h2 class="page-title">新号注册</h2>
    <el-alert
      v-if="catalogError"
      :title="catalogError"
      type="error"
      :closable="false"
      show-icon
      class="mb-4"
    />
    <el-alert
      v-if="
        !['device', 'cloud'].includes(activeTab) &&
        catalog &&
        !catalog.orderingEnabled
      "
      :title="catalog.disabledReason || '当前未启用采购，可查看已有任务'"
      type="warning"
      :closable="false"
      class="mb-4"
    />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="云手机自动注册" name="cloud">
        <CloudRegistrationPanel :active="active && activeTab === 'cloud'" />
      </el-tab-pane>
      <el-tab-pane label="手机注册 / 取号验证" name="device">
        <DeviceRegistrationPanel :active="active && activeTab === 'device'" />
      </el-tab-pane>
      <el-tab-pane label="新建注册" name="create">
        <div class="catalog-toolbar">
          <el-button :loading="groupLoading" @click="loadGroups"
            >刷新账号分组</el-button
          >
          <el-button :loading="catalogLoading" @click="loadCatalog"
            >刷新服务目录</el-button
          >
        </div>
        <el-alert
          v-if="groupError"
          :title="groupError"
          type="error"
          :closable="false"
          class="mb-4"
        />
        <el-alert
          v-if="priceError"
          :title="priceError"
          type="error"
          :closable="false"
          class="mb-4"
        />
        <el-alert
          v-if="submitError"
          :title="submitError"
          type="error"
          :closable="false"
          class="mb-4"
        />
        <AccountRegistrationForm
          :form="form"
          :active="active"
          :catalog="catalog"
          :tiers="tiers"
          :groups="groups"
          :group-loading="groupLoading"
          :prices-loading="pricesLoading"
          :frozen="frozen"
          :submitting="submitting"
          :submit-state="submitState"
          :create-group="createGroup"
          @update:form="Object.assign(form, $event)"
          @submit="submit"
          @country-change="changeCountry"
          @refresh-prices="loadPrices"
          @reset="resetDraft"
        />
        <p v-if="submittedRequest" class="request-reference">
          提交编号：{{ submittedRequest.requestId }}
        </p>
      </el-tab-pane>
      <el-tab-pane label="注册任务" name="tasks">
        <el-alert
          v-if="tasksError"
          :title="tasksError"
          type="error"
          :closable="false"
          class="mb-4"
        />
        <el-alert
          v-if="detailError"
          :title="detailError"
          type="error"
          :closable="false"
          class="mb-4"
        />
        <AccountRegistrationTasks
          v-model:page="page"
          v-model:page-size="pageSize"
          :rows="tasks"
          :detail="detail"
          :groups="groups"
          :countries="catalog?.countries ?? []"
          :loading="tasksLoading"
          :detail-loading="detailLoading"
          :cancelling="cancelling"
          :total="total"
          @refresh="refreshTasks"
          @detail="loadDetail"
          @cancel="cancel"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.account-registration-page {
  padding: 20px;
  margin: 16px;
}

.page-title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.catalog-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.request-reference {
  margin-top: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}
</style>
