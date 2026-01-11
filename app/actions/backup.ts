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

            // 2. Restore Categories (Parallel)
            // Map old ID -> new ID
            const newCategories = await Promise.all(categories.map(async (cat: any) => {
                const newCat = await tx.category.create({
                    data: {
                        storeId,
                        name: cat.name,
                        sortOrder: cat.sortOrder || 0
                    }
                })
                return { oldId: cat.id, newId: newCat.id }
            }))

            const categoryMap = new Map(newCategories.map(c => [c.oldId, c.newId]))

            // 3. Restore Menu Items (Parallel)
            // Check if we need a fallback category
            let fallbackCategoryId: number | null = null
            const hasOrphans = menuItems.some((item: any) => !categoryMap.has(item.categoryId))

            if (hasOrphans) {
                const fallbackCat = await tx.category.create({
                    data: {
                        storeId,
                        name: '未分類項目',
                        sortOrder: 999
                    }
                })
                fallbackCategoryId = fallbackCat.id
            }

            const newMenuItems = await Promise.all(menuItems.map(async (item: any) => {
                let newCategoryId = categoryMap.get(item.categoryId)
                if (!newCategoryId) {
                    newCategoryId = fallbackCategoryId!
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
                return { oldId: item.id, newId: newItem.id }
            }))

            const menuItemMap = new Map(newMenuItems.map(i => [i.oldId, i.newId]))

            // 4. Restore Orders (Parallel)
            if (Array.isArray(orders)) {
                await Promise.all(orders.map(async (order: any) => {
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

                    // Restore Order Items (Use createMany for better performance)
                    if (Array.isArray(order.items) && order.items.length > 0) {
                        const orderItemsData = order.items
                            .map((item: any) => {
                                const newItemId = menuItemMap.get(item.menuItemId)
                                if (!newItemId) return null
                                return {
                                    orderId: newOrder.id,
                                    menuItemId: newItemId,
                                    quantity: item.quantity,
                                    price: item.price,
                                    notes: item.notes,
                                    status: item.status
                                }
                            })
                            .filter((item: any) => item !== null)

                        if (orderItemsData.length > 0) {
                            await tx.orderItem.createMany({
                                data: orderItemsData
                            })
                        }
                    }
                }))
            }
        }, {
            maxWait: 5000, // Max wait time to get a connection
            timeout: 60000 // Increase timeout to 60s for the transaction itself
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
