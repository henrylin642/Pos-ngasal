'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
            className={`flex flex-col h-full cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-95 ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
        >
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight flex items-start gap-1">
                        {item.name}
                        {isHot && <Flame className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />}
                        {isCold && <Snowflake className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />}
                    </CardTitle>
                    <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto">
                <Button
                    className="w-full"
                    onClick={() => onAdd(item)}
                    disabled={!item.isAvailable}
                >
                    {item.isAvailable ? (
                        <>
                            <Plus className="mr-2 h-4 w-4" /> 加入購物車
                        </>
                    ) : (
                        '已售完'
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
