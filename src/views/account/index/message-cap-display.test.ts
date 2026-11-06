import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MessageCap, MessageCapItem } from "@/api/account-message-cap";
import {
  QUERY_STATUS_META,
  enumLabel,
  formatCycle,
  formatEpochSeconds,
  formatQuota,
  formatRemaining,
  formatSubscription,
  queryStatusNote,
  rawJsonText,
  resultStatusLabel
} from "./message-cap-display";

function cap(patch: Partial<MessageCap> = {}): MessageCap {
  return {
    resultStatus: "OK",
    totalQuota: "1000",
    usedQuota: "200",
    remaining: "800",
    cappingStatus: "NONE",
    cycleStart: "1793509200",
    cycleEnd: "1796101199",
    serverSentTimestamp: "1793883238",
    mvStatus: "NOT_ELIGIBLE",
    oteStatus: "NOT_ELIGIBLE",
    subscriptionStatus: null,
    subscriptionName: null,
    extensions: null,
    fetchedAt: "2026-11-05T12:53:58Z",
    failure: null,
    debug: null,
    ...patch
  };
}

describe("message cap display", () => {
  it("never presents the -1 sentinel as unlimited, zero or a remaining count", () => {
    assert.equal(formatQuota("-1"), "-1（平台特殊值）");
    assert.equal(
      formatRemaining(cap({ totalQuota: "-1", remaining: null })),
      "未知"
    );
    assert.ok(!formatQuota("-1").includes("无限"));
  });

  it("keeps a real zero distinct from unknown", () => {
    assert.equal(formatQuota("0"), "0");
    assert.equal(formatRemaining(cap({ remaining: "0" })), "0");
    assert.equal(formatQuota(null), "—");
    assert.equal(formatRemaining(null), "—");
  });

  it("keeps integers above 2^53 exact because they stay strings", () => {
    assert.equal(formatQuota("9007199254740993"), "9007199254740993");
  });

  it("labels known enums and shows unknown values verbatim", () => {
    assert.equal(enumLabel("cappingStatus", "CAPPED"), "已达上限（CAPPED）");
    assert.equal(enumLabel("oteStatus", "EXHAUSTED"), "已用完（EXHAUSTED）");
    assert.equal(
      enumLabel("mvStatus", "ACTIVE_UPGRADE_AVAILABLE"),
      "已开通·可升级（ACTIVE_UPGRADE_AVAILABLE）"
    );
    assert.equal(enumLabel("cappingStatus", "SOMETHING_NEW"), "SOMETHING_NEW");
    assert.equal(enumLabel("cappingStatus", null), "—");
  });

  it("formats epoch seconds in local time and passes invalid input through", () => {
    const expected = (() => {
      const d = new Date(1793509200 * 1000);
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    })();
    assert.equal(formatEpochSeconds("1793509200"), expected);
    assert.equal(formatEpochSeconds("not-a-time"), "not-a-time");
    assert.equal(formatEpochSeconds(null), "—");
    assert.match(formatCycle(cap()), /~/);
    assert.equal(formatCycle(cap({ cycleStart: null, cycleEnd: null })), "—");
  });

  it("shows subscription status and name only when the platform returned them", () => {
    assert.equal(formatSubscription(cap()), "—");
    assert.equal(
      formatSubscription(
        cap({ subscriptionStatus: "ACTIVE", subscriptionName: "MP4B" })
      ),
      "已开通（ACTIVE） · MP4B"
    );
  });

  it("describes every query status and surfaces failure codes", () => {
    for (const status of Object.keys(QUERY_STATUS_META)) {
      assert.ok(
        QUERY_STATUS_META[status as keyof typeof QUERY_STATUS_META].label
      );
    }
    assert.equal(resultStatusLabel("NON_NUMERIC_QUOTA"), "平台未下发有效额度");
    assert.equal(resultStatusLabel("FUTURE_STATUS"), "FUTURE_STATUS");
    const failed: MessageCapItem = {
      accountId: 1,
      phone: "9190",
      backend: "ANDROID",
      queryStatus: "FAILED",
      errorCode: "TIMEOUT",
      cap: null
    };
    assert.equal(queryStatusNote(failed), "TIMEOUT");
    assert.equal(queryStatusNote({ ...failed, queryStatus: "OFFLINE" }), "");
  });

  it("exposes the full item including raw debug data for experiments", () => {
    const item: MessageCapItem = {
      accountId: 1,
      phone: "9190",
      backend: "ANDROID",
      queryStatus: "SUCCESS",
      errorCode: null,
      cap: cap({ debug: { format: "ARGO", rawHex: "0408" } })
    };
    assert.match(rawJsonText(item), /"rawHex": "0408"/);
  });
});
