'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LayoutDashboard, Utensils, LogOut, Monitor, ChefHat, Tag, Settings2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        // Implement logout (clear cookie via API or just client side redirect to logic)
        // For MVP, simply redirect to login which should handle session or just overwrite
        // Ideally we call an API to clear cookie
        document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/login')
    }

    const NavItems = () => (
        <div className="flex flex-col gap-2">
            <Link href="/admin">
                <Button variant={pathname === '/admin' ? 'secondary' : 'ghost'} className="w-full justify-start">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    儀表板
                </Button>
            </Link>
            <Link href="/admin/menu">
                <Button variant={pathname.startsWith('/admin/menu') ? 'secondary' : 'ghost'} className="w-full justify-start">
                    <Utensils className="mr-2 h-4 w-4" />
                    菜單管理
                </Button>
            </Link>
            <Link href="/admin/categories">
                <Button variant={pathname.startsWith('/admin/categories') ? 'secondary' : 'ghost'} className="w-full justify-start">
                    <Tag className="mr-2 h-4 w-4" />
                    分類管理
                </Button>
            </Link>
            <Link href="/admin/notes">
                <Button variant={pathname.startsWith('/admin/notes') ? 'secondary' : 'ghost'} className="w-full justify-start">
                    <Settings2 className="mr-2 h-4 w-4" />
                    備註管理
                </Button>
            </Link>
            <div className="my-4 border-t" />
            <Link href="/" target="_blank">
                <Button variant="ghost" className="w-full justify-start">
                    <Monitor className="mr-2 h-4 w-4" />
                    開啟前台 POS
                </Button>
            </Link>
            <Link href="/kitchen" target="_blank">
                <Button variant="ghost" className="w-full justify-start">
                    <ChefHat className="mr-2 h-4 w-4" />
                    開啟廚房看板
                </Button>
            </Link>
            <div className="mt-auto pt-4">
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-background p-6 md:flex">
                <div className="mb-6 flex items-center gap-2 font-bold text-xl">
                    <div className="h-8 w-8 rounded-full bg-primary" />
                    POS Admin
                </div>
                <NavItems />
            </aside>

            {/* Mobile Sidebar */}
            <div className="flex flex-col flex-1">
                <header className="flex h-12 items-center border-b bg-background px-4 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-6">
                            <div className="mb-6 font-bold text-xl">POS 管理後台</div>
                            <NavItems />
                        </SheetContent>
                    </Sheet>
                    <div className="font-semibold ml-4">管理控制台</div>
                </header>

                <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
