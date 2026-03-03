'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion'
import { AnimatedButton } from '@/components/ui/animated-button'
import {
  ArrowRight,
  Brain,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Flame,
  Sparkles,
  CheckCircle,
  MousePointer
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.215, 0.61, 0.355, 1] }
  })
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.215, 0.61, 0.355, 1] }
  })
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-accent-purple/20 blur-[100px]"
          animate={shouldReduceMotion ? {} : { x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-accent-cyan/10 blur-[120px]"
          animate={shouldReduceMotion ? {} : { x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header – logo only */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 bg-bg-base/80 backdrop-blur-xl border-b border-border/40"
      >
        <Link href="/" className="flex items-center" aria-label="TrackZen home">
          <Image
            src="/TrackZenTrans_logo.png"
            alt="TrackZen"
            width={140}
            height={32}
            className="object-contain h-8 w-auto"
            priority
          />
        </Link>
      </motion.header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 lg:px-10 xl:px-16 pt-20 pb-16"
      >
        <motion.div
          style={shouldReduceMotion ? {} : { y: heroY, opacity: heroOpacity }}
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14 xl:gap-20"
        >
          {/* ── Left: text content ── */}
          <div className="flex-1 min-w-0 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-1.5 text-xs font-medium text-accent-purple">
                <motion.span
                  animate={shouldReduceMotion ? {} : { rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                AI-Powered Planning for High Achievers
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-[2.25rem] leading-[1.18] sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight text-text-primary"
            >
              Master Your Goals with{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-purple bg-[size:200%_auto] bg-clip-text text-transparent animate-gradient">
                  AI&nbsp;+&nbsp;Habits
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-accent-purple to-accent-cyan"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-lg"
            >
              The all-in-one platform combining AI study planning, habit tracking, and streak-based motivation — perfect for students, professionals, and lifelong learners.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start w-full sm:w-auto"
            >
              <motion.div whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <AnimatedButton href="/login" size="lg" className="w-full sm:w-auto shadow-lg shadow-accent-purple/25 min-h-[52px] text-base">
                  Start Free Today
                  <motion.span
                    animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </AnimatedButton>
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <AnimatedButton variant="secondary" size="lg" className="w-full sm:w-auto min-h-[52px] text-base">
                  <MousePointer className="h-4 w-4" />
                  Watch Demo
                </AnimatedButton>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-2 text-xs text-text-muted"
            >
              {['No credit card required', 'Free forever plan', '2-minute setup'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: looping demo video ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[440px] xl:max-w-[480px] flex-shrink-0"
          >
            {/* Glow halo */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent-purple/20 via-accent-cyan/10 to-transparent blur-2xl pointer-events-none" />
              {/* Fixed aspect-ratio crop window */}
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60 bg-bg-surface/40 aspect-[1/1]">
                <video
                  src="/gif/Landing_page.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  style={{ transform: 'scale(1.3)', transformOrigin: 'center center' }}
                  aria-label="TrackZen app demo"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          aria-hidden
        >
          <motion.div
            className="w-6 h-9 rounded-full border-2 border-text-muted/25 flex items-start justify-center pt-1.5"
            animate={shouldReduceMotion ? {} : { y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 bg-accent-purple rounded-full"
              animate={shouldReduceMotion ? {} : { y: [0, 8, 0], opacity: [1, 0, 1] }}
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

      <footer className="border-t border-border bg-bg-surface/60 py-10">
        <div className="flex flex-col items-center gap-3 px-5 text-center">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent-purple" />
            <span className="text-lg font-bold text-text-primary">TrackZen</span>
          </div>
          <p className="text-text-muted text-xs">&copy; 2026 TrackZen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function SectionLabel({ color, children }: { color: string; children: string }) {
  return (
    <span className={`inline-block mb-3 text-xs font-semibold uppercase tracking-widest ${color}`}>
      {children}
    </span>
  )
}

const features = [
  { icon: <Brain className="h-6 w-6" />, title: 'AI Study Planner', description: 'Enter your exam name or upload a syllabus. Our AI generates a personalized study plan with topics, hours, and schedules.', gradient: 'from-accent-purple to-accent-purple/50' },
  { icon: <Calendar className="h-6 w-6" />, title: 'Smart Scheduling', description: 'Date-bounded or open-ended plans. Automatically distributes topics across your available time. Reschedule when life happens.', gradient: 'from-accent-cyan to-accent-cyan/50' },
  { icon: <Target className="h-6 w-6" />, title: 'Habit Tracking', description: 'Build consistent daily routines. Track habits with daily, weekly, or monthly frequencies. Visual heatmaps and dot grids.', gradient: 'from-accent-green to-accent-green/50' },
  { icon: <Flame className="h-6 w-6" />, title: 'Streak System', description: 'Gamified streaks with color evolution. From red to orange to gold to purple to fire. Miss a day? Get back on track instantly.', gradient: 'from-accent-orange to-accent-orange/50' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'Rich Analytics', description: 'Hours studied vs planned. Completion rates. Heatmaps. Habit scores. Pace analysis. Everything visualized beautifully.', gradient: 'from-accent-purple to-accent-cyan' },
  { icon: <Zap className="h-6 w-6" />, title: 'Smooth Animations', description: 'Tasteful GSAP and Framer Motion animations. Progress rings, streak badges, and transitions that feel amazing.', gradient: 'from-streak-gold to-accent-orange' }
]

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" ref={ref} className="px-5 py-20 sm:py-24 max-w-screen-lg mx-auto">
      <motion.div className="mb-12 text-center" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}>
        <SectionLabel color="text-accent-purple">Features</SectionLabel>
        <h2 className="text-2xl sm:text-4xl font-bold text-text-primary mb-3">Everything You Need to Succeed</h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
          Powerful tools designed to keep you on track and help you hit goals faster.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div key={f.title} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp} custom={i}>
            <FeatureCard {...f} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <motion.div
      className="group relative rounded-2xl border border-border bg-bg-surface/40 backdrop-blur-sm p-5 h-full overflow-hidden"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl`} />
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} origin-left`}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
      <div className={`relative mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-2.5 text-white shadow-lg`}>
        {icon}
      </div>
      <h3 className="relative mb-2 text-base font-semibold text-text-primary">{title}</h3>
      <p className="relative text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  )
}

const steps = [
  { number: '01', title: 'Create Your Plan', description: 'Use AI to generate a study plan from exam name or syllabus, or create one manually. Set your date or daily hours goal.' },
  { number: '02', title: 'Track Progress Daily', description: 'Log study hours and complete habits each day. Watch your streaks grow and your progress bars fill up.' },
  { number: '03', title: 'Analyze & Improve', description: 'Review analytics, heatmaps, and completion rates. Adjust your plan and keep improving every day.' }
]

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" ref={ref} className="px-5 py-20 sm:py-24 max-w-screen-lg mx-auto">
      <motion.div className="mb-12 text-center" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}>
        <SectionLabel color="text-accent-cyan">How It Works</SectionLabel>
        <h2 className="text-2xl sm:text-4xl font-bold text-text-primary mb-3">Get Started in 3 Simple Steps</h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
          No complicated setup. Start tracking your goals in under 2 minutes.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
        {steps.map((step, i) => (
          <motion.div key={step.number} className="relative text-center" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp} custom={i + 1}>
            {i < 2 && (
              <div className="hidden sm:block absolute top-9 left-[55%] w-full h-px overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan"
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  style={{ originX: 0 }}
                  transition={{ delay: 0.6 + i * 0.2, duration: 0.8 }}
                />
              </div>
            )}
            <motion.div
              className="relative mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan text-2xl font-bold text-white shadow-xl shadow-accent-purple/20"
              whileHover={{ scale: 1.08, rotate: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {step.number}
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-accent-purple"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.55 }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }}
              />
            </motion.div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">{step.title}</h3>
            <p className="text-sm text-text-secondary max-w-[240px] mx-auto leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '500K+', label: 'Study Hours Logged' },
  { value: '85%', label: 'Goal Completion Rate' },
  { value: '4.9★', label: 'User Rating' }
]

function StatsSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="px-5 py-12 sm:py-16 max-w-screen-lg mx-auto">
      <motion.div
        className="rounded-2xl border border-border bg-gradient-to-br from-bg-surface to-bg-elevated p-7 sm:p-10"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={scaleIn}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="text-center" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={scaleIn} custom={i}>
              <motion.div
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent"
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {s.value}
              </motion.div>
              <div className="mt-1.5 text-xs sm:text-sm text-text-secondary">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

const testimonials = [
  { quote: "TrackZen's AI planner saved me hours of planning. I went from overwhelmed to organized in minutes.", author: 'Sarah M.', role: 'Medical Student', avatar: 'SM' },
  { quote: "The streak system is addictive in the best way. I haven't missed a study day in 45 days!", author: 'James K.', role: 'Software Engineer', avatar: 'JK' },
  { quote: 'Finally, an app that combines everything. Habits, study plans, and beautiful analytics in one place.', author: 'Emily R.', role: 'MBA Candidate', avatar: 'ER' }
]

function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="testimonials" ref={ref} className="px-5 py-20 sm:py-24 max-w-screen-lg mx-auto">
      <motion.div className="mb-12 text-center" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}>
        <SectionLabel color="text-accent-green">Testimonials</SectionLabel>
        <h2 className="text-2xl sm:text-4xl font-bold text-text-primary mb-3">Loved by Thousands</h2>
        <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
          See what our users have to say about their experience.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div key={t.author} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp} custom={i}>
            <TestimonialCard {...t} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function TestimonialCard({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) {
  return (
    <motion.div
      className="group relative rounded-2xl border border-border bg-bg-surface/40 backdrop-blur-sm p-5 h-full"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className="absolute top-4 right-4 text-5xl leading-none text-accent-purple/10 font-serif select-none" aria-hidden>&ldquo;</div>
      <p className="relative text-sm text-text-secondary mb-5 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <motion.div
          className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-sm font-semibold"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {avatar}
        </motion.div>
        <div>
          <div className="text-sm font-semibold text-text-primary">{author}</div>
          <div className="text-xs text-text-muted">{role}</div>
        </div>
      </div>
    </motion.div>
  )
}

function CTASection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="cta" ref={ref} className="px-5 py-12 sm:py-16 max-w-screen-lg mx-auto">
      <motion.div
        className="relative rounded-2xl border border-accent-purple/25 bg-gradient-to-br from-accent-purple/10 via-bg-surface to-accent-cyan/10 p-8 sm:p-14 text-center overflow-hidden"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={scaleIn}
      >
        <motion.div
          className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-accent-purple/20 blur-3xl pointer-events-none"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-accent-cyan/20 blur-3xl pointer-events-none"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="relative">
          <SectionLabel color="text-accent-purple">Get Started</SectionLabel>
          <h2 className="text-2xl sm:text-4xl font-bold text-text-primary mb-3">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-8 max-w-md mx-auto">
            Join thousands of students and professionals using TrackZen to achieve their goals faster.
          </p>
          <motion.div whileTap={{ scale: 0.96 }} className="inline-block w-full sm:w-auto">
            <AnimatedButton href="/login" size="lg" className="w-full sm:w-auto shadow-xl shadow-accent-purple/30 min-h-[52px] text-base">
              Get Started for Free
              <motion.span
                animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </AnimatedButton>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
