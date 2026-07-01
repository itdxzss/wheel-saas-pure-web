# IP 数据统计接入 Armada 实施计划

> **给执行 Agent 的要求：** 实施本计划时必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐项执行。步骤使用 checkbox（`- [ ]`）追踪。

**目标：** 在 `wheel-saas-pure-web` 新增 `IP 数据统计` 菜单，并通过 armada 后端 SQL 聚合接口提供真实统计数据。

**架构：** 后端是统计事实源，前端不全量拉取 IP 后自行聚合。armada 在现有 `resource` 域新增只读统计接口，聚合逻辑落在 `IpProxyMapper` SQL 中，Service 只做汇总口径、比率和风险标签计算。前端用 pure-admin-thin + Element Plus 新增统计页，调用 typed API，展示总览卡片、国家/地区维度统计表和国家/地区 IP 明细抽屉。

**技术栈：** Java 17、Spring Boot 3.3.5、MyBatis XML、Flyway、Vue 3 `<script setup>`、TypeScript、pure-admin-thin、Element Plus、pnpm。

---

## 范围

本计划只实现第一刀：

- 给 `ip_proxy` 增加 `last_sample_check_at`，作为 `最近抽检时间` 的真实持久化字段。
- 新增只读统计接口：总览、国家/地区维度统计、国家/地区 IP 明细。
- 前端新增 `IP 数据统计` 菜单和页面。
- 第一版删除原型中的这些列：
  - 国家维度统计：`待检测 IP 数`、`最近检测时间`、`最近使用时间`
  - 明细抽屉：`最近轻量检测时间`、`最近全量检测时间`
- 第一版不做统计页里的检测、抽检执行、全量检测、导出、批量删除。

## 推荐执行方式

这个计划不要一次性从头做到尾。推荐拆成 4 个可验收切片，每个切片做完都停下来验证和复盘，再继续下一个。

### 切片 1：后端最小数据闭环

范围：

- `ip_proxy.last_sample_check_at` 字段
- `IpProxy` entity 字段
- mapper `Columns` 更新
- XML 校验

验收：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
xmllint --noout armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml
```

完成标准：迁移文件、entity、mapper 字段对齐；不涉及统计接口和前端。

### 切片 2：后端统计 API

范围：

- stats Query / VO / 风险枚举
- `IpProxyMapper` 聚合 SQL
- `IpProxyStatsService`
- `IpProxyStatsController`
- mapper DbTest、Service 单测、Controller 测试

验收：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
./dbtest.sh IpProxyStatsMapperDbTest
```

完成标准：三个 stats 接口可返回真实 SQL 聚合数据；前端还不接。

### 切片 3：前端 API 和菜单

范围：

- `src/api/resource-ip-stats.ts`
- `src/api/resource-ip-stats.test.ts`
- `mock/asyncRoutes.ts` 新增 `IP 数据统计`

验收：

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm test src/api/resource-ip-stats.test.ts
```

完成标准：前端 typed API 映射正确，菜单能进空页面或待实现页面；不做复杂 UI。

### 切片 4：前端页面

范围：

- `src/views/resource/ip-stats/composables/useResourceIpStatsPage.ts`
- `src/views/resource/ip-stats/index.vue`
- 必要时拆 `components/`

验收：

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm typecheck
pnpm build
```

完成标准：页面展示统计卡片、国家/地区表、明细抽屉；删除的原型列不出现；明细只展示 `最近抽检时间`。

## 质量控制

- 每次只执行一个切片。
- 每个切片完成后先看 `git diff`，确认没有无关文件。
- 后端 SQL 改动必须有 XML 校验或 DbTest 证据。
- 前端页面完成前必须跑 typecheck/build。
- 任何切片如果遇到 armada 国家主数据在途改动冲突，先停下来重新评估，不强行合并。

## 在途改动提醒

计划编写时，`armada` 工作区已有未提交的国家主数据相关改动：

- `docs/superpowers/specs/2026-07-01-admin-ip-country-master-data-design.md`
- `armada-api/src/main/resources/db/migration/V021__country_master_data.sql`
- `armada-api/src/main/java/com/armada/admin/...Country...`

