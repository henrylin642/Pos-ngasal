'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Save } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory } from '@/app/actions/menu'
import { useRouter } from 'next/navigation'

export function CategoryList({ initialCategories }: { initialCategories: any[] }) {
    const [newCategoryName, setNewCategoryName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return
        setLoading(true)
        await createCategory(newCategoryName)
        setNewCategoryName('')
        setLoading(false)
        router.refresh()
    }

    const handleDelete = async (id: number) => {
        if (confirm('確定要刪除此分類嗎？')) {
            try {
                await deleteCategory(id)
                router.refresh()
            } catch (e: any) {
                alert(e.message)
            }
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>現有分類</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="新分類名稱"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button onClick={handleAdd} disabled={loading}>
                        <Plus className="mr-2 h-4 w-4" /> 新增
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名稱</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialCategories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(category.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialCategories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    尚無分類。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
