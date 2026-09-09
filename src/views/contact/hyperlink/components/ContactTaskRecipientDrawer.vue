<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "dayjs";
import {
  listContactTaskRecipients,
  type ContactTaskAccountItem,
  type ContactTaskRecipient
} from "@/api/contact-task";
import { message } from "@/utils/message";
const props = defineProps<{
  modelValue: boolean;
  taskId: number | null;
  account: ContactTaskAccountItem | null;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const rows = ref<ContactTaskRecipient[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
let requestVersion = 0;
const statuses: Record<string, string> = {
  PENDING: "待发送",
  SENDING: "发送中",
  SUCCESS: "已发送",
  FAILED: "失败",
  UNKNOWN: "结果未知",
  SKIPPED: "已跳过"
};
function time(value: number | null) {
  return value ? dayjs(value).format("MM-DD HH:mm:ss") : "—";
}
async function load() {
  const version = ++requestVersion;
  if (props.taskId == null || !props.account || !visible.value) return;
  loading.value = true;
  try {
    const result = await listContactTaskRecipients(
      props.taskId,
      props.account.taskAccountId,
      page.value
    );
    if (version !== requestVersion) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (version === requestVersion)
      message((error as Error).message || "发送明细加载失败", {
        type: "error"
      });
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
watch(
  () => [props.modelValue, props.taskId, props.account?.taskAccountId],
  () => {
    ++requestVersion;
    rows.value = [];
    total.value = 0;
    page.value = 1;
    if (visible.value) load();
  }
);
</script>

<template>
  <el-drawer v-model="visible" title="联系人发送明细" size="90%" append-to-body>
    <el-alert
      type="info"
      :closable="false"
      title="已发送表示协议确认；送达和已读以回执为准。结果未知不会自动重发。"
    />
    <el-button :loading="loading" @click="load">刷新</el-button>
    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column prop="contactJid" label="联系人 JID" min-width="220" />
      <el-table-column label="手机号" min-width="140"
        ><template #default="{ row }">{{
          row.contactPhone || "—"
        }}</template></el-table-column
      >
      <el-table-column label="发送状态" width="110"
        ><template #default="{ row }">{{
          statuses[row.sendStatus] || row.sendStatus
        }}</template></el-table-column
      >
      <el-table-column label="发送确认" width="150"
        ><template #default="{ row }">{{
          time(row.firstSentAt)
        }}</template></el-table-column
      >
      <el-table-column label="送达" width="150"
        ><template #default="{ row }">{{
          time(row.deliveredAt)
        }}</template></el-table-column
      >
      <el-table-column label="已读" width="150"
        ><template #default="{ row }">{{
          time(row.readAt)
        }}</template></el-table-column
      >
      <el-table-column
        prop="errorDesc"
        label="原因"
        min-width="180"
        show-overflow-tooltip
      />
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :total="total"
      :page-size="20"
      layout="total, prev, pager, next"
      @current-change="load"
    />
  </el-drawer>
</template>
