export default defineEventHandler(async (event) =>
  foundOr404(postLocation(requiredIdParam(event), await viewerOf(event)), 'Nie znaleziono posta'),
);
