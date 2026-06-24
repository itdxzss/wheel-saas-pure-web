// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */
const permissionRouter = {
  path: "/permission",
  meta: {
    title: "权限管理",
    icon: "ep:lollipop",
    rank: 10
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "页面权限",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "按钮权限",
        roles: ["admin", "common"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "路由返回按钮权限",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "登录接口返回按钮权限"
          }
        }
      ]
    }
  ]
};

const accountRouter = {
  path: "/account",
  meta: {
    title: "账号管理",
    icon: "ep:user",
    rank: 2,
    module_key: "account"
  },
  children: [
    {
      path: "/account/group/index",
      component: "account/group/index",
      name: "AccountGroup",
      meta: {
        title: "账号分组",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account-group:view"
      }
    }
  ]
};

const operationRouter = {
  path: "/operation",
  meta: {
    title: "运营管理",
    icon: "ep:operation",
    rank: 3,
    module_key: "ops_management"
  },
  children: [
    {
      path: "/resource/ip",
      component: "resource/ip/index",
      name: "ResourceIp",
      meta: {
        title: "IP 管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "resource_ip",
        perm_key: "tenant:resource:ips:list"
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        success: true,
        data: [accountRouter, operationRouter, permissionRouter]
      };
    }
  }
]);
