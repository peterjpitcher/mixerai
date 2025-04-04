import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // During development, redirect auth routes to /content
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/content', request.url))
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*']
} // Empty matcher means no routes will be processed by middleware 