import type { RouteLocationNormalizedGeneric } from 'vue-router';

const DEFAULT_LOCALE = 'pl';

export const useSitePath = () => {
  const routeBaseName = useRouteBaseName();
  const localeRoute = useLocaleRoute();
  return (route: RouteLocationNormalizedGeneric): string => {
    const name = routeBaseName(route)?.toString();
    return (name && localeRoute({ name, params: route.params }, DEFAULT_LOCALE)?.path) || route.path;
  };
};

export const useCurrentSitePath = () => {
  const sitePath = useSitePath();
  const route = useRoute();
  return computed(() => sitePath(route));
};
