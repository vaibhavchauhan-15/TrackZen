'use client'

import { useState } from 'react'
import { PageTransition } from '@/components/ui/page-transition'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { Menu } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-bg-base">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-[72px]">
          {/* Mobile Menu Button - Only visible on mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-30 p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
