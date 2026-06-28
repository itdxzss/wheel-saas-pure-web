# 群组营销任务前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `wheel-saas-pure-web` 中迁移「群组营销任务」菜单，并对接 armada 一期营销任务接口。

**Architecture:** 新增 `task/group-marketing` 页面域，API 封装放在 `src/api`，页面状态放 composable，表格和抽屉拆成局部组件。组件全部使用 pure-admin-thin 与 Element Plus，不迁移旧 wheel 手写控件。

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, pure-admin-thin, Element Plus, armada API envelope.

---

## Tasks

- [ ] 写 RED 验收脚本 `scripts/verify-marketing-task-menu.mjs` 并确认当前失败。
- [ ] 新增 `src/api/marketing-task.ts` 和 `src/api/marketing-template.ts`。
- [ ] 新增 `/task/group-marketing` 动态路由。
- [ ] 新增页面 constants、composable、表格组件、创建抽屉、详情抽屉、素材抽屉、入口页。
- [ ] 运行验收脚本、typecheck、定向 lint/stylelint、build。
- [ ] 启动本机预览并提供 URL。
