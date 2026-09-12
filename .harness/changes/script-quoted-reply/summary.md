# 养群剧本回复引用

2026-09-11；在主工作目录 `1.0.3-snapshot` 实施。增加回复选择、原句定位与预览，保护删除/排序，保留稳定步骤 ID，复制时正确重建关系，并展示本次普通发送原因。

用户确认：原句失败时回复继续按普通消息发送；这个执行决策在 Armada 后端完成，协议收到 replyTo 时严格校验同群及内容契约。

[完整实施、测试、基线问题及发布边界](../../../../armada/.harness/changes/script-quoted-reply/summary.md)。已于 2026-09-11 配套部署 test1，详见[发布核验记录](../../../../armada/.harness/changes/script-quoted-reply/deployment.md)。尚未提交或进行成员手机验收。不能混跑不支持引用的旧协议节点。

[本地页面验证截图](editor.png)
