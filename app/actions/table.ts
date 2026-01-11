'use server'

import prisma from '@/lib/prisma'

export interface TableStatus {
    tableNumber: number
    status: 'FREE' | 'PENDING' | 'COOKING' | 'COMPLETED'
    totalAmount?: number
    updatedAt?: Date
}

export async function getTableStatuses(): Promise<TableStatus[]> {
    const totalTables = 8
    const tableStatuses: TableStatus[] = []

    // Fetch all UNPAID orders for today (or just unpaid in general)
    // To be safe against zombies, we can say unpaid from last 24h? 
    // For now, let's trust "isPaid" is the source of truth for the session.
    const unpaidOrders = await prisma.order.findMany({
        where: {
            type: 'DINE_IN',
            tableNumber: { not: null },
            isPaid: false
        }
    })

    // Map to tables
    for (let i = 1; i <= totalTables; i++) {
        const tableOrders = unpaidOrders.filter(o => o.tableNumber === i.toString())

        if (tableOrders.length > 0) {
            // Aggregate Status
            let status: 'PENDING' | 'COOKING' | 'COMPLETED' = 'COMPLETED' // Default if all matched are completed

            // Priority: PENDING > COOKING > COMPLETED
            const hasPending = tableOrders.some(o => o.status === 'PENDING')
            const hasCooking = tableOrders.some(o => o.status === 'COOKING')

            if (hasPending) {
                status = 'PENDING'
            } else if (hasCooking) {
                status = 'COOKING'
            }

            // Aggregate Total
            const totalAmount = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0)

            tableStatuses.push({
                tableNumber: i,
                status: status,
                totalAmount: totalAmount,
                updatedAt: new Date() // Just use now
            })
        } else {
            tableStatuses.push({
                tableNumber: i,
                status: 'FREE'
            })
        }
    }

    return tableStatuses
}

export async function clearTable(tableNumber: number) {
    await prisma.order.updateMany({
        where: {
            tableNumber: tableNumber.toString(),
            isPaid: false
        },
        data: {
            isPaid: true
        }
    })
    // Revalidate relevant paths if needed
}
