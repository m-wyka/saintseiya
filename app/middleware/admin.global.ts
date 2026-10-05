import { canAccess } from '#shared/utils/roles';
import { ADMIN_HOME, adminItemFor } from '~/utils/adminNavigation';

export default defineNuxtRouteMiddleware((to) => {
  const path = useSitePath()(to);
  if (path !== ADMIN_HOME && !path.startsWith(`${ADMIN_HOME}/`)) {
    return;
  }
  const localePath = useLocalePath();
  const { user } = useUserSession();
  if (!canAccess(user.value, 'staff')) {
    return navigateTo(localePath('/'));
  }
  const item = adminItemFor(path);
  if (item && !canAccess(user.value, item.access)) {
    return navigateTo(localePath(ADMIN_HOME));
  }
});
