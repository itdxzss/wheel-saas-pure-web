import { armadaRequest } from "@/api/armada";
import {
  mapWheelMenuNodes,
  type PureAdminAsyncRoute,
  type WheelMenuNode
} from "@/api/menu-mapping";

type Result = {
  success: boolean;
  data: PureAdminAsyncRoute[];
};

export async function getAsyncRoutes(): Promise<Result> {
  const menus = await armadaRequest<WheelMenuNode[]>(
    "get",
    "/api/tenant/me/menus"
  );
  return {
    success: true,
    data: mapWheelMenuNodes(menus)
  };
};
