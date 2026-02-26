import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import SessionProvider from '@/components/providers/session-provider'
import { SWRProvider } from '@/components/providers/swr-provider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrackZen - AI-Powered Study Planner & Habit Tracker',
  description:
    'Achieve your goals with AI-assisted study planning, habit tracking, and streak-based motivation. Perfect for students and professionals.',
  keywords: 'study planner, habit tracker, AI planning, productivity, exam preparation',
  icons: {
    icon: '/TrackZen_sign.png',
    apple: '/TrackZen_sign.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <SWRProvider>
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
