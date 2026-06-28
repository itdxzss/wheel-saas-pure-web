<script setup lang="ts">
import type { MarketingTaskRow } from "@/api/marketing-task";
import type {
  MarketingTemplateButton,
  MarketingTemplateWrite
} from "@/api/marketing-template";

defineOptions({
  name: "GroupMarketingMaterialDrawer"
});

defineProps<{
  task: MarketingTaskRow | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<MarketingTemplateWrite>("form", { required: true });

function addButton(): void {
  form.value.buttons.push({ type: "link", label: "", value: "" });
}

function removeButton(index: number): void {
  form.value.buttons.splice(index, 1);
}

function onModeChange(): void {
  if (form.value.linkMode === 1) {
    form.value.buttons = [];
    return;
  }
  if (form.value.buttons.length === 0) addButton();
}

function buttonValuePlaceholder(button: MarketingTemplateButton): string {
  if (button.type === "copy") return "请输入复制内容";
  if (button.type === "quick") return "快捷回复无需参数";
  return "请输入跳转链接";
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="640px"
    destroy-on-close
    title="修改营销素材"
  >
    <el-alert
      v-if="task"
      type="info"
      :closable="false"
      show-icon
      :title="`正在编辑任务「${task.taskName}」引用的共享营销模板`"
    />

    <el-form :model="form" label-width="100px" class="material-form">
      <el-form-item label="模板名称" required>
        <el-input v-model="form.templateName" clearable />
      </el-form-item>
      <el-form-item label="超链模式">
        <el-select
          v-model="form.linkMode"
          class="form-control"
          @change="onModeChange"
        >
          <el-option label="普通超链" :value="1" />
          <el-option label="按钮超链" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="3"
          placeholder="请输入标题 / 核心卖点"
        />
      </el-form-item>
      <el-form-item label="正文" required>
        <el-input
          v-model="form.bodyText"
          type="textarea"
          :rows="4"
          placeholder="请输入正文"
        />
      </el-form-item>
      <el-form-item label="推广链接">
        <el-input v-model="form.promotionLink" clearable />
      </el-form-item>
      <el-form-item v-if="form.linkMode === 2" label="按钮设置">
        <div class="button-editor">
          <div
            v-for="(button, index) in form.buttons"
            :key="index"
            class="button-row"
          >
            <el-select v-model="button.type" class="button-type">
              <el-option label="链接" value="link" />
              <el-option label="复制" value="copy" />
              <el-option label="快捷回复" value="quick" />
            </el-select>
            <el-input v-model="button.label" placeholder="按钮文字" />
            <el-input
              v-model="button.value"
              :disabled="button.type === 'quick'"
              :placeholder="buttonValuePlaceholder(button)"
            />
            <el-button
              link
              type="danger"
              :disabled="form.buttons.length <= 1"
              @click="removeButton(index)"
            >
              删除
            </el-button>
          </div>
          <el-button
            plain
            :disabled="form.buttons.length >= 3"
            @click="addButton"
          >
            添加按钮
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="emit('submit')">
        确认修改
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.material-form {
  padding-right: 12px;
  margin-top: 16px;
}

.form-control,
.button-editor {
  width: 100%;
}

.button-editor {
  display: grid;
  gap: 10px;
}

.button-row {
  display: grid;
  grid-template-columns: 110px 1fr 1fr 48px;
  gap: 8px;
  align-items: center;
}

.button-type {
  width: 110px;
}
</style>
