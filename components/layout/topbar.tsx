'use client'

import { signOut } from 'next-auth/react'
import { Flame, Menu } from 'lucide-react'
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
import { useDashboard } from '@/components/providers/dashboard-provider'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data } = useDashboard()
  
  const user = data?.user
  const streak = data?.streak || 0
  const loading = !data

  const getStreakColor = (days: number) => {
    if (days === 0) return 'text-text-muted'
    if (days <= 2) return 'text-accent-red'
    if (days <= 6) return 'text-accent-orange'
    if (days <= 13) return 'text-streak-gold'
    if (days <= 29) return 'text-accent-purple'
    return 'text-accent-cyan'
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-bg-surface px-4 sm:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-text-secondary hover:text-text-primary mr-4"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* App Title - visible on mobile when search is hidden */}
      <div className="flex-1 sm:hidden">
        <h1 className="text-lg font-semibold text-text-primary">TrackZen</h1>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden sm:block flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Streak Badge */}
        {!loading && (
          <div className="flex items-center gap-1 sm:gap-2 rounded-lg border border-border bg-bg-elevated px-2 sm:px-3 py-1 sm:py-2 transition-transform hover:scale-105 duration-200">
            <Flame className={`h-4 w-4 sm:h-5 sm:w-5 ${getStreakColor(streak)}`} />
            <span className="text-sm font-semibold text-text-primary">{streak}</span>
            <span className="text-xs text-text-muted hidden sm:inline">day streak</span>
          </div>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 rounded-lg hover:bg-bg-elevated p-1 sm:p-2 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
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
