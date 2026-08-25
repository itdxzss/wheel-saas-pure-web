export interface InitRouterDependencies<TRoute, TRouter> {
  cacheKey: () => string | null;
  readCache: (key: string) => TRoute[] | null;
  loadRoutes: () => Promise<TRoute[]>;
  applyRoutes: (routes: TRoute[]) => void;
  writeCache: (key: string, routes: TRoute[]) => void;
  router: () => TRouter;
}

/** 创建可测试的动态路由初始化函数；请求和装配异常均原样向调用方传播。 */
export function createInitRouter<TRoute, TRouter>(
  dependencies: InitRouterDependencies<TRoute, TRouter>
): () => Promise<TRouter> {
  return async function initRouter(): Promise<TRouter> {
    const cacheKey = dependencies.cacheKey();
    const cachedRoutes = cacheKey ? dependencies.readCache(cacheKey) : null;
    if (cachedRoutes?.length) {
      dependencies.applyRoutes(cachedRoutes);
      return dependencies.router();
    }

    const routes = await dependencies.loadRoutes();
    dependencies.applyRoutes(routes);
    if (cacheKey) dependencies.writeCache(cacheKey, routes);
    return dependencies.router();
  };
}
