<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Icon, type IconifyIcon } from "@iconify/vue/offline";
import flagpack from "@iconify/json/json/flagpack.json";
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

interface FlagIconCollection {
  width?: number;
  height?: number;
  icons: Record<string, IconifyIcon>;
}

const previewOwnerOptions = [
  { id: 1, name: "test" },
  { id: 2, name: "testuser456" },
  { id: 3, name: "Rahu" },
  { id: 4, name: "ForeverAditya" },
  { id: 5, name: "pingzi" },
  { id: 6, name: "gose-" }
];

const previewTemplateOptions = [
  { id: 1, name: "约会三代" },
  { id: 2, name: "基础领奖" },
  { id: 3, name: "基础约会-投男粉" },
  { id: 4, name: "基础约会-投女粉" },
  { id: 5, name: "约会二代" }
];

const reportingEventOptions = [
  { label: "潜在客户（留资）（Lead）", value: "Lead" },
  { label: "发起结账 (InitiateCheckout)", value: "InitiateCheckout" },
  {
    label: "完成注册 (CompleteRegistration)",
    value: "CompleteRegistration"
  }
];

const flagIconCollection = flagpack as unknown as FlagIconCollection;
const flagIconCache = new Map<string, IconifyIcon>();

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
function createDrawerDefaultForm(): ChannelFormModel {
  return {
    ...createDefaultChannelForm(),
    ownerId: previewOwnerOptions[0].id,
    openInApp: true
  };
}

const form = reactive<ChannelFormModel>(createDrawerDefaultForm());
const fieldErrors = reactive<Partial<Record<keyof ChannelFormModel, string>>>(
  {}
);
const editing = computed(() => props.channelId !== undefined);
const supportsToken = computed(
  () => form.platform === "FACEBOOK" || form.platform === "TIKTOK"
);

function countryFlagIcon(code: string): IconifyIcon | undefined {
  const normalizedCode = code.trim().toLowerCase();
  if (!normalizedCode) return undefined;
  const cached = flagIconCache.get(normalizedCode);
  if (cached) return cached;
  const source = flagIconCollection.icons[normalizedCode];
  if (!source) return undefined;
  const icon: IconifyIcon = {
    ...source,
    width: source.width ?? flagIconCollection.width ?? 32,
    height: source.height ?? flagIconCollection.height ?? 24
  };
  flagIconCache.set(normalizedCode, icon);
  return icon;
}

