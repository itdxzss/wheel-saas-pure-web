<script setup lang="ts">
import { ref, watch } from "vue";
import type { EditableStep } from "@/views/task/script-marketing/form";
import ScriptMessageEditor from "@/views/task/script-marketing/components/ScriptMessageEditor.vue";
import ScriptMaterialPreview from "@/views/material/script-material/components/ScriptMaterialPreview.vue";
import type { ComposerRole } from "../composables/useScriptComposer";

const step = defineModel<EditableStep>({ required: true });
const props = defineProps<{
  index: number;
  roles: ComposerRole[];
  roleKey?: string;
  inherited: boolean;
  defaultMin: number;
  defaultMax: number;
}>();
const emit = defineEmits<{
  role: [key: string];
  inherit: [enabled: boolean];
}>();
const mode = ref("edit");
watch(
  () => step.value.key,
  () => {
    mode.value = "edit";
  }
);
</script>

<template>
  <section class="composer-pane inspector-pane" aria-label="编辑 / 预览">
    <header class="pane-header">
      <strong>编辑 / 预览</strong><span class="muted">当前选中的一句对话</span>
    </header>
    <div class="pane-scroll inspector-scroll">
      <el-radio-group
        v-model="mode"
        class="inspector-tabs"
        aria-label="消息编辑与预览"
      >
        <el-radio-button value="edit">编辑</el-radio-button
        ><el-radio-button value="preview">预览</el-radio-button>
      </el-radio-group>
      <div class="inspector-heading">
        <strong>第 {{ index + 1 }} 句 · {{ step.roleKey }}</strong>
        <p class="muted">修改后点击底部「保存剧本」统一保存</p>
      </div>
      <div v-show="mode === 'edit'">
        <el-form-item label="发言角色" required>
          <el-select :model-value="roleKey" @change="emit('role', $event)">
            <el-option
              v-for="role in roles"
              :key="role.key"
              :value="role.key"
              :label="role.name"
              ><span>{{ role.name }}</span
              ><span class="role-type">{{
                role.type === "ADMIN" ? "管理员" : "推手"
              }}</span></el-option
            >
          </el-select>
        </el-form-item>
        <ScriptMessageEditor
          :key="step.key"
          v-model="step.message"
          :show-preview="false"
        />
        <div class="wait-settings">
          <strong>发送前随机等待</strong>
          <p class="muted">
            {{
              index === 0
                ? "第一条不等待；调整顺序后按配置的时间等待。"
                : "从上一条提交发送时开始计时，不等待发送回执。"
            }}
          </p>
          <el-checkbox
            :model-value="inherited"
            :disabled="index === 0"
            @change="emit('inherit', Boolean($event))"
            >沿用默认（{{ defaultMin }}–{{ defaultMax }} 秒）</el-checkbox
          >
          <div class="wait-range">
            <el-form-item label="最小值（秒）"
              ><el-input-number
                v-model="step.waitMinSeconds"
                :min="0"
                :max="86400"
                :precision="0"
                :disabled="index === 0 || inherited"
                controls-position="right"
            /></el-form-item>
            <el-form-item label="最大值（秒）"
              ><el-input-number
                v-model="step.waitMaxSeconds"
                :min="step.waitMinSeconds || 0"
                :max="86400"
                :precision="0"
                :disabled="index === 0 || inherited"
                controls-position="right"
            /></el-form-item>
          </div>
        </div>
      </div>
      <ScriptMaterialPreview
        v-if="mode === 'preview'"
        :message="step.message"
      />
    </div>
  </section>
</template>

<style scoped>
.inspector-tabs {
  display: flex;
  width: 100%;
  margin-bottom: 18px;
}

.inspector-tabs :deep(.el-radio-button) {
  flex: 1;
}

.inspector-tabs :deep(.el-radio-button__inner) {
  width: 100%;
}

.inspector-heading {
  margin-bottom: 18px;
}

.inspector-heading p,
.wait-settings p {
  margin-top: 6px;
  line-height: 1.6;
}

.wait-settings {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.wait-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.wait-range .el-form-item {
  min-width: 0;
  margin-bottom: 0;
}

.wait-range .el-input-number {
  width: 100%;
}

.role-type {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
