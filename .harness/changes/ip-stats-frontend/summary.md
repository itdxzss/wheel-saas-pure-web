# 变更记录：IP 数据统计前端接入

- 日期 / 分支: 2026-07-01 / 当前工作区
- 需求来源: `0701IP管理、IP数据统计需求页面.html`
- 状态: 进行中

## 目标

在运营管理下新增 `IP 数据统计` 页面，接入 armada 的 IP 统计接口，展示总览、国家/地区维度统计和国家 IP 明细。

## 范围

- In scope:
  - 前端 typed API：总览、国家/地区统计、国家 IP 明细。
  - mock 动态路由新增 `IP 数据统计` 菜单。
  - 页面展示总览卡片、Top10、筛选、国家表、明细抽屉。
- Out of scope:
  - 检测、抽检执行、全量检测。
  - 导出、批量删除。
  - 无 IP 国家数、系统支持国家总数。
  - 国家维度最近检测时间、最近使用时间、待检测 IP 数。

## 影响模块

- 路由: `mock/asyncRoutes.ts`
- 页面: `src/views/resource/ip-stats/`
- API: `src/api/resource-ip-stats.ts`
- Store: 无
- 权限: `module_key=resource_ip_stats`, `perm_key=tenant:resource:ip-stats:list`

## 关键设计决策

- 后端作为统计事实源，前端不拉全量 IP 自行聚合。
- 使用 `PureTableBar`、`WheelPagination`、`ElTable`、`ElDrawer`，不自造表格、分页或抽屉。
- 原型中未接入后端的动作和字段不在页面展示，避免生产路径假数据兜底。

## 验证

```bash
./node_modules/.bin/tsc --noEmit
```

结果：通过，无输出。

```bash
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
```

结果：通过，无输出。

```bash
./node_modules/.bin/vite build
```

结果：通过，`✓ built in 5.69s`。

```bash
git diff --check
```

结果：通过，无输出。

`pnpm exec tsc --noEmit` 因本机 corepack 访问 npm registry 证书链失败未能启动，已改用项目本地二进制执行同等检查。

## 人工验收

- [ ] 菜单进入页面
- [ ] 刷新页面不丢路由
- [ ] 查询 / 重置
- [ ] 分页
- [ ] 权限态
- [ ] 错误态

## 遗留 / 跟进

- 后端提供国家主数据覆盖口径后，再补 `支持国家数 / 无 IP 国家数`。
- 检测、抽检执行、导出、批量删除另起切片实现。
