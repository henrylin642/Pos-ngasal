'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'

export async function getNoteOptions() {
    const user = await getCurrentUser()
    if (!user?.storeId) return []
    const storeId = user.storeId as number

    return await prisma.noteOption.findMany({
        where: { storeId },
        orderBy: { label: 'asc' }
    })
}

export async function createNoteOption(data: { label: string, category?: string }) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    await prisma.noteOption.create({
        data: {
            ...data,
            storeId
        }
    })
    revalidatePath('/admin/notes')
}

export async function deleteNoteOption(id: number) {
    const user = await getCurrentUser()
    if (!user?.storeId) throw new Error('Unauthorized')
    const storeId = user.storeId as number

    // Verify ownership
    const count = await prisma.noteOption.count({ where: { id, storeId } })
    if (count === 0) throw new Error('Note option not found or access denied')

    await prisma.noteOption.delete({
        where: { id }
    })
    revalidatePath('/admin/notes')
}
