# 公开推广页 WhatsApp 配对接口接入

## 目标

- 约会二代、基础领奖及后续推广模板共用同一套配对会话逻辑。
- 模板仅维护自己的视觉组件，不复制接口、轮询和状态机代码。

## 接口

- `POST /api/public/promotion-channels/{channelCode}/pairing-sessions`
- `GET /api/public/promotion-pairing-sessions/status`
- 查询请求通过 `X-Pairing-Session-Token` 传递一次性令牌。

## 状态处理

- `REQUESTING`：生成配对码。
- `WAITING_CONFIRMATION`：展示后端返回的原始配对码并继续轮询。
- `FINALIZING`：隐藏配对码，展示账号初始化状态并继续轮询。
- `SUCCEEDED`：停止轮询并进入模板成功态。
- `FAILED` / `EXPIRED`：停止轮询，展示原因并允许重新创建会话。

## 安全约束

- `sessionToken` 只保存在页面内存，不写入 URL、日志或本地存储。
- 浏览器只调用 Armada 公开接口，不直接调用协议层。
- 手机号按“国际区号 + 本地号码”合并，并清理为 10～15 位纯数字。
