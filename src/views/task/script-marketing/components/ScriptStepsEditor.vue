<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ScriptAccountOption, ScriptStep } from "@/api/script-marketing";
import {
  copyStep,
  estimatedWait,
  mayRemove,
  newStep,
  type EditableStep
} from "../form";
import ScriptMessageEditor from "./ScriptMessageEditor.vue";
const steps = defineModel<EditableStep[]>({ required: true });
const props = withDefaults(
  defineProps<{
    accounts?: ScriptAccountOption[];
    loading?: boolean;
    defaultWait?: number;
    requireAccounts?: boolean;
  }>(),
  { accounts: () => [], defaultWait: 10, requireAccounts: true }
);
const emit = defineEmits<{ searchAccounts: [keyword: string] }>();
const activeStep = ref(steps.value[0]?.key || "");
watch(
  () => steps.value,
  () => {
    if (!steps.value.some(step => step.key === activeStep.value))
      activeStep.value = steps.value[0]?.key || "";
  }
);
const promoterCount = computed(
  () =>
    new Set(
      steps.value
        .filter(step => step.role === "PROMOTER")
        .map(step => step.roleKey)
    ).size
);
const estimate = computed(() => estimatedWait(steps.value));
function move(index: number, offset: number) {
  const target = index + offset;
  [steps.value[index], steps.value[target]] = [
    steps.value[target],
    steps.value[index]
  ];
}
function roleOptions(role: ScriptStep["role"]) {
  return [
    ...new Set(
      steps.value
        .filter(step => step.role === role && step.roleKey)
        .map(step => step.roleKey!)
    )
  ];
}
function changeType(step: ScriptStep) {
  step.accountId = null;
  step.roleKey = "";
}
function changeRole(step: ScriptStep) {
  const existing = steps.value.find(
    value =>
      value !== step &&
      value.roleKey === step.roleKey &&
      value.role === step.role
  );
  if (existing) step.accountId = existing.accountId;
}
function bindAdmin(step: ScriptStep) {
  steps.value
    .filter(value => value.roleKey === step.roleKey)
    .forEach(value => {
      value.accountId = step.accountId;
    });
}
function add() {
  const step = newStep();
  step.waitMinSeconds = props.defaultWait;
  step.waitMaxSeconds = props.defaultWait;
  steps.value.push(step);
  activeStep.value = step.key;
}
</script>

<template>
  <el-divider content-position="left">剧本发送顺序</el-divider>
  <p>
    共 {{ steps.length }} 条消息、{{ promoterCount }} 个推手角色。 预计每群等待
    {{ estimate[0] }}–{{ estimate[1] }} 秒（不含发送、排队和异常耗时）。
  </p>
  <el-collapse v-model="activeStep" accordion>
    <el-collapse-item
      v-for="(step, index) in steps"
      :key="step.key"
      :name="step.key"
    >
      <template #title
        ><strong
          >第 {{ index + 1 }} 项 · {{ step.roleKey || "请选择角色" }} ·
          {{ step.message.content || "图片 / 待填写内容" }}</strong
        ></template
      >
      <el-form-item label="顺序操作">
        <el-button :disabled="index === 0" @click="move(index, -1)"
          >上移</el-button
        >
        <el-button
          :disabled="index === steps.length - 1"
          @click="move(index, 1)"
          >下移</el-button
        >
        <el-button
          :disabled="steps.length >= 100"
          @click="steps.splice(index + 1, 0, copyStep(step))"
          >复制此项</el-button
        >
        <el-button
          link
          type="danger"
          :disabled="!mayRemove(steps, index)"
          @click="steps.splice(index, 1)"
          >删除</el-button
        >
      </el-form-item>
      <el-form-item label="发送身份" required>
        <el-radio-group v-model="step.role" @change="changeType(step)">
          <el-radio-button value="ADMIN">管理员</el-radio-button
          ><el-radio-button value="PROMOTER">推手</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="角色名称" required>
        <el-select
          v-model="step.roleKey"
          filterable
          allow-create
          default-first-option
          placeholder="选择已有角色，或输入新角色名称"
          @change="changeRole(step)"
        >
          <el-option
            v-for="name in roleOptions(step.role)"
            :key="name"
            :value="name"
            :label="name"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="step.role === 'ADMIN' && requireAccounts"
        label="管理员账号"
        required
      >
        <el-select
          v-model="step.accountId"
          filterable
          remote
          :remote-method="keyword => emit('searchAccounts', keyword)"
          :loading="loading"
          placeholder="搜索号码并选择管理员"
          @change="bindAdmin(step)"
        >
          <el-option
            v-for="account in accounts"
            :key="account.id"
            :value="account.id"
            :label="`${account.wsPhone} · #${account.id}`"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-else-if="step.role === 'PROMOTER'" label="推手账号">
        <el-text type="info"
          >启动时从本群内可用的分组账号中随机分配；同名角色始终使用同一账号。</el-text
        >
      </el-form-item>
      <el-form-item label="本条等待" required>
        <el-space wrap>
          <el-input-number
            v-model="step.waitMinSeconds"
            :min="0"
            :max="86400"
            :disabled="index === 0"
          />
          <span>至</span>
          <el-input-number
            v-model="step.waitMaxSeconds"
            :min="step.waitMinSeconds || 0"
            :max="86400"
            :disabled="index === 0"
          />
          <span>秒</span>
        </el-space>
        <el-text type="info">{{
          index === 0
            ? "第一条不等待"
            : "从上一条提交发送时开始计时，不等待发送回执"
        }}</el-text>
      </el-form-item>
      <ScriptMessageEditor v-model="step.message" />
    </el-collapse-item>
  </el-collapse>
  <el-button class="add-step" :disabled="steps.length >= 100" @click="add"
    >添加发送项</el-button
  >
</template>

<style scoped>
.add-step {
  width: 100%;
  margin: 16px 0;
}

p {
  margin-bottom: 12px;
}
</style>
