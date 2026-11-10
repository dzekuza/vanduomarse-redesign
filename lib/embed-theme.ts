/**
 * Appearance overrides for the /embed widgets, set in the WordPress plugin and
 * passed as query params (`?bg=f1d8ce&font=Inter`). Every value is validated
 * here (hex colours, plain font names) before it reaches CSS, so a crafted URL
 * can only recolour its own iframe. Pure: safe on client and server (ADR-0015).
 */

/** Query param → token it overrides. */
const COLOR_TOKENS = {
  bg: "--dust",
  surface: "--foam",
  muted: "--dust-soft",
  text: "--ink",
  accent: "--rust",
  tab: "--tab",
  tab_active: "--tab-active",
  tab_text: "--tab-active-foreground",
} as const;

const FONT_PARAMS = ["font", "heading"] as const;
const CASE_PARAM = "heading_case";

/** Every theme param, so in-widget navigation can carry them along. */
export const EMBED_THEME_PARAMS: readonly string[] = [...Object.keys(COLOR_TOKENS), ...FONT_PARAMS, CASE_PARAM];

type SearchParams = Record<string, string | string[] | undefined>;

export interface EmbedTheme {
  colors: [token: string, hex: string][];
  font: string | null;
  heading: string | null;
  headingCase: "uppercase" | "none" | null;
}

const HEX = /^[0-9a-f]{3}([0-9a-f]{3})?$/i;
/** Google Fonts family names: letters, digits, spaces. Nothing that could close a CSS string. */
const FONT_NAME = /^[A-Za-z0-9 ]{1,40}$/;

function single(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v.trim() : null;
}

function fontName(value: string | string[] | undefined): string | null {
  const v = single(value);
  return v && FONT_NAME.test(v) ? v.replace(/\s+/g, " ") : null;
}

export function parseEmbedTheme(params: SearchParams): EmbedTheme {
  const colors = Object.entries(COLOR_TOKENS).flatMap(([param, token]): [string, string][] => {
    const v = single(params[param])?.replace(/^#/, "");
    return v && HEX.test(v) ? [[token, `#${v.toLowerCase()}`]] : [];
  });
  const headingCase = single(params[CASE_PARAM]);
  return {
    colors,
    font: fontName(params.font),
    heading: fontName(params.heading),
    headingCase: headingCase === "upper" ? "uppercase" : headingCase === "none" ? "none" : null,
  };
}

/**
 * CSS for the overrides, or `null` when there are none. Scoped to
 * `body.theme-marse` so it beats the theme's own tokens and also recolours the
 * page background behind the widget.
 */
export function embedThemeCss(theme: EmbedTheme): string | null {
  const decls = theme.colors.map(([token, hex]) => `${token}:${hex}`);
  // A recoloured tab gets a hover in its own family, not the page's --dust-soft.
  const tab = theme.colors.find(([token]) => token === "--tab");
  if (tab) decls.push(`--tab-hover:color-mix(in srgb,${tab[1]} 85%,white)`);
  // design-check-ignore-next-line font-family: embed font comes from a validated query param set by the widget owner
  if (theme.font) decls.push(`font-family:"${theme.font}",system-ui,sans-serif`);
  if (theme.heading) decls.push(`--display-face:"${theme.heading}"`);
  if (theme.headingCase) decls.push(`--display-case:${theme.headingCase}`);
  return decls.length ? `body.theme-marse{${decls.join(";")}}` : null;
}

/**
 * Google Fonts stylesheets for the chosen families. Two per family, both always
 * loaded in parallel (a <link> has no fallback): regular + bold, and plain
 * regular, which is the one that works for families without a 700 weight
 * (Google rejects the whole request when a weight is missing). The extra
 * request is small and cached; it buys support for any family name.
 */
export function embedFontHrefs(theme: EmbedTheme): string[] {
  const families = [...new Set([theme.font, theme.heading].filter((f): f is string => f !== null))];
  return families.flatMap((f) => {
    const family = encodeURIComponent(f).replace(/%20/g, "+");
    return [
      `https://fonts.googleapis.com/css2?family=${family}:wght@400;700&display=swap`,
      `https://fonts.googleapis.com/css2?family=${family}&display=swap`,
    ];
  });
}

/** Copies theme params from `from` onto `to`, for links that stay inside the widget. */
export function carryEmbedTheme(from: URLSearchParams, to: URLSearchParams): void {
  for (const key of EMBED_THEME_PARAMS) {
    const v = from.get(key);
    if (v !== null && !to.has(key)) to.set(key, v);
  }
}
