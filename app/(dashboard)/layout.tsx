'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/ui/page-transition'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { SidebarProvider, useSidebar } from '@/components/providers/sidebar-provider'

// Inner layout consumes SidebarProvider so it can react to expanded state
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar()
  const [isDesktop, setIsDesktop] = useState(false)

  // Only apply sidebar margin on lg+ screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const marginLeft = isDesktop ? (isExpanded ? 240 : 72) : 0

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg-base">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content — margin tracks the sidebar width on desktop only */}
      <motion.div
        className="flex flex-1 flex-col min-h-0"
        animate={{ marginLeft }}
        transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
      >
        <main className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6 pb-28 lg:pb-6 scrollbar-thin">
          <PageTransition>{children}</PageTransition>
        </main>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <SidebarProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </SidebarProvider>
    </DashboardProvider>
  )
}
