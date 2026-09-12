<script setup lang="ts">
import type { ScriptMessage } from "@/api/script-marketing";
import ResourceAssetThumbnail from "@/views/hyperlink/library/components/ResourceAssetThumbnail.vue";

withDefaults(defineProps<{ message: ScriptMessage; compact?: boolean }>(), {
  compact: false
});

const buttonTypes = {
  LINK_JUMP: "跳转链接",
  COPY_CONTENT: "复制内容",
  QUICK_REPLY: "快捷回复"
};
const buttonKeys = new WeakMap<object, number>();
let nextButtonKey = 0;
function buttonKey(button: object): number {
  if (!buttonKeys.has(button)) buttonKeys.set(button, ++nextButtonKey);
  return buttonKeys.get(button)!;
}
</script>

<template>
  <div class="message-preview" :class="{ 'is-compact': compact }">
    <div v-if="message.imageFileId" class="message-image">
      <ResourceAssetThumbnail
        scope="SCRIPT"
        :asset-id="message.imageFileId"
        :alt="message.templateName || '消息图片'"
        fit="contain"
        :preview="!compact"
      />
    </div>
    <div class="message-copy">
      <el-tag
        v-if="message.mentionAll"
        size="small"
        type="success"
        effect="plain"
      >
        @所有人
      </el-tag>
      <p
        v-if="compact && (message.content || message.bodyText)"
        class="message-content"
      >
        {{ [message.content, message.bodyText].filter(Boolean).join("\n") }}
      </p>
      <template v-else>
        <p v-if="message.content" class="message-content">
          {{ message.content }}
        </p>
        <p v-if="message.bodyText" class="message-body">
          {{ message.bodyText }}
        </p>
      </template>
      <p
        v-if="message.linkMode !== 2 && message.promotionLink"
        class="message-link"
      >
        {{ message.promotionLink }}
      </p>
      <p
        v-if="!message.content && !message.bodyText && !message.promotionLink"
        class="message-empty"
      >
        {{ message.imageFileId ? "纯图片消息" : "暂无消息内容" }}
      </p>
    </div>
    <div
      v-if="message.linkMode === 2 && message.buttons.length"
      class="message-buttons"
    >
      <div
        v-for="button in message.buttons"
        :key="buttonKey(button)"
        class="message-button"
      >
        <span>{{ button.text || "未填写按钮文字" }}</span>
        <template v-if="!compact">
          <small>{{ buttonTypes[button.type] }}</small>
          <p v-if="button.type !== 'QUICK_REPLY' && button.param">
            {{ button.param }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-preview {
  overflow: hidden;
  font-size: 14px;
  line-height: 1.65;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.message-image {
  height: 300px;
}

.message-copy {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.message-copy .el-tag {
  justify-self: start;
}

.message-preview p {
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-body,
.message-empty {
  color: var(--el-text-color-secondary);
}

.message-link {
  color: var(--el-color-primary);
}

.message-button {
  padding: 9px 16px;
  color: var(--el-color-primary);
  text-align: center;
  overflow-wrap: anywhere;
  border-top: 1px solid var(--el-border-color-lighter);
}

.message-button small {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-button p {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.is-compact {
  display: flex;
  flex-direction: column;
  height: 300px;
  border: 0;
  border-radius: 0;
}

.is-compact .message-image {
  flex: 0 0 140px;
  height: 140px;
}

.is-compact .message-copy {
  display: block;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  overflow: hidden;
}

.is-compact .message-copy p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
}

.is-compact:has(.message-image) .message-copy p {
  -webkit-line-clamp: 2;
}

.is-compact:has(.message-buttons) .message-image {
  flex-basis: 110px;
  height: 110px;
}

.is-compact:has(.message-image):has(.message-buttons) .message-copy p {
  -webkit-line-clamp: 1;
}

.is-compact .message-buttons {
  flex: 0 0 auto;
}

.is-compact .message-button {
  padding: 6px 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
