export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'admin');
  return readSetting('newsCenterTabs', contentLocaleOf(event));
});
