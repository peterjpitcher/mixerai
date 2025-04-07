import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COMING_SOON_PATHS = [
  '/content/create/product',
  '/content/create/recipe',
  '/content/create/email',
  '/content/create/social',
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // Check if we're on an auth page
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  if (!session && !isAuthPage) {
    // Redirect to sign in if accessing protected route without session
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthPage) {
    // Redirect to home if accessing auth page with session
    return NextResponse.redirect(new URL('/admin/brands', request.url))
  }

  // Check if the requested path is in the coming soon list
  if (COMING_SOON_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    // Redirect to the content creation page
    return NextResponse.redirect(new URL('/content/create', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 