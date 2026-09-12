<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Rank } from "@element-plus/icons-vue";
import {
  mayRemove,
  type EditableStep
} from "@/views/task/script-marketing/form";
import type { ComposerRole } from "../composables/useScriptComposer";
import ScriptReplyQuote from "@/views/task/script-marketing/components/ScriptReplyQuote.vue";

const props = defineProps<{
  steps: EditableStep[];
  roles: ComposerRole[];
  counts: Record<string, number>;
  activeKey: string;
}>();
const emit = defineEmits<{
  select: [key: string];
  add: [];
  move: [from: number, to: number];
  duplicate: [index: number];
  insert: [index: number];
  remove: [index: number];
}>();
const list = ref<HTMLElement>();
const dragging = ref("");
const dropTarget = ref("");
watch(
  () => [props.activeKey, props.steps.map(step => step.key).join(",")],
  async () => {
    await nextTick();
    const card = list.value?.querySelector<HTMLElement>(
      `[data-step-key="${props.activeKey}"]`
    );
    if (card && list.value) {
      const top = card.offsetTop;
      if (
        top < list.value.scrollTop ||
        top + card.offsetHeight > list.value.scrollTop + list.value.clientHeight
      )
        list.value.scrollTop = top;
    }
  }
);
function startDrag(event: DragEvent, key: string) {
  dragging.value = key;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }
}
function drop(index: number) {
  emit(
    "move",
    props.steps.findIndex(step => step.key === dragging.value),
    index
  );
  dragging.value = "";
  dropTarget.value = "";
}
function summary(step: EditableStep) {
  return (
    [step.message.content, step.message.bodyText, step.message.promotionLink]
      .filter(Boolean)
      .join(" · ") ||
    (step.message.imageFileId ? "纯图片消息" : "尚未填写消息内容")
  );
}
const types = { 1: "文字 / 链接", 2: "按钮消息", 3: "图片 / 图文" };
</script>

<template>
  <section class="composer-pane timeline-pane" aria-label="整体剧本">
    <header class="pane-header">
      <strong>整体剧本 · 共 {{ steps.length }} 句</strong>
      <el-button
        type="primary"
        size="small"
        :disabled="steps.length >= 100 || !roles.length"
        @click="emit('add')"
        >+ 对话</el-button
      >
    </header>
    <div class="role-distribution">
      <el-tag v-for="role in roles" :key="role.key" size="small" effect="plain"
        >{{ role.name }} · {{ counts[role.key] || 0 }} 句</el-tag
      >
    </div>
    <div ref="list" class="pane-scroll timeline-list">
      <article
        v-for="(step, index) in steps"
        :key="step.key"
        :data-step-key="step.key"
        class="message-card"
        :class="{
          'is-selected': step.key === activeKey,
          'is-drop-target': dropTarget === step.key && dragging !== step.key
        }"
        @dragover.prevent="dragging && (dropTarget = step.key)"
        @drop.prevent="drop(index)"
      >
        <button
          type="button"
          class="message-summary"
          :aria-label="`编辑第 ${index + 1} 条消息`"
          :aria-pressed="step.key === activeKey"
          @click="emit('select', step.key)"
        >
          <span class="message-heading"
            ><span class="muted">第 {{ index + 1 }} 句</span
            ><el-tag
              size="small"
              :type="step.role === 'ADMIN' ? 'warning' : 'primary'"
              >{{ step.roleKey || "未命名角色" }}</el-tag
            ></span
          >
          <span class="message-excerpt">{{ summary(step) }}</span>
          <span class="message-meta"
            ><span>{{ types[step.message.linkMode] }}</span
            ><span>{{
              index === 0
                ? "首条不等待"
                : `等待 ${step.waitMinSeconds ?? 0}–${step.waitMaxSeconds ?? 0} 秒`
            }}</span
            ><span v-if="step.message.mentionAll">@所有人</span></span
          >
        </button>
        <ScriptReplyQuote
          :step="step"
          :steps="steps"
          clickable
          @locate="
            id =>
              emit(
                'select',
                steps.find(item => item.stepId === id)?.key || activeKey
              )
          "
        />
        <div class="message-actions">
          <span
            class="drag-handle"
            draggable="true"
            title="拖动调整发送顺序"
            @dragstart="startDrag($event, step.key)"
            @dragend="
              dragging = '';
              dropTarget = '';
            "
            ><el-icon><Rank /></el-icon>拖动</span
          >
          <el-button
            size="small"
            :disabled="index === 0"
            :aria-label="`上移第 ${index + 1} 条消息`"
            @click="emit('move', index, index - 1)"
            >上移</el-button
          >
          <el-button
            size="small"
            :disabled="index === steps.length - 1"
            :aria-label="`下移第 ${index + 1} 条消息`"
            @click="emit('move', index, index + 1)"
            >下移</el-button
          >
          <el-button
            size="small"
            :disabled="steps.length >= 100"
            @click="emit('duplicate', index)"
            >复制</el-button
          >
          <el-button
            size="small"
            :disabled="steps.length >= 100"
            @click="emit('insert', index)"
            >插入</el-button
          >
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!mayRemove(steps, index)"
            title="被引用的消息不能删除，且须保留管理员和推手消息"
            @click="emit('remove', index)"
            >删除</el-button
          >
        </div>
      </article>
      <el-empty
        v-if="!steps.length"
        description="从左侧选择角色添加消息"
        :image-size="70"
      />
    </div>
  </section>
</template>

<style scoped>
.role-distribution {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 82px;
  padding: 10px 12px;
  overflow: auto;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.timeline-list {
  position: relative;
}

.message-card {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.message-card.is-selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.message-card.is-drop-target {
  border-top: 3px solid var(--el-color-primary);
}

.message-summary {
  display: block;
  width: 100%;
  padding: 14px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.message-summary:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.message-heading,
.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.message-excerpt {
  display: -webkit-box;
  margin: 14px 0;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
}

.message-meta,
.drag-handle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  padding: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.message-actions .el-button {
  padding-right: 7px;
  padding-left: 7px;
  margin-left: 0;
}

.drag-handle {
  display: flex;
  gap: 3px;
  align-items: center;
  margin-right: auto;
  cursor: grab;
}
</style>
