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
    // Stores date string (YYYY-MM-DD) -> weather code
    const [monthlyWeather, setMonthlyWeather] = useState<Record<string, number>>({})
    const [dailyOrders, setDailyOrders] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [weatherCode, setWeatherCode] = useState<number | null>(null)

    const fetchMonthlyWeather = async (year: number, month: number) => {
        try {
            // Calculate start and end date for the month
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0)

            const startStr = startDate.toISOString().split('T')[0]
            const endStr = endDate.toISOString().split('T')[0]

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=25.0330&longitude=121.5654&daily=weather_code&timezone=Asia%2FTaipei&start_date=${startStr}&end_date=${endStr}`)
            const data: WeatherData = await res.json()

            if (data.daily) {
                const weatherMap: Record<string, number> = {}
                data.daily.time.forEach((time, index) => {
                    weatherMap[time] = data.daily.weather_code[index]
                })
                setMonthlyWeather(weatherMap)
            }
        } catch (error) {
            console.error('Failed to fetch monthly weather:', error)
        }
    }

    const fetchStats = async (month: Date) => {
        setLoading(true)
        try {
            const year = month.getFullYear()
            const monthNum = month.getMonth() + 1
            const data = await getMonthlyStats(year, monthNum)
            setMonthlyData(data)

            // Also fetch weather for this month
            await fetchMonthlyWeather(year, monthNum)
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

            // For the selected day, use the monthly data if available, or fetch specifically if needed
            // But since we fetch monthly, we might already have it.
            // However, the selected date might be outside the current month view if user clicked differently.
            // Let's keep the specific fetch for the detail card to be safe and accurate for "today".

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

    const getWeatherIconSmall = (code: number | undefined) => {
        if (code === undefined) return null
        const className = "h-3 w-3 mb-0.5" // Small icon style

        if (code <= 3) return <Sun className={`${className} text-yellow-500`} />
        if (code <= 48) return <Cloud className={`${className} text-gray-400`} />
        if (code <= 67) return <CloudRain className={`${className} text-blue-500`} />
        if (code <= 77) return <Snowflake className={`${className} text-blue-300`} />
        if (code <= 82) return <CloudRain className={`${className} text-blue-600`} />
        return <CloudSun className={`${className} text-orange-400`} />
    }

    // Custom day content to show revenue
    const renderDay = (day: Date) => {
        const dateKey = day.toISOString().split('T')[0]
        const revenue = monthlyData[dateKey]
        const wCode = monthlyWeather[dateKey]

        return (
            <div className="relative flex flex-col items-center justify-start w-full h-full pt-1">
                {/* Weather displayed at top */}
                <div className="h-4 flex items-center justify-center">
                    {getWeatherIconSmall(wCode)}
                </div>

                <span className="text-sm font-medium leading-none mb-1">{day.getDate()}</span>

                {revenue !== undefined && revenue > 0 && (
                    <span className="text-[10px] text-green-600 font-bold leading-none">
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
                            className="rounded-md border shadow p-3"
                            classNames={{
                                day: "h-16 w-16 p-0 font-normal aria-selected:opacity-100"
                            }}
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
                                                {order.id.toString().slice(-4)}
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
