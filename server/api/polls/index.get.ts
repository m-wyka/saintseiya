export default defineEventHandler(async (event) =>
  listPolls(await pageQuery(event), (await viewerOf(event))?.id ?? null),
);
