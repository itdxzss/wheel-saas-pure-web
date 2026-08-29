<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import type {
  DataPackageCreateInput,
  DataPackageListItem
} from "@/api/hyperlink-data-package";

defineOptions({ name: "DataPackageFormDialog" });

const props = defineProps<{
  dataPackage: DataPackageListItem | null;
  modelValue: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: "submit", value: DataPackageCreateInput): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const title = computed(() => (props.dataPackage ? "编辑数据包" : "创建数据包"));
const formRef = ref<FormInstance>();
const form = reactive({ name: "", remark: "" });
const rules = {
  name: [
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (value.trim()) callback();
        else callback(new Error("请输入数据包名称"));
      },
      trigger: "blur"
    },
    { max: 128, message: "数据包名称不能超过 128 个字符", trigger: "blur" }
  ],
  remark: [{ max: 255, message: "备注不能超过 255 个字符", trigger: "blur" }]
};

watch(
  () => props.modelValue,
  value => {
    if (!value) return;
    form.name = props.dataPackage?.name ?? "";
    form.remark = props.dataPackage?.remark ?? "";
    void nextTick(() => formRef.value?.clearValidate());
  }
);

async function submit(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  emit("submit", {
    name: form.name.trim(),
    remark: form.remark.trim() || null
  });
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="560px"
    destroy-on-close
    :close-on-click-modal="!saving"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <el-form-item label="数据包名称" prop="name">
        <el-input
          v-model="form.name"
          maxlength="128"
          show-word-limit
          placeholder="请输入数据包名称"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="255"
          show-word-limit
          placeholder="可填写数据来源或使用说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
