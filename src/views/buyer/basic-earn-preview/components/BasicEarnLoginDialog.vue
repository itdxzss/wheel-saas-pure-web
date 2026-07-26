<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue/offline";
import { countryFlagIcon } from "../../channel/domain/channel-country-flag";
import {
  normalizePhoneDigits,
  validateDateV2Phone,
  type DateV2Country
} from "../../date-v2-preview/domain/date-v2-preview";

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
const countryPickerVisible = ref(false);
const countryKeyword = ref("");

const selectedCountry = computed(
  () =>
    props.countries.find(country => country.code === selectedCode.value) ??
    props.countries[0]
);

const validationMessage = computed(() => {
  if (!phone.value || !selectedCountry.value) return undefined;
  return validateDateV2Phone(phone.value, selectedCountry.value);
});

const isValid = computed(
  () => Boolean(phone.value) && !validationMessage.value
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
  },
  { immediate: true }
);

watch([selectedCode, phone], () => {
  errorMessage.value = "";
});

watch(visible, value => {
  if (!value) {
    phone.value = "";
    errorMessage.value = "";
  }
});

function selectCountry(country: DateV2Country): void {
  selectedCode.value = country.code;
  countryPickerVisible.value = false;
  countryKeyword.value = "";
}

function submit(): void {
  if (!selectedCountry.value) return;
  const message = validateDateV2Phone(phone.value, selectedCountry.value);
  if (message) {
    errorMessage.value = message;
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
    class="basic-earn-login-dialog"
    :style="{ '--earn-theme': themeColor }"
    width="min(610px, calc(100vw - 24px))"
    append-to-body
    align-center
    :show-close="true"
    :close-on-click-modal="false"
  >
    <div class="login-content">
      <div class="whatsapp-logo" aria-hidden="true">◔</div>
      <h2>用 WhatsApp 登录</h2>
      <p>输入您的号码即可解锁奖励</p>

      <div
        class="phone-shell"
        :class="{
          'is-valid': isValid,
          'has-error': Boolean(errorMessage)
        }"
      >
        <el-button
          class="country-trigger"
          text
          aria-label="选择国家或地区"
          @click="countryPickerVisible = true"
        >
          <Icon
            v-if="countryFlagIcon(selectedCountry?.code)"
            class="country-flag"
            :icon="countryFlagIcon(selectedCountry?.code)!"
          />
          <strong>{{ selectedCountry?.dialCode }}</strong>
          <span>⌄</span>
        </el-button>
        <el-input
          v-model="phone"
          inputmode="numeric"
          autocomplete="tel"
          maxlength="16"
          placeholder="电话号码"
          @keyup.enter="submit"
        />
        <span v-if="isValid" class="field-status success">✓</span>
        <span v-else-if="errorMessage" class="field-status error">×</span>
      </div>
      <p v-if="errorMessage" class="error-message">
        <span>!</span>{{ errorMessage }}
      </p>

      <el-button
        class="continue-button"
        type="primary"
        :disabled="!phone"
        @click="submit"
      >
        继续 <span>→</span>
      </el-button>

      <div class="security-notes">
        <span>♙ 端到端加密</span>
        <span>✓ 没有存储数据</span>
      </div>
    </div>
  </el-dialog>

  <el-drawer
    v-model="countryPickerVisible"
    class="basic-earn-country-drawer"
    :style="{ '--earn-theme': themeColor }"
    direction="btt"
    size="78%"
    append-to-body
    :show-close="false"
  >
    <template #header>
      <strong>选择国家或地区</strong>
    </template>
    <el-input
      v-model="countryKeyword"
      class="country-search"
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
        <span class="dial-code">{{ country.dialCode }}</span>
        <span v-if="country.code === selectedCountry?.code" class="check">
          ✓
        </span>
      </el-button>
    </el-scrollbar>
  </el-drawer>
</template>

<style scoped>
.login-content {
  padding: 12px 14px 10px;
  color: #24211e;
  text-align: center;
}

.whatsapp-logo {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  margin: 0 auto 22px;
  font-size: 45px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  background: linear-gradient(145deg, #25d366, #07927d);
  border-radius: 20px;
  box-shadow: 0 15px 30px rgb(37 211 102 / 24%);
  transform: rotate(-25deg);
}

.login-content h2 {
  margin: 0;
  font-size: clamp(26px, 5vw, 34px);
}

.login-content > p:not(.error-message) {
  margin: 8px 0 28px;
  font-size: 16px;
  color: #8d8781;
}

.phone-shell {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 40px;
  width: 100%;
  overflow: hidden;
  background: #fafafa;
  border: 1px solid #dedbd7;
  border-radius: 18px;
  transition: 0.2s ease;
}

.phone-shell.is-valid {
  background: #effbf3;
  border-color: #66d495;
  box-shadow: 0 0 0 4px rgb(62 203 121 / 10%);
}

.phone-shell.has-error {
  background: #fff5f4;
  border-color: #ff7b78;
  box-shadow: 0 0 0 4px rgb(255 80 80 / 9%);
}

.country-trigger {
  height: 68px;
  padding: 0 17px;
  color: #282522;
  border-right: 1px solid #e3e0dc;
  border-radius: 0;
}

.country-trigger strong {
  margin-left: 8px;
  font-size: 17px;
}

.country-trigger span {
  margin-left: 6px;
  color: #77716c;
}

.country-flag {
  width: 30px;
  font-size: 22px;
}

.phone-shell :deep(.el-input__wrapper) {
  min-height: 68px;
  padding-inline: 18px 4px;
  background: transparent;
  box-shadow: none;
}

.phone-shell :deep(.el-input__inner) {
  font-size: 18px;
  color: #24211e;
}

.field-status {
  align-self: center;
  font-size: 24px;
  font-weight: 700;
}

.field-status.success {
  color: #0ca84f;
}

.field-status.error {
  color: #ff4545;
}

.error-message {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 9px 4px 0;
  font-size: 14px;
  color: #ff4545;
  text-align: left;
}

.error-message span {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  font-size: 12px;
  border: 1px solid currentcolor;
  border-radius: 50%;
}

.continue-button {
  width: 100%;
  min-height: 64px;
  margin-top: 22px;
  font-size: 18px;
  font-weight: 900;
  color: #2d2417;
  background: var(--earn-theme);
  border: 0;
  border-radius: 18px;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--earn-theme) 25%, transparent);
}

