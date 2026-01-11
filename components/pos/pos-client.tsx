'use client'

import { useState } from 'react'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import { createOrder } from '@/app/actions/order'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, ShoppingBag, Utensils, Coffee, Plus, LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { TableStatusGrid } from './table-status'
import { logout } from '@/app/actions/auth'

interface MenuItem {
    id: number
    name: string
    price: number
    categoryId: number
    isAvailable: boolean
    description?: string | null
}

interface Category {
    id: number
    name: string
}

interface CartItem {
    menuItemId: number
    name: string
    price: number
    quantity: number
    notes: string[]
}

export default function PosClient({ initialItems, categories, initialNotes }: { initialItems: MenuItem[], categories: Category[], initialNotes: any[] }) {
    const [items] = useState(initialItems)
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_OUT'>('DINE_IN')
    const [tableNumber, setTableNumber] = useState('')
    const [loading, setLoading] = useState(false)

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
    const [currentNotes, setCurrentNotes] = useState<string[]>([])
    const [customNote, setCustomNote] = useState('')
    const [dialogQty, setDialogQty] = useState(1)

    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(i => i.categoryId.toString() === selectedCategory)

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item)
        setCurrentNotes([])
        setCustomNote('')
        setDialogQty(1)
        setIsDialogOpen(true)
    }

    const toggleNote = (note: string) => {
        setCurrentNotes(prev =>
            prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
        )
    }

    const confirmAddToCart = () => {
        if (!selectedItem) return

        const finalNotes = [...currentNotes]
        if (customNote.trim()) {
            finalNotes.push(customNote.trim())
        }

        setCart(prev => {
            // Check for identical item (same ID AND same notes)
            const notesStr = finalNotes.sort().join(',')
            const existingIndex = prev.findIndex(i =>
                i.menuItemId === selectedItem.id &&
                i.notes.sort().join(',') === notesStr
            )

            if (existingIndex >= 0) {
                // Correctly update by creating a new array AND a new object for the changed item
                return prev.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + dialogQty }
                        : item
                )
            }

            return [...prev, {
                menuItemId: selectedItem.id,
                name: selectedItem.name,
                price: selectedItem.price,
                quantity: dialogQty,
                notes: finalNotes
            }]
        })

        setIsDialogOpen(false)
    }

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index))
    }

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            return prev.map((item, i) => {
                if (i === index) {
                    const newQty = item.quantity + delta
                    return newQty > 0 ? { ...item, quantity: newQty } : item
                }
                return item
            })
        })
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCheckout = async () => {
        if (cart.length === 0) return
        if (orderType === 'DINE_IN' && !tableNumber) {
            alert('請輸入桌號')
            return
        }

        setLoading(true)
        try {
            await createOrder({
                items: cart.map(i => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                    notes: i.notes.join(',')
                })),
                type: orderType,
                tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined
            })
            alert('訂單已送出！')
            setCart([])
            setTableNumber('')
        } catch (e) {
            alert('訂單建立失敗')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Main Product Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Utensils className="h-6 w-6" /> POS 系統
                        </h1>
                        <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground">
                            <LogOut className="w-4 h-4 mr-1" /> 登出
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {/* Category Filter Tabs */}
                        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                            <TabsList>
                                <TabsTrigger value="all">全部</TabsTrigger>
                                {categories.map(c => (
                                    <TabsTrigger key={c.id} value={c.id.toString()}>{c.name}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                        {filteredItems.map(item => (
                            <ProductCard key={item.id} item={item} onAdd={() => handleItemClick(item)} />
                        ))}
                    </div>
                </ScrollArea>

                <TableStatusGrid />
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 bg-white dark:bg-gray-800 border-l flex flex-col shadow-xl z-20">
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <ShoppingBag className="h-5 w-5" />
                        目前訂單
                    </div>

                    {/* Order Settings */}
                    <div className="space-y-3">
                        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'DINE_IN' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setOrderType('DINE_IN')}
                            >
                                內用
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${orderType === 'TAKE_OUT' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setOrderType('TAKE_OUT')}
                            >
                                外帶
                            </button>
                        </div>

                        {orderType === 'DINE_IN' && (
                            <div className="flex items-center gap-2">
                                <Label htmlFor="table" className="whitespace-nowrap">桌號</Label>
                                <Input
                                    id="table"
                                    placeholder="例如 5"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    type="number"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                            <Coffee className="w-10 h-10 opacity-20" />
                            <p>購物車是空的</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div key={`${item.menuItemId}-${index}`} className="flex items-center justify-between group bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="font-medium truncate">{item.name}</div>
                                        {item.notes.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.notes.map((note, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-600 dark:text-slate-300">
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground mt-1">${item.price} each</div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-md border shadow-sm">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-r-none"
                                                onClick={() => updateQuantity(index, -1)}
                                            >
                                                <span className="text-lg font-bold leading-none mb-0.5">-</span>
                                            </Button>
                                            <div className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-l-none"
                                                onClick={() => updateQuantity(index, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="font-semibold w-12 text-right">
                                            ${(item.price * item.quantity).toFixed(0)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            onClick={() => removeFromCart(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50 space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">小計</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl pt-2 border-t">
                            <span>總計</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold"
                        size="lg"
                        disabled={cart.length === 0 || loading}
                        onClick={handleCheckout}
                    >
                        {loading ? '處理中...' : '送出訂單'}
                    </Button>
                </div>
            </div>

            {/* Add to Cart Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedItem?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Notes Selection */}
                        <div className="space-y-2">
                            <Label>備註選項</Label>
                            <div className="flex flex-wrap gap-2">
                                {initialNotes.map((note: any) => (
                                    <Badge
                                        key={note.id}
                                        variant={currentNotes.includes(note.label) ? "default" : "outline"}
                                        className="cursor-pointer text-sm py-1"
                                        onClick={() => toggleNote(note.label)}
                                    >
                                        {note.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Custom Note */}
                        <div className="space-y-2">
                            <Label htmlFor="custom-note">自訂備註</Label>
                            <Input
                                id="custom-note"
                                value={customNote}
                                onChange={(e) => setCustomNote(e.target.value)}
                                placeholder="例如：飯少..."
                            />
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label>數量</Label>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => setDialogQty(Math.max(1, dialogQty - 1))}>
                                    -
                                </Button>
                                <span className="text-xl font-bold w-8 text-center">{dialogQty}</span>
                                <Button variant="outline" size="icon" onClick={() => setDialogQty(dialogQty + 1)}>
                                    +
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={confirmAddToCart} className="w-full">加入購物車</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
