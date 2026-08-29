<script setup lang="ts">
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import QuestionFilled from "~icons/ep/question-filled";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { HyperlinkButton } from "@/api/hyperlink-task";

const buttons = defineModel<HyperlinkButton[]>({ required: true });
defineProps<{ disabled: boolean }>();

function addButton(): void {
  if (buttons.value.length >= 1) return;
  buttons.value = [
    { type: "CTA_URL", displayText: "", url: "", useShortLink: false }
  ];
}

function removeButton(): void {
  buttons.value = [];
}
</script>

<template>
  <div class="button-editor">
    <div v-if="buttons.length === 0" class="empty-button">
      <b>还没有按钮</b>
      <span>点击下方“添加按钮”，最多可添加 1 个</span>
    </div>
    <el-card v-for="button in buttons" :key="button.type" shadow="never">
      <div class="button-header">
        <el-tag type="success" effect="plain">链接跳转</el-tag>
        <el-button
          link
          type="danger"
          :disabled="disabled"
          :icon="useRenderIcon(Delete)"
          @click="removeButton"
        >
          删除
        </el-button>
      </div>
      <el-form-item label="按钮文字" required>
        <el-input
          v-model="button.displayText"
          maxlength="30"
          show-word-limit
          :disabled="disabled"
          placeholder="例如：立即查看"
        />
      </el-form-item>
      <el-form-item label="跳转链接" required>
        <el-input
          v-model="button.url"
          maxlength="2048"
          :disabled="disabled"
          placeholder="https://example.com/promo"
        />
      </el-form-item>
      <div class="tracking-row">
        <div>
          <b>深度追踪</b>
          <el-tooltip
            content="开启后用可追踪短链记录访客号码、设备、地区和访问次数，可在深度归因中查看。"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <el-switch v-model="button.useShortLink" :disabled="disabled" />
      </div>
      <el-alert
        v-if="button.useShortLink"
        type="warning"
        :closable="false"
        title="开启后请关注域名合规与封禁风险。"
      />
    </el-card>
    <el-tooltip
      :disabled="buttons.length < 1"
      content="已达上限 1 个，请先删除已有按钮"
    >
      <el-button
        class="add-button"
        plain
        :icon="useRenderIcon(Plus)"
        :disabled="disabled || buttons.length >= 1"
        @click="addButton"
      >
        添加按钮（{{ buttons.length }}/1）
      </el-button>
    </el-tooltip>
  </div>
</template>

<style scoped>
.button-editor,
.empty-button {
  display: grid;
  gap: 12px;
}

.empty-button {
  place-items: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
}

.empty-button span {
  font-size: 12px;
}

.button-header,
.tracking-row,
.tracking-row > div {
  display: flex;
  align-items: center;
}

.button-header,
.tracking-row {
  justify-content: space-between;
  margin-bottom: 12px;
}

.tracking-row > div {
  gap: 6px;
}

.add-button {
  width: 100%;
}
</style>
