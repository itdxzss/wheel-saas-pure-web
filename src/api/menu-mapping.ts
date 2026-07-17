export interface WheelMenuNode {
  route_path: string;
  menu_key: string;
  name: string;
  icon?: string | null;
  module_key?: string | null;
  perm_key?: string | null;
  view_path?: string | null;
  children?: WheelMenuNode[] | null;
}

export interface PureAdminAsyncRoute {
  path: string;
  name: string;
  component?: string;
  meta: {
    title: string;
    icon?: string;
    module_key?: string;
    perm_key?: string;
  };
  children?: PureAdminAsyncRoute[];
}

function mapWheelMenuNode(node: WheelMenuNode): PureAdminAsyncRoute {
  const meta: PureAdminAsyncRoute["meta"] = { title: node.name };
  if (node.icon) meta.icon = node.icon;
  if (node.module_key) meta.module_key = node.module_key;
  if (node.perm_key) meta.perm_key = node.perm_key;

  const route: PureAdminAsyncRoute = {
    path: node.route_path,
    name: node.menu_key,
    meta
  };
  if (node.view_path) route.component = node.view_path;
  if (node.children?.length) {
    route.children = node.children.map(mapWheelMenuNode);
  }
  return route;
}

export function mapWheelMenuNodes(
  nodes: WheelMenuNode[]
): PureAdminAsyncRoute[] {
  return nodes.map(mapWheelMenuNode);
}
