<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskSupplementForm } from "../composables/usePullTaskPage";

defineOptions({ name: "PullTaskLegacySupplementDrawer" });

defineProps<{ accountGroups: AccountGroupApiRow[] }>();
const emit = defineEmits<{ (event: "submit"): void }>();
const visible = defineModel<boolean>({ required: true });
const form = defineModel<PullTaskSupplementForm>("form", { required: true });
</script>

<template>
  <el-drawer v-model="visible" append-to-body size="420px" title="批量补充拉手">
    <el-form :model="form" label-width="110px">
      <el-form-item label="拉手分组" required>
        <el-select
          v-model="form.accountGroupId"
          filterable
          class="form-control"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="每群补充数">
        <el-input-number v-model="form.countPerGroup" :min="1" />
      </el-form-item>
      <el-form-item label="进群方式">
        <el-select v-model="form.joinMode" class="form-control">
          <el-option label="慢速踩群链接" value="慢速踩群链接" />
          <el-option label="快速踩群链接" value="快速踩群链接" />
          <el-option label="管理员拉进群" value="管理员拉进群" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="emit('submit')">确认补充</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.form-control {
  width: 100%;
}
</style>