执行前必须重新读取 `armada` 工作区状态，不得覆盖或回退这些文件。如果国家主数据后续完成，可以在下一刀用于“支持国家数 / 无 IP 国家数”的准确统计；本次第一刀只按现有 `ip_proxy.region` 做已有 IP 的国家/地区聚合。

## 文件结构

### Armada 后端

- 新建：`armada/armada-api/src/main/resources/db/migration/V022__ip_proxy_sample_check_time.sql`
  - 增加 `ip_proxy.last_sample_check_at BIGINT NULL`。
  - 执行前如果已有 `V022`，顺延到下一个可用版本号，并同步修改本计划中的迁移文件名。

- 修改：`armada/armada-api/src/main/java/com/armada/resource/model/entity/IpProxy.java`
  - 增加 `lastSampleCheckAt` 字段和 getter/setter。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyStatsCountryQuery.java`
  - 国家/地区统计表查询参数：`keyword`、`protocol`、`source`、`risk`、`sortField`、`sortOrder`、`page`、`pageSize`。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyStatsDetailQuery.java`
  - 明细抽屉查询参数：`status`、`protocol`、`source`、`keyword`、`page`、`pageSize`。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyStatsSummaryVO.java`
  - 顶部统计卡片出参。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyCountryStatsVO.java`
  - 国家/地区维度统计行。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyStatsDetailVO.java`
  - 明细抽屉行；不返回密码。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/IpProxyResourceRisk.java`
  - 国家/地区资源风险枚举。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/service/IpProxyStatsService.java`
  - 只读统计 Service 边界。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/service/impl/IpProxyStatsServiceImpl.java`
  - 调用 mapper 聚合/明细查询，计算比率和风险标签。

- 新建：`armada/armada-api/src/main/java/com/armada/resource/controller/IpProxyStatsController.java`
  - 暴露 `/api/ip-proxies/stats/*`。

- 修改：`armada/armada-api/src/main/java/com/armada/resource/mapper/IpProxyMapper.java`
  - 增加统计相关 mapper 方法。

- 修改：`armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`
  - 增加统计聚合 SQL 和明细 SQL。

- 测试：
  - 新建：`armada/armada-api/src/test/java/com/armada/resource/mapper/IpProxyStatsMapperDbTest.java`
  - 新建：`armada/armada-api/src/test/java/com/armada/resource/service/IpProxyStatsServiceImplTest.java`
  - 新建：`armada/armada-api/src/test/java/com/armada/resource/controller/IpProxyStatsControllerTest.java`

### 前端

- 修改：`wheel-saas-pure-web/mock/asyncRoutes.ts`
  - 在 `运营管理` 下、`IP 管理` 后新增 `IP 数据统计`。

- 新建：`wheel-saas-pure-web/src/api/resource-ip-stats.ts`
  - 封装 armada 统计接口。

- 新建：`wheel-saas-pure-web/src/api/resource-ip-stats.test.ts`
  - 验证 URL、method、params 映射。

- 新建：`wheel-saas-pure-web/src/views/resource/ip-stats/composables/useResourceIpStatsPage.ts`
  - 页面状态、筛选、总览加载、国家表加载、抽屉加载。

- 新建：`wheel-saas-pure-web/src/views/resource/ip-stats/index.vue`
  - Element Plus 页面。

- 如果 `index.vue` 接近 400 行，再拆：
  - `wheel-saas-pure-web/src/views/resource/ip-stats/components/IpStatsSummaryCards.vue`
  - `wheel-saas-pure-web/src/views/resource/ip-stats/components/IpStatsDetailDrawer.vue`

## API 约定

### `GET /api/ip-proxies/stats/summary`

