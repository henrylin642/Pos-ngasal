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
        const d = new Date(order.createdAt)
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.totalAmount
    })

    return dailyRevenue
}

export async function getDailyOrders(dateStr: string) {
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    const start = new Date(dateStr)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

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
