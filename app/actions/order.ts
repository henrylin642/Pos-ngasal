'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CreateOrderData {
    items: { menuItemId: number; quantity: number; notes?: string }[]
    type: 'DINE_IN' | 'TAKE_OUT'
    tableNumber?: string
}

export async function createOrder(data: CreateOrderData) {
    // 1. Fetch current prices
    const menuItems = await prisma.menuItem.findMany({
        where: {
            id: { in: data.items.map(i => i.menuItemId) }
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

    // 3. Create Order
    const order = await prisma.order.create({
        data: {
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
