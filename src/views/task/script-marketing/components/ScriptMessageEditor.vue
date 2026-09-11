<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { ScriptMessage } from "@/api/script-marketing";
import { listScriptMaterials, type ScriptMaterial } from "@/api/script-library";
import type { ResourceAsset } from "@/api/resource-asset";
import { apiErrorMessage } from "@/utils/api-error";
import ResourceAssetPicker from "@/views/hyperlink/library/components/ResourceAssetPicker.vue";
import ScriptMaterialPreview from "@/views/material/script-material/components/ScriptMaterialPreview.vue";
import { nextEditorKey } from "../form";

const model = defineModel<ScriptMessage>({ required: true });
withDefaults(
  defineProps<{ showTemplatePicker?: boolean; showPreview?: boolean }>(),
  {
    showTemplatePicker: true,
    showPreview: true
  }
);
const templates = ref<ScriptMaterial[]>([]);
const templateId = ref<number>();
const assetOpen = ref(false);
const asset = ref<ResourceAsset | null>(null);
const templateLoading = ref(false);
const buttonKeys = new WeakMap<object, string>();
function buttonKey(button: object) {
  if (!buttonKeys.has(button)) buttonKeys.set(button, nextEditorKey());
  return buttonKeys.get(button)!;
}
async function searchTemplates(keyword = "") {
  templateLoading.value = true;
  try {
    templates.value = (
      await listScriptMaterials({ keyword, page: 1, pageSize: 50 })
    ).list;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "模板读取失败"));
  } finally {
    templateLoading.value = false;
  }
}
function applyTemplate(id: number) {
  const value = templates.value.find(row => row.id === id);
  if (!value) return;
  model.value = {
    templateName: "",
    linkMode: value.linkMode,
    content: value.content,
    bodyText: value.bodyText || "",
    imageFileId: value.imageFileId ?? null,
    promotionLink: value.promotionLink || "",
    mentionAll: value.mentionAll,
    buttons: value.buttons.map(button => ({ ...button }))
  };
  asset.value = null;
}
function selectAsset(value: ResourceAsset) {
  model.value.imageFileId = value.id;
  asset.value = value;
  assetOpen.value = false;
}
function changeMode() {
  if (model.value.linkMode === 2 && !model.value.buttons.length)
    model.value.buttons.push({ type: "LINK_JUMP", text: "", param: "" });
}
</script>

<template>
  <el-form-item v-if="showTemplatePicker" label="复用素材">
    <el-select
      v-model="templateId"
      clearable
      filterable
      remote
      :remote-method="searchTemplates"
      :loading="templateLoading"
      placeholder="可选：搜索消息素材并复制内容"
      @visible-change="open => open && searchTemplates()"
      @change="applyTemplate"
    >
      <el-option
        v-for="item in templates"
        :key="item.id"
        :label="item.templateName"
        :value="item.id"
      />
    </el-select>
  </el-form-item>
  <el-form-item label="消息类型">
    <el-radio-group v-model="model.linkMode" @change="changeMode">
      <el-radio-button :value="1">文字 / 链接</el-radio-button>
      <el-radio-button :value="3">图片 / 图文</el-radio-button>
      <el-radio-button :value="2">按钮消息</el-radio-button>
    </el-radio-group>
  </el-form-item>
  <el-form-item
    label="消息内容"
    :required="!(model.linkMode === 3 && model.imageFileId)"
  >
    <el-input
      v-model="model.content"
      type="textarea"
      :rows="3"
      maxlength="10000"
      show-word-limit
      placeholder="业务人员填写本项消息"
    />
  </el-form-item>
  <el-form-item label="补充正文">
    <el-input
      v-model="model.bodyText"
      type="textarea"
      :rows="2"
      maxlength="10000"
    />
  </el-form-item>
  <el-form-item v-if="model.linkMode !== 2" label="推广链接">
    <el-input v-model="model.promotionLink" placeholder="选填，https://…" />
  </el-form-item>
  <el-form-item label="图片素材">
    <el-space wrap>
      <el-button @click="assetOpen = true">选择 / 上传图片</el-button>
      <span v-if="model.imageFileId">{{
        asset?.assetName || `素材 #${model.imageFileId}`
      }}</span>
      <el-button
        v-if="model.imageFileId"
        link
        @click="
          model.imageFileId = null;
          asset = null;
        "
        >移除</el-button
      >
    </el-space>
  </el-form-item>
  <template v-if="model.linkMode === 2">
    <el-form-item
      v-for="button in model.buttons"
      :key="buttonKey(button)"
      label="按钮"
    >
      <el-space wrap>
        <el-select v-model="button.type" style="width: 120px">
          <el-option label="跳转链接" value="LINK_JUMP" /><el-option
            label="复制内容"
            value="COPY_CONTENT"
          /><el-option label="快捷回复" value="QUICK_REPLY" />
        </el-select>
        <el-input
          v-model="button.text"
          placeholder="按钮文字"
          style="width: 130px"
        />
        <el-input
          v-if="button.type !== 'QUICK_REPLY'"
          v-model="button.param"
          placeholder="链接或复制内容"
          style="width: 210px"
        />
        <el-button
          link
          :disabled="model.buttons.length === 1"
          @click="model.buttons.splice(model.buttons.indexOf(button), 1)"
          >移除</el-button
        >
      </el-space>
    </el-form-item>
    <el-form-item
      ><el-button
        :disabled="model.buttons.length >= 3"
        @click="model.buttons.push({ type: 'LINK_JUMP', text: '', param: '' })"
        >添加按钮</el-button
      ></el-form-item
    >
  </template>
  <el-form-item
    ><el-checkbox v-model="model.mentionAll"
      >提醒所有群成员</el-checkbox
    ></el-form-item
  >
  <el-form-item v-if="showPreview" label="内容预览">
    <ScriptMaterialPreview :message="model" class="editor-preview" />
  </el-form-item>
  <ResourceAssetPicker
    v-model="assetOpen"
    :selected-asset="asset"
    @select="selectAsset"
  />
</template>

<style scoped>
.editor-preview {
  width: 100%;
}
</style>
