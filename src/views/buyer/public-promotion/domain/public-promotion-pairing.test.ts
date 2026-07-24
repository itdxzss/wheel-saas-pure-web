import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
// Node 的 strip-types 测试运行器需要显式 .ts 扩展名。
// @ts-expect-error 测试运行时约束与项目打包器的扩展名规则不同。
const pairingDomain = await import("./public-promotion-pairing.ts");
const {
  isTerminalPublicPromotionPairingStatus,
  normalizePublicPromotionPairingPhone,
  validatePublicPromotionPairingPhone
} = pairingDomain;

describe("public promotion pairing", () => {
  it("builds the digits-only international phone expected by the backend", () => {
    const phone = normalizePublicPromotionPairingPhone("+91", "98765-43210");
    assert.equal(phone, "919876543210");
    assert.equal(validatePublicPromotionPairingPhone(phone), undefined);
    assert.match(validatePublicPromotionPairingPhone("123") ?? "", /10～15/);
  });

  it("stops polling only for terminal backend statuses", () => {
    assert.equal(isTerminalPublicPromotionPairingStatus("REQUESTING"), false);
    assert.equal(
      isTerminalPublicPromotionPairingStatus("WAITING_CONFIRMATION"),
      false
    );
    assert.equal(isTerminalPublicPromotionPairingStatus("FINALIZING"), false);
    assert.equal(isTerminalPublicPromotionPairingStatus("SUCCEEDED"), true);
    assert.equal(isTerminalPublicPromotionPairingStatus("FAILED"), true);
    assert.equal(isTerminalPublicPromotionPairingStatus("EXPIRED"), true);
  });

  it("uses the shared session flow from every completed template", () => {
    const dateSource = readFileSync(
      new URL("../../date-v2-preview/index.vue", import.meta.url),
      "utf8"
    );
    const earnSource = readFileSync(
      new URL("../../basic-earn-preview/index.vue", import.meta.url),
      "utf8"
    );
    for (const source of [dateSource, earnSource]) {
      assert.match(source, /usePublicPromotionPairing\(\)/);
      assert.match(source, /pairing\.start\(/);
      assert.doesNotMatch(source, /pairingCode\s*=\s*ref\(["']11111111/);
    }
  });

  it("calls only the two public Armada pairing endpoints", () => {
    const apiSource = readFileSync(
      new URL("../../../../api/public-promotion-channel.ts", import.meta.url),
      "utf8"
    );
    assert.match(
      apiSource,
      /promotion-channels\/\$\{encodeURIComponent\(channelCode\)\}\/pairing-sessions/
    );
    assert.match(apiSource, /promotion-pairing-sessions\/status/);
    assert.match(apiSource, /["']X-Pairing-Session-Token["']/);
  });
});
