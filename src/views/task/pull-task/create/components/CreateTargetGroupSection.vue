<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, type UploadFile } from "element-plus";
import type { PullTaskMarketingCreateDraft } from "../create-draft";
import { reconcileSelectedGroupIds } from "../create-interactions";

defineOptions({ name: "PullTaskMarketingCreateTargetGroupSection" });

interface CandidateGroupRow {
  id: number;
  name: string;
  jid: string;
  managerPhone: string;
  role: string;
  source: string;
  status: string;
}

const draft = defineModel<PullTaskMarketingCreateDraft>({ required: true });
const candidateGroups = ref<CandidateGroupRow[]>([]);

const unlimitedOptions = [
  { label: "不限", value: "" },
  { label: "是", value: "YES" },
  { label: "否", value: "NO" }
];

function selectAvatar(file: UploadFile): void {
  if (file.raw) draft.value.groupAvatarFile = file.raw;
}

function updateSelection(rows: CandidateGroupRow[]): void {
  draft.value.selectedGroupIds = reconcileSelectedGroupIds(
    draft.value.selectedGroupIds,
    candidateGroups.value.map(row => row.id),
    rows.map(row => row.id)
  );
}

function unavailableGroupAction(): void {
  ElMessage.info("群组筛选接口待确认");
}
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">2</el-tag>
        <div>
          <strong>目标群配置</strong>
          <p>群资源、成员清理、资料权限、目标群组与等待任务池</p>
        </div>
      </div>
    </template>

    <div class="form-grid">
      <el-form-item label="群资源使用方式">
        <el-radio-group v-model="draft.resourceSource">
          <el-radio-button value="HISTORICAL">历史老群</el-radio-button>
          <el-radio-button value="SELF_COLLECTED">自收群</el-radio-button>
          <el-radio-button value="MIXED">混合来源</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否清空当前群成员">
        <el-switch
          v-model="draft.clearMembers"
          active-text="清空"
          inactive-text="不清理"
        />
      </el-form-item>

      <el-form-item label="是否禁言">
        <el-radio-group v-model="draft.muted">
          <el-radio-button :value="false">否</el-radio-button>
          <el-radio-button :value="true">是</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="群最大人数" required>
        <el-input-number v-model="draft.groupMaxMembers" :min="1" :max="1024" />
      </el-form-item>

      <el-form-item label="群名称修改方式">
        <el-radio-group v-model="draft.groupNameMode">
          <el-radio-button value="KEEP">不修改</el-radio-button>
          <el-radio-button value="UNIFIED">使用统一名称</el-radio-button>
          <el-radio-button value="TEMPLATE_SEQUENCE">
            名称模板加序号
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="群头像">
        <div class="upload-row">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="selectAvatar"
          >
            <el-button>选择文件</el-button>
          </el-upload>
          <span>{{ draft.groupAvatarFile?.name || "不修改" }}</span>
        </div>
      </el-form-item>

      <el-form-item label="群描述">
        <el-radio-group v-model="draft.groupDescriptionMode">
          <el-radio-button value="KEEP">不修改</el-radio-button>
          <el-radio-button value="UNIFIED">使用统一描述</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="群资料修改权限">
        <el-select v-model="draft.groupInfoPermission">
          <el-option label="仅管理员" value="ADMIN_ONLY" />
          <el-option label="所有成员" value="ALL_MEMBERS" />
        </el-select>
      </el-form-item>

      <el-form-item label="入群审批">
        <el-select v-model="draft.joinApproval">
          <el-option label="开启" value="ENABLED" />
          <el-option label="关闭" value="DISABLED" />
        </el-select>
      </el-form-item>

      <el-form-item label="成员邀请权限">
        <el-select v-model="draft.memberInvitePermission">
          <el-option label="仅管理员" value="ADMIN_ONLY" />
          <el-option label="所有成员" value="ALL_MEMBERS" />
        </el-select>
      </el-form-item>
    </div>

    <el-alert
      title="修改群资料或权限后，创建前需要重新读取群资料进行校验"
      type="info"
      :closable="false"
      class="section-alert"
    />

    <el-tabs v-model="draft.targetGroupTab" class="target-tabs">
      <el-tab-pane label="目标群组选择" name="CANDIDATES">
        <div class="filter-grid">
          <el-form-item label="群组来源">
            <el-select v-model="draft.resourceSource">
              <el-option label="历史老群" value="HISTORICAL" />
              <el-option label="自收群" value="SELF_COLLECTED" />
              <el-option label="混合来源" value="MIXED" />
            </el-select>
          </el-form-item>
          <el-form-item label="群所属大洲">
            <el-select v-model="draft.continent" clearable placeholder="不限" />
          </el-form-item>
          <el-form-item label="群所属国家">
            <el-select
              v-model="draft.countries"
              multiple
              filterable
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="当前账号角色">
            <el-select
              v-model="draft.currentRole"
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="群名称">
            <el-input v-model="draft.groupNameKeyword" placeholder="模糊匹配" />
          </el-form-item>
          <el-form-item label="群组状态">
            <el-select
              v-model="draft.groupStatus"
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="当前管理账号">
            <el-input
              v-model="draft.managerPhone"
              placeholder="手机号模糊匹配"
            />
          </el-form-item>
          <el-form-item label="群组 JID">
            <el-input v-model="draft.groupJid" placeholder="精确匹配" />
          </el-form-item>
          <el-form-item label="显示普通成员群组">
            <el-switch v-model="draft.showRegularGroups" />
          </el-form-item>
          <el-form-item label="是否被其他任务占用">
            <el-select v-model="draft.occupancy">
              <el-option
                v-for="option in unlimitedOptions"
                :key="option.value || 'ALL'"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="发言权限">
            <el-select
              v-model="draft.speakPermission"
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="入群审批">
            <el-select
              v-model="draft.filterJoinApproval"
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="成员邀请权限">
            <el-select
              v-model="draft.filterInvitePermission"
              clearable
              placeholder="不限"
            />
          </el-form-item>
          <el-form-item label="群存续天数" class="range-field">
            <el-slider
              v-model="draft.groupAgeRange"
              range
              :min="0"
              :max="3650"
            />
          </el-form-item>
          <el-form-item label="群当前人数" class="range-field">
            <el-slider
              v-model="draft.memberCountRange"
              range
              :min="0"
              :max="1024"
            />
          </el-form-item>
        </div>

        <div class="candidate-summary">
          <span>当前筛选条件下可用群组：-- · 符合展示 --</span>
          <div>
            <el-button @click="unavailableGroupAction">全选可执行</el-button>
            <el-button type="primary" @click="unavailableGroupAction">
              加入等待任务池
            </el-button>
          </div>
          <span
            >已选择 {{ draft.selectedGroupIds.length }} 个 · 支持跨页选择</span
          >
        </div>

        <el-table
          :data="candidateGroups"
          row-key="id"
          border
          @selection-change="updateSelection"
        >
          <el-table-column type="selection" width="52" reserve-selection />
          <el-table-column prop="name" label="群组信息" min-width="180" />
          <el-table-column prop="jid" label="群组 JID" min-width="180" />
          <el-table-column
            prop="managerPhone"
            label="当前管理账号"
            min-width="150"
          />
          <el-table-column label="角色/来源" min-width="130">
            <template #default="{ row }"
              >{{ row.role }}/{{ row.source }}</template
            >
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" />
          <template #empty>
            <el-empty description="群组筛选接口待确认" />
          </template>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="等待任务池" name="WAITING_POOL">
        <el-empty description="等待任务池接口待确认" />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped>
.create-section {
  margin-bottom: 16px;
}

.section-header,
.upload-row,
.candidate-summary {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-header {
  align-items: flex-start;
}

.section-header strong {
  font-size: 16px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.form-grid,
.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.filter-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-input-number),
.filter-grid :deep(.el-select) {
  width: 100%;
}

.range-field {
  grid-column: span 2;
}

.section-alert {
  margin: 8px 0 16px;
}

.target-tabs {
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.candidate-summary {
  justify-content: space-between;
  margin: 8px 0 16px;
  color: var(--el-text-color-regular);
}

@media (width <= 900px) {
  .form-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .range-field {
    grid-column: auto;
  }

  .candidate-summary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
