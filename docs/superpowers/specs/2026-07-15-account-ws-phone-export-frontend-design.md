# 账号列表导出 WS 号码前端设计

## 背景与目标

后端已经提供 `POST /api/accounts/export-ws-phones`，前端需要在账号列表的“批量操作”菜单中增加“导出WS号”。用户只能导出明确勾选且状态全部正常的账号；导出前必须展示预计数量与预计文件名，并由用户二次确认。

本设计只覆盖账号列表前端接入，不修改后端接口，不扩展为按筛选条件导出，也不新增导出历史或异步任务。

## 已确认业务规则

1. “导出WS号”位于“一键抢登”之后、“批量删除”之前。
2. 未勾选账号时菜单项置灰；勾选后可点击。
3. 前端账号正常状态的判断口径为 `account_state === 2`。
4. 只要勾选项中存在一个非正常状态账号，本次导出就必须被阻止，用户需要重新勾选。
5. 阻止弹窗同时展示正常账号数和非正常账号数，便于用户核对。
6. 只有全部勾选账号均为正常状态时，才展示二次确认弹窗。
7. 二次确认展示前端预计数量和预计文件名；最终文件名与实际导出数量以后端响应头为准。
8. 单一有效分组使用分组文件名；多分组、包含未分组账号或没有有效分组名时使用 `全部WS号_YYYY-MM-DD.txt`。

## 交互设计

### 菜单状态

“导出WS号”菜单项满足以下状态：

- 未勾选：禁用。
- 已勾选且未在导出：可点击。
- 导出请求进行中：禁用，并由批量操作入口展示 loading，避免重复提交。

菜单项不会仅因为勾选项包含非正常账号而提前置灰。用户点击后会收到包含数量信息的统一警告弹窗，从而明确知道需要调整选择。

### 非正常状态阻断

点击菜单项后，前端先将勾选行分为：

- 正常状态账号：`account_state === 2`。
- 非正常状态账号：`account_state !== 2`，包括状态为空或未知值。

当非正常状态数量大于零时，使用 Element Plus 统一的 `ElMessageBox.alert`，标题为“无法导出WS号”，类型为 `warning`，内容包含：

```text
勾选的账号存在非正常状态的WS账号，请审核。
正常状态账号：X个
非正常状态账号：Y个
请重新勾选后再操作。
```

弹窗只提供“我知道了”，关闭后不调用导出接口。

### 二次确认

全部勾选账号均正常时，使用 `ElMessageBox.confirm` 展示：

- 预计导出 WS 号码数量：当前勾选账号数量。
- 预计导出文件名称：按“预计文件名”规则计算。
- 操作按钮：“取消”和“确认导出”。

这里明确使用“预计”措辞。后端还会过滤空号码、清洗号码并去重，因此实际导出数量可能小于勾选账号数量。

### 结果反馈

- 成功：下载文件后使用 `ElMessage.success` 提示“导出成功，共导出XX个WS号码。”，其中 `XX` 来自响应头 `X-Export-Count`。
- 无有效号码：不下载文件，使用 `ElMessage.warning` 展示后端消息“当前所选账号中没有可导出的有效WS号码。”。
- 其他业务失败：不下载文件，使用 `ElMessage.error` 原样展示后端 `message`。
- 网络异常、响应无法识别或后端没有提供有效提示：使用 `ElMessage.error` 展示“导出失败，请重新操作。”。

## 预计文件名规则

前端预计文件名必须与后端当前规则保持一致：

1. 对所有勾选账号读取 `group_name` 并去除首尾空白。
2. 只有所有账号都具有相同且非空的分组名时，才将该名称作为请求的 `groupName`。
3. 只要存在不同分组、未分组账号或空分组名，就不传 `groupName`。
4. 日期固定按 `Asia/Shanghai` 时区生成 `YYYY-MM-DD`，不依赖浏览器所在时区。
5. 分组名中的控制字符和 Windows 禁用字符 `< > : " / \\ | ? *` 替换为 `_`。
6. 清洗后的分组名为空时回退为“全部WS号”。

结果为：

- 单一有效分组：`<清洗后的分组名称>_YYYY-MM-DD.txt`。
- 其他情况：`全部WS号_YYYY-MM-DD.txt`。

预计文件名只用于确认弹窗。正式下载始终优先采用后端 `Content-Disposition` 中的文件名。

## 后端接口契约

请求：

```http
POST /api/accounts/export-ws-phones
Content-Type: application/json
```

单一有效分组请求体：

```json
{
  "ids": [101, 102],
  "groupName": "马来西亚客户组"
}
```

多分组或无有效分组请求体：

```json
{
  "ids": [101, 102]
}
```

成功响应不使用 Armada JSON 信封，而是直接返回 UTF-8 TXT：

- `Content-Type: text/plain;charset=UTF-8`
- `Content-Disposition`：最终文件名
- `X-Export-Count`：最终写入文件的唯一号码数量

业务失败仍返回项目统一 JSON：

```json
{
  "code": 40001,
  "message": "当前所选账号中没有可导出的有效WS号码。",
  "data": null
}
```

由于成功和失败共用同一个 HTTP 200 端点且响应体类型不同，本接口不能直接使用只适合 JSON 信封的 `armadaRequest`。

## 前端架构与职责

### `src/api/account.ts`

新增专用导出请求和结果类型：

```ts
interface TenantAccountWsPhoneExportInput {
  ids: number[];
  groupName?: string;
}

interface TenantAccountWsPhoneExportResult {
  filename: string;
  exportedCount: number;
  blob: Blob;
}
```

新增 `exportTenantAccountWsPhones(input)`：

