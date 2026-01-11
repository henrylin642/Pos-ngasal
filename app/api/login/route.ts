import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { storeCode, username, password } = body

        if (!storeCode || !username || !password) {
            console.log('[Login] Missing credentials')
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        console.log(`[Login] Attempting login for: ${username} @ ${storeCode}`)

        // 1. Find the Store
        const store = await prisma.store.findUnique({
            where: { code: storeCode }
        })

        if (!store) {
            console.log('[Login] Store not found')
            return NextResponse.json({ error: 'Invalid store code' }, { status: 401 })
        }

        // 2. Find the User in this Store
        const user = await prisma.user.findUnique({
            where: {
                storeId_username: {
                    storeId: store.id,
                    username: username
                }
            },
        })

        if (!user) {
            console.log('[Login] User not found in DB')
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        console.log(`[Login] User found: ${user.username}, Role: ${user.role}`)

        const isValid = await verifyPassword(password, user.password)
        console.log(`[Login] Password valid? ${isValid}`)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Sign JWT
        const token = await signToken({
            id: user.id,
            storeId: user.storeId, // Add storeId to token
            username: user.username,
            role: user.role,
        })

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                storeId: user.storeId,
                username: user.username,
                role: user.role,
            },
            redirectTo: user.role === 'ADMIN' ? '/admin' : user.role === 'KITCHEN' ? '/kitchen' : '/'
        })

        // Set Cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 })
    }
}
