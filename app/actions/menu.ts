'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

// Categories
export async function getCategories() {
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    try {
        return await prisma.category.findMany({
            where: { storeId },
            orderBy: { sortOrder: 'asc' },
        })
    } catch (error) {
        return []
    }
}

export async function createCategory(name: string) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    await prisma.category.create({ data: { name, storeId } })
    revalidatePath('/admin/menu')
    revalidatePath('/admin/categories')
}

export async function updateCategory(id: number, name: string) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify ownership
    const count = await prisma.category.count({ where: { id, storeId } })
    if (count === 0) throw new Error('Category not found or access denied')

    await prisma.category.update({
        where: { id },
        data: { name },
    })
    revalidatePath('/admin/categories')
}

export async function deleteCategory(id: number) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify ownership
    const count = await prisma.category.count({ where: { id, storeId } })
    if (count === 0) throw new Error('Category not found or access denied')

    try {
        await prisma.category.delete({
            where: { id },
        })
        revalidatePath('/admin/categories')
    } catch (error) {
        throw new Error('Cannot delete category with items')
    }
}

// Menu Items
export async function getMenuItems() {
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    try {
        return await prisma.menuItem.findMany({
            where: { storeId },
            include: { category: true },
            orderBy: { name: 'asc' },
        })
    } catch (error) {
        return []
    }
}

export async function createMenuItem(data: {
    name: string
    price: number
    categoryId: number
    description?: string
    isAvailable?: boolean
}) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    await prisma.menuItem.create({
        data: {
            name: data.name,
            price: data.price,
            categoryId: data.categoryId,
            description: data.description,
            isAvailable: data.isAvailable ?? true,
            storeId
        },
    })
    revalidatePath('/admin/menu')
}

export async function updateMenuItem(
    id: number,
    data: {
        name?: string
        price?: number
        categoryId?: number
        description?: string
        isAvailable?: boolean
    }
) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify ownership
    const count = await prisma.menuItem.count({ where: { id, storeId } })
    if (count === 0) throw new Error('Item not found or access denied')

    await prisma.menuItem.update({
        where: { id },
        data,
    })
    revalidatePath('/admin/menu')
}

export async function deleteMenuItem(id: number) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify ownership
    const count = await prisma.menuItem.count({ where: { id, storeId } })
    if (count === 0) throw new Error('Item not found or access denied')

    await prisma.menuItem.delete({
        where: { id },
    })
    revalidatePath('/admin/menu')
}
