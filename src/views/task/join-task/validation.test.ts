import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import * as validation from "./validation.ts";

const {
  canonicalizeStrictJoinLink,
  countStrictValidJoinLinks,
  validateModeTwoDistribution
} = validation;

describe("join task mode two validation", () => {
  it("rejects when checked account count differs from configured count", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 3,
        executorAccountCount: 2,
        linksPerAccount: 2,
        validLinkCount: 4
      }),
      "勾选账号数量与填写的执行账号数量不一致，请重新填写"
    );
  });

  it("rejects valid links above account capacity", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 2,
        executorAccountCount: 2,
        linksPerAccount: 2,
        validLinkCount: 5
      }),
      "有效群链接数量超过任务容量，请补充账号或提高每账号链接上限"
    );
  });

  it("accepts fewer valid links than capacity", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 3,
        executorAccountCount: 3,
        linksPerAccount: 2,
        validLinkCount: 5
      }),
      null
    );
  });

  it("accepts exactly the configured capacity", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 3,
        executorAccountCount: 3,
        linksPerAccount: 2,
        validLinkCount: 6
      }),
      null
    );
  });

  it("leaves the empty-link error to the general form validation", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 2,
        executorAccountCount: 2,
        linksPerAccount: 2,
        validLinkCount: 0
      }),
      null
    );
  });

  it("rejects non-positive distribution values", () => {
    assert.equal(
      validateModeTwoDistribution({
        selectedAccountCount: 2,
        executorAccountCount: 2,
        linksPerAccount: 0,
        validLinkCount: 1
      }),
      "执行账号数量和每账号链接数必须为正整数"
    );
  });

  it("counts only links accepted by the backend strict format", () => {
    assert.equal(
      countStrictValidJoinLinks([
        "https://chat.whatsapp.com/ABC123",
        "https://CHAT.WHATSAPP.COM/XYZ789/",
        "http://chat.whatsapp.com/HTTP",
        "https://chat.whatsapp.com/QUERY?x=1",
        "not-a-link"
      ]),
      2
    );
  });

  it("counts equivalent URL variants only once while preserving invite-code case", () => {
    assert.equal(
      countStrictValidJoinLinks([
        "https://chat.whatsapp.com/AbC123",
        "HTTPS://CHAT.WHATSAPP.COM/AbC123/",
        "https://chat.whatsapp.com/aBc123"
      ]),
      2
    );
  });

  it("canonicalizes accepted URL variants for task submission", () => {
    assert.equal(
      canonicalizeStrictJoinLink("HTTPS://CHAT.WHATSAPP.COM/AbC123/"),
      "https://chat.whatsapp.com/AbC123"
    );
    assert.equal(canonicalizeStrictJoinLink("not-a-link"), null);
  });
});
