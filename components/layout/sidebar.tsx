'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calendar, Target, BarChart3, Settings, X } from 'lucide-react'
import { mutate } from 'swr'
import { fetcher } from '@/lib/swr-config'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, prefetchKey: '/api/dashboard/initial' },
  { name: 'Planner', href: '/planner', icon: Calendar, prefetchKey: '/api/plans' },
  { name: 'Habits', href: '/habits', icon: Target, prefetchKey: '/api/habits' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, prefetchKey: null }, // Analytics needs planId
  { name: 'Settings', href: '/settings', icon: Settings, prefetchKey: null },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "flex w-64 flex-col border-r border-border bg-bg-surface transition-transform duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Image 
            src="/TrackZenTrans_logo.png" 
            alt="TrackZen Logo" 
            width={140} 
            height={32}
            priority
            className="object-contain"
          />
          <button
            onClick={onClose}
            className="lg:hidden text-text-secondary hover:text-text-primary"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            
            // Prefetch handler - loads data on hover for instant navigation
            const handlePrefetch = () => {
              if (item.prefetchKey) {
                // Prefetch data asynchronously (fire and forget)
                mutate(item.prefetchKey, fetcher(item.prefetchKey), { revalidate: false })
              }
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={onClose}
                onMouseEnter={handlePrefetch}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-accent-purple text-white'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 p-4">
            <p className="mb-2 text-sm font-semibold text-text-primary">
              🎯 Pro Tip
            </p>
            <p className="text-xs text-text-secondary">
              Log progress daily to maintain your streak and unlock achievements!
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
