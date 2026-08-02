<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { MarketingTaskExportCountry } from "@/api/marketing-task-export";
import type { MarketingTaskExportForm } from "../composables/useMarketingTaskExport";

defineOptions({
  name: "MarketingTaskExportDialog"
});

const props = defineProps<{
  countries: MarketingTaskExportCountry[];
  countriesLoading: boolean;
  selectedTaskCount: number;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "submit", form: MarketingTaskExportForm): void;
}>();

const visible = defineModel<boolean>({ required: true });
const formRef = ref<FormInstance>();
const countrySearch = ref("");
const form = reactive<MarketingTaskExportForm>({
  mode: "COUNTRY_ENTRY",
  countryIso2s: []
});

const rules: FormRules<MarketingTaskExportForm> = {
  countryIso2s: [
    {
      validator: (_rule, value, callback) => {
        if (
          form.mode === "COUNTRY_ENTRY" &&
          (!Array.isArray(value) || value.length === 0)
        ) {
          callback(new Error("请至少选择一个国家或地区。"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ]
};

const filteredCountries = computed(() => {
  const query = countrySearch.value.trim().toLowerCase();
  if (!query) return props.countries;
  const digits = query.replace(/\D/g, "");
  return props.countries.filter(country => {
    const text = [
      country.nameZh,
      country.nameEn,
      country.iso2,
      country.phonePrefix
    ]
      .join(" ")
      .toLowerCase();
    return (
      text.includes(query) ||
      (digits.length > 0 &&
        country.phonePrefix.replace(/\D/g, "").includes(digits))
    );
  });
});

const allCountriesSelected = computed(
  () =>
    props.countries.length > 0 &&
    form.countryIso2s.length === props.countries.length
);

function countryLabel(country: MarketingTaskExportCountry): string {
  const prefix = country.phonePrefix ? `（${country.phonePrefix}）` : "";
  return `${country.nameZh} ${country.nameEn}${prefix}`.trim();
}

function filterCountries(query: string): void {
  countrySearch.value = query;
}

function resetCountrySearch(open: boolean): void {
  if (!open) countrySearch.value = "";
}

function selectAllCountries(): void {
  form.countryIso2s = props.countries.map(country => country.iso2);
}

function clearCountries(): void {
  form.countryIso2s = [];
}

async function submit(): Promise<void> {
  try {
    await formRef.value?.validate();
    emit("submit", {
      mode: form.mode,
      countryIso2s: [...form.countryIso2s]
    });
  } catch {
    if (form.mode === "COUNTRY_ENTRY" && form.countryIso2s.length === 0) {
      ElMessage.warning("请至少选择一个国家或地区。");
    }
  }
}

watch(
  visible,
  async open => {
    if (!open) return;
    form.mode = "COUNTRY_ENTRY";
    form.countryIso2s = [];
    countrySearch.value = "";
    await nextTick();
    formRef.value?.clearValidate();
  },
  { flush: "post" }
);

watch(
  () => form.mode,
  () => formRef.value?.clearValidate("countryIso2s")
);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导出营销任务数据"
    width="640px"
    destroy-on-close
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
  >
    <el-alert
      class="selection-summary"
      type="info"
      :closable="false"
      show-icon
      :title="`已选择 ${selectedTaskCount} 个营销任务`"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="导出方式" required>
        <el-radio-group v-model="form.mode" class="export-mode-group">
          <el-radio value="COUNTRY_ENTRY" border>
            按国家导出实际进群数据
          </el-radio>
          <el-radio value="FULL" border>导出营销任务全量数据</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="form.mode === 'COUNTRY_ENTRY'"
        label="国家或地区"
        prop="countryIso2s"
        required
      >
        <div class="country-field">
          <el-select
            v-model="form.countryIso2s"
            class="country-select"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            clearable
            :loading="countriesLoading"
            :filter-method="filterCountries"
            placeholder="请选择国家或地区"
            no-data-text="暂无匹配的国家或地区"
            @visible-change="resetCountrySearch"
          >
            <el-option
              v-for="country in filteredCountries"
              :key="country.iso2"
              :label="countryLabel(country)"
              :value="country.iso2"
            >
              <span class="country-option">
                <span class="country-flag">{{ country.flag }}</span>
                <span>{{ country.nameZh }}</span>
                <span class="country-english">{{ country.nameEn }}</span>
                <span v-if="country.phonePrefix" class="country-prefix">
                  {{ country.phonePrefix }}
                </span>
              </span>
            </el-option>
          </el-select>
          <div class="country-actions">
            <span> 已选择 {{ form.countryIso2s.length }} 个国家或地区 </span>
            <span>
              <el-button
                link
                type="primary"
                :disabled="allCountriesSelected || countriesLoading"
                @click="selectAllCountries"
              >
                全选
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="form.countryIso2s.length === 0"
                @click="clearCountries"
              >
                清空
              </el-button>
            </span>
          </div>
        </div>
      </el-form-item>

      <el-alert
        v-else
        type="info"
        :closable="false"
        title="将导出营销任务汇总和群组明细数据"
      />
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        确认导出
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.selection-summary {
  margin-bottom: 18px;
}

.export-mode-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.export-mode-group :deep(.el-radio) {
  width: 100%;
  margin-right: 0;
}

.country-field,
.country-select {
  width: 100%;
}

.country-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.country-option {
  display: flex;
  gap: 8px;
  align-items: center;
}

.country-flag {
  width: 22px;
}

.country-english,
.country-prefix {
  color: var(--el-text-color-secondary);
}

@media (width <= 640px) {
  .export-mode-group {
    grid-template-columns: 1fr;
  }
}
</style>
