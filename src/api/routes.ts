import { armadaRequest } from "@/api/armada";
import type { RouteRecordRaw } from "vue-router";

const GROUP_PULL_MARKETING_ROUTE_NAME = "TaskGroupPullMarketing";
const PULL_TASK_ROUTE_NAME = "TaskPull";

/**
 * 为已获拉群营销权限的用户补充隐藏详情路由。
 * 详情路由不单独展示菜单，并沿用列表页的后端权限，避免依赖开发期 Mock。
 */
export const appendAuthorizedCompanionRoutes = (
  routes: RouteRecordRaw[]
): RouteRecordRaw[] =>
  routes.flatMap(route => {
    const normalizedRoute = route.children
      ? {
          ...route,
          children: appendAuthorizedCompanionRoutes(route.children)
        }
      : route;
    // 后端动态路由的 component 是组件路径字符串，后续由路由装配器解析为 Vue 组件。
    if (route.name === PULL_TASK_ROUTE_NAME) {
      const createRoute = {
        path: "/task/pull-task/create",
        component: "task/pull-task/create/index",
        name: "TaskPullCreate",
        meta: {
          ...route.meta,
          title: "新建拉群任务",
          showLink: false,
          activePath: route.path
        }
      } as unknown as RouteRecordRaw;
      return [normalizedRoute, createRoute];
    }
    if (route.name === GROUP_PULL_MARKETING_ROUTE_NAME) {
      const detailRoute = {
        path: "/task/group-pull-marketing/:id",
        component: "task/group-pull-marketing/detail/index",
        name: "TaskGroupPullMarketingDetail",
        meta: {
          ...route.meta,
          title: "拉群营销明细",
          showLink: false,
          activePath: "/task/group-pull-marketing"
        }
      } as unknown as RouteRecordRaw;
      return [normalizedRoute, detailRoute];
    }
    return [normalizedRoute];
  });

/** 当前登录用户的真实租户动态菜单。 */
export const getAsyncRoutes = async () =>
  appendAuthorizedCompanionRoutes(
    await armadaRequest<RouteRecordRaw[]>("get", "/api/tenant/me/menus")
  );
