<script setup lang="ts">
import { computed } from "vue";
import type { IpCountryOption } from "@/api/resource-ip";
import {
  countriesForContinent,
  type HistoricalFilterValue
} from "../group-list-filters";
import { groupContinentOptions } from "../constants";

defineOptions({ name: "HistoricalGroupFilterDrawer" });

const props = defineProps<{
  modelValue: boolean;
  value: HistoricalFilterValue;
  countries: IpCountryOption[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:value", value: HistoricalFilterValue): void;
  (event: "clear"): void;
  (event: "apply"): void;
  (event: "query"): void;
  (event: "close"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => {
    if (!value) emit("close");
    emit("update:modelValue", value);
  }
});
const countryOptions = computed(() =>
  countriesForContinent(props.countries, props.value.continentCode)
);

const ageRanges = [
  [0, 7, "0-7天"],
  [8, 30, "8-30天"],
  [31, 90, "31-90天"],
  [91, 180, "91-180天"],
  [181, 365, "181-365天"],
  [366, undefined, "365天以上"]
] as const;
const memberRanges = [
  [0, 50, "0-50人"],
  [51, 100, "51-100人"],
  [101, 200, "101-200人"],
  [201, 500, "201-500人"],
  [501, undefined, "500人以上"]
] as const;

function update(patch: Partial<HistoricalFilterValue>): void {
  emit("update:value", { ...props.value, ...patch });
}

function updateContinent(continentCode: string): void {
  const selectedCountry = props.countries.find(
    item => item.iso2 === props.value.countryIso2
  );
  update({
    continentCode,
    countryIso2:
      selectedCountry &&
      continentCode &&
      selectedCountry.continentCode !== continentCode
        ? ""
        : props.value.countryIso2
  });
}
</script>

<template>
  <el-drawer v-model="visible" title="历史群组筛选" size="460px">
    <el-form label-position="top" class="historical-filter-form">
      <el-form-item label="群所属大洲">
        <el-select
          :model-value="value.continentCode"
          clearable
          placeholder="全部大洲"
          @update:model-value="updateContinent"
        >
          <el-option
            v-for="item in groupContinentOptions"
            :key="item[0]"
            :value="item[0]"
            :label="item[1]"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="群主国家">
        <el-select
          :model-value="value.countryIso2"
          clearable
          filterable
          :loading="loading"
          placeholder="全部国家"
          @update:model-value="countryIso2 => update({ countryIso2 })"
        >
          <el-option
            v-for="item in countryOptions"
            :key="item.value"
            :value="item.iso2 || item.value"
            :label="`${item.flag || ''} ${item.nameZh}`.trim()"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="建群天数">
        <div class="range-inputs">
          <el-input-number
            :model-value="value.ageDaysMin"
            :min="0"
            controls-position="right"
            placeholder="最小"
            @update:model-value="ageDaysMin => update({ ageDaysMin })"
          />
          <span>至</span>
          <el-input-number
            :model-value="value.ageDaysMax"
            :min="0"
            controls-position="right"
            placeholder="最大"
            @update:model-value="ageDaysMax => update({ ageDaysMax })"
          />
        </div>
        <div class="quick-ranges">
          <el-button
            v-for="item in ageRanges"
            :key="item[2]"
            size="small"
            @click="update({ ageDaysMin: item[0], ageDaysMax: item[1] })"
          >
            {{ item[2] }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="群成员数量">
        <div class="range-inputs">
          <el-input-number
            :model-value="value.memberCountMin"
            :min="0"
            controls-position="right"
            placeholder="最小"
            @update:model-value="memberCountMin => update({ memberCountMin })"
          />
          <span>至</span>
          <el-input-number
            :model-value="value.memberCountMax"
            :min="0"
            controls-position="right"
            placeholder="最大"
            @update:model-value="memberCountMax => update({ memberCountMax })"
          />
        </div>
        <div class="quick-ranges">
          <el-button
            v-for="item in memberRanges"
            :key="item[2]"
            size="small"
            @click="
              update({ memberCountMin: item[0], memberCountMax: item[1] })
            "
          >
            {{ item[2] }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('clear')">清空</el-button>
      <el-button @click="emit('apply')">应用</el-button>
      <el-button type="primary" @click="emit('query')">查询</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.historical-filter-form :deep(.el-select) {
  width: 100%;
}

.range-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.quick-ranges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.quick-ranges :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
