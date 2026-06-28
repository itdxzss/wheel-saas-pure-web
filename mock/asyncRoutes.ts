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
      path: "/account/index",
      component: "account/index/index",
      name: "AccountIndex",
      meta: {
        title: "账号列表",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account:view"
      }
    },
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

const taskRouter = {
  path: "/task",
  meta: {
    title: "任务中心",
    icon: "ep:list",
    rank: 3,
    module_key: "pull_task"
  },
  children: [
    {
      path: "/account/import",
      component: "account/import/index",
      name: "AccountImport",
      meta: {
        title: "账号导入",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account:edit"
      }
    },
    {
      path: "/task/group-link/imports",
      component: "group/imports/index",
      name: "TaskGroupLinkImports",
      meta: {
        title: "导入链接",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "group_link",
        perm_key: "tenant:group_link:view"
      }
    },
    {
      path: "/group/list",
      component: "group/list/index",
      name: "GroupList",
      meta: {
        title: "群组列表",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "ws_group",
        perm_key: "tenant:group_link:view"
      }
    }
  ]
};

const materialRouter = {
  path: "/material",
  meta: {
    title: "素材管理",
    icon: "ep:collection",
    rank: 4,
    module_key: "material_management"
  },
  children: [
    {
      path: "/task/marketing",
      component: "material/marketing-template/index",
      name: "TaskMarketingTemplate",
      meta: {
        title: "营销模版",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "marketing_template",
        perm_key: "tenant:marketing_template:view"
      }
    }
  ]
};

const operationRouter = {
  path: "/operation",
  meta: {
    title: "运营管理",
    icon: "ep:operation",
    rank: 5,
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
        data: [
          accountRouter,
          taskRouter,
          materialRouter,
          operationRouter,
          permissionRouter
        ]
      };
    }
  }
]);
