<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { MarketingTemplateRow } from "@/api/marketing-template";
import type {
  GroupCreationMarketingAccount,
  GroupCreationMarketingCreateForm,
  GroupCreationMarketingMatchRow,
  GroupCreationMarketingUploadedMaterial
} from "../composables/useGroupCreationMarketingPage";
import Delete from "~icons/ep/delete";
import Upload from "~icons/ep/upload";

defineOptions({
  name: "GroupCreationMarketingCreateDrawer"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  accountGroupUsableCounts: Record<number, number>;
  accounts: GroupCreationMarketingAccount[];
  marketingTemplates: MarketingTemplateRow[];
  materialFiles: GroupCreationMarketingUploadedMaterial[];
  matchRows: GroupCreationMarketingMatchRow[];
  unmatchedFiles: GroupCreationMarketingUploadedMaterial[];
  createBlockReason: string;
}>();

const emit = defineEmits<{
  (event: "account-group-change", value: number | ""): void;
  (event: "files-add", files: File[]): void;
  (event: "remove-file", index: number): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<GroupCreationMarketingCreateForm>("form", {
  required: true
});

const matchedCount = computed(() => props.matchRows.length);
const materialCount = computed(() => props.materialFiles.length);

function onFileChange(file: { raw?: File }): void {
  if (file.raw) {
    emit("files-add", [file.raw]);
  }
}

function countParticipants(content: string): number {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean).length;
}

function fileIndex(row: GroupCreationMarketingUploadedMaterial): number {
  return props.materialFiles.indexOf(row);
}

function asMaterialRow(row: unknown): GroupCreationMarketingUploadedMaterial {
  return row as GroupCreationMarketingUploadedMaterial;
}

function accountGroupLabel(group: AccountGroupApiRow): string {
  return `${group.name}（正常在线 ${props.accountGroupUsableCounts[group.id] ?? 0}）`;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="920px"
    destroy-on-close
    title="新增建群营销"
  >
    <el-form :model="form" label-width="126px" class="create-form">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="form.taskName"
          clearable
          placeholder="请输入任务名称"
        />
      </el-form-item>
      <el-form-item label="账号分组" required>
        <el-select
          v-model="form.accountGroupId"
          filterable
          class="form-control"
          placeholder="请选择账号分组"
          @change="value => emit('account-group-change', value)"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="accountGroupLabel(group)"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="营销模板" required>
        <el-select
          v-model="form.marketingTemplateId"
          filterable
          class="form-control"
          placeholder="请选择营销模板"
        >
          <el-option
            v-for="template in marketingTemplates"
            :key="template.id"
            :label="template.templateName"
            :value="template.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发送间隔" required>
        <el-input-number
          v-model="form.sendIntervalSeconds"
          :min="1"
          :step="1"
        />
        <span class="unit">秒</span>
      </el-form-item>
      <el-form-item label="群名前缀">
        <el-input
          v-model="form.groupNamePrefix"
          clearable
          placeholder="可选；为空时使用任务名称"
        />
      </el-form-item>
      <el-form-item label="料子文件" required>
        <div class="upload-row">
          <el-upload
            multiple
            :auto-upload="false"
            :show-file-list="false"
            accept=".txt,.csv"
            :on-change="onFileChange"
          >
            <el-button :icon="useRenderIcon(Upload)">选择文件</el-button>
          </el-upload>
          <span class="muted">
            正常在线账号 {{ accounts.length }} 个 · 文件 {{ materialCount }} 个
            · 可执行 {{ matchedCount }} 个
          </span>
        </div>
      </el-form-item>
      <el-form-item label="顺序匹配">
        <el-table :data="matchRows" border max-height="260" class="match-table">
          <el-table-column type="index" label="#" width="56" />
          <el-table-column
            prop="accountPhone"
            label="执行账号"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column prop="accountStatus" label="账号状态" width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.accountStatus === '在线' ? 'success' : 'warning'"
                effect="plain"
              >
                {{ row.accountStatus || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="fileName"
            label="料子文件"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column label="号码数" width="90">
            <template #default="{ row }">
              {{ countParticipants(row.content) }}
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item v-if="unmatchedFiles.length" label="未匹配文件">
        <el-table :data="unmatchedFiles" border max-height="180">
          <el-table-column prop="fileName" label="文件名" min-width="220" />
          <el-table-column label="号码数" width="90">
            <template #default="{ row }">
              {{ countParticipants(row.content) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="emit('remove-file', fileIndex(asMaterialRow(row)))"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="已选文件">
        <el-table :data="materialFiles" border max-height="220">
          <el-table-column type="index" label="#" width="56" />
          <el-table-column prop="fileName" label="文件名" min-width="220" />
          <el-table-column label="号码数" width="90">
            <template #default="{ row }">
              {{ countParticipants(row.content) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ $index }">
              <el-tag
                v-if="$index < accounts.length"
                size="small"
                effect="plain"
              >
                已匹配
              </el-tag>
              <el-tag v-else size="small" type="warning" effect="plain">
                未匹配
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ $index }">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="emit('remove-file', $index)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-alert
        v-if="createBlockReason"
        class="footer-alert"
        :title="createBlockReason"
        type="warning"
        show-icon
        :closable="false"
      />
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="Boolean(createBlockReason)"
        @click="emit('submit')"
      >
        保存任务
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.create-form {
  padding-right: 12px;
}

.form-control,
.match-table {
  width: 100%;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.muted {
  color: var(--el-text-color-secondary);
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.footer-alert {
  display: inline-flex;
  width: auto;
  margin-right: 12px;
  vertical-align: middle;
}
</style>
