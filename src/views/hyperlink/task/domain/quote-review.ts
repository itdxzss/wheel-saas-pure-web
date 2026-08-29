import type { HyperlinkTaskQuote } from "@/api/hyperlink-task-lifecycle";

export const HYPERLINK_QUOTE_REVIEW_DELAY_MS = 7_000;

export interface HyperlinkQuoteReview {
  quote: HyperlinkTaskQuote;
  openedAt: number;
}

export type HyperlinkQuoteReviewState =
  | { status: "COUNTING"; remainingMs: number }
  | { status: "READY"; remainingMs: 0 }
  | { status: "EXPIRED"; remainingMs: 0 };

export function beginHyperlinkQuoteReview(
  quote: HyperlinkTaskQuote,
  openedAt = Date.now()
): HyperlinkQuoteReview {
  return { quote, openedAt };
}

/** 7 秒只控制确认交互；报价是否有效始终只看服务端 expiresAt。 */
export function hyperlinkQuoteReviewState(
  review: HyperlinkQuoteReview,
  now = Date.now()
): HyperlinkQuoteReviewState {
  if (now >= review.quote.expiresAt) {
    return { status: "EXPIRED", remainingMs: 0 };
  }
  const remainingMs = Math.max(
    0,
    review.openedAt + HYPERLINK_QUOTE_REVIEW_DELAY_MS - now
  );
  return remainingMs > 0
    ? { status: "COUNTING", remainingMs }
    : { status: "READY", remainingMs: 0 };
}
