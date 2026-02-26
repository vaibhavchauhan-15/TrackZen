'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
