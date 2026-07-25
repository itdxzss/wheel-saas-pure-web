/**
 * 判断菜单节点是否应保留。
 *
 * 后端会给叶子菜单和空目录都返回 `children: []`。叶子菜单有 component，
 * 应正常展示；只有没有 component 的空目录才需要隐藏。
 */
export function shouldKeepMenuNode(node: {
  component?: unknown;
  children?: unknown[];
}): boolean {
  return (
    !Array.isArray(node.children) ||
    node.children.length > 0 ||
    Boolean(node.component)
  );
}

/**
 * 查找后端路由对应的页面模块。
 *
 * 目录节点没有 component，只负责分组和承载子菜单，不能根据 `/system`
 * 这类父路径猜测页面组件，否则会误匹配到目录下的第一个页面。
 */
export function findViewModuleKey(
  route: {
    path?: string;
    component?: unknown;
    children?: unknown[];
  },
  moduleKeys: string[]
): string | undefined {
  const componentPath =
    typeof route.component === "string" ? route.component : undefined;
  if (
    !componentPath &&
    Array.isArray(route.children) &&
    route.children.length
  ) {
    return undefined;
  }
  const matcher = componentPath || route.path;
  return matcher ? moduleKeys.find(key => key.includes(matcher)) : undefined;
}
