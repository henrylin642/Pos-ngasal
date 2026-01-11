'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Fetch orders where at least one item matches the status filter
// OR for simplicity, fetch orders that are active, and frontend filters items?
// Better: Fetch orders that are NOT fully completed, or are completed if requested.
export async function getKitchenOrders(statuses: ('PENDING' | 'COOKING' | 'COMPLETED')[] = ['PENDING', 'COOKING']) {
    return await prisma.order.findMany({
        where: {
            // IF we want history, we look for order.status == COMPLETED
            // IF we want active, we look for order.status != COMPLETED (or PENDING/COOKING)
            status: { in: statuses }
        },
        include: {
            items: {
                include: {
                    menuItem: {
                        include: { category: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: statuses.includes('COMPLETED') ? 50 : undefined
    })
}

export async function updateOrderItemStatus(orderId: number, itemIds: number[], status: 'COOKING' | 'COMPLETED') {
    console.log(`[updateOrderItemStatus] Order ${orderId}, Items: ${itemIds}, Status: ${status}`)

    // 1. Update the specific items
    const updateResult = await prisma.orderItem.updateMany({
        where: {
            id: { in: itemIds },
            orderId: orderId // Safety check
        },
        data: { status }
    })
    console.log(`[updateOrderItemStatus] Updated items count: ${updateResult.count}`)

    // 2. Check all items for this order to determine derived Order Status
    const orderItems = await prisma.orderItem.findMany({
        where: { orderId }
    })
    console.log(`[updateOrderItemStatus] All Items check:`, orderItems.map(i => `${i.id}:${i.status}`))

    const allCompleted = orderItems.every(i => i.status === 'COMPLETED')
    const anyCooking = orderItems.some(i => i.status === 'COOKING' || i.status === 'COMPLETED')

    let newOrderStatus = 'PENDING'
    if (allCompleted) {
        newOrderStatus = 'COMPLETED'
    } else if (anyCooking) {
        newOrderStatus = 'COOKING'
    }
    console.log(`[updateOrderItemStatus] Calculated new Order Status: ${newOrderStatus}`)

    // 3. Update Order Status
    await prisma.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus }
    })

    revalidatePath('/kitchen')
    revalidatePath('/admin')
}
