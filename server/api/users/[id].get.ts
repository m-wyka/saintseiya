export default defineEventHandler((event) => foundOr404(findProfile(requiredIdParam(event)), 'ERRORS.USER_NOT_FOUND'));
