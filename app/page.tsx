import { getMenuItems, getCategories } from '@/app/actions/menu'
import PosClient from '@/components/pos/pos-client'
import { getNoteOptions } from '@/app/actions/note'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [menuItems, categories, notes] = await Promise.all([
    getMenuItems(),
    getCategories(),
    getNoteOptions()
  ])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PosClient initialItems={menuItems} categories={categories} initialNotes={notes} />
    </main>
  )
}
