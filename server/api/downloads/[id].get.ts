import { routes } from '#shared/utils/routes';

export default defineEventHandler((event) => {
  const file = foundOr404(registerDownload(requiredIdParam(event)), 'ERRORS.FILE_NOT_FOUND');
  return sendRedirect(event, routes.media(file), 302);
});
