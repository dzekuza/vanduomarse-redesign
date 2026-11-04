import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { frameAncestors } from "@/lib/embed";
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

/**
 * Refreshes the Supabase session cookie on /admin and /rezervacija requests (customers sign in
 * there with a one-time code) and sends signed-out visitors on /admin to the login page. The staff check itself happens in the admin
 * layout (and in RLS) — this only gates on "signed in at all".
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/embed")) return embedResponse();

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
  matcher: ["/admin/:path*", "/embed/:path*", "/rezervacija/:path*", "/paskyra/:path*"],
};
