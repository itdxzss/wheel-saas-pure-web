# 认证码导号切换账号（2026-09-27）

## 行为

- 等待确认/申请中/成功页面提供“切换账号”，清空号码和备注，保留所选分组。
- 关闭再打开回到手机号输入页，不恢复旧会话。
- 切换、关闭和卸载时停止轮询并使旧版本失效；已发出的创建/轮询响应不再回写页面，旧请求 finally 也不修改新请求状态。
- 表单异步校验结束前若会话已切换，不提交旧操作；状态页显示当前号码。
- 本次只改变前端交互。旧服务端配对按原有效期结束，不宣称已立即取消。

## 验证

- typecheck、目标文件 ESLint、生产 build、git diff --check 通过。
- 3 个原有 API/组件约束测试通过。
- 浏览器回归 3 项通过：切换并保留分组/关闭重开；旧轮询成功响应晚到；旧创建响应晚到且新请求仍在等待。
- 浏览器使用独立上下文和合成 API 夹具，未发起真实 WhatsApp 配对。
- 发布后直接加载第二套线上静态制品重跑同三项浏览器回归，3/3 通过（46.1 秒），全部业务 API 仍由测试夹具拦截。

## 发布

- perf2 / 3.110.124.52，使用已有 armada-perf.pem。
- 仅替换 nginx 静态制品，保留原 nginx 配置和全部运行环境；后端容器 ID 未变，未触及协议服务。
- 新镜像 armada-perf-nginx:pairing-switch-20260927，sha256:32bab2c505faed484f036560656b31d8c017e9fcafe7291ddc44b998e6f2401a。
- index.html 的本地、容器和 HTTP SHA-256 一致：363b15f01f3c7fe102a53313b2949db301b148f1bb80aee62527bc36e1b93a1f。
- 环境标题仍为第二套环境，nginx/backend 运行正常。
- 发布目录 /home/app/armada-deploy/releases/20260927-pairing-switch，compose-image.json 为对应制品覆盖配置。

## 回滚

原镜像 armada-perf-nginx:before-pairing-switch-20260927；原 dist 在 /home/app/armada-deploy/backups/20260927-pairing-switch/dist.tar.gz。仅重建 nginx，不重建 backend。
