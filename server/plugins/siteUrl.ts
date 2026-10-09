// The i18n module would freeze its base address at build time. Handing it the address the server was started
// with makes `canonical` and `hreflang` follow NUXT_PUBLIC_SITE_URL without a rebuild.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const { public: publicConfig } = useRuntimeConfig(event);
    publicConfig.i18n.baseUrl = publicConfig.siteUrl;
  });
});
