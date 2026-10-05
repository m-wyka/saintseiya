import { routes } from '#shared/utils/routes';

export default defineEventHandler((event) => {
  const file = foundOr404(registerDownload(requiredIdParam(event)), 'Nie znaleziono pliku');
  return sendRedirect(event, routes.media(file), 302);
});
