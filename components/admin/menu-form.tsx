'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createMenuItem, updateMenuItem } from '@/app/actions/menu'

interface Category {
    id: number
    name: string
}

interface MenuItem {
    id: number
    name: string
    price: number
    categoryId: number
    description?: string | null
    isAvailable: boolean
}

interface MenuFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: MenuItem | null
    categories: Category[]
    onSuccess: () => void
}

export function MenuForm({ open, onOpenChange, initialData, categories, onSuccess }: MenuFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const price = parseFloat(formData.get('price') as string)
        const categoryId = parseInt(formData.get('categoryId') as string)
        const description = formData.get('description') as string
        // Switch usually handled by state or hidden input, but Shadcn Switch is controlled.
        // We will handle isAvailable via specific input or state if needed.
        // For simplicity, let's assume valid form data.
    }

    // Simplified Controlled Form for shadcn Select and Switch interaction
    const [name, setName] = useState(initialData?.name || '')
    const [price, setPrice] = useState(initialData?.price?.toString() || '')
    const [categoryId, setCategoryId] = useState(initialData?.categoryId?.toString() || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true)

    const onSave = async () => {
        if (!name || !price || !categoryId) {
            setError('請填寫必填欄位 (名稱, 價格, 分類)')
            return
        }

        setLoading(true)
        try {
            if (initialData) {
                await updateMenuItem(initialData.id, {
                    name,
                    price: parseFloat(price),
                    categoryId: parseInt(categoryId),
                    description,
                    isAvailable,
                })
            } else {
                await createMenuItem({
                    name,
                    price: parseFloat(price),
                    categoryId: parseInt(categoryId),
                    description,
                    isAvailable,
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (e) {
            setError('儲存失敗')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? '編輯品項' : '新增品項'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? '更新此菜單品項的詳細資訊。' : '建立一個新的菜單品項。'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">名稱</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">價格</Label>
                        <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">分類</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="選擇分類" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right">描述</Label>
                        <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="avail" className="text-right">是否販售</Label>
                        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={onSave} disabled={loading}>
                        {loading ? '儲存中...' : '儲存變更'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