用于顶部统计卡片。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalIpCount": 1200,
    "inUseIpCount": 320,
    "idleIpCount": 760,
    "unavailableIpCount": 120,
    "coveredRegionCount": 8
  }
}
```

### `GET /api/ip-proxies/stats/countries`

用于国家/地区维度统计表，返回分页聚合结果。

支持参数：

```text
keyword=印度
protocol=1
source=iproyal
risk=no_idle
sortField=totalIpCount
sortOrder=desc
page=1
pageSize=20
```

返回行：

```json
{
  "region": "印度",
  "totalIpCount": 300,
  "inUseIpCount": 80,
  "idleIpCount": 200,
  "unavailableIpCount": 20,
  "availableRate": 93.33,
  "unavailableRate": 6.67,
  "resourceRisk": "normal",
  "resourceRiskLabel": "正常"
}
```

### `GET /api/ip-proxies/stats/countries/{region}/proxies`

用于国家/地区 IP 明细抽屉。

支持参数：

```text
status=2
protocol=1
source=iproyal
keyword=1.2.3.4
page=1
pageSize=20
```

返回行：

```json
{
  "id": 101,
  "proxyAddress": "1.2.3.4:8000",
  "protocol": 1,
  "protocolLabel": "HTTP",
  "region": "印度",
  "status": 2,
  "statusLabel": "使用中",
  "boundAccountId": 9001,
  "source": "iproyal-20260701",
  "ownership": 1,
  "ownershipLabel": "租户自有",
  "lastSampleCheckAt": 1719800000000,
  "createdAt": 1719700000000,
  "boundAt": 1719800000000
}
```

## 任务

### 任务 1：增加 `last_sample_check_at` 数据模型字段

**文件：**
- 新建：`armada/armada-api/src/main/resources/db/migration/V022__ip_proxy_sample_check_time.sql`
- 修改：`armada/armada-api/src/main/java/com/armada/resource/model/entity/IpProxy.java`
- 修改：`armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`

- [ ] **步骤 1：重新确认 Flyway 版本号**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
ls armada-api/src/main/resources/db/migration
```

预期：确认 `V022__ip_proxy_sample_check_time.sql` 未被占用；如果已被占用，使用下一个可用版本号。

- [ ] **步骤 2：增加迁移**

创建迁移文件，内容如下：

```sql
SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'last_sample_check_at'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN last_sample_check_at BIGINT DEFAULT NULL COMMENT ''最近抽检时间(epoch毫秒)'' AFTER bound_at',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

- [ ] **步骤 3：更新实体**

在 `IpProxy.java` 增加：

```java
/** 最近抽检时间(epoch毫秒);NULL=尚未抽检。 */
private Long lastSampleCheckAt;

public Long getLastSampleCheckAt() {
    return lastSampleCheckAt;
}

public void setLastSampleCheckAt(Long lastSampleCheckAt) {
    this.lastSampleCheckAt = lastSampleCheckAt;
}
```

- [ ] **步骤 4：更新 mapper 列清单**

在 `IpProxyMapper.xml` 的 `Columns` SQL 片段中，把 `last_sample_check_at` 加到 `bound_at` 后面。

- [ ] **步骤 5：校验 XML**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
xmllint --noout armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml
```

预期：无输出，退出码为 0。

### 任务 2：增加 armada 统计 DTO、VO 和风险枚举

