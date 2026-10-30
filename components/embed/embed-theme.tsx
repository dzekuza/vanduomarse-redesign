import { embedFontHrefs, embedThemeCss, parseEmbedTheme } from "@/lib/embed-theme";

/**
 * Applies the WordPress plugin's appearance settings (query params) to an
 * /embed page. Values are validated in `parseEmbedTheme`; nothing renders
 * when the URL carries no overrides.
 */
export function EmbedTheme({ params }: { params: Record<string, string | string[] | undefined> }) {
  const theme = parseEmbedTheme(params);
  const css = embedThemeCss(theme);
  const fonts = embedFontHrefs(theme);
  if (!css && !fonts.length) return null;

  return (
    <>
      {fonts.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      {css ? <style>{css}</style> : null}
    </>
  );
}