function countrySelectionLabel(value: unknown): string {
  if (value === "__MIXED__") return "混合（不限国家）";
  if (typeof value !== "string") return "";
  return (
    props.options.countries.find(country => country.code === value)?.name ?? ""
  );
}

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
    form.targetCountry = typeof value === "string" ? value : "";
    form.defaultDialCode =
      props.options.countries.find(
        country => country.code === form.targetCountry
      )?.dialCode ?? "";
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
  ownerId: [{ required: true, message: "请选择归属用户", trigger: "change" }],
  targetCountry: [
    {
      required: true,
      validator: validateTargetCountry,
      trigger: "change"
    }
  ],
  templateId: [
    { required: true, message: "请选择绑定模板", trigger: "change" }
  ],
  domain: [{ required: true, message: "请输入域名", trigger: "blur" }],
  defaultDialCode: [
    { required: true, message: "请选择预选区号", trigger: "change" }
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
  replaceForm(createDrawerDefaultForm());
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
      class="channel-form"
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
      <el-form-item
        label="归属用户"
        prop="ownerId"
        :error="fieldErrors.ownerId"
      >
        <el-select
          v-model="form.ownerId"
          class="business-select"
          popper-class="buyer-owner-select-popper"
          clearable
          filterable
          placeholder="请选择归属用户"
        >
          <el-option
            v-for="owner in previewOwnerOptions"
            :key="owner.id"
            :label="owner.name"
            :value="owner.id"
          >
            <div class="business-option">
              <span>{{ owner.name }}</span>
              <span
                v-if="form.ownerId === owner.id"
                class="option-check"
                aria-hidden="true"
              />
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="目标国家"
        prop="targetCountry"
        :error="fieldErrors.targetCountry"
      >
        <el-select
          v-model="countrySelection"
          class="country-select"
          popper-class="buyer-country-select-popper"
          clearable
          filterable
          placeholder="请选择目标国家"
        >
          <template #label="{ value }">
            <div class="country-option country-option--selected">
              <span v-if="value === '__MIXED__'" class="country-globe">🌐</span>
              <Icon
                v-else-if="countryFlagIcon(String(value))"
                :icon="countryFlagIcon(String(value))"
                class="country-flag"
                aria-hidden="true"
              />
              <span class="country-name">{{
                countrySelectionLabel(value)
              }}</span>
            </div>
          </template>
          <el-option label="🌐 混合（不限国家）" value="__MIXED__">
            <div class="country-option">
              <span class="country-globe">🌐</span>
              <span class="country-name">混合（不限国家）</span>
              <span
                v-if="countrySelection === '__MIXED__'"
                class="country-check"
                aria-hidden="true"
              />
            </div>
          </el-option>
          <el-option
            v-for="country in options.countries"
            :key="country.code"
            :label="`${country.name} ${country.dialCode}`"
            :value="country.code"
          >
            <div class="country-option">
              <Icon
                v-if="countryFlagIcon(country.code)"
                :icon="countryFlagIcon(country.code)"
                class="country-flag"
                aria-hidden="true"
              />
              <span v-else class="country-flag-fallback">{{
                country.code
              }}</span>
              <span class="country-name">{{ country.name }}</span>
              <span class="country-dial-code">{{ country.dialCode }}</span>
              <span
                v-if="countrySelection === country.code"
                class="country-check country-check--after-dial-code"
                aria-hidden="true"
              />
            </div>
          </el-option>
        </el-select>
        <p class="field-help">
          仅用于渠道分类标记，比如主要投印度就选「印度」，选完后下方预选区号会自动填充。
        </p>
      </el-form-item>
      <el-form-item
        label="绑定模板"
        prop="templateId"
        :error="fieldErrors.templateId"
      >
        <el-select
          v-model="form.templateId"
          class="business-select"
          popper-class="buyer-template-select-popper"
          clearable
          placeholder="请选择模板"
        >
          <el-option
            v-for="template in previewTemplateOptions"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          >
            <div class="business-option">
              <span>{{ template.name }}</span>
              <span
                v-if="form.templateId === template.id"
                class="option-check"
                aria-hidden="true"
              />
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="访问域名" prop="domain" :error="fieldErrors.domain">
        <el-input v-model="form.domain" placeholder="example.com">
          <template #prepend>https://</template>
        </el-input>
        <el-alert
          class="domain-alert"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            <div class="alert-copy">
              <p>域名需要解析后才可正常访问，请联系运营人员配置！</p>
              <p>
                同一个域名只能在同一个模板下创建多个渠道链接，跨模板请使用新域名~
              </p>
              <p>
                还没有域名？推荐前往
                <a
                  href="https://www.dynadot.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Dynadot</a
                >
                注册购买，支持 .net / .org / .info 等多种后缀，价格实惠。
              </p>
            </div>
          </template>
        </el-alert>
      </el-form-item>
      <el-form-item
        label="预选区号"
        prop="defaultDialCode"
        :error="fieldErrors.defaultDialCode"
      >
        <el-select
          v-model="form.defaultDialCode"
          :disabled="form.countryMode === 'SPECIFIC'"
          filterable
          placeholder="请选择预选区号"
        >
          <el-option
            v-for="country in dialCodeOptions"
            :key="`${country.code}-${country.dialCode}`"
            :label="`${country.name} ${country.dialCode}`"
            :value="country.dialCode"
          />
        </el-select>
        <p class="field-help">
          决定用户打开渠道链接后，手机号输入框默认显示的区号。比如选「印度」，用户进来就默认是
          +91，无需手动切换。
        </p>
      </el-form-item>
      <el-form-item
        label="推广平台"
        prop="platform"
        :error="fieldErrors.platform"
      >
        <el-radio-group v-model="form.platform" class="platform-group">
          <el-radio-button
            v-for="platform in options.platforms"
            :key="platform.value"
            :value="platform.value"
          >
            {{ platform.label }}
          </el-radio-button>
        </el-radio-group>
        <p class="field-help">
          选择投放渠道使用的推广平台，仅 Facebook / TikTok 支持 CAPI 探测；快手
          / MGSKY Ads 无需填写 Access Token。
        </p>
      </el-form-item>
      <el-form-item
        label="FB Pixel ID"
        prop="pixelId"
        :error="fieldErrors.pixelId"
      >
        <el-input
          v-model="form.pixelId"
          placeholder="请输入 Facebook 像素 ID"
        />
      </el-form-item>
      <el-form-item
        v-if="supportsToken"
        label="FB Access Token"
        prop="accessToken"
        :error="fieldErrors.accessToken"
      >
        <el-input
          v-model="form.accessToken"
          type="textarea"
          :rows="4"
          resize="vertical"
          autocomplete="new-password"
          :placeholder="
            editing && form.accessTokenConfigured
              ? '已配置，留空表示不修改'
              : '请输入 FB Conversions API 长效 Access Token'
          "
        />
      </el-form-item>
      <el-form-item
        label="意向用户上报事件"
        prop="eventLead"
        :error="fieldErrors.eventLead"
      >
        <el-select v-model="form.eventLead">
          <el-option
            v-for="event in reportingEventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="请求登录上报事件"
        prop="eventInitiateCheckout"
        :error="fieldErrors.eventInitiateCheckout"
      >
        <el-select v-model="form.eventInitiateCheckout">
          <el-option
            v-for="event in reportingEventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="登录成功上报事件"
        prop="eventCompleteRegistration"
        :error="fieldErrors.eventCompleteRegistration"
      >
        <el-select v-model="form.eventCompleteRegistration">
          <el-option
            v-for="event in reportingEventOptions"
            :key="event.value"
            :label="event.label"
            :value="event.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="App 内打开">
        <el-switch
          v-model="form.openInApp"
          class="permission-switch"
          inline-prompt
          active-text="允许"
          inactive-text="禁止"
          :width="66"
        />
        <el-alert
          class="app-open-alert"
          type="success"
          title="用户点击广告后，可直接在 Facebook 内置浏览器里完成登录上号，无需跳出 App。"
          :closable="false"
          show-icon
        />
      </el-form-item>
      <el-form-item label="参加营销">
        <el-switch
          v-model="form.joinMarketing"
          class="permission-switch"
          inline-prompt
          active-text="允许"
          inactive-text="禁止"
          :width="66"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-drawer>
</template>

<style scoped src="./ChannelFormDrawer.scss"></style>
