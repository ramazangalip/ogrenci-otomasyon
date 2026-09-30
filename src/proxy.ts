// Next.js 16 Proxy (eski middleware.ts yerine)
// Rol bazlı rota koruması: /admin/* → TEACHER, /veli/* → PARENT
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik dosyalar ve API auth rotaları için atla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname === "/giris" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Session token'ı kontrol et (JWT cookie)
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Giriş yapmamış kullanıcıyı login sayfasına yönlendir
  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/veli"))) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Statik dosyalar, resimler ve metadata dosyaları hariç tüm rotalar
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.png$).*)",
  ],
};
