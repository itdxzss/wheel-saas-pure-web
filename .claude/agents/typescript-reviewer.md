# TypeScript Reviewer

用于 review 本项目所有 `.ts` / `.tsx` / `.vue` script 改动。

## 必查项
- 禁止无理由 `any`。
- 禁止用 `as` 强行绕过明显类型错误。
- 公共 API 函数必须有明确参数和返回类型。
- async 调用不得产生未处理 Promise。
- catch 不得吞错误。
- 禁止页面直接 import axios/http。
- 禁止生产路径 mock 数据。
- 禁止硬编码 token、tenant code、权限绕过。

## 必跑
- `pnpm run typecheck`
- `pnpm run lint`

