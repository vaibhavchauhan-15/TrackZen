'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export default function SessionProvider({ 
  children, 
  session 
}: { 
  children: ReactNode
  session: any 
}) {
  return (
    <NextAuthSessionProvider 
      session={session}
      // Reduce unnecessary session refetches
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
