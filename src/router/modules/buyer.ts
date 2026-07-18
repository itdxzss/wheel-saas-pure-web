export default {
  path: "/buyer",
  redirect: "/buyer/promotion/template",
  meta: {
    title: "买号上量系统",
    icon: "ri/rocket-2-line",
    rank: 6
  },
  children: [
    {
      path: "/buyer/promotion",
      redirect: "/buyer/promotion/template",
      meta: { title: "推广管理", icon: "ri/megaphone-line" },
      children: [
        {
          path: "/buyer/promotion/template",
          name: "BuyerTemplate",
          component: () => import("@/views/buyer/template/index.vue"),
          meta: {
            title: "模板管理（二期）",
            auths: [
              "tenant:buyer-template:view",
              "tenant:buyer-template:visibility",
              "tenant:buyer-template:remark"
            ]
          }
        },
        {
          path: "/buyer/promotion/channel",
          name: "BuyerChannel",
          component: () => import("@/views/buyer/channel/index.vue"),
          meta: {
            title: "渠道管理（二期）",
            auths: [
              "tenant:buyer-channel:view",
              "tenant:buyer-channel:create",
              "tenant:buyer-channel:edit",
              "tenant:buyer-channel:detect",
              "tenant:buyer-channel:delete"
            ]
          }
        }
      ]
    },
    {
      path: "/buyer/data",
      redirect: "/buyer/data/channel-stats",
      meta: { title: "数据中心", icon: "ri/bar-chart-2-line" },
      children: [
        {
          path: "/buyer/data/channel-stats",
          name: "BuyerChannelStats",
          component: () => import("@/views/buyer/channel-stats/index.vue"),
          meta: {
            title: "渠道统计（二期）",
            auths: [
              "tenant:buyer-channel-stats:view",
              "tenant:buyer-channel-stats:edit",
              "tenant:buyer-channel-stats:export"
            ]
          }
        }
      ]
    }
  ]
} satisfies RouteConfigsTable;
