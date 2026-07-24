const Layout = () => import("@/layout/index.vue");

const developmentPreviewRoutes = import.meta.env.DEV
  ? [
      {
        path: "/date-v2-preview",
        name: "DateV2Preview",
        component: () => import("@/views/buyer/date-v2-preview/index.vue"),
        meta: {
          title: "约会二代预览",
          showLink: false
        }
      }
    ]
  : [];

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: "403",
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "500",
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  ...developmentPreviewRoutes
] satisfies Array<RouteConfigsTable>;
