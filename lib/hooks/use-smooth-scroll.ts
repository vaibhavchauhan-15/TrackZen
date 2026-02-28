'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface SmoothScrollOptions {
  /** Smoothness factor (lower = smoother, 0.08-0.12 recommended) */
  smoothness?: number
  /** Enable/disable smooth scroll */
  enabled?: boolean
  /** Respect reduced motion preference */
  respectReducedMotion?: boolean
}

/**
 * Custom hook for GSAP-powered buttery smooth scrolling
 * Creates a virtual scroll that interpolates for silky smooth movement
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const {
    smoothness = 0.08,
    enabled = true,
    respectReducedMotion = true
  } = options

  const currentScrollRef = useRef(0)
  const targetScrollRef = useRef(0)
  const rafRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  // Smooth scroll animation loop
  const smoothScrollLoop = useCallback(() => {
    if (!isRunningRef.current) return

    // Lerp (linear interpolation) for smooth movement
    currentScrollRef.current += (targetScrollRef.current - currentScrollRef.current) * smoothness
    
    // Apply the smooth scroll position
    window.scrollTo(0, currentScrollRef.current)

    // Continue loop if not at target (with small threshold)
    if (Math.abs(targetScrollRef.current - currentScrollRef.current) > 0.5) {
      rafRef.current = requestAnimationFrame(smoothScrollLoop)
    } else {
      isRunningRef.current = false
    }
  }, [smoothness])

  // Handle wheel events for smooth scrolling
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    // Update target scroll position
    targetScrollRef.current = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        targetScrollRef.current + e.deltaY
      )
    )

    // Start animation loop if not running
    if (!isRunningRef.current) {
      isRunningRef.current = true
      currentScrollRef.current = window.scrollY
      rafRef.current = requestAnimationFrame(smoothScrollLoop)
    }
  }, [smoothScrollLoop])

  // Smooth scroll to a specific element
  const scrollTo = useCallback((target: string | HTMLElement | number, duration = 1.2) => {
    let targetY: number

    if (typeof target === 'number') {
      targetY = target
    } else if (typeof target === 'string') {
      const element = document.querySelector(target)
      if (!element) return
      targetY = element.getBoundingClientRect().top + window.scrollY - 80 // 80px offset for header
    } else {
      targetY = target.getBoundingClientRect().top + window.scrollY - 80
    }

    // Use GSAP for the scroll animation
    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration,
      ease: 'power3.out'
    })
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (respectReducedMotion && prefersReducedMotion) return

    // Set initial scroll position
    currentScrollRef.current = window.scrollY
    targetScrollRef.current = window.scrollY

    // Add wheel event listener with passive: false to prevent default
    window.addEventListener('wheel', handleWheel, { passive: false })

    // Handle anchor link clicks for smooth navigation
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (!anchor) return
      
      const href = anchor.getAttribute('href')
      if (!href || href === '#') return
      
      e.preventDefault()
      scrollTo(href)
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      document.removeEventListener('click', handleAnchorClick)
      cancelAnimationFrame(rafRef.current)
      isRunningRef.current = false
    }
  }, [enabled, respectReducedMotion, handleWheel, scrollTo])

  return { scrollTo }
}

/**
 * Hook for creating scroll-triggered GSAP animations
 */
export function useScrollAnimation() {
  const addScrollTrigger = useCallback((
    element: string | HTMLElement,
    animation: gsap.TweenVars,
    triggerOptions: ScrollTrigger.Vars = {}
  ) => {
    return gsap.to(element, {
      ...animation,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse',
        ...triggerOptions
      }
    })
  }, [])

  const addParallax = useCallback((
    element: string | HTMLElement,
    speed: number = 0.5,
    direction: 'y' | 'x' = 'y'
  ) => {
    const movement = direction === 'y' ? { yPercent: speed * 100 } : { xPercent: speed * 100 }
    
    return gsap.to(element, {
      ...movement,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    })
  }, [])

  const addFadeIn = useCallback((
    elements: string | HTMLElement | HTMLElement[],
    options: {
      stagger?: number
      duration?: number
      y?: number
      delay?: number
    } = {}
  ) => {
    const { stagger = 0.1, duration = 0.8, y = 60, delay = 0 } = options

    return gsap.fromTo(elements, 
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: typeof elements === 'string' ? elements : elements instanceof HTMLElement ? elements : elements[0],
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, [])

  const addTextReveal = useCallback((
    element: string | HTMLElement,
    options: {
      duration?: number
      delay?: number
    } = {}
  ) => {
    const { duration = 1, delay = 0 } = options

    return gsap.fromTo(element,
      { 
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0 
      },
      {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        duration,
        delay,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, [])

  const addScaleReveal = useCallback((
    element: string | HTMLElement,
    options: {
      duration?: number
      scale?: number
    } = {}
  ) => {
    const { duration = 0.8, scale = 0.8 } = options

    return gsap.fromTo(element,
      { scale, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    )
  }, [])

  // Cleanup all ScrollTriggers
  const cleanup = useCallback(() => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
  }, [])

  return {
    addScrollTrigger,
    addParallax,
    addFadeIn,
    addTextReveal,
    addScaleReveal,
    cleanup
  }
}

/**
 * Initialize GSAP defaults for consistent animations
 */
export function initGSAPDefaults() {
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8
  })

  // Configure ScrollTrigger defaults
  ScrollTrigger.defaults({
    toggleActions: 'play none none reverse',
    markers: false
  })
}
