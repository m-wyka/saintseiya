export const useRouteParam = (name: string) => {
  const route = useRoute();
  return computed(() => [route.params[name]].flat().filter(Boolean).join('/'));
};
