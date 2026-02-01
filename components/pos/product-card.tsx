'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Flame, Snowflake } from 'lucide-react'

interface ProductCardProps {
    item: any
    onAdd: (item: any) => void
}

export function ProductCard({ item, onAdd }: ProductCardProps) {
    const isHot = item.name.includes('熱') || item.name.includes('Hot')
    const isCold = item.name.includes('冰') || item.name.includes('Ice') || item.name.includes('Cold')

    return (
        <Card
            className={`transition-all hover:border-primary hover:shadow-sm ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
        >
            <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1 text-base font-semibold leading-tight truncate">
                            <span className="truncate">{item.name}</span>
                            {isHot && <Flame className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />}
                            {isCold && <Snowflake className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />}
                        </div>
                        {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {item.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-base">${item.price.toFixed(0)}</span>
                        <Button
                            size="icon"
                            variant="default"
                            onClick={() => onAdd(item)}
                            disabled={!item.isAvailable}
                            aria-label={item.isAvailable ? '加入購物車' : '已售完'}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
