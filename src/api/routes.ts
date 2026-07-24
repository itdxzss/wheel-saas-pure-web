import { armadaRequest } from "./armada";
import type { RouteRecordRaw } from "vue-router";

/** 当前登录用户的真实租户动态菜单。 */
export const getAsyncRoutes = () =>
  armadaRequest<RouteRecordRaw[]>("get", "/api/tenant/me/menus");
