<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  createBuyerChannel,
  getBuyerChannel,
  precheckBuyerChannelDomain,
  updateBuyerChannel,
  type BuyerChannelOptions
} from "@/api/buyer-channel";
import {
  createDefaultChannelForm,
  hydrateChannelForm,
  saveChannelForm,
  type ChannelFormModel
} from "../domain/channel-form";

const props = defineProps<{
  modelValue: boolean;
  channelId?: number;
  options: BuyerChannelOptions;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved"): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const form = reactive<ChannelFormModel>(createDefaultChannelForm());
const editing = computed(() => props.channelId !== undefined);
const supportsToken = computed(
  () => form.platform === "FACEBOOK" || form.platform === "TIKTOK"
);

const rules: FormRules<ChannelFormModel> = {
  name: [{ required: true, message: "请输入渠道名称", trigger: "blur" }],
  ownerId: [{ required: true, message: "请选择所属人", trigger: "change" }],
  targetCountry: [
    { required: true, message: "请选择目标国家", trigger: "change" }
  ],
  templateId: [
    { required: true, message: "请选择绑定模板", trigger: "change" }
  ],
  domain: [{ required: true, message: "请输入域名", trigger: "blur" }],
  defaultDialCode: [
    { required: true, message: "请选择默认区号", trigger: "change" }
  ],
  platform: [{ required: true, message: "请选择推广平台", trigger: "change" }]
};

function replaceForm(next: ChannelFormModel): void {
  Object.keys(form).forEach(
    key => delete (form as Record<string, unknown>)[key]
  );
  Object.assign(form, next);
  formRef.value?.clearValidate();
}

async function load(): Promise<void> {
  if (!props.modelValue) return;
  replaceForm(createDefaultChannelForm());
  if (!props.channelId) return;
  loading.value = true;
  try {
    replaceForm(hydrateChannelForm(await getBuyerChannel(props.channelId)));
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : "渠道详情加载失败"
    );
    emit("update:modelValue", false);
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    await saveChannelForm(form, editing.value, {
      precheck: precheckBuyerChannelDomain,
      create: createBuyerChannel,
      update: updateBuyerChannel
    });
    ElMessage.success(editing.value ? "渠道已更新" : "渠道已新增");
    emit("update:modelValue", false);
    emit("saved");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "渠道保存失败");
  } finally {
    saving.value = false;
  }
}

watch(
  () => [props.modelValue, props.channelId] as const,
  () => void load(),
  { immediate: true }
);
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="editing ? '编辑渠道' : '新增渠道'"
    size="680px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="form"
      :rules="rules"
      label-width="128px"
    >
      <el-form-item label="渠道名称" prop="name">
        <el-input
          v-model="form.name"
          maxlength="50"
          placeholder="请输入渠道名称"
        />
      </el-form-item>
      <el-form-item label="所属人" prop="ownerId">
        <el-select v-model="form.ownerId" filterable placeholder="请选择所属人">
          <el-option
            v-for="owner in options.owners"
            :key="owner.id"
            :label="owner.name"
            :value="owner.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="目标国家" prop="targetCountry">
        <el-select
          v-model="form.targetCountry"
          filterable
          placeholder="请选择目标国家"
        >
          <el-option
            v-for="country in options.countries"
            :key="country.code"
            :label="country.name"
            :value="country.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="绑定模板" prop="templateId">
        <el-select v-model="form.templateId" placeholder="请选择绑定模板">
          <el-option
            v-for="template in options.templates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="主题色">
        <el-color-picker v-model="form.themeColor" />
      </el-form-item>
      <el-form-item label="绑定域名" prop="domain">
        <el-input v-model="form.domain" placeholder="landing.example.com">
          <template #prepend>https://</template>
        </el-input>
      </el-form-item>
      <el-form-item label="默认区号" prop="defaultDialCode">
        <el-select
          v-model="form.defaultDialCode"
          filterable
          placeholder="请选择默认区号"
        >
          <el-option
            v-for="country in options.countries"
            :key="`${country.code}-${country.dialCode}`"
            :label="`${country.name} ${country.dialCode}`"
            :value="country.dialCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="推广平台" prop="platform">
        <el-radio-group v-model="form.platform">
          <el-radio-button value="FACEBOOK">Facebook</el-radio-button>
          <el-radio-button value="TIKTOK">TikTok</el-radio-button>
          <el-radio-button value="KUAISHOU">快手</el-radio-button>
          <el-radio-button value="MGSKY">MGSKY Ads</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Pixel ID">
        <el-input v-model="form.pixelId" placeholder="请输入 Pixel ID" />
      </el-form-item>
      <el-form-item v-if="supportsToken" label="Access Token">
        <el-input
          v-model="form.accessToken"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="
            editing && form.accessTokenConfigured
              ? '已配置，留空表示不修改'
              : '请输入 Access Token'
          "
        />
      </el-form-item>
      <el-divider content-position="left">事件映射</el-divider>
      <el-form-item label="Lead"
        ><el-input v-model="form.eventLead"
      /></el-form-item>
      <el-form-item label="InitiateCheckout"
        ><el-input v-model="form.eventInitiateCheckout"
      /></el-form-item>
      <el-form-item label="CompleteRegistration"
        ><el-input v-model="form.eventCompleteRegistration"
      /></el-form-item>
      <el-form-item label="App 内打开"
        ><el-switch v-model="form.openInApp"
      /></el-form-item>
      <el-form-item label="参加营销"
        ><el-switch v-model="form.joinMarketing"
      /></el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio value="ENABLED">启用</el-radio>
          <el-radio value="DISABLED">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
:deep(.el-select) {
  width: 100%;
}
</style>
