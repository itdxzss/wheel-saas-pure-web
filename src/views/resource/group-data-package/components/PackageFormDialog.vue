<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  GroupDataPackage,
  GroupDataPackageMetadata
} from "@/api/group-data-package";

defineOptions({ name: "GroupPackageFormDialog" });
const props = defineProps<{
  target: GroupDataPackage | null;
  saving: boolean;
}>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  (event: "save", value: GroupDataPackageMetadata): void;
}>();
const formRef = ref<FormInstance>();
const form = reactive({ name: "", remark: "" });
const rules: FormRules = {
  name: [
    {
      required: true,
      whitespace: true,
      message: "请输入数据包名称",
      trigger: "blur"
    },
    { max: 128, message: "名称不超过 128 个字符", trigger: "blur" }
  ],
  remark: [{ max: 512, message: "备注不超过 512 个字符", trigger: "blur" }]
};
watch(visible, value => {
  if (!value) return;
  form.name = props.target?.name ?? "";
  form.remark = props.target?.remark ?? "";
  formRef.value?.clearValidate();
});
async function save(): Promise<void> {
  if (props.saving || !(await formRef.value?.validate().catch(() => false)))
    return;
  emit("save", { name: form.name.trim(), remark: form.remark.trim() || null });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="target ? '编辑数据包' : '新建数据包'"
    width="560px"
    :close-on-click-modal="!saving"
    :show-close="!saving"
    :close-on-press-escape="!saving"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="save"
    >
      <el-form-item label="数据包名称" prop="name">
        <el-input
          v-model="form.name"
          maxlength="128"
          show-word-limit
          placeholder="请输入数据包名称（如：泰国 4 月活跃号码）"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="512"
          show-word-limit
          placeholder="可选。简要描述数据包来源 / 用途等。"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
