<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  CommonGroupForm,
  CommonGroupFormErrors
} from "../../common-group/common-group-form";
import CommonGroupHelp from "./CommonGroupHelp.vue";

defineOptions({ name: "CommonGroupAccountMemberSections" });

defineProps<{
  accountGroups: AccountGroupApiRow[];
  errors: CommonGroupFormErrors;
}>();

const form = defineModel<CommonGroupForm>("form", { required: true });
</script>

<template>
  <div class="section-grid">
    <el-card shadow="never" class="form-section">
      <template #header>
        <div class="section-title">
          <span class="section-number">1</span>
          <div>
            <strong>建群账号</strong>
            <p>选择创建群组的管理员账号来源。</p>
          </div>
        </div>
      </template>

      <el-form-item required :error="errors.managerGroupId">
        <template #label>
          管理员分组
          <CommonGroupHelp
            content="从当前账号分组中选择创建群组的管理员账号。"
          />
        </template>
        <el-select
          v-model="form.managerGroupId"
          filterable
          placeholder="请选择管理员分组"
          class="full-width"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="`${group.name}（在线 ${group.onlineAccounts}）`"
            :value="group.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="创群号自动退群">
        <el-radio-group v-model="form.creatorAutoLeave">
          <el-radio-button :value="false">留群</el-radio-button>
          <el-radio-button :value="true">自动退群</el-radio-button>
        </el-radio-group>
        <div class="field-help">任务完成后是否让创群账号自动退出群组。</div>
      </el-form-item>
    </el-card>

    <el-card shadow="never" class="form-section">
      <template #header>
        <div class="section-title">
          <span class="section-number">2</span>
          <div>
            <strong>群成员</strong>
            <p>成员类型互斥，选择后显示对应配置。</p>
          </div>
        </div>
      </template>

      <el-form-item required>
        <template #label>
          群成员类型
          <CommonGroupHelp
            content="控上号从账号分组选择成员；空群不添加初始成员。"
          />
        </template>
        <el-radio-group v-model="form.memberType">
          <el-radio-button value="CONTROLLED">控上号</el-radio-button>
          <el-radio-button value="CUSTOM" disabled>自定义号码</el-radio-button>
          <el-radio-button value="EMPTY">空群</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.memberType === 'CONTROLLED'">
        <div class="field-columns">
          <el-form-item required :error="errors.memberGroupId">
            <template #label>
              成员分组
              <CommonGroupHelp content="作为每个群组控上成员来源的账号分组。" />
            </template>
            <el-select
              v-model="form.memberGroupId"
              filterable
              placeholder="请选择成员分组"
              class="full-width"
            >
              <el-option
                v-for="group in accountGroups"
                :key="group.id"
                :label="`${group.name}（在线 ${group.onlineAccounts}）`"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item required :error="errors.memberCount">
            <template #label>
              成员数量
              <CommonGroupHelp
                content="每个群组计划加入的控上成员数量，最少为 1。"
              />
            </template>
            <el-input-number
              v-model="form.memberCount"
              :min="1"
              :step="1"
              step-strictly
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </div>
      </template>

      <el-alert
        v-else-if="form.memberType === 'EMPTY'"
        title="将创建不包含初始成员的空群。"
        type="info"
        show-icon
        :closable="false"
      />
    </el-card>
  </div>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-section {
  border-color: var(--el-border-color-light);
}

.section-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-title strong {
  font-size: 16px;
}

.section-title p {
  margin: 3px 0 0;
  font-size: 13px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.section-number {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 8px;
}

.field-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-width {
  width: 100%;
}

.field-help {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1200px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
