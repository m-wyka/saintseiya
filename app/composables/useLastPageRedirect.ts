interface Pagination {
  page: number;
  pageCount: number;
}

export const useLastPageRedirect = () => {
  const route = useRoute();

  return (pagination: Pagination | null | undefined) =>
    pagination && pagination.page > pagination.pageCount
      ? navigateTo({
          path: route.path,
          query: { ...route.query, page: pagination.pageCount > 1 ? pagination.pageCount : undefined },
        })
      : undefined;
};
