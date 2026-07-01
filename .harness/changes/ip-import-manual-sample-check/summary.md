# IP 导入手动抽样检测

## 背景

IP 管理 TXT 批量导入不再由导入动作自动触发检测。业务人员需要在导入弹框中先选择国家并手动点击检测,检测通过后才能点击导入。

## 前端范围

- `src/api/resource-ip.ts` 新增导入前抽样检测接口封装。
- `src/views/resource/ip/components/IpImportDialog.vue` 增加国家选择、检测按钮和导入按钮禁用状态。
- `src/views/resource/ip/composables/useResourceIpPage.ts` 保存检测通过状态,在导入参数变化时清空。

## 后端配合

后端 `armada` 新增 `POST /api/ip-proxies/import/sample-check`。本前端只保存检测通过状态,导入接口不使用 token 强校验。
