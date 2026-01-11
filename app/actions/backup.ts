'use server'

import prisma from '@/lib/prisma'

export async function exportData() {
    try {
        const [users, categories, menuItems, orders] = await Promise.all([
            prisma.user.findMany(),
            prisma.category.findMany(),
            prisma.menuItem.findMany(),
            prisma.order.findMany({
                include: {
                    items: true
                }
            })
        ])

        const backupData = {
            timestamp: new Date().toISOString(),
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
