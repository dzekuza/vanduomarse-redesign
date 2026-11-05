import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { frameAncestors } from "@/lib/embed";
import { GATE_COOKIE, GATE_PATH, gateExempt, hasGatePass, siteGateOn } from "@/lib/site-gate";
import { supabaseEnv } from "@/lib/supabase/env";

const LOGIN_PATH = "/admin/prisijungti";

/**
 * /embed/* (booking widgets): only the origins in EMBED_ALLOWED_ORIGINS may
 * frame them. Read per request (on Vercel an env change still needs a redeploy).
 */
function embedResponse() {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", `frame-ancestors ${frameAncestors(process.env.EMBED_ALLOWED_ORIGINS)}`);
  return response;
}

/** Paths that need the Supabase session refresh below; every other matched path only passes the gate. */
const SESSION_PREFIXES = ["/admin", "/rezervacija", "/paskyra"];

/**
 * Site gate (SITE_GATE=1): every public path shows the coming-soon page with a 503, URL unchanged.
 * Non-GET requests (the code form's server action) are rewritten without the 503 so the action answers normally.
 */
function gateResponse(request: NextRequest) {
  const target = new URL(GATE_PATH, request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.rewrite(target);
  return NextResponse.rewrite(target, { status: 503, headers: { "Retry-After": "86400", "Cache-Control": "no-store" } });
}

/**
 * Refreshes the Supabase session cookie on /admin and /rezervacija requests (customers sign in
 * there with a one-time code) and sends signed-out visitors on /admin to the login page. The staff check itself happens in the admin
 * layout (and in RLS) — this only gates on "signed in at all".
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (siteGateOn() && !gateExempt(pathname) && !(await hasGatePass(request.cookies.get(GATE_COOKIE)?.value))) {
    return gateResponse(request);
  }
  if (pathname.startsWith("/embed")) return embedResponse();
  if (!SESSION_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims() validates the JWT and refreshes it when needed.
  const { data } = await supabase.auth.getClaims();
  // The reservation pages only need the customer's session kept fresh: nobody is sent to a login page.
  if (request.nextUrl.pathname.startsWith("/rezervacija") || request.nextUrl.pathname.startsWith("/paskyra")) return response;
  const signedIn = Boolean(data?.claims);
  const onLogin = request.nextUrl.pathname === LOGIN_PATH;

  if (!signedIn && !onLogin) {
    const login = request.nextUrl.clone();
    login.pathname = LOGIN_PATH;
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // Every page (for the site gate) except API routes, Next internals and files with an extension
  // (static assets, robots.txt, sitemap.xml).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
