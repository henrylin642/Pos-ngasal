import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')
    const { pathname } = request.nextUrl

    // Public paths that do not require authentication
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/login') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public')
    ) {
        return NextResponse.next()
    }

    // If no token, redirect to login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token
    const payload = await verifyToken(token.value)
    if (!payload) {
        // Invalid token, clear it and redirect
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
    }

    const role = payload.role as string

    // Role based access control
    // Admin pages: only ADMIN
    if (pathname.startsWith('/admin')) {
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url)) // Or 403 page
        }
    }

    // Kitchen pages: KITCHEN or ADMIN
    if (pathname.startsWith('/kitchen')) {
        if (role !== 'KITCHEN' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Allow access
    const response = NextResponse.next()
    // Refresh token expiration if needed? (Simplest MVP: no refresh for now)
    return response
}

export const config = {
    matcher: ['/((?!api/login|_next/static|_next/image|favicon.ico).*)'],
}
