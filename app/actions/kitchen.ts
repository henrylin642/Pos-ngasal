'use server'

import prisma from '@/lib/prisma'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

// Fetch orders where at least one item matches the status filter
export async function getKitchenOrders(statuses: ('PENDING' | 'COOKING' | 'COMPLETED')[] = ['PENDING', 'COOKING']) {
    noStore() // Fix cache: ensure we always hit DB
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    return await prisma.order.findMany({
        where: {
            status: { in: statuses },
            storeId
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
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify Order Ownership
    const orderCount = await prisma.order.count({ where: { id: orderId, storeId } })
    if (orderCount === 0) throw new Error('Order not found or access denied')

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
