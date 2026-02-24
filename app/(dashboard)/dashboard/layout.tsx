'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent-purple border-t-transparent mx-auto" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
