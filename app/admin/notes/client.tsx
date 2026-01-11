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
    categories: any[]
}

export function NotesClient({ initialNotes, categories }: NotesClientProps) {
    const router = useRouter()
    const [notes, setNotes] = useState(initialNotes)
    const [newLabel, setNewLabel] = useState('')
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
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
            await createNoteOption({
                label: newLabel,
                categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
            })
            setNewLabel('')
            setSelectedCategoryIds([])
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

    const toggleCategory = (id: number) => {
        setSelectedCategoryIds(prev =>
            prev.includes(id)
                ? prev.filter(cId => cId !== id)
                : [...prev, id]
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">備註管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle>新增備註選項</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-4">
                            <div>
                                <Label htmlFor="note">備註內容</Label>
                                <Input
                                    id="note"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="例如：加辣、少冰、微糖..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block">適用分類 (未選取則適用於全部)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <div
                                            key={cat.id}
                                            className={`
                                                cursor-pointer px-3 py-1 rounded-full border text-sm transition-colors
                                                ${selectedCategoryIds.includes(cat.id)
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background hover:bg-muted'}
                                            `}
                                            onClick={() => toggleCategory(cat.id)}
                                        >
                                            {cat.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-end self-end">
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
                        <CardContent className="flex flex-col p-4 gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-lg">{note.label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    onClick={() => handleDelete(note.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {note.categories && note.categories.length > 0 ? (
                                    note.categories.map((c: any) => (
                                        <span key={c.id} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                            {c.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">通用</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
