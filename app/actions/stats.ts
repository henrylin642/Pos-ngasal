'use server'

import prisma from '@/lib/prisma'

export async function getDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch orders for today
    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: today,
                lt: tomorrow
            },
            status: { not: 'PENDING' } // Count only processed orders? Or all? Let's count all.
        },
        include: { items: true }
    })

    const totalOrders = orders.length

    // Calculate Revenue
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Top Items
    const itemCounts: Record<number, number> = {}
    for (const order of orders) {
        for (const item of order.items) {
            itemCounts[item.menuItemId] = (itemCounts[item.menuItemId] || 0) + item.quantity
        }
    }

    // Get Top 5 IDs
    const topIds = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => parseInt(id))

    const topItems = await prisma.menuItem.findMany({
        where: { id: { in: topIds } },
        include: { category: true }
    })

    // Format Top Items with Count
    const topItemsWithCount = topItems.map(item => ({
        ...item,
        count: itemCounts[item.id]
    })).sort((a, b) => b.count - a.count)

    return {
        totalOrders,
        totalRevenue,
        topItems: topItemsWithCount
    }
}

export async function getMonthlyStats(year: number, month: number) {
    // Determine start and end of month
    // month is 1-indexed
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            // status: { not: 'PENDING' } // Usually we only count paid/completed
        },
        select: {
            createdAt: true,
            totalAmount: true
        }
    })

    // Aggregate by date (YYYY-MM-DD)
    const dailyRevenue: Record<string, number> = {}

    orders.forEach(order => {
        // Use local date string
        const date = new Date(order.createdAt)
        const yearStr = date.getFullYear()
        const monthStr = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(date.getDate()).padStart(2, '0')
        const dateKey = `${yearStr}-${monthStr}-${dayStr}`

        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.totalAmount
    })

    return dailyRevenue
}
