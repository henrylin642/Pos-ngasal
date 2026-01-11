import { NotesClient } from './client'
import { getNoteOptions } from '@/app/actions/note'
import { getCategories } from '@/app/actions/menu'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
    const [notes, categories] = await Promise.all([
        getNoteOptions(),
        getCategories()
    ])

    return <NotesClient initialNotes={notes} categories={categories} />
}
