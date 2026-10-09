export default defineNitroPlugin((nitroApp) => {
  // The Vite dev client injects inline scripts that change between reloads, so the policy is for builds only.
  if (import.meta.dev) {
    return;
  }
  // Only the chunks Nuxt writes itself are trusted: a script that slipped into the rendered content stays blocked.
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nuxtScriptHashes = inlineScriptHashes([...html.head, ...html.bodyAppend]);
    setResponseHeader(event, 'content-security-policy', contentSecurityPolicy(nuxtScriptHashes));
  });
});
