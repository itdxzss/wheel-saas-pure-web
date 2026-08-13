<script setup lang="ts">
import { watch } from "vue";
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

watch(
  () => form.value.memberType,
  memberType => {
    if (memberType === "EMPTY") form.value.memberCount = 1;
  }
);

watch(
  () => form.value.secondaryManagerGroupId,
  groupId => {
    if (!groupId) {
      form.value.secondaryManagerCount = 0;
    } else if (form.value.secondaryManagerCount === 0) {
      form.value.secondaryManagerCount = 1;
    }
  }
);
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

      <div class="field-columns">
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
          <div class="field-help">展示当前账号分组及在线账号数量。</div>
        </el-form-item>

        <el-form-item required>
          <template #label>
            创群号自动退群
            <CommonGroupHelp
              content="任务完成后，创群账号是否自动退出已创建的群组。"
            />
          </template>
          <el-radio-group v-model="form.creatorAutoLeave">
            <el-radio-button :value="false">留群</el-radio-button>
            <el-radio-button :value="true">自动退群</el-radio-button>
          </el-radio-group>
          <div class="field-help">
            默认留群；选择自动退群后，任务完成时执行退群。
          </div>
        </el-form-item>
      </div>

      <div class="field-columns secondary-admin-fields">
        <el-form-item :error="errors.secondaryManagerGroupId">
          <template #label>
            次管理员分组
            <CommonGroupHelp
              content="从当前账号分组中选择次管理员账号。"
            />
          </template>
          <el-select
            v-model="form.secondaryManagerGroupId"
            filterable
            clearable
            placeholder="请选择次管理员分组"
            class="full-width"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="`${group.name}（在线 ${group.onlineAccounts}）`"
              :value="group.id"
            />
          </el-select>
          <div class="field-help">
            可选；展示当前账号分组及在线账号数量。
          </div>
        </el-form-item>

        <el-form-item :error="errors.secondaryManagerCount">
          <template #label>
            次管理员入群数量
            <CommonGroupHelp
              content="每个新建群组与创群账号、普通成员一起入群的次管理员账号数量。"
            />
          </template>
          <el-input-number
            v-model="form.secondaryManagerCount"
            :min="form.secondaryManagerGroupId ? 1 : 0"
            :max="1024"
            :step="1"
            step-strictly
            :disabled="!form.secondaryManagerGroupId"
            class="full-width"
          />
          <div class="field-help">
            可选；选择次管理员分组后，建群成功时将这些账号设置为管理员。
          </div>
        </el-form-item>
      </div>
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
            content="控上号按配置选择成员；空群固定选择 1 个成员，与建群人共同建群。"
          />
        </template>
        <el-radio-group v-model="form.memberType">
          <el-radio-button value="CONTROLLED">控上号</el-radio-button>
          <el-radio-button value="CUSTOM" disabled>自定义号码</el-radio-button>
          <el-radio-button value="EMPTY">空群</el-radio-button>
        </el-radio-group>
        <div class="field-help">选择后自动切换下方成员配置字段。</div>
      </el-form-item>

      <template v-if="form.memberType !== 'CUSTOM'">
        <div class="field-columns">
          <el-form-item required :error="errors.memberGroupId">
            <template #label>
              成员分组
              <CommonGroupHelp content="作为每个群组初始成员来源的账号分组。" />
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
            <div class="field-help">
              空群模式也会从该分组选择 1 个真实成员。
            </div>
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
              :disabled="form.memberType === 'EMPTY'"
              :step="1"
              step-strictly
              class="full-width"
            />
            <div class="field-help">
              {{
                form.memberType === "EMPTY"
                  ? "空群模式固定为 1。"
                  : "每个群组计划加入的控上成员数。"
              }}
            </div>
          </el-form-item>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
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

.secondary-admin-fields {
  margin-top: 16px;
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

@media (width <= 760px) {
  .field-columns {
    grid-template-columns: 1fr;
  }
}
</style>
