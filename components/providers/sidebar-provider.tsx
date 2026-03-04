'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const STORAGE_KEY = 'sidebar-expanded'

interface SidebarContextType {
  isExpanded: boolean
  toggle: () => void
  setExpanded: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to expanded on first load; hydrate from localStorage after mount
  const [isExpanded, setIsExpanded] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setIsExpanded(stored === 'true')
    setMounted(true)
  }, [])

  const setExpanded = useCallback((v: boolean) => {
    setIsExpanded(v)
    localStorage.setItem(STORAGE_KEY, String(v))
  }, [])

  const toggle = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded, setExpanded])

  // Suppress layout shift by not rendering children until mounted
  if (!mounted) {
    return (
      <SidebarContext.Provider value={{ isExpanded: true, toggle, setExpanded }}>
        {children}
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, toggle, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