1. 使用现有授权 `http` 客户端发起 POST，并设置 `responseType: "blob"`。
2. 通过响应回调读取 `Content-Type`、`Content-Disposition` 和 `X-Export-Count`。
3. 成功 TXT 响应解析最终文件名和实际数量，返回结构化结果。
4. JSON Blob 响应先读取文本并解析 `{code, message, data}`，再抛出携带后端 `message` 的错误。
5. JSON 解析失败、成功响应缺少必要元数据或响应类型无法识别时，抛出通用导出失败错误。

API 层只负责传输协议和响应解析，不触发浏览器下载，也不显示 UI 提示。

### `src/views/account/index/account-ws-phone-export.ts`

新增账号列表域内纯逻辑模块，负责：

- 按 `account_state === 2` 统计正常与非正常账号数量。
- 提取有效账号 ID。
- 判断是否属于同一有效分组。
- 生成请求中的可选 `groupName`。
- 按后端规则生成预计文件名。

纯逻辑与 UI、网络请求分离，避免继续扩大 `useAccountListPage.ts` 的职责，并允许精确验证状态和文件名边界。

若勾选行缺少有效整数 ID，视为账号数据异常，阻止请求并提示用户刷新列表后重试；不向后端提交不完整 ID 集合。

### `src/views/account/index/components/AccountListTable.vue`

新增：

- “导出WS号”下拉菜单项及固定顺序。
- `wsExporting` 属性。
- `export-ws-phones` 批量命令。

菜单只负责展示和派发事件，不直接访问 API。

### `src/views/account/index/composables/useAccountListPage.ts`

新增：

- `wsExporting` 响应式状态。
- `submitWsPhoneExport()` 导出编排函数。
- `handleBatchAction("export-ws-phones")` 分支。

编排顺序：

1. 防重复提交。
2. 读取当前勾选快照。
3. 校验账号状态和 ID。
4. 非正常状态弹窗并终止。
5. 构造预计数量、预计文件名和请求体。
6. 展示二次确认。
7. 用户确认后设置 loading 并调用 API。
8. API 成功后调用已有 `downloadBlobFile(filename, blob)`。
9. 展示后端实际数量。
10. 捕获并分类展示业务或网络错误。
11. 在 `finally` 中恢复 loading。

用户取消或关闭确认弹窗不显示错误，也不调用接口。

### `src/views/account/index/index.vue`

仅负责将 composable 返回的 `wsExporting` 传递给 `AccountListTable`。不在页面容器中重复实现导出逻辑。

## 数据流

```text
表格勾选行
  -> AccountListTable 派发 export-ws-phones
  -> useAccountListPage 分析选择
     -> 存在非正常账号：警告并终止
     -> 全部正常：展示预计数量和文件名
  -> 用户确认
  -> account API POST Blob 请求
     -> JSON 失败：解析 message，不下载
     -> TXT 成功：解析文件名和实际数量
  -> downloadBlobFile
  -> 成功提示
```

## 错误处理与并发

- 前端状态校验改善即时反馈；后端仍以当前租户、所选 ID、未删除和正常状态进行最终过滤，避免前后端状态变化导致越权或错误导出。
- `wsExporting` 在请求开始前置为 `true`，请求结束后恢复，防止重复点击生成多个下载。
- 勾选内容在点击时生成快照，确认弹窗打开后不会重新读取可变选择；实际请求与用户确认内容保持一致。
- 用户取消确认属于正常流程，不展示失败提示。
- 接收到 JSON 业务响应时绝不调用 `downloadBlobFile`，避免下载包含错误 JSON 的伪 TXT 文件。
- 成功提示不得使用预计数量，必须使用后端 `X-Export-Count`。

## 测试策略

实施阶段遵循项目现有测试方式，覆盖：

### 纯逻辑

- 空选择、全部正常、混合状态、状态为空。
- 正常和非正常数量分别统计。
- 缺失或非法账号 ID 被阻止。
- 单一分组、多分组、包含未分组账号和空分组名。
- 上海时区日期及文件名非法字符清洗。

### API

- 使用 POST、正确 URL、`ids/groupName` 请求体和 Blob 响应类型。
- 成功响应解析中文 `Content-Disposition` 文件名和 `X-Export-Count`。
- JSON Blob 中的无有效号码提示被解析并抛出。
- 通用失败消息被保留。
- JSON、TXT 之外的异常响应被拒绝。

### 组件与编排

- 菜单项位于“一键抢登”之后、“批量删除”之前。
- 未选择及导出中状态正确禁用。
- 混合状态展示两类数量且不调用 API。
- 全部正常展示预计数量和预计文件名。
- 用户取消不调用 API。
- 成功只触发一次下载并使用实际数量提示。
- 无有效号码和通用失败均不下载文件。
- 重复点击不会发起并发导出请求。

完成后运行账号列表相关测试、API 相关测试、typecheck、定向 ESLint、Prettier、Stylelint 和生产构建。

## 非目标

- 不修改后端导出规则或新增预览接口。
- 不支持不勾选时按全部账号或当前筛选条件导出。
- 不允许自动跳过非正常账号后继续导出。
- 不在前端清洗、去重或拼接最终 WS 号码文件内容。
- 不新增导出历史、审计记录、异步任务或同名文件序号。
- 不顺带重构账号列表其他批量操作。

## 自检

- 交互、接口、错误处理、文件名和测试边界均有明确口径。
- 非正常账号必须整批阻止，与后端仅导出正常账号的防御性过滤不冲突。
- 预计数量与实际数量职责分离：前端展示勾选数量，后端返回清洗去重后的真实数量。
- 多分组不传 `groupName`，确认弹窗与后端默认文件名保持一致。
- JSON 业务失败与 TXT 成功响应已分别处理，不会把错误响应下载为文件。
- 范围只涉及账号列表 WS 号码导出，没有未决实现项。
