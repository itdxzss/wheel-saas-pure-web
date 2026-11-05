<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { useTierCheckCreate } from "../composables/useTierCheckCreate";

const open = defineModel<boolean>({ default: false });
const props = withDefaults(defineProps<{ accountIds?: number[] }>(), {
  accountIds: () => []
});
const emit = defineEmits<{ (event: "created"): void }>();
const {
  form,
  groupOptions,
  probeOptions,
  probeLoading,
  busy,
  error,
  preview,
  valid,
  canStart,
  selectedIds,
  check,
  start: create,
  searchProbes
} = useTierCheckCreate(
  open,
  computed(() => props.accountIds)
);

async function start(): Promise<void> {
  if (!(await create())) return;
  ElMessage.success("检测已创建");
  open.value = false;
  emit("created");
}
</script>

<template>
  <el-drawer v-model="open" title="新建检测" size="min(100%, 720px)">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      class="mb-3"
      @close="error = ''"
    />
    <el-form label-width="120px" :disabled="busy">
      <el-form-item label="批次名称">
        <el-input
          v-model="form.name"
          :maxlength="100"
          show-word-limit
          placeholder="例如：巴基斯坦商业号 · 11-19"
        />
      </el-form-item>
      <el-form-item v-if="selectedIds.length" label="已选账号" required>
        <span>已选择 {{ selectedIds.length }} 个账号</span>
      </el-form-item>
      <el-form-item v-else label="账号分组" required>
        <el-select
          v-model="form.accountGroupIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择要检测的账号分组"
          style="width: 100%"
        >
          <el-option
            v-for="group in groupOptions"
            :key="group.id"
            :value="group.id"
            :label="group.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="包含个人号">
        <el-switch v-model="form.includePersonal" />
        <span class="ml-3 text-sm text-gray-500"
          >个人号的档位恒为未分档，一般不需要查。</span
        >
      </el-form-item>
      <el-form-item label="查询方式" required>
        <el-radio-group v-model="form.mode">
          <el-radio :value="1">每个号查自己</el-radio>
          <el-radio :value="2">探针号代查</el-radio>
        </el-radio-group>
        <div class="mt-2 w-full text-sm text-gray-500">
          <template v-if="form.mode === 1"
            >用号自己的连接查询，不占用额外账号；号需要在线，离线号会被排除。</template
          >
          <template v-else
            >指定在线号代查整批，离线号也能查；每个探针号每轮最多查 20 个，间隔
            4 秒。</template
          >
        </div>
      </el-form-item>
      <el-form-item v-if="form.mode === 2" label="探针号" required>
        <el-select
          v-model="form.probeAccountIds"
          multiple
          filterable
          remote
          reserve-keyword
          :remote-method="searchProbes"
          :loading="probeLoading"
          placeholder="搜索并选择在线账号作为探针号"
          style="width: 100%"
        >
          <el-option
            v-for="probe in probeOptions"
            :key="probe.id"
            :value="probe.id"
            :label="probe.phone"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!valid" :loading="busy" @click="check"
          >预览参与范围</el-button
        >
      </el-form-item>
    </el-form>
    <el-alert
      title="只读查询：不发消息、不改资料。同一发起账号串行查询，空返回会记为失败并暂缓，不会写成档位消失。"
      type="info"
      :closable="false"
    />
    <el-card v-if="preview" class="mt-3" shadow="never">
      <p>可检测 {{ preview.eligible }} 个，排除 {{ preview.excluded }} 个。</p>
      <p v-for="item in preview.excludedReasons" :key="item.reason">
        排除原因：{{ item.reason }}，{{ item.count }} 个
      </p>
      <el-button
        type="primary"
        class="mt-3"
        :disabled="!canStart"
        :loading="busy"
        @click="start"
        >开始检测</el-button
      >
    </el-card>
  </el-drawer>
</template>
