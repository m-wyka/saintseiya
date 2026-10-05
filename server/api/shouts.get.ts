export default defineEventHandler(async (event) => listShouts(await pageQuery(event)));
