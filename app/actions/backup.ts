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
