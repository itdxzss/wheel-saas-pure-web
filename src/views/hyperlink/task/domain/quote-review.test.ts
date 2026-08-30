import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HyperlinkTaskQuote } from "@/api/hyperlink-task-lifecycle";
import {
  beginHyperlinkQuoteReview,
  hyperlinkQuoteReviewState
} from "./quote-review";

describe("hyperlink quote review gate", () => {
  it("keeps the seven-second interaction gate separate from quote expiry", () => {
    const review = beginHyperlinkQuoteReview(quote(20_000), 1_000);

    assert.deepEqual(hyperlinkQuoteReviewState(review, 7_999), {
      status: "COUNTING",
      remainingMs: 1
    });
    assert.deepEqual(hyperlinkQuoteReviewState(review, 8_000), {
      status: "READY",
      remainingMs: 0
    });
  });

  it("expires solely from expiresAt even while the review countdown is running", () => {
    const review = beginHyperlinkQuoteReview(quote(5_000), 1_000);

    assert.deepEqual(hyperlinkQuoteReviewState(review, 5_000), {
      status: "EXPIRED",
      remainingMs: 0
    });
  });
});

function quote(expiresAt: number): HyperlinkTaskQuote {
  return {
    quoteToken: "quote",
    expiresAt,
    dataPackageId: 21,
    dataPackageGeneration: 2,
    dataPackageName: "号码包",
    recipientCount: 10,
    configuredMaxExecutingAccounts: 0,
    effectiveMaxExecutingAccounts: 6,
    pricingMode: "NORMAL",
    priceCode: "normal",
    currencyCode: "USD",
    unitPrice: 1,
    pricingBreakdown: [],
    estimatedAmount: 10,
    accountBalance: 20,
    giftBalance: 0,
    availableBalance: 20
  };
}
