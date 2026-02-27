'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{}}>
      {children}
    </SWRConfig>
  )
}
