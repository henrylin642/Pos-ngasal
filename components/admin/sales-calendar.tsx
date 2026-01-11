'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getMonthlyStats } from '@/app/actions/stats'
import { Loader2 } from 'lucide-react'
import { zhTW } from 'date-fns/locale'

export function SalesCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [monthlyData, setMonthlyData] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

    const fetchStats = async (month: Date) => {
        setLoading(true)
        try {
            const data = await getMonthlyStats(month.getFullYear(), month.getMonth() + 1)
            setMonthlyData(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats(currentMonth)
    }, [currentMonth])

    const handleMonthChange = (month: Date) => {
        setCurrentMonth(month)
    }

    // Custom day content to show revenue
    const renderDay = (day: Date) => {
        const dateKey = day.toISOString().split('T')[0]
        const revenue = monthlyData[dateKey]

        return (
            <div className="relative flex flex-col items-center justify-center w-full h-full p-0">
                <span className="text-sm font-medium">{day.getDate()}</span>
                {revenue !== undefined && revenue > 0 && (
                    <span className="text-[10px] text-green-600 font-bold mt-[-2px]">
                        ${revenue}
                    </span>
                )}
            </div>
        )
    }

    const selectedDateRevenue = date ? monthlyData[date.toISOString().split('T')[0]] : 0

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>營收日曆</CardTitle>
                <CardDescription>查看每日與當月營收概況</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={currentMonth}
                        onMonthChange={handleMonthChange}
                        className="rounded-md border shadow"
                        components={{
                            // @ts-expect-error: DayContent type mismatch with v9 but works at runtime
                            DayContent: ({ date: day }) => renderDay(day)
                        }}
                        locale={zhTW}
                    />
                </div>

                <div className="w-full md:w-64 space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">
                            {date ? date.toLocaleDateString('zh-TW') : '選擇日期'}
                        </div>
                        <div className="text-3xl font-bold text-primary">
                            {loading ? <Loader2 className="animate-spin" /> : `$${selectedDateRevenue || 0}`}
                        </div>
                        <div className="text-sm font-medium mt-1">當日營收</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">
                            {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                            {loading ? <Loader2 className="animate-spin" /> : `$${Object.values(monthlyData).reduce((a, b) => a + b, 0)}`}
                        </div>
                        <div className="text-sm font-medium mt-1">本月總營收</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
