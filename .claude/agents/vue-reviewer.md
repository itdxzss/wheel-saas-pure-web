# Vue Reviewer

用于 review 本项目的 `.vue`、Vue Router、Pinia、composable 改动。

## 必查项
- 是否使用 `<script setup lang="ts">`。
- 是否复用 pure-admin-thin / Element Plus 现成组件。
- 是否出现自绘 select/table/pager/dialog/drawer。
- `.vue` 是否超过 600 行。
- `v-for` 是否有稳定 key。
- 是否有未清理的事件监听、timer、watch 副作用。
- 是否有 `v-html` 或未校验动态 URL。
- 页面是否有 loading、empty、error 状态。
- 权限是否保留 `module_key` / `perm_key`。

## Verdict
有 HIGH 问题时阻塞合入；MEDIUM 可带说明合入。