.continue-button span {
  margin-left: 7px;
}

.continue-button.is-disabled {
  color: #aaa6a1;
  background: #f3f3f3;
  box-shadow: none;
}

.security-notes {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.security-notes span {
  padding: 7px 12px;
  font-size: 12px;
  color: #76716d;
  background: #f7f7f6;
  border: 1px solid #e2dfdc;
  border-radius: 999px;
}

.country-search {
  margin-bottom: 12px;
}

.country-list {
  height: calc(100% - 54px);
}

.country-row {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  height: 54px;
  color: #2d2925;
  border-radius: 12px;
}

.country-row:hover {
  background: #f7f1e8;
}

.country-row .country-flag {
  margin-right: 12px;
}

.dial-code {
  margin-left: auto;
  color: #98918a;
}

.check {
  margin-left: 12px;
  color: var(--earn-theme);
}

:global(.basic-earn-login-dialog) {
  padding: 24px 22px;
  background: #fff;
  border: 1px solid #d9d1c5;
  border-top: 5px solid var(--earn-theme);
  border-radius: 32px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 25%);
}

:global(.basic-earn-login-dialog .el-dialog__header) {
  padding: 0;
}

:global(.basic-earn-login-dialog .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  width: 42px;
  height: 42px;
  background: #f3f3f3;
  border: 1px solid #dfdfdf;
  border-radius: 50%;
}

:global(.basic-earn-country-drawer) {
  background: #fffdf9;
  border-top: 3px solid var(--earn-theme);
  border-radius: 24px 24px 0 0;
}

:global(.basic-earn-country-drawer .el-drawer__header) {
  margin-bottom: 0;
  color: #2d2925;
}

@media (width <= 500px) {
  :global(.basic-earn-login-dialog) {
    padding: 18px 8px;
  }

  .login-content {
    padding-inline: 4px;
  }

  .country-trigger {
    padding-inline: 12px;
  }

  .security-notes span {
    padding-inline: 8px;
  }
}
</style>
