'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { MenuForm } from '@/components/admin/menu-form'
import { deleteMenuItem } from '@/app/actions/menu'
import { useRouter } from 'next/navigation'

export function MenuClient({ items, categories }: { items: any[], categories: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const router = useRouter()

    const handleAdd = () => {
        setEditingItem(null)
        setIsOpen(true)
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setIsOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('確定要刪除此品項嗎？')) {
            await deleteMenuItem(id)
            router.refresh()
        }
    }

    const handleSuccess = () => {
        router.refresh()
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> 新增品項
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>現有菜單品項</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名稱</TableHead>
                                <TableHead>分類</TableHead>
                                <TableHead>價格</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.category?.name}</TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                                            {item.isAvailable ? '販售中' : '已售完'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        尚無品項，請建立一個。
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Force re-render of form when editingItem changes key to reset state */}
            {isOpen && (
                <MenuForm
                    key={editingItem ? editingItem.id : 'new'}
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    categories={categories}
                    initialData={editingItem}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    )
}
