<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue/offline";
import { Search } from "@element-plus/icons-vue";
import { countryFlagIcon } from "../../channel/domain/channel-country-flag";
import {
  normalizePhoneDigits,
  validateDateV2Phone,
  type DateV2Country
} from "../domain/date-v2-preview";

const props = defineProps<{
  countries: DateV2Country[];
  initialCountryCode: string;
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  login: [payload: { country: DateV2Country; phone: string }];
}>();

const selectedCode = ref(props.initialCountryCode);
const phone = ref("");
const errorMessage = ref("");
const pickerVisible = ref(false);
const countryKeyword = ref("");

const selectedCountry = computed(
  () =>
    props.countries.find(country => country.code === selectedCode.value) ??
    props.countries[0]
);

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  if (!keyword) return props.countries;
  return props.countries.filter(country =>
    `${country.name} ${country.code} ${country.dialCode}`
      .toLowerCase()
      .includes(keyword)
  );
});

watch(
  () => props.initialCountryCode,
  value => {
    if (props.countries.some(country => country.code === value)) {
      selectedCode.value = value;
    }
  }
);

watch([selectedCode, phone], () => {
  errorMessage.value = "";
});

function selectCountry(country: DateV2Country): void {
  selectedCode.value = country.code;
  pickerVisible.value = false;
  countryKeyword.value = "";
}

