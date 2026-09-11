<script setup lang="ts">
import { nextTick, reactive, watch } from "vue";
import type { ComposerRole } from "../composables/useScriptComposer";

const props = defineProps<{
  roles: ComposerRole[];
  counts: Record<string, number>;
  activeRole?: string;
  full: boolean;
}>();
const emit = defineEmits<{
  add: [type: ComposerRole["type"]];
  rename: [key: string, name: string];
  remove: [key: string];
  message: [key: string];
}>();
const names = reactive<Record<string, string>>({});
watch(
  () => props.roles.map(role => [role.key, role.name]),
  () => {
    props.roles.forEach(role => {
      names[role.key] = role.name;
    });
  },
  { immediate: true }
);
async function rename(role: ComposerRole) {
  emit("rename", role.key, names[role.key]);
  await nextTick();
  names[role.key] = role.name;
}
</script>

<template>
  <section class="composer-pane roles-pane" aria-label="角色配置">
    <header class="pane-header">
      <strong>角色配置</strong>
      <el-dropdown @command="emit('add', $event)">
        <el-button size="small" :disabled="roles.length >= 100"
          >+ 角色</el-button
        >
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="ADMIN">添加管理员角色</el-dropdown-item>
            <el-dropdown-item command="PROMOTER">添加推手角色</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>
    <div class="pane-scroll role-list">
      <article
        v-for="role in roles"
        :key="role.key"
        class="role-card"
        :class="{ 'is-active': role.key === activeRole }"
      >
        <div class="role-heading">
          <el-tag
            size="small"
            :type="role.type === 'ADMIN' ? 'warning' : 'primary'"
          >
            {{ role.type === "ADMIN" ? "管理员" : "推手" }}
          </el-tag>
          <span class="muted">{{ counts[role.key] || 0 }} 句</span>
          <el-button
            link
            type="danger"
            size="small"
            :disabled="!!counts[role.key]"
            :aria-label="`删除角色 ${role.name}`"
            title="请先将该角色的消息移到其他角色，再删除"
            @click="emit('remove', role.key)"
            >删除</el-button
          >
        </div>
        <el-form-item label="角色名称">
          <el-input
            v-model="names[role.key]"
            maxlength="50"
            :aria-label="`${role.name}的角色名称`"
            @change="rename(role)"
          />
        </el-form-item>
        <el-button
          class="role-add"
          type="primary"
          plain
          size="small"
          :disabled="full"
          @click="emit('message', role.key)"
          >+ 以此角色添加消息</el-button
        >
      </article>
      <p class="muted role-hint">
        同名角色使用同一账号，具体账号在创建任务时分配。未添加消息的角色不会保存。
      </p>
    </div>
  </section>
</template>

<style scoped>
.role-card {
  padding: 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.role-card.is-active {
  border-color: var(--el-color-primary-light-5);
}

.role-heading {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.role-card .el-form-item {
  margin-bottom: 12px;
}

.role-add {
  width: 100%;
}

.role-hint {
  line-height: 1.7;
}

@media (width <= 1000px) {
  .role-list {
    display: flex;
    gap: 10px;
  }

  .role-card {
    flex: 0 0 190px;
    margin-bottom: 0;
  }

  .role-hint {
    flex: 0 0 160px;
  }
}
</style>
