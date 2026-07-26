<script setup lang="ts">
import { ref } from "vue";

defineOptions({ name: "PermissionMenuManagement" });

const menuTree = [
  {
    id: "account",
    label: "账号管理",
    children: [
      { id: "account-list", label: "账号列表" },
      { id: "account-group", label: "账号分组" }
    ]
  },
  {
    id: "task",
    label: "任务中心",
    children: [
      { id: "task-pull", label: "拉群任务" },
      { id: "task-marketing", label: "营销任务" }
    ]
  },
  {
    id: "material",
    label: "素材管理",
    children: [{ id: "marketing-template", label: "营销模板" }]
  },
  {
    id: "permission",
    label: "权限管理",
    children: [
      { id: "permission-user", label: "用户管理" },
      { id: "permission-role", label: "角色管理" },
      { id: "permission-menu", label: "菜单管理" }
    ]
  }
];
const treeRef = ref();

function refreshTree(): void {
  treeRef.value?.setExpandedKeys(menuTree.map(item => item.id));
}
</script>

<template>
  <div class="permission-menu-page">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <span>菜单管理</span><el-button @click="refreshTree">刷新</el-button>
        </div>
      </template>
      <el-tree
        ref="treeRef"
        :data="menuTree"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      />
    </el-card>
  </div>
</template>

<style scoped>
.permission-menu-page {
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
