'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

interface CreateOrderData {
    items: { menuItemId: number; quantity: number; notes?: string }[]
    type: 'DINE_IN' | 'TAKE_OUT'
    tableNumber?: string
}

export async function createOrder(data: CreateOrderData) {
    const user = await getCurrentUser()

    // For now, assume only authenticated users (staff) create orders via this action.
    // If we support public self-checkout later, we'll need a different mechanism (e.g. Kiosk mode token).
    // But currently, the app is a POS for staff.
    if (!user || !user.storeId) {
        throw new Error('Unauthorized or Invalid Store')
    }

    const storeId = user.storeId as number

    // 1. Fetch current prices scoped by store
    const menuItems = await prisma.menuItem.findMany({
        where: {
            id: { in: data.items.map(i => i.menuItemId) },
            storeId: storeId // Ensure items belong to this store
        }
    })

    // 2. Calculate Total
    let totalAmount = 0
    const orderItemsData = []

    for (const item of data.items) {
        const menuItem = menuItems.find(m => m.id === item.menuItemId)
        if (!menuItem) continue

        // Check availability? Assuming frontend handled it, but good to check.
        if (!menuItem.isAvailable) throw new Error(`Item ${menuItem.name} is not available`)

        const price = menuItem.price
        totalAmount += price * item.quantity

        orderItemsData.push({
            menuItemId: menuItem.id,
            quantity: item.quantity,
            price: price,
            notes: item.notes
        })
    }

    // 3. Create Order linked to store
    const order = await prisma.order.create({
        data: {
            storeId: storeId,
            type: data.type,
            tableNumber: data.type === 'DINE_IN' ? data.tableNumber : null,
            status: 'PENDING',
            totalAmount,
            items: {
                create: orderItemsData
            }
        }
    })

    // 4. Revalidate Kitchen
    revalidatePath('/kitchen')
    return order
}
