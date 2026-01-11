import { NotesClient } from './client'
import { getNoteOptions } from '@/app/actions/note'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
    const notes = await getNoteOptions()

    return <NotesClient initialNotes={notes} />
}
