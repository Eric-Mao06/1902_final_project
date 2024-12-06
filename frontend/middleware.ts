import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isSetupPage = request.nextUrl.pathname === '/auth/setup'
  const isSignInPage = request.nextUrl.pathname === '/auth/signin'

  // If user is not signed in and trying to access a protected route
  if (!token && !isAuthPage && !request.cookies.has('skipped-auth')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If signed in user tries to access signin page, redirect to setup
  if (isSignInPage && token) {
    return NextResponse.redirect(new URL('/auth/setup', request.url))
  }

  // If user has skipped auth and tries to access auth pages
  if (isAuthPage && request.cookies.has('skipped-auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
