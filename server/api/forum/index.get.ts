export default defineEventHandler(async (event) => forumIndex(await viewerOf(event), contentLocaleOf(event)));
