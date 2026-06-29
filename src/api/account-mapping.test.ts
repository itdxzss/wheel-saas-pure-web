import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toTenantAccountListParams } from "./account-mapping";

describe("account list mapping", () => {
  it("maps enabled account filters to armada backend query params", () => {
    assert.deepEqual(
      toTenantAccountListParams({
        page: 2,
        pageSize: 50,
        keyword: "备注",
        phone: "8613",
        account_type: 2,
        protocol_id: "proto-main",
        number_source: 3,
        account_state: 2,
        login_state: 1,
        risk_status: 2,
        mute_status: "6h",
        accountGroupId: 7,
        country: "印度",
        truth_ip: "203.0.113"
      }),
      {
        page: 2,
        pageSize: 50,
        keyword: "备注",
        phone: "8613",
        accountType: 2,
        protocolId: "proto-main",
        numberSource: 3,
        accountState: 2,
        loginState: 1,
        riskStatus: 2,
        muteStatus: 1,
        accountGroupId: 7,
        country: "印度",
        truthIp: "203.0.113"
      }
    );
  });

  it("does not forward disabled unsupported filters", () => {
    assert.deepEqual(
      toTenantAccountListParams({
        assigned_service: "客服A",
        ip_group_name: "IP分组A"
      }),
      {}
    );
  });
});
