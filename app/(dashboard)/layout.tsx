'use client'

import { PageTransition } from '@/components/ui/page-transition'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { DashboardProvider } from '@/components/providers/dashboard-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-bg-base">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-[72px]">
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-24 lg:pb-6 scrollbar-thin">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </DashboardProvider>
  )
}
