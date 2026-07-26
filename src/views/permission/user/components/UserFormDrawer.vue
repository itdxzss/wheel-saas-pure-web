<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  mockRoleOptions,
  type ManagedUser,
  type UserFormPayload
} from "../user-management";

const props = defineProps<{
  modelValue: boolean;
  user?: ManagedUser;
  parentUsers: ManagedUser[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", payload: UserFormPayload): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive<UserFormPayload>({
  username: "",
  password: "",
  parentUserId: undefined,
  role: ""
});

const isEditing = computed(() => Boolean(props.user));
const title = computed(() => (isEditing.value ? "编辑用户" : "新增用户"));
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const rules: FormRules<UserFormPayload> = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 32, message: "用户名长度为 2-32 位", trigger: "blur" }
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!isEditing.value && (!value || value.length < 6)) {
          callback(new Error("请输入至少 6 位密码"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }]
};

function resetForm(): void {
  form.username = props.user?.username ?? "";
  form.password = "";
  form.parentUserId = props.user?.parentUserId;
  form.role = props.user?.role ?? "";
  formRef.value?.clearValidate();
}

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit("saved", {
    username: form.username.trim(),
    ...(isEditing.value ? {} : { password: form.password }),
    ...(form.parentUserId ? { parentUserId: form.parentUserId } : {}),
    role: form.role
  });
  visible.value = false;
}

watch(
  () => props.modelValue,
  value => {
    if (value) resetForm();
  }
);
</script>

<template>
  <el-drawer v-model="visible" :title="title" size="420px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="76px">
      <el-form-item label="用户名" prop="username" required>
        <el-input
          v-model="form.username"
          maxlength="32"
          placeholder="请输入用户名"
        />
      </el-form-item>
      <el-form-item v-if="!isEditing" label="密码" prop="password" required>
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入密码（至少 6 位）"
        />
      </el-form-item>
      <el-form-item label="角色" prop="role" required>
        <el-select v-model="form.role" placeholder="请选择角色">
          <el-option
            v-for="role in mockRoleOptions"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="上级用户">
        <el-select
          v-model="form.parentUserId"
          clearable
          placeholder="可选，留空表示无上级"
        >
          <el-option
            v-for="item in parentUsers"
            :key="item.id"
            :label="item.username"
            :value="item.id"
            :disabled="item.id === user?.id || item.status === 'DISABLED'"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认</el-button>
    </template>
  </el-drawer>
</template>
