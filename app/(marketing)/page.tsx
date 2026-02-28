'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from 'react'
import { motion, useScroll, useTransform, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
import { ArrowRight, Brain, Calendar, TrendingUp, Zap, Target, Flame, Sparkles, CheckCircle, MousePointer, Menu, X } from 'lucide-react'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
}

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Animation variants for Framer Motion (kept for smaller interactions)
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const smoothWrapperRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Check if mobile device
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // GSAP Smooth Scroll Implementation - Desktop only for performance
  useIsomorphicLayoutEffect(() => {
    // Disable custom smooth scroll on mobile for native scroll performance
    if (shouldReduceMotion || isMobile) return

    // Custom smooth scroll variables
    let current = 0
    let target = 0
    const ease = 0.075 // Lower = smoother (0.05-0.1 recommended)
    let rafId: number

    // Smooth scroll lerp function
    const smoothScroll = () => {
      current = gsap.utils.interpolate(current, target, ease)
      
      // Apply transform for super smooth movement
      if (smoothWrapperRef.current) {
        gsap.set(smoothWrapperRef.current, {
          y: -current,
          force3D: true
        })
      }

      // Update ScrollTrigger with new position
      ScrollTrigger.update()
      
      rafId = requestAnimationFrame(smoothScroll)
    }

    // Handle wheel scroll - Desktop only
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      target = Math.min(Math.max(target + e.deltaY, 0), maxScroll)
    }

    // Touch scrolling handled natively on mobile for better performance
    let touchStart = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      // Let mobile handle touch natively - much smoother
      if (isMobile) return
      e.preventDefault()
      const touchDelta = touchStart - e.touches[0].clientY
      touchStart = e.touches[0].clientY
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      target = Math.min(Math.max(target + touchDelta * 2, 0), maxScroll)
    }

    // Smooth anchor scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]')
      if (!anchor) return
      
      const href = anchor.getAttribute('href')
      if (!href || href === '#') return
      
      e.preventDefault()
      const element = document.querySelector(href)
      if (!element) return
      
      const elementTop = element.getBoundingClientRect().top + current - 80
      
      gsap.to({ value: current }, {
        value: elementTop,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: function() {
          target = this.targets()[0].value
        }
      })
    }

    // Setup fixed body and scrollable wrapper
    const setupSmoothScroll = () => {
      if (!smoothWrapperRef.current) return

      // Get content height
      const contentHeight = smoothWrapperRef.current.scrollHeight

      // Set body height to create scrollable area
      document.body.style.height = `${contentHeight}px`
      document.body.style.overflow = 'hidden'
      
      // Fix the wrapper
      smoothWrapperRef.current.style.position = 'fixed'
      smoothWrapperRef.current.style.top = '0'
      smoothWrapperRef.current.style.left = '0'
      smoothWrapperRef.current.style.width = '100%'
      smoothWrapperRef.current.style.willChange = 'transform'

      // Configure ScrollTrigger to use our custom scroller
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
          if (arguments.length && value !== undefined) {
            target = value
            current = value
          }
          return current
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      })
    }

    // Initialize
    setupSmoothScroll()
    smoothScroll()

    // Event listeners
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('click', handleAnchorClick)

    // Handle resize
    const handleResize = () => {
      if (smoothWrapperRef.current) {
        document.body.style.height = `${smoothWrapperRef.current.scrollHeight}px`
        ScrollTrigger.refresh()
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('click', handleAnchorClick)
      window.removeEventListener('resize', handleResize)
      document.body.style.height = ''
      document.body.style.overflow = ''
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [shouldReduceMotion, isMobile])

  // GSAP ScrollTrigger animations for sections - simplified on mobile
  useIsomorphicLayoutEffect(() => {
    if (shouldReduceMotion) return

    const ctx = gsap.context(() => {
      // Parallax background blobs
      gsap.to('.parallax-blob-1', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5
        }
      })

      gsap.to('.parallax-blob-2', {
        yPercent: -50,
        xPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 2
        }
      })

      // Section reveals with stagger
      gsap.utils.toArray('.gsap-reveal').forEach((section: any) => {
        gsap.fromTo(section, 
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        )
      })

      // Text character reveal
      gsap.utils.toArray('.gsap-text-reveal').forEach((text: any) => {
        gsap.fromTo(text,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.2,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: text,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        )
      })

      // Scale up cards on scroll
      gsap.utils.toArray('.gsap-scale-card').forEach((card: any, i: number) => {
        gsap.fromTo(card,
          { scale: 0.8, opacity: 0, y: 50 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none none'
            }
          }
        )
      })

      // Horizontal scroll effect for stats
      ScrollTrigger.create({
        trigger: '.stats-section',
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.stat-item',
            { scale: 0.5, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              stagger: 0.15,
              ease: 'elastic.out(1, 0.5)'
            }
          )
        },
        once: true
      })
    }, mainRef)

    return () => ctx.revert()
  }, [shouldReduceMotion])

  return (
    <div ref={mainRef} className="min-h-screen bg-bg-base">
      <div ref={smoothWrapperRef} className="smooth-wrapper">
      {/* Animated Background - Reduced on mobile for performance */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="parallax-blob-1 absolute top-0 -left-20 md:-left-40 w-48 md:w-80 h-48 md:h-80 bg-accent-purple/15 md:bg-accent-purple/20 rounded-full blur-[80px] md:blur-[120px]"
          animate={(shouldReduceMotion || isMobile) ? {} : { x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="parallax-blob-2 absolute top-1/3 -right-20 md:-right-40 w-56 md:w-96 h-56 md:h-96 bg-accent-cyan/10 md:bg-accent-cyan/15 rounded-full blur-[80px] md:blur-[120px]"
          animate={(shouldReduceMotion || isMobile) ? {} : { x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="hidden md:block absolute bottom-0 left-1/3 w-72 h-72 bg-accent-purple/10 rounded-full blur-[100px]"
          animate={(shouldReduceMotion || isMobile) ? {} : { x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] md:bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-bg-base/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Image 
              src="/TrackZenTrans_logo.png" 
              alt="TrackZen Logo" 
              width={160} 
              height={36}
              className="object-contain"
            />
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#testimonials">Testimonials</NavLink>
            <NavLink href="#cta">Get Started</NavLink>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AnimatedButton href="/login" size="default">
                Get Started
              </AnimatedButton>
            </motion.div>
          </nav>
          <MobileNav />
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section relative container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 min-h-screen flex items-center">
        <motion.div 
          className="mx-auto max-w-5xl text-center"
          style={shouldReduceMotion ? {} : { y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-2 text-sm text-accent-purple">
                <motion.span
                  animate={shouldReduceMotion ? {} : { rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                <span>AI-Powered Planning for High Achievers</span>
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-text-primary"
            >
              Master Your Goals with
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-purple bg-[size:200%_auto] bg-clip-text text-transparent animate-gradient">
                  AI + Habits
                </span>
                <motion.span 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
                />
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl lg:text-2xl text-text-secondary px-2"
            >
              The all-in-one platform combining AI study planning, habit tracking, and streak-based motivation. Perfect for students, professionals, and lifelong learners.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <AnimatedButton href="/login" size="lg" className="shadow-lg shadow-accent-purple/25">
                  Start Free Today
                  <motion.span
                    animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </AnimatedButton>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <AnimatedButton variant="secondary" size="lg">
                  <MousePointer className="h-4 w-4" />
                  Watch Demo
                </AnimatedButton>
              </motion.div>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-6 sm:pt-8 text-text-muted text-xs sm:text-sm"
            >
              {['No credit card required', 'Free forever plan', '2-minute setup'].map((text, i) => (
                <motion.span 
                  key={text}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  <CheckCircle className="h-4 w-4 text-accent-green" />
                  {text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center p-2"
            animate={shouldReduceMotion ? {} : { y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div 
              className="w-1.5 h-1.5 bg-accent-purple rounded-full"
              animate={shouldReduceMotion ? {} : { y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />

      <footer className="border-t border-border bg-bg-surface py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center text-sm sm:text-base text-text-secondary">
          <motion.div 
            className="mb-4 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Flame className="h-6 w-6 text-accent-purple" />
            <span className="text-xl font-bold text-text-primary">TrackZen</span>
          </motion.div>
          <p>&copy; 2026 TrackZen. All rights reserved.</p>
        </div>
      </footer>
      </div>{/* End smooth-wrapper */}
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a 
      href={href} 
      className="relative text-text-secondary hover:text-text-primary transition-colors"
      whileHover="hover"
    >
      {children}
      <motion.span
        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-purple rounded-full"
        initial={{ scaleX: 0 }}
        variants={{ hover: { scaleX: 1 } }}
        transition={{ duration: 0.2 }}
      />
    </motion.a>
  )
}

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  
  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#cta", label: "Get Started" }
  ]
  
  return (
    <div className="md:hidden">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 right-0 bg-bg-base/95 backdrop-blur-xl border-b border-border"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg text-text-secondary hover:text-text-primary transition-colors py-2"
                  whileHover={{ x: 4 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="pt-4 border-t border-border">
                <AnimatedButton href="/login" size="default" className="w-full justify-center">
                  Sign In
                </AnimatedButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const features = [
    { icon: <Brain className="h-8 w-8" />, title: "AI Study Planner", description: "Enter your exam name or upload a syllabus. Our AI generates a personalized study plan with topics, hours, and schedules.", gradient: "from-accent-purple to-accent-purple/50" },
    { icon: <Calendar className="h-8 w-8" />, title: "Smart Scheduling", description: "Date-bounded or open-ended plans. Automatically distributes topics across your available time. Reschedule when life happens.", gradient: "from-accent-cyan to-accent-cyan/50" },
    { icon: <Target className="h-8 w-8" />, title: "Habit Tracking", description: "Build consistent daily routines. Track habits with daily/weekly/monthly frequencies. Visual heatmaps and dot grids.", gradient: "from-accent-green to-accent-green/50" },
    { icon: <Flame className="h-8 w-8" />, title: "Streak System", description: "Gamified streaks with color evolution. From red → orange → gold → purple → fire. Miss a day? Get back on track instantly.", gradient: "from-accent-orange to-accent-orange/50" },
    { icon: <TrendingUp className="h-8 w-8" />, title: "Rich Analytics", description: "Hours studied vs planned. Completion rates. Heatmaps. Habit scores. Pace analysis. Everything visualized beautifully.", gradient: "from-accent-purple to-accent-cyan" },
    { icon: <Zap className="h-8 w-8" />, title: "Smooth Animations", description: "Tasteful GSAP and Framer Motion animations. Progress rings, streak badges, and transitions that feel amazing.", gradient: "from-streak-gold to-accent-orange" }
  ]
  
  return (
    <section id="features" ref={ref} className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <motion.div 
        className="mb-10 sm:mb-16 text-center px-2"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <span className="inline-block mb-3 sm:mb-4 text-sm text-accent-purple font-medium">FEATURES</span>
        <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary">Everything You Need to Succeed</h2>
        <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto">Powerful features designed to keep you on track and help you achieve your goals faster</p>
      </motion.div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <motion.div 
      className="group relative rounded-xl sm:rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-sm p-4 sm:p-6 h-full overflow-hidden"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <motion.div 
        className={`relative mb-3 sm:mb-4 inline-flex rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} p-2.5 sm:p-3 text-white shadow-lg`}
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <h3 className="relative mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-text-primary">{title}</h3>
      <p className="relative text-sm sm:text-base text-text-secondary">{description}</p>
      <motion.div 
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const steps = [
    { number: "01", title: "Create Your Plan", description: "Use AI to generate a study plan from exam name or syllabus, or create one manually. Set your date or daily hours goal." },
    { number: "02", title: "Track Progress Daily", description: "Log study hours and complete habits each day. Watch your streaks grow and your progress bars fill up." },
    { number: "03", title: "Analyze & Improve", description: "Review analytics, heatmaps, and completion rates. Adjust your plan and keep improving every day." }
  ]
  
  return (
    <section id="how-it-works" ref={ref} className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      
      <motion.div 
        className="mb-10 sm:mb-16 text-center px-2"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <span className="inline-block mb-3 sm:mb-4 text-sm text-accent-cyan font-medium">HOW IT WORKS</span>
        <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary">Get Started in 3 Simple Steps</h2>
        <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto">No complicated setup. Start tracking your goals in under 2 minutes.</p>
      </motion.div>
      
      <div className="grid gap-10 sm:gap-8 md:gap-12 grid-cols-1 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.15, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <StepCard {...step} index={index} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function StepCard({ number, title, description, index }: { number: string; title: string; description: string; index: number }) {
  return (
    <motion.div 
      className="relative text-center"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {index < 2 && (
        <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5">
          <motion.div 
            className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
          />
        </div>
      )}
      
      <motion.div 
        className="relative mb-4 sm:mb-6 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan text-2xl sm:text-3xl font-bold text-white shadow-xl shadow-accent-purple/20"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {number}
        <motion.span 
          className="absolute inset-0 rounded-full bg-accent-purple"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </motion.div>
      
      <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-text-primary">{title}</h3>
      <p className="text-sm sm:text-base text-text-secondary max-w-xs mx-auto">{description}</p>
    </motion.div>
  )
}

function StatsSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "500K+", label: "Study Hours Logged" },
    { value: "85%", label: "Goal Completion Rate" },
    { value: "4.9", label: "User Rating" }
  ]
  
  return (
    <section ref={ref} className="stats-section container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
      <motion.div 
        className="rounded-2xl sm:rounded-3xl border border-border bg-gradient-to-br from-bg-surface to-bg-elevated p-6 sm:p-8 md:p-12"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <div className="grid gap-6 sm:gap-8 grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="stat-item text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
            >
              <motion.div 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {stat.value}
              </motion.div>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-text-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  const testimonials = [
    { quote: "TrackZen's AI planner saved me hours of planning. I went from overwhelmed to organized in minutes.", author: "Sarah M.", role: "Medical Student", avatar: "SM" },
    { quote: "The streak system is addictive in the best way. I haven't missed a study day in 45 days!", author: "James K.", role: "Software Engineer", avatar: "JK" },
    { quote: "Finally, an app that combines everything. Habits, study plans, and beautiful analytics in one place.", author: "Emily R.", role: "MBA Candidate", avatar: "ER" }
  ]
  
  return (
    <section id="testimonials" ref={ref} className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <motion.div 
        className="mb-10 sm:mb-16 text-center px-2"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <span className="inline-block mb-3 sm:mb-4 text-sm text-accent-green font-medium">TESTIMONIALS</span>
        <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary">Loved by Thousands</h2>
        <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto">See what our users have to say about their experience</p>
      </motion.div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.author}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.15, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <TestimonialCard {...testimonial} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function TestimonialCard({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) {
  return (
    <motion.div 
      className="group relative rounded-xl sm:rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-sm p-4 sm:p-6 h-full"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-4xl sm:text-6xl text-accent-purple/10 font-serif">"</div>
      <p className="relative text-sm sm:text-base text-text-secondary mb-4 sm:mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <motion.div 
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-sm sm:text-base font-semibold"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {avatar}
        </motion.div>
        <div>
          <div className="font-semibold text-sm sm:text-base text-text-primary">{author}</div>
          <div className="text-xs sm:text-sm text-text-secondary">{role}</div>
        </div>
      </div>
    </motion.div>
  )
}

function CTASection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <section id="cta" ref={ref} className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
      <motion.div 
        className="relative rounded-2xl sm:rounded-3xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 via-bg-surface to-accent-cyan/10 p-6 sm:p-10 md:p-12 lg:p-16 text-center overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <motion.div 
          className="absolute top-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-accent-purple/20 rounded-full blur-3xl"
          animate={shouldReduceMotion ? {} : { x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-accent-cyan/20 rounded-full blur-3xl"
          animate={shouldReduceMotion ? {} : { x: [0, -30, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary">Ready to Transform Your Productivity?</h2>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto px-2">
            Join thousands of students and professionals using TrackZen to achieve their goals faster
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-block"
          >
            <AnimatedButton href="/login" size="lg" className="shadow-xl shadow-accent-purple/30">
              Get Started for Free
              <motion.span
                animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
