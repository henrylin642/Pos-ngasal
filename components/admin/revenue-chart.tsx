'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { getMonthlyStats } from '@/app/actions/stats'
import { Loader2 } from 'lucide-react'

export function RevenueChart() {
    const [data, setData] = useState<{ day: string, revenue: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChartData = async () => {
            const today = new Date()
            const rawData = await getMonthlyStats(today.getFullYear(), today.getMonth() + 1)

            // Transform to array and fill missing days
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
            const chartData = []

            for (let i = 1; i <= daysInMonth; i++) {
                const dayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
                chartData.push({
                    day: `${i}日`,
                    revenue: rawData[dayStr] || 0
                })
            }

            setData(chartData)
            setLoading(false)
        }

        fetchChartData()
    }, [])

    if (loading) return <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle>本月每日營收</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="day"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval={2} // Show every 3rd label (index 0, 3, 6...)
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
