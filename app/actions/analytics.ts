'use server'

import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export async function recordVisit(path: string) {
    try {
        const headersList = await headers()
        // Get IP from x-forwarded-for (Vercel/Proxies) or fallback
        const forwardedFor = headersList.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
        const userAgent = headersList.get('user-agent') || null

        // Simple de-duplication: check if this IP visited in the last 15 minutes
        const recentVisit = await prisma.visitor.findFirst({
            where: {
                ip,
                createdAt: {
                    gt: new Date(Date.now() - 15 * 60 * 1000) // 15 mins ago
                }
            }
        })

        if (!recentVisit) {
            await prisma.visitor.create({
                data: {
                    ip,
                    userAgent,
                    path
                }
            })
        }
    } catch (error) {
        console.error('Failed to record visit:', error)
        // Swallow error to not break the app
    }
}

export async function getVisitorStats() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Adjust for Taipei Time if needed, but for simple count, server time is okay base.
        // Actually, let's stick to simple "Since midnight server time" or just "Total Unique Today"

        // Count distinct IPs today
        const uniqueVisitors = await prisma.visitor.groupBy({
            by: ['ip'],
            where: {
                createdAt: { gte: today }
            }
        })

        const totalVisits = await prisma.visitor.count({
            where: {
                createdAt: { gte: today }
            }
        })

        return {
            uniqueIPs: uniqueVisitors.length,
            totalVisits
        }
    } catch (error) {
        console.error('Failed to get visitor stats:', error)
        return { uniqueIPs: 0, totalVisits: 0 }
    }
}
