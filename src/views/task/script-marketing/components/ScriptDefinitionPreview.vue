<script setup lang="ts">
import { computed } from "vue";
import type { ScriptStep } from "@/api/script-marketing";
import { estimatedWait, nextEditorKey } from "../form";
import ScriptMaterialPreview from "@/views/material/script-material/components/ScriptMaterialPreview.vue";

const props = defineProps<{
  steps: ScriptStep[];
  name?: string;
  loading?: boolean;
}>();
const roleCount = computed(
  () => new Set(props.steps.map(step => step.roleKey || step.role)).size
);
const promoterCount = computed(
  () =>
    new Set(
      props.steps
        .filter(step => step.role === "PROMOTER")
        .map(step => step.roleKey)
    ).size
);
const wait = computed(() => estimatedWait(props.steps));
const messageKeys = new WeakMap<object, string>();
function messageKey(step: object): string {
  if (!messageKeys.has(step)) messageKeys.set(step, nextEditorKey());
  return messageKeys.get(step)!;
}
</script>

<template>
  <section
    v-loading="loading"
    aria-label="剧本预览"
    class="script-definition-preview"
  >
    <el-divider content-position="left">剧本预览</el-divider>
    <el-empty
      v-if="!steps.length"
      description="请先选择剧本"
      :image-size="64"
    />
    <template v-else>
      <strong>{{ name }}</strong>
      <div class="definition-summary">
        <el-tag size="small" effect="plain">{{ roleCount }} 个角色</el-tag>
        <el-tag size="small" effect="plain">{{ steps.length }} 条消息</el-tag>
        <el-tag size="small" effect="plain"
          >预计等待 {{ wait[0] }}–{{ wait[1] }} 秒</el-tag
        >
      </div>
      <p class="preview-note">
        每群分配 1 个在控管理员和
        {{ promoterCount }} 个推手。同群管理员发言共用一个账号，启动后固定身份。
      </p>
      <p class="preview-note">
        按发送顺序展示完整对话。第一条不等待，后续等待从上一条提交发送时开始计算。
        预计等待不含发送、排队和异常耗时。
      </p>
      <div class="conversation" aria-label="剧本完整对话">
        <article
          v-for="(step, index) in steps"
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
      </div>
    </template>
  </section>
</template>

<style scoped>
.definition-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

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
