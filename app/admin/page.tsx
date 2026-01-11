import { getDashboardStats } from '@/app/actions/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ShoppingCart, TrendingUp, ListOrdered, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { SalesCalendar } from '@/components/admin/sales-calendar'
import { BackupButton } from '@/components/admin/backup-button'
import { RevenueChart } from '@/components/admin/revenue-chart'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const stats = await getDashboardStats()

    // Calculate growth (simple check to avoid division by zero)
    const growth = stats.lastMonthRevenue > 0
        ? ((stats.totalRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
        : 0
    const isPositive = growth >= 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">儀表板</h1>
                <BackupButton />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">今日總訂單數</CardTitle>
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>

                <Card className="p-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                        <CardTitle className="text-sm font-medium">今日總營收</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            {isPositive ? <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" /> : <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />}
                            <span className={isPositive ? "text-green-500" : "text-red-500"}>{Math.abs(growth).toFixed(1)}%</span>
                            <span className="ml-1">vs 上月 (總額 ${stats.lastMonthRevenue.toFixed(0)})</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
                <SalesCalendar />

                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-4">
                    <RevenueChart />

                    <Card>
                        <CardHeader>
                            <CardTitle>熱銷商品排行</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {stats.topItems.map((item, index) => (
                                    <div key={item.id} className="flex items-center">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 font-bold mr-4">
                                            {index + 1}
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.category?.name}</p>
                                        </div>
                                        <div className="ml-auto font-medium">{item.count} 已售出</div>
                                    </div>
                                ))}
                                {stats.topItems.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        尚無銷售數據
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
