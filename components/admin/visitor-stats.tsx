'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Eye } from 'lucide-react'
import { getVisitorStats } from '@/app/actions/analytics'

export function VisitorStatsCard() {
    const [stats, setStats] = useState({ uniqueIPs: 0, totalVisits: 0 })

    useEffect(() => {
        getVisitorStats().then(setStats)
    }, [])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日訪客統計</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
                        <p className="text-xs text-muted-foreground">獨立 IP 訪客</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
