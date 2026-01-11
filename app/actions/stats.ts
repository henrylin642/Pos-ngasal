'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function getDashboardStats() {
    const user = await getCurrentUser()
    if (!user?.storeId) return { totalOrders: 0, totalRevenue: 0, lastMonthRevenue: 0, topItems: [] }
    const storeId = user.storeId as number

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Last Month Date Range
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)

    // Fetch orders for today
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: today, lt: tomorrow },
            status: { not: 'PENDING' },
            storeId
        },
        include: { items: true }
    })

    // Fetch orders for last month
    const lastMonthOrders = await prisma.order.findMany({
        where: {
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
            status: { not: 'PENDING' },
            storeId
        },
        select: { totalAmount: true }
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Top Items logic (unchanged)
    const itemCounts: Record<number, number> = {}
    for (const order of orders) {
        for (const item of order.items) {
            itemCounts[item.menuItemId] = (itemCounts[item.menuItemId] || 0) + item.quantity
        }
    }

    const topIds = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => parseInt(id))

    // Handle empty topIds to avoid Prisma error
    let topItemsWithCount: any[] = []
    if (topIds.length > 0) {
        const topItems = await prisma.menuItem.findMany({
            where: { id: { in: topIds }, storeId },
            include: { category: true }
        })
        topItemsWithCount = topItems.map(item => ({
            ...item,
            count: itemCounts[item.id]
        })).sort((a, b) => b.count - a.count)
    }

    return {
        totalOrders,
        totalRevenue,
        lastMonthRevenue,
        topItems: topItemsWithCount
    }
}

export async function getMonthlyStats(year: number, month: number) {
    const user = await getCurrentUser()
    if (!user?.storeId) return {}
    const storeId = user.storeId as number

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'PENDING' },
            storeId
        },
        select: { createdAt: true, totalAmount: true }
    })

    const dailyRevenue: Record<string, number> = {}
    orders.forEach(order => {
        // Shift to Taipei Time (UTC+8) manually to ensure server consistency
        // getDailyOrders uses +8 offset, so valid data range for "12th" is 11th 16:00 UTC to 12th 16:00 UTC.
        // We must map these UTC timestamps back to "2026-01-12".
        const utcTime = order.createdAt.getTime()
        const taipeiTime = new Date(utcTime + 8 * 60 * 60 * 1000)

        const dateKey = `${taipeiTime.getUTCFullYear()}-${String(taipeiTime.getUTCMonth() + 1).padStart(2, '0')}-${String(taipeiTime.getUTCDate()).padStart(2, '0')}`
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.totalAmount
    })

    return dailyRevenue
}

export async function getDailyOrders(dateStr: string) {
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    // dateStr is 'YYYY-MM-DD' representing Taipei Date.
    // We want 00:00:00 Taipei to 23:59:59 Taipei.
    // 00:00 Taipei = Previous Day 16:00 UTC.
    // Easy way: Construct explicit ISO string with offset.

    const start = new Date(`${dateStr}T00:00:00+08:00`)
    const end = new Date(`${dateStr}T23:59:59.999+08:00`)

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: start, lte: end },
            status: { not: 'PENDING' },
            storeId
        },
        include: {
            items: {
                include: { menuItem: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return orders
}
