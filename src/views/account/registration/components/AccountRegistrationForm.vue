<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type {
  AccountGroupApiRow,
  AccountGroupWriteRequest
} from "@/api/account-group";
import type {
  AccountRegistrationCatalog,
  AccountRegistrationPriceTier
} from "@/api/account-registration";
import { apiErrorMessage } from "@/utils/api-error";
import { accountImportIpAllocationModeOptions } from "../../import/constants";
import type { RegistrationDraft } from "../composables/useAccountRegistration";

const props = defineProps<{
  active: boolean;
  catalog: AccountRegistrationCatalog | null;
  tiers: AccountRegistrationPriceTier[];
  groups: AccountGroupApiRow[];
  groupLoading: boolean;
  pricesLoading: boolean;
  frozen: boolean;
  submitting: boolean;
  submitState: string;
  createGroup: (
    data: AccountGroupWriteRequest
  ) => Promise<AccountGroupApiRow | null>;
}>();
const form = defineModel<RegistrationDraft>("form", { required: true });
const emit = defineEmits<{
  (event: "submit"): void;
  (event: "country-change"): void;
  (event: "refresh-prices"): void;
  (event: "reset"): void;
}>();
const formRef = ref<FormInstance>();
const creatingGroup = ref(false);
const groupName = ref("");
const rules: FormRules = {
  countryId: [{ required: true, message: "请选择美国渠道", trigger: "change" }],
  unitPrice: [{ required: true, message: "请选择价格档位", trigger: "change" }],
  accountGroupId: [
    { required: true, message: "请选择账号分组", trigger: "change" }
  ],
  accountType: [
    { required: true, message: "请选择账号类型", trigger: "change" }
  ],
  quantity: [
    {
      type: "integer",
      min: 1,
      max: 100,
      required: true,
      message: "请输入 1 至 100 的整数",
      trigger: "change"
    }
  ]
};
let groupGeneration = 0;

async function submit(): Promise<void> {
  if (props.submitState === "unknown") {
    emit("submit");
    return;
  }
  if (!(await formRef.value?.validate().catch(() => false))) return;
  emit("submit");
}

async function handleCreateGroup(): Promise<void> {
  if (creatingGroup.value || props.frozen || !groupName.value.trim()) return;
  const token = groupGeneration;
  creatingGroup.value = true;
  try {
    const created = await props.createGroup({
      name: groupName.value.trim(),
      remark: null
    });
    if (token !== groupGeneration || !props.active || props.frozen) return;
    if (created) {
      form.value.accountGroupId = created.id;
      groupName.value = "";
    }
  } catch (error) {
    if (token === groupGeneration && props.active)
      ElMessage.error(apiErrorMessage(error, "新增分组失败"));
  } finally {
    if (token === groupGeneration) creatingGroup.value = false;
  }
}

watch(
  () => props.active,
  active => {
    if (!active) {
      groupGeneration++;
      creatingGroup.value = false;
    }
  }
);
</script>

<template>
  <el-alert
    title="按采购号码数量执行，失败不自动补购。价格是短信号码单价，不代表成品账号或账号质量。"
    type="info"
    :closable="false"
    show-icon
    class="mb-4"
  />
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="110px"
    :disabled="frozen"
  >
    <el-form-item label="注册服务">
      <span>{{ catalog?.serviceName || "加载中" }}</span>
    </el-form-item>
    <el-form-item label="美国渠道" prop="countryId">
      <el-select
        v-model="form.countryId"
        placeholder="选择美国渠道"
        filterable
        class="registration-control"
        @change="emit('country-change')"
      >
        <el-option
          v-for="country in catalog?.countries ?? []"
          :key="country.id"
          :label="country.name"
          :value="country.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="短信单价" prop="unitPrice">
      <el-select
        v-model="form.unitPrice"
        :loading="pricesLoading"
        placeholder="选择当前价格档位"
        class="registration-control"
      >
        <el-option
          v-for="tier in tiers"
          :key="String(tier.cost)"
          :value="String(tier.cost)"
          :disabled="tier.count <= 0"
          :label="`${tier.cost} · 库存 ${tier.count}`"
        />
      </el-select>
      <el-button
        class="ml-2"
        :loading="pricesLoading"
        :disabled="!form.countryId"
        @click="emit('refresh-prices')"
        >刷新价格</el-button
      >
      <div class="field-help">
        供应商未返回报价币种。库存为查询快照，采购时可能变化。
      </div>
    </el-form-item>
    <el-form-item label="采购数量" prop="quantity">
      <el-input-number
        v-model="form.quantity"
        :min="1"
        :max="100"
        :precision="0"
        controls-position="right"
      />
      <span class="ml-2">个号码</span>
    </el-form-item>
    <el-form-item label="目标分组" prop="accountGroupId">
      <el-select
        v-model="form.accountGroupId"
        :loading="groupLoading"
        filterable
        placeholder="选择现有账号分组"
        class="registration-control"
      >
        <el-option
          v-for="group in groups"
          :key="group.id"
          :label="group.name"
          :value="group.id"
        />
      </el-select>
      <div class="group-create">
        <el-input
          v-model="groupName"
          maxlength="100"
          placeholder="新增分组名称"
          @keyup.enter="handleCreateGroup"
        />
        <el-button
          :loading="creatingGroup"
          :disabled="!groupName.trim()"
          @click="handleCreateGroup"
          >新增分组</el-button
        >
      </div>
    </el-form-item>
    <el-form-item label="账号类型" prop="accountType">
      <el-radio-group v-model="form.accountType">
        <el-radio :value="1">个人</el-radio>
        <el-radio :value="2">商业</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="选择 IP">
      <el-select v-model="form.ipAllocationMode" class="registration-control">
        <el-option
          v-for="mode in accountImportIpAllocationModeOptions"
          :key="mode.value"
          :label="mode.label"
          :value="mode.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
  <el-alert
    v-if="submitState === 'unknown'"
    class="mb-4"
    type="warning"
    :closable="false"
    show-icon
    title="提交结果待核对。原参数已锁定，重试会使用同一提交编号；请勿另建采购。"
  />
  <el-alert
    v-if="submitState === 'confirmed'"
    class="mb-4"
    type="success"
    :closable="false"
    title="任务已创建，可在注册任务中查看结果。需要另下一单时，请先新建草稿。"
  />
  <el-alert
    v-if="submitState === 'rejected'"
    class="mb-4"
    type="warning"
    :closable="false"
    title="服务端已明确拒绝创建，请新建草稿后修改参数。"
  />
  <div class="registration-actions">
    <el-button
      v-if="submitState !== 'confirmed' && submitState !== 'rejected'"
      v-perms="['tenant:account:edit']"
      type="primary"
      :loading="submitting"
      :disabled="submitState !== 'unknown' && !catalog?.orderingEnabled"
      @click="submit"
    >
      {{ submitState === "unknown" ? "使用原请求重试" : "提交采购与注册" }}
    </el-button>
    <el-button
      :disabled="submitting || submitState === 'unknown'"
      @click="emit('reset')"
      >新建采购草稿</el-button
    >
  </div>
</template>

<style scoped>
.registration-control {
  width: 310px;
  max-width: 100%;
}

.field-help {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-create {
  display: flex;
  gap: 8px;
  width: 420px;
  max-width: 100%;
  margin-top: 8px;
}

.registration-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
