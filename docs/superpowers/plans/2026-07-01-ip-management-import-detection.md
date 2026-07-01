# IP 管理导入与检测 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整 IP 管理页，让 TXT 导入按“混合分组 / 智能分配”入池，并提供真实代理检测闭环，IP 数据统计页面本次不实现。

**Architecture:** `armada` 后端是 IP 管理事实源，负责分配方式、检测结果、国家识别、状态和日志落库。`wheel-saas-pure-web` 只调用 typed API，不直接写 axios；页面负责导入、筛选、检测按钮 loading、结果弹窗和轻量视觉压缩。检测实现通过后端端口隔离，业务服务依赖 `IpProxyDetector`，HTTP/代理连通的具体实现放在 infrastructure 包，测试使用 fake/mock。

**Tech Stack:** Java 17, Spring Boot 3.3.5, MyBatis XML, Flyway, JUnit 5, Mockito, Vue 3 `<script setup>`, TypeScript, Element Plus, pure-admin-thin, Node test runner, pnpm.

---

## Confirmed Product Decisions

- 本计划只做 `运营管理 / IP 管理`；`IP 数据统计` 页面由其他 agent 继续做。
- 导入弹窗不再选择国家。
- `allocationMode=mixed`：导入记录直接进入混合分组，展示为 `混合（不限国家）`。
- `allocationMode=smart`：导入时真实检测代理出口 IP，按检测出的国家码匹配 `country` 表，写入对应国家中文 region。
- 前端代理类型展示为 `HTTP / SOCKETS`，继续把 `SOCKETS` 映射到后端协议码 `2`。
- 密码保持明文展示，不脱敏。
- 检测要真做，不允许只 toast 或 mock 成功。
- 顶部温馨提示只轻微压缩，仍默认展开供应商和推荐说明。

## Non-Goals

- 不实现 IP 数据统计页 UI。
- 不实现国家维度抽样检测；本计划只做 IP 管理列表行内检测和批量检测。
- 不实现导出。
- 不实现异步任务中心。第一版检测接口同步返回，批量检测限制一次最多 20 条，避免长请求失控。

## File Structure

### Armada Backend

- Modify: `armada/armada-api/src/main/resources/db/migration/V023__ip_proxy_import_detection_fields.sql`
  - 增加 `allocation_mode`、检测详情、失败次数字段。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/model/entity/IpProxy.java`
  - 增加分配方式和检测字段 getter/setter。
- Modify: `armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`
  - 列清单、insert、检测更新 SQL、批量查询 SQL。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/mapper/IpProxyMapper.java`
  - 增加检测更新、批量查询方法。
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/IpProxyAllocationMode.java`
  - `mixed/smart` 枚举和校验。
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/IpProxyCheckStatus.java`
  - 检测结果枚举：`success/failed`。
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyBatchCheckDTO.java`
  - 批量检测入参。
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyCheckResultVO.java`
  - 前端检测结果弹窗出参。
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyCheckRequest.java`
  - 检测端口入参。
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyCheckResult.java`
  - 检测端口出参。
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyDetector.java`
  - 真实检测端口。
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/HttpIpProxyDetector.java`
  - JDK HTTP client + proxy 真实检测实现。
- Modify: `armada/armada-api/src/main/java/com/armada/platform/country/service/CountryService.java`
  - 增加按 ISO2 解析 IP region 的方法。
- Modify: `armada/armada-api/src/main/java/com/armada/platform/country/service/impl/CountryServiceImpl.java`
  - 实现检测国家码到中文 region 的解析。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyImportDTO.java`
  - 增加 `allocationMode`，保留旧构造兼容旧测试。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyVO.java`
  - 增加状态、分配方式、检测详情字段；保留 password 明文字段。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/converter/IpProxyConverter.java`
  - 映射新字段和 label。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/service/IpProxyService.java`
  - 增加单条检测、批量检测方法。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/service/impl/IpProxyServiceImpl.java`
  - 导入分配方式、导入检测、检测更新落库。
- Modify: `armada/armada-api/src/main/java/com/armada/resource/controller/IpProxyController.java`
  - 增加检测接口。
- Test: `armada/armada-api/src/test/java/com/armada/resource/service/IpProxyServiceImplTest.java`
  - 导入 mixed/smart、检测状态更新。
- Test: `armada/armada-api/src/test/java/com/armada/resource/controller/IpProxyControllerTest.java`
  - 检测接口契约。
- Test: `armada/armada-api/src/test/java/com/armada/resource/check/HttpIpProxyDetectorTest.java`
  - 检测结果解析和失败映射。

### Frontend

- Modify: `wheel-saas-pure-web/src/api/resource-ip-mapping.ts`
  - 增加 allocation/status/check fields。
- Modify: `wheel-saas-pure-web/src/api/resource-ip.ts`
  - 导入入参改为 `allocationMode`，增加检测 API。
- Modify: `wheel-saas-pure-web/src/api/resource-ip.test.ts`
  - 覆盖导入和检测 API 映射。
- Modify: `wheel-saas-pure-web/src/views/resource/ip/composables/useResourceIpPage.ts`
  - 导入表单、检测状态、刷新逻辑。
- Modify: `wheel-saas-pure-web/src/views/resource/ip/components/IpImportDialog.vue`
  - 去掉国家，新增分配方式。
- Create: `wheel-saas-pure-web/src/views/resource/ip/components/IpCheckResultDialog.vue`
  - 展示单条/批量检测结果。
- Modify: `wheel-saas-pure-web/src/views/resource/ip/index.vue`
  - 表格列、行内检测、批量检测、提示区轻压缩。

---

## Execution Slices

1. Backend schema and model fields.
2. Backend detector port and fake-driven service behavior.
3. Backend real detector adapter and controller endpoints.
4. Frontend API contracts.
5. Frontend import dialog and list columns.
6. Frontend detection UI and compact guide.
7. End-to-end verification.

Each slice must pass its own tests before moving on.

---

### Task 1: Backend Schema for Allocation Mode and Detection Fields

**Files:**
- Create: `armada/armada-api/src/main/resources/db/migration/V023__ip_proxy_import_detection_fields.sql`
- Modify: `armada/armada-api/src/main/java/com/armada/resource/model/entity/IpProxy.java`
- Modify: `armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`

- [ ] **Step 1: Confirm migration version**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
ls armada-api/src/main/resources/db/migration
```

Expected: `V023__ip_proxy_import_detection_fields.sql` is not present. If it is already present, use the next unused Flyway version and update every filename reference in this plan before continuing.

- [ ] **Step 2: Create migration**

Create `armada/armada-api/src/main/resources/db/migration/V023__ip_proxy_import_detection_fields.sql`:

