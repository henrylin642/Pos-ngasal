'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getNoteOptions() {
    return await prisma.noteOption.findMany({
        orderBy: { label: 'asc' }
    })
}

export async function createNoteOption(data: { label: string, category?: string }) {
    await prisma.noteOption.create({
        data
    })
    revalidatePath('/admin/notes')
}

export async function deleteNoteOption(id: number) {
    await prisma.noteOption.delete({
        where: { id }
    })
    revalidatePath('/admin/notes')
}
