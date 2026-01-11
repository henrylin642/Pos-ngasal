import { hash, compare } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me')

export async function hashPassword(password: string) {
    return await hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
    return await compare(password, hashedPassword)
}

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as any // Cast to any or define interface
    } catch (err) {
        return null
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null

    return await verifyToken(token)
}
