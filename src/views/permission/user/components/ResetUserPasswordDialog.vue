<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ManagedUser } from "../user-management";

const props = defineProps<{
  modelValue: boolean;
  user?: ManagedUser;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", password: string): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({ password: "", confirmPassword: "" });
const rules: FormRules<typeof form> = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" }
  ],
  confirmPassword: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error("请再次输入新密码"));
        } else if (value !== form.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

function close(): void {
  emit("update:modelValue", false);
}

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit("saved", form.password);
  close();
}

watch(
  () => props.modelValue,
  value => {
    if (value) {
      form.password = "";
      form.confirmPassword = "";
      formRef.value?.clearValidate();
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="`重置密码 - ${user?.username ?? ''}`"
    width="420px"
    @close="close"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
      <el-form-item label="新密码" prop="password" required>
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入新密码（至少 6 位）"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword" required>
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit">确认重置</el-button>
    </template>
  </el-dialog>
</template>
