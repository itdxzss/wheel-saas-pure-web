<script setup lang="ts">
import { onMounted } from "vue";
import FeedTaskDataDrawer from "../../../src/views/task/feed-task/components/FeedTaskDataDrawer.vue";
import { useFeedTaskPage } from "../../../src/views/task/feed-task/composables/useFeedTaskPage";
import { useUserStoreHook } from "../../../src/store/modules/user";
import type { FeedTaskRow } from "../../../src/api/feed-task";
const state = useFeedTaskPage();
const store = useUserStoreHook();
store.SET_PERMS(["tenant:feed_task:operate"]);
const task: FeedTaskRow = {
  id: 42,
  name: "本地合成数据验收",
  title: "本地合成数据验收",
  accountFilter: {},
  content: "test",
  promotionLink: "https://example.com",
  textColor: "#FFFFFF",
  backgroundColor: "#075E54",
  concurrency: 1,
  retryMax: 0,
  startMode: "now",
  taskMode: "instant",
  taskStatus: 1,
  status: 1,
  totalAccountNum: 1,
  successAccountNum: 0,
  failedAccountNum: 0
};
onMounted(() => state.openAccountData(task));
</script>
<template>
  <el-button @click="state.openAccountData(task)">打开明细</el-button>
  <el-button @click="store.SET_PERMS([])">移除测试操作权限</el-button>
  <FeedTaskDataDrawer
    v-model="state.dataVisible.value"
    :task-name="state.dataTaskName.value"
    :rows="state.accountRows.value"
    :loading="state.accountDataLoading.value"
    :total="state.accountDataTotal.value"
    :page="state.accountDataPage.value"
    :page-size="state.accountDataPageSize.value"
    :account-phone="state.accountPhone.value"
    :audience-refreshing-id="state.audienceRefreshingId.value"
    @refresh-audience="state.refreshAudience"
    @search="state.loadAccountData"
  />
</template>
