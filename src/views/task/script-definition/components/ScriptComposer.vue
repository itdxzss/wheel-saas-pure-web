<script setup lang="ts">
import { computed } from "vue";
import { ElMessageBox } from "element-plus";
import type { EditableStep } from "@/views/task/script-marketing/form";
import { useScriptComposer } from "../composables/useScriptComposer";
import ScriptRolesPane from "./ScriptRolesPane.vue";
import ScriptTimeline from "./ScriptTimeline.vue";
import ScriptMessageInspector from "./ScriptMessageInspector.vue";

const steps = defineModel<EditableStep[]>({ required: true });
const {
  roles,
  activeKey,
  activeIndex,
  activeStep,
  defaultMin,
  defaultMax,
  inherited,
  estimate,
  roleFor,
  count,
  renameRole,
  addRole,
  removeRole,
  assignRole,
  syncDefaults,
  useDefault,
  applyDefaults,
  addMessage,
  duplicate,
  move,
  removeMessage,
  validate
} = useScriptComposer(steps);
const counts = computed(() =>
  Object.fromEntries(roles.value.map(role => [role.key, count(role)]))
);
async function confirmDefaults() {
  try {
    await ElMessageBox.confirm(
      "将所有消息改为沿用默认等待时间，已有的单独设置会被替换。",
      "应用到全部消息",
      {
        type: "warning",
        confirmButtonText: "应用到全部",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }
  applyDefaults();
}
defineExpose({ validate });
</script>

<template>
  <div class="script-composer">
    <div class="composer-toolbar">
      <div class="composer-title">
        <h3>角色与消息编排</h3>
        <p class="muted">选择角色添加消息 → 调整对话顺序 → 点击消息编辑内容</p>
      </div>
      <div class="global-delay">
        <strong>默认等待</strong>
        <el-input-number
          v-model="defaultMin"
          aria-label="默认最小等待秒数"
          :min="0"
          :max="86400"
          :precision="0"
          :controls="false"
          size="small"
          @change="syncDefaults"
        />
        <span>至</span>
        <el-input-number
          v-model="defaultMax"
          aria-label="默认最大等待秒数"
          :min="defaultMin || 0"
          :max="86400"
          :precision="0"
          :controls="false"
          size="small"
          @change="syncDefaults"
        />
        <span>秒</span
        ><el-button size="small" @click="confirmDefaults">应用到全部</el-button>
        <p class="muted">新增消息默认沿用，已单独设置的不变</p>
      </div>
      <div class="composer-stats">
        <el-tag effect="plain"
          >{{ roles.length }} 个角色 · {{ steps.length }} / 100 句对话</el-tag
        >
        <p class="muted">
          预计每群等待 {{ estimate[0] }}–{{ estimate[1] }} 秒，不含发送耗时
        </p>
      </div>
    </div>
    <div class="composer-columns">
      <ScriptRolesPane
        :roles="roles"
        :counts="counts"
        :active-role="roleFor(activeStep)?.key"
        :full="steps.length >= 100"
        @add="addRole"
        @rename="renameRole"
        @remove="removeRole"
        @message="addMessage"
      />
      <ScriptTimeline
        :steps="steps"
        :roles="roles"
        :counts="counts"
        :active-key="activeKey"
        @select="activeKey = $event"
        @add="addMessage()"
        @move="move"
        @duplicate="duplicate"
        @insert="index => addMessage(roleFor(steps[index])?.key, index + 1)"
        @remove="removeMessage"
      />
      <ScriptMessageInspector
        v-if="activeStep"
        :model-value="activeStep"
        :steps="steps"
        :index="activeIndex"
        :roles="roles"
        :role-key="roleFor(activeStep)?.key"
        :inherited="inherited.has(activeStep.key)"
        :default-min="defaultMin"
        :default-max="defaultMax"
        @role="assignRole(activeStep, $event)"
        @inherit="useDefault(activeStep, $event)"
        @locate="
          id => {
            activeKey =
              steps.find(step => step.stepId === id)?.key || activeKey;
          }
        "
      />
      <section v-else class="composer-pane">
        <el-empty description="选择一句对话，在这里编辑或预览" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.script-composer {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.composer-toolbar {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0;
}

.composer-title h3 {
  margin-bottom: 6px;
  font-size: 16px;
}

.global-delay {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.global-delay .el-input-number {
  width: 68px;
}

.global-delay p {
  flex-basis: 100%;
}

.composer-stats p {
  margin-top: 6px;
}

.composer-columns {
  display: grid;
  flex: 1;
  grid-template-columns: 210px minmax(320px, 1fr) minmax(380px, 1.12fr);
  gap: 14px;
  min-height: 0;
}

.script-composer :deep(.composer-pane) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.script-composer :deep(.pane-header) {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.script-composer :deep(.pane-scroll) {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  overscroll-behavior: contain;
}

.script-composer :deep(.muted) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.script-composer :deep(.el-form-item__label) {
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 20px;
}

@media (width <= 1200px) {
  .composer-columns {
    grid-template-columns: 190px minmax(270px, 1fr) minmax(330px, 1.12fr);
    gap: 10px;
  }
}

@media (width <= 1000px) {
  .composer-columns {
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.2fr);
  }

  .script-composer :deep(.roles-pane) {
    grid-column: 1 / -1;
    max-height: 250px;
  }
}

@media (width <= 700px) {
  .script-composer {
    flex: none;
  }

  .composer-columns {
    display: flex;
    flex-direction: column;
  }

  .script-composer :deep(.timeline-pane) {
    height: 350px;
  }

  .script-composer :deep(.inspector-pane) {
    max-height: 720px;
  }
}
</style>