**文件：**
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyStatsCountryQuery.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyStatsDetailQuery.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyStatsSummaryVO.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyCountryStatsVO.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyStatsDetailVO.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/model/IpProxyResourceRisk.java`

- [ ] **步骤 1：增加 Query 类**

`IpProxyStatsCountryQuery` 继承 `PageQuery`，字段：

```java
private String keyword;
private Integer protocol;
private String source;
private String risk;
private String sortField;
private String sortOrder;
```

`IpProxyStatsDetailQuery` 继承 `PageQuery`，字段：

```java
private Integer status;
private Integer protocol;
private String source;
private String keyword;
```

两个类都要提供 getter/setter，因为 `@ModelAttribute` 绑定不使用 record。

- [ ] **步骤 2：增加 VO record**

`IpProxyStatsSummaryVO` 字段：

```java
Long totalIpCount,
Long inUseIpCount,
Long idleIpCount,
Long unavailableIpCount,
Long coveredRegionCount
```

`IpProxyCountryStatsVO` 字段：

```java
String region,
Long totalIpCount,
Long inUseIpCount,
Long idleIpCount,
Long unavailableIpCount,
BigDecimal availableRate,
BigDecimal unavailableRate,
String resourceRisk,
String resourceRiskLabel
```

`IpProxyStatsDetailVO` 字段：

```java
Long id,
String proxyAddress,
Integer protocol,
String protocolLabel,
String region,
Integer status,
String statusLabel,
Long boundAccountId,
String source,
Integer ownership,
String ownershipLabel,
Long lastSampleCheckAt,
Long createdAt,
Long boundAt
```

- [ ] **步骤 3：增加风险枚举**

枚举值：

```java
NORMAL("normal", "正常"),
NO_IDLE("no_idle", "无空闲 IP"),
LOW_AVAILABLE("low_available", "可用不足"),
HIGH_UNAVAILABLE("high_unavailable", "不可用偏高");
```

判定规则：

- `total > 0 && idle == 0 && inUse > 0` => `NO_IDLE`
- `availableRate < 20` => `LOW_AVAILABLE`
- `unavailableRate > 50` => `HIGH_UNAVAILABLE`
- 其它 => `NORMAL`

### 任务 3：增加 armada Mapper 聚合查询

**文件：**
- 修改：`armada/armada-api/src/main/java/com/armada/resource/mapper/IpProxyMapper.java`
- 修改：`armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`
- 测试：`armada/armada-api/src/test/java/com/armada/resource/mapper/IpProxyStatsMapperDbTest.java`

- [ ] **步骤 1：增加 mapper 方法**

在 `IpProxyMapper` 增加：

```java
IpProxyStatsSummaryVO selectStatsSummary();

long countCountryStats(@Param("q") IpProxyStatsCountryQuery query);

List<IpProxyCountryStatsRow> selectCountryStatsPage(@Param("q") IpProxyStatsCountryQuery query);

long countStatsDetail(@Param("region") String region, @Param("q") IpProxyStatsDetailQuery query);

