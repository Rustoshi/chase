import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const session      = req.auth
  const { pathname } = req.nextUrl

  // Propagate pathname to server-component layouts via request headers.
  // app/admin/layout.tsx reads x-pathname to decide whether to render the shell.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)

  const withPathname = { request: { headers: requestHeaders } }

  // ── Admin routes ──────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Login is always public — pass through (with the pathname header)
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next(withPathname)
    }

    if (!session || session.user?.role !== "admin") {
      const url = new URL("/admin/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  // ── User app routes (/app/*) ──────────────────────────────────────────────────
  if (pathname.startsWith("/app")) {
    if (!session) {
      const url = new URL("/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next(withPathname)
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.json|sw\\.js).*)",
  ],
}
