import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Brain, Calendar, TrendingUp, Zap, Target, Flame } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-base to-bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-bg-base/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/TrackZenTrans_logo.png" 
              alt="TrackZen Logo" 
              width={160} 
              height={36}
              className="object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-text-secondary hover:text-text-primary transition-colors">
              How It Works
            </a>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </nav>
          <Link href="/login" className="md:hidden">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-2 text-sm text-accent-purple">
            <Zap className="h-4 w-4" />
            <span>AI-Powered Planning</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-text-primary md:text-6xl lg:text-7xl">
            Master Your Goals with
            <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
              {' '}AI + Habits
            </span>
          </h1>
          <p className="mb-10 text-xl text-text-secondary md:text-2xl">
            The all-in-one platform combining AI study planning, habit tracking, and streak-based motivation. Perfect for students, professionals, and lifelong learners.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-text-primary">Everything You Need to Succeed</h2>
          <p className="text-lg text-text-secondary">Powerful features designed to keep you on track</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="AI Study Planner"
            description="Enter your exam name or upload a syllabus. Our AI generates a personalized study plan with topics, hours, and schedules."
            color="accent-purple"
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8" />}
            title="Smart Scheduling"
            description="Date-bounded or open-ended plans. Automatically distributes topics across your available time. Reschedule when life happens."
            color="accent-cyan"
          />
          <FeatureCard
            icon={<Target className="h-8 w-8" />}
            title="Habit Tracking"
            description="Build consistent daily routines. Track habits with daily/weekly/monthly frequencies. Visual heatmaps and dot grids."
            color="accent-green"
          />
          <FeatureCard
            icon={<Flame className="h-8 w-8" />}
            title="Streak System"
            description="Gamified streaks with color evolution. From red → orange → gold → purple → fire. Miss a day? Get back on track instantly."
            color="accent-orange"
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Rich Analytics"
            description="Hours studied vs planned. Completion rates. Heatmaps. Habit scores. Pace analysis. Everything visualized beautifully."
            color="accent-purple"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Smooth Animations"
            description="Tasteful GSAP and Framer Motion animations. Progress rings, streak badges, and transitions that feel amazing."
            color="streak-gold"
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-text-primary">How TrackZen Works</h2>
          <p className="text-lg text-text-secondary">Get started in three simple steps</p>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          <StepCard
            number="01"
            title="Create Your Plan"
            description="Use AI to generate a study plan from exam name or syllabus, or create one manually. Set your date or daily hours goal."
          />
          <StepCard
            number="02"
            title="Track Progress Daily"
            description="Log study hours and complete habits each day. Watch your streaks grow and your progress bars fill up."
          />
          <StepCard
            number="03"
            title="Analyze & Improve"
            description="Review analytics, heatmaps, and completion rates. Adjust your plan and keep improving every day."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 p-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-text-primary">Ready to Transform Your Productivity?</h2>
          <p className="mb-8 text-lg text-text-secondary">
            Join students and professionals using TrackZen to achieve their goals
          </p>
          <Link href="/login">
            <Button size="lg">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-surface py-12">
        <div className="container mx-auto px-4 text-center text-text-secondary">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Flame className="h-6 w-6 text-accent-purple" />
            <span className="text-xl font-bold text-text-primary">TrackZen</span>
          </div>
          <p>&copy; 2026 TrackZen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="group rounded-xl border border-border bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent-purple/50 hover:shadow-lg">
      <div className={`mb-4 inline-flex rounded-lg bg-${color}/10 p-3 text-${color}`}>{icon}</div>
      <h3 className="mb-3 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan text-3xl font-bold text-white">
        {number}
      </div>
      <h3 className="mb-3 text-2xl font-semibold text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}
