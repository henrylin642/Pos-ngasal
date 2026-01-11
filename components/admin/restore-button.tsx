'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, RefreshCw } from 'lucide-react'
import { restoreData } from '@/app/actions/backup'
import { useRouter } from 'next/navigation'

export function RestoreButton() {
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm('警告：恢復資料將會清除目前商店的所有分類、商品和訂單資料。確定要繼續嗎？')) {
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setLoading(true)
        const reader = new FileReader()

        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result as string
                await restoreData(jsonString)
                alert('資料已成功恢復')
                router.refresh()
            } catch (error) {
                console.error(error)
                alert('恢復失敗，請檢查檔案格式')
            } finally {
                setLoading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }

        reader.readAsText(file)
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        恢復中...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        恢復資料
                    </>
                )}
            </Button>
        </>
    )
}
