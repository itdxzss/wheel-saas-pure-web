<script setup lang="ts">
import { computed } from "vue";
import { hasAuth } from "@/router/utils";
import MutualContactGroupSelect from "./MutualContactGroupSelect.vue";
import { useMutualContacts } from "../composables/useMutualContacts";
import {
  mutualItemStatus,
  mutualTaskStatus,
  mutualReason
} from "../mutual-contact-display";
const open = defineModel<boolean>({ default: false });
const canEdit = computed(() => hasAuth("tenant:account:edit"));
const {
  form,
  preview,
  busy,
  error,
  tasks,
  taskPage,
  taskTotal,
  selected,
  items,
  itemPage,
  itemTotal,
  itemStatus,
  valid,
  canStart,
  check,
  start,
  select,
  stop,
  retry,
  refresh
} = useMutualContacts(open);
</script>
<template>
  <el-drawer v-model="open" title="互相添加好友" size="min(100%, 1080px)">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      @close="error = ''"
    />
    <el-form v-if="canEdit" label-width="170px" :disabled="busy">
      <el-form-item label="账号分组 A"
        ><MutualContactGroupSelect v-model="form.leftGroupId" :disabled="busy"
      /></el-form-item>
      <el-form-item label="账号分组 B"
        ><MutualContactGroupSelect v-model="form.rightGroupId" :disabled="busy"
      /></el-form-item>
      <el-form-item label="单账号保存间隔（秒）">
        <el-input-number
          v-model="form.intervalSeconds"
          :min="0"
          :max="3600"
          :precision="0"
        />
        <span class="ml-3 text-sm text-gray-500"
          >每次保存完成后的等待时间，0 表示不额外等待。</span
        >
      </el-form-item>
      <el-form-item
        ><el-button :disabled="!valid" :loading="busy" @click="check"
          >预览参与范围</el-button
        ></el-form-item
      >
    </el-form>
    <el-alert
      title="两组跨组全量互存；只纳入在线正常、身份完整且有操作权限的账号，联系人名称使用对方号码。"
      type="info"
      :closable="false"
    />
    <el-card v-if="preview" class="mt-3" shadow="never">
      <p v-for="side in [preview.left, preview.right]" :key="side.id">
        {{ side.name }}：共 {{ side.total }} 个，可参与
        {{ side.eligible }} 个，排除 {{ side.excluded }} 个
      </p>
      <p>排除范围：离线、状态异常、协议身份不完整、无操作权限或重复号码。</p>
      <p class="my-3">
        预计 {{ preview.pairCount }} 对关系，共
        {{ preview.operationCount }} 次保存；同一账号串行，不同账号并行。
      </p>
      <el-button
        type="primary"
        :disabled="!canStart"
        :loading="busy"
        @click="start"
        >开始互存</el-button
      >
    </el-card>
    <div class="my-4 flex items-center justify-between">
      <strong>互存任务</strong><el-button @click="refresh">刷新</el-button>
    </div>
    <el-table
      :data="tasks"
      row-key="id"
      highlight-current-row
      empty-text="暂无互存任务"
      @row-click="select"
    >
      <el-table-column prop="id" label="任务" width="75" />
      <el-table-column label="分组" min-width="220"
        ><template #default="{ row }"
          >{{ row.leftGroupName }} ↔ {{ row.rightGroupName }}</template
        ></el-table-column
      >
      <el-table-column label="状态" width="100"
        ><template #default="{ row }">{{
          mutualTaskStatus[row.status]
        }}</template></el-table-column
      >
      <el-table-column label="双向成功" width="100"
        ><template #default="{ row }"
          >{{ row.stats.mutualPairs }} /
          {{ row.leftCount * row.rightCount }}</template
        ></el-table-column
      >
      <el-table-column label="操作"
        ><template #default="{ row }"
          ><el-button link type="primary" @click.stop="select(row)"
            >查看进度</el-button
          ></template
        ></el-table-column
      >
    </el-table>
    <el-pagination
      v-model:current-page="taskPage"
      :page-size="10"
      :total="taskTotal"
      layout="total, prev, pager, next"
      class="my-3"
    />
    <template v-if="selected">
      <el-divider />
      <div class="flex items-center justify-between">
        <strong
          >任务 #{{ selected.id }}：{{ mutualTaskStatus[selected.status] }} ·
          间隔 {{ selected.intervalSeconds }} 秒</strong
        >
        <div v-if="canEdit">
          <el-button
            :disabled="busy || selected.status === 2 || selected.status === 3"
            @click="stop"
            >停止</el-button
          >
          <el-button :disabled="busy || !selected.stats.failed" @click="retry"
            >重试可重试的失败项</el-button
          >
        </div>
      </div>
      <p class="my-3">
        共 {{ selected.stats.total }} 次 · 成功 {{ selected.stats.success }} ·
        失败 {{ selected.stats.failed }} · 等待结果
        {{ selected.stats.submitted }} · 待确认 {{ selected.stats.unknown }} ·
        待执行 {{ selected.stats.pending }} · 已取消
        {{ selected.stats.canceled }}
      </p>
      <p>
        双向成功 {{ selected.stats.mutualPairs }} 对，单向成功
        {{ selected.stats.oneWayPairs }} 对。
      </p>
      <el-alert
        v-if="selected.stats.unknown"
        class="my-3"
        title="待确认操作不会自动重做，该执行账号后续操作暂停，避免重复保存。"
        type="warning"
        :closable="false"
      />
      <el-select
        v-model="itemStatus"
        clearable
        placeholder="全部结果"
        class="my-3"
        style="width: 180px"
        @change="itemPage = 1"
      >
        <el-option
          v-for="(label, value) in mutualItemStatus"
          :key="value"
          :value="Number(value)"
          :label="label"
        />
      </el-select>
      <el-table :data="items" row-key="id" empty-text="暂无匹配结果">
        <el-table-column prop="actorPhone" label="执行账号" min-width="140" />
        <el-table-column prop="targetPhone" label="保存对方" min-width="140" />
        <el-table-column prop="protocolBackend" label="执行协议" width="105" />
        <el-table-column label="结果" width="110"
          ><template #default="{ row }">{{
            mutualItemStatus[row.status]
          }}</template></el-table-column
        >
        <el-table-column prop="attemptNo" label="尝试次数" width="90" />
        <el-table-column label="原因" min-width="220"
          ><template #default="{ row }">{{
            mutualReason(row.reasonCode)
          }}</template></el-table-column
        >
      </el-table>
      <el-pagination
        v-model:current-page="itemPage"
        :page-size="20"
        :total="itemTotal"
        layout="total, prev, pager, next"
        class="my-3"
      />
    </template>
  </el-drawer>
</template>
