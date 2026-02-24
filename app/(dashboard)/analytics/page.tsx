'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Calendar, Target, Flame } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="mt-2 text-text-secondary">
          Track your progress and gain insights into your productivity
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="study">
            <Calendar className="mr-2 h-4 w-4" />
            Study
          </TabsTrigger>
          <TabsTrigger value="habits">
            <Target className="mr-2 h-4 w-4" />
            Habits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Total Study Hours</CardDescription>
                <CardTitle className="text-3xl">127h</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Active Plans</CardDescription>
                <CardTitle className="text-3xl">3</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Habits Completed</CardDescription>
                <CardTitle className="text-3xl">89%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Current Streak</CardDescription>
                <div className="flex items-center gap-2">
                  <Flame className="h-8 w-8 text-accent-orange" />
                  <span className="text-3xl font-bold">15</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <CardDescription>Your study hours over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const height = Math.random() * 100
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-accent-purple rounded-t-lg transition-all hover:bg-accent-purple/80" style={{ height: `${height}%` }} />
                      <span className="text-xs text-text-secondary">{day}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Analytics</CardTitle>
              <CardDescription>Detailed insights into your study patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">Study analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Habit Analytics</CardTitle>
              <CardDescription>Track your habit completion and streaks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">Habit analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
