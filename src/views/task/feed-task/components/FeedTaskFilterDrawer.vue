<script setup lang="ts">
import { reactive, watch } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { FeedTaskAccountFilter } from "@/api/feed-task";
import {
  feedTaskAccountStateOptions,
  feedTaskAccountTypeOptions,
  feedTaskLoginStateOptions,
  feedTaskSourceOptions
} from "../constants";

defineOptions({ name: "FeedTaskFilterDrawer" });

const props = defineProps<{
  modelValue: boolean;
  filter: FeedTaskAccountFilter;
  accountGroups: AccountGroupApiRow[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "apply", value: FeedTaskAccountFilter): void;
}>();

const draft = reactive<FeedTaskAccountFilter>({});

function copyFilter(value: FeedTaskAccountFilter): void {
  Object.keys(draft).forEach(key => {
    delete draft[key as keyof FeedTaskAccountFilter];
  });
  Object.assign(draft, value);
}

function apply(): void {
  emit("apply", { ...draft });
  emit("update:modelValue", false);
}

function reset(): void {
  copyFilter({});
}

watch(
  () => props.modelValue,
  visible => {
    if (visible) copyFilter(props.filter);
  },
  { immediate: true }
);
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="设置发送账号筛选条件"
    size="620px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert
      title="任务只会使用符合条件的有效账号；预发布任务运行期间，新符合条件的账号会自动加入。"
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
    />

    <el-form label-position="top">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="账号关键词">
            <el-input v-model="draft.keyword" clearable placeholder="账号或备注关键词" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号包含">
            <el-input v-model="draft.phone" clearable placeholder="输入手机号片段" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账号分组">
            <el-select v-model="draft.accountGroupId" clearable filterable class="w-full" placeholder="全部分组">
              <el-option
                v-for="group in accountGroups"
                :key="group.id"
                :label="`${group.name}（${group.totalAccounts}）`"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账号类型">
            <el-select v-model="draft.accountType" clearable class="w-full" placeholder="全部类型">
              <el-option v-for="item in feedTaskAccountTypeOptions" :key="item.value" v-bind="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账号状态">
            <el-select v-model="draft.accountState" clearable class="w-full" placeholder="全部状态">
              <el-option v-for="item in feedTaskAccountStateOptions" :key="item.value" v-bind="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录状态">
            <el-select v-model="draft.loginState" clearable class="w-full" placeholder="全部状态">
              <el-option v-for="item in feedTaskLoginStateOptions" :key="item.value" v-bind="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="协议 ID">
            <el-input v-model="draft.protocolId" clearable placeholder="协议编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="渠道名称">
            <el-input v-model="draft.channelName" clearable placeholder="渠道名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="号码来源">
            <el-select v-model="draft.numberSource" clearable class="w-full" placeholder="全部来源">
              <el-option v-for="item in feedTaskSourceOptions" :key="item.value" v-bind="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="国家 / 地区">
            <el-input v-model="draft.country" clearable placeholder="国家名称或代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="可发送账号">
            <el-select v-model="draft.callable" clearable class="w-full" placeholder="不限">
              <el-option label="可发送" :value="true" />
              <el-option label="不可发送" :value="false" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="reset">清空</el-button>
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" @click="apply">应用筛选</el-button>
      </div>
    </template>
  </el-drawer>
</template>
