# Marketing Detail Element Plus Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom CSS Grid inside the marketing-detail expand row with a resizable Element Plus table whose last two columns remain ordinary horizontally scrollable columns.

**Architecture:** Keep the outer account summary `ElTable` unchanged. Render `MarketingTaskAccountTargetRow.groups` through a nested bordered `ElTable`, reuse the existing status helpers and value formatting, and let Element Plus own column resizing and horizontal overflow.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Element Plus `ElTable` / `ElTableColumn`, Node test runner.

---

### Task 1: Convert the expanded group detail to Element Plus

**Files:**

- Modify: `src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts`
- Modify: `src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue`

- [ ] **Step 1: Write the failing structural regression test**

Update the field-order test to isolate the nested table and add a dedicated table-behavior test:

```ts
function groupTableSource(): string {
  const groupTable = source.match(
    /<el-table\s+class="group-rollup-table"[\s\S]*?<\/el-table>/
  );
  assert.ok(groupTable, "group detail should use an Element Plus table");
  return groupTable[0];
}

it("renders the exact account and group detail fields in order", () => {
  assert.match(
    source,
    /label="在线状态"[\s\S]*label="发送账号"[\s\S]*label="账号发送总条数"[\s\S]*label="账号失败条数"[\s\S]*label="账号跳过条数"[\s\S]*label="明细"/
  );
  assert.match(
    groupTableSource(),
    /label="当前关系"[\s\S]*label="最后协议状态"[\s\S]*label="群名称"[\s\S]*label="群 GID"[\s\S]*label="成功"[\s\S]*label="失败"[\s\S]*label="跳过"[\s\S]*label="最后发送时间"[\s\S]*label="最后执行"/
  );
  assert.doesNotMatch(source, />群组链接</);
  assert.doesNotMatch(source, />最近原因</);
  assert.doesNotMatch(source, />发言号码</);
});

it("uses resizable Element Plus columns without fixing the last columns", () => {
  const groupTable = groupTableSource();
  assert.match(groupTable, /:data="asAccountRow\(row\)\.groups"/);
  assert.match(groupTable, /<el-table-column[\s\S]*?resizable/);
  assert.doesNotMatch(groupTable, /\sfixed(?:=|\s|>)/);
  assert.doesNotMatch(source, /group-rollup-header|group-rollup-detail-row/);
  assert.doesNotMatch(source, /min-width:\s*1280px/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts
```

Expected: FAIL with `group detail should use an Element Plus table`, because the component still renders `.group-rollup-header` and `.group-rollup-detail-row` CSS Grid elements.

- [ ] **Step 3: Replace the custom grid with the nested Element Plus table**

Replace the contents of `.group-rollup-expand` with the following table. Keep the two final columns free of `fixed`:

```vue
<el-table
  class="group-rollup-table"
  :data="asAccountRow(row).groups"
  :row-key="groupRowKey"
  border
>
  <el-table-column label="当前关系" width="120" resizable>
    <template #default="{ row: group }">
      <el-tag
        size="small"
        effect="plain"
        :type="groupMembershipStatusMeta(group.membershipStatus).tagType"
      >
        {{ groupMembershipStatusMeta(group.membershipStatus).label }}
      </el-tag>
    </template>
  </el-table-column>
  <el-table-column label="最后协议状态" width="130" resizable>
    <template #default="{ row: group }">
      <el-tag
        size="small"
        effect="plain"
        :type="groupSendStatusMeta(group.groupStatus).tagType"
        :class="groupSendStatusMeta(group.groupStatus).className"
      >
        {{ groupSendStatusMeta(group.groupStatus).label }}
      </el-tag>
    </template>
  </el-table-column>
  <el-table-column label="群名称" min-width="180" show-overflow-tooltip resizable>
    <template #default="{ row: group }">
      {{ group.groupName || group.groupJid || "未命名群组" }}
    </template>
  </el-table-column>
  <el-table-column label="群 GID" width="230" show-overflow-tooltip resizable>
    <template #default="{ row: group }">
      {{ group.groupJid || "-" }}
    </template>
  </el-table-column>
  <el-table-column prop="sentMessageCount" label="成功" width="80" resizable />
  <el-table-column prop="failedMessageCount" label="失败" width="80" resizable />
  <el-table-column label="跳过" width="80" resizable>
    <template #default="{ row: group }">
      {{ group.skippedMessageCount ?? 0 }}
    </template>
  </el-table-column>
  <el-table-column label="最后发送时间" width="180" resizable>
    <template #default="{ row: group }">
      {{ formatEpoch(group.lastSentAt) }}
    </template>
  </el-table-column>
  <el-table-column label="最后执行" min-width="240" resizable>
    <template #default="{ row: group }">
      <div class="group-execution">
        <el-tag
          v-if="groupExecutionResultMeta(group.executionResult).tagged"
          size="small"
          effect="plain"
          :type="groupExecutionResultMeta(group.executionResult).tagType"
        >
          {{ groupExecutionResultMeta(group.executionResult).label }}
        </el-tag>
        <span v-else class="group-rollup-empty">-</span>
        <span
          v-if="['FAILED', 'SKIPPED'].includes(group.executionResult ?? '')"
          class="group-execution-reason"
          :title="group.executionReason || '未知原因'"
        >
          {{ group.executionReason || "未知原因" }}
        </span>
      </div>
    </template>
  </el-table-column>
  <template #empty>
    <div class="group-rollup-empty group-rollup-expand-empty">
      暂无发送记录
    </div>
  </template>
</el-table>
```

Delete the obsolete `.group-rollup-header`, `.group-rollup-detail-row`, `.group-rollup-detail-list`, `.group-rollup-text`, `.group-rollup-number`, `.group-rollup-time`, and responsive Grid rules. Keep only the styles still referenced by the nested table:

```css
.group-rollup-expand {
  padding: 10px 24px 10px 72px;
  background: var(--el-fill-color-lighter);
}

.group-rollup-table {
  width: 100%;
}

.group-status--no-permission {
  --el-tag-bg-color: rgb(147 51 234 / 10%);
  --el-tag-border-color: rgb(147 51 234 / 45%);
  --el-tag-text-color: #9333ea;
}

.group-execution {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.group-execution-reason {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.group-rollup-empty {
  color: var(--el-text-color-secondary);
}

.group-rollup-expand-empty {
  padding: 16px;
  text-align: center;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts
```

Expected: all tests in the file pass with zero failures.

- [ ] **Step 5: Run project verification**

Run:

```bash
pnpm exec prettier --check src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts
pnpm exec eslint --max-warnings 0 src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts
pnpm typecheck
pnpm build
git diff --check
```

Expected: every command exits with status 0. The build may print existing bundle-size warnings, but it must complete successfully.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue src/views/task/group-marketing/components/GroupMarketingDetailDrawer.test.ts docs/superpowers/plans/2026-07-22-marketing-detail-element-table.md
git commit -m "fix: 营销任务明细改用可调列表格"
```
