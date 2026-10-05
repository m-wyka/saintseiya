import { canAccess } from '#shared/utils/roles';
import { ADMIN_HOME, adminItemFor } from '~/utils/adminNavigation';

export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== ADMIN_HOME && !to.path.startsWith(`${ADMIN_HOME}/`)) {
    return;
  }
  const { user } = useUserSession();
  if (!canAccess(user.value, 'staff')) {
    return navigateTo('/');
  }
  const item = adminItemFor(to.path);
  if (item && !canAccess(user.value, item.access)) {
    return navigateTo(ADMIN_HOME);
  }
});
