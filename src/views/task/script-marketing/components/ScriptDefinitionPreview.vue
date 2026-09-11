<script setup lang="ts">
import type { ScriptDefinition } from "@/api/script-library";
import { nextEditorKey } from "../form";
import ScriptMaterialPreview from "@/views/material/script-material/components/ScriptMaterialPreview.vue";

const visible = defineModel<boolean>({ required: true });
defineProps<{ definition: ScriptDefinition }>();
const messageKeys = new WeakMap<object, string>();
function messageKey(step: object): string {
  if (!messageKeys.has(step)) messageKeys.set(step, nextEditorKey());
  return messageKeys.get(step)!;
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`剧本预览 · ${definition.name}`"
    width="min(800px, 94vw)"
    top="6vh"
    append-to-body
    destroy-on-close
    class="script-definition-preview"
  >
    <p class="preview-note">
      按发送顺序展示完整对话。第一条不等待，后续等待从上一条提交发送时开始计算。
    </p>
    <div class="conversation" aria-label="剧本完整对话">
      <article
        v-for="(step, index) in definition.steps"
        :key="messageKey(step)"
        class="conversation-message"
        :class="{ 'is-promoter': step.role === 'PROMOTER' }"
      >
        <div class="message-heading">
          <span class="message-number">第 {{ index + 1 }} 句</span>
          <el-tag
            size="small"
            :type="step.role === 'ADMIN' ? 'warning' : 'primary'"
            >{{
              step.roleKey || (step.role === "ADMIN" ? "管理员" : "推手")
            }}</el-tag
          >
          <span class="message-wait">{{
            index === 0
              ? "首条不等待"
              : `等待 ${step.waitMinSeconds ?? 0}–${step.waitMaxSeconds ?? 0} 秒`
          }}</span>
        </div>
        <ScriptMaterialPreview :message="step.message" />
      </article>
      <el-empty v-if="!definition.steps.length" description="该剧本暂无消息" />
    </div>
    <template #footer
      ><el-button @click="visible = false">关闭</el-button></template
    >
  </el-dialog>
</template>

<style scoped>
.preview-note {
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.conversation {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 65vh;
  padding: 18px;
  overflow: auto;
  overscroll-behavior: contain;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.conversation-message {
  flex: 0 0 auto;
  width: 88%;
  min-width: 0;
}

.conversation-message.is-promoter {
  align-self: flex-end;
}

.message-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.message-number,
.message-wait {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.is-promoter :deep(.message-preview) {
  background: var(--el-color-primary-light-9);
}

@media (width <= 600px) {
  .conversation {
    padding: 12px;
  }

  .conversation-message {
    width: 96%;
  }
}
</style>
