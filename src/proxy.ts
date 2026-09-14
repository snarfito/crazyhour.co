import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not add code between createServerClient and getUser() — see Supabase's
  // own warning: it can cause hard-to-debug random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  // olvide-password and restablecer-password must stay reachable without a
  // session: the invite/recovery link's token arrives as a URL hash (never
  // sent to the server) or a one-time code that the page's client-side
  // Supabase client exchanges for a session itself once it renders.
  const isPublicPath =
    isLoginPage ||
    request.nextUrl.pathname === "/admin/olvide-password" ||
    request.nextUrl.pathname === "/admin/restablecer-password";

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/categorias";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
