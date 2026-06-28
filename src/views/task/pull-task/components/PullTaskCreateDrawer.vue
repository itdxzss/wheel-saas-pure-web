<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { PullTaskLinkGroup, PullTaskLinkOption } from "@/api/pull-task";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskCreateForm } from "../composables/usePullTaskPage";
import Upload from "~icons/ep/upload";

defineOptions({
  name: "PullTaskCreateDrawer"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  groupLinkOptions: PullTaskLinkOption[];
  groupLinksLoading: boolean;
  linkGroups: PullTaskLinkGroup[];
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "load-group-links"): void;
  (event: "read-material-file", file?: File): void;
  (event: "read-water-file", file?: File): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<PullTaskCreateForm>("form", { required: true });
const createTab = ref("basic");
</script>

<template>
  <el-drawer
    v-model="visible"
    size="920px"
    destroy-on-close
    title="新增拉群任务"
  >
    <el-tabs v-model="createTab">
      <el-tab-pane label="基础信息" name="basic">
        <el-form :model="form" label-width="132px" class="drawer-form">
          <el-form-item label="任务名称" required>
            <el-input v-model="form.taskName" placeholder="请输入任务名称" />
          </el-form-item>
          <el-form-item label="子模式">
            <el-radio-group v-model="form.subMode">
              <el-radio-button label="OLD_LINK">老群链接</el-radio-button>
              <el-radio-button label="CREATE_NEW">自建群</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="管理员">
            <el-switch
              v-model="form.useAdmin"
              active-text="使用管理员"
              inactive-text="不使用"
            />
          </el-form-item>
          <el-form-item label="WS链接分组">
            <el-select
              v-model="form.wsLinkGroupId"
              clearable
              filterable
              class="form-control"
              @change="emit('load-group-links')"
            >
              <el-option
                v-for="group in linkGroups"
                :key="group.id"
                :label="`${group.name} (${group.totalLinks ?? 0})`"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="群链接">
            <el-select
              v-model="form.groupLinkIds"
              v-loading="groupLinksLoading"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              class="form-control"
              placeholder="选择已导入成功的群链接"
            >
              <el-option
                v-for="link in groupLinkOptions"
                :key="link.id"
                :label="`${link.groupName || link.linkUrl} · ${
                  link.statusLabel || '未知状态'
                }`"
                :value="link.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="粘贴群链接">
            <el-input
              v-model="form.pastedLinks"
              type="textarea"
              :rows="4"
              placeholder="每行一个群链接；未选择导入链接时可直接粘贴。"
            />
          </el-form-item>
          <el-form-item label="任务模版 ID">
            <el-input-number v-model="form.templateId" :min="0" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="角色分组" name="roles">
        <el-form :model="form" label-width="152px" class="drawer-form">
          <el-form-item label="管理分组">
            <el-select
              v-model="form.adminGroupId"
              :disabled="!form.useAdmin"
              clearable
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
          <el-form-item label="管理员每群数量">
            <el-input-number v-model="form.adminPerGroup" :min="0" />
          </el-form-item>
          <el-form-item label="拉手分组" required>
            <el-select
              v-model="form.pullerGroupId"
              clearable
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
          <el-form-item label="拉手每群数量">
            <el-input-number v-model="form.pullerPerGroup" :min="1" />
          </el-form-item>
          <el-form-item label="站台一/二/三分组">
            <div class="inline-grid">
              <el-select v-model="form.stationOneGroupId" clearable filterable>
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
              <el-select v-model="form.stationTwoGroupId" clearable filterable>
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
              <el-select
                v-model="form.stationThreeGroupId"
                clearable
                filterable
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="站台每群数量">
            <div class="inline-grid">
              <el-input-number v-model="form.stationOnePerGroup" :min="0" />
              <el-input-number v-model="form.stationTwoPerGroup" :min="0" />
              <el-input-number v-model="form.stationThreePerGroup" :min="0" />
            </div>
          </el-form-item>
          <el-form-item label="自动补管理员">
            <div class="inline-grid two">
              <el-input-number
                v-model="form.autoSupplementAdminCount"
                :min="0"
              />
              <el-input-number
                v-model="form.autoSupplementAdminTimes"
                :min="0"
              />
            </div>
          </el-form-item>
          <el-form-item label="自动补拉手">
            <div class="inline-grid two">
              <el-input-number
                v-model="form.autoSupplementPullerCount"
                :min="0"
              />
              <el-input-number
                v-model="form.autoSupplementPullerTimes"
                :min="0"
              />
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="拉群参数" name="params">
        <el-form :model="form" label-width="152px" class="drawer-form">
          <el-form-item label="启动与审核">
            <div class="switch-list">
              <el-switch v-model="form.autoStart" active-text="自动启动" />
              <el-switch
                v-model="form.pullerEnterFirst"
                active-text="拉手提前进群"
              />
              <el-switch
                v-model="form.noReleaseAfterPull"
                active-text="拉完后不放人"
              />
            </div>
          </el-form-item>
          <el-form-item label="审核模式">
            <el-select v-model="form.auditMode" class="form-control">
              <el-option label="关闭审核模式进群" value="关闭审核模式进群" />
              <el-option label="统一同意进群" value="统一同意进群" />
              <el-option label="单个审核同意进群" value="单个审核同意进群" />
            </el-select>
          </el-form-item>
          <el-form-item label="同步与等待">
            <div class="inline-grid two">
              <el-select v-model="form.pullerSyncMode">
                <el-option label="单个同步" value="单个同步" />
                <el-option label="批量同步" value="批量同步" />
              </el-select>
              <el-input-number v-model="form.waitBeforePullSeconds" :min="0" />
            </div>
          </el-form-item>
          <el-form-item label="拉人数量">
            <div class="inline-grid">
              <el-input-number v-model="form.concurrentTaskCount" :min="1" />
              <el-input-number v-model="form.firstPullCount" :min="1" />
              <el-input-number v-model="form.pullerMaxTotal" :min="1" />
            </div>
          </el-form-item>
          <el-form-item label="单次拉人数范围">
            <div class="inline-grid two">
              <el-input-number v-model="form.pullCountMin" :min="1" />
              <el-input-number v-model="form.pullCountMax" :min="1" />
            </div>
          </el-form-item>
          <el-form-item label="间隔与线程">
            <div class="inline-grid two">
              <el-input-number v-model="form.pullIntervalSeconds" :min="1" />
              <el-input-number v-model="form.pullerThreadCount" :min="1" />
            </div>
          </el-form-item>
          <el-form-item label="进群方式">
            <div class="inline-grid two">
              <el-select v-model="form.stationJoinMode">
                <el-option label="慢速踩群链接" value="慢速踩群链接" />
                <el-option label="快速踩群链接" value="快速踩群链接" />
                <el-option label="拉手拉进群" value="拉手拉进群" />
              </el-select>
              <el-select v-model="form.pullerJoinMode">
                <el-option label="慢速踩群链接" value="慢速踩群链接" />
                <el-option label="快速踩群链接" value="快速踩群链接" />
                <el-option
                  label="管理员拉进群"
                  value="管理员拉进群"
                  :disabled="!form.useAdmin"
                />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="退群方式">
            <div class="inline-grid two">
              <el-select v-model="form.pullerQuitMode">
                <el-option label="不退拉手" value="不退拉手" />
                <el-option label="拉手自动退群" value="拉手自动退群" />
                <el-option label="管理踢拉手" value="管理踢拉手" />
              </el-select>
              <el-select v-model="form.adminQuitMode">
                <el-option label="不退管理员" value="不退管理员" />
                <el-option label="管理员自动退群" value="管理员自动退群" />
              </el-select>
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="群信息与数据" name="data">
        <el-form :model="form" label-width="132px" class="drawer-form">
          <el-form-item label="群名称">
            <el-input v-model="form.groupName" placeholder="可选" />
          </el-form-item>
          <el-form-item label="群参数">
            <div class="switch-list">
              <el-switch v-model="form.mute" active-text="禁言" />
              <el-switch
                v-model="form.autoCloseInvite"
                active-text="自动关拉人权限"
              />
              <el-switch
                v-model="form.stationQuitAfterDone"
                active-text="站台完成后退群"
              />
            </div>
          </el-form-item>
          <el-form-item label="群权限">
            <div class="inline-grid two">
              <el-select v-model="form.linkPermission">
                <el-option label="所有成员可邀请" value="所有成员可邀请" />
                <el-option label="仅管理员可邀请" value="仅管理员可邀请" />
              </el-select>
              <el-select v-model="form.editPermission">
                <el-option label="仅管理员可编辑" value="仅管理员可编辑" />
                <el-option label="所有成员可编辑" value="所有成员可编辑" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="料子文件" required>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".txt,.csv"
              :on-change="file => emit('read-material-file', file.raw)"
            >
              <el-button :icon="useRenderIcon(Upload)">上传料子文件</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="料子数据" required>
            <el-input
              v-model="form.materialText"
              type="textarea"
              :rows="6"
              placeholder="每行一个目标号码；隐私号可追加逗号标记。"
            />
          </el-form-item>
          <el-form-item label="水军文件">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".txt,.csv"
              :on-change="file => emit('read-water-file', file.raw)"
            >
              <el-button :icon="useRenderIcon(Upload)">上传水军文件</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="水军抽取逻辑">
            <el-radio-group v-model="form.waterMode">
              <el-radio-button label="一号多群" />
              <el-radio-button label="多号多群" />
            </el-radio-group>
          </el-form-item>
          <el-form-item label="水军号码">
            <el-input
              v-model="form.waterText"
              type="textarea"
              :rows="4"
              placeholder="每行一个水军号码"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="emit('create')">保存任务</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-form {
  padding-right: 16px;
}

.form-control {
  width: 100%;
}

.inline-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.inline-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.switch-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

@media (width <= 900px) {
  .inline-grid,
  .inline-grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