```sql
SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'allocation_mode'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN allocation_mode VARCHAR(16) NOT NULL DEFAULT ''mixed'' COMMENT ''分配方式:mixed=混合分组,smart=智能分配'' AFTER region',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'detected_country_code'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN detected_country_code VARCHAR(8) DEFAULT NULL COMMENT ''检测识别国家码'' AFTER last_sample_check_at',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'outbound_ip'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN outbound_ip VARCHAR(64) DEFAULT NULL COMMENT ''检测出口IP'' AFTER detected_country_code',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'detected_location'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN detected_location VARCHAR(255) DEFAULT NULL COMMENT ''检测归属地展示文本'' AFTER outbound_ip',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'detected_isp'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN detected_isp VARCHAR(255) DEFAULT NULL COMMENT ''检测运营商/ISP'' AFTER detected_location',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'detected_latitude'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN detected_latitude DECIMAL(10,7) DEFAULT NULL COMMENT ''检测纬度'' AFTER detected_isp',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'detected_longitude'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN detected_longitude DECIMAL(10,7) DEFAULT NULL COMMENT ''检测经度'' AFTER detected_latitude',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'check_fail_count'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN check_fail_count INT NOT NULL DEFAULT 0 COMMENT ''连续检测失败次数'' AFTER detected_longitude',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ip_proxy'
    AND column_name = 'last_check_error'
);

SET @ddl := IF(@column_exists = 0,
  'ALTER TABLE ip_proxy ADD COLUMN last_check_error VARCHAR(512) DEFAULT NULL COMMENT ''最近检测失败原因'' AFTER check_fail_count',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

- [ ] **Step 3: Update `IpProxy` entity**

Add fields after `region` and after `lastSampleCheckAt` in `armada/armada-api/src/main/java/com/armada/resource/model/entity/IpProxy.java`:

```java
/** 分配方式:mixed=混合分组,smart=智能分配。 */
private String allocationMode;

/** 检测识别国家码。 */
private String detectedCountryCode;

/** 检测出口 IP。 */
private String outboundIp;

/** 检测归属地展示文本。 */
private String detectedLocation;

/** 检测运营商/ISP。 */
private String detectedIsp;

/** 检测纬度。 */
private java.math.BigDecimal detectedLatitude;

/** 检测经度。 */
private java.math.BigDecimal detectedLongitude;

/** 连续检测失败次数。 */
private Integer checkFailCount;

/** 最近检测失败原因。 */
private String lastCheckError;
```

Add standard getter/setter for each field. Use fully-qualified `java.math.BigDecimal` only if the file currently has no imports; otherwise import `java.math.BigDecimal`.

- [ ] **Step 4: Update MyBatis column list and insert**

In `armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`, update the `Columns` SQL fragment to include all new fields:

```xml
id, tenant_id, host, port, protocol, username, password, region, allocation_mode,
status, bound_account_id, bound_at, last_sample_check_at, detected_country_code,
outbound_ip, detected_location, detected_isp, detected_latitude, detected_longitude,
check_fail_count, last_check_error, source, ownership, remark,
created_at, updated_at, created_by, deleted_at
```

Update the `insert` statement columns:

```xml
(host, port, protocol, username, password, region, allocation_mode, status,
 source, ownership, remark, last_sample_check_at, detected_country_code,
 outbound_ip, detected_location, detected_isp, detected_latitude, detected_longitude,
 check_fail_count, last_check_error, created_at, updated_at, created_by)
