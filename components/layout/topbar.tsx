'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function TopBar() {
  const { data: session } = useSession()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // Fetch user's current streak
    const fetchStreak = async () => {
      try {
        const res = await fetch('/api/streaks')
        const data = await res.json()
        if (data.globalStreak !== undefined) {
          setStreak(data.globalStreak)
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error)
      }
    }
    fetchStreak()
  }, [])

  const getStreakColor = (days: number) => {
    if (days === 0) return 'text-text-muted'
    if (days <= 2) return 'text-accent-red'
    if (days <= 6) return 'text-accent-orange'
    if (days <= 13) return 'text-streak-gold'
    if (days <= 29) return 'text-accent-purple'
    return 'text-accent-cyan'
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-bg-surface px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search plans, habits, topics..."
            className="h-10 w-full rounded-lg border border-border bg-bg-elevated pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Streak Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2"
        >
          <Flame className={`h-5 w-5 ${getStreakColor(streak)}`} />
          <span className="text-sm font-semibold text-text-primary">{streak}</span>
          <span className="text-xs text-text-muted">day streak</span>
        </motion.div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-red" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg hover:bg-bg-elevated p-2 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-text-primary">{session?.user?.name}</p>
                <p className="text-xs text-text-muted">View profile</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
