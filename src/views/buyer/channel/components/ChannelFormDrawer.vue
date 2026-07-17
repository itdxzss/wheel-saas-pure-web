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
  channelFormFieldErrors,
  hydrateChannelForm,
  saveChannelForm,
  type ChannelFormModel
} from "../domain/channel-form";
import { createChannelDetailLoader } from "../domain/channel-detail-loader";

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
const fieldErrors = reactive<Partial<Record<keyof ChannelFormModel, string>>>(
  {}
);
const editing = computed(() => props.channelId !== undefined);
const supportsToken = computed(
  () => form.platform === "FACEBOOK" || form.platform === "TIKTOK"
);
const countrySelection = computed({
  get: () => (form.countryMode === "MIXED" ? "__MIXED__" : form.targetCountry),
  set: value => {
    if (value === "__MIXED__") {
      form.countryMode = "MIXED";
      const supported = props.options.countries.some(
        country => country.dialCode === form.defaultDialCode
      );
      if (!supported) {
        form.defaultDialCode = props.options.countries[0]?.dialCode ?? "";
      }
      return;
    }
    form.countryMode = "SPECIFIC";
    form.targetCountry = value;
    form.defaultDialCode =
      props.options.countries.find(country => country.code === value)
        ?.dialCode ?? "";
  }
});
const dialCodeOptions = computed(() =>
  form.countryMode === "MIXED"
    ? props.options.countries
    : props.options.countries.filter(
        country => country.code === form.targetCountry
      )
);
const detailLoader = createChannelDetailLoader(getBuyerChannel);

function validateTargetCountry(
  _rule: unknown,
  value: unknown,
  callback: (error?: string | Error) => void
): void {
  if (form.countryMode === "MIXED" || Boolean(value)) {
    callback();
    return;
  }
  callback(new Error("请选择目标国家"));
}

const rules: FormRules<ChannelFormModel> = {
  name: [{ required: true, message: "请输入渠道名称", trigger: "blur" }],
  ownerId: [{ required: true, message: "请选择所属人", trigger: "change" }],
  targetCountry: [{ validator: validateTargetCountry, trigger: "change" }],
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
  Object.keys(fieldErrors).forEach(
    key => delete fieldErrors[key as keyof ChannelFormModel]
  );
  formRef.value?.clearValidate();
}

async function load(): Promise<void> {
  if (!props.modelValue) {
    detailLoader.invalidate();
    loading.value = false;
    return;
  }
  replaceForm(createDefaultChannelForm());
  if (!props.channelId) {
    detailLoader.invalidate();
    loading.value = false;
    return;
  }
  loading.value = true;
  await detailLoader.load(props.channelId, {
    resolved: detail => replaceForm(hydrateChannelForm(detail)),
    rejected: error => {
      ElMessage.error(
        error instanceof Error ? error.message : "渠道详情加载失败"
      );
      emit("update:modelValue", false);
    },
    settled: () => {
      loading.value = false;
    }
  });
}

async function save(): Promise<void> {
  Object.keys(fieldErrors).forEach(
    key => delete fieldErrors[key as keyof ChannelFormModel]
  );
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    await saveChannelForm(
      form,
      editing.value,
      {
        precheck: precheckBuyerChannelDomain,
        create: createBuyerChannel,
        update: updateBuyerChannel
      },
      props.options.countries
    );
    ElMessage.success(editing.value ? "渠道已更新" : "渠道已新增");
    emit("update:modelValue", false);
    emit("saved");
  } catch (error) {
    Object.assign(fieldErrors, channelFormFieldErrors(error));
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
      <el-form-item label="渠道名称" prop="name" :error="fieldErrors.name">
        <el-input
          v-model="form.name"
          maxlength="50"
          placeholder="请输入渠道名称"
        />
      </el-form-item>
      <el-form-item label="所属人" prop="ownerId" :error="fieldErrors.ownerId">
        <el-select v-model="form.ownerId" filterable placeholder="请选择所属人">
          <el-option
            v-for="owner in options.owners"
            :key="owner.id"
            :label="owner.name"
            :value="owner.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="目标国家"
        prop="targetCountry"
        :error="fieldErrors.targetCountry"
      >
        <el-select
          v-model="countrySelection"
          filterable
          placeholder="请选择目标国家"
        >
          <el-option label="混合（不限国家）" value="__MIXED__" />
          <el-option
            v-for="country in options.countries"
            :key="country.code"
            :label="country.name"
            :value="country.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="绑定模板"
        prop="templateId"
        :error="fieldErrors.templateId"
      >
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
      <el-form-item label="绑定域名" prop="domain" :error="fieldErrors.domain">
        <el-input v-model="form.domain" placeholder="landing.example.com">
          <template #prepend>https://</template>
        </el-input>
      </el-form-item>
      <el-form-item
        label="默认区号"
        prop="defaultDialCode"
        :error="fieldErrors.defaultDialCode"
      >
        <el-select
          v-model="form.defaultDialCode"
          :disabled="form.countryMode === 'SPECIFIC'"
          filterable
          placeholder="请选择默认区号"
        >
          <el-option
            v-for="country in dialCodeOptions"
            :key="`${country.code}-${country.dialCode}`"
            :label="`${country.name} ${country.dialCode}`"
            :value="country.dialCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="推广平台"
        prop="platform"
        :error="fieldErrors.platform"
      >
        <el-radio-group v-model="form.platform">
          <el-radio-button
            v-for="platform in options.platforms"
            :key="platform.value"
            :value="platform.value"
          >
            {{ platform.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        label="Pixel ID"
        prop="pixelId"
        :error="fieldErrors.pixelId"
      >
        <el-input v-model="form.pixelId" placeholder="请输入 Pixel ID" />
      </el-form-item>
      <el-form-item
        v-if="supportsToken"
        label="Access Token"
        prop="accessToken"
        :error="fieldErrors.accessToken"
      >
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
      <el-form-item
        label="Lead"
        prop="eventLead"
        :error="fieldErrors.eventLead"
      >
        <el-select v-model="form.eventLead">
          <el-option
            v-for="event in options.eventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="InitiateCheckout"
        prop="eventInitiateCheckout"
        :error="fieldErrors.eventInitiateCheckout"
      >
        <el-select v-model="form.eventInitiateCheckout">
          <el-option
            v-for="event in options.eventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="CompleteRegistration"
        prop="eventCompleteRegistration"
        :error="fieldErrors.eventCompleteRegistration"
      >
        <el-select v-model="form.eventCompleteRegistration">
          <el-option
            v-for="event in options.eventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
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
