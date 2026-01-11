'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function exportData() {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    try {
        const [users, categories, menuItems, orders] = await Promise.all([
            prisma.user.findMany({ where: { storeId } }),
            prisma.category.findMany({ where: { storeId } }),
            prisma.menuItem.findMany({ where: { storeId } }),
            prisma.order.findMany({
                where: { storeId },
                include: {
                    items: true
                }
            })
        ])

        const backupData = {
            timestamp: new Date().toISOString(),
            storeId,
            data: {
                users,
                categories,
                menuItems,
                orders
            }
        }

        return JSON.stringify(backupData, null, 2)
    } catch (error) {
        console.error('Backup failed:', error)
        throw new Error('Failed to generate backup')
    }
}

export async function restoreData(jsonString: string) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    try {
        const backup = JSON.parse(jsonString)
        const { categories, menuItems, orders } = backup.data

        // Validate basic structure
        if (!Array.isArray(categories) || !Array.isArray(menuItems)) {
            throw new Error('Invalid backup format')
        }

        await prisma.$transaction(async (tx) => {
            // 1. Clean existing data for this store
            // Order is important due to foreign key constraints
            await tx.orderItem.deleteMany({
                where: { order: { storeId } }
            })
            await tx.order.deleteMany({ where: { storeId } })
            await tx.menuItem.deleteMany({ where: { storeId } })
            await tx.category.deleteMany({ where: { storeId } })

            // 2. Restore Categories
            // Map old ID -> new ID
            const categoryMap = new Map<number, number>()

            for (const cat of categories) {
                const newCat = await tx.category.create({
                    data: {
                        storeId,
                        name: cat.name,
                        sortOrder: cat.sortOrder || 0
                    }
                })
                categoryMap.set(cat.id, newCat.id)
            }

            // 3. Restore Menu Items
            const menuItemMap = new Map<number, number>()
            let fallbackCategoryId: number | null = null

            for (const item of menuItems) {
                // Try to find mapped category
                let newCategoryId = categoryMap.get(item.categoryId)

                // If not found (orphaned item), use or create fallback category
                if (!newCategoryId) {
                    if (!fallbackCategoryId) {
                        const fallbackCat = await tx.category.create({
                            data: {
                                storeId,
                                name: '未分類項目',
                                sortOrder: 999
                            }
                        })
                        fallbackCategoryId = fallbackCat.id
                    }
                    newCategoryId = fallbackCategoryId
                }

                const newItem = await tx.menuItem.create({
                    data: {
                        storeId,
                        name: item.name,
                        price: item.price,
                        categoryId: newCategoryId,
                        description: item.description,
                        imageUrl: item.imageUrl,
                        isAvailable: item.isAvailable,
                        createdAt: new Date(item.createdAt),
                        updatedAt: new Date(item.updatedAt)
                    }
                })
                menuItemMap.set(item.id, newItem.id)
            }

            // 4. Restore Orders
            if (Array.isArray(orders)) {
                for (const order of orders) {
                    const newOrder = await tx.order.create({
                        data: {
                            storeId,
                            tableNumber: order.tableNumber,
                            type: order.type,
                            status: order.status,
                            totalAmount: order.totalAmount,
                            isPaid: order.isPaid,
                            createdAt: new Date(order.createdAt),
                            updatedAt: new Date(order.updatedAt)
                        }
                    })

                    // Restore Order Items
                    if (Array.isArray(order.items)) {
                        for (const item of order.items) {
                            const newItemId = menuItemMap.get(item.menuItemId)
                            // If menu item doesn't exist anymore (e.g. partial backup), skip? 
                            // Or keep it if we can? Here we skip to be safe.
                            if (!newItemId) continue

                            await tx.orderItem.create({
                                data: {
                                    orderId: newOrder.id,
                                    menuItemId: newItemId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    notes: item.notes,
                                    status: item.status
                                }
                            })
                        }
                    }
                }
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Restore failed:', error)
        // Return error message to client
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Unknown error occurred' }
    }
}
