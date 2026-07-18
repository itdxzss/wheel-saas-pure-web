import assert from "node:assert/strict";
import { describe, it } from "node:test";
import buyerRoute from "./modules/buyer";

describe("buyer static navigation", () => {
  it("contains one root, two groups and the three preview pages", () => {
    assert.equal(buyerRoute.path, "/buyer");
    assert.equal(buyerRoute.meta?.title, "买号上量系统");
    assert.equal(buyerRoute.children?.length, 2);

    const [promotion, data] = buyerRoute.children ?? [];
    assert.deepEqual(
      {
        title: promotion.meta?.title,
        paths: promotion.children?.map(route => route.path),
        names: promotion.children?.map(route => route.name)
      },
      {
        title: "推广管理",
        paths: ["/buyer/promotion/template", "/buyer/promotion/channel"],
        names: ["BuyerTemplate", "BuyerChannel"]
      }
    );
    assert.deepEqual(
      {
        title: data.meta?.title,
        paths: data.children?.map(route => route.path),
        names: data.children?.map(route => route.name)
      },
      {
        title: "数据中心",
        paths: ["/buyer/data/channel-stats"],
        names: ["BuyerChannelStats"]
      }
    );
    for (const leaf of [
      ...(promotion.children ?? []),
      ...(data.children ?? [])
    ]) {
      assert.equal(typeof leaf.component, "function");
    }
  });
});
