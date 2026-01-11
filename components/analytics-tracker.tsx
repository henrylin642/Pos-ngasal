'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordVisit } from '@/app/actions/analytics'

export function AnalyticsTracker() {
    const pathname = usePathname()
    // Use ref to prevent double-firing in Strict Mode locally, though useEffect dependency handles route changes
    const lastTrackedPath = useRef<string | null>(null)

    useEffect(() => {
        if (lastTrackedPath.current === pathname) return

        // Small delay to ensure not just a redirect flicker
        const timer = setTimeout(() => {
            recordVisit(pathname)
            lastTrackedPath.current = pathname
        }, 1000)

        return () => clearTimeout(timer)
    }, [pathname])

    return null
}
