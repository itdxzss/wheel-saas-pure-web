# 云手机多选注册入口

2026-09-17 用户明确要求控端支持多选，CP-10 仅为首台验收设备。CloudRegistrationPanel 改为 Element Plus 多选表格，读取后端本租户已绑定手机目录，不手填 UUID。逐机保存现有采购许可，单台单号；确认框列出手机名称、数量、单价和本批上限。

新增 src/api/cloud-registration.ts -> GET /api/account-registrations/cloud-phones。后端需要对应新版本和已批准的设备绑定才有目录，不以本地假数据兜底。沿用既有 device-registration API；没有数据库或 Redis 变更。

useCloudRegistration 维护逐机 current/pending/error，冻结每个 requestId、预算、商家、有效期；部分失败仅重试未确认原请求，查询确认已有别的许可时拒绝覆盖，离开页面后停止提交后续手机。已存在任务设备不在此入口新建下一笔。手机就绪与采购由本机执行器完成，前端没有调用 start。

验证：12项相关测试；typecheck、ESLint、Stylelint、production build通过。多选与部分提交失败测试、离页中断及已有许可冲突测试均先红后绿。没有真实购号/短信/注册验收；控端没有执行器心跳。

未提交、未推送、未部署 test1。此前新增CP10身份/重启被自动审批拒绝，等待明确多机名单和发布范围。回滚仅撤本次云手机 API、Panel、composable及index云手机tab；不可覆盖原有未提交设备注册代码或其他在途改动。

## 2026-09-17 test1 发布结果

用户授权后完成发布，CP-10、CP-8 已按 tenant 1 绑定独立身份。独立发布分支 release/cloud-registration-test1-20260917：后端 384a2644，前端 5a522b8a，两个发布工作树保持 clean；本地已提交，未推送，主工作区其他在途改动未发布。

发布目录后端59项、前端19项测试通过，前端类型/lint/build通过。部署脚本测试通过；生产离线包测试因既有缺失 prod/protocol/.env.example 失败，不属于 test1 路径。

首次部署前端静态资源受 umask 077 影响返回403；已用同一提交、umask 022 单独重发前端，脚本 exit 0。后端不重复发布。运行中 JAR/index SHA256 与本地构建一致，两个容器 running、restartCount=0。V200 已由 Flyway 成功执行，仅增加注册失败类别/详情两列；无手动 ALTER。

两台 HTTPS status 均返回设备过滤器的 HTTP404/code404（身份通过且无许可）；CP10令牌搭配CP8设备ID被401拒绝。原 token 身份及原免令牌测试身份全部保留，运行环境仅 ARMADA_DEVICE_REGISTRATION_CLIENTS_JSON 改变。

未创建注册许可、未启动执行器、未购号。新开的浏览器停在登录页，未完成登录后多选界面验收，也未验证真实收码/注册成功。入口 http://armada.65.2.123.53.nip.io/ 。两台本机配置在 helper/.cloud-registration/，批量清单 test1-fleet.json；秘密不在本记录内。

回滚备份 /home/app/armada-cloud-registration-backups/20260917-multiselect，包含旧运行JAR、前端dist、配置和旧镜像映射。回滚前后端/身份配置需配套；无需删除新增可空列，不能把停止执行器当作取消接码订单。脱敏证据见 armada/docs/operations/evidence/cloud-registration-test1-20260917/result.json。
