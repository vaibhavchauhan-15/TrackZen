'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calendar, Target, BarChart3, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Habits', href: '/habits', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Image 
          src="/TrackZenTrans_logo.png" 
          alt="TrackZen Logo" 
          width={140} 
          height={32}
          className="object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent-purple text-white'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-accent-purple"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className="relative h-5 w-5" />
              <span className="relative">{item.name}</span>
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
  )
}
