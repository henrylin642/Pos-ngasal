'use client'

import { useEffect, useState, useRef } from 'react'
import { getKitchenOrders, updateOrderItemStatus } from '@/app/actions/kitchen'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Check, ChefHat, Clock, Utensils, Coffee, Square, CheckSquare } from 'lucide-react'

// Simple polling hook
function usePolling(callback: () => void, interval: number) {
    useEffect(() => {
        const timer = setInterval(callback, interval)
        return () => clearInterval(timer)
    }, [callback, interval])
}

export function KitchenView() {
    // Use tabs to switch views
    const [activeTab, setActiveTab] = useState('active')
    const [kitchenFilter, setKitchenFilter] = useState<'ALL' | 'DRINK' | 'FOOD'>('ALL')
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const previousOrderCount = useRef(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const isUpdating = useRef(false)

    const fetchOrders = async () => {
        if (isUpdating.current) return // Skip polling if user is updating

        try {
            // We fetch filter: ['PENDING', 'COOKING'] for active, ['COMPLETED'] for history.
            // Note: If an order has Mixed items (some Pending, some Completed), it is still "Active" (Cooking).
            // So logic remains: if order.status != COMPLETED, it is active.
            const statusFilter: any[] = activeTab === 'active' ? ['PENDING', 'COOKING'] : ['COMPLETED']
            const data = await getKitchenOrders(statusFilter)

            // Only play sound for new active orders
            if (activeTab === 'active' && data.length > previousOrderCount.current) {
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio play failed', e))
                }
            }
            if (activeTab === 'active') {
                previousOrderCount.current = data.length
            }
            setOrders(data)
        } catch (e) {
            console.error(e)
        }
    }

    // Poll every 3 seconds
    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 3000)
        // Simple "Ding" sound (Base64 MP3)
        const BEEP_URL = 'data:audio/mp3;base64,SUQzBAAAAAABAFRYWFQAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhUAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhUAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAOAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAQNGluZzEAAAABAAAAiQAAD5CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAAD/7kGQAABAAABAAAAAAAABAAAABIMTuaYAAAAAAABAAAAE0gBLqYAAAAAAABAAAAAAH//uQZACAAABAAAAAAAABAAAAAAQSDU5mAAAAAAABAAAAAAH//uQZACAAABAAAAAAAABAAAAAAQSDU5mAAAAAAABAAAAAAH//uQZACAAABAAAAAAAABAAAAAAQSDU5mAAAAAAABAAAAAAH//uQZACAAABAAAAAAAABAAAAAAQSDU5mAAAAAAABAAAAAAH/'
        audioRef.current = new Audio(BEEP_URL)
        return () => clearInterval(interval)
    }, [activeTab]) // Re-run when tab changes

    const handleBatchUpdate = async (orderId: number, itemIds: number[], status: 'COOKING' | 'COMPLETED') => {
        isUpdating.current = true

        // Optimistic Update: Update specific items within the order
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                // Update item statuses
                const newItems = o.items.map((i: any) => itemIds.includes(i.id) ? { ...i, status } : i)

                // Recalculate Order Status Optimistically
                const allCompleted = newItems.every((i: any) => i.status === 'COMPLETED')
                const anyCooking = newItems.some((i: any) => i.status === 'COOKING' || i.status === 'COMPLETED')
                let newOrderStatus = 'PENDING'
                if (allCompleted) newOrderStatus = 'COMPLETED'
                else if (anyCooking) newOrderStatus = 'COOKING'

                return { ...o, items: newItems, status: newOrderStatus }
            }
            return o
        }))

        try {
            await updateOrderItemStatus(orderId, itemIds, status)
        } finally {
            isUpdating.current = false
            // Do not fetch immediately to prevent flash of stale data. 
            // Let the next poll cycle (max 3s) sync the state.
        }
    }


    // Filter Logic
    const getFilteredItems = (items: any[]) => {
        if (kitchenFilter === 'ALL') return items
        return items.filter((item: any) => {
            const catName = item.menuItem.category.name
            if (kitchenFilter === 'DRINK') {
                return catName.includes('茶') || catName.includes('咖啡') || catName.includes('飲')
            } else { // FOOD
                return catName.includes('主食') || catName.includes('小吃') || catName.includes('飯') || catName.includes('麵')
            }
        })
    }

    const filteredOrders = orders.filter(order => {
        // Enforce Status Filter Client-Side (for Optimistic Updates to effectively "remove" card)
        if (activeTab === 'active') {
            if (order.status === 'COMPLETED') return false
        } else {
            if (order.status !== 'COMPLETED') return false
        }

        const visibleItems = getFilteredItems(order.items)
        return visibleItems.length > 0
    })

    const renderOrderCard = (order: any) => {
        const visibleItems = getFilteredItems(order.items)

        // Find items that can be advanced
        // If status is Pending -> can go to Cooking
        // If status is Cooking -> can go to Completed
        // We only act on VISIBLE items in this station
        // Fix: Treat Missing Status as PENDING to handle legacy/migration cases
        const pendingItems = visibleItems.filter((i: any) => !i.status || i.status === 'PENDING')
        const cookingItems = visibleItems.filter((i: any) => i.status === 'COOKING')

        return (
            <Card key={order.id} className={`flex flex-col border-t-4 ${order.status === 'PENDING' ? 'border-t-yellow-500' : order.status === 'COOKING' ? 'border-t-blue-500' : 'border-t-green-500'}`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">#{order.id}</CardTitle>
                        <Badge variant={order.status === 'PENDING' ? 'outline' : 'default'} className={
                            order.status === 'PENDING' ? 'text-yellow-600 border-yellow-600' :
                                order.status === 'COOKING' ? 'bg-blue-500' : 'bg-green-600'
                        }>
                            {order.status === 'PENDING' ? '新訂單' : order.status === 'COOKING' ? '製作中' : '已完成'}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span suppressHydrationWarning>
                            {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="text-lg font-bold mt-1">
                        {order.type === 'DINE_IN' ? `桌號: ${order.tableNumber}` : '外帶'}
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <ul className="space-y-3">
                        {visibleItems.map((item: any) => (
                            <li key={item.id} className="flex justify-between font-medium text-lg border-b pb-1 last:border-0 items-start">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        {/* Status Icon per Item */}
                                        {item.status === 'COMPLETED' ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : item.status === 'COOKING' ? (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        )}
                                        <span>{item.menuItem.name}</span>
                                    </div>
                                    {item.notes && <span className="text-sm text-muted-foreground pl-4">{item.notes}</span>}
                                </div>
                                <div className="text-right">
                                    <span className="font-bold">x{item.quantity}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                {activeTab === 'active' && (
                    <CardFooter className="pt-2 grid grid-cols-2 gap-2">
                        {/* 
                            Logic:
                            Show "Start Cooking" if there are any Visible Pending items.
                            Show "Complete" if there are any Visible Cooking items.
                        */}
                        {pendingItems.length > 0 && (
                            <Button className="w-full col-span-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleBatchUpdate(order.id, pendingItems.map((i: any) => i.id), 'COOKING')}>
                                開始製作 ({pendingItems.length})
                            </Button>
                        )}
                        {cookingItems.length > 0 && (
                            <Button className="w-full col-span-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleBatchUpdate(order.id, cookingItems.map((i: any) => i.id), 'COMPLETED')}>
                                <Check className="mr-2 w-4 h-4" /> 完成 ({cookingItems.length})
                            </Button>
                        )}
                    </CardFooter>
                )}
            </Card>
        )
    }

    return (
        <div className="p-6 h-screen bg-slate-100 dark:bg-slate-900 overflow-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ChefHat /> 廚房顯示系統 (KDS)
                </h1>

                <div className="flex gap-4">
                    {/* Kitchen Station Filter */}
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border">
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${kitchenFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                            onClick={() => setKitchenFilter('ALL')}
                        >
                            全部
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${kitchenFilter === 'DRINK' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                            onClick={() => setKitchenFilter('DRINK')}
                        >
                            <Coffee className="w-4 h-4 inline mr-1" />
                            飲品區
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${kitchenFilter === 'FOOD' ? 'bg-orange-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                            onClick={() => setKitchenFilter('FOOD')}
                        >
                            <Utensils className="w-4 h-4 inline mr-1" />
                            熱食區
                        </button>
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border">
                        <button
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-slate-100 dark:bg-gray-700 shadow-sm' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('active')}
                        >
                            進行中
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-slate-100 dark:bg-gray-700 shadow-sm' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            已完成
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOrders.map(renderOrderCard)}
                {activeTab === 'active' && filteredOrders.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                        目前無符合條件的訂單
                    </div>
                )}
                {activeTab === 'history' && filteredOrders.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                        無相關歷史紀錄
                    </div>
                )}
            </div>
        </div>
    )
}
