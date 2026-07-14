<script setup lang="ts">
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { type FormItemRule } from "element-plus";
import {
  validateMarketingButtonLink,
  type MarketingButtonType,
  type MarketingTemplateButton
} from "../composables/useMarketingTemplatePage";

const buttons = defineModel<MarketingTemplateButton[]>({ required: true });

defineProps<{
  disabled: boolean;
}>();

const linkValueRules: FormItemRule[] = [
  {
    validator: (_rule, value: unknown, callback) => {
      const message = validateMarketingButtonLink(
        typeof value === "string" ? value : ""
      );
      callback(message ? new Error(message) : undefined);
    },
    trigger: ["blur", "change"]
  }
];

let nextEditorButtonId = 10000;

const buttonDefaults: Record<
  MarketingButtonType,
  { label: string; value: string }
> = {
  link: { label: "立即抢购", value: "" },
  copy: { label: "复制优惠码", value: "VIP88" },
  quick: { label: "我要参加", value: "" }
};

function buttonActionText(type: MarketingButtonType) {
  if (type === "link") return "点击后在浏览器打开 URL";
  if (type === "copy") return "点击后复制到剪贴板";
  return "点击后自动回复给发送方";
}

function addButton() {
  if (buttons.value.length >= 3) return;
  const defaults = buttonDefaults.quick;
  buttons.value.push({
    id: nextEditorButtonId,
    type: "quick",
    label: defaults.label,
    value: defaults.value
  });
  nextEditorButtonId += 1;
}

function removeButton(id: number) {
  if (buttons.value.length <= 1) return;
  buttons.value = buttons.value.filter(button => button.id !== id);
}

function onButtonTypeChange(button: MarketingTemplateButton) {
  const defaults = buttonDefaults[button.type];
  if (!button.label) button.label = defaults.label;
  if (button.type === "link" || button.type === "quick") {
    button.value = "";
    return;
  }
  button.value = button.value || defaults.value;
}
</script>

<template>
  <el-card shadow="never" class="button-editor">
    <template #header>
      <div class="button-editor-header">
        <div>
          <div class="button-editor-title">消息按钮</div>
          <div class="button-editor-sub">
            最多 3 个；按钮设置需与 WhatsApp 接收态保持一致。
          </div>
        </div>
        <el-button
          :disabled="disabled || buttons.length >= 3"
          :icon="useRenderIcon(Plus)"
          @click="addButton"
        >
          {{ buttons.length >= 3 ? "已达到最多 3 个按钮" : "添加按钮" }}
        </el-button>
      </div>
    </template>

    <el-alert
      v-if="buttons.length === 0"
      class="button-empty-alert"
      type="warning"
      show-icon
      :closable="false"
      title="按钮超链至少需要 1 个按钮，请添加按钮后再保存。"
    />

    <div class="button-list">
      <el-card
        v-for="(button, index) in buttons"
        :key="button.id"
        shadow="never"
        class="button-item"
      >
        <div class="button-item-header">
          <el-tag effect="plain">按钮 {{ buttons.indexOf(button) + 1 }}</el-tag>
          <el-button
            link
            type="danger"
            :disabled="disabled || buttons.length <= 1"
            :icon="useRenderIcon(Delete)"
            @click="removeButton(button.id)"
          >
            删除
          </el-button>
        </div>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="按钮类型">
              <el-select
                v-model="button.type"
                :disabled="disabled"
                @change="onButtonTypeChange(button)"
              >
                <el-option label="链接跳转" value="link" />
                <el-option label="复制内容" value="copy" />
                <el-option label="快捷回复" value="quick" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="动作说明">
              <el-input :model-value="buttonActionText(button.type)" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="按钮文字">
          <el-input
            v-model="button.label"
            maxlength="100"
            show-word-limit
            clearable
            :disabled="disabled"
            placeholder="例如：立即咨询"
          />
        </el-form-item>

        <el-form-item
          v-if="button.type === 'link'"
          label="跳转链接"
          :prop="`buttons.${index}.value`"
          :rules="linkValueRules"
        >
          <el-input
            v-model="button.value"
            clearable
            :disabled="disabled"
            placeholder="请输入跳转链接"
          />
        </el-form-item>
        <el-form-item v-else-if="button.type === 'copy'" label="复制内容">
          <el-input
            v-model="button.value"
            clearable
            :disabled="disabled"
            placeholder="请输入复制内容"
          />
        </el-form-item>
        <el-form-item v-else label="说明">
          <el-alert
            type="info"
            show-icon
            :closable="false"
            title="快捷回复无需额外参数，对方点击会自动回复该按钮文字。"
          />
        </el-form-item>
      </el-card>
    </div>
  </el-card>
</template>

<style scoped>
.button-editor {
  border-radius: 4px;
}

.button-editor-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.button-editor-title {
  font-weight: 600;
}

.button-editor-sub {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.button-list {
  display: grid;
  gap: 12px;
}

.button-empty-alert {
  margin-bottom: 12px;
}

.button-item {
  border-radius: 4px;
}

.button-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
