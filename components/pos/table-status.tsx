'use client'

import { useEffect, useState } from 'react'
import { getTableStatuses, clearTable, TableStatus } from '@/app/actions/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Users, Coffee, Trash2, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableStatusGridProps {
    variant?: 'desktop' | 'mobile'
}

export function TableStatusGrid({ variant = 'desktop' }: TableStatusGridProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [statuses, setStatuses] = useState<TableStatus[]>([])

    const fetchStatuses = async () => {
        const data = await getTableStatuses()
        setStatuses(data)
    }

    useEffect(() => {
        fetchStatuses()
        const interval = setInterval(fetchStatuses, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [])

    const handleClearTable = async (tableNumber: number) => {
        if (confirm(`確定要清空第 ${tableNumber} 桌並結帳嗎？`)) {
            await clearTable(tableNumber)
            fetchStatuses()
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
            case 'COOKING': return 'bg-blue-100 border-blue-300 text-blue-800'
            case 'COMPLETED': return 'bg-green-100 border-green-300 text-green-800'
            default: return 'bg-slate-50 border-slate-200 text-slate-400'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return '點餐完成'
            case 'COOKING': return '製作中'
            case 'COMPLETED': return '已上菜'
            default: return '空桌'
        }
    }

    const renderGrid = () => (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statuses.map(table => (
                <Card key={table.tableNumber} className={cn("border-2 transition-colors relative group", getStatusColor(table.status))}>
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
                        <div className="text-xl font-bold mb-1 flex items-center gap-2">
                            <Coffee className="h-5 w-5 opacity-50" />
                            {table.tableNumber} 桌
                        </div>
                        <div className="text-sm font-semibold mb-1">
                            {getStatusLabel(table.status)}
                        </div>
                        {table.totalAmount !== undefined && (
                            <div className="text-lg font-mono font-bold my-1">
                                ${table.totalAmount}
                            </div>
                        )}

                        {table.status !== 'FREE' && (
                            <Button
                                size="sm"
                                variant="destructive"
                                className={cn(
                                    "mt-2 text-xs w-full transition-opacity",
                                    variant === 'desktop' ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClearTable(table.tableNumber)
                                }}
                            >
                                <Receipt className="w-3 h-3 mr-1" />
                                清桌/結帳
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    if (variant === 'mobile') {
        return (
            <div className="h-full w-full overflow-y-auto">
                {renderGrid()}
            </div>
        )
    }

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-96 transition-all duration-300 z-10 bg-white dark:bg-gray-900 border-t shadow-[0_-5px_10px_rgba(0,0,0,0.05)]",
            isOpen ? "h-72" : "h-12"
        )}>
            {/* Header / Toggle */}
            <div
                className="h-12 flex items-center justify-between px-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 font-semibold">
                    <Users className="h-4 w-4" />
                    桌位狀態監控
                    <span className="text-xs text-muted-foreground ml-2">(1-8 桌)</span>
                </div>
                <Button variant="ghost" size="sm">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
            </div>

            {/* Grid Content */}
            <div className="p-4 overflow-auto h-[calc(100%-3rem)] bg-slate-50/50 dark:bg-gray-950/50">
                {renderGrid()}
            </div>
        </div>
    )
}
