export const usePageQuery = () => {
  const route = useRoute();
  return computed(() => {
    const page = Number(route.query.page);
    return Number.isInteger(page) && page >= 1 ? page : 1;
  });
};
