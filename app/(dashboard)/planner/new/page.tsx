'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Calendar, Plus, Trash2 } from 'lucide-react'

export default function NewPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [planData, setPlanData] = useState({
    title: '',
    type: 'exam',
    startDate: '',
    endDate: '',
    dailyHours: '',
    color: '#7C3AED',
  })
  const [topics, setTopics] = useState<any[]>([])

  const handleAIGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.topics) {
        setTopics(data.topics)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planData,
          topics,
          isAiGenerated: topics.length > 0,
        }),
      })
      const data = await res.json()
      if (data.plan) {
        router.push(`/planner/${data.plan.id}`)
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTopic = () => {
    setTopics([
      ...topics,
      {
        title: '',
        estimatedHours: 0,
        priority: 3,
        weightage: 0,
        subtopics: [],
      },
    ])
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Create New Plan</h1>
        <p className="mt-2 text-text-secondary">
          Use AI to generate a plan or create one manually
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Assisted
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Calendar className="mr-2 h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Study Plan Generator</CardTitle>
              <CardDescription>
                Describe your exam, course, or goal and let AI create a structured plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">What do you want to study?</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g., GATE CS 2026, Learn React in 2 months, IELTS preparation..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleAIGenerate} disabled={loading || !aiPrompt}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Smart Plan'}
              </Button>
            </CardContent>
          </Card>

          {topics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Topics</CardTitle>
                <CardDescription>Review and edit the AI-generated plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex-1">
                        <Input
                          value={topic.title}
                          onChange={(e) => {
                            const newTopics = [...topics]
                            newTopics[index].title = e.target.value
                            setTopics(newTopics)
                          }}
                          placeholder="Topic title"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={topic.estimatedHours}
                          onChange={(e) => {
                            const newTopics = [...topics]
                            newTopics[index].estimatedHours = parseFloat(e.target.value)
                            setTopics(newTopics)
                          }}
                          placeholder="Hours"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTopics(topics.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Plan Creation</CardTitle>
              <CardDescription>Create a plan from scratch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Plan Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., GATE 2026 Preparation"
                  value={planData.title}
                  onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="type">Plan Type</Label>
                <Select
                  value={planData.type}
                  onValueChange={(value) => setPlanData({ ...planData, type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={planData.startDate}
                    onChange={(e) => setPlanData({ ...planData, startDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={planData.endDate}
                    onChange={(e) => setPlanData({ ...planData, endDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <Button onClick={addTopic} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Topic
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="plan-title">Plan Title</Label>
            <Input
              id="plan-title"
              placeholder="Enter plan title"
              value={planData.title}
              onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
              className="mt-2"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="date"
                value={planData.startDate}
                onChange={(e) => setPlanData({ ...planData, startDate: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="end">End Date (Optional)</Label>
              <Input
                id="end"
                type="date"
                value={planData.endDate}
                onChange={(e) => setPlanData({ ...planData, endDate: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={loading || !planData.title}>
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
