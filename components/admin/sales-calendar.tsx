'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getMonthlyStats, getDailyOrders } from '@/app/actions/stats'
import { Loader2, CloudSun, Sun, CloudRain, Cloud, Snowflake } from 'lucide-react'
import { zhTW } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WeatherData {
    daily: {
        time: string[]
        weather_code: number[]
    }
}

export function SalesCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [monthlyData, setMonthlyData] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

    // New State
    const [dailyOrders, setDailyOrders] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [weatherCode, setWeatherCode] = useState<number | null>(null)

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

    const fetchDailyData = async (selectedDate: Date) => {
        setOrdersLoading(true)
        try {
            const dateStr = selectedDate.toISOString().split('T')[0]
            const orders = await getDailyOrders(dateStr)
            setDailyOrders(orders)

            // Fetch Weather
            // Taipei coordinates: 25.0330, 121.5654
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=25.0330&longitude=121.5654&daily=weather_code&timezone=Asia%2FTaipei&start_date=${dateStr}&end_date=${dateStr}`)
            const weatherData: WeatherData = await res.json()
            if (weatherData.daily && weatherData.daily.weather_code.length > 0) {
                setWeatherCode(weatherData.daily.weather_code[0])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setOrdersLoading(false)
        }
    }

    useEffect(() => {
        fetchStats(currentMonth)
    }, [currentMonth])

    useEffect(() => {
        if (date) {
            fetchDailyData(date)
        }
    }, [date])

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

    const getWeatherIcon = (code: number | null) => {
        if (code === null) return null
        if (code <= 3) return <Sun className="h-8 w-8 text-yellow-500" />
        if (code <= 48) return <Cloud className="h-8 w-8 text-gray-400" />
        if (code <= 67) return <CloudRain className="h-8 w-8 text-blue-500" />
        if (code <= 77) return <Snowflake className="h-8 w-8 text-blue-300" />
        if (code <= 82) return <CloudRain className="h-8 w-8 text-blue-600" />
        return <CloudSun className="h-8 w-8 text-orange-400" />
    }

    const selectedDateRevenue = date ? monthlyData[date.toISOString().split('T')[0]] : 0

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-fit">
            <CardHeader>
                <CardTitle>營收日曆與銷售明細</CardTitle>
                <CardDescription>查看每日營收、天氣與詳細訂單</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            month={currentMonth}
                            onMonthChange={handleMonthChange}
                            className="rounded-md border shadow"
                            components={{
                                // @ts-expect-error: DayContent type mismatch
                                DayContent: ({ date: day }) => renderDay(day)
                            }}
                            locale={zhTW}
                        />
                    </div>

                    <div className="w-full md:w-64 space-y-6">
                        {/* Daily Summary Card */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">
                                        {date ? date.toLocaleDateString('zh-TW') : '選擇日期'}
                                    </div>
                                    <div className="text-3xl font-bold text-primary">
                                        {loading ? <Loader2 className="animate-spin" /> : `$${selectedDateRevenue || 0}`}
                                    </div>
                                    <div className="text-sm font-medium mt-1">當日營收</div>
                                </div>
                                {date && getWeatherIcon(weatherCode)}
                            </div>
                        </div>

                        {/* Monthly Summary Card */}
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
                </div>

                {/* Daily Sales List Raw Data */}
                {date && (
                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            📅 {date.toLocaleDateString('zh-TW')} 銷售清單 (Raw Data)
                            {ordersLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        </h3>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 bg-muted p-2 text-sm font-medium border-b">
                                <div className="col-span-2">時間</div>
                                <div className="col-span-2">單號</div>
                                <div className="col-span-6">內容</div>
                                <div className="col-span-2 text-right">金額</div>
                            </div>
                            <ScrollArea className="h-[300px]">
                                {dailyOrders.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">無銷售紀錄</div>
                                ) : (
                                    dailyOrders.map(order => (
                                        <div key={order.id} className="grid grid-cols-12 p-2 text-sm border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900">
                                            <div className="col-span-2 text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="col-span-2 font-mono text-xs text-muted-foreground pt-0.5 truncate">
                                                {order.id.slice(-6)}
                                            </div>
                                            <div className="col-span-6">
                                                {order.items.map((item: any) => (
                                                    <div key={item.id} className="text-xs">
                                                        {item.menuItem.name} x{item.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="col-span-2 text-right font-medium">
                                                ${order.totalAmount}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
