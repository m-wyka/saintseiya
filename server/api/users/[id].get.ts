export default defineEventHandler((event) =>
  foundOr404(findProfile(requiredIdParam(event)), 'Nie znaleziono użytkownika'),
);
