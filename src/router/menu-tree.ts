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