function submit(): void {
  if (!selectedCountry.value) return;
  const validationMessage = validateDateV2Phone(
    phone.value,
    selectedCountry.value
  );
  if (validationMessage) {
    errorMessage.value = validationMessage;
    return;
  }
  emit("login", {
    country: selectedCountry.value,
    phone: normalizePhoneDigits(phone.value)
  });
  visible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="date-v2-login-dialog"
    :style="{ '--date-theme': themeColor }"
    width="min(760px, calc(100vw - 24px))"
    append-to-body
    align-center
    :show-close="true"
    :close-on-click-modal="false"
  >
    <div class="login-panel">
      <h2>用 WhatsApp 登录，与新朋友视频聊天</h2>
      <p>登录后可浏览更多精彩内容</p>

      <el-form class="login-form" label-position="top" @submit.prevent>
        <el-form-item label="请输入 WhatsApp 电话号码" :error="errorMessage">
          <div class="phone-field" :class="{ 'has-error': errorMessage }">
            <el-button
              class="country-trigger"
              text
              type="primary"
              aria-label="选择国家或地区"
              @click="pickerVisible = true"
            >
              <Icon
                v-if="countryFlagIcon(selectedCountry?.code)"
                class="country-flag"
                :icon="countryFlagIcon(selectedCountry?.code)!"
              />
              <span>{{ selectedCountry?.dialCode }}</span>
              <span class="country-trigger__arrow">⌄</span>
            </el-button>
            <el-input
              v-model="phone"
              inputmode="numeric"
              autocomplete="tel"
              maxlength="16"
              placeholder="输入你的电话号码"
              clearable
              @keyup.enter="submit"
            />
          </div>
        </el-form-item>
      </el-form>

      <el-button
        class="login-submit"
        type="primary"
        :disabled="!phone"
        @click="submit"
      >
        继续
      </el-button>
    </div>
  </el-dialog>

  <el-drawer
    v-model="pickerVisible"
    class="date-v2-country-drawer"
    :style="{ '--date-theme': themeColor }"
    direction="btt"
    size="82%"
    append-to-body
    :show-close="false"
  >
    <template #header>
      <strong>选择国家或地区</strong>
    </template>
    <el-input
      v-model="countryKeyword"
      class="country-search"
      :prefix-icon="Search"
      placeholder="搜索国家或区号"
      clearable
    />
    <el-scrollbar class="country-list">
      <el-button
        v-for="country in filteredCountries"
        :key="country.code"
        class="country-row"
        text
        @click="selectCountry(country)"
      >
        <Icon
          v-if="countryFlagIcon(country.code)"
          class="country-flag"
          :icon="countryFlagIcon(country.code)!"
        />
        <span>{{ country.name }}</span>
        <span class="country-code">{{ country.dialCode }}</span>
        <span
          v-if="country.code === selectedCountry?.code"
          class="country-check"
        >
          ✓
        </span>
      </el-button>
    </el-scrollbar>
  </el-drawer>
</template>

<style scoped>
.login-panel {
  padding: 12px 4px 8px;
  color: #fff;
  text-align: center;
}

.login-panel h2 {
  margin: 0;
  font-size: clamp(22px, 4vw, 30px);
}

.login-panel > p {
  margin: 12px 0 28px;
  color: rgb(255 255 255 / 60%);
}

.login-form {
  padding: 24px;
  text-align: left;
  background: color-mix(in srgb, var(--date-theme) 20%, #160f16);
  border: 2px solid color-mix(in srgb, var(--date-theme) 68%, #3a2530);
  border-radius: 24px;
}

.login-form :deep(.el-form-item__label) {
  justify-content: center;
  width: 100%;
  margin-bottom: 14px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.login-form :deep(.el-form-item__error) {
  position: static;
  padding-top: 10px;
  color: #ff7b87;
}

.phone-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  width: 100%;
  overflow: hidden;
  background: rgb(9 6 9 / 72%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 16px;
}

.phone-field.has-error {
  border-color: #ff6c78;
  box-shadow: 0 0 0 3px rgb(255 82 100 / 14%);
}

.country-trigger {
  height: 66px;
  padding: 0 16px;
  font-size: 16px;
  color: #fff;
  border-right: 1px solid rgb(255 255 255 / 14%);
  border-radius: 0;
}

.country-trigger__arrow {
  margin-left: 6px;
  color: rgb(255 255 255 / 54%);
}

.country-flag {
  width: 28px;
  margin-right: 9px;
  font-size: 22px;
}

.phone-field :deep(.el-input__wrapper) {
  min-height: 66px;
  background: transparent;
  box-shadow: none;
}

.phone-field :deep(.el-input__inner) {
  font-size: 18px;
  color: #fff;
}

.login-submit {
  width: 100%;
  min-height: 60px;
  margin-top: 22px;
  font-size: 20px;
  font-weight: 800;
  background: var(--date-theme);
  border: 0;
  border-radius: 999px;
}

.country-search {
  margin-bottom: 14px;
}

.country-list {
  height: calc(100% - 54px);
}

.country-row {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  height: 54px;
  padding: 0 6px;
  font-size: 16px;
  color: #f8eef4;
  border-radius: 12px;
}

.country-row:hover {
  color: #fff;
  background: rgb(255 255 255 / 7%);
}

.country-code {
  margin-left: auto;
  color: rgb(255 255 255 / 48%);
}

.country-check {
  margin-left: 12px;
  color: var(--date-theme);
}

:global(.date-v2-login-dialog) {
  color: #fff;
  background: linear-gradient(145deg, rgb(41 19 32 / 97%), rgb(8 6 8 / 98%));
  border: 1px solid color-mix(in srgb, var(--date-theme) 48%, transparent);
  border-radius: 28px;
  box-shadow: 0 28px 80px rgb(0 0 0 / 65%);
}

:global(.date-v2-login-dialog .el-dialog__header) {
  padding: 0;
}

:global(.date-v2-login-dialog .el-dialog__headerbtn) {
  top: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  background: rgb(255 255 255 / 10%);
  border-radius: 50%;
}

:global(.date-v2-login-dialog .el-dialog__close) {
  color: #fff;
}

:global(.date-v2-country-drawer) {
  color: #fff;
  background: #25101c;
  border-top: 2px solid color-mix(in srgb, var(--date-theme) 50%, transparent);
  border-radius: 24px 24px 0 0;
}

:global(.date-v2-country-drawer .el-drawer__header) {
  margin-bottom: 0;
  color: #fff;
}

@media (width <= 560px) {
  .login-form {
    padding: 18px 14px;
  }

  .country-trigger {
    padding-inline: 10px;
  }
}
</style>
