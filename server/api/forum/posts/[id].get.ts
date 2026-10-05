export default defineEventHandler(async (event) =>
  foundOr404(postLocation(requiredIdParam(event), await viewerOf(event)), 'ERRORS.POST_NOT_FOUND'),
);
