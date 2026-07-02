import type { RouterScrollBehavior } from "vue-router";

export const scrollBehavior: RouterScrollBehavior = (
  _to,
  from,
  savedPosition
) => {
  if (savedPosition) {
    return savedPosition;
  }

  if (from.meta.saveSrollTop) {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    return { left: 0, top };
  }

  return { left: 0, top: 0 };
};
