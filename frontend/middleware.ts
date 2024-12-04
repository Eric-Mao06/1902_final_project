import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // If user is not signed in and trying to access a protected route
  if (!token && !isAuthPage && !request.cookies.has('skipped-auth')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Allow access to auth pages only if not signed in and haven't skipped
  if (isAuthPage && (token || request.cookies.has('skipped-auth'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
