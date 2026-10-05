export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  return dashboardStatistics();
});