```

Update the `VALUES` list in the same order:

```xml
(#{host}, #{port}, #{protocol}, #{username}, #{password}, #{region},
 #{allocationMode}, #{status}, #{source}, #{ownership}, #{remark},
 #{lastSampleCheckAt}, #{detectedCountryCode}, #{outboundIp}, #{detectedLocation},
 #{detectedIsp}, #{detectedLatitude}, #{detectedLongitude}, #{checkFailCount},
 #{lastCheckError}, #{createdAt}, #{updatedAt}, #{createdBy})
```

- [ ] **Step 5: Validate XML**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
xmllint --noout armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml
```

Expected: no output, exit code `0`.

- [ ] **Step 6: Commit slice**

Only commit if the executor has been asked to commit in this session. Otherwise leave changes staged or unstaged according to the session workflow.

---

### Task 2: Backend Allocation Mode and Country Resolution Contracts

**Files:**
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/IpProxyAllocationMode.java`
- Modify: `armada/armada-api/src/main/java/com/armada/platform/country/service/CountryService.java`
- Modify: `armada/armada-api/src/main/java/com/armada/platform/country/service/impl/CountryServiceImpl.java`
- Modify: `armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyImportDTO.java`
- Test: `armada/armada-api/src/test/java/com/armada/resource/service/IpProxyServiceImplTest.java`

- [ ] **Step 1: Add allocation mode enum**

Create `armada/armada-api/src/main/java/com/armada/resource/model/IpProxyAllocationMode.java`:

```java
package com.armada.resource.model;

import com.armada.shared.exception.BusinessException;
import com.armada.shared.exception.ErrorCode;

/**
 * IP 导入分配方式。
 */
public enum IpProxyAllocationMode {
    MIXED("mixed", "混合分组"),
    SMART("smart", "智能分配");

    private final String value;
    private final String label;

    IpProxyAllocationMode(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String value() {
        return value;
    }

    public String label() {
        return label;
    }

    public static IpProxyAllocationMode fromValue(String value) {
        if (value == null || value.isBlank()) {
            return SMART;
        }
        String normalized = value.trim();
        for (IpProxyAllocationMode item : values()) {
            if (item.value.equalsIgnoreCase(normalized)) {
                return item;
            }
        }
        throw new BusinessException(ErrorCode.VALIDATION, "非法的分配方式: " + value);
    }

    public static String labelOf(String value) {
        return fromValue(value).label();
    }
}
```

- [ ] **Step 2: Extend country service interface**

Add to `armada/armada-api/src/main/java/com/armada/platform/country/service/CountryService.java`:

```java
/**
 * 把检测识别出的 ISO2 国家码解析为 IP 代理池 region 中文快照。
 *
 * @param iso2 检测服务返回的国家码
 * @return 可写入 ip_proxy.region 的中文 region
 */
String resolveIpRegionByIso2(String iso2);
```

- [ ] **Step 3: Implement ISO2 resolver**

Add to `CountryServiceImpl`:

```java
@Override
public String resolveIpRegionByIso2(String iso2) {
    if (!StringUtils.hasText(iso2)) {
        throw new BusinessException(ErrorCode.VALIDATION, "检测国家码为空");
    }
    Country country = mapper.selectActiveByIso2(iso2.trim().toUpperCase(Locale.ROOT));
    if (country == null || country.getIsIpSupported() == null || country.getIsIpSupported() != 1) {
        throw new BusinessException(ErrorCode.VALIDATION, "检测国家不在 IP 支持国家表中: " + iso2);
    }
    return country.getNameZh();
}
```

- [ ] **Step 4: Extend import DTO**

Replace `IpProxyImportDTO` record with this signature while preserving old constructor:

```java
public record IpProxyImportDTO(
        String region,
        Integer protocol,
        String source,
        String text,
        String countryValue,
        String allocationMode) {

    public IpProxyImportDTO(String region, Integer protocol, String source, String text) {
        this(region, protocol, source, text, null, null);
    }

    public IpProxyImportDTO(String region, Integer protocol, String source, String text, String countryValue) {
        this(region, protocol, source, text, countryValue, null);
    }
}
```

- [ ] **Step 5: Add failing tests for allocation mode normalization**

Append to `IpProxyServiceImplTest`:

```java
@Test
void importProxies_mixedAllocationPersistsMixedRegionAndMode() {
    when(countryService.resolveIpRegion("MIXED")).thenReturn("混合（不限国家）");
    when(mapper.countActiveByFullTuple(anyString(), anyInt(), anyString(), anyString())).thenReturn(0L);

    service.importProxies(new IpProxyImportDTO(
            null, 1, "供应商A", "1.1.1.1:8080:user1:pass1", "MIXED", "mixed"));

    ArgumentCaptor<IpProxy> proxyCaptor = ArgumentCaptor.forClass(IpProxy.class);
    verify(mapper).insert(proxyCaptor.capture());
    assertThat(proxyCaptor.getValue().getRegion()).isEqualTo("混合（不限国家）");
    assertThat(proxyCaptor.getValue().getAllocationMode()).isEqualTo("mixed");
}

@Test
void importProxies_invalidAllocationModeThrowsValidation() {
    assertThatThrownBy(() -> service.importProxies(new IpProxyImportDTO(
            null, 1, "供应商A", "1.1.1.1:8080:user1:pass1", null, "bad-mode")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("非法的分配方式");
    verify(mapper, never()).insert(any());
}
```

- [ ] **Step 6: Run failing tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
mvn -Dtest=IpProxyServiceImplTest test
```

Expected before implementation: compilation or test failure because `allocationMode` is not persisted by service/entity yet.

---

### Task 3: Backend Detection Port and Service Behavior

**Files:**
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyCheckRequest.java`
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyCheckResult.java`
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/IpProxyDetector.java`
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/IpProxyCheckStatus.java`
- Modify: `armada/armada-api/src/main/java/com/armada/resource/mapper/IpProxyMapper.java`
- Modify: `armada/armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml`
- Modify: `armada/armada-api/src/main/java/com/armada/resource/service/impl/IpProxyServiceImpl.java`
- Test: `armada/armada-api/src/test/java/com/armada/resource/service/IpProxyServiceImplTest.java`

- [ ] **Step 1: Add check request record**

Create `IpProxyCheckRequest.java`:

```java
package com.armada.resource.check;

/**
 * 代理检测入参。
 */
public record IpProxyCheckRequest(
        Long proxyId,
        Integer protocol,
        String host,
        Integer port,
        String username,
        String password) {
}
```

- [ ] **Step 2: Add check result record**

Create `IpProxyCheckResult.java`:

```java
package com.armada.resource.check;

import java.math.BigDecimal;

/**
 * 代理检测结果。success=false 时 errorMessage 必须给前端展示。
 */
public record IpProxyCheckResult(
        boolean success,
        String connectionStatus,
        String whatsappStatus,
        String outboundIp,
        String countryCode,
        String location,
        String isp,
        BigDecimal latitude,
        BigDecimal longitude,
        String errorMessage) {

    public static IpProxyCheckResult failed(String connectionStatus, String whatsappStatus, String errorMessage) {
        return new IpProxyCheckResult(
                false,
                connectionStatus,
                whatsappStatus,
                null,
                null,
                null,
                null,
                null,
                null,
                errorMessage);
    }
}
```

- [ ] **Step 3: Add detector port**

Create `IpProxyDetector.java`:

```java
package com.armada.resource.check;

/**
 * 真实代理检测端口。
 */
public interface IpProxyDetector {

    /**
     * 通过代理发起真实网络检测。
     *
     * @param request 代理端点和鉴权信息
     * @return 检测结果
     */
    IpProxyCheckResult check(IpProxyCheckRequest request);
}
```

- [ ] **Step 4: Add check status enum**

Create `IpProxyCheckStatus.java`:

```java
package com.armada.resource.model;

/**
 * 检测结果展示枚举。
 */
public enum IpProxyCheckStatus {
    SUCCESS("success", "检测成功"),
    FAILED("failed", "检测失败");

    private final String value;
    private final String label;

    IpProxyCheckStatus(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String value() {
        return value;
    }

    public String label() {
        return label;
    }
}
```

- [ ] **Step 5: Add mapper methods**

Add to `IpProxyMapper.java`:

```java
List<IpProxy> selectActiveByIds(@Param("ids") List<Long> ids);

int updateCheckResult(
        @Param("id") Long id,
        @Param("status") Integer status,
        @Param("region") String region,
        @Param("lastSampleCheckAt") Long lastSampleCheckAt,
        @Param("detectedCountryCode") String detectedCountryCode,
        @Param("outboundIp") String outboundIp,
        @Param("detectedLocation") String detectedLocation,
        @Param("detectedIsp") String detectedIsp,
        @Param("detectedLatitude") java.math.BigDecimal detectedLatitude,
        @Param("detectedLongitude") java.math.BigDecimal detectedLongitude,
        @Param("checkFailCount") Integer checkFailCount,
        @Param("lastCheckError") String lastCheckError,
        @Param("updatedAt") Long updatedAt);
```

- [ ] **Step 6: Add mapper XML methods**

Add to `IpProxyMapper.xml`:

```xml
<select id="selectActiveByIds" resultType="com.armada.resource.model.entity.IpProxy">
    SELECT <include refid="Columns"/>
    FROM ip_proxy
    WHERE deleted_at IS NULL
      AND id IN
      <foreach collection="ids" item="id" open="(" separator="," close=")">
          #{id}
      </foreach>
    ORDER BY id ASC
</select>

<update id="updateCheckResult">
    UPDATE ip_proxy
    SET status = #{status},
        region = #{region},
        last_sample_check_at = #{lastSampleCheckAt},
        detected_country_code = #{detectedCountryCode},
        outbound_ip = #{outboundIp},
        detected_location = #{detectedLocation},
        detected_isp = #{detectedIsp},
        detected_latitude = #{detectedLatitude},
        detected_longitude = #{detectedLongitude},
        check_fail_count = #{checkFailCount},
        last_check_error = #{lastCheckError},
        updated_at = #{updatedAt}
    WHERE id = #{id}
      AND deleted_at IS NULL
</update>
```

- [ ] **Step 7: Inject detector into service**

Change constructor in `IpProxyServiceImpl`:

```java
private final IpProxyDetector detector;

public IpProxyServiceImpl(
        IpProxyMapper mapper,
        IpProxyConverter converter,
        CountryService countryService,
        IpProxyDetector detector) {
    this.mapper = mapper;
    this.converter = converter;
    this.countryService = countryService;
    this.detector = detector;
}
```

Update tests to add:

```java
@Mock
private IpProxyDetector detector;
```

- [ ] **Step 8: Implement import allocation behavior**

In `normalizeImport`, normalize `allocationMode`:

```java
IpProxyAllocationMode mode = IpProxyAllocationMode.fromValue(dto.allocationMode());
String submitted = mode == IpProxyAllocationMode.MIXED
        ? "MIXED"
        : (StringUtils.hasText(dto.countryValue()) ? dto.countryValue() : dto.region());
String region = mode == IpProxyAllocationMode.MIXED
        ? countryService.resolveIpRegion("MIXED")
        : countryService.resolveIpRegion(submitted);
return new IpProxyImportDTO(region, dto.protocol(), dto.source(), dto.text(), dto.countryValue(), mode.value());
```

This keeps legacy smart imports compatible when an old caller still sends `countryValue`.

- [ ] **Step 9: Implement single check helper**

Add private helper to `IpProxyServiceImpl`:

```java
private IpProxyCheckResultVO checkAndPersist(IpProxy proxy, boolean allowSmartRegionUpdate) {
    IpProxyCheckRequest request = new IpProxyCheckRequest(
            proxy.getId(),
            proxy.getProtocol(),
            proxy.getHost(),
            proxy.getPort(),
            proxy.getUsername(),
            proxy.getPassword());
    IpProxyCheckResult result = detector.check(request);
    long now = System.currentTimeMillis();
    String region = proxy.getRegion();
    Integer nextStatus;
    Integer failCount;
    String error = null;

    if (result.success()) {
        nextStatus = proxy.getStatus() != null && proxy.getStatus().equals(IpProxyStatus.IN_USE.code())
                ? IpProxyStatus.IN_USE.code()
                : IpProxyStatus.IDLE.code();
        failCount = 0;
        if (allowSmartRegionUpdate && StringUtils.hasText(result.countryCode())) {
            region = countryService.resolveIpRegionByIso2(result.countryCode());
        }
    } else {
        nextStatus = IpProxyStatus.UNAVAILABLE.code();
        failCount = proxy.getCheckFailCount() == null ? 1 : proxy.getCheckFailCount() + 1;
        error = result.errorMessage();
    }

    mapper.updateCheckResult(
            proxy.getId(),
            nextStatus,
            region,
            now,
            result.countryCode(),
            result.outboundIp(),
            result.location(),
            result.isp(),
            result.latitude(),
            result.longitude(),
            failCount,
            error,
            now);

    return new IpProxyCheckResultVO(
            proxy.getId(),
            result.success() ? "success" : "failed",
            result.success() ? "检测成功" : "检测失败",
            result.connectionStatus(),
            result.whatsappStatus(),
            result.outboundIp(),
            result.countryCode(),
            region,
            result.location(),
            result.isp(),
            result.latitude(),
            result.longitude(),
            now,
            failCount,
            error);
}
```

- [ ] **Step 10: Add VO used above**

Create `armada/armada-api/src/main/java/com/armada/resource/model/vo/IpProxyCheckResultVO.java`:

```java
package com.armada.resource.model.vo;

import java.math.BigDecimal;

public record IpProxyCheckResultVO(
        Long id,
        String checkStatus,
        String checkStatusLabel,
        String connectionStatus,
        String whatsappStatus,
        String outboundIp,
        String countryCode,
        String region,
        String location,
        String isp,
        BigDecimal latitude,
        BigDecimal longitude,
        Long checkedAt,
        Integer failCount,
        String errorMessage) {
}
```

- [ ] **Step 11: Update import persistence**

In `persistProxy`, set allocation fields before insert:

```java
row.setAllocationMode(dto.allocationMode());
row.setCheckFailCount(0);
```

After `mapper.insert(row)`, call detection:

```java
boolean smart = IpProxyAllocationMode.SMART.value().equals(dto.allocationMode());
try {
    checkAndPersist(row, smart);
} catch (RuntimeException ex) {
    long now = System.currentTimeMillis();
    mapper.updateCheckResult(
            row.getId(),
            IpProxyStatus.UNAVAILABLE.code(),
            row.getRegion(),
            now,
            null,
            null,
            null,
            null,
            null,
            null,
            1,
            ex.getMessage(),
            now);
}
```

Return `true` after insert even if detection fails, because the row was imported and marked unavailable.

- [ ] **Step 12: Add public service methods**

Add to `IpProxyService`:

```java
IpProxyCheckResultVO checkOne(Long id);

List<IpProxyCheckResultVO> checkBatch(List<Long> ids);
```

Implement in `IpProxyServiceImpl`:

```java
@Override
@Transactional(rollbackFor = Exception.class)
public IpProxyCheckResultVO checkOne(Long id) {
    if (id == null) {
        throw new BusinessException(ErrorCode.VALIDATION, "IP ID 不能为空");
    }
    IpProxy proxy = mapper.selectActiveById(id);
    if (proxy == null) {
        throw new BusinessException(ErrorCode.NOT_FOUND, "IP 不存在或已删除");
    }
    boolean smart = IpProxyAllocationMode.SMART.value().equals(proxy.getAllocationMode());
    return checkAndPersist(proxy, smart);
}

@Override
@Transactional(rollbackFor = Exception.class)
public List<IpProxyCheckResultVO> checkBatch(List<Long> ids) {
    List<Long> normalized = normalizeProxyIds(ids);
    if (normalized.isEmpty()) {
        throw new BusinessException(ErrorCode.VALIDATION, "请选择要检测的 IP");
    }
    if (normalized.size() > 20) {
        throw new BusinessException(ErrorCode.VALIDATION, "一次最多检测 20 个 IP");
    }
    List<IpProxy> rows = mapper.selectActiveByIds(normalized);
    if (rows.size() != normalized.size()) {
        throw new BusinessException(ErrorCode.VALIDATION, "部分 IP 不存在或已删除");
    }
    List<IpProxyCheckResultVO> results = new ArrayList<>(rows.size());
    for (IpProxy proxy : rows) {
        boolean smart = IpProxyAllocationMode.SMART.value().equals(proxy.getAllocationMode());
        results.add(checkAndPersist(proxy, smart));
    }
    return results;
}
```

- [ ] **Step 13: Add service tests**

Append:

```java
@Test
void checkOne_successUpdatesCountryForSmartProxy() {
    IpProxy proxy = idleProxy();
    proxy.setId(10L);
    proxy.setAllocationMode("smart");
    proxy.setCheckFailCount(2);
    when(mapper.selectActiveById(10L)).thenReturn(proxy);
    when(countryService.resolveIpRegionByIso2("IN")).thenReturn("印度");
    when(detector.check(any())).thenReturn(new IpProxyCheckResult(
            true,
            "HTTP 代理已就绪",
            "CONNECT 隧道建立，WhatsApp 响应 400",
            "47.15.30.133",
            "IN",
            "India(IN) · Haryana · Sonipat",
            "Reliance Jio",
            new java.math.BigDecimal("28.9933000"),
            new java.math.BigDecimal("77.0210000"),
            null));

    IpProxyCheckResultVO result = service.checkOne(10L);

    assertThat(result.checkStatus()).isEqualTo("success");
    assertThat(result.region()).isEqualTo("印度");
    verify(mapper).updateCheckResult(
            eq(10L),
            eq(IpProxyStatus.IDLE.code()),
            eq("印度"),
            anyLong(),
            eq("IN"),
            eq("47.15.30.133"),
            eq("India(IN) · Haryana · Sonipat"),
            eq("Reliance Jio"),
            any(),
            any(),
            eq(0),
            isNull(),
            anyLong());
}

@Test
void checkOne_failedMarksUnavailableAndIncrementsFailCount() {
    IpProxy proxy = idleProxy();
    proxy.setId(10L);
    proxy.setAllocationMode("mixed");
    proxy.setRegion("混合（不限国家）");
    proxy.setCheckFailCount(2);
    when(mapper.selectActiveById(10L)).thenReturn(proxy);
    when(detector.check(any())).thenReturn(IpProxyCheckResult.failed(
            "代理连接失败",
            "未建立 CONNECT 隧道",
            "代理认证失败"));

    IpProxyCheckResultVO result = service.checkOne(10L);

    assertThat(result.checkStatus()).isEqualTo("failed");
    assertThat(result.failCount()).isEqualTo(3);
    verify(mapper).updateCheckResult(
            eq(10L),
            eq(IpProxyStatus.UNAVAILABLE.code()),
            eq("混合（不限国家）"),
            anyLong(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(3),
            eq("代理认证失败"),
            anyLong());
}
```

Add imports if missing:

```java
import static org.mockito.ArgumentMatchers.isNull;
import com.armada.resource.check.IpProxyCheckResult;
import com.armada.resource.check.IpProxyDetector;
import com.armada.resource.model.vo.IpProxyCheckResultVO;
```

- [ ] **Step 14: Run service tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
mvn -Dtest=IpProxyServiceImplTest test
```

Expected: all `IpProxyServiceImplTest` tests pass.

---

### Task 4: Backend Real HTTP Detector Adapter

**Files:**
- Create: `armada/armada-api/src/main/java/com/armada/resource/check/HttpIpProxyDetector.java`
- Test: `armada/armada-api/src/test/java/com/armada/resource/check/HttpIpProxyDetectorTest.java`

- [ ] **Step 1: Add detector adapter skeleton**

Create `HttpIpProxyDetector.java`:

```java
package com.armada.resource.check;

import com.armada.platform.proxy.ProxyEndpoint;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.Authenticator;
import java.net.InetSocketAddress;
import java.net.PasswordAuthentication;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class HttpIpProxyDetector implements IpProxyDetector {

    private static final Duration TIMEOUT = Duration.ofSeconds(8);
    private static final URI IPIFY_URI = URI.create("https://api.ipify.org?format=json");
    private static final URI WHATSAPP_URI = URI.create("https://web.whatsapp.com/");
    private static final String GEO_URL = "http://ip-api.com/json/{ip}";

    private final ObjectMapper objectMapper;

    public HttpIpProxyDetector(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public IpProxyCheckResult check(IpProxyCheckRequest request) {
        try {
            HttpClient client = clientFor(request);
            String outboundIp = fetchOutboundIp(client);
            String whatsappStatus = checkWhatsApp(client);
            Geo geo = fetchGeo(outboundIp);
            return new IpProxyCheckResult(
                    true,
                    protocolLabel(request.protocol()) + " 代理已就绪",
                    whatsappStatus,
                    outboundIp,
                    geo.countryCode(),
                    geo.location(),
                    geo.isp(),
                    geo.latitude(),
                    geo.longitude(),
                    null);
        } catch (Exception ex) {
            return IpProxyCheckResult.failed(
                    protocolLabel(request == null ? null : request.protocol()) + " 代理连接失败",
                    "未建立 CONNECT 隧道，未获取 WhatsApp 响应",
                    ex.getMessage());
        }
    }

    private HttpClient clientFor(IpProxyCheckRequest request) {
        if (request == null || request.host() == null || request.port() == null) {
            throw new IllegalArgumentException("代理地址不能为空");
        }
        HttpClient.Builder builder = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .proxy(ProxySelector.of(new InetSocketAddress(request.host(), request.port())));
        if (request.username() != null && request.password() != null) {
            builder.authenticator(new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(
                            request.username(),
                            request.password().toCharArray());
                }
            });
        }
        return builder.build();
    }

    private String fetchOutboundIp(HttpClient client) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(IPIFY_URI)
                .timeout(TIMEOUT)
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("出口 IP 查询失败: HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        String ip = root.path("ip").asText("");
        if (ip.isBlank()) {
            throw new IOException("出口 IP 查询结果为空");
        }
        return ip;
    }

    private String checkWhatsApp(HttpClient client) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(WHATSAPP_URI)
                .timeout(TIMEOUT)
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int code = response.statusCode();
        if (code >= 200 && code < 500) {
            return "CONNECT 隧道建立，WhatsApp 响应 " + code;
        }
        throw new IOException("WhatsApp 响应异常: HTTP " + code);
    }

    private Geo fetchGeo(String ip) throws IOException, InterruptedException {
        URI uri = URI.create(UriComponentsBuilder
                .fromUriString(GEO_URL)
                .build(Map.of("ip", ip))
                .toString());
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(TIMEOUT)
                .GET()
                .build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("归属地查询失败: HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        String status = root.path("status").asText("");
        if (!"success".equalsIgnoreCase(status)) {
            throw new IOException("归属地查询失败: " + root.path("message").asText("unknown"));
        }
        String countryCode = root.path("countryCode").asText("");
        String country = root.path("country").asText("");
        String region = root.path("regionName").asText("");
        String city = root.path("city").asText("");
        String location = country + "(" + countryCode + ") · " + region + " · " + city;
        return new Geo(
                countryCode,
                location,
                root.path("isp").asText(""),
                root.hasNonNull("lat") ? root.path("lat").decimalValue() : null,
                root.hasNonNull("lon") ? root.path("lon").decimalValue() : null);
    }

    private static String protocolLabel(Integer protocol) {
        if (protocol != null && protocol == ProxyEndpoint.PROTOCOL_SOCKS5) {
            return "SOCKETS";
        }
        return "HTTP";
    }

    record Geo(
            String countryCode,
            String location,
            String isp,
            BigDecimal latitude,
            BigDecimal longitude) {
    }
}
```

- [ ] **Step 2: Add adapter unit test for failed input**

Create `HttpIpProxyDetectorTest.java`:

```java
package com.armada.resource.check;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class HttpIpProxyDetectorTest {

    private final HttpIpProxyDetector detector = new HttpIpProxyDetector(new ObjectMapper());

    @Test
    void check_nullProxyReturnsFailedResult() {
        IpProxyCheckResult result = detector.check(null);

        assertThat(result.success()).isFalse();
        assertThat(result.connectionStatus()).contains("代理连接失败");
        assertThat(result.whatsappStatus()).contains("未建立 CONNECT");
        assertThat(result.errorMessage()).isNotBlank();
    }
}
```

- [ ] **Step 3: Run detector test**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
mvn -Dtest=HttpIpProxyDetectorTest test
```

Expected: pass without external network, because this test only validates failure mapping.

- [ ] **Step 4: Manual real-proxy verification hook**

Do not hardcode credentials in tests. Add a local-only manual command note to the PR or execution notes:

```bash
curl -x http://USER:PASS@HOST:PORT https://api.ipify.org?format=json
```

Expected with a valid HTTP proxy: JSON contains `ip`. For SOCKETS proxies, use:

```bash
curl --socks5-hostname HOST:PORT --proxy-user USER:PASS https://api.ipify.org?format=json
```

This manual check validates provider credentials outside unit tests.

---

### Task 5: Backend Controller Endpoints

**Files:**
- Create: `armada/armada-api/src/main/java/com/armada/resource/model/dto/IpProxyBatchCheckDTO.java`
- Modify: `armada/armada-api/src/main/java/com/armada/resource/controller/IpProxyController.java`
- Test: `armada/armada-api/src/test/java/com/armada/resource/controller/IpProxyControllerTest.java`

- [ ] **Step 1: Create batch DTO**

Create `IpProxyBatchCheckDTO.java`:

```java
package com.armada.resource.model.dto;

import java.util.List;

public record IpProxyBatchCheckDTO(List<Long> ids) {
}
```

- [ ] **Step 2: Add controller endpoints**

In `IpProxyController`, add imports:

```java
import com.armada.resource.model.dto.IpProxyBatchCheckDTO;
import com.armada.resource.model.vo.IpProxyCheckResultVO;
```

Add methods:

```java
@PostMapping("/{id}/check")
public ApiResponse<IpProxyCheckResultVO> checkOne(@PathVariable Long id) {
    return ApiResponse.ok(service.checkOne(id));
}

@PostMapping("/batch-check")
public ApiResponse<List<IpProxyCheckResultVO>> checkBatch(@RequestBody IpProxyBatchCheckDTO request) {
    return ApiResponse.ok(service.checkBatch(request.ids()));
}
```

Add missing `PathVariable` import:

```java
import org.springframework.web.bind.annotation.PathVariable;
```

- [ ] **Step 3: Add controller contract tests**

Create `IpProxyControllerTest.java` if missing. Use existing Spring MVC test patterns in `IpProxyStatsControllerTest`. Add:

```java
@Test
void checkOne_returnsCheckResult() throws Exception {
    when(service.checkOne(10L)).thenReturn(new IpProxyCheckResultVO(
            10L,
            "success",
            "检测成功",
            "HTTP 代理已就绪",
            "CONNECT 隧道建立，WhatsApp 响应 400",
            "47.15.30.133",
            "IN",
            "印度",
            "India(IN) · Haryana · Sonipat",
            "Reliance Jio",
            new BigDecimal("28.9933000"),
            new BigDecimal("77.0210000"),
            1719800000000L,
            0,
            null));

    mockMvc.perform(post("/api/ip-proxies/10/check"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(10))
            .andExpect(jsonPath("$.data.checkStatus").value("success"))
            .andExpect(jsonPath("$.data.region").value("印度"));
}

@Test
void checkBatch_postsIds() throws Exception {
    when(service.checkBatch(List.of(10L, 11L))).thenReturn(List.of());

    mockMvc.perform(post("/api/ip-proxies/batch-check")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"ids\":[10,11]}"))
            .andExpect(status().isOk());

    verify(service).checkBatch(List.of(10L, 11L));
}
```

- [ ] **Step 4: Run controller tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
mvn -Dtest=IpProxyControllerTest test
```

Expected: pass.

---

### Task 6: Frontend API Contract

**Files:**
- Modify: `wheel-saas-pure-web/src/api/resource-ip-mapping.ts`
- Modify: `wheel-saas-pure-web/src/api/resource-ip.ts`
- Modify: `wheel-saas-pure-web/src/api/resource-ip.test.ts`

- [ ] **Step 1: Update mapping types**

In `resource-ip-mapping.ts`, add:

```ts
export type IpAllocationMode = "mixed" | "smart";
export type IpCheckStatus = "success" | "failed";
```

Extend `BackendIpProxyRow`:

```ts
status?: number | null;
statusLabel?: string | null;
allocationMode?: IpAllocationMode | null;
allocationModeLabel?: string | null;
outboundIp?: string | null;
detectedCountryCode?: string | null;
detectedLocation?: string | null;
detectedIsp?: string | null;
detectedLatitude?: number | null;
detectedLongitude?: number | null;
checkFailCount?: number | null;
lastCheckError?: string | null;
lastSampleCheckAt?: number | null;
```

Extend `IpManageRow`:

```ts
status: string;
statusCode: number | null;
allocationMode: IpAllocationMode | "";
allocationModeLabel: string;
outboundIp: string;
detectedCountryCode: string;
detectedLocation: string;
detectedIsp: string;
detectedLatitude: number | null;
detectedLongitude: number | null;
checkFailCount: number;
lastCheckError: string;
lastSampleCheckAt: string;
```

Update `normalizeIpProxyRow`:

```ts
status: row.statusLabel ?? "",
statusCode: row.status ?? null,
allocationMode: row.allocationMode ?? "",
allocationModeLabel: row.allocationModeLabel ?? "",
outboundIp: row.outboundIp ?? "",
detectedCountryCode: row.detectedCountryCode ?? "",
detectedLocation: row.detectedLocation ?? "",
detectedIsp: row.detectedIsp ?? "",
detectedLatitude: row.detectedLatitude ?? null,
detectedLongitude: row.detectedLongitude ?? null,
checkFailCount: row.checkFailCount ?? 0,
lastCheckError: row.lastCheckError ?? "",
lastSampleCheckAt: formatEpochMillis(row.lastSampleCheckAt)
```

- [ ] **Step 2: Update API input and check methods**

In `resource-ip.ts`, update import input:

```ts
export interface IpProxyImportInput {
  allocationMode: IpAllocationMode;
  proxyType: ProxyTypeLabel;
  source: string;
  text: string;
}
```

Update request body:

```ts
data: {
  allocationMode: input.allocationMode,
  protocol: proxyTypeToProtocol(input.proxyType),
  source: input.source,
  text: input.text
}
```

Add result type:

```ts
export interface IpProxyCheckResult {
  id: number;
  checkStatus: IpCheckStatus;
  checkStatusLabel: string;
  connectionStatus: string;
  whatsappStatus: string;
  outboundIp: string | null;
  countryCode: string | null;
  region: string | null;
  location: string | null;
  isp: string | null;
  detectedLatitude: number | null;
  detectedLongitude: number | null;
  checkedAt: number | null;
  failCount: number | null;
  errorMessage: string | null;
}
```

Add API functions:

```ts
export function checkIpProxy(id: number): Promise<IpProxyCheckResult> {
  return armadaRequest<IpProxyCheckResult>("post", `/api/ip-proxies/${id}/check`);
}

export function batchCheckIpProxies(ids: number[]): Promise<IpProxyCheckResult[]> {
  return armadaRequest<IpProxyCheckResult[]>("post", "/api/ip-proxies/batch-check", {
    data: { ids }
  });
}
```

- [ ] **Step 3: Update API tests**

In `resource-ip.test.ts`, replace country import expectation with:

```ts
it("imports IP proxies with allocationMode", async () => {
  resetArmadaMock({
    totalRows: 1,
    insertedRows: 1,
    skippedRows: 0,
    failedRows: 0,
    errors: []
  });

  await importIpProxies({
    allocationMode: "smart",
    proxyType: "HTTP",
    source: "iproyal",
    text: "1.1.1.1:8080:u:p"
  });

  assert.deepEqual(armadaCalls(), [
    {
      method: "post",
      url: "/api/ip-proxies/import",
      opts: {
        data: {
          allocationMode: "smart",
          protocol: 1,
          source: "iproyal",
          text: "1.1.1.1:8080:u:p"
        }
      }
    }
  ]);
});
```

Add:

```ts
it("checks a single IP proxy", async () => {
  resetArmadaMock({ id: 10, checkStatus: "success" });

  await checkIpProxy(10);

  assert.deepEqual(armadaCalls(), [
    {
      method: "post",
      url: "/api/ip-proxies/10/check",
      opts: undefined
    }
  ]);
});

it("checks selected IP proxies in batch", async () => {
  resetArmadaMock([]);

  await batchCheckIpProxies([10, 11]);

  assert.deepEqual(armadaCalls(), [
    {
      method: "post",
      url: "/api/ip-proxies/batch-check",
      opts: { data: { ids: [10, 11] } }
    }
  ]);
});
```

Add imports:

```ts
import {
  batchCheckIpProxies,
  checkIpProxy,
  importIpProxies,
  listIpCountryOptions,
  listTenantIpRegions
} from "./resource-ip";
```

- [ ] **Step 4: Run frontend API tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm test src/api/resource-ip.test.ts
```

Expected: pass. If the project has no `test` script, run:

```bash
node --import tsx src/api/resource-ip.test.ts
```

Expected: pass or fail only because `tsx` is unavailable; if unavailable, record that and rely on typecheck/build later.

---

### Task 7: Frontend Import Dialog

**Files:**
- Modify: `wheel-saas-pure-web/src/views/resource/ip/composables/useResourceIpPage.ts`
- Modify: `wheel-saas-pure-web/src/views/resource/ip/components/IpImportDialog.vue`
- Modify: `wheel-saas-pure-web/src/views/resource/ip/index.vue`

- [ ] **Step 1: Update import form type**

In `useResourceIpPage.ts`, change `IpImportForm`:

```ts
export interface IpImportForm {
  allocationMode: IpAllocationMode;
  proxyType: ProxyTypeLabel;
  source: string;
}
```

Add import:

```ts
import type {
  IpAllocationMode,
  IpManageRow,
  ProxyTypeLabel
} from "@/api/resource-ip-mapping";
```

Define options:

```ts
const allocationModeOptions: Array<{ label: string; value: IpAllocationMode; desc: string }> = [
  {
    label: "智能分配",
    value: "smart",
    desc: "导入后检测出口国家，并按 country 表落到对应国家"
  },
  {
    label: "混合分组",
    value: "mixed",
    desc: "直接进入混合分组，作为不限国家兜底池"
  }
];
```

- [ ] **Step 2: Reset default import form**

Change both initial `importForm` and `openImportDialog` to:

```ts
const importForm = ref<IpImportForm>({
  allocationMode: "smart",
  proxyType: "HTTP",
  source: ""
});
```

and:

```ts
importForm.value = {
  allocationMode: "smart",
  proxyType: "HTTP",
  source: ""
};
```

- [ ] **Step 3: Remove country validation and submit allocation mode**

In `submitImport`, delete the country required check. Send:

```ts
const result = await importIpProxies({
  allocationMode: importForm.value.allocationMode,
  proxyType: importForm.value.proxyType,
  source: importForm.value.source.trim(),
  text
});
```

Return `allocationModeOptions` from composable.

- [ ] **Step 4: Update dialog props**

In `IpImportDialog.vue`, remove props:

```ts
countryOptions: IpCountryOption[];
countryOptionLabel: (option: IpCountryOption) => string;
```

Remove `IpCountryOption` import.

Add prop:

```ts
allocationModeOptions: Array<{
  label: string;
  value: IpAllocationMode;
  desc: string;
}>;
```

Add import:

```ts
import type { IpAllocationMode, ProxyTypeLabel } from "@/api/resource-ip-mapping";
```

- [ ] **Step 5: Replace country form item with allocation mode**

Replace the country `<el-form-item>` with:

```vue
<el-form-item label="分配方式" required>
  <el-radio-group v-model="form.allocationMode" class="allocation-mode-group">
    <el-radio-button
      v-for="mode in allocationModeOptions"
      :key="mode.value"
      :label="mode.value"
      :value="mode.value"
    >
      {{ mode.label }}
    </el-radio-button>
  </el-radio-group>
  <div class="allocation-mode-desc">
    {{
      allocationModeOptions.find(item => item.value === form.allocationMode)?.desc
    }}
  </div>
</el-form-item>
```

Update format warning text to:

```vue
所选分配方式 / 来源 / 类型将作用于文件中全部记录。智能分配会在导入后检测出口国家并落到对应国家；混合分组会直接进入混合池。
```

- [ ] **Step 6: Pass prop from page**

In `index.vue`, destructure `allocationModeOptions` from composable and pass:

```vue
:allocation-mode-options="allocationModeOptions"
```

Remove `country-options` and `country-option-label` props from `<IpImportDialog>`.

- [ ] **Step 7: Style allocation mode desc**

Add to `IpImportDialog.vue` style:

```css
.allocation-mode-group {
  width: 100%;
}

.allocation-mode-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
```

- [ ] **Step 8: Run typecheck**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm typecheck
```

Expected: pass.

---

### Task 8: Frontend IP List Columns and Detection UI

**Files:**
- Modify: `wheel-saas-pure-web/src/views/resource/ip/composables/useResourceIpPage.ts`
- Modify: `wheel-saas-pure-web/src/views/resource/ip/index.vue`
- Create: `wheel-saas-pure-web/src/views/resource/ip/components/IpCheckResultDialog.vue`

- [ ] **Step 1: Add detection state**

In `useResourceIpPage.ts`, add imports:

```ts
import {
  batchCheckIpProxies,
  checkIpProxy,
  type IpProxyCheckResult
} from "@/api/resource-ip";
```

Add refs:

```ts
const checkingIds = ref<Set<number>>(new Set());
const batchChecking = ref(false);
const checkResultVisible = ref(false);
const checkResults = ref<IpProxyCheckResult[]>([]);
```

Add helpers:

```ts
function setChecking(ids: number[], checking: boolean): void {
  const next = new Set(checkingIds.value);
  ids.forEach(id => {
    if (checking) {
      next.add(id);
    } else {
      next.delete(id);
    }
  });
  checkingIds.value = next;
}

function isChecking(id: number): boolean {
  return checkingIds.value.has(id);
}
```

- [ ] **Step 2: Add single detection action**

Add:

```ts
async function checkSingleIp(row: IpManageRow): Promise<void> {
  setChecking([row.id], true);
  try {
    const result = await checkIpProxy(row.id);
    checkResults.value = [result];
    checkResultVisible.value = true;
    message(result.checkStatus === "success" ? "IP 检测成功" : "IP 检测失败", {
      type: result.checkStatus === "success" ? "success" : "warning"
    });
    await refreshIpList();
  } catch (error) {
    message(apiErrorMessage(error, "IP 检测失败"), { type: "error" });
  } finally {
    setChecking([row.id], false);
  }
}
```

- [ ] **Step 3: Add batch detection action**

Add:

```ts
async function checkSelectedIps(): Promise<void> {
  if (selectedRows.value.length === 0) {
    message("请先选择要检测的 IP", { type: "warning" });
    return;
  }
  const ids = selectedRows.value.map(row => row.id);
  batchChecking.value = true;
  setChecking(ids, true);
  try {
    const results = await batchCheckIpProxies(ids);
    checkResults.value = results;
    checkResultVisible.value = true;
    const failed = results.filter(item => item.checkStatus === "failed").length;
    message(`检测完成：成功 ${results.length - failed}，失败 ${failed}`, {
      type: failed > 0 ? "warning" : "success"
    });
    await refreshIpList();
  } catch (error) {
    message(apiErrorMessage(error, "批量检测失败"), { type: "error" });
  } finally {
    batchChecking.value = false;
    setChecking(ids, false);
  }
}
```

Return `batchChecking`, `checkingIds`, `checkResultVisible`, `checkResults`, `checkSingleIp`, `checkSelectedIps`, `isChecking`.

- [ ] **Step 4: Update columns**

Change columns array to:

```ts
const columns: TableColumnList = [
  { label: "国家", prop: "country", width: 130 },
  { label: "分配方式", prop: "allocationModeLabel", width: 120 },
  { label: "类型", prop: "proxyType", width: 110 },
  { label: "状态", prop: "status", width: 110 },
  { label: "代理地址", prop: "proxyAddress", minWidth: 220 },
  { label: "用户名", prop: "username", minWidth: 140 },
  { label: "密码", prop: "password", minWidth: 140 },
  { label: "来源", prop: "source", minWidth: 140 },
  { label: "有效账号", prop: "validAccountCount", width: 110 },
  { label: "最近检测时间", prop: "lastSampleCheckAt", width: 180 },
  { label: "失败次数", prop: "checkFailCount", width: 100 },
  { label: "创建时间", prop: "createdAt", width: 180 },
  { label: "操作", prop: "operation", fixed: "right", width: 100 }
];
```

- [ ] **Step 5: Add result dialog component**

Create `IpCheckResultDialog.vue`:

```vue
<script setup lang="ts">
import type { IpProxyCheckResult } from "@/api/resource-ip";
import { formatEpochMillis } from "@/utils/time";

defineOptions({
  name: "IpCheckResultDialog"
});

defineProps<{
  results: IpProxyCheckResult[];
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-dialog
    v-model="visible"
    title="代理检测结果"
    width="960px"
    destroy-on-close
  >
    <el-table :data="results" border max-height="520">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="checkStatusLabel" label="结果" width="110">
        <template #default="{ row }">
          <el-tag :type="row.checkStatus === 'success' ? 'success' : 'danger'">
            {{ row.checkStatusLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="connectionStatus" label="连接状态" min-width="180" show-overflow-tooltip />
      <el-table-column prop="whatsappStatus" label="WhatsApp" min-width="220" show-overflow-tooltip />
      <el-table-column prop="outboundIp" label="出口 IP" min-width="130" />
      <el-table-column prop="region" label="国家" min-width="120" />
      <el-table-column prop="location" label="归属地" min-width="220" show-overflow-tooltip />
      <el-table-column prop="isp" label="运营商" min-width="180" show-overflow-tooltip />
      <el-table-column label="经纬度" min-width="150">
        <template #default="{ row }">
          <span v-if="row.detectedLatitude != null && row.detectedLongitude != null">
            {{ row.detectedLatitude }}, {{ row.detectedLongitude }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="检测时间" width="180">
        <template #default="{ row }">
          {{ formatEpochMillis(row.checkedAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="errorMessage" label="失败原因" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.errorMessage || "-" }}
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
```

- [ ] **Step 6: Update page buttons**

In `index.vue`, import component:

```ts
import IpCheckResultDialog from "./components/IpCheckResultDialog.vue";
import Connection from "~icons/ep/connection";
```

Destructure:

```ts
batchChecking,
checkResultVisible,
checkResults,
checkSelectedIps,
checkSingleIp,
isChecking
```

Add batch detection button after batch delete:

```vue
<el-button
  plain
  :loading="batchChecking"
  :disabled="selectedRows.length === 0"
  :icon="useRenderIcon(Connection)"
  @click="checkSelectedIps"
>
  批量检测
</el-button>
```

Add operation column after created time:

```vue
<el-table-column
  v-if="!dynamicColumns[12].hide"
  label="操作"
  fixed="right"
  width="100"
>
  <template #default="{ row }">
    <el-button
      link
      type="primary"
      :loading="isChecking(row.id)"
      @click="checkSingleIp(row)"
    >
      检测
    </el-button>
  </template>
</el-table-column>
```

Add status columns matching the new `columns` order. Keep password column displaying `row.password`.

Add dialog near bottom:

```vue
<IpCheckResultDialog
  v-model="checkResultVisible"
  :results="checkResults"
/>
```

- [ ] **Step 7: Run typecheck**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm typecheck
```

Expected: pass.

---

### Task 9: Frontend Guide Light Compression

**Files:**
- Modify: `wheel-saas-pure-web/src/views/resource/ip/index.vue`

- [ ] **Step 1: Reduce guide spacing without collapsing content**

Change CSS:

```css
.ip-manage-page {
  padding: 12px;
}

.ip-guide-card :deep(.el-card__body) {
  padding: 12px 14px;
}

.ip-guide-body {
  margin-top: 10px;
}

.ip-provider-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.ip-provider-card {
  min-height: 74px;
  padding: 10px 12px;
}

.ip-provider-brand {
  margin-bottom: 6px;
}

.ip-recommend-alert {
  margin-top: 10px;
}
```

Keep `guideCollapsed` default as `false`.

- [ ] **Step 2: Run build**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm build
```

Expected: build succeeds.

---

### Task 10: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Backend XML validation**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada
xmllint --noout armada-api/src/main/resources/mapper/resource/IpProxyMapper.xml
```

Expected: no output, exit code `0`.

- [ ] **Step 2: Backend unit tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/armada/armada-api
mvn -Dtest=IpProxyServiceImplTest,IpProxyControllerTest,HttpIpProxyDetectorTest test
```

Expected: all tests pass.

- [ ] **Step 3: Frontend API tests**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm test src/api/resource-ip.test.ts
```

Expected: pass if test script exists. If no `test` script exists, run the same fallback used in Task 6 and document the result.

- [ ] **Step 4: Frontend typecheck**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Frontend production build**

Run:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm build
```

Expected: pass.

- [ ] **Step 6: Manual browser verification**

Start dev server:

```bash
cd /Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web
pnpm dev
```

Open the printed local URL and verify:

- IP 管理顶部提示仍默认展开，但高度比原来低。
- TXT 批量导入弹窗没有国家字段。
- 分配方式默认智能分配。
- 代理类型展示 `HTTP / SOCKETS`。
- 密码列仍显示后端返回的明文。
- 表格有状态、分配方式、最近检测时间、失败次数、操作列。
- 未选择 IP 时批量检测按钮禁用。
- 选择 IP 后批量检测按钮可点击，并展示 loading。
- 行内检测点击后当前行按钮 loading。
- 检测结果弹窗展示连接状态、WhatsApp、出口 IP、国家、归属地、运营商、经纬度、失败原因。

---

## Self-Review

### Spec Coverage

- 导入去国家字段：Task 7.
- 混合直接进入混合分组：Task 2, Task 3.
- 智能检测出口国家并匹配 `country` 表：Task 2, Task 3, Task 4.
- 前端展示 `SOCKETS`：Task 6 keeps `ProxyTypeLabel` unchanged.
- 密码不脱敏：Task 8 explicitly keeps password column displaying `row.password`.
- 检测真做：Task 3, Task 4, Task 5, Task 8.
- IP 数据统计交给其他 agent：Non-Goals.
- 顶部提示轻微压缩：Task 9.

### Risk Notes

- JDK `HttpClient` 的代理认证对常规 HTTP 代理最稳；SOCKETS 认证如遇供应商兼容问题，需要把 `HttpIpProxyDetector` 替换为协议层 Node 检测端口或专用 HTTP client。业务层不受影响，因为已经通过 `IpProxyDetector` 端口隔离。
- 导入同步检测大量 IP 会拉长请求耗时。第一版仍按当前 PRD 做真实检测；如实测超时，应把导入检测改为任务化，不改前端表单口径。
- 当前批量检测限制 20 条；如果运营需要更大批量，下一刀做检测任务和轮询。

