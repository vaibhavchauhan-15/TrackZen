'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageTransition } from '@/components/ui/page-transition'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { DashboardProvider } from '@/components/providers/dashboard-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    },
  })

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-bg-base">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
