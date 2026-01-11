'use client'

import { useState } from 'react'
import { createNoteOption, deleteNoteOption, getNoteOptions } from '@/app/actions/note'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotesClientProps {
    initialNotes: any[]
}

export function NotesClient({ initialNotes }: NotesClientProps) {
    const router = useRouter()
    const [notes, setNotes] = useState(initialNotes)
    const [newLabel, setNewLabel] = useState('')
    const [loading, setLoading] = useState(false)

    const refreshNotes = async () => {
        const updatedNotes = await getNoteOptions()
        setNotes(updatedNotes)
        router.refresh() // Keep server sync
    }

    const handleCreate = async () => {
        if (!newLabel.trim()) return
        setLoading(true)
        try {
            await createNoteOption({ label: newLabel })
            setNewLabel('')
            await refreshNotes()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除?')) return
        try {
            await deleteNoteOption(id)
            await refreshNotes()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">備註管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle>新增備註選項</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="note">備註內容</Label>
                            <Input
                                id="note"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="例如：加辣、少冰、微糖..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleCreate} disabled={loading || !newLabel.trim()}>
                                <Plus className="w-4 h-4 mr-2" />
                                新增
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                    <Card key={note.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <span className="font-medium">{note.label}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleDelete(note.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
