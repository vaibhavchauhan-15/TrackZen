'use client'

import { lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardSkeleton } from '@/components/ui/loading-spinner'
import { TrendingUp, Calendar, Target, Flame } from 'lucide-react'

// Lazy load charts if you add them later
// const Charts = lazy(() => import('@/components/analytics/charts'))

export default function AnalyticsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
          Track your progress and gain insights into your productivity
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="study" className="text-xs sm:text-sm">
            <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span>Study</span>
          </TabsTrigger>
          <TabsTrigger value="habits" className="text-xs sm:text-sm">
            <Target className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span>Habits</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="transition-transform hover:-translate-y-1 duration-200">
              <CardHeader className="p-4 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Total Study Hours</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl">127h</CardTitle>
              </CardHeader>
            </Card>
            <Card className="transition-transform hover:-translate-y-1 duration-200">
              <CardHeader className="p-4 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Active Plans</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl">3</CardTitle>
              </CardHeader>
            </Card>
            <Card className="transition-transform hover:-translate-y-1 duration-200">
              <CardHeader className="p-4 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Habits Completed</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl">89%</CardTitle>
              </CardHeader>
            </Card>
            <Card className="transition-transform hover:-translate-y-1 duration-200">
              <CardHeader className="p-4 sm:p-6">
                <CardDescription className="text-xs sm:text-sm">Current Streak</CardDescription>
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-accent-orange" />
                  <span className="text-2xl sm:text-3xl font-bold">15</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Weekly Progress</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your study hours over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const height = Math.random() * 100
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-accent-purple rounded-t-lg transition-all hover:bg-accent-purple/80 animate-in slide-in-from-bottom duration-500" 
                        style={{ 
                          height: `${height}%`,
                          animationDelay: `${i * 50}ms`
                        }} 
                      />
                      <span className="text-xs text-text-secondary">{day}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Study Analytics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Detailed insights into your study patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-text-secondary">Study analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Habit Analytics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Track your habit completion and streaks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-text-secondary">Habit analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
