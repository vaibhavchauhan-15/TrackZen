'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LayoutDashboard, Calendar, Target, Flame, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboard } from '@/components/providers/dashboard-provider'
import { useSession } from 'next-auth/react'
import { useMemo, useEffect, useState } from 'react'

interface NavItem {
  href: string
  icon: typeof LayoutDashboard
  label: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/planner', icon: Calendar, label: 'Planner' },
  { href: '/habits', icon: Target, label: 'Habits' },
]

/* Streak color helper */
const getStreakTheme = (s: number) =>
  s === 0  ? { color: '#6b7280', glow: 'rgba(107,114,128,0.25)' } :
  s <= 2   ? { color: '#f87171', glow: 'rgba(248,113,113,0.30)' } :
  s <= 6   ? { color: '#fb923c', glow: 'rgba(251,146,60,0.30)' }  :
  s <= 13  ? { color: '#facc15', glow: 'rgba(250,204,21,0.30)' }  :
  s <= 29  ? { color: '#c084fc', glow: 'rgba(192,132,252,0.30)' } :
             { color: '#22d3ee', glow: 'rgba(34,211,238,0.30)' }

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data } = useDashboard()
  const { data: session } = useSession()

  const user = session?.user
  const streak = data?.streak?.current ?? 0

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Gate on mounted so first render matches the server (streak=0 → neutral color)
  const streakTheme = useMemo(() => getStreakTheme(mounted ? streak : 0), [streak, mounted])

  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }, [user?.name])

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0c10]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-inset-bottom"
      style={{ 
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent-purple/50 to-transparent" />
      
      <div className="flex items-center justify-around px-1 pt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[52px] min-h-[52px] px-2 py-1.5',
                'rounded-xl transition-all duration-200',
                'touch-manipulation active:scale-95',
                isActive 
                  ? 'text-accent-purple' 
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {/* Active indicator background */}
              {isActive && (
                mounted ? (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-accent-purple/10 rounded-xl"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-accent-purple/10 rounded-xl" />
                )
              )}
              
              {/* Icon with scale animation */}
              {mounted ? (
                <motion.div
                  className="relative z-10"
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]'
                    )} 
                  />
                </motion.div>
              ) : (
                <div className={cn('relative z-10', isActive && 'scale-110')}>
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]'
                    )} 
                  />
                </div>
              )}
              
              {/* Label */}
              <span 
                className={cn(
                  'relative z-10 text-[10px] font-medium mt-1 transition-all duration-200',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {item.label}
              </span>
              
              {/* Active dot indicator */}
              {isActive && (
                mounted ? (
                  <motion.div
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-purple rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                  />
                ) : (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-purple rounded-full" />
                )
              )}
            </Link>
          )
        })}
        
        {/* Streak Item */}
        <div
          className={cn(
            'relative flex flex-col items-center justify-center',
            'min-w-[52px] min-h-[52px] px-2 py-1.5',
            'rounded-xl transition-all duration-200',
          )}
        >
          <div 
            className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: streakTheme.glow }}
          >
            <Flame 
              className="h-5 w-5 transition-all duration-200" 
              style={{ color: streakTheme.color }}
            />
          </div>
          <span className="relative z-10 text-[10px] font-bold mt-0.5" style={{ color: streakTheme.color }} suppressHydrationWarning>
            {streak}
          </span>
        </div>
        
        {/* Profile Item */}
        <Link
          href="/dashboard"
          className={cn(
            'relative flex flex-col items-center justify-center',
            'min-w-[52px] min-h-[52px] px-2 py-1.5',
            'rounded-xl transition-all duration-200',
            'touch-manipulation active:scale-95',
            'text-text-muted hover:text-text-secondary'
          )}
        >
          <div className="relative z-10 w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/10 bg-[#14161d]">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Profile'}
                width={28}
                height={28}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500 text-[10px] font-bold text-white select-none">
                {initials}
              </div>
            )}
          </div>
          <span className="relative z-10 text-[10px] font-medium mt-0.5 opacity-70">
            Profile
          </span>
        </Link>
      </div>
    </nav>
  )
}
