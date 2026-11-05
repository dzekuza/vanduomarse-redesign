/** The production domain. `vanduomarse.lt` 308-redirects here, so links, webhooks and SEO use the www host. */
const PRODUCTION_URL = "https://www.vanduomarse.lt";

/** Public origin for metadata, robots and sitemap: SITE_URL when set, otherwise the production domain. */
export const SITE_URL = (process.env.SITE_URL?.trim() || PRODUCTION_URL).replace(/\/+$/, "");