List<IpProxyStatsDetailVO> selectStatsDetailPage(@Param("region") String region, @Param("q") IpProxyStatsDetailQuery query);
```

如果 `IpProxyCountryStatsRow` 作为 mapper 投影更合适，则新建在 `resource/model/vo` 或 `resource/model`，字段包含 region 和 4 个 count；Service 再转成 `IpProxyCountryStatsVO`。

- [ ] **步骤 2：增加 SQL 聚合**

统计投影使用条件聚合：

```sql
COUNT(*) AS totalIpCount,
SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS idleIpCount,
SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS inUseIpCount,
SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS unavailableIpCount
```

国家/地区统计只统计：

```sql
deleted_at IS NULL
AND region IS NOT NULL
AND TRIM(region) != ''
```

风险筛选用 SQL `HAVING` 下推，不能查全量后在 Java 内存分页：

```sql
HAVING
  (
    #{q.risk} IS NULL OR #{q.risk} = ''
    OR (#{q.risk} = 'no_idle' AND COUNT(*) > 0 AND SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) = 0 AND SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) > 0)
    OR (#{q.risk} = 'low_available' AND COUNT(*) > 0 AND ((SUM(CASE WHEN status IN (1, 2) THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) < 20)
    OR (#{q.risk} = 'high_unavailable' AND COUNT(*) > 0 AND ((SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) > 50)
    OR (#{q.risk} = 'normal' AND NOT (
      (SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) = 0 AND SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) > 0)
      OR ((SUM(CASE WHEN status IN (1, 2) THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) < 20
      OR ((SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) > 50
    ))
  )
```

- [ ] **步骤 3：增加明细 SQL**

明细 SQL 不返回 `password`。返回字段：

```sql
id,
CONCAT(host, ':', port) AS proxyAddress,
protocol,
region,
status,
bound_account_id AS boundAccountId,
source,
ownership,
last_sample_check_at AS lastSampleCheckAt,
created_at AS createdAt,
bound_at AS boundAt
```

筛选条件：

```sql
deleted_at IS NULL
AND region = #{region}
```

并按 `q.status`、`q.protocol`、`q.source`、`q.keyword` 追加筛选。

- [ ] **步骤 4：增加 Mapper DbTest**

测试数据至少包含：

- 印度：空闲 2、使用中 1、不可用 1
- 巴基斯坦：使用中 1、空闲 0
- 马来西亚：已软删 1 行

断言：

- 总览统计只计未删除行
- 国家/地区表按 region 聚合正确
- 已删除行不进入统计
- 明细返回 `lastSampleCheckAt`
- 明细 VO 没有 `password`

- [ ] **步骤 5：运行 DbTest**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
./dbtest.sh IpProxyStatsMapperDbTest
```

预期：通过。如果缺少真库环境，停止并报告，不能改用生产 mock。

### 任务 4：增加 armada Service 和 Controller

**文件：**
- 新建：`armada/armada-api/src/main/java/com/armada/resource/service/IpProxyStatsService.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/service/impl/IpProxyStatsServiceImpl.java`
- 新建：`armada/armada-api/src/main/java/com/armada/resource/controller/IpProxyStatsController.java`
- 测试：`armada/armada-api/src/test/java/com/armada/resource/service/IpProxyStatsServiceImplTest.java`
- 测试：`armada/armada-api/src/test/java/com/armada/resource/controller/IpProxyStatsControllerTest.java`

- [ ] **步骤 1：增加 Service 接口**

方法：

```java
IpProxyStatsSummaryVO summary();

PageResult<IpProxyCountryStatsVO> countries(IpProxyStatsCountryQuery query);

PageResult<IpProxyStatsDetailVO> regionProxies(String region, IpProxyStatsDetailQuery query);
```

- [ ] **步骤 2：增加 Service 实现**

比率计算：

```java
availableRate = (idleIpCount + inUseIpCount) * 100 / totalIpCount
unavailableRate = unavailableIpCount * 100 / totalIpCount
```

规则：

- `totalIpCount == 0` 时两个比率都返回 `0.00`
- 使用 `BigDecimal`，保留 2 位小数
- 风险标签用 `IpProxyResourceRisk` 统一计算
- 分页和筛选必须由 SQL 负责，Service 不做全量加载后分页

- [ ] **步骤 3：增加 Controller**

暴露：

```text
GET /api/ip-proxies/stats/summary
GET /api/ip-proxies/stats/countries
GET /api/ip-proxies/stats/countries/{region}/proxies
```

Controller 只做参数接收和 `ApiResponse.ok(...)` 包装。

- [ ] **步骤 4：增加 Service 测试**

用 mapper mock 构造 count 结果，断言：

- 可用率和不可用率计算正确
- `no_idle`、`low_available`、`high_unavailable`、`normal` 风险判断正确
- `totalIpCount == 0` 不除零

- [ ] **步骤 5：增加 Controller 测试**

断言三个接口路径返回统一 `ApiResponse` 信封。

### 任务 5：增加前端 API 映射

**文件：**
- 新建：`wheel-saas-pure-web/src/api/resource-ip-stats.ts`
- 新建：`wheel-saas-pure-web/src/api/resource-ip-stats.test.ts`

- [ ] **步骤 1：增加 typed API 模块**

导出函数：

```ts
export function getIpStatsSummary(): Promise<IpStatsSummary>;

export function listIpCountryStats(
  query: IpCountryStatsQuery
): Promise<PageResponse<IpCountryStatsRow>>;

export function listIpStatsRegionProxies(
  region: string,
  query: IpStatsDetailQuery
): Promise<PageResponse<IpStatsDetailRow>>;
```

要求：

- 使用 `armadaRequest`
- 页面禁止直接 import `axios`、`http`
- `region` 路径参数用 `encodeURIComponent(region)`

- [ ] **步骤 2：增加 API 测试**

用现有 `resetArmadaMock` 和 `armadaCalls` 断言：

- summary 调用 `GET /api/ip-proxies/stats/summary`
- country list 调用 `GET /api/ip-proxies/stats/countries` 并传 params
- detail 调用编码后的 region path，并传 params

- [ ] **步骤 3：运行测试**

先检查 `package.json` 的测试命令，然后运行对应测试。若已有命令支持单文件测试，优先运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm test src/api/resource-ip-stats.test.ts
```

预期：通过。

### 任务 6：增加前端菜单路由

**文件：**
- 修改：`wheel-saas-pure-web/mock/asyncRoutes.ts`

- [ ] **步骤 1：在 `operationRouter.children` 下增加路由**

放在 `ResourceIp` 后面：

```ts
{
  path: "/resource/ip-stats",
  component: "resource/ip-stats/index",
  name: "ResourceIpStats",
  meta: {
    title: "IP 数据统计",
    roles: ["admin", "common"],
    showParent: true,
    module_key: "resource_ip",
    perm_key: "tenant:resource:ips:stats"
  }
}
```

- [ ] **步骤 2：临时验证菜单**

启动前端后确认：

- `运营管理` 下出现 `IP 数据统计`
- 位置在 `IP 管理` 后面
- 点击进入 `/resource/ip-stats`

### 任务 7：增加前端页面

**文件：**
- 新建：`wheel-saas-pure-web/src/views/resource/ip-stats/composables/useResourceIpStatsPage.ts`
- 新建：`wheel-saas-pure-web/src/views/resource/ip-stats/index.vue`
- 必要时拆组件。

- [ ] **步骤 1：增加 composable 状态**

状态包含：

- `summaryLoading` / `summaryError`
- `tableLoading` / `tableError`
- 筛选：`keyword`、`protocol`、`source`
- 国家表分页：`page`、`pageSize`、`total`
- 抽屉：`drawerVisible`、`drawerRegion`、`drawerStatus`、`drawerPage`、`drawerPageSize`、`drawerTotal`

- [ ] **步骤 2：加载统计总览**

页面 mounted 和刷新时调用 `getIpStatsSummary`。

- [ ] **步骤 3：加载国家/地区表**

调用 `listIpCountryStats`，用 `ElTable` + `WheelPagination`。

列：

- 国家/地区
- IP 总数
- 使用中 IP 数
- 空闲 IP 数
- 不可用 IP 数
- 可用率
- 不可用率
- 资源状态
- 操作

- [ ] **步骤 4：增加明细抽屉**

用 `ElDrawer`。

列：

- 代理地址
- 协议类型
- 来源
- 状态
- 当前绑定账号
- 最近抽检时间
- 创建时间

禁止展示密码列。

- [ ] **步骤 5：增加错误和空状态**

要求：

- 接口错误用 `ElAlert` 可见展示
- 表格空态使用 Element Plus 空状态
- loading 状态覆盖表格和抽屉

### 任务 8：验证

**文件：** 除修复测试失败外，不新增文件。

- [ ] **步骤 1：后端单测**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
mvn -pl armada-api test
```

预期：通过。

- [ ] **步骤 2：后端真库 DbTest**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
./dbtest.sh IpProxyStatsMapperDbTest
```

预期：通过。

- [ ] **步骤 3：前端类型检查和构建**

运行：

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm typecheck
pnpm build
```

预期：通过。

- [ ] **步骤 4：浏览器冒烟**

启动前端开发服务，打开 `/resource/ip-stats`，确认：

- `IP 数据统计` 菜单出现在 `运营管理` 下
- 顶部统计卡片渲染
- 国家表不显示已删除的原型列
- 点击数量或“查看明细”能打开抽屉
- 抽屉显示 `最近抽检时间`
- 抽屉不显示 `最近轻量检测时间`、`最近全量检测时间`

## 自检

- 覆盖范围：菜单、总览统计、国家/地区维度表、明细抽屉、删除原型列、`last_sample_check_at`、不实现检测执行逻辑，均已有任务覆盖。
- 占位扫描：没有 `TBD`、`TODO` 或未定义实现口径。
- 类型一致性：后端和前端统一使用 `lastSampleCheckAt`；接口路径、字段名和页面列名一致。
