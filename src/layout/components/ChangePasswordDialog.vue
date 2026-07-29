<script setup lang="ts">
import { nextTick, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { changeOwnPassword } from "@/api/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { apiErrorMessage } from "@/utils/api-error";
import {
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE
} from "@/utils/password-policy";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const visible = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<PasswordForm>({
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
});
const rules: FormRules<PasswordForm> = {
  currentPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    {
      pattern: PASSWORD_PATTERN,
      message: PASSWORD_RULE_MESSAGE,
      trigger: "blur"
    }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value: string, callback) => {
        if (value === form.newPassword) callback();
        else callback(new Error("两次输入的新密码不一致"));
      },
      trigger: "blur"
    }
  ]
};

function open(): void {
  Object.assign(form, {
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  visible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

async function submit(): Promise<void> {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    await changeOwnPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    });
    visible.value = false;
    ElMessage.success("密码修改成功，请重新登录");
    useUserStoreHook().logOut();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "密码修改失败"));
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <el-dialog v-model="visible" title="修改密码" width="420px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
      <el-form-item label="当前密码" prop="currentPassword">
        <el-input
          v-model="form.currentPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          @keyup.enter="submit"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
