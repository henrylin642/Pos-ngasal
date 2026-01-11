'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Categories
export async function getCategories() {
    try {
        return await prisma.category.findMany({
            orderBy: { sortOrder: 'asc' },
        })
    } catch (error) {
        return []
    }
}

export async function createCategory(name: string) {
    await prisma.category.create({ data: { name } })
    revalidatePath('/admin/menu')
    revalidatePath('/admin/categories')
}

export async function updateCategory(id: number, name: string) {
    await prisma.category.update({
        where: { id },
        data: { name },
    })
    revalidatePath('/admin/categories')
}

export async function deleteCategory(id: number) {
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
    try {
        return await prisma.menuItem.findMany({
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
    await prisma.menuItem.create({
        data: {
            name: data.name,
            price: data.price,
            categoryId: data.categoryId,
            description: data.description,
            isAvailable: data.isAvailable ?? true,
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
    await prisma.menuItem.update({
        where: { id },
        data,
    })
    revalidatePath('/admin/menu')
}

export async function deleteMenuItem(id: number) {
    await prisma.menuItem.delete({
        where: { id },
    })
    revalidatePath('/admin/menu')
}
