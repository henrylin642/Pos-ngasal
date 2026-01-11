'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { exportData } from '@/app/actions/backup'

export function BackupButton() {
    const [loading, setLoading] = useState(false)

    const handleBackup = async () => {
        setLoading(true)
        try {
            const jsonString = await exportData()
            const blob = new Blob([jsonString], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            alert('備份失敗')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleBackup} disabled={loading} variant="outline">
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    備份中...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    備份資料
                </>
            )}
        </Button>
    )
}
