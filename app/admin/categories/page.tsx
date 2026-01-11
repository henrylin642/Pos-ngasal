import { getCategories } from '@/app/actions/menu'
import { CategoryList } from './client'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">分類管理</h1>
            </div>

            <CategoryList initialCategories={categories} />
        </div>
    )
}
