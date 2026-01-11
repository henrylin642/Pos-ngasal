import { getMenuItems, getCategories, deleteMenuItem } from '@/app/actions/menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MenuClient } from './client'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
    const items = await getMenuItems()
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">菜單管理</h1>
            </div>

            <MenuClient items={items} categories={categories} />
        </div>
    )
}
