# 登录验证码临时关闭与会话时长调整

## 变更概述

- 登录页暂时关闭图片验证码加载、输入、校验和提交。
- 验证码相关前端代码保留为带恢复条件的注释，后续可与后端同步启用。
- 后端登录暂时跳过验证码消费校验，并将会话空闲失效时间从 30 分钟延长到 2 小时。

## 影响模块

- 前端登录页、登录请求类型、用户登录动作。
- Armada 后端认证服务及 Redis 登录会话配置。

## API 变更

- `POST /api/public/auth/login` 当前仅要求 `username`、`password`；后端 DTO 暂时保留验证码字段以便恢复。
- `GET /api/public/auth/captcha` 保留不变，当前登录页不调用。

## 数据与缓存变更

- 无数据库变更。
- Redis 会话空闲 TTL 默认值调整为 2 小时；24 小时绝对上限保持不变。

## 关键约束

- 前后端必须在同名 `1.0.2-snapshot-login` 分支配套发布。
- 恢复验证码时必须同时恢复前端字段、校验、加载与提交，以及后端 `CaptchaService.consume` 校验和对应测试。

## 回滚方案

- 回退前后端本次提交即可恢复验证码登录和 30 分钟空闲 TTL。

## 验证

- `node --test src/views/login/LoginPageContract.test.ts`：2/2 通过。
- 目标文件 Prettier 检查通过。
- 目标 TypeScript / Vue 文件 ESLint 检查通过，零 warning。
- `pnpm exec tsc --noEmit` 通过。
- `pnpm exec vue-tsc --noEmit --skipLibCheck` 通过。
- `pnpm build` 生产构建通过。
