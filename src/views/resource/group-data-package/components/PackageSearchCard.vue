<script setup lang="ts">
import { computed } from "vue";
import type { GroupDataPackageCountry } from "@/api/group-data-package";
import {
  continentOptions,
  type GroupPackageSearch
} from "../domain/package-display";

defineOptions({ name: "GroupPackageSearchCard" });
defineProps<{
  countries: GroupDataPackageCountry[];
  countryLoading: boolean;
  loading: boolean;
}>();
const form = defineModel<GroupPackageSearch>({ required: true });
const emit = defineEmits<{ (event: "search"): void; (event: "reset"): void }>();
const datePreset = computed(() => {
  if (!form.value.createdRange) return "all";
  for (const [key, offset] of [
    ["today", 0],
    ["yesterday", -1]
  ] as const) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + offset);
    if (start.getTime() === form.value.createdRange[0].getTime()) return key;
  }
  return "";
});
function setDatePreset(value: string | number | boolean | undefined): void {
  if (value === "all") form.value.createdRange = null;
  else {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (value === "yesterday") start.setDate(start.getDate() - 1);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    form.value.createdRange = [start, end];
  }
  emit("search");
}
</script>

<template>
  <el-card shadow="never">
    <el-form
      :model="form"
      label-width="76px"
      class="package-search"
      @submit.prevent="emit('search')"
    >
      <el-form-item label="名称">
        <el-input
          v-model="form.name"
          clearable
          maxlength="128"
          placeholder="数据包名称模糊搜索"
          @keyup.enter="emit('search')"
        />
      </el-form-item>
      <el-form-item label="大洲">
        <el-select
          v-model="form.continent"
          clearable
          placeholder="全部大洲"
          @change="emit('search')"
        >
          <el-option
            v-for="item in continentOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务">
        <el-select
          v-model="form.usageBusiness"
          clearable
          placeholder="全部业务"
          @change="emit('search')"
        >
          <el-option label="标准拉群" value="STANDARD_PULL" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" class="date-filter">
        <el-radio-group :model-value="datePreset" @change="setDatePreset">
          <el-radio-button value="all">全部</el-radio-button
          ><el-radio-button value="today">今天</el-radio-button
          ><el-radio-button value="yesterday">昨天</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="form.createdRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[
            new Date(2000, 0, 1),
            new Date(2000, 0, 1, 23, 59, 59, 999)
          ]"
          @change="emit('search')"
        />
      </el-form-item>
      <el-form-item label="主要国家">
        <el-select
          v-model="form.countryIso2"
          filterable
          clearable
          :loading="countryLoading"
          placeholder="搜索国家（中文 / ISO2）"
          @change="emit('search')"
        >
          <el-option
            v-for="item in countries"
            :key="item.iso2"
            :value="item.iso2"
            :label="`${item.nameZh} (${item.iso2})`"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="search-actions">
        <el-button type="primary" :loading="loading" native-type="submit"
          >搜索</el-button
        >
        <el-button :disabled="loading" @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.package-search {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 0 18px;
}

.date-filter {
  grid-column: span 2;
}

.date-filter :deep(.el-form-item__content) {
  gap: 10px;
}

.package-search :deep(.el-select) {
  width: 100%;
}

.search-actions {
  margin-bottom: 0;
}

@media (width <= 1100px) {
  .package-search {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (width <= 700px) {
  .package-search {
    grid-template-columns: 1fr;
  }

  .date-filter {
    grid-column: auto;
  }
}
</style>
